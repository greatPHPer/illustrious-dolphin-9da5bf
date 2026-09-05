/* Developer Tools-only breadcrumb hierarchy. */
(function () {
  "use strict";

  var ROOT = "/developer-tools/";
  var CATEGORIES = [
    { title: "🖼️ Image Tools", url: ROOT + "image-tools/", key: "image-tools", tools: [] },
    { title: "🔄 Format Converters", url: ROOT + "format-converters/", key: "format-converters", tools: [
      { title: "64 Base64 Encoder / Decoder", url: ROOT + "base64-encoder-decoder/" },
      { title: "URL Encoder / Decoder", url: ROOT + "url-encoder-decoder/" },
      { title: "<> HTML Encoder / Decoder", url: ROOT + "html-encoder-decoder/" }
    ] },
    { title: "{} Data & Validation", url: ROOT + "data-validation/", key: "data-validation", tools: [
      { title: "{} JSON Formatter & Validator", url: ROOT + "json-formatter/" },
      { title: "JWT Inspector", url: ROOT + "jwt-decoder/" },
      { title: ".* Regex Tester", url: ROOT + "regex-tester/" }
    ] },
    { title: "🎨 CSS & UI Tools", url: ROOT + "css-button-editor/", key: "css-ui-tools", tools: [
      { title: "✦ CSS Button Editor", url: ROOT + "css-button-editor/" },
      { title: "✨ 60 Glossy CSS Buttons", url: ROOT + "glossy-css-buttons/" }
    ] },
    { title: "🧰 Developer Utilities", url: ROOT + "developer-utilities/", key: "developer-utilities", tools: [
      { title: "ID GUID / UUID Generator", url: ROOT + "guid-generator/" },
      { title: "TS Unix Timestamp Converter", url: ROOT + "unix-timestamp-converter/" },
      { title: "= Code Equals Sign Aligner", url: ROOT + "code-equals-aligner/" }
    ] }
  ];

  var TOOL_TO_CATEGORY = Object.create(null);
  CATEGORIES.forEach(function (category) {
    category.tools.forEach(function (tool) { TOOL_TO_CATEGORY[tool.url] = category; });
  });

  function normalize(path) {
    var value = path || "/";
    if (value.length > 1 && value.charAt(value.length - 1) !== "/") value += "/";
    return value;
  }

  function currentCategory(path) {
    var normalized = normalize(path);
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].url === normalized) return CATEGORIES[i];
    }
    return TOOL_TO_CATEGORY[normalized] || null;
  }

  function createElement(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  }

  function createSeparator() {
    return createElement("span", "breadcrumb-separator algolassi-toolmenu-separator", "/");
  }

  function createHomeItem() {
    var item = createElement("div", "breadcrumb-item breadcrumb-child-item algolassi-toolmenu-managed algolassi-toolmenu-category algolassi-toolmenu-home");
    var link = createElement("a", "breadcrumb-trigger crumb-trigger", "🏠 Home");
    link.href = "/";
    link.setAttribute("data-menu", "developer-tools-home");
    item.appendChild(link);
    return item;
  }

  function buildCategoryMenu(activeCategory) {
    var menu = createElement("div", "breadcrumb-menu algolassi-toolmenu-menu");
    menu.setAttribute("data-menu", "developer-tools-categories");

    CATEGORIES.forEach(function (category) {
      var link = createElement("a", "", category.title);
      link.href = category.url;
      if (activeCategory && category.key === activeCategory.key) {
        link.className = "breadcrumb-dropdown-current";
      }
      menu.appendChild(link);
    });

    return menu;
  }

  function buildToolMenu(category, currentPath) {
    var menu = createElement("div", "breadcrumb-menu algolassi-toolmenu-menu");
    menu.setAttribute("data-tool-category-menu", category.key);

    category.tools.forEach(function (tool) {
      var link = createElement("a", "", tool.title);
      link.href = tool.url;
      if (normalize(tool.url) === normalize(currentPath)) {
        link.className = "breadcrumb-dropdown-current";
      }
      menu.appendChild(link);
    });

    return menu;
  }

  function createDeveloperRootItem(activeCategory) {
    var item = createElement("div", "breadcrumb-item breadcrumb-child-item algolassi-toolmenu-managed algolassi-toolmenu-devtools algolassi-toolmenu-category");
    var link = createElement("a", "breadcrumb-trigger crumb-trigger", "🛠️ Developer Tools");
    link.href = ROOT;
    link.setAttribute("data-menu", "developer-tools");
    link.appendChild(createElement("span", "breadcrumb-arrow", "▼"));
    item.appendChild(link);
    item.appendChild(buildCategoryMenu(activeCategory));
    return item;
  }

  function createCategoryItem(category, activeCategory) {
    var item = createElement("div", "breadcrumb-item breadcrumb-child-item algolassi-toolmenu-managed algolassi-toolmenu-category");
    var link = createElement("a", "breadcrumb-trigger crumb-trigger", category.title);
    link.href = category.url;
    link.setAttribute("data-menu", "devtools-" + category.key);
    link.appendChild(createElement("span", "breadcrumb-arrow", "▼"));
    item.appendChild(link);
    item.appendChild(buildCategoryMenu(activeCategory));
    return item;
  }

  function createCurrentItem(category, currentPath) {
    var heading = document.querySelector(".site-main h1");
    var text = heading && heading.textContent.trim()
      ? heading.textContent.trim()
      : document.title.replace(/\s*\|\s*Algolassi\s*$/i, "").trim();

    if (normalize(category.url) === normalize(currentPath)) {
      text = category.title.replace(/^[^A-Za-z0-9]+/, "").trim();
    }

    var item = createElement("span", "breadcrumb-current breadcrumb-child-item algolassi-toolmenu-current algolassi-toolmenu-managed", "📄 " + (text || "Developer Tool") + " ");

    if (category.tools.length) {
      item.appendChild(createElement("span", "breadcrumb-arrow", "▼"));
      item.appendChild(buildToolMenu(category, currentPath));
    }

    return item;
  }

  function alignToolMenu(item, menu) {
    if (!item || !menu) return;
    if (menu.classList.contains("open")) return;

    var selected = menu.querySelector("a.breadcrumb-dropdown-current");
    if (!selected) return;

    menu.style.setProperty("visibility", "visible", "important");
    menu.style.setProperty("opacity", "0", "important");
    menu.style.setProperty("pointer-events", "none", "important");
    menu.style.setProperty("transform", "none", "important");
    menu.style.setProperty("transition", "none", "important");
    menu.style.setProperty("max-height", "none", "important");
    menu.style.setProperty("overflow-y", "visible", "important");
    menu.style.setProperty("top", "0px", "important");

    void menu.offsetWidth;

    var itemRect = item.getBoundingClientRect();
    var selectedRect = selected.getBoundingClientRect();
    var menuRect = menu.getBoundingClientRect();
    var triggerCenter = itemRect.top + itemRect.height / 2;
    var selectedCenterRelative = (selectedRect.top - menuRect.top) + selectedRect.height / 2;
    var idealViewportTop = triggerCenter - selectedCenterRelative;

    var minTopSpace = 16;
    var maxBottomSpace = window.innerHeight - 16;
    var naturalHeight = menuRect.height;
    var expectedViewportTop = Math.max(idealViewportTop, minTopSpace);
    var requiredScrollTop = Math.max(0, expectedViewportTop - idealViewportTop);
    var maxHeightToPermitScroll = Math.max(1, naturalHeight - requiredScrollTop);
    var maxHeightToFitViewport = Math.max(1, maxBottomSpace - expectedViewportTop);
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

    menu.scrollTop = Math.min(requiredScrollTop, Math.max(0, menu.scrollHeight - menu.clientHeight));

    menu.style.removeProperty("visibility");
    menu.style.removeProperty("opacity");
    menu.style.removeProperty("pointer-events");
    menu.style.removeProperty("transform");
    menu.style.removeProperty("transition");
  }

  function showMenu(item, menu) {
    if (!menu.classList.contains("open")) alignToolMenu(item, menu);
    menu.classList.add("open");
    menu.style.setProperty("visibility", "visible", "important");
    menu.style.setProperty("opacity", "1", "important");
    menu.style.setProperty("pointer-events", "auto", "important");
    menu.style.setProperty("transform", "translateY(0) scale(1)", "important");
  }

  function hideMenu(menu) {
    menu.classList.remove("open");
    menu.style.removeProperty("visibility");
    menu.style.removeProperty("opacity");
    menu.style.removeProperty("pointer-events");
    menu.style.removeProperty("transform");
  }

  function attachHover(item) {
    if (!item || item.dataset.toolmenuHoverAttached === "1") return;
    item.dataset.toolmenuHoverAttached = "1";

    var menu = item.querySelector(":scope > .algolassi-toolmenu-menu");
    if (!menu) return;

    item.addEventListener("mouseenter", function () { showMenu(item, menu); });
    item.addEventListener("mouseleave", function () { hideMenu(menu); });
    item.addEventListener("focusin", function () { showMenu(item, menu); });
    item.addEventListener("focusout", function (event) {
      if (!item.contains(event.relatedTarget)) hideMenu(menu);
    });
  }

  function syncAndroidRootTrigger() {
    var isAndroid = /Android/i.test(navigator.userAgent || "");
    var link = document.querySelector(".algolassi-toolmenu-devtools > .breadcrumb-trigger");
    if (!link) return;

    if (isAndroid) {
      link.removeAttribute("href");
      link.setAttribute("aria-disabled", "true");
    } else {
      link.setAttribute("href", ROOT);
      link.removeAttribute("aria-disabled");
    }
  }

  function makeCurrentMenuItemNonInteractiveOnMobile() {
    var isMobile = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    document.querySelectorAll(".algolassi-toolmenu-menu a.breadcrumb-dropdown-current").forEach(function (link) {
      if (isMobile) {
        link.style.setProperty("pointer-events", "none", "important");
        link.setAttribute("aria-current", "page");
        link.setAttribute("aria-disabled", "true");
        link.setAttribute("tabindex", "-1");
      } else {
        link.style.removeProperty("pointer-events");
        link.removeAttribute("aria-current");
        link.removeAttribute("aria-disabled");
        link.removeAttribute("tabindex");
      }
    });
    syncAndroidRootTrigger();
  }

  function rebuild() {
    var path = normalize(location.pathname);
    if (path.indexOf(ROOT) !== 0) return false;

    var breadcrumbs = document.querySelector(".site-main > .breadcrumbs");
    if (!breadcrumbs) return false;

    var category = currentCategory(path);
    var isRoot = path === ROOT;
    if (!isRoot && !category) return false;

    breadcrumbs.innerHTML = "";
    breadcrumbs.appendChild(createHomeItem());
    breadcrumbs.appendChild(createSeparator());

    if (isRoot) {
      var rootItem = createDeveloperRootItem(null);
      breadcrumbs.appendChild(rootItem);
      attachHover(rootItem);
      makeCurrentMenuItemNonInteractiveOnMobile();
      return true;
    }

    var categoryItem = createCategoryItem(category, category);
    breadcrumbs.appendChild(categoryItem);
    attachHover(categoryItem);

    breadcrumbs.appendChild(createSeparator());
    var currentItem = createCurrentItem(category, path);
    breadcrumbs.appendChild(currentItem);
    attachHover(currentItem);
    makeCurrentMenuItemNonInteractiveOnMobile();

    return true;
  }

  function refreshAfterSpa() {
    window.requestAnimationFrame(rebuild);
  }

  document.addEventListener("DOMContentLoaded", rebuild, { once: true });
  window.addEventListener("load", rebuild);
  window.addEventListener("algolassi:spa-navigation", refreshAfterSpa);
  window.addEventListener("popstate", refreshAfterSpa);
  window.addEventListener("resize", makeCurrentMenuItemNonInteractiveOnMobile, { passive: true });
  if (document.readyState !== "loading") window.requestAnimationFrame(rebuild);
})();
