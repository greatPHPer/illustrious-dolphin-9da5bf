/*
 * Algolassi Assistant - Phase 5: context + personality layer
 *
 * This layer combines the existing local assistant state into occasional,
 * context-aware toast messages. It does not read browser history and does
 * not transmit the local profile anywhere.
 */
(function () {
  "use strict";

  var KEY = "algolassi_assistant_v1";
  var PHASE5_KEY = "algolassi_assistant_phase5_v1";
  var DAY = 24 * 60 * 60 * 1000;
  var state = loadState();
  var meta = loadMeta();

  function loadState() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
    catch (e) { return {}; }
  }

  function loadMeta() {
    try {
      return Object.assign({ visits: 0, lastPath: "", lastShownAt: 0, lastMessage: "" }, JSON.parse(localStorage.getItem(PHASE5_KEY) || "{}"));
    } catch (e) {
      return { visits: 0, lastPath: "", lastShownAt: 0, lastMessage: "" };
    }
  }

  function saveMeta() {
    try { localStorage.setItem(PHASE5_KEY, JSON.stringify(meta)); } catch (e) {}
  }

  function sleeping() {
    return Number(state.sleepingUntil || 0) > Date.now();
  }

  function toast(message, actions, duration) {
    if (sleeping() || !window.AlgolassiAssistant || typeof window.AlgolassiAssistant.toast !== "function") return false;
    window.AlgolassiAssistant.toast(message, { duration: duration || 12000, actions: actions });
    return true;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function topEntry(obj) {
    var best = "";
    var bestCount = 0;
    Object.keys(obj || {}).forEach(function (key) {
      var count = Number(obj[key] || 0);
      if (count > bestCount) { best = key; bestCount = count; }
    });
    return best ? { name: best, count: bestCount } : null;
  }

  function currentTopic() {
    var text = ((document.title || "") + " " + ((document.querySelector("h1") || {}).textContent || "") + " " + location.pathname).toLowerCase();
    var rules = [
      ["C#", /\bc#\b|csharp|c-sharp/],
      ["ASP.NET Core", /asp[- ]?net[- ]?core/],
      ["Blazor", /blazor/],
      ["SQL Server", /sql[- ]?server|mssql|t-sql/],
      [".NET", /\.net|dotnet/],
      ["Visual Studio", /visual[- ]?studio/],
      ["Angular", /angular/],
      ["MAUI", /\.net maui|maui/]
    ];
    for (var i = 0; i < rules.length; i++) if (rules[i][1].test(text)) return rules[i][0];
    return "";
  }

  function hubFor(topic) {
    return {
      "C#": "/csharp-tutorials/",
      "ASP.NET Core": "/asp-net-core-tutorials/",
      "Blazor": "/blazor-tutorials/",
      "SQL Server": "/sql-server-tutorials/",
      ".NET": "/net-tutorials/",
      "Visual Studio": "/visual-studio-tutorials/"
    }[topic] || "/tutorials/";
  }

  function siteMessage(site) {
    var messages = {
      reddit: "Reddit again? 😏 You and Reddit are becoming regulars.",
      geeksforgeeks: "GeeksforGeeks again? 👀 I see where your research trail goes.",
      github: "GitHub is getting some attention today. 🐙",
      stackoverflow: "Stack Overflow detected in the trail. Classic developer move. 😄",
      "microsoft-learn": "Microsoft Learn + Algolassi? That's a serious study session. 📚",
      youtube: "YouTube made the developer trail. 🎬",
      medium: "A little Medium reading mixed in. 👀"
    };
    return messages[site] || "I noticed a familiar developer destination. 👀";
  }

  function chooseMessage() {
    var categories = topEntry(state.categories || {});
    var sites = topEntry(state.sites || {});
    var topic = currentTopic();

    if (sites && sites.count >= 3 && sites.name === "reddit" && sites.count % 3 === 0) {
      return { text: siteMessage("reddit"), key: "reddit-" + sites.count };
    }

    if (sites && sites.count >= 3 && sites.name === "geeksforgeeks" && sites.count % 3 === 0) {
      return { text: siteMessage("geeksforgeeks"), key: "gfg-" + sites.count };
    }

    if (categories && categories.count >= 3 && topic === categories.name) {
      return {
        text: "You're deep into <strong>" + escapeHtml(topic) + "</strong> today. 👀",
        key: "topic-" + topic
      };
    }

    if (categories && categories.count >= 5) {
      return {
        text: "Your current favorite looks like <strong>" + escapeHtml(categories.name) + "</strong>. I noticed. 😎",
        key: "favorite-" + categories.name
      };
    }

    if (state.detectedCountry) {
      return {
        text: "🌍 I know you're browsing from <strong>" + escapeHtml(state.detectedCountry) + "</strong>. I'll keep the local stuff in mind.",
        key: "country-" + state.detectedCountry
      };
    }

    return null;
  }

  function maybeShow() {
    state = loadState();
    if (sleeping()) return;

    var now = Date.now();
    if (meta.lastShownAt && now - meta.lastShownAt < DAY) return;

    var choice = chooseMessage();
    if (!choice || choice.key === meta.lastMessage) return;

    var actions = [];
    var topic = currentTopic();
    if (topic) {
      actions.push({ label: "Show my tutorials", onClick: function () { location.href = hubFor(topic); } });
    }
    actions.push({ label: "Shut up", onClick: function () {
      if (window.AlgolassiAssistant && typeof window.AlgolassiAssistant.toast === "function") {
        window.AlgolassiAssistant.toast("Okay. I'll be quiet. 😶", { duration: 5000 });
      }
    }});

    if (toast(choice.text, actions, 14000)) {
      meta.lastShownAt = now;
      meta.lastMessage = choice.key;
      saveMeta();
    }
  }

  function init() {
    meta.visits = Number(meta.visits || 0) + 1;
    meta.lastPath = location.pathname;
    saveMeta();
    setTimeout(maybeShow, 9000);
  }

  window.AlgolassiAssistantPhase5 = {
    show: maybeShow,
    state: meta,
    reset: function () {
      try { localStorage.removeItem(PHASE5_KEY); } catch (e) {}
      meta = loadMeta();
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
