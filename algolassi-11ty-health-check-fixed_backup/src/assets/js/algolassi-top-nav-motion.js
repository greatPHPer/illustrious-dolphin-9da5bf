/* =========================================================
   ALGOLASSI TOP NAV — ACTIVE TUTORIAL DETECTION
   ========================================================= */
(function () {
  "use strict";

  var navSelector = ".site-nav";
  var linkSelector = ".site-nav > a";

  function normalizePath(pathname) {
    var value = pathname || "/";
    if (value.length > 1 && value.charAt(value.length - 1) !== "/") value += "/";
    return value;
  }

  function getCurrentMenuKey() {
    var path = normalizePath(window.location.pathname);

    var exact = {
      "/csharp-tutorials/": "csharp",
      "/net-tutorials/": "net",
      "/asp-net-core-tutorials/": "aspnetcore",
      "/blazor-tutorials/": "blazor",
      "/sql-server-tutorials/": "sql"
    };

    if (exact[path]) return exact[path];

    var trigger = document.querySelector(
      ".breadcrumbs .breadcrumb-trigger[data-menu=\"csharp\"]," +
      ".breadcrumbs .breadcrumb-trigger[data-menu=\"net\"]," +
      ".breadcrumbs .breadcrumb-trigger[data-menu=\"aspnetcore\"]," +
      ".breadcrumbs .breadcrumb-trigger[data-menu=\"blazor\"]," +
      ".breadcrumbs .breadcrumb-trigger[data-menu=\"sql\"]"
    );

    return trigger ? trigger.getAttribute("data-menu") : "";
  }

  function setActiveNav() {
    var nav = document.querySelector(navSelector);
    if (!nav) return;

    var key = getCurrentMenuKey();
    var path = normalizePath(window.location.pathname);

    nav.querySelectorAll(linkSelector).forEach(function (link) {
      link.classList.remove("is-algolassi-nav-active");

      var href;
      try {
        href = new URL(link.href, window.location.href);
      } catch (e) {
        href = null;
      }

      if (!href) return;
      var hrefPath = normalizePath(href.pathname);

      var active = false;
      if (key === "csharp" && hrefPath === "/csharp-tutorials/") active = true;
      if (key === "net" && hrefPath === "/net-tutorials/") active = true;
      if (key === "aspnetcore" && hrefPath === "/asp-net-core-tutorials/") active = true;
      if (key === "blazor" && hrefPath === "/blazor-tutorials/") active = true;
      if (key === "sql" && hrefPath === "/sql-server-tutorials/") active = true;

      if (!key && hrefPath === path && [
        "/tutorials/",
        "/csharp-tutorials/",
        "/net-tutorials/",
        "/asp-net-core-tutorials/",
        "/blazor-tutorials/",
        "/sql-server-tutorials/",
        "/newsletter/",
        "/about-algolassi/"
      ].indexOf(hrefPath) >= 0) {
        active = true;
      }

      if (active) link.classList.add("is-algolassi-nav-active");
    });
  }

  function setupFocusMotion() {
    var nav = document.querySelector(navSelector);
    if (!nav || nav.dataset.algolassiNavMotionInitialized === "true") return;
    nav.dataset.algolassiNavMotionInitialized = "true";

    nav.addEventListener("pointerover", function (event) {
      var link = event.target && event.target.closest ? event.target.closest(linkSelector) : null;
      if (!link || !nav.contains(link)) return;
      nav.classList.add("has-algolassi-nav-focus");
      nav.querySelectorAll(linkSelector).forEach(function (item) {
        item.classList.toggle("is-algolassi-nav-focused", item === link);
      });
    });

    nav.addEventListener("pointerout", function (event) {
      var link = event.target && event.target.closest ? event.target.closest(linkSelector) : null;
      if (!link || !nav.contains(link)) return;
      var related = event.relatedTarget;
      if (related && nav.contains(related)) return;
      nav.classList.remove("has-algolassi-nav-focus");
      nav.querySelectorAll(linkSelector).forEach(function (item) {
        item.classList.remove("is-algolassi-nav-focused");
      });
    });

    nav.addEventListener("focusin", function (event) {
      var link = event.target && event.target.closest ? event.target.closest(linkSelector) : null;
      if (!link || !nav.contains(link)) return;
      nav.classList.add("has-algolassi-nav-focus");
      nav.querySelectorAll(linkSelector).forEach(function (item) {
        item.classList.toggle("is-algolassi-nav-focused", item === link);
      });
    });

    nav.addEventListener("focusout", function (event) {
      var related = event.relatedTarget;
      if (related && nav.contains(related)) return;
      nav.classList.remove("has-algolassi-nav-focus");
      nav.querySelectorAll(linkSelector).forEach(function (item) {
        item.classList.remove("is-algolassi-nav-focused");
      });
    });
  }

  function initialize() {
    setActiveNav();
    setupFocusMotion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }

  window.addEventListener("algolassi:spa-navigation", function () {
    requestAnimationFrame(setActiveNav);
  });
})();
