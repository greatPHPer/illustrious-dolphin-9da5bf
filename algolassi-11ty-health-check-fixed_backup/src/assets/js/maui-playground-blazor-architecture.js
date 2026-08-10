/* Algolassi MAUI Hybrid playground - Blazor Hybrid architecture preview */
(function () {
  "use strict";

  function render() {
    var params = new URLSearchParams(window.location.search || "");
    if ((params.get("demo") || "").toLowerCase().trim() !== "blazor-hybrid-architecture") return;

    var preview = document.getElementById("maui-browser-preview");
    if (!preview) return;
    var content = preview.querySelector(".maui-browser-content");
    if (!content || content.__algolassiHybridBound) return;

    content.__algolassiHybridBound = true;
    content.innerHTML = '<h2>Blazor Hybrid UI</h2><p>This Razor component represents the UI hosted by a .NET MAUI BlazorWebView.</p><p>Native MAUI code can host this Razor UI while shared services connect the layers.</p><button type="button" id="hybrid-change-message">Change message</button><p id="hybrid-message"><strong>Razor is running in the playground!</strong></p>';

    var button = content.querySelector("#hybrid-change-message");
    var message = content.querySelector("#hybrid-message strong");
    if (!button || !message) return;

    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      message.textContent = "The Hybrid UI re-rendered successfully!";
    });
  }

  function start() {
    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      render();
      var params = new URLSearchParams(window.location.search || "");
      if ((params.get("demo") || "").toLowerCase().trim() === "blazor-hybrid-architecture" && document.getElementById("hybrid-change-message")) {
        clearInterval(timer);
      } else if (attempts > 100) {
        clearInterval(timer);
      }
    }, 100);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  window.addEventListener("algolassi:spa-navigation", start);
})();
