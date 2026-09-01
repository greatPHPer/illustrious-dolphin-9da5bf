/* Developer Tools category / tool breadcrumb hierarchy. */
(function () {
  "use strict";

  var CATEGORIES = [
    {
      title: "🖼️ Image Tools",
      url: "/developer-tools/image-tools/",
      key: "image-tools",
      tools: []
    },
    {
      title: "🔄 Format Converters",
      url: "/developer-tools/format-converters/",
      key: "format-converters",
      tools: [
        { title: "64 Base64 Encoder / Decoder", url: "/developer-tools/base64-encoder-decoder/" },
        { title: "URL Encoder / Decoder", url: "/developer-tools/url-encoder-decoder/" },
        { title: "<> HTML Encoder / Decoder", url: "/developer-tools/html-encoder-decoder/" }
      ]
    },
    {
      title: "{} Data & Validation",
      url: "/developer-tools/data-validation/",
      key: "data-validation",
      tools: [
        { title: "{} JSON Formatter & Validator", url: "/developer-tools/json-formatter/" },
        { title: "JWT Inspector", url: "/developer-tools/jwt-decoder/" },
        { title: ".* Regex Tester", url: "/developer-tools/regex-tester/" }
      ]
    },
    {
      title: "🧰 Developer Utilities",
      url: "/developer-tools/developer-utilities/",
      key: "developer-utilities",
      tools: [
        { title: "ID GUID / UUID Generator", url: "/developer-tools/guid-generator/" },
        { title: "TS Unix Timestamp Converter", url: "/developer-tools/unix-timestamp-converter/" },
        { title: "= Code Equals Sign Aligner", url: "/developer-tools/code-equals-aligner/" }
      ]
    }
  ];

  var TOOL_TO_CATEGORY = {};
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

  function directChild(parent, selector) {
    if (!parent) return null;
    for (var i = 0; i < parent.children.length; i++) {
      if (parent.children[i].matches && parent.children[i].matches(selector)) return parent.children[i];
    }
    return null;
  }

  function buildLink(item, currentPath) {
    var link = document.createElement("a");
    link.href = item.url;
    link.textContent = item.title;
    if (normalize(currentPath) === normalize(item.url)) link.className = "breadcrumb-dropdown-current";
    return link;
  }

  function rebuildDeveloperMenu(devItem, currentPath) {
    var menu = directChild(devItem, ".breadcrumb-menu");
    if (!menu) return;

    menu.classList.remove("breadcrumb-child-menu-source-hidden");
    menu.removeAttribute("style");
    menu.innerHTML = "";

    CATEGORIES.forEach(function (category) {
      menu.appendChild(buildLink(category, currentPath));
    });
  }

  function removeGeneratedCategory(breadcrumbs) {
    breadcrumbs.querySelectorAll(".algolassi-toolmenu-category-separator, .algolassi-toolmenu-category").forEach(function (node) {
      node.remove();
    });
  }

  function clearGeneratedChildMenus(devItem, current) {
    if (devItem) {
      Array.prototype.slice.call(devItem.children).forEach(function (child) {
        if (child.matches && child.matches(".breadcrumb-child-menu")) child.remove();
      });
    }
    if (current) {
      Array.prototype.slice.call(current.children).forEach(function (child) {
        if (child.matches && child.matches(".breadcrumb-child-menu")) child.remove();
      });
    }
  }

  function addCategoryLevel(breadcrumbs, current, category, currentPath) {
    if (!current || !category) return;

    var item = document.createElement("div");
    item.className = "breadcrumb-item breadcrumb-child-item algolassi-toolmenu-category";
    item.setAttribute("data-tool-category", category.key);

    var trigger = document.createElement("a");
    trigger.href = category.url;
    trigger.className = "breadcrumb-trigger crumb-trigger";
    trigger.setAttribute("data-menu", "devtools-" + category.key);
    trigger.textContent = category.title + " ";

    var arrow = document.createElement("span");
    arrow.className = "breadcrumb-arrow";
    arrow.textContent = "▼";
    trigger.appendChild(arrow);
    item.appendChild(trigger);

    var menu = document.createElement("div");
    menu.className = "breadcrumb-child-menu";
    menu.setAttribute("data-tool-category-menu", category.key);

    if (category.tools.length) {
      category.tools.forEach(function (tool) {
        menu.appendChild(buildLink(tool, currentPath));
      });
    } else {
      var empty = document.createElement("span");
      empty.className = "breadcrumb-toolmenu-empty";
      empty.textContent = "More tools coming soon";
      menu.appendChild(empty);
    }

    item.appendChild(menu);

    var separator = document.createElement("span");
    separator.className = "breadcrumb-separator algolassi-toolmenu-category-separator";
    separator.textContent = "/";

    current.parentNode.insertBefore(item, current);
    current.parentNode.insertBefore(separator, current);
  }

  function update() {
    var breadcrumbs = document.querySelector(".site-main > .breadcrumbs");
    if (!breadcrumbs) return;

    var devLink = breadcrumbs.querySelector('a[href="/developer-tools/"]');
    if (!devLink) return;

    var devItem = devLink.closest(".breadcrumb-item");
    var current = breadcrumbs.querySelector(":scope > .breadcrumb-current");
    if (!devItem || !current) return;

    var currentPath = normalize(location.pathname);
    var category = currentPath === "/developer-tools/" ? null :
      CATEGORIES.reduce(function (found, candidate) {
        return found || (normalize(candidate.url) === currentPath ? candidate : null);
      }, null) || TOOL_TO_CATEGORY[currentPath];

    removeGeneratedCategory(breadcrumbs);
    clearGeneratedChildMenus(devItem, current);
    rebuildDeveloperMenu(devItem, currentPath);

    if (category) addCategoryLevel(breadcrumbs, current, category, currentPath);

    // Let the existing mobile breadcrumb logic re-evaluate the newly inserted level.
    try {
      window.dispatchEvent(new Event("resize"));
    } catch (e) {}
  }

  document.addEventListener("DOMContentLoaded", update, { once: true });
  window.addEventListener("load", update);
  window.addEventListener("algolassi:spa-navigation", function () {
    window.requestAnimationFrame(update);
  });
  window.addEventListener("popstate", function () {
    window.requestAnimationFrame(update);
  });

  if (document.readyState !== "loading") window.requestAnimationFrame(update);
})();
