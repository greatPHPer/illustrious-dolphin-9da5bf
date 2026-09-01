/* Developer Tools-only breadcrumb hierarchy.
 * Tutorial and other site breadcrumbs are left untouched.
 *
 * Developer Tools:
 *   Home → Category → Current Tool
 *                    ↳ category-specific tool menu on hover
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

  function createHomeItem() {
    var item = createElement("div", "breadcrumb-item");
    var link = createElement("a", "breadcrumb-trigger crumb-trigger");
    link.href = "/";
    link.textContent = "🏠 Home";
    var arrow = createElement("span", "breadcrumb-arrow", "▼");
    link.appendChild(arrow);

    // Preserve the familiar Home dropdown contents without making it part of
    // the Developer Tools hierarchy used for the second/third levels.
    var menu = createElement("div", "breadcrumb-menu");
    menu.setAttribute("data-menu", "home");
    var tutorials = createElement("a", "", "📚 Tutorials");
    tutorials.href = "/tutorials/";
    var about = createElement("a", "", "ℹ️ About");
    about.href = "/about-algolassi/";
    menu.appendChild(tutorials);
    menu.appendChild(about);

    item.appendChild(link);
    item.appendChild(menu);
    return item;
  }

  function createSeparator() {
    return createElement("span", "breadcrumb-separator", "/");
  }

  function createCategoryItem(category, currentPath) {
    var item = createElement("div", "breadcrumb-item");
    var link = createElement("a", "breadcrumb-trigger crumb-trigger");
    link.href = category.url;
    link.setAttribute("data-menu", "devtools-" + category.key);
    link.textContent = category.title;
    link.appendChild(createElement("span", "breadcrumb-arrow", "▼"));

    var menu = createElement("div", "breadcrumb-menu");
    menu.setAttribute("data-menu", "devtools-" + category.key);

    category.tools.forEach(function (tool) {
      var toolLink = createElement("a", "", tool.title);
      toolLink.href = tool.url;
      if (normalize(tool.url) === normalize(currentPath)) {
        toolLink.classList.add("breadcrumb-dropdown-current");
      }
      menu.appendChild(toolLink);
    });

    if (!category.tools.length) {
      menu.appendChild(createElement("span", "breadcrumb-toolmenu-empty", "More tools coming soon"));
    }

    item.appendChild(link);
    item.appendChild(menu);
    return item;
  }

  function createCurrentItem(title, category, currentPath) {
    var item = createElement("span", "breadcrumb-current", "📄 " + title);

    // When this is a tool page, the existing child-menu enhancer will clone
    // the category's .breadcrumb-menu onto this current breadcrumb item.
    item.setAttribute("data-tool-current", category.key);

    return item;
  }

  function pageTitle() {
    var heading = document.querySelector(".site-main h1");
    if (heading && heading.textContent.trim()) return heading.textContent.trim();
    var title = document.title.replace(/\s*\|\s*Algolassi\s*$/i, "").trim();
    return title || "Developer Tool";
  }

  function rebuild() {
    var path = normalize(location.pathname);
    if (path.indexOf(ROOT) !== 0) return false;

    var breadcrumbs = document.querySelector(".site-main > .breadcrumbs");
    if (!breadcrumbs) return false;

    var category = currentCategory(path);
    var isRoot = path === ROOT;
    if (!category && !isRoot) return false;

    // Do not touch tutorial or unrelated breadcrumbs.
    breadcrumbs.innerHTML = "";
    breadcrumbs.appendChild(createHomeItem());
    breadcrumbs.appendChild(createSeparator());

    if (isRoot) {
      var rootItem = createElement("span", "breadcrumb-current", "🛠️ Developer Tools");
      breadcrumbs.appendChild(rootItem);
      return true;
    }

    if (normalize(category.url) === path) {
      var categoryCurrent = createElement("span", "breadcrumb-current", category.title);
      breadcrumbs.appendChild(categoryCurrent);
      return true;
    }

    breadcrumbs.appendChild(createCategoryItem(category, path));
    breadcrumbs.appendChild(createSeparator());
    breadcrumbs.appendChild(createCurrentItem(pageTitle(), category, path));
    return true;
  }

  function refresh() {
    var changed = rebuild();
    if (!changed) return;

    // The child-menu system owns the hover/touch behavior and will clone the
    // category's menu onto the current tool item after this DOM is rebuilt.
    window.requestAnimationFrame(function () {
      try { window.dispatchEvent(new Event("resize")); } catch (e) {}
    });
  }

  document.addEventListener("DOMContentLoaded", refresh, { once: true });
  window.addEventListener("load", refresh);
  window.addEventListener("algolassi:spa-navigation", function () {
    window.requestAnimationFrame(refresh);
  });
  window.addEventListener("popstate", function () {
    window.requestAnimationFrame(refresh);
  });

  if (document.readyState !== "loading") window.requestAnimationFrame(refresh);
})();
