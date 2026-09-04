/* Algolassi Image Tools stability guard: prevent overlapping live-preview work. */
(function () {
  "use strict";

  var KEY = "__algolassiImageToolsStability_v1";
  var timer = null;
  var listenerBound = false;
  var historyListenerBound = false;
  var menuListenerBound = false;
  var cropAlignmentBound = false;

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

  function historyOperation(button) {
    if (!button) return "";
    var command = button.getAttribute("data-image-command");
    if (command) return (button.textContent || command).trim();
    var id = button.id || "";
    if (/^image-(scale-preview|scale|crop|transparent|rotate-90|rotate-180|rotate-270|save-as)-button$/.test(id)) {
      return (button.textContent || id).trim();
    }
    return "";
  }

  function bindImageHistory() {
    if (historyListenerBound) return;
    historyListenerBound = true;
    document.addEventListener("click", function (event) {
      var target = event.target && event.target.closest ? event.target.closest("button") : null;
      if (!target || !target.closest(".image-workspace")) return;
      var operation = historyOperation(target);
      if (!operation) return;
      window.setTimeout(function () {
        if (window.AlgolassiToolHistory && typeof window.AlgolassiToolHistory.add === "function") {
          window.AlgolassiToolHistory.add(operation);
        }
      }, 180);
    });
  }

  /* Desktop application-menu behaviour:
     once a menu is open, moving between File/Edit switches the open menu
     immediately without requiring another click. Menus remain open until
     a menu item is selected or the user clicks outside the menu bar. */
  function closeImageMenus() {
    ["image-file-menu", "image-edit-menu"].forEach(function (id) {
      var menu = q(id);
      if (menu) menu.classList.add("image-hidden");
    });
    [
      ["image-file-menu-button", "image-file-menu"],
      ["image-edit-menu-button", "image-edit-menu"]
    ].forEach(function (pair) {
      var button = q(pair[0]);
      if (button) button.setAttribute("aria-expanded", "false");
    });
  }

  function openImageMenu(menuId, buttonId) {
    var menu = q(menuId);
    var button = q(buttonId);
    if (!menu || !button) return;
    closeImageMenus();
    menu.classList.remove("image-hidden");
    button.setAttribute("aria-expanded", "true");
  }

  function bindImageMenuHoverBehaviour() {
    if (menuListenerBound) return;
    menuListenerBound = true;

    document.addEventListener("pointerover", function (event) {
      var trigger = event.target && event.target.closest
        ? event.target.closest(".image-menu-trigger")
        : null;
      if (!trigger || !trigger.closest(".image-workspace")) return;

      var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      if (!canHover) return;

      var related = event.relatedTarget;
      if (related && trigger.contains(related)) return;

      if (trigger.id === "image-file-menu-button") {
        openImageMenu("image-file-menu", "image-file-menu-button");
      } else if (trigger.id === "image-edit-menu-button") {
        openImageMenu("image-edit-menu", "image-edit-menu-button");
      }
    }, true);

    document.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      if (!target.closest(".image-menu-bar")) return;

      var keepOpen = target.closest(
        ".image-menu-trigger, .image-menu-dropdown, .image-menu-item, .image-menu-clear"
      );
      if (!keepOpen) closeImageMenus();
    }, true);
  }

  /* Crop uses the image-relative surface in normal modes. Layers mode has a
     different visible surface: #image-layers-canvas. Never let the generic
     image-based alignment code write a translate() into the crop rectangle
     while that surface is active. */
  function syncCropOverlayAlignment() {
    var stage = q("image-preview-stage");
    var img = q("image-preview-img");
    var box = q("image-crop-rectangle");
    if (!stage || !box) return;

    var layersActive = stage.classList.contains("image-layers-active");
    if (layersActive) {
      box.style.transform = "none";
      box.style.margin = "0";
      box.style.padding = "0";
      box.style.boxSizing = "border-box";
      return;
    }

    if (!img || img.classList.contains("image-hidden") || !img.naturalWidth) return;

    var stageRect = stage.getBoundingClientRect();
    var imageRect = img.getBoundingClientRect();
    var offsetX = imageRect.left - stageRect.left;
    var offsetY = imageRect.top - stageRect.top;

    box.style.transform = "translate(" + Math.round(offsetX) + "px," + Math.round(offsetY) + "px)";
  }

  function bindCropOverlayAlignment() {
    if (cropAlignmentBound) return;
    cropAlignmentBound = true;

    var schedule = function () {
      window.requestAnimationFrame(syncCropOverlayAlignment);
    };

    document.addEventListener("pointermove", function (event) {
      if (event.target && event.target.closest && event.target.closest("#image-preview-stage")) {
        schedule();
      }
    }, false);

    document.addEventListener("pointerup", function (event) {
      if (event.target && event.target.closest && event.target.closest("#image-preview-stage")) {
        schedule();
      }
    }, false);

    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("orientationchange", schedule, { passive: true });

    if (window.MutationObserver) {
      var stage = q("image-preview-stage");
      if (stage && stage.dataset.imageStabilityCropObserver !== "1") {
        stage.dataset.imageStabilityCropObserver = "1";
        var observer = new MutationObserver(schedule);
        observer.observe(stage, { attributes: true, attributeFilter: ["class"] });
        window.__algolassiImageToolsCropStageObserver = observer;
      }
    }

    schedule();
  }

  function patch() {
    if (!workspace()) return;
    patchScaleInput("scale-width", "width");
    patchScaleInput("scale-height", "height");
    bindImageHistory();
    bindImageMenuHoverBehaviour();
    bindCropOverlayAlignment();
    window.requestAnimationFrame(syncCropOverlayAlignment);
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
