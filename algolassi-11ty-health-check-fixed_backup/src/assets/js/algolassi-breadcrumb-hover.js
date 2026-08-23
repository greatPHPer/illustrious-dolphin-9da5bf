/* =========================================================
   ALGOLASSI BREADCRUMB CHILD MENU

   Behavior:
   - A breadcrumb child displays the submenu belonging to its parent.
   - The submenu appears directly below the child breadcrumb item.
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
  }, true);

  document.addEventListener("pointerout", function (event) {
    var link = event.target && event.target.closest ? event.target.closest(selector) : null;
    if (!link) return;

    var to = event.relatedTarget && event.relatedTarget.closest ? event.relatedTarget.closest(selector) : null;
    if (to === link) return;

    deactivate(link);
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
      menu.classList.add("open");
    }
  }, true);

  function init() {
    initializeChildMenus();
  }

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