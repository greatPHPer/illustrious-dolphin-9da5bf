/* Algolassi - site-wide Back to top */
(function () {
  "use strict";

  var BUTTON_ID = "algolassi-back-to-top";
  var SHOW_AFTER = 500;

  function ensureButton() {
    var existing = document.getElementById(BUTTON_ID);
    if (existing) return existing;

    var button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.setAttribute("aria-label", "Back to top");
    button.setAttribute("title", "Back to top");
    button.innerHTML = "<span aria-hidden=\"true\">↑</span><span class=\"algolassi-back-to-top-label\">Top</span>";

    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.body.appendChild(button);
    return button;
  }

  function update() {
    var button = ensureButton();
    button.classList.toggle("algolassi-back-to-top-visible", window.scrollY > SHOW_AFTER);
  }

  function init() {
    ensureButton();
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("algolassi:spa-navigation", function () {
      window.requestAnimationFrame(update);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
