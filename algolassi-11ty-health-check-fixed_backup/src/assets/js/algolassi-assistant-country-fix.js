/*
 * Algolassi Assistant - country / state / city detection.
 *
 * Privacy model:
 * - timezone is used as a strong country signal;
 * - IP geolocation is used only for approximate country/region/city news context;
 * - exact latitude/longitude is never stored in localStorage;
 * - browser language is used for language preference, not physical location.
 *
 * IPinfo Lite:
 * - Uses the authenticated /lite/me endpoint when ALGOLASSI_IPINFO_TOKEN is configured.
 * - Caches the result in the existing assistant state to avoid repeat lookups during SPA navigation.
 * - Falls back to timezone detection when the API is unavailable.
 */
(function () {
  "use strict";

  var KEY = "algolassi_assistant_v1";
  var IPINFO_CACHE_TTL = 24 * 60 * 60 * 1000;
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
    try { window.dispatchEvent(new CustomEvent("algolassi:location-ready")); }
    catch (e) {}
  }

  function apply(country, source, region, city) {
    if (!country || !COUNTRY[country]) return false;
    var state = readState();
    state.detectedCountry = country;
    state.detectedCountrySource = source;
    state.detectedLanguage = preferredLanguage(country);
    if (region) state.detectedRegion = String(region);
    if (city) state.detectedCity = String(city);
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

    // rss2json is an optional third-party proxy. Do not call it unless an
    // application-owned news endpoint has explicitly been configured.
    // This keeps a proxy outage from creating a failed network request on
    // every page while country detection continues to work normally.
    var endpoint = String(window.ALGOLASSI_ASSISTANT_NEWS_ENDPOINT || "").trim();
    if (!endpoint) return;

    var rss = buildNewsUrl(country, region, city);
    var proxy = endpoint + (endpoint.indexOf("?") >= 0 ? "&" : "?") + "rss_url=" + encodeURIComponent(rss);

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

  function cachedIpInfo(state) {
    if (!state.ipinfoLite || !state.ipinfoLite.savedAt) return null;
    if (Date.now() - Number(state.ipinfoLite.savedAt) > IPINFO_CACHE_TTL) return null;
    return state.ipinfoLite;
  }

  function requestApproximateLocation(state) {
    var token = String(window.ALGOLASSI_IPINFO_TOKEN || "").trim();
    var cached = cachedIpInfo(state);
    if (cached) return Promise.resolve(cached);
    if (!token) return Promise.resolve(null);

    var endpoint = "https://api.ipinfo.io/lite/me?token=" + encodeURIComponent(token);
    return fetch(endpoint, { credentials: "omit" })
      .then(function (response) {
        if (!response.ok) throw new Error("IPinfo Lite HTTP " + response.status);
        return response.json();
      })
      .then(function (data) {
        var location = {
          country: data && data.country_code ? String(data.country_code).toUpperCase() : "",
          region: "",
          city: ""
        };
        var next = Object.assign({}, location, { savedAt: Date.now() });
        state.ipinfoLite = next;
        writeState(state);
        return next;
      });
  }

  function init() {
    var existing = readState();

    if (existing.newsStateVersion !== 1) {
      existing.newsStateVersion = 1;
      existing.newsShownAt = 0;
      writeState(existing);
    }

    var tzCountry = timezoneCountry();
    var cached = cachedIpInfo(existing);

    requestApproximateLocation(existing)
      .then(function (location) {
        var country = tzCountry || (location && location.country) || existing.detectedCountry || "";
        if (!country) return;
        var source = location && location.country
          ? (tzCountry ? "timezone+ipinfo" : "ipinfo")
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
        } else if (cached && cached.country) {
          apply(cached.country, "ipinfo-cache", existing.detectedRegion || "", existing.detectedCity || "");
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
      ? event.target.closest(".breadcrumb-trigger") : null;
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
