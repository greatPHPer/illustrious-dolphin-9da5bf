/*
 * Algolassi Assistant - country detection correction.
 *
 * Country priority:
 * 1. Existing explicit country already stored by the assistant.
 * 2. Browser timezone (strong local signal; e.g. Asia/Kolkata => India).
 * 3. IP country lookup as a fallback.
 * 4. Browser locale country as a last resort.
 *
 * Browser language is deliberately NOT treated as physical location.
 */
(function () {
  "use strict";

  var KEY = "algolassi_assistant_v1";
  var NEWS_COOLDOWN = 6 * 60 * 60 * 1000;
  var COUNTRY = {
    IN: { name: "India", flag: "🇮🇳", hl: "en-IN", gl: "IN", ceid: "IN:en" },
    US: { name: "United States", flag: "🇺🇸", hl: "en-US", gl: "US", ceid: "US:en" },
    GB: { name: "United Kingdom", flag: "🇬🇧", hl: "en-GB", gl: "GB", ceid: "GB:en" },
    CA: { name: "Canada", flag: "🇨🇦", hl: "en-CA", gl: "CA", ceid: "CA:en" },
    AU: { name: "Australia", flag: "🇦🇺", hl: "en-AU", gl: "AU", ceid: "AU:en" },
    DE: { name: "Germany", flag: "🇩🇪", hl: "de-DE", gl: "DE", ceid: "DE:de" },
    FR: { name: "France", flag: "🇫🇷", hl: "fr-FR", gl: "FR", ceid: "FR:fr" },
    ES: { name: "Spain", flag: "🇪🇸", hl: "es-ES", gl: "ES", ceid: "ES:es" },
    IT: { name: "Italy", flag: "🇮🇹", hl: "it-IT", gl: "IT", ceid: "IT:it" },
    BR: { name: "Brazil", flag: "🇧🇷", hl: "pt-BR", gl: "BR", ceid: "BR:pt-419" },
    JP: { name: "Japan", flag: "🇯🇵", hl: "ja-JP", gl: "JP", ceid: "JP:ja" },
    KR: { name: "South Korea", flag: "🇰🇷", hl: "ko-KR", gl: "KR", ceid: "KR:ko" },
    SG: { name: "Singapore", flag: "🇸🇬", hl: "en-SG", gl: "SG", ceid: "SG:en" },
    AE: { name: "United Arab Emirates", flag: "🇦🇪", hl: "en-AE", gl: "AE", ceid: "AE:en" }
  };

  function readState() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
    catch (e) { return {}; }
  }

  function writeState(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function timezoneCountry() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (/Asia\/(Kolkata|Calcutta)/i.test(tz)) return "IN";
      if (/Asia\/Tokyo/i.test(tz)) return "JP";
      if (/Asia\/Seoul/i.test(tz)) return "KR";
      if (/Europe\/Berlin/i.test(tz)) return "DE";
      if (/Europe\/Paris/i.test(tz)) return "FR";
      if (/Europe\/Madrid/i.test(tz)) return "ES";
      if (/Europe\/Rome/i.test(tz)) return "IT";
      if (/Europe\/London/i.test(tz)) return "GB";
      if (/America\/New_York|America\/Chicago|America\/Denver|America\/Los_Angeles/i.test(tz)) return "US";
      if (/Australia\//i.test(tz)) return "AU";
      if (/Asia\/Singapore/i.test(tz)) return "SG";
      if (/Asia\/Dubai/i.test(tz)) return "AE";
      if (/America\/Sao_Paulo/i.test(tz)) return "BR";
      if (/America\/Toronto/i.test(tz)) return "CA";
    } catch (e) {}
    return "";
  }

  function localeCountry() {
    var locale = navigator.language || "";
    var match = locale.match(/[-_]([A-Za-z]{2})(?:$|-)/);
    var code = match ? match[1].toUpperCase() : "";
    return COUNTRY[code] ? code : "";
  }

  function preferredLanguage(country) {
    var locale = (navigator.language || "").toLowerCase();
    if (country === "IN") {
      if (locale.indexOf("ta") === 0) return "Tamil";
      if (locale.indexOf("hi") === 0) return "Hindi";
      if (locale.indexOf("te") === 0) return "Telugu";
      if (locale.indexOf("ml") === 0) return "Malayalam";
      if (locale.indexOf("kn") === 0) return "Kannada";
      return "English";
    }
    return locale.split("-")[0] || "en";
  }

  function apply(country, source) {
    if (!country || !COUNTRY[country]) return false;
    var state = readState();
    state.detectedCountry = country;
    state.detectedCountrySource = source;
    state.detectedLanguage = preferredLanguage(country);

    // Prevent the old Phase 3 detector from showing a second (wrong-country)
    // news toast when it runs 12 seconds after page load.
    state.newsShownAt = Date.now();
    writeState(state);

    window.AlgolassiAssistantCountry = {
      code: country,
      name: COUNTRY[country].name,
      source: source,
      language: state.detectedLanguage
    };
    return true;
  }

  function escapeHtml(value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
  }

  function showCorrectNews(country) {
    var config = COUNTRY[country];
    if (!config) return;

    var rss = "https://news.google.com/rss?hl=" + encodeURIComponent(config.hl) +
      "&gl=" + encodeURIComponent(config.gl) + "&ceid=" + encodeURIComponent(config.ceid);
    var proxy = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(rss);

    fetch(proxy, { credentials: "omit" })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (data) {
        if (!data || !data.items || !data.items.length) return;
        var item = data.items[0];
        var image = item.thumbnail ? '<img class="algolassi-assistant-news-image" src="' + escapeHtml(item.thumbnail) + '" alt="">' : "";
        var link = item.link ? '<a class="algolassi-assistant-news-link" href="' + escapeHtml(item.link) + '" target="_blank" rel="noopener noreferrer">Read trending news →</a>' : "";
        var host = document.getElementById("algolassi-assistant-host");
        if (!host) return;
        host.innerHTML = '<section class="algolassi-assistant-toast algolassi-assistant-news">' +
          '<div class="algolassi-assistant-head"><span class="algolassi-assistant-avatar">📰</span><strong>' + config.flag + ' Trending in ' + config.name + '</strong></div>' +
          '<div class="algolassi-assistant-body">' + image + '<strong>' + escapeHtml(item.title) + '</strong>' + link + '</div></section>';
        setTimeout(function () { if (host.firstElementChild) host.firstElementChild.classList.add("algolassi-assistant-toast-hide"); }, 15000);
      })
      .catch(function () {});
  }

  function init() {
    var existing = readState();
    var tzCountry = timezoneCountry();
    var country = tzCountry || localeCountry();
    var source = tzCountry ? "timezone" : "browser-locale";

    if (country) {
      apply(country, source);
      setTimeout(function () { showCorrectNews(country); }, 10000);
      return;
    }

    // Only use IP geolocation if timezone and locale cannot identify a country.
    fetch("https://ipapi.co/json/", { credentials: "omit" })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (data) {
        var ipCountry = data && data.country_code ? String(data.country_code).toUpperCase() : "";
        if (!apply(ipCountry, "ip")) return;
        setTimeout(function () { showCorrectNews(ipCountry); }, 10000);
      })
      .catch(function () {
        if (existing.detectedCountry && COUNTRY[existing.detectedCountry]) apply(existing.detectedCountry, "previously-detected");
      });
  }

  window.AlgolassiAssistantCountryFix = {
    detect: init,
    state: function () { return readState(); }
  };

  init();
})();
