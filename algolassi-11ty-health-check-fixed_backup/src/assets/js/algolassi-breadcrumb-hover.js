/* =========================================================
   ALGOLASSI BREADCRUMB CHILD MENU
   ========================================================= */
(function () {
  "use strict";

  var selector = ".breadcrumb-menu > a, .breadcrumb-child-menu > a";
  var breadcrumbSelector = ".breadcrumbs .breadcrumb-item, .breadcrumbs > .breadcrumb-current";

  var touchStartX = 0;
  var touchStartY = 0;
  var isTapGesture = false;

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

  function alignChildMenu(item, forceAlign) {
    if (!item) return;

    var menu = directChild(item, ".breadcrumb-child-menu");
    if (!menu) return;
    if (!forceAlign && menu.classList.contains("open")) return;

    var trigger = directChild(item, ".breadcrumb-trigger") ||
                  (item.classList.contains("breadcrumb-current") ? item : null);
    var selected = menu.querySelector("a.breadcrumb-dropdown-current");
    if (!trigger || !selected) return;

    constrainChildMenuWidth(item);

    var wasOpen = menu.classList.contains("open");
    if (!wasOpen) menu.classList.add("open");

    menu.style.setProperty("transform", "none", "important");
    menu.style.setProperty("transition", "none", "important");
    menu.style.setProperty("max-height", "none", "important");
    menu.style.setProperty("overflow-y", "visible", "important");
    menu.style.setProperty("top", "0px", "important");

    void menu.offsetWidth;

    var triggerRect = trigger.getBoundingClientRect();
    var selectedRect = selected.getBoundingClientRect();
    var menuRect = menu.getBoundingClientRect();

    var triggerCenter = triggerRect.top + triggerRect.height / 2;
    var selectedCenterRelative = (selectedRect.top - menuRect.top) + (selectedRect.height / 2);
    var idealViewportTop = triggerCenter - selectedCenterRelative;
    var minTopSpace = 16;
    var maxBottomSpace = window.innerHeight - 16;
    var naturalHeight = menuRect.height;
    var expectedViewportTop = Math.max(idealViewportTop, minTopSpace);
    var requiredScrollTop = expectedViewportTop - idealViewportTop;
    var maxHeightToPermitScroll = naturalHeight - requiredScrollTop;
    var maxHeightToFitViewport = maxBottomSpace - expectedViewportTop;
    var finalMaxHeight = Math.min(naturalHeight, maxHeightToPermitScroll, maxHeightToFitViewport);
    finalMaxHeight = Math.max(1, finalMaxHeight);

    var targetTop = expectedViewportTop - menuRect.top;
    menu.style.setProperty("top", targetTop + "px", "important");

    if (finalMaxHeight < naturalHeight || requiredScrollTop > 0) {
      menu.style.setProperty("max-height", Math.floor(finalMaxHeight) + "px", "important");
      menu.style.setProperty("overflow-y", "auto", "important");
    } else {
      menu.style.setProperty("max-height", "none", "important");
      menu.style.setProperty("overflow-y", "hidden", "important");
    }

    menu.style.removeProperty("transform");
    menu.style.removeProperty("transition");

    menu.scrollTop = requiredScrollTop;

    if (!wasOpen && !forceAlign) menu.classList.remove("open");
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

  document.addEventListener("pointerenter", function (event) {
    var item = event.target && event.target.closest ? event.target.closest(".breadcrumb-child-item") : null;
    if (!item || event.target !== item) return;
    alignChildMenu(item, false);
  }, true);

  document.addEventListener("pointerdown", function (event) {
    var isMobile = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (!isMobile) return;

    touchStartX = event.clientX;
    touchStartY = event.clientY;
    isTapGesture = true;
  }, true);

  document.addEventListener("pointermove", function (event) {
    if (!isTapGesture) return;
    if (Math.abs(event.clientX - touchStartX) > 10 || Math.abs(event.clientY - touchStartY) > 10) {
      isTapGesture = false;
    }
  }, true);

  document.addEventListener("pointerup", function (event) {
    var isMobile = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (!isMobile || !isTapGesture) return;
    isTapGesture = false;

    var clickedItem = event.target && event.target.closest ? event.target.closest(".breadcrumb-child-item") : null;
    var clickedMenu = event.target && event.target.closest ? event.target.closest(".breadcrumb-child-menu") : null;
    var openMenu = document.querySelector(".breadcrumb-child-menu.open");

    if (clickedItem && !clickedMenu) {
      var menu = directChild(clickedItem, ".breadcrumb-child-menu");
      if (!menu) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      if (openMenu && openMenu !== menu) {
        closeAllMenus(menu);
      }

      if (!menu.classList.contains("open")) {
        menu.classList.add("open");
        alignChildMenu(clickedItem, true);
      }
      return;
    }

    if (openMenu && !clickedMenu) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeAllMenus();
    }
  }, true);

  function init() {
    initializeChildMenus();
    syncMobileBreadcrumbLinks();
  }

  window.addEventListener("resize", function () {
    syncMobileBreadcrumbLinks();
  }, { passive: true });
  window.addEventListener("load", init);
  window.addEventListener("algolassi:spa-navigation", function () { requestAnimationFrame(init); });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    requestAnimationFrame(init);
  }
})();

/* =========================================================
   ALGOLASSI ICON SYSTEM
   Replaces colored emoji / ASCII UI glyphs with monochrome,
   inline SVG icons that inherit their surrounding text color.
   This intentionally targets UI surfaces, not article/tutorial
   content or code examples.
   ========================================================= */
(function () {
  "use strict";

  var icons = {
    "🏠": '<path d="M3 10.6 12 3l9 7.6"/><path d="M5.5 9.4V21h13V9.4"/><path d="M9 21v-6.5h6V21"/>',
    "📚": '<path d="M5 4.5h11a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2z"/><path d="M5 4.5A2.5 2.5 0 0 0 2.5 7v10A3 3 0 0 0 5.5 20H18"/><path d="M8.5 8h6M8.5 11h6"/>',
    "ℹ️": '<circle cx="12" cy="12" r="9"/><path d="M12 10.2v6.2"/><path d="M12 7.1h.01"/>',
    "💻": '<rect x="3" y="4" width="18" height="13" rx="1.7"/><path d="M1.5 20h21"/><path d="M8.5 20 10 17h4l1.5 3"/>',
    "🌐": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.4 2.4 3.7 5.4 3.7 9s-1.3 6.6-3.7 9c-2.4-2.4-3.7-5.4-3.7-9S9.6 5.4 12 3Z"/><path d="M5.2 6.5c1.8 1 4.2 1.5 6.8 1.5s5-.5 6.8-1.5"/><path d="M5.2 17.5c1.8-1 4.2-1.5 6.8-1.5s5 .5 6.8 1.5"/>',
    "⚡": '<path d="M13.5 2 5 13h6.5L10.5 22 19 10h-6.5z"/>',
    "🔥": '<path d="M14 2.8c.3 3.2-1.1 4.8-2.8 6.1-1.1.8-1.8 1.7-1.8 3.1 0 1.2.7 2.3 1.8 3 .1-1.7 1-3.1 2.5-4.3 2.6 2 4.3 4.4 4.3 7.2A5.7 5.7 0 0 1 12 23a5.7 5.7 0 0 1-6-5.9c0-3.2 1.9-5.7 5.1-7.7-.2 2 .3 3.1 1.2 3.9.8-.9 1.4-2.2 1.7-4.1.2-1.9-.3-3.7 0-6.4Z"/>',
    "🛢️": '<ellipse cx="12" cy="5" rx="7.5" ry="2.8"/><path d="M4.5 5v12c0 1.6 3.4 2.8 7.5 2.8s7.5-1.2 7.5-2.8V5"/><path d="M4.5 11c0 1.6 3.4 2.8 7.5 2.8s7.5-1.2 7.5-2.8"/>',
    "📱": '<rect x="6.5" y="2.5" width="11" height="19" rx="2"/><path d="M10 5h4"/><path d="M11 18.5h2"/>',
    "📦": '<path d="m4 8 8-4 8 4-8 4z"/><path d="M4 8v9l8 4 8-4V8"/><path d="M12 12v9"/><path d="m8 6 8 4"/>',
    "⚠️": '<path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5"/><path d="M12 17.5h.01"/>',
    "🚨": '<path d="M7 18h10"/><path d="M5 14h14"/><path d="M8 10h8"/><path d="M10 6h4"/><path d="M12 3v2"/><path d="m4 6 1 1m15-1-1 1M3 14H1m22 0h-2"/>',
    "🔗": '<path d="M9.6 14.4 8 16a4 4 0 0 1-5.7-5.7l3-3A4 4 0 0 1 11 7"/><path d="m14.4 9.6 1.6-1.6a4 4 0 0 1 5.7 5.7l-3 3A4 4 0 0 1 13 17"/><path d="m8 12 8-8"/>',
    "🔎": '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    "🧹": '<path d="m4 3 7 7"/><path d="M14 10 7 17"/><path d="m4 15 6 6"/><path d="M14 10h7v4h-7l-3 3-4-4 3-3Z"/>',
    "📋": '<rect x="5" y="4" width="14" height="17" rx="1.5"/><path d="M9 4V2h6v2M8.5 9h7M8.5 13h7M8.5 17h5"/>',
    "🔄": '<path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M19.2 12a7 7 0 0 0-12.4-4.4L4 10"/><path d="M4.8 12a7 7 0 0 0 12.4 4.4L20 14"/>',
    "💉": '<path d="m7 17 10-10"/><path d="m5 19 2-2 2 2-2 2z"/><path d="m16 5 3-3 2 2-3 3"/><path d="m11 7 6 6"/><path d="m9 9 6 6"/>',
    "🧩": '<path d="M9 3h3a2 2 0 1 1 3 2v1h3a2 2 0 0 1 2 2v3h-1a2 2 0 1 0 0 4h1v3a2 2 0 0 1-2 2h-3v-1a2 2 0 1 0-4 0v1H8a2 2 0 0 1-2-2v-3h1a2 2 0 1 0 0-4H6V8a2 2 0 0 1 2-2h1z"/>',
    "❓": '<circle cx="12" cy="12" r="9"/><path d="M9.3 9a2.8 2.8 0 1 1 4.2 2.4c-1.1.7-1.8 1.2-1.8 2.7"/><path d="M12 17.5h.01"/>',
    "🔌": '<path d="M9 2v6M15 2v6M7 5h10"/><path d="M5 8h14v3a7 7 0 0 1-14 0Z"/><path d="M12 18v4"/>',
    "⚖️": '<path d="M12 4v16M7 4h10M5 7h4M15 7h4"/><path d="m5 7-3 6h6zM19 7l-3 6h6z"/><path d="M7 20h10"/>',
    "📡": '<path d="M5 9a10 10 0 0 1 14 0"/><path d="M7.5 12a6.5 6.5 0 0 1 9 0"/><path d="M10 15a3 3 0 0 1 4 0"/><circle cx="12" cy="18" r="1"/>',
    "🧱": '<path d="M3 5h8v6H3zM13 5h8v6h-8zM3 13h5v6H3zM10 13h11v6H10z"/>',
    "📇": '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M13 9h4M13 12h4M7 15h10"/>',
    "📁": '<path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H9l2 2h7.5A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5Z"/>',
    "▶": '<path d="m8 5 10 7-10 7z"/>',
    "←": '<path d="M20 12H4"/><path d="m10 6-6 6 6 6"/>',
    "▼": '<path d="m6 9 6 6 6-6"/>'
  };

  var uiSelector = [
    ".breadcrumbs",
    ".maui-playground",
    ".maui-project-explorer",
    ".maui-packages-panel",
    ".maui-packages-header",
    ".maui-tree-project",
    ".maui-solution-name",
    ".maui-playground-nav",
    ".maui-panel-title"
  ].join(",");

  function injectStyles() {
    if (document.getElementById("algolassi-icon-system-styles")) return;
    var style = document.createElement("style");
    style.id = "algolassi-icon-system-styles";
    style.textContent = [
      ".algolassi-icon-inline{display:inline-block;width:1em;height:1em;min-width:1em;vertical-align:-.14em;margin-right:.3em;color:currentColor;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}",
      ".algolassi-icon-inline.algolassi-icon-tight{margin-right:.15em}",
      ".maui-browser-toolbar .algolassi-icon-inline{margin-right:0}",
      ".maui-packages-icon .algolassi-icon-inline{width:1.1em;height:1.1em;margin-right:0}",
      ".breadcrumb-arrow .algolassi-icon-inline{width:.85em;height:.85em;margin-right:0;vertical-align:-.08em}",
      ".breadcrumb-trigger>.algolassi-icon-inline,.breadcrumb-current>.algolassi-icon-inline{flex:0 0 auto}"
    ].join("");
    document.head.appendChild(style);
  }

  function createIcon(symbol) {
    var markup = icons[symbol];
    if (!markup) return null;
    var wrapper = document.createElement("span");
    wrapper.className = "algolassi-icon-inline";
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.dataset.algolassiIcon = symbol;

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.innerHTML = markup;
    wrapper.appendChild(svg);
    return wrapper;
  }

  function replaceTextNode(textNode) {
    var value = textNode.nodeValue;
    if (!value || !value.trim()) return;

    for (var symbol in icons) {
      if (!Object.prototype.hasOwnProperty.call(icons, symbol)) continue;
      var index = value.indexOf(symbol);
      if (index === -1) continue;

      var before = value.slice(0, index);
      var after = value.slice(index + symbol.length);
      var icon = createIcon(symbol);
      if (!icon) return;

      var parent = textNode.parentNode;
      if (!parent) return;
      if (before) parent.insertBefore(document.createTextNode(before), textNode);
      parent.insertBefore(icon, textNode);
      textNode.nodeValue = after;
      if (after && Object.keys(icons).some(function (s) { return after.indexOf(s) === 0; })) {
        replaceTextNode(textNode);
      }
      return;
    }
  }

  function normalizeIcons() {
    injectStyles();
    document.querySelectorAll(uiSelector).forEach(function (root) {
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (node) {
        if (!node.parentElement || node.parentElement.closest(".algolassi-icon-inline")) return;
        replaceTextNode(node);
      });
    });
  }

  function init() {
    requestAnimationFrame(normalizeIcons);
  }

  window.addEventListener("load", init, { once: true });
  window.addEventListener("algolassi:spa-navigation", init);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();