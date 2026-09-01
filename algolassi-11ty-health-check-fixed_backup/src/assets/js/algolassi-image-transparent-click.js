/* Algolassi Image Tools - click-to-select transparent background color. */
(function () {
  "use strict";

  var picking = false;
  var busy = false;

  function q(id) { return document.getElementById(id); }

  function status(text, good) {
    var el = q("image-status");
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("image-status-good", !!good);
  }

  function setPicking(active) {
    picking = !!active;
    var stage = q("image-preview-stage");
    var button = q("image-transparent-button");
    if (stage) stage.classList.toggle("algolassi-transparent-picking", picking);
    if (button) {
      button.setAttribute("aria-pressed", picking ? "true" : "false");
      button.classList.toggle("active", picking);
    }
  }

  function imagePoint(event, img) {
    if (!img || !img.naturalWidth || !img.naturalHeight) return null;
    var rect = img.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
    return {
      x: Math.max(0, Math.min(img.naturalWidth - 1, Math.floor(x * img.naturalWidth / rect.width))),
      y: Math.max(0, Math.min(img.naturalHeight - 1, Math.floor(y * img.naturalHeight / rect.height)))
    };
  }

  function samplePixel(img, point) {
    var canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    var ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
    var pixel = ctx.getImageData(point.x, point.y, 1, 1).data;
    return { r: pixel[0], g: pixel[1], b: pixel[2] };
  }

  function toHex(rgb) {
    function h(v) { return v.toString(16).padStart(2, "0"); }
    return "#" + h(rgb.r) + h(rgb.g) + h(rgb.b);
  }

  function ensureStyles() {
    if (document.getElementById("algolassi-transparent-click-styles")) return;
    var style = document.createElement("style");
    style.id = "algolassi-transparent-click-styles";
    style.textContent = ".algolassi-transparent-picking #image-preview-img{cursor:crosshair!important}.algolassi-transparent-picking{cursor:crosshair}.image-transparent-pick-note{font-size:.88em;opacity:.78;margin-top:6px}";
    document.head.appendChild(style);
  }

  function chooseFromImage(event) {
    if (!picking || busy) return;
    var stage = q("image-preview-stage");
    var img = q("image-preview-img");
    if (!stage || !img || !img.naturalWidth || img.classList.contains("image-hidden")) return;

    var point = imagePoint(event, img);
    if (!point) return;

    busy = true;
    try {
      var rgb = samplePixel(img, point);
      var hex = toHex(rgb);
      var input = q("transparent-color");
      if (input) input.value = hex;
      setPicking(false);
      status("Selected background " + hex.toUpperCase() + ". Click Transparent Background to apply it.", true);
    } catch (error) {
      console.error("Algolassi transparent background pick:", error);
      status("Could not read that image pixel.", false);
    } finally {
      busy = false;
    }
  }

  function bind() {
    ensureStyles();

    document.addEventListener("click", function (event) {
      var button = event.target && event.target.closest ? event.target.closest("#image-transparent-button") : null;
      if (!button) return;

      if (!picking) {
        event.preventDefault();
        event.stopImmediatePropagation();
        var img = q("image-preview-img");
        if (!img || img.classList.contains("image-hidden") || !img.naturalWidth) {
          status("Upload an image first, then select a background area.", false);
          return;
        }
        setPicking(true);
        status("Click the background area in the image to select it.", true);
      }
    }, true);

    document.addEventListener("pointerup", function (event) {
      if (!picking) return;
      if (event.button !== 0 && event.pointerType !== "touch") return;
      var target = event.target && event.target.closest ? event.target.closest("#image-preview-img") : null;
      if (!target) return;
      chooseFromImage(event);
    }, true);

    window.addEventListener("algolassi:spa-navigation", function () {
      setPicking(false);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once: true });
  else bind();
})();
