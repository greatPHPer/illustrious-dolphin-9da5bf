/* =========================================================
   ALGOLASSI BREADCRUMB CHILD MENU

   Behavior:
   - A breadcrumb child displays the submenu belonging to its parent.
   - The selected submenu row aligns exactly with the child trigger.
   - The submenu may extend above and below the trigger.
   - The final/current breadcrumb is also a child trigger.
   - Submenu width is never wider than its parent breadcrumb item.
   - No cascading / no side-by-side positioning.
   ========================================================= */
(function () {
  "use strict";

  var selector = ".breadcrumb-menu > a, .breadcrumb-child-menu > a";
  var breadcrumbSelector = ".breadcrumbs .breadcrumb-item, .breadcrumbs > .breadcrumb-current";

  function activate(link) {
    if (!link) return;
    link.classList.remove("menu-item-tilted");
    void link.offsetWidth;
    link.classList.add("menu-item-tilted");
  }

  function deactivate(link) {
    if (link) link.classList.remove("menu-item-tilted");
  }

  function directChild(parent, selector) {
    if (!parent) return null;
    for (var i = 0; i < parent.children.length; i++) {
      if (parent.children[i].matches && parent.children[i].matches(selector)) {
        return parent.children[i];
      }
    }
    return null;
  }

  /*
     The menu belongs visually to the child item, but its maximum width
     comes from the breadcrumb parent that supplied the menu content.
     Set the width first, then measure the now-final menu layout so text
     wrapping cannot disturb the vertical alignment calculation.
  */
  function constrainChildMenuWidth(item) {
    if (!item) return;

    var menu = directChild(item, ".breadcrumb-child-menu");
    if (!menu) return;

    var parentItem = item.previousElementSibling;

    /* Ignore the separator between breadcrumb levels. */
    while (parentItem && !(parentItem.matches && parentItem.matches(".breadcrumb-item"))) {
      parentItem = parentItem.previousElementSibling;
    }

    if (!parentItem) {
      parentItem = item.parentElement && item.parentElement.querySelector
        ? item.parentElement.querySelector(".breadcrumb-item")
        : null;
    }

    if (!parentItem) return;

    var parentTrigger = directChild(parentItem, ".breadcrumb-trigger") || parentItem;
    var parentWidth = parentTrigger.getBoundingClientRect().width;

    if (!Number.isFinite(parentWidth) || parentWidth <= 0) return;

    menu.style.width = Math.round(parentWidth * 100) / 100 + "px";
    menu.style.maxWidth = Math.round(parentWidth * 100) / 100 + "px";
    menu.style.boxSizing = "border-box";
  }

  /*
     The child item itself is the containing block. Start the menu at
     top:0, then move it by the difference between:
       trigger center
       selected submenu row center
     This makes the two centers coincide exactly.
  */
  function alignChildMenu(item) {
    if (!item || window.innerWidth <= 700) return;

    var menu = directChild(item, ".breadcrumb-child-menu");
    if (!menu) return;

    var trigger = directChild(item, ".breadcrumb-trigger") ||
                  (item.classList.contains("breadcrumb-current") ? item : null);
    var selected = menu.querySelector("a.breadcrumb-dropdown-current");

    if (!trigger || !selected) return;

    /* Width must be fixed before measuring menu rows. */
    constrainChildMenuWidth(item);

    /* Force a stable base position for measurement. */
    menu.style.top = "0px";

    var triggerRect = trigger.getBoundingClientRect();
    var selectedRect = selected.getBoundingClientRect();
    var menuRect = menu.getBoundingClientRect();
    var itemRect = item.getBoundingClientRect();

    var triggerCenter = triggerRect.top + (triggerRect.height / 2);
    var selectedCenter = selectedRect.top + (selectedRect.height / 2);

    /* Convert the required viewport offset into the child's local top. */
    var offset = triggerCenter - selectedCenter;
    var targetTop = menuRect.top - itemRect.top + offset;

    menu.style.top = Math.round(targetTop * 100) / 100 + "px";
  }

  function alignAllChildMenus() {
    document.querySelectorAll(".breadcrumb-child-item").forEach(function (item) {
      alignChildMenu(item);
    });
  }

  /* Build one child-menu for every breadcrumb level after the first. */
  function initializeChildMenus() {
    var items = Array.prototype.slice.call(
      document.querySelectorAll(breadcrumbSelector)
    );

    items.forEach(function (item) {
      item.classList.remove("breadcrumb-child-item");

      var generated = directChild(item, ".breadcrumb-child-menu");
      if (generated) generated.remove();

      var ownMenu = directChild(item, ".breadcrumb-menu");
      if (ownMenu) {
        ownMenu.classList.remove("breadcrumb-child-menu-source-hidden");
        ownMenu.style.removeProperty("width");
        ownMenu.style.removeProperty("max-width");
        ownMenu.style.removeProperty("box-sizing");
      }
    });

    for (var i = 1; i < items.length; i++) {
      var parentItem = items[i - 1];
      var childItem = items[i];
      var parentMenu = directChild(parentItem, ".breadcrumb-menu");

      if (!parentMenu) continue;

      childItem.classList.add("breadcrumb-child-item");

      var childMenu = parentMenu.cloneNode(true);
      childMenu.classList.remove("breadcrumb-menu");
      childMenu.classList.add("breadcrumb-child-menu");
      childMenu.removeAttribute("data-menu");
      childMenu.removeAttribute("style");

      parentMenu.classList.add("breadcrumb-child-menu-source-hidden");
      childItem.appendChild(childMenu);

      /* Width first, alignment second. */
      constrainChildMenuWidth(childItem);
      alignChildMenu(childItem);
    }
  }

  function closeAllMenus(except) {
    document.querySelectorAll(".breadcrumb-menu.open, .breadcrumb-child-menu.open").forEach(function (menu) {
      if (menu !== except) menu.classList.remove("open");
    });
  }

  document.addEventListener("pointerover", function (event) {
    var link = event.target && event.target.closest ? event.target.closest(selector) : null;
    if (!link) return;

    var from = event.relatedTarget && event.relatedTarget.closest ? event.relatedTarget.closest(selector) : null;
    if (from === link) return;

    activate(link);

    var item = link.closest(".breadcrumb-child-item");
    if (item) {
      requestAnimationFrame(function () {
        alignChildMenu(item);
      });
    }
  }, true);

  document.addEventListener("pointerout", function (event) {
    var link = event.target && event.target.closest ? event.target.closest(selector) : null;
    if (!link) return;

    var to = event.relatedTarget && event.relatedTarget.closest ? event.relatedTarget.closest(selector) : null;
    if (to === link) return;

    deactivate(link);
  }, true);

  document.addEventListener("pointerenter", function (event) {
    var item = event.target && event.target.closest ? event.target.closest(".breadcrumb-child-item") : null;
    if (!item) return;

    requestAnimationFrame(function () {
      alignChildMenu(item);
    });
  }, true);

  document.addEventListener("click", function (event) {
    var trigger = event.target && event.target.closest ? event.target.closest(
      ".breadcrumb-child-item > .breadcrumb-trigger, .breadcrumb-child-item.breadcrumb-current"
    ) : null;
    if (!trigger) return;

    if (!window.matchMedia("(hover: none) and (pointer: coarse)").matches) {
      return;
    }

    var item = trigger.closest(".breadcrumb-child-item");
    var menu = directChild(item, ".breadcrumb-child-menu");
    if (!menu) return;

    if (!menu.classList.contains("open")) {
      event.preventDefault();
      closeAllMenus(menu);
      constrainChildMenuWidth(item);
      alignChildMenu(item);
      menu.classList.add("open");
    }
  }, true);

  function init() {
    initializeChildMenus();
    requestAnimationFrame(function () {
      alignAllChildMenus();
    });
  }

  window.addEventListener("resize", function () {
    requestAnimationFrame(alignAllChildMenus);
  }, { passive: true });

  window.addEventListener("load", init);
  window.addEventListener("algolassi:spa-navigation", function () {
    requestAnimationFrame(init);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    requestAnimationFrame(init);
  }
})();