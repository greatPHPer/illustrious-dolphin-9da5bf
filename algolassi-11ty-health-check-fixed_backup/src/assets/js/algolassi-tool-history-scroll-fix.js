(function () {
  "use strict";

  var STORAGE_KEY = "algolassi_developer_tool_history_v1";
  var OFFSET = 250;

  function getScrollOffset() {
    var isAndroid = /Android/i.test(navigator.userAgent || "");
    var isTimestamp = /\/developer-tools\/unix-timestamp-converter\/?$/.test(window.location.pathname);

    if (isAndroid) return isTimestamp ? 650 : 400;
    return isTimestamp ? 400 : OFFSET;
  }

  function findSavedEntry(item) {
    var id = item.getAttribute("data-history-id");
    if (!id) return null;
    try {
      var history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(history) ? history.find(function (entry) { return entry && entry.id === id; }) : null;
    } catch (error) {
      return null;
    }
  }

  function findScrollTarget(entry) {
    // Prefer the first saved input field for the current tool.
    var fields = entry && Array.isArray(entry.input) ? entry.input : [];
    for (var i = 0; i < fields.length; i++) {
      var saved = fields[i];
      if (!saved) continue;

      if (saved.id) {
        var byId = document.getElementById(saved.id);
        if (byId) return byId;
      }

      if (saved.name) {
        try {
          var byName = document.querySelector('.dt [name="' + CSS.escape(saved.name) + '"]');
          if (byName) return byName;
        } catch (error) {}
      }
    }

    // If a tool exposes an input anchor such as #input-json or #jwt-input,
    // use the first matching input-related anchor.
    var anchors = document.querySelectorAll('.dt a[href^="#"]');
    for (var j = 0; j < anchors.length; j++) {
      var href = anchors[j].getAttribute("href") || "";
      if (/^#(?:input|.*-input|input-)/i.test(href)) {
        var targetId = href.slice(1);
        var target = document.getElementById(targetId);
        if (target) return target;
        return anchors[j];
      }
    }

    // GUID and other tools without anchors: use the first real input/control.
    var fallback = document.querySelector('.dt input:not([type=button]):not([type=submit]):not([type=hidden]), .dt textarea, .dt select');
    if (fallback) return fallback;

    return document.querySelector('.dt .box') || document.querySelector('.dt');
  }

  function resetImageHistoryHorizontalScroll() {
    var history = document.getElementById("image-history");
    if (!history) return;
    history.scrollLeft = Number.MIN_SAFE_INTEGER;
  }

  function bindImageHistoryScrollReset() {
    var history = document.getElementById("image-history");
    if (!history || history.dataset.imageHistoryScrollResetBound === "1") return;
    history.dataset.imageHistoryScrollResetBound = "1";
    resetImageHistoryHorizontalScroll();

    if (window.MutationObserver) {
      new MutationObserver(function () {
        resetImageHistoryHorizontalScroll();
      }).observe(history, { childList: true });
    }
  }

  function initImageHistoryScrollReset() {
    bindImageHistoryScrollReset();
    window.requestAnimationFrame(bindImageHistoryScrollReset);
  }

  document.addEventListener("click", function (event) {
    var item = event.target && event.target.closest ? event.target.closest(".althp-item") : null;
    if (!item) return;

    window.setTimeout(function () {
      var entry = findSavedEntry(item);
      var target = findScrollTarget(entry);
      if (!target) return;

      var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      var targetTop = target.getBoundingClientRect().top + scrollTop;
      window.scrollTo({ top: Math.max(0, targetTop - getScrollOffset()), behavior: "smooth" });
    }, 120);
  }, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initImageHistoryScrollReset, { once: true });
  } else {
    initImageHistoryScrollReset();
  }

  window.addEventListener("algolassi:spa-navigation", function () {
    window.requestAnimationFrame(initImageHistoryScrollReset);
  });
})();
