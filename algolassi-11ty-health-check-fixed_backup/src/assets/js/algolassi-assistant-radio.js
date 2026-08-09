/* Algolassi Assistant - Phase 4: local-language internet radio
 * Location-safe radio selection.
 *
 * Important rules:
 * - Timezone is preferred for country when it is available.
 * - Phase 3 country/state/city information is used when available.
 * - For India, state/region language beats an en-US browser locale.
 * - Radio Browser is always queried with the detected country code.
 * - A US station is never intentionally selected when the detected country is IN.
 * - Radio controls live in their own high-z-index host so later assistant/news
 *   toasts never cover or destroy the Stop button.
 */
(function () {
  "use strict";

  var KEY = "algolassi_assistant_radio_v3";
  var API = "https://de1.api.radio-browser.info/json/stations/search";
  var state = load();
  var audio = null;
  var stations = [];

  var countryLanguages = {
    IN: ["tamil", "hindi", "english"],
    US: ["english"], GB: ["english"], CA: ["english", "french"], AU: ["english"],
    DE: ["german"], FR: ["french"], ES: ["spanish"], IT: ["italian"],
    BR: ["portuguese"], JP: ["japanese"], KR: ["korean"], SG: ["english"], AE: ["arabic", "english"]
  };

  var indiaRegionLanguages = {
    "tamil nadu": "tamil", "tamilnadu": "tamil", "andhra pradesh": "telugu", "telangana": "telugu",
    "kerala": "malayalam", "karnataka": "kannada", "maharashtra": "marathi", "gujarat": "gujarati",
    "west bengal": "bengali", "punjab": "punjabi", "odisha": "odia", "orissa": "odia",
    "assam": "assamese", "bihar": "hindi", "uttar pradesh": "hindi", "madhya pradesh": "hindi",
    "rajasthan": "hindi", "haryana": "hindi", "delhi": "hindi"
  };

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || "{}");
      return Object.assign({ country: "", region: "", city: "", language: "", station: "", shownAt: 0 }, saved);
    } catch (e) {
      return { country: "", region: "", city: "", language: "", station: "", shownAt: 0 };
    }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function esc(v) {
    return String(v || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function countryFromTimezone() {
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
      if (/Australia\//i.test(tz)) return "AU";
      if (/Asia\/Singapore/i.test(tz)) return "SG";
      if (/Asia\/Dubai/i.test(tz)) return "AE";
      if (/America\/Sao_Paulo/i.test(tz)) return "BR";
      if (/America\/Toronto/i.test(tz)) return "CA";
      if (/America\/New_York|America\/Chicago|America\/Denver|America\/Los_Angeles/i.test(tz)) return "US";
    } catch (e) {}
    return "";
  }

  function getLocation() {
    var tzCountry = countryFromTimezone();
    if (window.AlgolassiAssistantCountry && window.AlgolassiAssistantCountry.code) {
      var detected = window.AlgolassiAssistantCountry;
      return {
        country: tzCountry || String(detected.code).toUpperCase(),
        region: detected.region || "",
        city: detected.city || "",
        language: detected.language || ""
      };
    }

    try {
      var raw = localStorage.getItem("algolassi_assistant_v1");
      var saved = raw ? JSON.parse(raw) : {};
      if (saved.detectedCountry || tzCountry) {
        return {
          country: tzCountry || String(saved.detectedCountry || "").toUpperCase(),
          region: saved.detectedRegion || "",
          city: saved.detectedCity || "",
          language: saved.detectedLanguage || ""
        };
      }
    } catch (e) {}

    return { country: tzCountry, region: "", city: "", language: "" };
  }

  function languageFor(location) {
    var country = String(location.country || "").toUpperCase();
    var region = String(location.region || "").trim().toLowerCase();
    var detectedLanguage = String(location.language || "").toLowerCase();
    if (country === "IN") {
      if (indiaRegionLanguages[region]) return indiaRegionLanguages[region];
      var indianLanguages = ["tamil", "hindi", "telugu", "malayalam", "kannada", "bengali", "marathi", "gujarati", "punjabi", "odia", "assamese"];
      if (indianLanguages.indexOf(detectedLanguage) !== -1) return detectedLanguage;
      return "english";
    }
    var known = ["english", "french", "german", "spanish", "italian", "portuguese", "japanese", "korean", "arabic"];
    if (known.indexOf(detectedLanguage) !== -1) return detectedLanguage;
    return (countryLanguages[country] || ["english"])[0];
  }

  function sleeping() {
    try {
      var a = JSON.parse(localStorage.getItem("algolassi_assistant_v1") || "{}");
      return Number(a.sleepingUntil || 0) > Date.now();
    } catch (e) { return false; }
  }

  function radioHost() {
    var h = document.getElementById("algolassi-radio-host");
    if (!h) {
      h = document.createElement("div");
      h.id = "algolassi-radio-host";
      h.setAttribute("aria-live", "polite");
      h.setAttribute("aria-label", "Algolassi local radio");
      document.body.appendChild(h);
    }
    return h;
  }

  function removeRadioToast() {
    var h = document.getElementById("algolassi-radio-host");
    if (h) h.innerHTML = "";
    audio = null;
  }

  function toast() {
    if (sleeping() || !state.country) return;

    var h = radioHost();
    h.innerHTML = "";

    var t = document.createElement("section");
    t.className = "algolassi-assistant-toast algolassi-radio-toast";

    var options = stations.map(function (s, i) {
      return '<option value="' + i + '">' + esc(s.name || "Radio station") + '</option>';
    }).join("");

    var place = state.city || state.region || state.country || "your region";
    var label = (state.language || "local") + " radio · " + place;

    t.innerHTML =
      '<div class="algolassi-assistant-head"><span class="algolassi-assistant-avatar">📻</span><strong>Local radio</strong></div>' +
      '<div class="algolassi-assistant-body"><div class="algolassi-radio-label">' + esc(label) + '</div>' +
      '<select class="algolassi-radio-select" aria-label="Radio station">' + options + '</select>' +
      '<div class="algolassi-radio-controls"><button type="button" class="algolassi-assistant-action" id="algolassi-radio-play">▶ Play</button>' +
      '<button type="button" class="algolassi-assistant-action" id="algolassi-radio-stop">■ Stop</button></div>' +
      '<audio id="algolassi-radio-audio" preload="none"></audio></div>';

    h.appendChild(t);
    audio = t.querySelector("#algolassi-radio-audio");
    var select = t.querySelector(".algolassi-radio-select");

    t.querySelector("#algolassi-radio-play").onclick = function () {
      var s = stations[Number(select.value)];
      if (!s || !s.url_resolved) return;
      var stationCountry = String(s.countrycode || "").toUpperCase();
      if (state.country && stationCountry && stationCountry !== state.country) {
        console.warn("Algolassi Radio: rejected station from " + stationCountry + "; expected " + state.country);
        return;
      }
      state.station = s.stationuuid || s.name;
      save();
      audio.src = s.url_resolved;
      audio.play().catch(function () {});
      t.querySelector("#algolassi-radio-play").textContent = "⏸ Playing";
    };

    t.querySelector("#algolassi-radio-stop").onclick = function () {
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        t.querySelector("#algolassi-radio-play").textContent = "▶ Play";
      }
    };
  }

  function search(lang, fallback) {
    var c = String(state.country || "").toUpperCase();
    if (!c) return;
    var url = API +
      "?countrycode=" + encodeURIComponent(c) +
      "&language=" + encodeURIComponent(lang) +
      "&hidebroken=true&order=votes&reverse=true&limit=8";

    fetch(url, { credentials: "omit" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (data) {
        stations = (data || []).filter(function (s) {
          if (!s.url_resolved) return false;
          var stationCountry = String(s.countrycode || "").toUpperCase();
          return !c || !stationCountry || stationCountry === c;
        });
        if (!stations.length && fallback && fallback !== lang) return search(fallback, "");
        if (stations.length) toast();
      })
      .catch(function () {});
  }

  function syncLocation() {
    var location = getLocation();
    state.country = String(location.country || "").toUpperCase();
    state.region = location.region || "";
    state.city = location.city || "";
    state.language = languageFor(location);
    save();
  }

  function refreshAndSearch() {
    syncLocation();
    if (!state.country) return;
    search(state.language, state.country === "IN" ? "english" : "english");
  }

  function init() {
    if (sleeping()) return;
    syncLocation();
    if (state.shownAt && Date.now() - state.shownAt < 24 * 60 * 60 * 1000) return;
    state.shownAt = Date.now();
    save();
    setTimeout(refreshAndSearch, 18000);
    setTimeout(refreshAndSearch, 22000);
  }

  window.addEventListener("algolassi:location-ready", refreshAndSearch);

  window.AlgolassiRadio = {
    show: function () { refreshAndSearch(); },
    stop: function () {
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
    },
    close: function () { removeRadioToast(); },
    refreshLocation: function () { syncLocation(); return state; },
    state: state
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();