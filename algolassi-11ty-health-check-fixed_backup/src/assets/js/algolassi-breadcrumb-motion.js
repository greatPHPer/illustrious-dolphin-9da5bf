/* Algolassi breadcrumb motion - item vanish controller */
(function () {
  "use strict";

  var STAGGER = 12;
  var ITEM_DURATION = 180;
  var timers = new WeakMap();

  function itemFromTarget(target) {
    return target && target.closest ? target.closest(".breadcrumb-item") : null;
  }

  function menuFromItem(item) {
    return item ? item.querySelector(":scope > .breadcrumb-menu") : null;
  }

  function resetItems(menu) {
    if (!menu) return;
    var links = menu.querySelectorAll(":scope > a");
    for (var i = 0; i < links.length; i++) {
      links[i].classList.remove("motion-exit-item");
      links[i].style.cssText = "";
    }
    menu.style.height = "";
    menu.style.minHeight = "";
    menu.style.overflow = "";
    menu.style.paddingTop = "";
    menu.style.paddingBottom = "";
    menu.style.transition = "";
  }

  function clearTimer(item) {
    var timer = timers.get(item);
    if (timer) {
      clearTimeout(timer);
      timers.delete(item);
    }
  }

  function openMenu(item) {
    var menu = menuFromItem(item);
    if (!menu) return;
    clearTimer(item);
    resetItems(menu);
    menu.classList.remove("motion-closing", "motion-hidden");
    menu.classList.add("motion-open");
  }

  function closeMenu(item) {
    var menu = menuFromItem(item);
    if (!menu) return;

    clearTimer(item);
    resetItems(menu);
    menu.classList.remove("motion-open", "motion-hidden");
    menu.classList.add("motion-closing");

    var links = Array.prototype.slice.call(menu.querySelectorAll(":scope > a"));
    if (!links.length) {
      menu.classList.remove("motion-closing");
      menu.classList.add("motion-hidden");
      return;
    }

    /* Keep the submenu's normal background, border and shadow.
       Only the individual links participate in the vanish sequence. */
    links.forEach(function (link) {
      link.style.overflow = "hidden";
    });

    function vanishFromBottom(index) {
      if (index < 0) {
        menu.classList.remove("motion-closing", "motion-open");
        menu.classList.add("motion-hidden");
        resetItems(menu);
        timers.delete(item);
        return;
      }

      var link = links[index];
      link.classList.add("motion-exit-item");
      link.style.transformOrigin = "center left";
      link.style.transition = "transform " + ITEM_DURATION + "ms ease";

      requestAnimationFrame(function () {
        link.style.transform = "rotateZ(-2.5deg)";
      });

      var timer = setTimeout(function () {
        link.style.display = "none";
        vanishFromBottom(index - 1);
      }, ITEM_DURATION + STAGGER);
      timers.set(item, timer);
    }

    vanishFromBottom(links.length - 1);
  }

  function handlePointerOver(event) {
    var item = itemFromTarget(event.target);
    if (!item) return;
    var fromItem = itemFromTarget(event.relatedTarget);
    if (fromItem === item) return;
    openMenu(item);
  }

  function handlePointerOut(event) {
    var item = itemFromTarget(event.target);
    if (!item) return;
    var toItem = itemFromTarget(event.relatedTarget);
    if (toItem === item) return;
    closeMenu(item);
  }

  function handleFocusIn(event) {
    var item = itemFromTarget(event.target);
    if (item) openMenu(item);
  }

  function handleFocusOut(event) {
    var item = itemFromTarget(event.target);
    if (!item) return;
    if (event.relatedTarget && item.contains(event.relatedTarget)) return;
    closeMenu(item);
  }

  document.addEventListener("pointerover", handlePointerOver, true);
  document.addEventListener("pointerout", handlePointerOut, true);
  document.addEventListener("focusin", handleFocusIn, true);
  document.addEventListener("focusout", handleFocusOut, true);
})();
