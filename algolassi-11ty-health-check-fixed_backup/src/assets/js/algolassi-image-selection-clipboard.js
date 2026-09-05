/* Algolassi Image Tools - selection clipboard / floating paste placement */
(function () {
  "use strict";

  var KEY = "__algolassiImageSelectionClipboard_v1";
  var clipboard = null;
  var pasteActive = false;
  var ghost = null;
  var lastPointer = null;
  var bound = false;

  function q(id) { return document.getElementById(id); }
  function workspace() { return document.querySelector(".image-workspace"); }
  function stage() { return q("image-preview-stage"); }
  function image() { return q("image-preview-img"); }
  function status(text, good) {
    var el = q("image-status");
    if (el) { el.textContent = text || ""; el.classList.toggle("image-status-good", !!good); }
    var menu = q("image-menu-status");
    if (menu && text) menu.textContent = text;
    var clip = q("image-selection-clipboard-status");
    if (clip) clip.textContent = text || "";
  }

  function imageRect() {
    var img = image();
    if (!img || img.classList.contains("image-hidden") || !img.naturalWidth || !img.naturalHeight) return null;
    var r = img.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return { left: r.left, top: r.top, width: r.width, height: r.height,
      scaleX: img.naturalWidth / r.width, scaleY: img.naturalHeight / r.height };
  }

  function selectionFromFields() {
    var img = image(), r = imageRect();
    if (!img || !r) return null;
    var x = parseInt((q("crop-x") || {}).value, 10);
    var y = parseInt((q("crop-y") || {}).value, 10);
    var w = parseInt((q("crop-width") || {}).value, 10);
    var h = parseInt((q("crop-height") || {}).value, 10);
    if (![x, y, w, h].every(function (v) { return Number.isFinite(v); })) return null;
    if (w < 1 || h < 1 || x < 0 || y < 0 || x + w > img.naturalWidth || y + h > img.naturalHeight) return null;
    return { x: x, y: y, width: w, height: h };
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  function canvasBlob(canvas) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) { blob ? resolve(blob) : reject(new Error("Could not create clipboard image.")); }, "image/png");
    });
  }

  function ensureUi() {
    var st = stage();
    if (!st || !st.parentNode) return null;
    var panel = q("image-selection-clipboard");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "image-selection-clipboard";
      panel.className = "image-selection-clipboard";
      panel.setAttribute("aria-label", "Selection clipboard");
      panel.innerHTML =
        '<div class="image-selection-clipboard-heading">Selection Clipboard</div>' +
        '<div class="image-selection-clipboard-actions">' +
        '<button id="image-selection-copy" class="image-action-button secondary" type="button">Copy Selection</button>' +
        '<button id="image-selection-paste" class="image-action-button" type="button">Paste Selection</button>' +
        '<button id="image-selection-cancel" class="image-action-button secondary image-hidden" type="button">Cancel Paste</button>' +
        '</div>' +
        '<div id="image-selection-clipboard-status" class="image-selection-clipboard-status" role="status" aria-live="polite">Select a crop region, then Copy Selection.</div>';
      st.parentNode.insertBefore(panel, st);
    }
    return panel;
  }

  function style() {
    if (document.getElementById("algolassi-image-selection-clipboard-style")) return;
    var s = document.createElement("style");
    s.id = "algolassi-image-selection-clipboard-style";
    s.textContent = [
      ".image-selection-clipboard{margin:.45rem 0 .65rem;padding:.6rem .7rem;border:1px solid rgba(127,127,127,.28);border-radius:.55rem;background:rgba(127,127,127,.055);box-sizing:border-box}",
      ".image-selection-clipboard-heading{font-size:.84rem;font-weight:700;margin-bottom:.45rem}",
      ".image-selection-clipboard-actions{display:flex;flex-wrap:wrap;gap:.45rem}",
      ".image-selection-clipboard-actions .image-action-button{margin:0}",
      ".image-selection-clipboard-status{margin-top:.45rem;font-size:.76rem;line-height:1.3;opacity:.78}",
      ".image-selection-paste-ghost{position:fixed;z-index:99999;pointer-events:none;display:block;opacity:.55;filter:drop-shadow(0 5px 9px rgba(0,0,0,.42));outline:1px dashed rgba(255,255,255,.95);outline-offset:-1px;transform:translate3d(0,0,0);will-change:left,top}",
      ".image-selection-paste-mode #image-preview-stage{cursor:copy}",
      ".image-selection-paste-mode #image-crop-overlay{pointer-events:none!important}",
      "@media(max-width:640px){.image-selection-clipboard-actions{gap:.35rem}.image-selection-clipboard-actions .image-action-button{font-size:.78rem;padding:.4rem .55rem}}"
    ].join("");
    document.head.appendChild(s);
  }

  function updateGhost(clientX, clientY) {
    if (!pasteActive || !ghost || !clipboard) return;
    var r = imageRect();
    if (!r) return;
    var w = Math.max(2, Math.min(clipboard.width / r.scaleX, r.width));
    var h = Math.max(2, Math.min(clipboard.height / r.scaleY, r.height));
    var left = Math.max(r.left, Math.min(r.left + r.width - w, Number(clientX) - w / 2));
    var top = Math.max(r.top, Math.min(r.top + r.height - h, Number(clientY) - h / 2));
    ghost.style.left = Math.round(left) + "px";
    ghost.style.top = Math.round(top) + "px";
    ghost.style.width = Math.round(w) + "px";
    ghost.style.height = Math.round(h) + "px";
    ghost.dataset.left = String(left);
    ghost.dataset.top = String(top);
    ghost.dataset.width = String(w);
    ghost.dataset.height = String(h);
  }

  function ensureGhost() {
    if (ghost) return ghost;
    ghost = document.createElement("img");
    ghost.className = "image-selection-paste-ghost";
    ghost.alt = "Paste preview";
    document.body.appendChild(ghost);
    return ghost;
  }

  function stopPaste(message) {
    pasteActive = false;
    lastPointer = null;
    if (ghost) { ghost.remove(); ghost = null; }
    document.documentElement.classList.remove("image-selection-paste-mode");
    var cancel = q("image-selection-cancel");
    if (cancel) cancel.classList.add("image-hidden");
    if (message) status(message, true);
  }

  function startPaste(e) {
    if (!clipboard) { status("Nothing copied. Select a region and use Copy Selection first.", false); return; }
    var r = imageRect();
    if (!r) { status("Select an image before pasting the selection.", false); return; }
    pasteActive = true;
    lastPointer = e && Number.isFinite(e.clientX) ? { x: e.clientX, y: e.clientY } : { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    var g = ensureGhost();
    g.src = clipboard.url;
    document.documentElement.classList.add("image-selection-paste-mode");
    var cancel = q("image-selection-cancel");
    if (cancel) cancel.classList.remove("image-hidden");
    updateGhost(lastPointer.x, lastPointer.y);
    status("Paste preview active — move the mouse, then click or press Ctrl+V to place. Esc cancels.", true);
  }

  function pointerInImage(clientX, clientY) {
    var r = imageRect();
    if (!r) return null;
    if (clientX < r.left || clientX > r.left + r.width || clientY < r.top || clientY > r.top + r.height) return null;
    return { r: r, x: (clientX - r.left) * r.scaleX, y: (clientY - r.top) * r.scaleY };
  }

  function selectedPasteRect() {
    if (!ghost || !clipboard) return null;
    var r = imageRect();
    var centerX = parseFloat(ghost.dataset.left) + parseFloat(ghost.dataset.width) / 2;
    var centerY = parseFloat(ghost.dataset.top) + parseFloat(ghost.dataset.height) / 2;
    var base = pointerInImage(centerX, centerY);
    var img = image();
    if (!r || !base || !img) return null;
    var x = Math.round(base.x - clipboard.width / 2);
    var y = Math.round(base.y - clipboard.height / 2);
    x = Math.max(0, Math.min(img.naturalWidth - clipboard.width, x));
    y = Math.max(0, Math.min(img.naturalHeight - clipboard.height, y));
    return { x: x, y: y };
  }

  function commitPaste() {
    if (!pasteActive || !clipboard) return;
    var target = image();
    var pos = selectedPasteRect();
    if (!target || !pos) { stopPaste(); status("Move the paste preview inside the image and try again.", false); return; }
    var currentSrc = target.currentSrc || target.src;
    var patch = clipboard;
    status("Placing selection…");
    Promise.all([loadImage(currentSrc), loadImage(patch.url)]).then(function (loaded) {
      var base = document.createElement("canvas");
      base.width = loaded[0].naturalWidth;
      base.height = loaded[0].naturalHeight;
      var ctx = base.getContext("2d");
      ctx.drawImage(loaded[0], 0, 0, base.width, base.height);
      ctx.drawImage(loaded[1], pos.x, pos.y, patch.width, patch.height);
      return canvasBlob(base);
    }).then(function (blob) {
      var file = new File([blob], "pasted-selection.png", { type: "image/png" });
      window.__algolassiImageToolsAppendHistory = true;
      window.__algolassiImageToolsAppendName = "pasted-selection.png";
      var input = q("image-file");
      if (!input || !window.DataTransfer) throw new Error("Image upload bridge unavailable");
      var dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      stopPaste("Selection pasted into the image.");
    }).catch(function (err) { console.error(err); stopPaste(); status("Could not paste the selection.", false); });
  }

  function copySelection() {
    var sel = selectionFromFields();
    var target = image();
    if (!sel || !target) { status("Select a valid crop region first.", false); return; }
    var src = target.currentSrc || target.src;
    status("Copying selection…");
    loadImage(src).then(function (img) {
      var c = document.createElement("canvas");
      c.width = sel.width; c.height = sel.height;
      c.getContext("2d").drawImage(img, sel.x, sel.y, sel.width, sel.height, 0, 0, sel.width, sel.height);
      return canvasBlob(c).then(function (blob) {
        if (clipboard && clipboard.url) URL.revokeObjectURL(clipboard.url);
        clipboard = { blob: blob, url: URL.createObjectURL(blob), width: sel.width, height: sel.height };
        status("Copied " + sel.width + " × " + sel.height + " px. Press Ctrl+V or Paste Selection to place it.", true);
      });
    }).catch(function (err) { console.error(err); status("Could not copy the selected region.", false); });
  }

  function onPointerMove(e) {
    if (!pasteActive) return;
    lastPointer = { x: e.clientX, y: e.clientY };
    updateGhost(e.clientX, e.clientY);
  }

  function onKeyDown(e) {
    if (!workspace()) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
      var active = document.activeElement;
      if (active && (/INPUT|TEXTAREA|SELECT/.test(active.tagName) || active.isContentEditable)) return;
      if (selectionFromFields()) { e.preventDefault(); copySelection(); }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
      var activePaste = document.activeElement;
      if (activePaste && (/INPUT|TEXTAREA|SELECT/.test(activePaste.tagName) || activePaste.isContentEditable)) return;
      if (!clipboard) return;
      e.preventDefault();
      if (pasteActive) commitPaste(); else startPaste(lastPointer || null);
      return;
    }
    if (e.key === "Escape" && pasteActive) { e.preventDefault(); stopPaste("Paste cancelled."); }
  }

  function capturePointerDown(e) {
    var st = stage();
    if (!pasteActive || !st || !st.contains(e.target)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }

  function capturePointerUp(e) {
    var st = stage();
    if (!pasteActive || !st || !st.contains(e.target)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    lastPointer = { x: e.clientX, y: e.clientY };
    updateGhost(e.clientX, e.clientY);
  }

  function onClick(e) {
    var st = stage();
    if (!pasteActive || !st || !st.contains(e.target)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    commitPaste();
  }

  function bind() {
    if (bound || !workspace()) return;
    bound = true;
    style();
    ensureUi();
    var copy = q("image-selection-copy"), paste = q("image-selection-paste"), cancel = q("image-selection-cancel");
    if (copy) copy.addEventListener("click", copySelection);
    if (paste) paste.addEventListener("click", function () { startPaste(lastPointer || null); });
    if (cancel) cancel.addEventListener("click", function () { stopPaste("Paste cancelled."); });
    document.addEventListener("pointermove", onPointerMove, false);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", capturePointerDown, true);
    document.addEventListener("pointerup", capturePointerUp, true);
    document.addEventListener("click", onClick, true);
    window.addEventListener("resize", function () { if (pasteActive && lastPointer) updateGhost(lastPointer.x, lastPointer.y); }, { passive: true });
    window.addEventListener("algolassi:spa-navigation", function () { stopPaste(); bound = false; window.requestAnimationFrame(bind); });
  }

  function init() { if (!workspace()) return; ensureUi(); bind(); }

  if (!window[KEY]) {
    window[KEY] = { init: init };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
  } else {
    window[KEY].init();
  }
})();
