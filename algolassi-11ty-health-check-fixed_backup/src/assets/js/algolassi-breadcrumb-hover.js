/* =========================================================
   ALGOLASSI BREADCRUMB CHILD MENU

   Behavior:
   - A breadcrumb child displays the submenu belonging to its parent.
   - The submenu is visually anchored to the child breadcrumb.
   - The selected submenu row aligns exactly with the child trigger.
   - Rows above/below the trigger depend on the selected row's position.
   - The final/current breadcrumb is also a child trigger.
   - Parent breadcrumb items no longer open their own menus.
   - No cascading / no side-by-side submenu positioning.
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
     Position a child menu so its highlighted entry sits on the same
     horizontal line as the breadcrumb child that opened it.

     Example:
       Parent menu has 6 entries and the selected child is #1:
         selected row aligns with trigger -> remaining rows extend below.

       Selected child is #5:
         preceding rows extend above -> final row(s) extend below.
  */
  function alignChildMenu(item) {
    if (!item || window.innerWidth <= 700) return;

    var menu = directChild(item, ".breadcrumb-child-menu");
    if (!menu) return;

    var trigger = directChild(item, ".breadcrumb-trigger") ||
                  (item.classList.contains("breadcrumb-current") ? item : null);
    var selected = menu.querySelector("a.breadcrumb-dropdown-current");

    if (!trigger || !selected) return;

    /* Establish the CSS base position first so measurements are stable. */
    menu.style.top = "calc(100% + 2px)";

    var triggerRect = trigger.getBoundingClientRect();
    var selectedRect = selected.getBoundingClientRect();

    var triggerCenter = triggerRect.top + (triggerRect.height / 2);
    var selectedCenter = selectedRect.top + (selectedRect.height / 2);
    var offset = triggerCenter - selectedCenter;

    menu.style.top = "calc(100% + 2px + " +
      Math.round(offset * 100) / 100 + "px)";
  }

  function alignAllChildMenus() {
    document.querySelectorAll(".breadcrumb-child-item").forEach(function (item) {
      alignChildMenu(item);
    });
  }

  /*
     Build one child-menu for every breadcrumb level after the first.
     The child receives a clone of its immediate parent's menu content.
     This includes the final/current breadcrumb, which is a span rather
     than a .breadcrumb-item in the template.
  */
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

      /* The parent menu should only be exposed through its child. */
      parentMenu.classList.add("breadcrumb-child-menu-source-hidden");

      childItem.appendChild(childMenu);
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

  /*
     Re-align as soon as the child trigger itself becomes active.
     This catches both normal breadcrumb links and the final/current span.
  */
  document.addEventListener("pointerenter", function (event) {
    var item = event.target && event.target.closest ? event.target.closest(".breadcrumb-child-item") : null;
    if (!item) return;

    requestAnimationFrame(function () {
      alignChildMenu(item);
    });
  }, true);

  /*
     Touch devices need an explicit open state because there is no hover.
     Both normal child triggers and the final/current breadcrumb work here.
  */
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
      alignChildMenu(item);
      menu.classList.add("open");
    }
  }, true);

  function init() {
    initializeChildMenus();
    requestAnimationFrame(alignAllChildMenus);
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