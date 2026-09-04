/* Algolassi Image Tools - lightweight undo/redo over Processing History */
(function () {
  "use strict";

  var KEY = "__algolassiImageUndoRedo_v2";
  var bound = false;
  var knownSignature = "";

  function q(id) { return document.getElementById(id); }
  function ws() { return document.querySelector(".image-workspace"); }
  function historyCards() {
    var history = q("image-history");
    return history ? Array.prototype.slice.call(history.querySelectorAll(".image-history-card")) : [];
  }
  function currentIndex() {
    var cards = historyCards();
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].classList.contains("current")) return i;
    }
    return cards.length ? cards.length - 1 : -1;
  }
  function status(text, good) {
    var el = q("image-status");
    if (el) {
      el.textContent = text || "";
      el.classList.toggle("image-status-good", !!good);
    }
    var menu = q("image-menu-status");
    if (menu && text) menu.textContent = text;
  }

  function ensureUi() {
    var stage = q("image-preview-stage");
    var toolbar = stage && stage.parentNode ? stage.parentNode.querySelector(".image-toolbar") : null;
    if (!toolbar) return null;
    var wrap = q("image-undo-redo-controls");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "image-undo-redo-controls";
      wrap.className = "image-undo-redo-controls";
      wrap.setAttribute("aria-label", "Undo and redo");
      wrap.innerHTML =
        '<button id="image-undo-button" class="image-action-button secondary" type="button" title="Undo (Ctrl+Z)" aria-label="Undo" disabled>↶ Undo</button>' +
        '<button id="image-redo-button" class="image-action-button secondary" type="button" title="Redo (Ctrl+Y)" aria-label="Redo" disabled>Redo ↷</button>';
      toolbar.appendChild(wrap);
    }
    return wrap;
  }

  function style() {
    if (q("algolassi-image-undo-redo-style")) return;
    var s = document.createElement("style");
    s.id = "algolassi-image-undo-redo-style";
    s.textContent =
      ".image-toolbar{display:flex;align-items:center;gap:.55rem;flex-wrap:wrap}" +
      ".image-undo-redo-controls{display:flex;align-items:center;gap:.35rem;margin-left:auto}" +
      ".image-undo-redo-controls .image-action-button{margin:0;padding:.3rem .55rem;font-size:.78rem;line-height:1.2}" +
      ".image-undo-redo-controls .image-action-button:disabled{opacity:.45;cursor:not-allowed}" +
      "@media(max-width:640px){.image-undo-redo-controls{margin-left:0;width:100%}.image-undo-redo-controls .image-action-button{flex:0 0 auto}}";
    document.head.appendChild(s);
  }

  function updateButtons() {
    var cards = historyCards();
    var index = currentIndex();
    var undo = q("image-undo-button");
    var redo = q("image-redo-button");
    if (undo) undo.disabled = index <= 0;
    if (redo) redo.disabled = index < 0 || index >= cards.length - 1;
  }

  function selectHistoryIndex(index, label) {
    var cards = historyCards();
    if (index < 0 || index >= cards.length) return;
    var button = cards[index].querySelector(".image-history-link");
    if (!button) return;
    button.click();
    window.setTimeout(updateButtons, 0);
    status(label, true);
  }

  function doUndo() {
    var index = currentIndex();
    if (index > 0) selectHistoryIndex(index - 1, "Undo — selected previous image version.");
  }

  function doRedo() {
    var cards = historyCards();
    var index = currentIndex();
    if (index >= 0 && index < cards.length - 1) selectHistoryIndex(index + 1, "Redo — restored next image version.");
  }

  function signature() {
    return historyCards().map(function (card) {
      return (card.dataset.index || "") + ":" + (card.classList.contains("current") ? "1" : "0");
    }).join("|");
  }

  function isEditableTarget(target) {
    if (!target) return false;
    var tag = (target.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
  }

  function bind() {
    if (bound || !ws()) return;
    ensureUi();
    style();
    var undoButton = q("image-undo-button");
    var redoButton = q("image-redo-button");
    if (!undoButton || !redoButton) return;

    bound = true;
    undoButton.addEventListener("click", doUndo);
    redoButton.addEventListener("click", doRedo);

    document.addEventListener("keydown", function (e) {
      var root = ws();
      if (!root || isEditableTarget(e.target)) return;
      if (e.altKey || e.metaKey) return;
      if (e.ctrlKey && !e.shiftKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        doUndo();
      } else if ((e.ctrlKey && (e.key === "y" || e.key === "Y")) || (e.ctrlKey && e.shiftKey && (e.key === "z" || e.key === "Z"))) {
        e.preventDefault();
        doRedo();
      }
    }, true);

    var history = q("image-history");
    if (history && window.MutationObserver) {
      var observer = new MutationObserver(function () {
        var next = signature();
        if (next !== knownSignature) {
          knownSignature = next;
          updateButtons();
        }
      });
      observer.observe(history, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "data-index"] });
      window.__algolassiImageUndoRedoObserver = observer;
    }

    updateButtons();
  }

  function init() {
    if (!ws()) return;
    if (!bound) bind();
    else { ensureUi(); style(); updateButtons(); }
  }

  if (!window[KEY]) {
    window[KEY] = { init: init };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
  } else {
    window[KEY].init();
  }

  window.addEventListener("algolassi:spa-navigation", function () {
    bound = false;
    window.requestAnimationFrame(init);
  });
})();
