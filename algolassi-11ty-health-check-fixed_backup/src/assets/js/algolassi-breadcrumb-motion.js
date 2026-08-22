/* Algolassi breadcrumb motion - refined controller */
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
      var link = links[i];
      link.classList.remove("motion-exit-item");
      link.style.cssText = "";
    }
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

    links.forEach(function (link) {
      link.style.height = link.getBoundingClientRect().height + "px";
      link.style.overflow = "hidden";
    });

    function collapseFromBottom(index) {
      if (index < 0) {
        menu.classList.remove("motion-closing", "motion-open");
        menu.classList.add("motion-hidden");
        timers.delete(item);
        return;
      }

      var link = links[index];
      link.classList.add("motion-exit-item");
      /* Deliberately do NOT transition transform here. The hover animation owns it. */
      link.style.transition = "height " + ITEM_DURATION + "ms ease, padding-top " + ITEM_DURATION + "ms ease, padding-bottom " + ITEM_DURATION + "ms ease";

      requestAnimationFrame(function () {
        link.style.height = "0px";
        link.style.minHeight = "0px";
        link.style.maxHeight = "0px";
        link.style.paddingTop = "0px";
        link.style.paddingBottom = "0px";
      });

      var timer = setTimeout(function () {
        link.style.display = "none";
        collapseFromBottom(index - 1);
      }, ITEM_DURATION + STAGGER);
      timers.set(item, timer);
    }

    collapseFromBottom(links.length - 1);
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
