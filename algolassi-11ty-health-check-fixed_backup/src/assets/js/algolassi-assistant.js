/*
 * Algolassi Assistant — Phase 2
 *
 * Privacy-first behavior layer for the static Eleventy site.
 * This script never reads browser history. It only remembers lightweight
 * interactions that happen on Algolassi itself.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "algolassi_assistant_v2";
  var TOAST_MS = 12000;
  var SLEEP_MS = 10 * 60 * 1000;
  var COOLDOWN_MS = 45 * 1000;
  var state = loadState();
  var toastTimer = null;
  var lastToastAt = 0;

  var SITE_RULES = [
    { key: "reddit", hosts: ["reddit.com", "old.reddit.com"], label: "Reddit", login: "https://www.reddit.com/login/" },
    { key: "geeksforgeeks", hosts: ["geeksforgeeks.org"], label: "GeeksforGeeks", login: "https://auth.geeksforgeeks.org/" },
    { key: "github", hosts: ["github.com"], label: "GitHub", login: "https://github.com/login" },
    { key: "stackoverflow", hosts: ["stackoverflow.com"], label: "Stack Overflow", login: "https://stackoverflow.com/users/login" },
    { key: "microsoftlearn", hosts: ["learn.microsoft.com"], label: "Microsoft Learn", login: "https://learn.microsoft.com/users/login" },
    { key: "youtube", hosts: ["youtube.com", "youtu.be"], label: "YouTube", login: "https://accounts.google.com/" },
    { key: "medium", hosts: ["medium.com"], label: "Medium", login: "https://medium.com/m/signin" }
  ];

  var CATEGORY_RULES = [
    { key: "csharp", words: ["c#", "csharp", "c-sharp"], label: "C#", url: "/csharp-tutorials/" },
    { key: "dotnet", words: [".net", "dotnet", "asp.net"], label: ".NET", url: "/net-tutorials/" },
    { key: "aspnetcore", words: ["asp.net core", "dependency injection", "minimal api", "middleware"], label: "ASP.NET Core", url: "/asp-net-core-tutorials/" },
    { key: "blazor", words: ["blazor"], label: "Blazor", url: "/blazor-tutorials/" },
    { key: "sqlserver", words: ["sql server", "mssql", "t-sql", "stored procedure"], label: "SQL Server", url: "/sql-server-tutorials/" }
  ];

  function defaults() {
    return {
      hideCount: 0,
      shutUpCount: 0,
      sleepingUntil: 0,
      sites: {},
      categories: {},
      copyNotices: 0,
      pageViews: 0,
      lastPage: "",
      lastCategoryToastAt: 0,
      lastSiteToastAt: 0,
      lastFirstVisitToast: ""
    };
  }

  function loadState() {
    var base = defaults();
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;
      var parsed = JSON.parse(raw);
      return Object.assign(base, parsed);
    } catch (e) {
      return base;
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
    if (!options.force && !options.ignoreCooldown && Date.now() - lastToastAt < COOLDOWN_MS) return;

    lastToastAt = Date.now();
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
      setTimeout(function () {
        if (host.contains(toast)) host.removeChild(toast);
      }, 350);
    }, options.duration || TOAST_MS);
  }

  function hideAssistant() {
    var host = document.getElementById("algolassi-assistant-host");
    if (host) host.innerHTML = "";
  }

  function findSite(url) {
    try {
      var host = new URL(url, location.href).hostname.toLowerCase();
      for (var i = 0; i < SITE_RULES.length; i++) {
        for (var j = 0; j < SITE_RULES[i].hosts.length; j++) {
          var ruleHost = SITE_RULES[i].hosts[j];
          if (host === ruleHost || host.endsWith("." + ruleHost)) return SITE_RULES[i];
        }
      }
    } catch (e) {}
    return null;
  }

  function recordExternalSite(rule) {
    if (!rule) return;
    state.sites[rule.key] = Number(state.sites[rule.key] || 0) + 1;
    saveState();

    var count = state.sites[rule.key];
    if (count === 3 && Date.now() - state.lastSiteToastAt > 5 * 60 * 1000) {
      state.lastSiteToastAt = Date.now();
      saveState();
      var loginText = rule.key === "reddit" || rule.key === "geeksforgeeks"
        ? rule.label + " again? 👀<br><br>Want to sign in?"
        : "You keep visiting " + rule.label + ". 👀<br><br>Want to sign in?";
      showToast(loginText, {
        ignoreCooldown: true,
        actions: [{
          label: "Open " + rule.label,
          onClick: function () {
            window.open(rule.login, "_blank", "noopener,noreferrer");
          }
        }]
      });
    }
  }

  function pageText() {
    var title = document.title || "";
    var heading = document.querySelector("h1");
    var text = title + " " + (heading ? heading.textContent : "") + " " + location.pathname;
    return text.toLowerCase();
  }

  function detectCategory() {
    var text = pageText();
    var matches = [];
    CATEGORY_RULES.forEach(function (rule) {
      for (var i = 0; i < rule.words.length; i++) {
        if (text.indexOf(rule.words[i].toLowerCase()) !== -1) {
          matches.push(rule);
          break;
        }
      }
    });
    return matches;
  }

  function recordCategories() {
    var matches = detectCategory();
    matches.forEach(function (rule) {
      state.categories[rule.key] = Number(state.categories[rule.key] || 0) + 1;
    });
    state.pageViews = Number(state.pageViews || 0) + 1;
    state.lastPage = location.pathname;
    saveState();
    return matches;
  }

  function topCategory() {
    var best = null;
    var bestCount = 0;
    CATEGORY_RULES.forEach(function (rule) {
      var count = Number(state.categories[rule.key] || 0);
      if (count > bestCount) {
        best = rule;
        bestCount = count;
      }
    });
    return best ? { rule: best, count: bestCount } : null;
  }

  function maybeCategoryToast(matches) {
    if (isSleeping() || !matches.length) return;
    if (Number(state.pageViews || 0) < 4) return;
    if (Date.now() - Number(state.lastCategoryToastAt || 0) < 10 * 60 * 1000) return;

    var top = topCategory();
    if (!top || top.count < 3) return;

    state.lastCategoryToastAt = Date.now();
    saveState();

    showToast("You've been spending some time with <strong>" + escapeHtml(top.rule.label) + "</strong>. 👀<br><br>Want the tutorial hub?", {
      ignoreCooldown: true,
      actions: [{
        label: "Open " + top.rule.label,
        onClick: function () { window.location.href = top.rule.url; }
      }]
    });
  }

  function handleHide() {
    state.hideCount = Number(state.hideCount || 0) + 1;
    saveState();
    if (state.hideCount === 1) {
      showToast("Hiding..", { duration: 5000, ignoreCooldown: true });
    } else if (state.hideCount === 2) {
      showToast("2nd time? noted!", { duration: 5000, ignoreCooldown: true });
    } else {
      showToast("3rd time noted!<br>I'll stay quiet now. 😶", { duration: 5000, ignoreCooldown: true });
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
      ignoreCooldown: true,
      actions: [{ label: "Shut up", onClick: handleShutUp }]
    });
  }

  function handleCopy() {
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
      var rule = findSite(target.href);
      if (rule) recordExternalSite(rule);
    });
    document.addEventListener("copy", handleCopy);
  }

  function firstVisitToast() {
    if (isSleeping()) return;
    if (state.pageViews > 1 || state.hideCount || state.copyNotices || Object.keys(state.sites).length) return;
    showToast("Hi! I'm the Algolassi Assistant. 👋", {
      actions: [{ label: "Hide", onClick: handleHide }]
    });
  }

  function init() {
    setupInteractions();
    var categories = recordCategories();

    window.AlgolassiAssistant = {
      toast: showToast,
      hide: hideAssistant,
      awaken: function () {
        state.sleepingUntil = 0;
        state.shutUpCount = 0;
        saveState();
        showToast("I'm awake again. 👋", { force: true });
      },
      resetMemory: function () {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        location.reload();
      },
      state: state
    };

    setTimeout(firstVisitToast, 2500);
    setTimeout(function () { maybeCategoryToast(categories); }, 6000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
