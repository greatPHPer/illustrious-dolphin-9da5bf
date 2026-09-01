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
    var item = createElement("div", "breadcrumb-item");
    var link = createElement("a", "breadcrumb-trigger crumb-trigger", "🏠 Home");
    link.href = "/";
    item.appendChild(link);
    return item;
  }

  // Level-2 menu selection is based ONLY on the active category.
  // It must remain highlighted even when the current URL is one of that
  // category's individual tools.
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

  // Level-3 menu selection is based ONLY on the current tool URL.
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

    if (!category.tools.length) menu.appendChild(createElement("span", "breadcrumb-toolmenu-empty", "More tools coming soon"));
    return menu;
  }

  function createDeveloperRootItem(activeCategory) {
    var item = createElement("div", "breadcrumb-item breadcrumb-child-item algolassi-toolmenu-managed algolassi-toolmenu-devtools");
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

  // Level 3 is always present once a Developer Tools category is known.
  // It owns the category's actual tool submenu, including selected-item alignment.
  function createCurrentItem(category, currentPath) {
    var heading = document.querySelector(".site-main h1");
    var text = heading && heading.textContent.trim()
      ? heading.textContent.trim()
      : document.title.replace(/\s*\|\s*Algolassi\s*$/i, "").trim();

    if (normalize(category.url) === normalize(currentPath)) {
      text = category.title.replace(/^[^A-Za-z0-9]+/, "").trim();
    }

    var item = createElement("span", "breadcrumb-current breadcrumb-child-item algolassi-toolmenu-current", "📄 " + (text || "Developer Tool") + " ");
    item.appendChild(createElement("span", "breadcrumb-arrow", "▼"));
    item.appendChild(buildToolMenu(category, currentPath));
    return item;
  }

  function alignToolMenu(item, menu) {
    if (!item || !menu) return;

    var selected = menu.querySelector("a.breadcrumb-dropdown-current");
    if (!selected) {
      menu.style.removeProperty("max-height");
      menu.style.removeProperty("overflow-y");
      menu.style.removeProperty("top");
      return;
    }

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
    alignToolMenu(item, menu);
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
      return true;
    }

    var categoryItem = createCategoryItem(category, category);
    breadcrumbs.appendChild(categoryItem);
    attachHover(categoryItem);

    breadcrumbs.appendChild(createSeparator());
    var currentItem = createCurrentItem(category, path);
    breadcrumbs.appendChild(currentItem);
    attachHover(currentItem);

    return true;
  }

  function refreshAfterSpa() {
    rebuild();
    window.setTimeout(rebuild, 50);
    window.setTimeout(rebuild, 200);
  }

  document.addEventListener("DOMContentLoaded", rebuild, { once: true });
  window.addEventListener("load", rebuild);
  window.addEventListener("algolassi:spa-navigation", refreshAfterSpa);
  window.addEventListener("popstate", refreshAfterSpa);
  if (document.readyState !== "loading") window.requestAnimationFrame(rebuild);
})();
