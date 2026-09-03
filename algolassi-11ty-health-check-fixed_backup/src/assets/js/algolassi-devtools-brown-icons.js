/* =========================================================
   ALGOLASSI DEVELOPER TOOLS — BROWN ICON SYSTEM
   Replaces native color emoji inside Developer Tools breadcrumbs
   with monochrome SVG icons that inherit the brown accent color.
   ========================================================= */
(function () {
  "use strict";

  var ICONS = {
    "🏠": '<path d="M3 10.6 12 3l9 7.6"/><path d="M5.5 9.4V21h13V9.4"/><path d="M9 21v-6.5h6V21"/>',
    "🛠️": '<path d="m14 7 3-3 3 3-3 3"/><path d="m3 21 9-9"/><path d="m12 12 3 3"/><path d="M7 4.5a4.5 4.5 0 0 0 5.8 5.8L20 17.5a2.5 2.5 0 0 1-3.5 3.5l-7.2-7.2A4.5 4.5 0 0 0 3.5 8"/>',
    "🖼️": '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4.5 17 5-5 3.5 3 2.5-2.5 4 4"/>',
    "🔄": '<path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M19.2 12a7 7 0 0 0-12.4-4.4L4 10"/><path d="M4.8 12a7 7 0 0 0 12.4 4.4L20 14"/>',
    "{}": '<path d="M8 4 4 12l4 8M16 4l4 8-4 8M13 3l-2 18"/>',
    "🧰": '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7M3 12h18M10 12v2h4v-2"/>',
    "📄": '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 16h6"/>'
  };

  var BROWN = "#8b5a2b";
  var observedRoot = null;
  var refreshTimer = 0;

  function makeIcon(markup) {
    var span = document.createElement("span");
    span.className = "algolassi-devtools-brown-icon";
    span.setAttribute("aria-hidden", "true");
    span.style.color = BROWN;

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.innerHTML = markup;
    span.appendChild(svg);
    return span;
  }

  function replaceSymbols(element) {
    if (!element || element.nodeType !== 1) return;

    var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (node.parentElement && node.parentElement.closest(".algolassi-devtools-brown-icon")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(function (node) {
      var value = node.nodeValue;
      var parent = node.parentNode;
      if (!parent) return;

      Object.keys(ICONS).forEach(function (symbol) {
        var index = value.indexOf(symbol);
        if (index === -1) return;

        var before = value.slice(0, index);
        var after = value.slice(index + symbol.length);
        if (before) parent.insertBefore(document.createTextNode(before), node);
        parent.insertBefore(makeIcon(ICONS[symbol]), node);
        node.nodeValue = after;
        value = after;
      });
    });
  }

  function addStyles() {
    if (document.getElementById("algolassi-devtools-brown-icon-style")) return;
    var style = document.createElement("style");
    style.id = "algolassi-devtools-brown-icon-style";
    style.textContent =
      ".algolassi-toolmenu-home .algolassi-devtools-brown-icon," +
      ".algolassi-toolmenu-managed .algolassi-devtools-brown-icon{" +
        "display:inline-flex!important;align-items:center!important;justify-content:center!important;" +
        "width:1em!important;height:1em!important;min-width:1em!important;" +
        "margin-right:.3em!important;vertical-align:-.14em!important;" +
        "color:#8b5a2b!important;flex:0 0 auto!important;" +
      "}" +
      ".algolassi-toolmenu-home .algolassi-devtools-brown-icon svg," +
      ".algolassi-toolmenu-managed .algolassi-devtools-brown-icon svg{" +
        "width:100%!important;height:100%!important;display:block!important;" +
        "fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;" +
        "stroke-linecap:round!important;stroke-linejoin:round!important;" +
      "}";
    document.head.appendChild(style);
  }

  function scan() {
    addStyles();
    document.querySelectorAll(".algolassi-toolmenu-managed, .algolassi-toolmenu-home").forEach(replaceSymbols);
  }

  function scheduleScan() {
    if (refreshTimer) return;
    refreshTimer = window.setTimeout(function () {
      refreshTimer = 0;
      scan();
    }, 0);
  }

  function observe() {
    var breadcrumbs = document.querySelector(".breadcrumbs");
    if (!breadcrumbs || observedRoot === breadcrumbs || !("MutationObserver" in window)) return;

    observedRoot = breadcrumbs;
    var observer = new MutationObserver(function () {
      scheduleScan();
    });
    observer.observe(breadcrumbs, { childList: true, subtree: true, characterData: true });
  }

  function loadTutorialQuiz() {
    if (document.getElementById("algolassi-tutorial-quiz-script")) return;
    var script = document.createElement("script");
    script.id = "algolassi-tutorial-quiz-script";
    script.src = "/assets/js/algolassi-tutorial-quiz.js?v=20260903-quiz-2";
    script.defer = true;
    script.async = true;
    document.head.appendChild(script);
  }

  function init() {
    scan();
    observe();
    loadTutorialQuiz();
  }

  window.addEventListener("load", init);
  window.addEventListener("algolassi:spa-navigation", function () {
    window.requestAnimationFrame(function () {
      init();
      window.requestAnimationFrame(scan);
    });
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    window.requestAnimationFrame(init);
  }
})();
