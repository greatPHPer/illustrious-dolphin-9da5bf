/* Algolassi Image Tools - viewport zoom like a map */
(function () {
  "use strict";

  var KEY = "__algolassiImageZoom_v1";
  if (window[KEY]) return;
  window[KEY] = true;

  var scale = 1;
  var tx = 0;
  var ty = 0;
  var minScale = 0.25;
  var maxScale = 8;
  var step = 1.2;
  var pan = null;
  var spaceDown = false;
  var zoomEnabled = false;
  var wheelGestureTimer = null;
  var gestureBase = null;

  function q(id) { return document.getElementById(id); }
  function stage() { return q("image-preview-stage"); }
  function img() { return q("image-preview-img"); }

  function updateLabel() {
    var el = q("image-zoom-value");
    if (el) el.textContent = Math.round(scale * 100) + "%";
  }

  function updateToggleUi() {
    var toggle = q("image-zoom-toggle");
    if (toggle) {
      toggle.textContent = zoomEnabled ? "Zoom: On" : "Zoom: Off";
      toggle.setAttribute("aria-pressed", zoomEnabled ? "true" : "false");
      toggle.title = zoomEnabled ? "Zoom controls are enabled" : "Enable zoom controls";
      toggle.classList.toggle("image-zoom-enabled", zoomEnabled);
    }
    [q("image-zoom-in"), q("image-zoom-out"), q("image-zoom-reset")].forEach(function (button) {
      if (button) button.disabled = !zoomEnabled;
    });
    var st = stage();
    if (st) st.classList.toggle("image-zoom-active", zoomEnabled);
  }

  function baseRect() {
    var im = img();
    if (!im || im.classList.contains("image-hidden") || !im.naturalWidth) return null;
    if (gestureBase) return gestureBase;
    var r = im.getBoundingClientRect();
    return {
      left: r.left - tx,
      top: r.top - ty,
      width: scale > 0 ? r.width / scale : r.width,
      height: scale > 0 ? r.height / scale : r.height
    };
  }

  function apply() {
    var im = img();
    if (!im) return;
    im.style.transformOrigin = "0 0";
    im.style.transform = "translate3d(" + Math.round(tx) + "px," + Math.round(ty) + "px,0) scale(" + scale + ")";
    im.style.willChange = "transform";
    updateLabel();
    var st = stage();
    if (st) st.classList.toggle("image-zoomed", zoomEnabled && (scale > 1.001 || Math.abs(tx) > 0.5 || Math.abs(ty) > 0.5));
  }

  function clampPan() {
    var st = stage(), br = baseRect();
    if (!st || !br) return;
    var sr = st.getBoundingClientRect();
    var w = br.width * scale, h = br.height * scale;
    
    var offsetX = sr.left - br.left;
    var offsetY = sr.top - br.top;

    // Unified bounding logic: gracefully handles both "larger than stage" 
    // and "smaller than stage" bounds without forcing a jarring center snap.
    var minX = Math.min(offsetX, offsetX + sr.width - w);
    var maxX = Math.max(offsetX, offsetX + sr.width - w);
    tx = Math.max(minX, Math.min(maxX, tx));

    var minY = Math.min(offsetY, offsetY + sr.height - h);
    var maxY = Math.max(offsetY, Math.min(maxY, ty));
  }

  function finishWheelGesture() {
    wheelGestureTimer = null;
    if (!zoomEnabled) return;
    if (scale !== 1 || tx || ty) {
      clampPan();
      apply();
    }
    gestureBase = null;
  }

  function scheduleWheelGestureFinish() {
    if (wheelGestureTimer) window.clearTimeout(wheelGestureTimer);
    wheelGestureTimer = window.setTimeout(finishWheelGesture, 140);
  }

  function zoomAt(factor, clientX, clientY, deferClamp) {
    if (!zoomEnabled) return;
    var im = img();
    if (!im || im.classList.contains("image-hidden") || !im.naturalWidth) return;

    var br = baseRect();
    if (!br || br.width <= 0 || br.height <= 0) return;

    if (!gestureBase) gestureBase = br;

    var old = scale;
    var next = Math.max(minScale, Math.min(maxScale, old * factor));
    if (Math.abs(next - old) < 0.0001) return;

    var u = (clientX - gestureBase.left - tx) / (gestureBase.width * old);
    var v = (clientY - gestureBase.top - ty) / (gestureBase.height * old);

    scale = next;
    tx = clientX - gestureBase.left - u * gestureBase.width * scale;
    ty = clientY - gestureBase.top - v * gestureBase.height * scale;

    if (!deferClamp) clampPan();
    apply();
    window.requestAnimationFrame(function () {
      window.dispatchEvent(new CustomEvent("algolassi:image-zoom-changed"));
    });
  }

  function reset() {
    if (wheelGestureTimer) {
      window.clearTimeout(wheelGestureTimer);
      wheelGestureTimer = null;
    }
    gestureBase = null;
    scale = 1;
    tx = 0;
    ty = 0;
    var im = img();
    if (im) {
      im.style.transform = "";
      im.style.transformOrigin = "";
      im.style.willChange = "";
    }
    updateLabel();
    var st = stage();
    if (st) st.classList.remove("image-zoomed");
  }

  function setZoomEnabled(value) {
    zoomEnabled = !!value;
    if (!zoomEnabled) {
      reset();
      pan = null;
      var st = stage();
      if (st) st.classList.remove("image-zoom-panning", "image-zoomed");
    }
    updateToggleUi();
  }

  function ensureUi() {
    var st = stage();
    if (!st || !st.parentNode) return false;
    var toolbar = st.parentNode.querySelector(".image-toolbar");
    if (!toolbar || q("image-zoom-controls")) return !!q("image-zoom-controls");
    var wrap = document.createElement("div");
    wrap.id = "image-zoom-controls";
    wrap.className = "image-zoom-controls";
    wrap.setAttribute("aria-label", "Image zoom");
    wrap.innerHTML =
      '<button id="image-zoom-toggle" type="button" class="image-action-button secondary" title="Enable zoom controls" aria-pressed="false">Zoom: Off</button>' +
      '<button id="image-zoom-out" type="button" class="image-action-button secondary" title="Zoom out">−</button>' +
      '<span id="image-zoom-value" class="image-zoom-value" aria-live="polite">100%</span>' +
      '<button id="image-zoom-in" type="button" class="image-action-button secondary" title="Zoom in">＋</button>' +
      '<button id="image-zoom-reset" type="button" class="image-action-button secondary" title="Reset zoom">100%</button>';
    toolbar.appendChild(wrap);
    return true;
  }

  function installStyle() {
    if (q("algolassi-image-zoom-style")) return;
    var s = document.createElement("style");
    s.id = "algolassi-image-zoom-style";
    s.textContent =
      ".image-zoom-controls{display:flex;align-items:center;gap:.25rem;margin-left:auto}" +
      ".image-zoom-controls .image-action-button{min-width:30px;margin:0;padding:.25rem .45rem;font-size:.78rem;line-height:1.15}" +
      ".image-zoom-controls .image-action-button:disabled{opacity:.45;cursor:not-allowed}" +
      ".image-zoom-controls #image-zoom-toggle.image-zoom-enabled{font-weight:700}" +
      ".image-zoom-value{min-width:46px;text-align:center;font-size:.76rem;font-variant-numeric:tabular-nums;color:#667085}" +
      ".image-preview-stage.image-zoomed{cursor:grab}" +
      ".image-preview-stage.image-zoomed.image-zoom-panning{cursor:grabbing}" +
      ".image-crop-rectangle{box-shadow:0 0 0 9999px rgba(15,23,42,.72)}" +
      "html[data-theme=\"dark\"] .image-crop-rectangle{box-shadow:0 0 0 9999px rgba(0,0,0,.68)}" +
      "@media(max-width:640px){.image-zoom-controls{margin-left:0}.image-zoom-value{min-width:42px}}";
    document.head.appendChild(s);
  }

  function bind() {
    var st = stage(), im = img();
    if (!st || !im || st.dataset.imageZoomBound === "1") return;
    st.dataset.imageZoomBound = "1";
    ensureUi();
    installStyle();
    updateToggleUi();

    q("image-zoom-toggle") && q("image-zoom-toggle").addEventListener("click", function (e) {
      e.preventDefault(); e.stopPropagation();
      setZoomEnabled(!zoomEnabled);
    });

    q("image-zoom-in") && q("image-zoom-in").addEventListener("click", function (e) {
      if (!zoomEnabled) return;
      e.preventDefault(); e.stopPropagation();
      var r = st.getBoundingClientRect(); zoomAt(step, r.left + r.width / 2, r.top + r.height / 2, false);
    });

    q("image-zoom-out") && q("image-zoom-out").addEventListener("click", function (e) {
      if (!zoomEnabled) return;
      e.preventDefault(); e.stopPropagation();
      var r = st.getBoundingClientRect(); zoomAt(1 / step, r.left + r.width / 2, r.top + r.height / 2, false);
    });

    q("image-zoom-reset") && q("image-zoom-reset").addEventListener("click", function (e) {
      if (!zoomEnabled) return;
      e.preventDefault(); e.stopPropagation(); reset();
    });

    st.addEventListener("wheel", function (e) {
      if (!zoomEnabled) return;
      if (!img() || img().classList.contains("image-hidden")) return;
      e.preventDefault();
      var factor = e.deltaY < 0 ? step : 1 / step;
      zoomAt(factor, e.clientX, e.clientY, true);
      scheduleWheelGestureFinish();
    }, { passive: false });

    st.addEventListener("dblclick", function (e) {
      if (!zoomEnabled) return;
      if (e.target.closest && e.target.closest("#image-crop-rectangle")) return;
      zoomAt(scale > 1.01 ? 1 / step : step, e.clientX, e.clientY, false);
    });

    st.addEventListener("pointerdown", function (e) {
      if (!zoomEnabled) return;
      if (e.button !== 1 && !(spaceDown && e.button === 0)) return;
      if (scale <= 1.001 && Math.abs(tx) < 0.5 && Math.abs(ty) < 0.5) return;
      pan = { x: e.clientX, y: e.clientY, tx: tx, ty: ty, pointerId: e.pointerId };
      st.classList.add("image-zoom-panning");
      try { st.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
      e.stopPropagation();
    }, true);

    st.addEventListener("pointermove", function (e) {
      if (!pan || !zoomEnabled) return;
      tx = pan.tx + e.clientX - pan.x;
      ty = pan.ty + e.clientY - pan.y;
      clampPan();
      apply();
      e.preventDefault();
      e.stopPropagation();
    }, true);

    function endPan(e) {
      if (!pan) return;
      pan = null;
      st.classList.remove("image-zoom-panning");
      try { st.releasePointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
      e.stopPropagation();
    }

    st.addEventListener("pointerup", endPan, true);
    st.addEventListener("pointercancel", endPan, true);

    document.addEventListener("keydown", function (e) {
      if (e.code === "Space" && !e.repeat) spaceDown = true;
      if (!st.closest(".image-workspace") || !zoomEnabled) return;
      if (e.key === "0" && !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) { reset(); }
      else if ((e.key === "+" || e.key === "=") && !e.ctrlKey && !e.altKey && !e.metaKey) {
        var r = st.getBoundingClientRect(); zoomAt(step, r.left + r.width / 2, r.top + r.height / 2, false);
      } else if ((e.key === "-" || e.key === "_") && !e.ctrlKey && !e.altKey && !e.metaKey) {
        var rr = st.getBoundingClientRect(); zoomAt(1 / step, rr.left + rr.width / 2, rr.top + rr.height / 2, false);
      }
    }, true);

    document.addEventListener("keyup", function (e) {
      if (e.code === "Space") spaceDown = false;
    }, true);

    window.addEventListener("resize", function () {
      gestureBase = null;
      if (zoomEnabled && (scale !== 1 || tx || ty)) { clampPan(); apply(); }
    }, { passive: true });

    window.addEventListener("algolassi:spa-navigation", function () {
      reset(); zoomEnabled = false; pan = null;
      updateLabel(); updateToggleUi();
    });
  }

  function init() { ensureUi(); installStyle(); updateToggleUi(); window.requestAnimationFrame(bind); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
  window.addEventListener("algolassi:spa-navigation", function () { window.requestAnimationFrame(init); });
})();