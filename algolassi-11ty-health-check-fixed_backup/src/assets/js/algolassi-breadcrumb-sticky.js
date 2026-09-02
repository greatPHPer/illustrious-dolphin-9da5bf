/* =========================================================
   ALGOLASSI STICKY BREADCRUMB
   Keeps the existing breadcrumb navigation visible while reading.
   The sticky offset follows the actual responsive header height.
   ========================================================= */
(function () {
  "use strict";

  var STYLE_ID = "algolassi-breadcrumb-sticky-style";
  var attached = false;
  var resizeObserver = null;

  function getHeader() {
    return document.querySelector(".site-header");
  }

  function updateHeaderHeight() {
    var header = getHeader();
    var height = header ? header.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty(
      "--algolassi-header-height",
      Math.ceil(height) + "px"
    );
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;

    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      ".breadcrumbs.algolassi-breadcrumb-sticky{" +
        "position:sticky!important;" +
        "top:calc(var(--algolassi-header-height, 0px) + 6px)!important;" +
        "z-index:900!important;" +
        "background:var(--bg,#fff)!important;" +
        "border-bottom:1px solid rgba(229,231,235,.85)!important;" +
        "box-shadow:0 4px 14px rgba(16,24,40,.06)!important;" +
        "padding-top:8px!important;" +
        "padding-bottom:8px!important;" +
      "}" +
      ".breadcrumbs.algolassi-breadcrumb-sticky:focus-within{" +
        "z-index:950!important;" +
      "}" +
      "@media(max-width:700px){" +
        ".breadcrumbs.algolassi-breadcrumb-sticky{" +
          "flex-wrap:nowrap!important;" +
          "overflow-x:auto!important;" +
          "overflow-y:visible!important;" +
          "white-space:nowrap!important;" +
          "-webkit-overflow-scrolling:touch!important;" +
          "scrollbar-width:none!important;" +
          "padding-left:2px!important;" +
          "padding-right:2px!important;" +
        "}" +
        ".breadcrumbs.algolassi-breadcrumb-sticky::-webkit-scrollbar{" +
          "display:none!important;" +
        "}" +
      "}";

    document.head.appendChild(style);
  }

  function apply() {
    var breadcrumbs = document.querySelector(".breadcrumbs");
    if (!breadcrumbs) return;

    installStyle();
    breadcrumbs.classList.add("algolassi-breadcrumb-sticky");
    updateHeaderHeight();

    if (!attached) {
      attached = true;
      var header = getHeader();
      if (header && "ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(updateHeaderHeight);
        resizeObserver.observe(header);
      }
      window.addEventListener("resize", updateHeaderHeight, { passive: true });
    }
  }

  function init() {
    requestAnimationFrame(apply);
  }

  window.addEventListener("load", init, { once: true });
  window.addEventListener("algolassi:spa-navigation", init);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
