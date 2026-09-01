/* Algolassi Image Tools - click-to-select connected transparent region. */
(function () {
  "use strict";

  var picking = false;
  var busy = false;

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

    if (stage) stage.classList.toggle("algolassi-transparent-picking", picking);
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

  function bind() {
    if (q("algolassi-transparent-click-bound")) return;

    var marker = document.createElement("span");
    marker.id = "algolassi-transparent-click-bound";
    marker.style.display = "none";
    document.body.appendChild(marker);

    document.addEventListener("click", function (event) {
      var button = event.target && event.target.closest
        ? event.target.closest("#image-transparent-button")
        : null;
      if (!button) return;

      /* First button click arms region selection. After a region has been
         selected, the normal Image Tools handler is allowed to process it. */
      if (!picking && !window.__algolassiTransparentPick) {
        var img = q("image-preview-img");
        if (!img || img.classList.contains("image-hidden") || !img.naturalWidth) {
          event.preventDefault();
          event.stopImmediatePropagation();
          status("Upload an image first, then select a background region.", false);
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        setPicking(true);
        status("Click the background region in the image.", true);
      }
    }, true);

    document.addEventListener("pointerup", function (event) {
      if (!picking || busy) return;
      if (event.button !== 0 && event.pointerType !== "touch") return;

      var img = event.target && event.target.closest
        ? event.target.closest("#image-preview-img")
        : null;
      if (!img) return;

      var point = imagePoint(event, img);
      if (!point) return;

      busy = true;
      try {
        window.__algolassiTransparentPick = {
          x: point.x,
          y: point.y
        };
        setPicking(false);
        status("Region selected. Click Transparent Background again to remove only that connected region.", true);
      } catch (error) {
        window.__algolassiTransparentPick = null;
        console.error("Algolassi transparent background pick:", error);
        status("Could not select that image region.", false);
      } finally {
        busy = false;
      }
    }, true);

    window.addEventListener("algolassi:spa-navigation", function () {
      picking = false;
      busy = false;
      window.__algolassiTransparentPick = null;
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

  function start() {
    ensureStyles();
    bind();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
