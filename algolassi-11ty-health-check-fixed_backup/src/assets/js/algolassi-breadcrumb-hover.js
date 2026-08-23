/* Explicit breadcrumb submenu hover state + successive-child alignment */
(function () {
  "use strict";

  var selector = ".breadcrumb-menu > a";
  var breadcrumbSelector = ".breadcrumbs .breadcrumb-item";

  function activate(link) {
    if (!link) return;
    link.classList.remove("menu-item-tilted");
    void link.offsetWidth;
    link.classList.add("menu-item-tilted");
  }

  function deactivate(link) {
    if (link) link.classList.remove("menu-item-tilted");
  }

  /*
     Find the breadcrumb item immediately following the parent item.
     The breadcrumb markup puts a separator between levels, so we
     deliberately walk forward until the next .breadcrumb-item.
  */
  function getSuccessiveBreadcrumbItem(item) {
    if (!item) return null;

    var sibling = item.nextElementSibling;
    while (sibling) {
      if (sibling.matches && sibling.matches(breadcrumbSelector)) {
        return sibling;
      }
      sibling = sibling.nextElementSibling;
    }

    return null;
  }

  /*
     Align the highlighted submenu entry with the visible successive
     breadcrumb item. We compare vertical centers, so the selected
     child sits exactly on the same horizontal line as its breadcrumb
     counterpart regardless of which child is selected or how many
     entries the current submenu contains.
  */
  function alignCascade(menu) {
    if (!menu || window.innerWidth <= 700) {
      if (menu) menu.style.removeProperty("top");
      return;
    }

    var parentItem = menu.parentElement;
    var selected = menu.querySelector("a.breadcrumb-dropdown-current");
    var successiveItem = getSuccessiveBreadcrumbItem(parentItem);

    if (!parentItem || !selected || !successiveItem) {
      menu.style.top = "0px";
      return;
    }

    /* Start from the CSS cascade position, then measure the real layout. */
    menu.style.top = "0px";

    var selectedRect = selected.getBoundingClientRect();
    var successiveTarget =
      successiveItem.querySelector(":scope > .breadcrumb-trigger, :scope > .breadcrumb-current") ||
      successiveItem;
    var targetRect = successiveTarget.getBoundingClientRect();

    var selectedCenter = selectedRect.top + (selectedRect.height / 2);
    var targetCenter = targetRect.top + (targetRect.height / 2);
    var offset = targetCenter - selectedCenter;

    menu.style.top = Math.round(offset * 100) / 100 + "px";
  }

  function alignAllCascades() {
    document.querySelectorAll(".breadcrumb-menu").forEach(alignCascade);
  }

  document.addEventListener("pointerover", function (event) {
    var link = event.target && event.target.closest ? event.target.closest(selector) : null;
    if (!link) return;

    var from = event.relatedTarget && event.relatedTarget.closest ? event.relatedTarget.closest(selector) : null;
    if (from === link) return;

    activate(link);
    alignCascade(link.closest(".breadcrumb-menu"));
  }, true);

  document.addEventListener("pointerout", function (event) {
    var link = event.target && event.target.closest ? event.target.closest(selector) : null;
    if (!link) return;

    var to = event.relatedTarget && event.relatedTarget.closest ? event.relatedTarget.closest(selector) : null;
    if (to === link) return;
    deactivate(link);
  }, true);

  document.addEventListener("pointerenter", function (event) {
    var parentItem = event.target && event.target.closest ? event.target.closest(".breadcrumb-item") : null;
    if (!parentItem) return;

    var menu = parentItem.querySelector(":scope > .breadcrumb-menu");
    if (menu) alignCascade(menu);
  }, true);

  window.addEventListener("resize", alignAllCascades, { passive: true });
  window.addEventListener("load", alignAllCascades);
  window.addEventListener("algolassi:spa-navigation", function () {
    requestAnimationFrame(alignAllCascades);
  });

  /* The breadcrumb lives inside the SPA-swapped .site-main, so re-align
     after any DOM replacement as well as on the initial page load. */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      requestAnimationFrame(alignAllCascades);
    }, { once: true });
  } else {
    requestAnimationFrame(alignAllCascades);
  }
})();