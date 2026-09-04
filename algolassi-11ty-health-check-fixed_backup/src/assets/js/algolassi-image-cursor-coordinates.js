/* Algolassi Image Tools - live image pixel coordinates */
(function () {
  "use strict";

  var KEY = "__algolassiImageCursorCoordinates_v2";

  function q(id) { return document.getElementById(id); }
  function workspace() { return document.querySelector(".image-workspace"); }

  function ensurePanel() {
    var stage = q("image-preview-stage");
    if (!stage || !stage.parentNode) return null;

    var panel = q("image-cursor-coordinates");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "image-cursor-coordinates";
      panel.setAttribute("aria-live", "polite");
      panel.className = "image-cursor-coordinates";
      panel.innerHTML = '<span class="image-cursor-coordinates-title">Cursor</span>' +
        '<span id="image-cursor-coordinates-value" class="image-cursor-coordinates-value">X: — px&nbsp;&nbsp; Y: — px</span>';
      stage.parentNode.insertBefore(panel, stage);
    }
    return panel;
  }

  function setValue(text) {
    var value = q("image-cursor-coordinates-value");
    if (value) value.textContent = text;
  }

  function updateCoordinates(event) {
    var img = q("image-preview-img");
    if (!img || !img.naturalWidth || !img.naturalHeight || img.classList.contains("image-hidden")) {
      setValue("X: — px   Y: — px");
      return;
    }

    var rect = img.getBoundingClientRect();
    if (!rect.width || !rect.height ||
        event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) {
      setValue("X: — px   Y: — px");
      return;
    }

    var x = Math.max(0, Math.min(img.naturalWidth - 1,
      Math.floor((event.clientX - rect.left) * img.naturalWidth / rect.width)));
    var y = Math.max(0, Math.min(img.naturalHeight - 1,
      Math.floor((event.clientY - rect.top) * img.naturalHeight / rect.height)));

    setValue("X: " + x + " px   Y: " + y + " px");
  }

  function bindTracking() {
    var stage = q("image-preview-stage");
    if (!stage || stage.dataset.imageCursorCoordinatesBound === "1") return;
    stage.dataset.imageCursorCoordinatesBound = "1";

    stage.addEventListener("pointermove", updateCoordinates, true);
    stage.addEventListener("pointerleave", function () {
      setValue("X: — px   Y: — px");
    }, true);
  }

  function style() {
    if (document.getElementById("algolassi-image-cursor-coordinates-style")) return;
    var s = document.createElement("style");
    s.id = "algolassi-image-cursor-coordinates-style";
    s.textContent = [
      ".image-cursor-coordinates{display:flex;align-items:center;gap:.65rem;margin:0 0 .5rem;padding:.45rem .7rem;border:1px solid rgba(127,127,127,.28);border-radius:.45rem;background:rgba(127,127,127,.06);font-size:.84rem;line-height:1.2;min-height:2rem;box-sizing:border-box;pointer-events:none;user-select:none}",
      ".image-cursor-coordinates-title{font-weight:700;white-space:nowrap}",
      ".image-cursor-coordinates-value{font-variant-numeric:tabular-nums;letter-spacing:.01em}",
      "@media(max-width:640px){.image-cursor-coordinates{font-size:.78rem;gap:.45rem;padding:.4rem .55rem}}"
    ].join("");
    document.head.appendChild(s);
  }

  function init() {
    if (!workspace()) return;
    style();
    ensurePanel();
    bindTracking();
  }

  function watchForSpaStage() {
    if (!window.MutationObserver) return;
    var root = workspace();
    if (!root || root.dataset.imageCursorCoordinatesRootObserver === "1") return;
    root.dataset.imageCursorCoordinatesRootObserver = "1";
    var observer = new MutationObserver(function () {
      ensurePanel();
      bindTracking();
    });
    observer.observe(root, { childList: true, subtree: true });
  }

  if (!window[KEY]) {
    window[KEY] = { init: init };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        init();
        watchForSpaStage();
      }, { once: true });
    } else {
      init();
      watchForSpaStage();
    }
  } else {
    window[KEY].init();
  }
})();
