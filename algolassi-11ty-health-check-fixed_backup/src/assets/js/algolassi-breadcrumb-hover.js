/* =========================================================
   ALGOLASSI BREADCRUMB CHILD MENU
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
      if (parent.children[i].matches && parent.children[i].matches(selector)) return parent.children[i];
    }
    return null;
  }

  function constrainChildMenuWidth(item) {
    var menu = directChild(item, ".breadcrumb-child-menu");
    if (!menu) return;

    var parentItem = item.previousElementSibling;
    while (parentItem && !(parentItem.matches && parentItem.matches(".breadcrumb-item"))) {
      parentItem = parentItem.previousElementSibling;
    }
    if (!parentItem) {
      parentItem = item.parentElement && item.parentElement.querySelector ? item.parentElement.querySelector(".breadcrumb-item") : null;
    }
    if (!parentItem) return;

    var parentTrigger = directChild(parentItem, ".breadcrumb-trigger") || parentItem;
    var parentWidth = parentTrigger.getBoundingClientRect().width;
    if (!Number.isFinite(parentWidth) || parentWidth <= 0) return;

    if (item.nextElementSibling && item.nextElementSibling.matches && item.nextElementSibling.matches(".breadcrumb-child-item")) {
      menu.style.width = parentWidth + "px";
      menu.style.maxWidth = parentWidth + "px";
      menu.style.boxSizing = "border-box";
    } else {
      menu.style.removeProperty("width");
      menu.style.removeProperty("max-width");
      menu.style.removeProperty("box-sizing");
    }
  }

  function alignChildMenu(item) {
    if (!item || window.innerWidth <= 700) return;

    var menu = directChild(item, ".breadcrumb-child-menu");
    if (!menu) return;

    var trigger = directChild(item, ".breadcrumb-trigger") ||
                  (item.classList.contains("breadcrumb-current") ? item : null);
    var selected = menu.querySelector("a.breadcrumb-dropdown-current");
    if (!trigger || !selected) return;

    constrainChildMenuWidth(item);

    var savedScrollTop = menu.scrollTop;

    menu.style.maxHeight = "none";
    menu.style.overflowY = "auto";
    menu.style.top = "0px";

    var triggerRect = trigger.getBoundingClientRect();
    var selectedRect = selected.getBoundingClientRect();

    var triggerCenter = triggerRect.top + triggerRect.height / 2;
    var selectedCenter = selectedRect.top + selectedRect.height / 2;

    var targetTop = triggerCenter - selectedCenter;
    menu.style.top = targetTop + "px";

    var breadcrumbs = item.closest(".breadcrumbs");
    var breadcrumbsRect = breadcrumbs ? breadcrumbs.getBoundingClientRect() : null;
    var breadcrumbsOffsetY = breadcrumbsRect ? breadcrumbsRect.top : 0;
    var breadcrumbsViewportBottom = breadcrumbsRect ? breadcrumbsRect.bottom : 0;
    var effectiveMenuTop = targetTop + breadcrumbsOffsetY;
    var overflowingTopHeight = breadcrumbsViewportBottom > 0
      ? Math.max(0, -effectiveMenuTop)
      : 0;

    var naturalHeight = menu.scrollHeight;
    var finalMaxHeight = naturalHeight;

    if (overflowingTopHeight > 4) {
      finalMaxHeight = Math.max(1, naturalHeight - overflowingTopHeight);
      menu.style.top = (-overflowingTopHeight) + "px";
    }

    if (effectiveMenuTop >= 0) {
      finalMaxHeight = naturalHeight;
    }

    if (finalMaxHeight > 0) {
      menu.style.maxHeight = Math.floor(finalMaxHeight) + "px";
      menu.style.overflowY = naturalHeight > finalMaxHeight + 1 ? "auto" : "hidden";
    } else {
      menu.style.maxHeight = "1px";
      menu.style.overflowY = "auto";
    }

    menu.scrollTop = Math.min(
      savedScrollTop,
      Math.max(0, menu.scrollHeight - menu.clientHeight)
    );
  }

  function initializeChildMenus() {
    var items = Array.prototype.slice.call(document.querySelectorAll(breadcrumbSelector));

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

      constrainChildMenuWidth(childItem);
      alignChildMenu(childItem);
    }
  }

  function alignAllChildMenus() {
    document.querySelectorAll(".breadcrumb-child-item").forEach(function (item) {
      alignChildMenu(item);
    });
  }

  function closeAllMenus(except) {
    document.querySelectorAll(".breadcrumb-menu.open, .breadcrumb-child-menu.open").forEach(function (menu) {
      if (menu !== except) menu.classList.remove("open");
    });
  }

  function resetMenuScrollInitialization(item) {
    var menu = item && directChild(item, ".breadcrumb-child-menu");
    if (menu) delete menu.dataset.scrollInitialized;
  }

  function resetAllMenuScrollInitialization() {
    document.querySelectorAll(".breadcrumb-child-menu").forEach(function (menu) {
      delete menu.dataset.scrollInitialized;
    });
  }

  function initializeMenuScroll(item) {
    var menu = directChild(item, ".breadcrumb-child-menu");
    if (!menu || menu.dataset.scrollInitialized === "true") return;

    menu.scrollTop = Math.max(0, menu.scrollHeight - menu.clientHeight);
    menu.dataset.scrollInitialized = "true";
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

  document.addEventListener("pointerenter", function (event) {
    var item = event.target && event.target.closest ? event.target.closest(".breadcrumb-child-item") : null;
    if (!item) return;
    if (event.target !== item) return;

    var menu = directChild(item, ".breadcrumb-child-menu");
    if (!menu || menu.dataset.scrollInitialized === "true") return;

    menu.scrollTop = Math.max(0, menu.scrollHeight - menu.clientHeight);
    menu.dataset.scrollInitialized = "true";
  }, true);

  document.addEventListener("pointerleave", function (event) {
    var item = event.target && event.target.closest ? event.target.closest(".breadcrumb-child-item") : null;
    if (!item) return;
    resetMenuScrollInitialization(item);
  }, true);

  document.addEventListener("click", function (event) {
    var isMobile = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (!isMobile) return;

    var clickedItem = event.target && event.target.closest
      ? event.target.closest(".breadcrumb-child-item")
      : null;
    var clickedMenu = event.target && event.target.closest
      ? event.target.closest(".breadcrumb-child-menu")
      : null;

    var openMenu = document.querySelector(".breadcrumb-child-menu.open");

    // A breadcrumb item is a menu trigger only on mobile.
    // Links inside the child menu remain normal navigation links.
    if (clickedItem && !clickedMenu) {
      var menu = directChild(clickedItem, ".breadcrumb-child-menu");
      if (!menu) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      if (openMenu && openMenu !== menu) {
        resetAllMenuScrollInitialization();
        closeAllMenus(menu);
        constrainChildMenuWidth(clickedItem);
        alignChildMenu(clickedItem);
        menu.classList.add("open");
        initializeMenuScroll(clickedItem);
        return;
      }

      if (!menu.classList.contains("open")) {
        closeAllMenus(menu);
        constrainChildMenuWidth(clickedItem);
        alignChildMenu(clickedItem);
        menu.classList.add("open");
        initializeMenuScroll(clickedItem);
      }

      return;
    }

    if (openMenu && !clickedMenu) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeAllMenus();
      resetAllMenuScrollInitialization();
    }
  }, true);

  function init() {
    initializeChildMenus();
    requestAnimationFrame(alignAllChildMenus);
  }

  window.addEventListener("resize", function () { requestAnimationFrame(alignAllChildMenus); }, { passive: true });
  window.addEventListener("load", init);
  window.addEventListener("algolassi:spa-navigation", function () { requestAnimationFrame(init); });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    requestAnimationFrame(init);
  }
})();