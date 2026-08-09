/*
 * Algolassi Assistant
 * Client-side assistant for the static Eleventy site.
 *
 * Privacy note: this script does NOT read browser history. Browsers do not
 * expose another site's browsing history to a normal website. It only stores
 * lightweight interaction counts for links the visitor clicks on Algolassi.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "algolassi_assistant_v1";
  var TOAST_MS = 12000;
  var SLEEP_MS = 10 * 60 * 1000;
  var state = loadState();
  var toastTimer = null;
  var newsTimer = null;

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return Object.assign({
        hideCount: 0,
        shutUpCount: 0,
        sleepingUntil: 0,
        sites: {},
        copyNotices: 0,
        locationAsked: false
      }, parsed);
    } catch (e) {
      return { hideCount: 0, shutUpCount: 0, sleepingUntil: 0, sites: {}, copyNotices: 0, locationAsked: false };
    }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function isSleeping() {
    return Number(state.sleepingUntil || 0) > Date.now();
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

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showToast(message, options) {
    options = options || {};
    if (isSleeping() && !options.force) return;

    var host = ensureToastHost();
    clearTimeout(toastTimer);
    host.innerHTML = "";

    var toast = document.createElement("section");
    toast.className = "algolassi-assistant-toast";
    if (options.news) toast.classList.add("algolassi-assistant-news");

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

  function siteKeyFromUrl(url) {
    try {
      var host = new URL(url, location.href).hostname.toLowerCase();
      if (host.indexOf("reddit.com") !== -1) return "reddit";
      if (host.indexOf("geeksforgeeks.org") !== -1) return "geeksforgeeks";
      if (host.indexOf("github.com") !== -1) return "github";
      if (host.indexOf("stackoverflow.com") !== -1) return "stackoverflow";
    } catch (e) {}
    return null;
  }

  function recordExternalSite(site) {
    if (!site) return;
    state.sites[site] = Number(state.sites[site] || 0) + 1;
    saveState();

    if (site === "reddit" && state.sites[site] === 3) {
      showToast("Reddit again? 👀<br><br>Want to sign in?", {
        actions: [{ label: "Open Reddit login", onClick: function () {
          window.open("https://www.reddit.com/login/", "_blank", "noopener,noreferrer");
        }}]
      });
    }

    if (site === "geeksforgeeks" && state.sites[site] === 3) {
      showToast("GeeksforGeeks again? 👀<br><br>Want to sign in?", {
        actions: [{ label: "Open GeeksforGeeks", onClick: function () {
          window.open("https://auth.geeksforgeeks.org/", "_blank", "noopener,noreferrer");
        }}]
      });
    }
  }

  function handleHide() {
    state.hideCount = Number(state.hideCount || 0) + 1;
    saveState();

    if (state.hideCount === 1) {
      showToast("Hiding..", { duration: 5000 });
    } else if (state.hideCount === 2) {
      showToast("2nd time? noted!", { duration: 5000 });
    } else {
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
        force: true,
        duration: 15000,
        actions: [{ label: "Awaken Assistant", onClick: function () {
          state.sleepingUntil = 0;
          state.shutUpCount = 0;
          saveState();
          showToast("I'm awake again. 👋", { force: true });
        }}]
      });
      return;
    }

    showToast(state.shutUpCount === 1 ? "Okay... I'll be quieter. 😶" : "Again? Fine. 😐", {
      actions: [{ label: "Shut up", onClick: handleShutUp }]
    });
  }

  function handleCopy(event) {
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

    showToast("Noted. Copying content?", {
      actions: [{ label: "Shut up", onClick: handleShutUp }]
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

  function getCountryFromLocale() {
    var locale = navigator.language || "en-US";
    var parts = locale.split("-");
    return (parts[1] || "").toUpperCase();
  }

  function tryShowLocationNews() {
    if (isSleeping() || state.locationAsked) return;

    var endpoint = window.ALGOLASSI_ASSISTANT_NEWS_ENDPOINT;
    if (!endpoint || !navigator.geolocation) return;

    state.locationAsked = true;
    saveState();

    navigator.geolocation.getCurrentPosition(function (position) {
      var url = endpoint + (endpoint.indexOf("?") === -1 ? "?" : "&") +
        "lat=" + encodeURIComponent(position.coords.latitude) +
        "&lon=" + encodeURIComponent(position.coords.longitude) +
        "&country=" + encodeURIComponent(getCountryFromLocale());

      fetch(url, { credentials: "omit" })
        .then(function (response) { return response.ok ? response.json() : null; })
        .then(function (news) {
          if (!news || !news.title) return;
          var image = news.image ? '<img class="algolassi-assistant-news-image" src="' + escapeHtml(news.image) + '" alt="">' : "";
          var link = news.url ? '<a class="algolassi-assistant-news-link" href="' + escapeHtml(news.url) + '" target="_blank" rel="noopener noreferrer">Read trending news →</a>' : "";
          showToast(image + '<strong>' + escapeHtml(news.title) + '</strong>' + (news.summary ? '<p>' + escapeHtml(news.summary) + '</p>' : "") + link, { news: true, duration: 15000 });
        })
        .catch(function () {});
    }, function () {}, { maximumAge: 3600000, timeout: 8000 });
  }

  function firstVisitToast() {
    if (isSleeping()) return;
    if (state.hideCount || state.copyNotices || Object.keys(state.sites).length) return;
    showToast("Hi! I'm the Algolassi Assistant. 👋", {
      actions: [{ label: "Hide", onClick: handleHide }]
    });
  }

  function init() {
    setupInteractions();
    window.AlgolassiAssistant = {
      toast: showToast,
      hide: hideAssistant,
      awaken: function () {
        state.sleepingUntil = 0;
        state.shutUpCount = 0;
        saveState();
        showToast("I'm awake again. 👋", { force: true });
      },
      state: state
    };

    setTimeout(firstVisitToast, 2500);
    newsTimer = setTimeout(tryShowLocationNews, 12000);
    void newsTimer;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
