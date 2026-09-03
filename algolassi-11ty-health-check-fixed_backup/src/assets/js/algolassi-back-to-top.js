/* Algolassi - site-wide Back to top */
(function () {
  "use strict";

  var BUTTON_ID = "algolassi-back-to-top";
  var SHOW_AFTER = 500;
  var GAP = 14;

  function baseBottom() {
    return window.innerWidth <= 600 ? 10 : 18;
  }

  function visibleRect(el) {
    if (!el) return null;
    var cs = window.getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return null;
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 ? rect : null;
  }

  function getFloatingElements() {
    return [
      document.getElementById("algolassi-news-reopen"),
      document.getElementById("algolassi-radio-reopen"),
      document.getElementById("algolassi-chat-reopen-button"),
      document.getElementById("algolassi-radio-host"),
      document.getElementById("algolassi-chat-presence-host")
    ];
  }

  function reposition() {
    var button = document.getElementById(BUTTON_ID);
    if (!button) return;

    var bottom = baseBottom();
    getFloatingElements().forEach(function (element) {
      var rect = visibleRect(element);
      if (!rect) return;
      bottom = Math.max(bottom, window.innerHeight - rect.top + GAP);
    });

    button.style.setProperty("bottom", bottom + "px", "important");
  }

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
    reposition();
  }

  function init() {
    ensureButton();
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", reposition, { passive: true });
    window.addEventListener("algolassi:spa-navigation", function () {
      window.requestAnimationFrame(update);
    });
    window.addEventListener("algolassi:radio-layout-change", reposition);
    window.addEventListener("algolassi:news-layout-change", reposition);
    window.addEventListener("algolassi:news-reopen", reposition);
    window.addEventListener("algolassi:chat-layout-change", reposition);
    window.addEventListener("algolassi:chat-restored", reposition);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", reposition, { passive: true });
      window.visualViewport.addEventListener("scroll", reposition, { passive: true });
    }

    if (window.MutationObserver) {
      var observer = new MutationObserver(function () {
        window.requestAnimationFrame(reposition);
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
