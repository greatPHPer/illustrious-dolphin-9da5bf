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

  function notifyLocationReady() {
    try {
      window.dispatchEvent(new CustomEvent("algolassi:location-ready"));
    } catch (e) {}
  }

  function apply(country, source, region, city) {
    if (!country || !COUNTRY[country]) return false;
    var state = readState();
    state.detectedCountry = country;
    state.detectedCountrySource = source;
    state.detectedLanguage = preferredLanguage(country);

    if (region) state.detectedRegion = String(region);
    if (city) state.detectedCity = String(city);

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

    notifyLocationReady();
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
    var proxy = "https://api.allorigins.win/raw?url=" + encodeURIComponent(rss);

    fetch(proxy, { credentials: "omit" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("News proxy HTTP " + response.status);
        }
        return response.text();
      })
      .then(function (xmlText) {
        var xml = new DOMParser().parseFromString(xmlText, "application/xml");
        if (xml.querySelector("parsererror")) {
          throw new Error("Invalid RSS XML");
        }

        var item = xml.querySelector("item");
        if (!item) return;

        function text(name) {
          var node = item.querySelector(name);
          return node ? node.textContent.trim() : "";
        }

        var title = text("title");
        var link = text("link");
        var place = city || region || config.name;
        var host = document.getElementById("algolassi-assistant-host");
        if (!host || !title) return;

        host.innerHTML =
          '<section class="algolassi-assistant-toast algolassi-assistant-news">' +
            '<div class="algolassi-assistant-head"><span class="algolassi-assistant-avatar">📰</span><strong>📍 ' + escapeHtml(place) + '</strong></div>' +
            '<div class="algolassi-assistant-body"><strong>' + escapeHtml(title) + '</strong>' +
            (link ? '<a class="algolassi-assistant-news-link" href="' + escapeHtml(link) + '" target="_blank" rel="noopener noreferrer">Read local news →</a>' : '') +
            '</div>' +
          '</section>';

        setTimeout(function () {
          if (host.firstElementChild) {
            host.firstElementChild.classList.add("algolassi-assistant-toast-hide");
          }
        }, 15000);
      })
      .catch(function (error) {
        console.warn("Algolassi news load failed:", error);
      });
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

    requestApproximateLocation()
      .then(function (location) {
        var country = tzCountry || (location && location.country) || existing.detectedCountry || "";
        if (!country) return;

        var source = location && location.country
          ? (tzCountry ? "timezone+ip" : "ip")
          : "timezone";
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

/* Mobile breadcrumb fix.
 * The breadcrumb markup is replaced by the SPA router after navigation, so
 * its inline click handler is not re-executed. Handle breadcrumb taps at the
 * document capture phase so the SPA router cannot navigate away on the first
 * tap. The first tap opens the dropdown; the second tap follows the link.
 */
(function () {
  "use strict";

  document.addEventListener("click", function (event) {
    if (!window.matchMedia("(hover: none) and (pointer: coarse)").matches) return;

    var trigger = event.target && event.target.closest
      ? event.target.closest(".breadcrumb-trigger")
      : null;
    if (!trigger) return;

    var item = trigger.closest(".breadcrumb-item");
    var menu = item ? item.querySelector(".breadcrumb-menu") : null;
    if (!menu) return;

    if (!menu.classList.contains("open")) {
      event.preventDefault();
      event.stopPropagation();

      document.querySelectorAll(".breadcrumb-menu.open").forEach(function (otherMenu) {
        otherMenu.classList.remove("open");
      });

      menu.classList.add("open");
    }
  }, true);
})();