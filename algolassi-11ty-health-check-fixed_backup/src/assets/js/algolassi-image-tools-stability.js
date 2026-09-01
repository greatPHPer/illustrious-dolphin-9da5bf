/* Algolassi Image Tools stability guard: prevent overlapping live-preview work. */
(function () {
  "use strict";

  var KEY = "__algolassiImageToolsStability_v1";
  var timer = null;
  var listenerBound = false;

  function q(id) { return document.getElementById(id); }
  function workspace() { return document.querySelector(".image-workspace"); }

  function patchScaleInput(id, changed) {
    var input = q(id);
    if (!input || input.dataset.imageStabilityPatched === "1") return;

    var replacement = input.cloneNode(true);
    replacement.dataset.imageStabilityPatched = "1";
    input.parentNode.replaceChild(replacement, input);

    replacement.addEventListener("input", function () {
      var ws = workspace();
      if (!ws) return;

      var width = q("scale-width");
      var height = q("scale-height");
      var lock = q("scale-lock-ratio");
      var item = ws.querySelector("#image-preview-img");

      if (lock && lock.checked && width && height && item && item.naturalWidth && item.naturalHeight) {
        var w = parseInt(width.value, 10);
        var h = parseInt(height.value, 10);
        if (changed === "width" && w) {
          height.value = Math.max(1, Math.round(w * item.naturalHeight / item.naturalWidth));
        } else if (changed === "height" && h) {
          width.value = Math.max(1, Math.round(h * item.naturalWidth / item.naturalHeight));
        }
      }

      clearTimeout(timer);
      timer = setTimeout(function () {
        var button = q("image-scale-preview-button");
        if (button && !button.disabled) button.click();
      }, 300);
    });
  }

  function patch() {
    if (!workspace()) return;
    patchScaleInput("scale-width", "width");
    patchScaleInput("scale-height", "height");
  }

  function onSpaNavigation() {
    clearTimeout(timer);
    window.requestAnimationFrame(patch);
  }

  function init() {
    patch();
    if (listenerBound) return;
    listenerBound = true;
    window.addEventListener("algolassi:spa-navigation", onSpaNavigation);
  }

  if (!window[KEY]) {
    window[KEY] = { init: init };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
      init();
    }
  } else {
    window[KEY].init();
  }
})();
