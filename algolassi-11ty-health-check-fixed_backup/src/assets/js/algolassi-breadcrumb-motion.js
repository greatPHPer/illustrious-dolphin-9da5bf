/* Algolassi breadcrumb motion - explicit exit state controller */
(function () {
  "use strict";

  var STAGGER = 25;
  var ITEM_DURATION = 420;
  var EXTRA_BUFFER = 40;
  var timers = new WeakMap();

  function itemFromTarget(target) {
    return target && target.closest ? target.closest(".breadcrumb-item") : null;
  }

  function menuFromItem(item) {
    return item ? item.querySelector(":scope > .breadcrumb-menu") : null;
  }

  function resetItemAnimationStyles(menu) {
    if (!menu) return;
    var links = menu.querySelectorAll(":scope > a");
    for (var i = 0; i < links.length; i++) {
      links[i].style.removeProperty("animation-delay");
      links[i].style.removeProperty("animation-name");
      links[i].style.removeProperty("animation-duration");
      links[i].style.removeProperty("animation-timing-function");
      links[i].style.removeProperty("animation-iteration-count");
      links[i].style.removeProperty("animation-fill-mode");
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
    resetItemAnimationStyles(menu);
    menu.classList.remove("motion-closing");
    menu.classList.add("motion-open");
  }

  function closeMenu(item) {
    var menu = menuFromItem(item);
    if (!menu) return;

    clearTimer(item);
    resetItemAnimationStyles(menu);
    menu.classList.remove("motion-open");
    menu.classList.add("motion-closing");

    var links = menu.querySelectorAll(":scope > a");
    for (var i = 0; i < links.length; i++) {
      links[i].style.setProperty("animation-delay", (i * STAGGER) + "ms", "important");
    }

    var count = links.length;
    var total = Math.max(ITEM_DURATION, Math.max(0, count - 1) * STAGGER + ITEM_DURATION + EXTRA_BUFFER);

    var timer = setTimeout(function () {
      menu.classList.remove("motion-closing");
      resetItemAnimationStyles(menu);
      timers.delete(item);
    }, total);

    timers.set(item, timer);
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
