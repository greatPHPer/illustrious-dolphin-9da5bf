/* Algolassi Assistant - Phase 4: local-language internet radio */
(function () {
  "use strict";

  var KEY = "algolassi_assistant_radio_v3";
  var API = "https://api.radio-browser.info/json/stations/search";

  var state = load();
  var audio = null;
  var stations = [];
  var radioPositionObserver = null;
  var radioResizeObserver = null;
  var radioHostResizeObserver = null;
  var radioHideTimer = null;
  var radioPlaying = false;
  var initialized = false;

  var countryLanguages = {
    IN: ["tamil", "hindi", "english"],
    US: ["english"],
    GB: ["english"],
    CA: ["english", "french"],
    AU: ["english"],
    DE: ["german"],
    FR: ["french"],
    ES: ["spanish"],
    IT: ["italian"],
    BR: ["portuguese"],
    JP: ["japanese"],
    KR: ["korean"],
    SG: ["english"],
    AE: ["arabic", "english"]
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
    "orissa": "odia",
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
      var saved = JSON.parse(localStorage.getItem(KEY) || "{}");
      return Object.assign({
        country: "",
        region: "",
        city: "",
        language: "",
        station: "",
        shownAt: 0,
        hidden: false
      }, saved);
    } catch (e) {
      return {
        country: "",
        region: "",
        city: "",
        language: "",
        station: "",
        shownAt: 0,
        hidden: false
      };
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      /* Ignore storage failures. */
    }
  }

  function esc(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");
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
    } catch (e) {
      /* Ignore timezone failures. */
    }
    return "";
  }

  function getLocation() {
    var timezoneCountry = countryFromTimezone();

    if (window.AlgolassiAssistantCountry && window.AlgolassiAssistantCountry.code) {
      var detected = window.AlgolassiAssistantCountry;
      return {
        country: timezoneCountry || String(detected.code).toUpperCase(),
        region: detected.region || "",
        city: detected.city || "",
        language: detected.language || ""
      };
    }

    try {
      var raw = localStorage.getItem("algolassi_assistant_v1");
      var saved = raw ? JSON.parse(raw) : {};
      if (saved.detectedCountry || timezoneCountry) {
        return {
          country: timezoneCountry || String(saved.detectedCountry || "").toUpperCase(),
          region: saved.detectedRegion || "",
          city: saved.detectedCity || "",
          language: saved.detectedLanguage || ""
        };
      }
    } catch (e) {
      /* Ignore stored-location failures. */
    }

    return {
      country: timezoneCountry,
      region: "",
      city: "",
      language: ""
    };
  }

  function languageFor(location) {
    var country = String(location.country || "").toUpperCase();
    var region = String(location.region || "").trim().toLowerCase();
    var detectedLanguage = String(location.language || "").toLowerCase();

    if (country === "IN") {
      if (indiaRegionLanguages[region]) return indiaRegionLanguages[region];
      var indianLanguages = [
        "tamil", "hindi", "telugu", "malayalam", "kannada",
        "bengali", "marathi", "gujarati", "punjabi", "odia", "assamese"
      ];
      if (indianLanguages.indexOf(detectedLanguage) !== -1) return detectedLanguage;
      return "english";
    }

    var knownLanguages = [
      "english", "french", "german", "spanish", "italian",
      "portuguese", "japanese", "korean", "arabic"
    ];
    if (knownLanguages.indexOf(detectedLanguage) !== -1) return detectedLanguage;
    return (countryLanguages[country] || ["english"])[0];
  }

  function sleeping() {
    try {
      var assistant = JSON.parse(localStorage.getItem("algolassi_assistant_v1") || "{}");
      return Number(assistant.sleepingUntil || 0) > Date.now();
    } catch (e) {
      return false;
    }
  }

  function radioHost() {
    var host = document.getElementById("algolassi-radio-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "algolassi-radio-host";
      host.setAttribute("aria-live", "polite");
      host.setAttribute("aria-label", "Algolassi local radio");
      host.setAttribute("data-no-spa", "true");
      document.body.appendChild(host);
    }
    return host;
  }

  function normalBottom() {
    return window.innerWidth <= 600 ? 10 : 18;
  }

  function assistantToast() {
    var assistant = document.getElementById("algolassi-assistant-host");
    if (!assistant) return null;

    var candidates = assistant.querySelectorAll(".algolassi-assistant-toast");
    for (var i = candidates.length - 1; i >= 0; i--) {
      var candidate = candidates[i];
      var styles = getComputedStyle(candidate);
      var rect = candidate.getBoundingClientRect();
      if (styles.display !== "none" && styles.visibility !== "hidden" && rect.width > 0 && rect.height > 0) {
        return candidate;
      }
    }
    return null;
  }

  function notifyLayoutChange() {
    window.requestAnimationFrame(function () {
      try {
        window.dispatchEvent(new Event("algolassi:radio-layout-change"));
      } catch (e) {
        var event = document.createEvent("Event");
        event.initEvent("algolassi:radio-layout-change", false, false);
        window.dispatchEvent(event);
      }

      try {
        window.dispatchEvent(new Event("resize"));
      } catch (e2) {
        var resizeEvent = document.createEvent("Event");
        resizeEvent.initEvent("resize", false, false);
        window.dispatchEvent(resizeEvent);
      }
    });
  }

  function repositionRadio() {
    var host = document.getElementById("algolassi-radio-host");
    if (!host) return;

    var base = normalBottom();
    var toastElement = assistantToast();
    var radioHeight = host.getBoundingClientRect().height || 0;
    var required = base + radioHeight + 10;

    if (toastElement) {
      var rect = toastElement.getBoundingClientRect();
      required = Math.max(required, window.innerHeight - rect.top + 10 + radioHeight);
    }

    host.style.bottom = (radioPlaying
      ? required
      : (toastElement
        ? Math.max(base, window.innerHeight - toastElement.getBoundingClientRect().top + 10)
        : base)) + "px";

    notifyLayoutChange();
  }

  function startRadioPositionObserver() {
    var start = function () {
      var assistant = document.getElementById("algolassi-assistant-host");
      var host = document.getElementById("algolassi-radio-host");

      if (assistant && !radioPositionObserver && window.MutationObserver) {
        radioPositionObserver = new MutationObserver(function () {
          window.requestAnimationFrame(repositionRadio);
        });
        radioPositionObserver.observe(assistant, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["class", "style"]
        });
      }

      if (assistant && window.ResizeObserver && !radioResizeObserver) {
        radioResizeObserver = new ResizeObserver(function () {
          window.requestAnimationFrame(repositionRadio);
        });
        radioResizeObserver.observe(assistant);
      }

      if (host && window.ResizeObserver && !radioHostResizeObserver) {
        radioHostResizeObserver = new ResizeObserver(function () {
          window.requestAnimationFrame(repositionRadio);
        });
        radioHostResizeObserver.observe(host);
      }

      if (!window._algolassiRadioResizeBound) {
        window._algolassiRadioResizeBound = true;
        window.addEventListener("resize", repositionRadio, { passive: true });
      }

      repositionRadio();
    };

    if (document.getElementById("algolassi-assistant-host") || document.getElementById("algolassi-radio-host")) {
      start();
    } else {
      window.setTimeout(start, 500);
    }
  }

  function resetRadioPosition() {
    var host = document.getElementById("algolassi-radio-host");
    if (host) {
      host.style.bottom = normalBottom() + "px";
      notifyLayoutChange();
    }
  }

  function removeRadioToast() {
    if (radioHideTimer) {
      clearTimeout(radioHideTimer);
      radioHideTimer = null;
    }

    var host = document.getElementById("algolassi-radio-host");
    if (host) {
      host.innerHTML = "";
      host.style.bottom = normalBottom() + "px";
    }

    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    audio = null;
    radioPlaying = false;
    notifyLayoutChange();
  }

  function removeRadioReopen() {
    var button = document.getElementById("algolassi-radio-reopen");
    if (button) button.remove();
  }

  function showRadioReopen() {
    if (document.getElementById("algolassi-radio-reopen")) return;

    var button = document.createElement("button");
    button.id = "algolassi-radio-reopen";
    button.type = "button";
    button.setAttribute("aria-label", "Show Algolassi Radio");
    button.title = "Show Algolassi Radio";
    button.textContent = "📻";
    button.style.cssText = "position:fixed;right:14px;bottom:14px;z-index:2147483646;width:46px;height:46px;border:0;border-radius:50%;font-size:22px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);background:#fff;";

    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      state.hidden = false;
      save();
      removeRadioReopen();
      refreshAndSearch();
    }, false);

    document.body.appendChild(button);
  }

  function hideRadio() {
    if (radioPlaying) return;
    state.hidden = true;
    save();
    removeRadioToast();
    showRadioReopen();
  }

  function scheduleHide() {
    if (radioHideTimer) clearTimeout(radioHideTimer);
    radioHideTimer = window.setTimeout(function () {
      if (radioPlaying) {
        radioHideTimer = null;
        return;
      }
      removeRadioToast();
    }, 15000);
  }

  function streamUrl(station) {
    var url = String((station && (station.url_resolved || station.url)) || "").trim();
    if (/^http:\/\//i.test(url) && location.protocol === "https:") return "";
    return url;
  }

  function toast() {
    if (sleeping() || !state.country || state.hidden) return;

    removeRadioReopen();
    removeRadioToast();

    var host = radioHost();
    var toastElement = document.createElement("section");
    toastElement.className = "algolassi-assistant-toast algolassi-radio-toast";
    toastElement.setAttribute("data-no-spa", "true");

    var options = stations.map(function (station, index) {
      return '<option value="' + index + '">' + esc(station.name || "Radio station") + "</option>";
    }).join("");

    var place = state.city || state.region || state.country;
    var label = (state.language || "local") + " radio · " + place;

    toastElement.innerHTML =
      '<div class="algolassi-assistant-head">' +
      '<span class="algolassi-assistant-avatar">📻</span>' +
      '<strong>Local radio</strong>' +
      '<button type="button" class="algolassi-assistant-action algolassi-radio-hide" aria-label="Hide radio" title="Hide radio" style="margin-left:auto;">✕ Hide</button>' +
      '</div>' +
      '<div class="algolassi-assistant-body">' +
      '<div class="algolassi-radio-label">' + esc(label) + "</div>" +
      '<select class="algolassi-radio-select" aria-label="Radio station">' + options + "</select>" +
      '<div class="algolassi-radio-controls">' +
      '<button type="button" class="algolassi-assistant-action" id="algolassi-radio-play">▶ Play</button>' +
      '<button type="button" class="algolassi-assistant-action" id="algolassi-radio-stop">■ Stop</button>' +
      '</div>' +
      '<audio id="algolassi-radio-audio" preload="none" style="display:none"></audio>' +
      '</div>';

    host.appendChild(toastElement);

    audio = toastElement.querySelector("#algolassi-radio-audio");
    var select = toastElement.querySelector(".algolassi-radio-select");
    var play = toastElement.querySelector("#algolassi-radio-play");
    var stop = toastElement.querySelector("#algolassi-radio-stop");
    var hide = toastElement.querySelector(".algolassi-radio-hide");

    function updateHideButton() {
      hide.style.display = radioPlaying ? "none" : "inline-block";
    }

    function block(event) {
      if (!event) return false;
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      return false;
    }

    hide.addEventListener("click", function (event) {
      block(event);
      hideRadio();
      return false;
    }, false);

    play.addEventListener("click", function (event) {
      block(event);

      var station = stations[Number(select.value)];
      if (!station) return false;

      var url = streamUrl(station);
      if (!url) {
        play.textContent = "No playable stream";
        return false;
      }

      var stationCountry = String(station.countrycode || "").toUpperCase();
      if (state.country && stationCountry && stationCountry !== state.country) return false;

      state.station = station.stationuuid || station.name;
      save();

      audio.pause();
      audio.removeAttribute("src");
      audio.src = url;
      audio.load();
      play.textContent = "Connecting…";

      var promise = audio.play();
      if (promise && promise.then) {
        promise.then(function () {
          radioPlaying = true;
          play.textContent = "⏸ Playing";
          updateHideButton();
          repositionRadio();
        }).catch(function () {
          radioPlaying = false;
          updateHideButton();
          play.textContent = "▶ Play";
        });
      }

      return false;
    }, false);

    stop.addEventListener("click", function (event) {
      block(event);
      if (!audio) return false;

      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      radioPlaying = false;
      updateHideButton();
      play.textContent = "▶ Play";
      resetRadioPosition();
      scheduleHide();
      return false;
    }, false);

    select.addEventListener("click", function (event) {
      event.stopPropagation();
    }, false);

    select.addEventListener("change", function (event) {
      event.stopPropagation();
    }, false);

    toastElement.addEventListener("click", function (event) {
      event.stopPropagation();
    }, false);

    audio.addEventListener("play", function () {
      radioPlaying = true;
      play.textContent = "⏸ Playing";
      updateHideButton();
      repositionRadio();
    });

    audio.addEventListener("pause", function () {
      if (!audio.src || audio.ended) {
        radioPlaying = false;
        updateHideButton();
        resetRadioPosition();
        scheduleHide();
      }
    });

    audio.addEventListener("ended", function () {
      radioPlaying = false;
      updateHideButton();
      resetRadioPosition();
      scheduleHide();
    });

    audio.addEventListener("error", function () {
      radioPlaying = false;
      updateHideButton();
      play.textContent = "▶ Play";
      resetRadioPosition();
    });

    updateHideButton();
    repositionRadio();
    scheduleHide();
  }

  function search(language, fallback) {
    var country = String(state.country || "").toUpperCase();
    if (!country) return;

    var url = API +
      "?countrycode=" + encodeURIComponent(country) +
      "&language=" + encodeURIComponent(language) +
      "&hidebroken=true&order=votes&reverse=true&limit=8";

    fetch(url, { credentials: "omit" })
      .then(function (response) {
        return response.ok ? response.json() : [];
      })
      .then(function (data) {
        stations = (data || []).filter(function (station) {
          return !!streamUrl(station) &&
            (!country || !station.countrycode || String(station.countrycode).toUpperCase() === country);
        });

        if (!stations.length && fallback && fallback !== language) {
          search(fallback, "");
          return;
        }

        if (stations.length) toast();
      })
      .catch(function () {
        /* Radio is optional; ignore API failures. */
      });
  }

  function syncLocation() {
    var locationData = getLocation();
    state.country = String(locationData.country || "").toUpperCase();
    state.region = locationData.region || "";
    state.city = locationData.city || "";
    state.language = languageFor(locationData);
    save();
  }

  function refreshAndSearch() {
    syncLocation();
    if (!state.country || state.hidden) return;
    search(state.language, "english");
  }

  function init() {
    if (initialized) return;
    initialized = true;

    if (sleeping()) return;

    syncLocation();
    startRadioPositionObserver();

    if (state.hidden) {
      showRadioReopen();
      return;
    }

    if (state.shownAt && Date.now() - state.shownAt < 24 * 60 * 60 * 1000) return;

    state.shownAt = Date.now();
    save();

    window.setTimeout(refreshAndSearch, 18000);
    window.setTimeout(refreshAndSearch, 22000);
  }

  window.AlgolassiRadioInit = function () {
    startRadioPositionObserver();
    repositionRadio();
  };

  window.addEventListener("algolassi:location-ready", refreshAndSearch);

  window.addEventListener("algolassi:spa-navigation", function () {
    window.setTimeout(function () {
      startRadioPositionObserver();
      repositionRadio();
    }, 0);
  });

  window.AlgolassiRadio = {
    show: function () {
      state.hidden = false;
      save();
      removeRadioReopen();
      refreshAndSearch();
    },
    stop: function () {
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
      radioPlaying = false;
      resetRadioPosition();
      scheduleHide();
    },
    close: function () {
      hideRadio();
    },
    refreshLocation: function () {
      syncLocation();
      return state;
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
