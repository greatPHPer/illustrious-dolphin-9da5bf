/* Algolassi Assistant - Phase 4: local-language internet radio
 * Uses the free Radio Browser API. Audio starts only after the visitor clicks Play.
 * No MP3 files are bundled and no autoplay is attempted.
 *
 * Location fix:
 * - Prefer the Phase 3 country/state/city detector when it is available.
 * - Never use en-US by itself as evidence that the visitor is in the US.
 * - For India, prefer the detected regional language (for example Tamil in Tamil Nadu)
 *   and search Radio Browser with countrycode=IN.
 */
(function () {
  "use strict";

  var KEY = "algolassi_assistant_radio_v2";
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
    "tamil nadu": "tamil",
    "tamilnadu": "tamil",
    "andhra pradesh": "telugu",
    "telangana": "telugu",
    "kerala": "malayalam",
    "karnataka": "kannada",
    "maharashtra": "marathi",
    "gujarat": "gujarati",
    "west bengal": "bengali",
    "punjab": "punjabi",
    "odisha": "odia",
    "assam": "assamese",
    "bihar": "hindi",
    "uttar pradesh": "hindi",
    "madhya pradesh": "hindi",
    "rajasthan": "hindi",
    "haryana": "hindi",
    "delhi": "hindi"
  };

  function load() {
    try {
      return Object.assign({ country: "", region: "", city: "", language: "", station: "", shownAt: 0 },
        JSON.parse(localStorage.getItem(KEY) || "{}"));
    } catch (e) {
      return { country: "", region: "", city: "", language: "", station: "", shownAt: 0 };
    }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function esc(v) {
    return String(v || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
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
    // Phase 3 detector is the authoritative source when available.
    if (window.AlgolassiAssistantCountry && window.AlgolassiAssistantCountry.code) {
      return {
        country: String(window.AlgolassiAssistantCountry.code).toUpperCase(),
        region: window.AlgolassiAssistantCountry.region || "",
        city: window.AlgolassiAssistantCountry.city || "",
        language: window.AlgolassiAssistantCountry.language || ""
      };
    }

    try {
      var raw = localStorage.getItem("algolassi_assistant_v1");
      var saved = raw ? JSON.parse(raw) : {};
      if (saved.detectedCountry) {
        return {
          country: String(saved.detectedCountry).toUpperCase(),
          region: saved.detectedRegion || "",
          city: saved.detectedCity || "",
          language: saved.detectedLanguage || ""
        };
      }
    } catch (e) {}

    // Timezone is a better location fallback than navigator.language.
    return {
      country: countryFromTimezone(),
      region: "",
      city: "",
      language: ""
    };
  }

  function languageFor(location) {
    var country = location.country;
    var detectedLanguage = String(location.language || "").toLowerCase();

    if (detectedLanguage) {
      var known = ["tamil", "hindi", "telugu", "malayalam", "kannada", "bengali", "marathi", "gujarati", "punjabi", "odia", "assamese", "english", "french", "german", "spanish", "italian", "portuguese", "japanese", "korean", "arabic"];
      if (known.indexOf(detectedLanguage) !== -1) return detectedLanguage;
    }

    if (country === "IN") {
      var region = String(location.region || "").trim().toLowerCase();
      if (indiaRegionLanguages[region]) return indiaRegionLanguages[region];

      // Do not use en-US to infer location. For India, English is the safe fallback.
      return "english";
    }

    return (countryLanguages[country] || ["english"])[0];
  }

  function sleeping() {
    try {
      var a = JSON.parse(localStorage.getItem("algolassi_assistant_v1") || "{}");
      return Number(a.sleepingUntil || 0) > Date.now();
    } catch (e) { return false; }
  }

  function host() {
    var h = document.getElementById("algolassi-assistant-host");
    if (!h) {
      h = document.createElement("div");
      h.id = "algolassi-assistant-host";
      document.body.appendChild(h);
    }
    return h;
  }

  function toast() {
    if (sleeping()) return;

    var h = host();
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
      }
    };

    setTimeout(function () {
      if (h.contains(t)) {
        t.classList.add("algolassi-assistant-toast-hide");
        setTimeout(function () {
          if (h.contains(t)) h.removeChild(t);
        }, 350);
      }
    }, 20000);
  }

  function search(lang, fallback) {
    var c = state.country;
    if (!c) return;

    var url = API +
      "?countrycode=" + encodeURIComponent(c) +
      "&language=" + encodeURIComponent(lang) +
      "&hidebroken=true&order=votes&reverse=true&limit=8";

    fetch(url, { credentials: "omit" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (data) {
        stations = (data || []).filter(function (s) { return s.url_resolved; });
        if (!stations.length && fallback && fallback !== lang) return search(fallback, "");
        if (stations.length) toast();
      })
      .catch(function () {});
  }

  function syncLocation() {
    var location = getLocation();
    state.country = location.country;
    state.region = location.region;
    state.city = location.city;
    state.language = languageFor(location);
    save();
  }

  function init() {
    if (sleeping()) return;

    syncLocation();

    if (state.shownAt && Date.now() - state.shownAt < 24 * 60 * 60 * 1000) return;
    state.shownAt = Date.now();
    save();

    setTimeout(function () {
      search(state.language, state.country === "IN" ? "english" : "english");
    }, 18000);
  }

  window.AlgolassiRadio = {
    show: function () {
      syncLocation();
      search(state.language, "english");
    },
    stop: function () {
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
    },
    refreshLocation: function () {
      syncLocation();
      return state;
    },
    state: state
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
