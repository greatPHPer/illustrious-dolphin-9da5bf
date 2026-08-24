/* =========================================================
   ALGOLASSI BREADCRUMB CHILD MENU
   ========================================================= */
(function () {
  "use strict";

  var selector = ".breadcrumb-menu > a, .breadcrumb-child-menu > a";
  var breadcrumbSelector = ".breadcrumbs .breadcrumb-item, .breadcrumbs > .breadcrumb-current";
  var viewportPadding = 8;

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

    menu.style.width = parentWidth + "px";
    menu.style.maxWidth = parentWidth + "px";
    menu.style.boxSizing = "border-box";
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

    menu.style.maxHeight = "none";
    menu.style.overflowY = "auto";
    menu.style.top = "0px";
    menu.scrollTop = 0;

    var triggerRect = trigger.getBoundingClientRect();
    var selectedRect = selected.getBoundingClientRect();

    var triggerCenter = triggerRect.top + triggerRect.height / 2;
    var selectedCenter = selectedRect.top + selectedRect.height / 2;

    /* Keep the selected submenu row aligned with the child trigger. */
    var targetTop = triggerCenter - selectedCenter;
    menu.style.top = targetTop + "px";

    /*
       IMPORTANT:
       targetTop is local to .breadcrumb-child-item. For the overflow rule,
       the requested reference point is the .breadcrumbs container itself.

       Therefore:
           menuTop + breadcrumbsOffsetY

       gives the menu's effective top relative to the browser viewport in the
       current breadcrumb layout. Only a negative result represents the
       portion actually invisible above the browser's top edge.
    */
    var breadcrumbs = item.closest(".breadcrumbs");
    var breadcrumbsRect = breadcrumbs ? breadcrumbs.getBoundingClientRect() : null;
    var breadcrumbsOffsetY = breadcrumbsRect ? breadcrumbsRect.top : 0;
    var menuTopRelativeToBrowser = targetTop + breadcrumbsOffsetY;
    var overflowingTopHeight = Math.max(0, -menuTopRelativeToBrowser);

    var naturalHeight = menu.scrollHeight;
    var finalMaxHeight = naturalHeight - overflowingTopHeight;

    /* Keep the visible menu inside the browser viewport bottom. */
    if (finalMaxHeight > 0 && menuTopRelativeToBrowser >= 0) {
      finalMaxHeight = Math.min(
        finalMaxHeight,
        Math.max(0, window.innerHeight - menuTopRelativeToBrowser - viewportPadding)
      );
    } else if (finalMaxHeight > 0 && menuTopRelativeToBrowser < 0) {
      finalMaxHeight = Math.min(
        finalMaxHeight,
        Math.max(0, window.innerHeight - viewportPadding)
      );
    }

    finalMaxHeight = Math.max(1, Math.floor(finalMaxHeight));

    menu.style.maxHeight = finalMaxHeight + "px";
    menu.style.overflowY = naturalHeight > finalMaxHeight + 1 ? "auto" : "hidden";

    /* Always place the scrollbar at the absolute bottom of the menu. */
    menu.scrollTop = Math.max(0, menu.scrollHeight - menu.clientHeight);
  }

  function alignAllChildMenus() {
    document.querySelectorAll(".breadcrumb-child-item").forEach(function (item) {
      alignChildMenu(item);
    });
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
    if (item) requestAnimationFrame(function () { alignChildMenu(item); });
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
    requestAnimationFrame(function () { alignChildMenu(item); });
  }, true);

  document.addEventListener("click", function (event) {
    var trigger = event.target && event.target.closest ? event.target.closest(".breadcrumb-child-item > .breadcrumb-trigger, .breadcrumb-child-item.breadcrumb-current") : null;
    if (!trigger) return;
    if (!window.matchMedia("(hover: none) and (pointer: coarse)").matches) return;

    var item = trigger.closest(".breadcrumb-child-item");
    var menu = directChild(item, ".breadcrumb-child-menu");
    if (!menu || menu.classList.contains("open")) return;

    event.preventDefault();
    closeAllMenus(menu);
    constrainChildMenuWidth(item);
    alignChildMenu(item);
    menu.classList.add("open");
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
