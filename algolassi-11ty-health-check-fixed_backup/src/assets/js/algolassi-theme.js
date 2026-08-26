/* =========================================================
   ALGOLASSI THEME CONTROLLER
   Auto (system default) / Light / Dark
   ========================================================= */
(function () {
  "use strict";

  var STORAGE_KEY = "algolassi_theme";
  var modes = ["auto", "light", "dark"];
  var labels = {
    auto: "Auto",
    light: "Light",
    dark: "Dark"
  };
  var icons = {
    auto: "◐",
    light: "☀",
    dark: "☾"
  };

  function getSavedTheme() {
    try {
      var value = localStorage.getItem(STORAGE_KEY);
      return modes.indexOf(value) >= 0 ? value : "auto";
    } catch (e) {
      return "auto";
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
  }

  function applyTheme(theme) {
    var root = document.documentElement;

    if (theme === "auto") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }

    root.style.colorScheme = theme === "auto" ? "light dark" : theme;
  }

  function ensureAuthThemeStyles() {
    if (document.getElementById("algolassi-auth-theme-style")) return;

    var style = document.createElement("style");
    style.id = "algolassi-auth-theme-style";
    style.textContent =
      "#algolassi-google-auth{color:inherit}" +
      "html[data-theme=\"dark\"] #algolassi-google-auth > span{color:#e7edf5 !important}" +
      "html[data-theme=\"dark\"] #algolassi-google-login," +
      "html[data-theme=\"dark\"] #algolassi-google-signout{" +
        "background:#171d26 !important;" +
        "color:#e7edf5 !important;" +
        "border-color:#465365 !important;" +
      "}" +
      "html[data-theme=\"dark\"] #algolassi-google-login:hover," +
      "html[data-theme=\"dark\"] #algolassi-google-signout:hover{" +
        "background:#202936 !important;" +
        "border-color:#5d6a7b !important;" +
      "}" +
      "@media (prefers-color-scheme: dark) {" +
        "html:not([data-theme=\"light\"]) #algolassi-google-auth > span{color:#e7edf5 !important}" +
        "html:not([data-theme=\"light\"]) #algolassi-google-login," +
        "html:not([data-theme=\"light\"]) #algolassi-google-signout{" +
          "background:#171d26 !important;" +
          "color:#e7edf5 !important;" +
          "border-color:#465365 !important;" +
        "}" +
        "html:not([data-theme=\"light\"]) #algolassi-google-login:hover," +
        "html:not([data-theme=\"light\"]) #algolassi-google-signout:hover{" +
          "background:#202936 !important;" +
          "border-color:#5d6a7b !important;" +
        "}" +
      "}";

    document.head.appendChild(style);
  }

  function updateButton(theme) {
    var button = document.getElementById("algolassi-theme-button");
    if (!button) return;

    button.querySelector(".algolassi-theme-icon").textContent = icons[theme];
    button.querySelector(".algolassi-theme-label").textContent = labels[theme];
    button.setAttribute("aria-label", "Theme: " + labels[theme] + ". Click to change.");
    button.setAttribute("title", "Theme: " + labels[theme] + " (click to change)");
  }

  function mountControl() {
    var host = document.getElementById("algolassi-theme-control-host");
    if (!host || document.getElementById("algolassi-theme-button")) return;

    var button = document.createElement("button");
    button.type = "button";
    button.id = "algolassi-theme-button";
    button.className = "algolassi-theme-button";
    button.innerHTML = '<span class="algolassi-theme-icon" aria-hidden="true">◐</span><span class="algolassi-theme-label">Auto</span>';

    button.addEventListener("click", function () {
      var current = getSavedTheme();
      var next = modes[(modes.indexOf(current) + 1) % modes.length];
      saveTheme(next);
      applyTheme(next);
      updateButton(next);
    });

    host.appendChild(button);
    updateButton(getSavedTheme());
  }

  function normalizePath(pathname) {
    return (pathname || "/").replace(/\/+$/, "") || "/";
  }

  function navSectionForPath(pathname) {
    var path = normalizePath(pathname);

    if (path === "/tutorials") return "/tutorials/";

    if (
      path === "/csharp-tutorials" ||
      [
        "/async-await-csharp-best-practices",
        "/central-package-management-dotnet",
        "/clean-restore-nuget-packages-visual-studio",
        "/direct-vs-transitive-nuget-dependencies",
        "/fix-nu1107-version-conflict-nuget-package",
        "/fix-nu1605-nuget-package-downgrade",
        "/fix-nuget-package-version-conflicts-visual-studio",
        "/how-to-find-nuget-package-causing-dependency-conflict",
        "/package-reference-vs-packages-config",
        "/update-nuget-packages-safely"
      ].indexOf(path) >= 0
    ) return "/csharp-tutorials/";

    if (
      path === "/net-tutorials" ||
      path === "/entity-framework-core-vs-adonet"
    ) return "/net-tutorials/";

    if (
      path === "/asp-net-core-tutorials" ||
      [
        "/aspnet-core-dependency-injection-explained",
        "/common-rdlc-errors-fixes-asp-net-ssrs",
        "/fix-iis-http-error-500-19-aspnet-core",
        "/register-services-asp-net-core-dependency-injection",
        "/singleton-scoped-transient-asp-net-core",
        "/what-is-dependency-injection-asp-net-core"
      ].indexOf(path) >= 0
    ) return "/asp-net-core-tutorials/";

    if (
      path === "/blazor-tutorials" ||
      [
        "/blazor-javascript-interop-a-practical-guide",
        "/blazor-server-vs-webassembly",
        "/signalr-aspnet-core-blazor-guide"
      ].indexOf(path) >= 0
    ) return "/blazor-tutorials/";

    if (
      path === "/sql-server-tutorials" ||
      [
        "/sql-server-cte-vs-temporary-tables",
        "/sql-server-indexing-explained"
      ].indexOf(path) >= 0
    ) return "/sql-server-tutorials/";

    return null;
  }

  function updateTopNavActiveState() {
    var nav = document.querySelector(".site-nav");
    if (!nav) return;

    var activeHref = navSectionForPath(window.location.pathname);
    var links = nav.querySelectorAll("a");

    links.forEach(function (link) {
      var isCurrent = !!activeHref && link.getAttribute("href") === activeHref;
      link.classList.toggle("is-current", isCurrent);
      if (isCurrent) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function initialize() {
    var theme = getSavedTheme();
    ensureAuthThemeStyles();
    applyTheme(theme);
    mountControl();
    updateButton(theme);
    updateTopNavActiveState();
  }

  /* Apply before first paint when possible so the page does not flash bright. */
  initialize();

  document.addEventListener("DOMContentLoaded", initialize, { once: true });
  window.addEventListener("algolassi:spa-navigation", function () {
    requestAnimationFrame(function () {
      ensureAuthThemeStyles();
      applyTheme(getSavedTheme());
      mountControl();
      updateButton(getSavedTheme());
      updateTopNavActiveState();
    });
  });
})();
