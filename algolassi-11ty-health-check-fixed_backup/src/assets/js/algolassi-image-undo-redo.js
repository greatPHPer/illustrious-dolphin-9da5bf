/* Algolassi Image Tools - deterministic history undo/redo */
(function () {
  "use strict";

  var KEY = "__algolassiImageUndoRedo_v3";
  var bound = false;

  function q(id) { return document.getElementById(id); }
  function ws() { return document.querySelector(".image-workspace"); }
  function historyEl() { return q("image-history"); }
  function cards() {
    var h = historyEl();
    return h ? Array.prototype.slice.call(h.querySelectorAll(".image-history-card")) : [];
  }

  function currentIndex() {
    var list = cards();
    for (var i = 0; i < list.length; i++) {
      if (list[i].classList.contains("current")) return i;
    }
    return list.length ? list.length - 1 : -1;
  }

  function setStatus(text, good) {
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
    if (!toolbar) return false;

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
    return true;
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
    var list = cards();
    var index = currentIndex();
    var undo = q("image-undo-button");
    var redo = q("image-redo-button");
    if (!undo || !redo) return;

    undo.disabled = !(index > 0);
    redo.disabled = !(index >= 0 && index < list.length - 1);
  }

  function selectIndex(index, label) {
    var list = cards();
    if (index < 0 || index >= list.length) return false;

    var historyButton = list[index].querySelector(".image-history-link");
    if (!historyButton) return false;

    historyButton.click();
    window.setTimeout(function () {
      updateButtons();
    }, 0);
    setStatus(label, true);
    return true;
  }

  function undo() {
    var index = currentIndex();
    if (index <= 0) {
      updateButtons();
      return;
    }
    selectIndex(index - 1, "Undo — restored previous image version.");
  }

  function redo() {
    var list = cards();
    var index = currentIndex();
    if (index < 0 || index >= list.length - 1) {
      updateButtons();
      return;
    }
    selectIndex(index + 1, "Redo — restored next image version.");
  }

  function editableTarget(target) {
    if (!target) return false;
    var tag = (target.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
  }

  function bind() {
    if (bound || !ws()) return;
    if (!ensureUi()) return;
    style();

    var undoButton = q("image-undo-button");
    var redoButton = q("image-redo-button");
    if (!undoButton || !redoButton) return;

    bound = true;

    undoButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      undo();
    });

    redoButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      redo();
    });

    document.addEventListener("keydown", function (event) {
      var root = ws();
      if (!root || editableTarget(event.target)) return;
      if (!root.contains(event.target)) return;
      if (event.altKey || event.metaKey) return;

      if (event.ctrlKey && !event.shiftKey && (event.key === "z" || event.key === "Z")) {
        event.preventDefault();
        event.stopPropagation();
        undo();
        return;
      }

      if ((event.ctrlKey && (event.key === "y" || event.key === "Y")) ||
          (event.ctrlKey && event.shiftKey && (event.key === "z" || event.key === "Z"))) {
        event.preventDefault();
        event.stopPropagation();
        redo();
      }
    }, true);

    var history = historyEl();
    if (history && window.MutationObserver) {
      var observer = new MutationObserver(function () {
        updateButtons();
      });
      observer.observe(history, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "data-index"]
      });
      window.__algolassiImageUndoRedoObserver = observer;
    }

    document.addEventListener("click", function (event) {
      if (!event.target || !event.target.closest) return;
      if (!event.target.closest(".image-workspace")) return;
      window.setTimeout(updateButtons, 0);
    }, true);

    updateButtons();
  }

  function init() {
    if (!ws()) return;
    if (!bound) bind();
    else {
      ensureUi();
      style();
      updateButtons();
    }
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

  window.addEventListener("algolassi:spa-navigation", function () {
    bound = false;
    window.requestAnimationFrame(init);
  });
})();
