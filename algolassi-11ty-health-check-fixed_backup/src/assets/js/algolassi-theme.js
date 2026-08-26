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

  function initialize() {
    var theme = getSavedTheme();
    ensureAuthThemeStyles();
    applyTheme(theme);
    mountControl();
    updateButton(theme);
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
    });
  });
})();
