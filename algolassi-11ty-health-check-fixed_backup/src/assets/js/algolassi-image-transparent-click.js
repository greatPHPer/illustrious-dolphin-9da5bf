/* Algolassi Image Tools - click-to-select transparent background region. */
(function () {
  "use strict";

  var picking = false;
  var hasSelection = false;
  var busy = false;
  var selectedRegion = null;
  var originalGetImageData = null;
  var originalPutImageData = null;

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

  function readImageData(img) {
    var canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    var ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
    return {
      width: canvas.width,
      height: canvas.height,
      data: ctx.getImageData(0, 0, canvas.width, canvas.height)
    };
  }

  function buildConnectedMask(imageData, point, tolerance) {
    var width = imageData.width;
    var height = imageData.height;
    var pixels = imageData.data.data;
    var seedIndex = (point.y * width + point.x) * 4;
    var sr = pixels[seedIndex];
    var sg = pixels[seedIndex + 1];
    var sb = pixels[seedIndex + 2];
    var mask = new Uint8Array(width * height);
    var visited = new Uint8Array(width * height);
    var stack = new Int32Array(width * height);
    var top = 0;
    stack[top++] = point.y * width + point.x;

    function matches(index) {
      var p = index * 4;
      return Math.abs(pixels[p] - sr) <= tolerance &&
             Math.abs(pixels[p + 1] - sg) <= tolerance &&
             Math.abs(pixels[p + 2] - sb) <= tolerance;
    }

    while (top > 0) {
      var index = stack[--top];
      if (visited[index]) continue;
      visited[index] = 1;
      if (!matches(index)) continue;
      mask[index] = 1;
      var x = index % width;
      var y = (index / width) | 0;
      if (x > 0) stack[top++] = index - 1;
      if (x + 1 < width) stack[top++] = index + 1;
      if (y > 0) stack[top++] = index - width;
      if (y + 1 < height) stack[top++] = index + width;
    }

    return {
      width: width,
      height: height,
      mask: mask,
      rgb: { r: sr, g: sg, b: sb },
      count: mask.reduce(function (sum, value) { return sum + value; }, 0)
    };
  }

  function protectProcessorForSelectedRegion(region, tolerance) {
    if (!region || !window.CanvasRenderingContext2D || !CanvasRenderingContext2D.prototype) return;

    originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    originalPutImageData = CanvasRenderingContext2D.prototype.putImageData;

    CanvasRenderingContext2D.prototype.getImageData = function (sx, sy, sw, sh) {
      var data = originalGetImageData.apply(this, arguments);
      if (!region || sw !== region.width || sh !== region.height || sx !== 0 || sy !== 0) return data;

      var original = new Uint8ClampedArray(data.data);
      var px = data.data;
      var seed = region.rgb;

      // The existing Image Tools processor removes every pixel matching the
      // selected color. Make only non-selected/disconnected matching pixels
      // temporarily differ from the seed color. putImageData() below restores
      // their original RGB values so no unrelated pixels are changed.
      for (var i = 0; i < region.mask.length; i++) {
        if (region.mask[i]) continue;
        var p = i * 4;
        if (Math.abs(original[p] - seed.r) <= tolerance &&
            Math.abs(original[p + 1] - seed.g) <= tolerance &&
            Math.abs(original[p + 2] - seed.b) <= tolerance) {
          var delta = Math.max(2, tolerance + 1);
          px[p] = Math.min(255, seed.r + delta);
          px[p + 1] = Math.max(0, seed.g - delta);
          px[p + 2] = Math.min(255, seed.b + delta);
        }
      }

      data.__algolassiOriginal = original;
      return data;
    };

    CanvasRenderingContext2D.prototype.putImageData = function (data) {
      var original = data && data.__algolassiOriginal;
      if (!original || !region) return originalPutImageData.apply(this, arguments);

      var px = data.data;
      for (var i = 0; i < region.mask.length; i++) {
        var p = i * 4;
        if (!region.mask[i]) {
          px[p] = original[p];
          px[p + 1] = original[p + 1];
          px[p + 2] = original[p + 2];
          px[p + 3] = original[p + 3];
        } else {
          px[p] = original[p];
          px[p + 1] = original[p + 1];
          px[p + 2] = original[p + 2];
        }
      }

      try {
        delete data.__algolassiOriginal;
      } catch (e) {
        data.__algolassiOriginal = null;
      }
      restoreCanvasApi();
      return originalPutImageData.apply(this, arguments);
    };
  }

  function restoreCanvasApi() {
    if (!window.CanvasRenderingContext2D || !CanvasRenderingContext2D.prototype) return;
    if (originalGetImageData) CanvasRenderingContext2D.prototype.getImageData = originalGetImageData;
    if (originalPutImageData) CanvasRenderingContext2D.prototype.putImageData = originalPutImageData;
    originalGetImageData = null;
    originalPutImageData = null;
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
      var imageData = readImageData(img);
      var toleranceInput = q("transparent-tolerance");
      var tolerance = Math.max(0, parseInt(toleranceInput && toleranceInput.value, 10) || 0);
      selectedRegion = buildConnectedMask(imageData, point, tolerance);
      if (!selectedRegion.count) {
        selectedRegion = null;
        status("Could not select a background region at that point.", false);
        return;
      }
      var hex = "#" + [selectedRegion.rgb.r, selectedRegion.rgb.g, selectedRegion.rgb.b].map(function (v) {
        return v.toString(16).padStart(2, "0");
      }).join("");
      var input = q("transparent-color");
      if (input) input.value = hex;
      hasSelection = true;
      setPicking(false);
      status("Selected connected region " + hex.toUpperCase() + ". Click Transparent Background to make only that region transparent.", true);
    } catch (error) {
      console.error("Algolassi transparent background pick:", error);
      selectedRegion = null;
      status("Could not read that image region.", false);
    } finally {
      busy = false;
    }
  }

  function bind() {
    ensureStyles();

    document.addEventListener("click", function (event) {
      var button = event.target && event.target.closest ? event.target.closest("#image-transparent-button") : null;
      if (!button) return;

      // Let the original Image Tools processor run, but protect it so only the
      // connected region selected by the user is allowed to match the color.
      if (hasSelection && selectedRegion) {
        hasSelection = false;
        var toleranceInput = q("transparent-tolerance");
        var tolerance = Math.max(0, parseInt(toleranceInput && toleranceInput.value, 10) || 0);
        protectProcessorForSelectedRegion(selectedRegion, tolerance);
        window.setTimeout(function () {
          restoreCanvasApi();
        }, 5000);
        selectedRegion = null;
        return;
      }

      if (!picking) {
        event.preventDefault();
        event.stopImmediatePropagation();
        var img = q("image-preview-img");
        if (!img || img.classList.contains("image-hidden") || !img.naturalWidth) {
          status("Upload an image first, then select a background area.", false);
          return;
        }
        setPicking(true);
        status("Click the background area in the image to select its connected region.", true);
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
      picking = false;
      hasSelection = false;
      selectedRegion = null;
      restoreCanvasApi();
      setPicking(false);
    });
  }

  function ensureStyles() {
    if (document.getElementById("algolassi-transparent-click-styles")) return;
    var style = document.createElement("style");
    style.id = "algolassi-transparent-click-styles";
    style.textContent = ".algolassi-transparent-picking #image-preview-img{cursor:crosshair!important}.algolassi-transparent-picking{cursor:crosshair}.image-transparent-pick-note{font-size:.88em;opacity:.78;margin-top:6px}";
    document.head.appendChild(style);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once: true });
  else bind();
})();
