/* Developer Tools-only breadcrumb hierarchy.
 * Tutorial and other site breadcrumbs are left untouched.
 *
 * Developer Tools:
 *   Home → Developer Tools → Category → Current Tool
 *          ↳ category list      ↳ category-specific tool menu
 */
(function () {
  "use strict";

  var ROOT = "/developer-tools/";

  var CATEGORIES = [
    {
      title: "🖼️ Image Tools",
      url: ROOT + "image-tools/",
      key: "image-tools",
      tools: []
    },
    {
      title: "🔄 Format Converters",
      url: ROOT + "format-converters/",
      key: "format-converters",
      tools: [
        { title: "64 Base64 Encoder / Decoder", url: ROOT + "base64-encoder-decoder/" },
        { title: "URL Encoder / Decoder", url: ROOT + "url-encoder-decoder/" },
        { title: "<> HTML Encoder / Decoder", url: ROOT + "html-encoder-decoder/" }
      ]
    },
    {
      title: "{} Data & Validation",
      url: ROOT + "data-validation/",
      key: "data-validation",
      tools: [
        { title: "{} JSON Formatter & Validator", url: ROOT + "json-formatter/" },
        { title: "JWT Inspector", url: ROOT + "jwt-decoder/" },
        { title: ".* Regex Tester", url: ROOT + "regex-tester/" }
      ]
    },
    {
      title: "🧰 Developer Utilities",
      url: ROOT + "developer-utilities/",
      key: "developer-utilities",
      tools: [
        { title: "ID GUID / UUID Generator", url: ROOT + "guid-generator/" },
        { title: "TS Unix Timestamp Converter", url: ROOT + "unix-timestamp-converter/" },
        { title: "= Code Equals Sign Aligner", url: ROOT + "code-equals-aligner/" }
      ]
    }
  ];

  var TOOL_TO_CATEGORY = Object.create(null);
  CATEGORIES.forEach(function (category) {
    category.tools.forEach(function (tool) {
      TOOL_TO_CATEGORY[tool.url] = category;
    });
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
    var menu = createElement("div", "breadcrumb-menu");
    menu.setAttribute("data-menu", "developer-tools");
    CATEGORIES.forEach(function (category) {
      var link = createElement("a", "", category.title);
      link.href = category.url;
      if (normalize(category.url) === normalize(currentPath)) link.className = "breadcrumb-dropdown-current";
      menu.appendChild(link);
    });
    return menu;
  }

  function buildToolMenu(category, currentPath) {
    var menu = createElement("div", "breadcrumb-child-menu");
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
    var item = createElement("div", "breadcrumb-item algolassi-toolmenu-devtools");
    var link = createElement("a", "breadcrumb-trigger crumb-trigger", "🛠️ Developer Tools");
    link.href = ROOT;
    link.setAttribute("data-menu", "developer-tools");
    link.appendChild(createElement("span", "breadcrumb-arrow", "▼"));
    item.appendChild(link);
    item.appendChild(buildCategoryMenu(currentPath));
    return item;
  }

  function createCategoryItem(category, currentPath, currentPageIsCategory) {
    var item = createElement("div", "breadcrumb-item algolassi-toolmenu-category");
    var link = createElement("a", "breadcrumb-trigger crumb-trigger", category.title);
    link.href = category.url;
    link.setAttribute("data-menu", "devtools-" + category.key);
    link.appendChild(createElement("span", "breadcrumb-arrow", "▼"));
    item.appendChild(link);

    if (currentPageIsCategory || category.tools.length) {
      item.appendChild(buildToolMenu(category, currentPath));
    }
    return item;
  }

  function createCurrentItem(category, currentPath) {
    var title = document.querySelector(".site-main h1");
    var text = title && title.textContent.trim()
      ? title.textContent.trim()
      : document.title.replace(/\s*\|\s*Algolassi\s*$/i, "").trim();
    return createElement("span", "breadcrumb-current", "📄 " + (text || "Developer Tool"));
  }

  function rebuild() {
    var path = normalize(location.pathname);
    if (path.indexOf(ROOT) !== 0) return false;

    var breadcrumbs = document.querySelector(".site-main > .breadcrumbs");
    if (!breadcrumbs) return false;

    var category = currentCategory(path);
    var isRoot = path === ROOT;
    if (!category && !isRoot) return false;

    breadcrumbs.innerHTML = "";
    breadcrumbs.appendChild(createHomeItem());
    breadcrumbs.appendChild(createSeparator());
    breadcrumbs.appendChild(createDeveloperRootItem(path));

    if (isRoot) {
      breadcrumbs.appendChild(createSeparator());
      breadcrumbs.appendChild(createElement("span", "breadcrumb-current", "📄 Developer Tools"));
      return true;
    }

    breadcrumbs.appendChild(createSeparator());
    breadcrumbs.appendChild(createCategoryItem(category, path, normalize(category.url) === path));

    if (normalize(category.url) !== path) {
      breadcrumbs.appendChild(createSeparator());
      breadcrumbs.appendChild(createCurrentItem(category, path));
    }

    return true;
  }

  function refresh() {
    if (!rebuild()) return;
    window.requestAnimationFrame(function () {
      try { window.dispatchEvent(new Event("resize")); } catch (e) {}
    });
  }

  document.addEventListener("DOMContentLoaded", refresh, { once: true });
  window.addEventListener("load", refresh);
  window.addEventListener("algolassi:spa-navigation", function () { requestAnimationFrame(refresh); });
  window.addEventListener("popstate", function () { requestAnimationFrame(refresh); });
  if (document.readyState !== "loading") requestAnimationFrame(refresh);
})();
