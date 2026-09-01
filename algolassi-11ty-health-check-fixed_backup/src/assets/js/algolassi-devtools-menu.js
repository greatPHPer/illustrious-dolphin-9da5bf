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

  function buildCategoryMenu(currentPath) {
    var menu = createElement("div", "breadcrumb-menu algolassi-toolmenu-menu");
    menu.setAttribute("data-menu", "developer-tools-categories");
    CATEGORIES.forEach(function (category) {
      var link = createElement("a", "", category.title);
      link.href = category.url;
      if (normalize(category.url) === normalize(currentPath)) link.className = "breadcrumb-dropdown-current";
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
      if (normalize(tool.url) === normalize(currentPath)) link.className = "breadcrumb-dropdown-current";
      menu.appendChild(link);
    });
    if (!category.tools.length) {
      menu.appendChild(createElement("span", "breadcrumb-toolmenu-empty", "More tools coming soon"));
    }
    return menu;
  }

  function createDeveloperRootItem(currentPath) {
    var item = createElement("div", "breadcrumb-item breadcrumb-child-item algolassi-toolmenu-managed algolassi-toolmenu-devtools");
    var link = createElement("a", "breadcrumb-trigger crumb-trigger", "🛠️ Developer Tools");
    link.href = ROOT;
    link.setAttribute("data-menu", "developer-tools");
    link.appendChild(createElement("span", "breadcrumb-arrow", "▼"));
    item.appendChild(link);
    item.appendChild(buildCategoryMenu(currentPath));
    return item;
  }

  function createCategoryItem(category, currentPath, isCategoryPage) {
    var item = createElement("div", "breadcrumb-item breadcrumb-child-item algolassi-toolmenu-managed algolassi-toolmenu-category");
    var link = createElement("a", "breadcrumb-trigger crumb-trigger", category.title);
    link.href = category.url;
    link.setAttribute("data-menu", "devtools-" + category.key);
    if (isCategoryPage) link.appendChild(createElement("span", "breadcrumb-arrow", "▼"));
    item.appendChild(link);
    if (isCategoryPage) item.appendChild(buildToolMenu(category, currentPath));
    return item;
  }

  function createCurrentItem(category, currentPath) {
    var heading = document.querySelector(".site-main h1");
    var text = heading && heading.textContent.trim()
      ? heading.textContent.trim()
      : document.title.replace(/\s*\|\s*Algolassi\s*$/i, "").trim();

    var item = createElement("span", "breadcrumb-current breadcrumb-child-item algolassi-toolmenu-current", "📄 " + (text || "Developer Tool") + " ");
    item.appendChild(createElement("span", "breadcrumb-arrow", "▼"));
    item.appendChild(buildToolMenu(category, currentPath));
    return item;
  }

  function showMenu(menu) {
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
    item.addEventListener("mouseenter", function () { showMenu(menu); });
    item.addEventListener("mouseleave", function () { hideMenu(menu); });
    item.addEventListener("focusin", function () { showMenu(menu); });
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
      var rootItem = createDeveloperRootItem(path);
      breadcrumbs.appendChild(rootItem);
      attachHover(rootItem);
      return true;
    }

    var isCategoryPage = normalize(category.url) === path;
    var categoryItem = createCategoryItem(category, path, isCategoryPage);
    breadcrumbs.appendChild(categoryItem);

    if (isCategoryPage) {
      attachHover(categoryItem);
      return true;
    }

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
