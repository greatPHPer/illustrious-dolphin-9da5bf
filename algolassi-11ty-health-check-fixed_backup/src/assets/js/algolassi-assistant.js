/*
 * Algolassi Assistant - Phases 1-3
 *
 * Privacy:
 * - Never reads browser history.
 * - Phase 1/2 behavior stays in localStorage.
 * - Phase 3 asks for location only when the visitor has not opted out.
 * - Location is sent only to the configured news endpoint, if one exists.
 * - If no endpoint is configured, the assistant uses a public RSS-to-JSON
 *   service with country-specific Google News RSS feeds and sends no location.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "algolassi_assistant_v1";
  var TOAST_MS = 12000;
  var SLEEP_MS = 10 * 60 * 1000;
  var NEWS_COOLDOWN_MS = 6 * 60 * 60 * 1000;
  var state = loadState();
  var toastTimer = null;

  var COUNTRY_CONFIG = {
    IN: { name: "India", flag: "🇮🇳", hl: "en-IN", gl: "IN", ceid: "IN:en", language: "English" },
    US: { name: "United States", flag: "🇺🇸", hl: "en-US", gl: "US", ceid: "US:en", language: "English" },
    GB: { name: "United Kingdom", flag: "🇬🇧", hl: "en-GB", gl: "GB", ceid: "GB:en", language: "English" },
    CA: { name: "Canada", flag: "🇨🇦", hl: "en-CA", gl: "CA", ceid: "CA:en", language: "English" },
    AU: { name: "Australia", flag: "🇦🇺", hl: "en-AU", gl: "AU", ceid: "AU:en", language: "English" },
    DE: { name: "Germany", flag: "🇩🇪", hl: "de-DE", gl: "DE", ceid: "DE:de", language: "German" },
    FR: { name: "France", flag: "🇫🇷", hl: "fr-FR", gl: "FR", ceid: "FR:fr", language: "French" },
    ES: { name: "Spain", flag: "🇪🇸", hl: "es-ES", gl: "ES", ceid: "ES:es", language: "Spanish" },
    IT: { name: "Italy", flag: "🇮🇹", hl: "it-IT", gl: "IT", ceid: "IT:it", language: "Italian" },
    BR: { name: "Brazil", flag: "🇧🇷", hl: "pt-BR", gl: "BR", ceid: "BR:pt-419", language: "Portuguese" },
    JP: { name: "Japan", flag: "🇯🇵", hl: "ja-JP", gl: "JP", ceid: "JP:ja", language: "Japanese" },
    KR: { name: "South Korea", flag: "🇰🇷", hl: "ko-KR", gl: "KR", ceid: "KR:ko", language: "Korean" },
    SG: { name: "Singapore", flag: "🇸🇬", hl: "en-SG", gl: "SG", ceid: "SG:en", language: "English" },
    AE: { name: "United Arab Emirates", flag: "🇦🇪", hl: "en-AE", gl: "AE", ceid: "AE:en", language: "English" },
    IN_TA: { name: "India", flag: "🇮🇳", hl: "ta-IN", gl: "IN", ceid: "IN:ta", language: "Tamil" }
  };

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return Object.assign({
        hideCount: 0,
        shutUpCount: 0,
        sleepingUntil: 0,
        sites: {},
        categories: {},
        copyNotices: 0,
        locationAsked: false,
        locationDenied: false,
        newsShownAt: 0,
        detectedCountry: "",
        detectedLanguage: ""
      }, parsed);
    } catch (e) {
      return { hideCount: 0, shutUpCount: 0, sleepingUntil: 0, sites: {}, categories: {}, copyNotices: 0, locationAsked: false, locationDenied: false, newsShownAt: 0, detectedCountry: "", detectedLanguage: "" };
    }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function isSleeping() {
    return Number(state.sleepingUntil || 0) > Date.now();
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function ensureToastHost() {
    var host = document.getElementById("algolassi-assistant-host");
    if (host) return host;
    host = document.createElement("div");
    host.id = "algolassi-assistant-host";
    host.setAttribute("aria-live", "polite");
    host.setAttribute("aria-atomic", "true");
    document.body.appendChild(host);
    return host;
  }

  function showToast(message, options) {
    options = options || {};
    if (isSleeping() && !options.force) return;

    var host = ensureToastHost();
    clearTimeout(toastTimer);
    host.innerHTML = "";

    var toast = document.createElement("section");
    toast.className = "algolassi-assistant-toast" + (options.news ? " algolassi-assistant-news" : "");
    var title = options.title || "Algolassi Assistant";
    var html = '<div class="algolassi-assistant-head"><span class="algolassi-assistant-avatar">🤖</span><strong>' + escapeHtml(title) + '</strong></div>';
    html += '<div class="algolassi-assistant-body">' + message + '</div>';

    if (options.actions && options.actions.length) {
      html += '<div class="algolassi-assistant-actions">';
      options.actions.forEach(function (action, index) {
        html += '<button type="button" class="algolassi-assistant-action" data-assistant-action="' + index + '">' + escapeHtml(action.label) + '</button>';
      });
      html += '</div>';
    }

    toast.innerHTML = html;
    host.appendChild(toast);

    if (options.actions) {
      options.actions.forEach(function (action, index) {
        var button = toast.querySelector('[data-assistant-action="' + index + '"]');
        if (button) button.addEventListener("click", function () { action.onClick(); });
      });
    }

    toastTimer = setTimeout(function () {
      toast.classList.add("algolassi-assistant-toast-hide");
      setTimeout(function () { if (host.contains(toast)) host.removeChild(toast); }, 350);
    }, options.duration || TOAST_MS);
  }

  function hideAssistant() {
    var host = document.getElementById("algolassi-assistant-host");
    if (host) host.innerHTML = "";
  }

  function handleHide() {
    state.hideCount = Number(state.hideCount || 0) + 1;
    saveState();
    if (state.hideCount === 1) showToast("Hiding..", { duration: 5000 });
    else if (state.hideCount === 2) showToast("2nd time? noted!", { duration: 5000 });
    else {
      showToast("3rd time noted!<br>I'll stay quiet now. 😶", { duration: 5000 });
      setTimeout(hideAssistant, 1200);
    }
  }

  function handleShutUp() {
    state.shutUpCount = Number(state.shutUpCount || 0) + 1;
    saveState();
    if (state.shutUpCount >= 3) {
      state.sleepingUntil = Date.now() + SLEEP_MS;
      saveState();
      showToast("😴 Sleep mode for 10 minutes.<br><small>I promise not to toast you.</small>", {
        force: true, duration: 15000,
        actions: [{ label: "Awaken Assistant", onClick: function () {
          state.sleepingUntil = 0; state.shutUpCount = 0; saveState();
          showToast("I'm awake again. 👋", { force: true });
        }}]
      });
      return;
    }
    showToast(state.shutUpCount === 1 ? "Okay... I'll be quieter. 😶" : "Again? Fine. 😐", {
      actions: [{ label: "Shut up", onClick: handleShutUp }]
    });
  }

  function handleCopy() {
    if (isSleeping()) return;
    var selection = window.getSelection ? window.getSelection() : null;
    if (!selection || !selection.rangeCount) return;
    var node = selection.anchorNode;
    var element = node && node.nodeType === 3 ? node.parentElement : node;
    if (!element) return;
    if (element.closest && element.closest("pre, code")) return;
    var text = String(selection.toString() || "").trim();
    if (!text || text.length < 20) return;
    state.copyNotices = Number(state.copyNotices || 0) + 1;
    saveState();
    showToast("Noted. Copying content?", { actions: [{ label: "Shut up", onClick: handleShutUp }] });
  }

  function siteKeyFromUrl(url) {
    try {
      var host = new URL(url, location.href).hostname.toLowerCase();
      if (host.indexOf("reddit.com") !== -1) return "reddit";
      if (host.indexOf("geeksforgeeks.org") !== -1) return "geeksforgeeks";
      if (host.indexOf("github.com") !== -1) return "github";
      if (host.indexOf("stackoverflow.com") !== -1) return "stackoverflow";
      if (host.indexOf("learn.microsoft.com") !== -1) return "microsoft-learn";
      if (host.indexOf("youtube.com") !== -1 || host.indexOf("youtu.be") !== -1) return "youtube";
      if (host.indexOf("medium.com") !== -1) return "medium";
    } catch (e) {}
    return null;
  }

  function recordExternalSite(site) {
    if (!site) return;
    state.sites[site] = Number(state.sites[site] || 0) + 1;
    saveState();
    if (site === "reddit" && state.sites[site] === 3) {
      showToast("Reddit again? 👀<br><br>Want to sign in?", { actions: [{ label: "Open Reddit login", onClick: function () { window.open("https://www.reddit.com/login/", "_blank", "noopener,noreferrer"); }}] });
    }
    if (site === "geeksforgeeks" && state.sites[site] === 3) {
      showToast("GeeksforGeeks again? 👀<br><br>Want to sign in?", { actions: [{ label: "Open GeeksforGeeks", onClick: function () { window.open("https://auth.geeksforgeeks.org/", "_blank", "noopener,noreferrer"); }}] });
    }
  }

  function detectCategory() {
    var text = ((document.title || "") + " " + (document.querySelector("h1") || {}).textContent + " " + location.pathname).toLowerCase();
    var rules = {
      "C#": /\bc#\b|csharp|c-sharp/,
      ".NET": /\.net|dotnet|asp\.net/,
      "ASP.NET Core": /asp[- ]?net[- ]?core/,
      "Blazor": /blazor/,
      "SQL Server": /sql[- ]?server|mssql|t-sql|transact[- ]?sql/,
      "Visual Studio": /visual[- ]?studio/,
      "Angular": /angular/,
      "MAUI": /\.net maui|maui/,
      "JavaScript": /javascript|js tutorial/,
      "TypeScript": /typescript/,
      "Git": /git|github/
    };
    var found = [];
    Object.keys(rules).forEach(function (name) {
      if (rules[name].test(text)) found.push(name);
    });
    found.forEach(function (name) { state.categories[name] = Number(state.categories[name] || 0) + 1; });
    saveState();
    return found;
  }

  function maybeCategoryToast(categories) {
    if (!categories.length || isSleeping()) return;
    var now = Date.now();
    if (Number(state.categoryToastAt || 0) + 24 * 60 * 60 * 1000 > now) return;
    var best = categories.slice().sort(function (a, b) { return (state.categories[b] || 0) - (state.categories[a] || 0); })[0];
    if ((state.categories[best] || 0) < 3) return;
    state.categoryToastAt = now;
    saveState();
    var urls = { "C#": "/csharp-tutorials/", ".NET": "/net-tutorials/", "ASP.NET Core": "/asp-net-core-tutorials/", "Blazor": "/blazor-tutorials/", "SQL Server": "/sql-server-tutorials/", "Visual Studio": "/visual-studio-tutorials/" };
    showToast("You've been spending some time with <strong>" + escapeHtml(best) + "</strong>. 👀", {
      actions: urls[best] ? [{ label: "Open " + best + " tutorials", onClick: function () { location.href = urls[best]; } }] : undefined
    });
  }

  function setupInteractions() {
    document.addEventListener("click", function (event) {
      var target = event.target.closest ? event.target.closest("a") : null;
      if (!target) return;
      var site = siteKeyFromUrl(target.href);
      if (site) recordExternalSite(site);
    });
    document.addEventListener("copy", handleCopy);
  }

  function localeCountry() {
    var locale = navigator.language || "en-IN";
    var parts = locale.split("-");
    var country = (parts[1] || "").toUpperCase();
    if (COUNTRY_CONFIG[country]) return country;
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (/kolkata|calcutta/i.test(tz)) return "IN";
      if (/tokyo/i.test(tz)) return "JP";
      if (/berlin/i.test(tz)) return "DE";
      if (/paris/i.test(tz)) return "FR";
      if (/london/i.test(tz)) return "GB";
      if (/new_york|los_angeles|chicago/i.test(tz)) return "US";
    } catch (e) {}
    return "US";
  }

  function detectCountryAndMaybeNews() {
    if (isSleeping()) return;
    var country = localeCountry();
    var locale = navigator.language || "en-US";
    var config = COUNTRY_CONFIG[country] || COUNTRY_CONFIG.US;
    state.detectedCountry = country;
    state.detectedLanguage = locale;
    saveState();

    if (state.newsShownAt && Date.now() - Number(state.newsShownAt) < NEWS_COOLDOWN_MS) return;
    state.newsShownAt = Date.now();
    saveState();

    var endpoint = window.ALGOLASSI_ASSISTANT_NEWS_ENDPOINT;
    if (endpoint) {
      requestNewsEndpoint(endpoint, country, config);
    } else {
      requestPublicNews(config);
    }
  }

  function requestNewsEndpoint(endpoint, country, config) {
    var url = endpoint + (endpoint.indexOf("?") === -1 ? "?" : "&") + "country=" + encodeURIComponent(country) + "&language=" + encodeURIComponent(config.language);
    fetch(url, { credentials: "omit" })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (news) { if (news && news.title) renderNews(news, config); })
      .catch(function () {});
  }

  function requestPublicNews(config) {
    var rss = "https://news.google.com/rss?hl=" + encodeURIComponent(config.hl) + "&gl=" + encodeURIComponent(config.gl) + "&ceid=" + encodeURIComponent(config.ceid);
    var proxy = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(rss);
    fetch(proxy, { credentials: "omit" })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (data) {
        if (!data || !data.items || !data.items.length) return;
        var item = data.items[0];
        renderNews({ title: item.title, url: item.link, image: item.thumbnail || "", summary: stripHtml(item.description || "") }, config);
      })
      .catch(function () {});
  }

  function stripHtml(value) {
    var div = document.createElement("div");
    div.innerHTML = value;
    return (div.textContent || div.innerText || "").trim().slice(0, 180);
  }

  function renderNews(news, config) {
    var image = news.image ? '<img class="algolassi-assistant-news-image" src="' + escapeHtml(news.image) + '" alt="">' : "";
    var link = news.url ? '<a class="algolassi-assistant-news-link" href="' + escapeHtml(news.url) + '" target="_blank" rel="noopener noreferrer">Read trending news →</a>' : "";
    showToast(image + '<div class="algolassi-assistant-news-country">' + escapeHtml(config.flag + " Trending in " + config.name) + '</div><strong>' + escapeHtml(news.title) + '</strong>' + (news.summary ? '<p>' + escapeHtml(news.summary) + '</p>' : "") + link, { news: true, duration: 15000 });
  }

  function firstVisitToast() {
    if (isSleeping()) return;
    if (state.hideCount || state.copyNotices || Object.keys(state.sites).length) return;
    showToast("Hi! I'm the Algolassi Assistant. 👋", { actions: [{ label: "Hide", onClick: handleHide }] });
  }

  function init() {
    setupInteractions();
    var categories = detectCategory();
    window.AlgolassiAssistant = {
      toast: showToast,
      hide: hideAssistant,
      state: state,
      handleHide: handleHide,
      handleShutUp: handleShutUp,
      detectCountry: detectCountryAndMaybeNews,
      resetMemory: function () {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        state = loadState();
      },
      awaken: function () {
        state.sleepingUntil = 0; state.shutUpCount = 0; saveState();
        showToast("I'm awake again. 👋", { force: true });
      }
    };
    setTimeout(firstVisitToast, 2500);
    setTimeout(function () { maybeCategoryToast(categories); }, 7000);
    setTimeout(detectCountryAndMaybeNews, 12000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
