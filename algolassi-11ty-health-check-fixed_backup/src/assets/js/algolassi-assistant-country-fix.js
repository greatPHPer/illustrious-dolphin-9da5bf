/*
 * Algolassi Assistant - country / state / city detection.
 *
 * Privacy model:
 * - timezone is used as a strong country signal;
 * - IP geolocation is used only to obtain approximate region/city news context;
 * - exact latitude/longitude is never stored in localStorage;
 * - browser language is used for language preference, not physical location.
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

  function localeLanguage() {
    var locale = (navigator.language || "en").toLowerCase();
    return locale.split("-")[0].split("_")[0] || "en";
  }

  function preferredLanguage(country) {
    var language = localeLanguage();
    if (country === "IN") {
      if (language === "ta") return "Tamil";
      if (language === "hi") return "Hindi";
      if (language === "te") return "Telugu";
      if (language === "ml") return "Malayalam";
      if (language === "kn") return "Kannada";
      if (language === "bn") return "Bengali";
      if (language === "mr") return "Marathi";
      if (language === "gu") return "Gujarati";
      if (language === "pa") return "Punjabi";
      return "English";
    }
    return language;
  }

  function apply(country, source, region, city) {
    if (!country || !COUNTRY[country]) return false;
    var state = readState();
    state.detectedCountry = country;
    state.detectedCountrySource = source;
    state.detectedLanguage = preferredLanguage(country);

    // Store only coarse location labels, never latitude/longitude.
    if (region) state.detectedRegion = String(region);
    if (city) state.detectedCity = String(city);

    // Prevent the old Phase 3 detector from producing a second wrong-country toast.
    state.newsShownAt = Date.now();
    writeState(state);

    window.AlgolassiAssistantCountry = {
      code: country,
      name: COUNTRY[country].name,
      source: source,
      language: state.detectedLanguage,
      region: state.detectedRegion || "",
      city: state.detectedCity || ""
    };
    return true;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");
  }

  function buildNewsUrl(country, region, city) {
    var config = COUNTRY[country];
    if (!config) return "";

    // Prefer local/state news. Fall back to national Google News if no region exists.
    var query = city || region || "";
    var base = "https://news.google.com/rss?hl=" + encodeURIComponent(config.hl) +
      "&gl=" + encodeURIComponent(config.gl) + "&ceid=" + encodeURIComponent(config.ceid);
    if (query) base += "&q=" + encodeURIComponent(query + " news");
    return base;
  }

  function showCorrectNews(country, region, city) {
    var config = COUNTRY[country];
    if (!config) return;

    var rss = buildNewsUrl(country, region, city);
    var proxy = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(rss);

    fetch(proxy, { credentials: "omit" })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (data) {
        if (!data || !data.items || !data.items.length) return;
        var item = data.items[0];
        var place = city || region || config.name;
        var image = item.thumbnail ? '<img class="algolassi-assistant-news-image" src="' + escapeHtml(item.thumbnail) + '" alt="">' : "";
        var link = item.link ? '<a class="algolassi-assistant-news-link" href="' + escapeHtml(item.link) + '" target="_blank" rel="noopener noreferrer">Read local news →</a>' : "";
        var host = document.getElementById("algolassi-assistant-host");
        if (!host) return;
        host.innerHTML = '<section class="algolassi-assistant-toast algolassi-assistant-news">' +
          '<div class="algolassi-assistant-head"><span class="algolassi-assistant-avatar">📰</span><strong>📍 ' + escapeHtml(place) + '</strong></div>' +
          '<div class="algolassi-assistant-body">' + image + '<strong>' + escapeHtml(item.title) + '</strong>' + link + '</div></section>';
        setTimeout(function () {
          if (host.firstElementChild) host.firstElementChild.classList.add("algolassi-assistant-toast-hide");
        }, 15000);
      })
      .catch(function () {});
  }

  function requestApproximateLocation() {
    return fetch("https://ipapi.co/json/", { credentials: "omit" })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (data) {
        if (!data) return null;
        return {
          country: data.country_code ? String(data.country_code).toUpperCase() : "",
          region: data.region || data.region_code || "",
          city: data.city || ""
        };
      });
  }

  function init() {
    var existing = readState();
    var tzCountry = timezoneCountry();

    // Timezone gives us a reliable country for many visitors, but not a state/city.
    // Fetch approximate IP metadata so state/city news can still be selected.
    requestApproximateLocation()
      .then(function (location) {
        var country = (location && location.country) || tzCountry || existing.detectedCountry || "";
        if (!country) return;

        var source = location && location.country ? (tzCountry ? "timezone+ip" : "ip") : "timezone";
        var region = location && location.region ? location.region : (existing.detectedRegion || "");
        var city = location && location.city ? location.city : (existing.detectedCity || "");

        if (!apply(country, source, region, city)) return;

        setTimeout(function () {
          showCorrectNews(country, region, city);
        }, 10000);
      })
      .catch(function () {
        if (tzCountry) {
          apply(tzCountry, "timezone", existing.detectedRegion || "", existing.detectedCity || "");
          setTimeout(function () {
            showCorrectNews(tzCountry, existing.detectedRegion || "", existing.detectedCity || "");
          }, 10000);
        }
      });
  }

  window.AlgolassiAssistantCountryFix = {
    detect: init,
    state: function () { return readState(); }
  };

  init();
})();
