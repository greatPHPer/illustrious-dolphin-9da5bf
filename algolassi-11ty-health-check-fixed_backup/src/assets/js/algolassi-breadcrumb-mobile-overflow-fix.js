/* Algolassi - mobile breadcrumb submenu overflow fix */
(function () {
  "use strict";

  var GAP = 6;
  var EDGE = 8;

  function isTouchMobile() {
    return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  }

  function directChild(parent, selector) {
    if (!parent) return null;
    for (var i = 0; i < parent.children.length; i++) {
      if (parent.children[i].matches && parent.children[i].matches(selector)) return parent.children[i];
    }
    return null;
  }

  function restore(menu) {
    if (!menu) return;
    menu.style.removeProperty("position");
    menu.style.removeProperty("left");
    menu.style.removeProperty("right");
    menu.style.removeProperty("top");
    menu.style.removeProperty("bottom");
    menu.style.removeProperty("z-index");
    menu.style.removeProperty("max-height");
    menu.style.removeProperty("overflow-y");
    menu.style.removeProperty("overflow-x");
    menu.style.removeProperty("transform");
    menu.style.removeProperty("transition");
  }

  function positionOpenMenu(menu) {
    if (!menu || !isTouchMobile() || !menu.classList.contains("open")) return;

    var item = menu.parentElement;
    var trigger = directChild(item, ".breadcrumb-trigger") ||
                  (item && item.classList.contains("breadcrumb-current") ? item : null);
    if (!trigger) return;

    var triggerRect = trigger.getBoundingClientRect();
    var viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    var viewportHeight = window.innerHeight;
    var top = Math.min(triggerRect.bottom + GAP, viewportHeight - EDGE - 1);

    menu.style.setProperty("position", "fixed", "important");
    menu.style.setProperty("transform", "none", "important");
    menu.style.setProperty("transition", "none", "important");
    menu.style.setProperty("top", top + "px", "important");
    menu.style.setProperty("bottom", "auto", "important");
    menu.style.setProperty("z-index", "2147483600", "important");
    menu.style.setProperty("max-height", Math.max(1, viewportHeight - top - EDGE) + "px", "important");
    menu.style.setProperty("overflow-y", "auto", "important");
    menu.style.setProperty("overflow-x", "hidden", "important");
    menu.style.setProperty("overscroll-behavior", "contain", "important");

    void menu.offsetWidth;

    var rect = menu.getBoundingClientRect();
    var left = Math.max(EDGE, Math.min(triggerRect.left, viewportWidth - rect.width - EDGE));
    menu.style.setProperty("left", left + "px", "important");
    menu.style.setProperty("right", "auto", "important");
  }

  function update() {
    var menus = document.querySelectorAll(".breadcrumb-child-menu");
    menus.forEach(function (menu) {
      if (isTouchMobile() && menu.classList.contains("open")) {
        positionOpenMenu(menu);
      } else if (!menu.classList.contains("open")) {
        restore(menu);
      }
    });
  }

  function init() {
    update();

    if (window.MutationObserver) {
      var observer = new MutationObserver(function () {
        window.requestAnimationFrame(update);
      });
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["class"]
      });
    }

    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("algolassi:spa-navigation", function () {
      window.requestAnimationFrame(update);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
