/* Algolassi Assistant - Phase 4: local-language internet radio
 * Uses the free Radio Browser API. Audio starts only after the visitor clicks Play.
 * No MP3 files are bundled and no autoplay is attempted.
 */
(function () {
  "use strict";

  var KEY = "algolassi_assistant_radio_v1";
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

  function load() {
    try { return Object.assign({ country: "", language: "", station: "", shownAt: 0 }, JSON.parse(localStorage.getItem(KEY) || "{}")); }
    catch (e) { return { country: "", language: "", station: "", shownAt: 0 }; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function esc(v) { return String(v || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function country() {
    var s = localStorage.getItem("algolassi_assistant_v1");
    try { var a = s ? JSON.parse(s) : {}; if (a.detectedCountry) return a.detectedCountry; } catch (e) {}
    var l = navigator.language || "en-IN"; return (l.split("-")[1] || "IN").toUpperCase();
  }
  function languageFor(c) {
    var l = (navigator.language || "en-IN").toLowerCase();
    if (c === "IN" && l.indexOf("ta") === 0) return "tamil";
    if (c === "IN" && l.indexOf("hi") === 0) return "hindi";
    return (countryLanguages[c] || ["english"])[0];
  }
  function sleeping() {
    try { var a = JSON.parse(localStorage.getItem("algolassi_assistant_v1") || "{}"); return Number(a.sleepingUntil || 0) > Date.now(); } catch (e) { return false; }
  }
  function host() { var h = document.getElementById("algolassi-assistant-host"); if (!h) { h = document.createElement("div"); h.id = "algolassi-assistant-host"; document.body.appendChild(h); } return h; }

  function toast() {
    if (sleeping()) return;
    var h = host(); h.innerHTML = '';
    var t = document.createElement("section"); t.className = "algolassi-assistant-toast algolassi-radio-toast";
    var options = stations.map(function (s, i) { return '<option value="' + i + '">' + esc(s.name || "Radio station") + '</option>'; }).join("");
    t.innerHTML = '<div class="algolassi-assistant-head"><span class="algolassi-assistant-avatar">📻</span><strong>Local radio</strong></div>' +
      '<div class="algolassi-assistant-body"><div class="algolassi-radio-label">' + esc(state.language || "Local") + ' radio for ' + esc(state.country || "your region") + '</div>' +
      '<select class="algolassi-radio-select" aria-label="Radio station">' + options + '</select>' +
      '<div class="algolassi-radio-controls"><button type="button" class="algolassi-assistant-action" id="algolassi-radio-play">▶ Play</button><button type="button" class="algolassi-assistant-action" id="algolassi-radio-stop">■ Stop</button></div>' +
      '<audio id="algolassi-radio-audio" preload="none"></audio></div>';
    h.appendChild(t);
    audio = t.querySelector("#algolassi-radio-audio");
    var select = t.querySelector(".algolassi-radio-select");
    t.querySelector("#algolassi-radio-play").onclick = function () {
      var s = stations[Number(select.value)]; if (!s || !s.url_resolved) return;
      state.station = s.stationuuid || s.name; save();
      audio.src = s.url_resolved; audio.play().catch(function () {});
      t.querySelector("#algolassi-radio-play").textContent = "⏸ Playing";
    };
    t.querySelector("#algolassi-radio-stop").onclick = function () { if (audio) { audio.pause(); audio.removeAttribute("src"); audio.load(); } };
    setTimeout(function () { if (h.contains(t)) { t.classList.add("algolassi-assistant-toast-hide"); setTimeout(function(){ if(h.contains(t)) h.removeChild(t); },350); } }, 20000);
  }

  function search(lang, fallback) {
    var c = state.country;
    var url = API + "?countrycode=" + encodeURIComponent(c) + "&language=" + encodeURIComponent(lang) + "&hidebroken=true&order=votes&reverse=true&limit=8";
    fetch(url, { credentials: "omit" }).then(function (r) { return r.ok ? r.json() : []; }).then(function (data) {
      stations = (data || []).filter(function (s) { return s.url_resolved; });
      if (!stations.length && fallback) return search(fallback, "");
      if (stations.length) toast();
    }).catch(function () {});
  }

  function init() {
    if (sleeping()) return;
    state.country = country();
    state.language = languageFor(state.country);
    save();
    if (state.shownAt && Date.now() - state.shownAt < 24 * 60 * 60 * 1000) return;
    state.shownAt = Date.now(); save();
    setTimeout(function () { search(state.language, "english"); }, 18000);
  }

  window.AlgolassiRadio = {
    show: function () { state.country = country(); state.language = languageFor(state.country); search(state.language, "english"); },
    stop: function () { if (audio) { audio.pause(); audio.removeAttribute("src"); audio.load(); } },
    state: state
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
