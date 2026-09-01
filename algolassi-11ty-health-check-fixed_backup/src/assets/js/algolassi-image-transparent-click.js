/* Algolassi Image Tools - click-to-select connected transparent region. */
(function () {
  "use strict";

  var picking = false;
  var selected = null;
  var busy = false;
  var originalGetImageData = null;
  var originalPutImageData = null;
  var savedImages = typeof WeakMap !== "undefined" ? new WeakMap() : null;

  function q(id) {
    return document.getElementById(id);
  }

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

    if (stage) {
      stage.classList.toggle("algolassi-transparent-picking", picking);
    }
    if (button) {
      button.classList.toggle("active", picking);
      button.setAttribute("aria-pressed", picking ? "true" : "false");
    }
  }

  function imagePoint(event, img) {
    if (!img || !img.naturalWidth || !img.naturalHeight) return null;

    var rect = img.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    var renderedW = rect.width;
    var renderedH = rect.height;
    var offsetX = 0;
    var offsetY = 0;
    var naturalRatio = img.naturalWidth / img.naturalHeight;
    var boxRatio = rect.width / rect.height;
    var fit = getComputedStyle(img).objectFit;

    if (fit === "contain" || fit === "scale-down") {
      if (naturalRatio > boxRatio) {
        renderedW = rect.width;
        renderedH = rect.width / naturalRatio;
        offsetY = (rect.height - renderedH) / 2;
      } else {
        renderedH = rect.height;
        renderedW = rect.height * naturalRatio;
        offsetX = (rect.width - renderedW) / 2;
      }
    }

    x -= offsetX;
    y -= offsetY;

    if (x < 0 || y < 0 || x > renderedW || y > renderedH) return null;

    return {
      x: Math.max(0, Math.min(img.naturalWidth - 1, Math.floor(x * img.naturalWidth / renderedW))),
      y: Math.max(0, Math.min(img.naturalHeight - 1, Math.floor(y * img.naturalHeight / renderedH)))
    };
  }

  function readImage(img) {
    var canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    var ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return {
      width: canvas.width,
      height: canvas.height,
      imageData: ctx.getImageData(0, 0, canvas.width, canvas.height)
    };
  }

  function buildMask(source, point, tolerance) {
    var width = source.width;
    var height = source.height;
    var pixels = source.imageData.data;
    var seed = (point.y * width + point.x) * 4;
    var sr = pixels[seed];
    var sg = pixels[seed + 1];
    var sb = pixels[seed + 2];
    var mask = new Uint8Array(width * height);
    var visited = new Uint8Array(width * height);
    var stack = new Int32Array(width * height);
    var top = 0;
    var index;
    var x;
    var y;
    var count = 0;

    stack[top++] = point.y * width + point.x;

    function matches(i) {
      var p = i * 4;
      return Math.abs(pixels[p] - sr) <= tolerance &&
             Math.abs(pixels[p + 1] - sg) <= tolerance &&
             Math.abs(pixels[p + 2] - sb) <= tolerance;
    }

    while (top > 0) {
      index = stack[--top];
      if (visited[index]) continue;
      visited[index] = 1;

      if (!matches(index)) continue;

      mask[index] = 1;
      count++;
      x = index % width;
      y = (index / width) | 0;

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
      count: count
    };
  }

  function restoreCanvasApi() {
    if (!window.CanvasRenderingContext2D) return;

    if (originalGetImageData) {
      CanvasRenderingContext2D.prototype.getImageData = originalGetImageData;
    }
    if (originalPutImageData) {
      CanvasRenderingContext2D.prototype.putImageData = originalPutImageData;
    }

    originalGetImageData = null;
    originalPutImageData = null;
    savedImages = typeof WeakMap !== "undefined" ? new WeakMap() : null;
  }

  function patchProcessor(region, tolerance) {
    if (!region || !window.CanvasRenderingContext2D) return;

    restoreCanvasApi();

    var prototype = CanvasRenderingContext2D.prototype;
    originalGetImageData = prototype.getImageData;
    originalPutImageData = prototype.putImageData;
    savedImages = typeof WeakMap !== "undefined" ? new WeakMap() : null;

    prototype.getImageData = function (sx, sy, sw, sh) {
      var imageData = originalGetImageData.apply(this, arguments);
      var isWholeImage = sx === 0 && sy === 0 && sw === region.width && sh === region.height;

      if (!isWholeImage || !savedImages) return imageData;

      var original = new Uint8ClampedArray(imageData.data);
      var pixels = imageData.data;
      var seed = region.rgb;
      var i;
      var p;

      for (i = 0; i < region.mask.length; i++) {
        if (region.mask[i]) continue;

        p = i * 4;
        if (Math.abs(original[p] - seed.r) <= tolerance &&
            Math.abs(original[p + 1] - seed.g) <= tolerance &&
            Math.abs(original[p + 2] - seed.b) <= tolerance) {
          pixels[p] = seed.r <= 127 ? 255 : 0;
          pixels[p + 1] = seed.g;
          pixels[p + 2] = seed.b;
        }
      }

      savedImages.set(imageData, original);
      return imageData;
    };

    prototype.putImageData = function (imageData) {
      var original = savedImages && savedImages.get(imageData);
      var i;
      var p;
      var fn;

      if (!original || imageData.data.length !== region.mask.length * 4) {
        return originalPutImageData.apply(this, arguments);
      }

      for (i = 0; i < region.mask.length; i++) {
        p = i * 4;

        if (!region.mask[i]) {
          imageData.data[p] = original[p];
          imageData.data[p + 1] = original[p + 1];
          imageData.data[p + 2] = original[p + 2];
          imageData.data[p + 3] = original[p + 3];
        } else {
          imageData.data[p] = original[p];
          imageData.data[p + 1] = original[p + 1];
          imageData.data[p + 2] = original[p + 2];
          /* Keep alpha as modified by the existing transparent-color processor. */
        }
      }

      fn = originalPutImageData;
      restoreCanvasApi();
      return fn.apply(this, arguments);
    };
  }

  function chooseRegion(event) {
    if (!picking || busy) return;

    var img = q("image-preview-img");
    if (!img || img.classList.contains("image-hidden") || !img.naturalWidth) return;

    var point = imagePoint(event, img);
    if (!point) return;

    busy = true;

    try {
      var toleranceInput = q("transparent-tolerance");
      var tolerance = Math.max(0, parseInt(toleranceInput && toleranceInput.value, 10) || 0);
      var source = readImage(img);

      selected = buildMask(source, point, tolerance);

      if (!selected.count) {
        selected = null;
        status("Could not select a region at that point.", false);
        return;
      }

      var hex = "#" + [selected.rgb.r, selected.rgb.g, selected.rgb.b].map(function (value) {
        return value.toString(16).padStart(2, "0");
      }).join("");
      var colorInput = q("transparent-color");

      if (colorInput) colorInput.value = hex;

      setPicking(false);
      status("Connected region selected. Click Transparent Background again to remove only that region.", true);
    } catch (error) {
      console.error("Algolassi transparent background pick:", error);
      selected = null;
      status("Could not select that image region.", false);
    } finally {
      busy = false;
    }
  }

  function bind() {
    document.addEventListener("click", function (event) {
      var button = event.target && event.target.closest
        ? event.target.closest("#image-transparent-button")
        : null;

      if (!button) return;

      if (selected) {
        var toleranceInput = q("transparent-tolerance");
        var tolerance = Math.max(0, parseInt(toleranceInput && toleranceInput.value, 10) || 0);
        var region = selected;

        selected = null;
        patchProcessor(region, tolerance);
        /* Do not stop this event: the original Image Tools processor must receive it. */
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
        status("Click the background region in the image.", true);
      }
    }, true);

    document.addEventListener("pointerup", function (event) {
      if (!picking) return;
      if (event.button !== 0 && event.pointerType !== "touch") return;

      var img = event.target && event.target.closest
        ? event.target.closest("#image-preview-img")
        : null;

      if (!img) return;
      chooseRegion(event);
    }, true);

    window.addEventListener("algolassi:spa-navigation", function () {
      selected = null;
      picking = false;
      busy = false;
      restoreCanvasApi();
      setPicking(false);
    });
  }

  function ensureStyles() {
    if (q("algolassi-transparent-click-styles")) return;

    var style = document.createElement("style");
    style.id = "algolassi-transparent-click-styles";
    style.textContent = ".algolassi-transparent-picking #image-preview-img{cursor:crosshair!important}.algolassi-transparent-picking{cursor:crosshair}";
    document.head.appendChild(style);
  }

  ensureStyles();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind, { once: true });
  } else {
    bind();
  }
})();
