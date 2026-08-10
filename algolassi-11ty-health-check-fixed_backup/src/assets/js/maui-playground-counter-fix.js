/* Algolassi MAUI Hybrid playground - Counter demo fix */
(function () {
  "use strict";

  function startCounterDemo() {
    var params = new URLSearchParams(window.location.search || "");
    if ((params.get("demo") || "").toLowerCase().trim() !== "razor-counter") return;

    var preview = document.getElementById("maui-browser-preview");
    if (!preview) return;
    var content = preview.querySelector(".maui-browser-content");
    if (!content || content.__algolassiCounterBound) return;

    content.__algolassiCounterBound = true;
    var count = 0;
    content.innerHTML = '<h2>Counter</h2>' +
      '<p>Current value: <strong id="algolassi-counter-value">0</strong></p>' +
      '<button type="button" id="algolassi-counter-increment">Increment</button>';

    var value = content.querySelector("#algolassi-counter-value");
    var button = content.querySelector("#algolassi-counter-increment");
    button.addEventListener("click", function () {
      count++;
      value.textContent = String(count);
    });
  }

  function waitForPreview() {
    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      var preview = document.getElementById("maui-browser-preview");
      if (preview) {
        clearInterval(timer);
        setTimeout(startCounterDemo, 100);
      } else if (attempts > 100) {
        clearInterval(timer);
      }
    }, 100);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", waitForPreview);
  else waitForPreview();
  window.addEventListener("algolassi:spa-navigation", function () {
    setTimeout(startCounterDemo, 100);
  });
})();
