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

    // 1. Temporarily strip CSS animations to get flawless layout measurements
    menu.style.setProperty("transform", "none", "important");
    menu.style.setProperty("transition", "none", "important");
    menu.style.setProperty("max-height", "none", "important");
    menu.style.setProperty("overflow-y", "visible", "important");
    menu.style.setProperty("top", "0px", "important");

    // Force browser reflow to apply the reset before calculating
    void menu.offsetWidth;

    var triggerRect = trigger.getBoundingClientRect();
    var selectedRect = selected.getBoundingClientRect();
    var menuRect = menu.getBoundingClientRect();

    var triggerCenter = triggerRect.top + triggerRect.height / 2;

    // Calculate the selected item's true distance from the top of the menu container
    var selectedCenterRelative = (selectedRect.top - menuRect.top) + (selectedRect.height / 2);

    // 2. Ideal Viewport Top Position (Unconstrained)
    var idealViewportTop = triggerCenter - selectedCenterRelative;

    var minTopSpace = 16;
    var maxBottomSpace = window.innerHeight - 16;
    var naturalHeight = menuRect.height;

    // 3. Constrain to Top Bounds
    var expectedViewportTop = Math.max(idealViewportTop, minTopSpace);

    // 4. Calculate Required Scroll to maintain visual alignment
    var requiredScrollTop = expectedViewportTop - idealViewportTop;

    // 5. The Magic Constraints: Calculate Max Height limits
    // It must be small enough to allow the required scroll, AND small enough to fit the viewport
    var maxHeightToPermitScroll = naturalHeight - requiredScrollTop;
    var maxHeightToFitViewport = maxBottomSpace - expectedViewportTop;

    var finalMaxHeight = Math.min(naturalHeight, maxHeightToPermitScroll, maxHeightToFitViewport);
    finalMaxHeight = Math.max(1, finalMaxHeight); // Prevent negative heights

    // 6. Convert absolute viewport position to relative CSS 'top' shift
    var targetTop = expectedViewportTop - menuRect.top;

    // 7. Apply calculated styles, forcing them past the CSS file using !important
    menu.style.setProperty("top", targetTop + "px", "important");

    if (finalMaxHeight < naturalHeight || requiredScrollTop > 0) {
      menu.style.setProperty("max-height", Math.floor(finalMaxHeight) + "px", "important");
      menu.style.setProperty("overflow-y", "auto", "important");
    } else {
      menu.style.setProperty("max-height", "none", "important");
      menu.style.setProperty("overflow-y", "hidden", "important");
    }

    // Restore the CSS hover animations
    menu.style.removeProperty("transform");
    menu.style.removeProperty("transition");

    // 8. Apply scroll position to automatically align the highlighted item
    menu.scrollTop = requiredScrollTop;
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

  function syncMobileBreadcrumbLinks() {
    var isMobile = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    var links = document.querySelectorAll(".breadcrumb-child-item > .breadcrumb-trigger");

    links.forEach(function (link) {
      if (isMobile) {
        if (link.hasAttribute("href")) {
          link.dataset.desktopHref = link.getAttribute("href");
          link.removeAttribute("href");
        }
      } else if (link.dataset.desktopHref) {
        link.setAttribute("href", link.dataset.desktopHref);
        delete link.dataset.desktopHref;
      }
    });

    document.querySelectorAll(".breadcrumb-child-menu a.breadcrumb-dropdown-current").forEach(function (link) {
      if (isMobile) {
        link.style.setProperty("pointer-events", "none", "important");
      } else {
        link.style.removeProperty("pointer-events");
      }
    });
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

  document.addEventListener("pointerdown", function (event) {
    var isMobile = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (!isMobile) return;

    var clickedItem = event.target && event.target.closest
      ? event.target.closest(".breadcrumb-child-item")
      : null;
    var clickedMenu = event.target && event.target.closest
      ? event.target.closest(".breadcrumb-child-menu")
      : null;

    var openMenu = document.querySelector(".breadcrumb-child-menu.open");

    // On mobile, breadcrumb items are menu triggers only.
    // Their href attributes have been removed; child-menu links remain navigable.
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
    syncMobileBreadcrumbLinks();
    requestAnimationFrame(alignAllChildMenus);
  }

  window.addEventListener("resize", function () {
    syncMobileBreadcrumbLinks();
    requestAnimationFrame(alignAllChildMenus);
  }, { passive: true });
  window.addEventListener("load", init);
  window.addEventListener("algolassi:spa-navigation", function () { requestAnimationFrame(init); });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    requestAnimationFrame(init);
  }
})();