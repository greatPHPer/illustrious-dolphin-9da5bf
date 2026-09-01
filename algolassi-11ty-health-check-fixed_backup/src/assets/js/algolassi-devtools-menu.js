/* Developer Tools-only breadcrumb hierarchy: Home → Category → Tool. */
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
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function sep() { return el("span", "breadcrumb-separator algolassi-toolmenu-managed", "/"); }
  function makeHome() {
    var item = el("div", "breadcrumb-item algolassi-toolmenu-managed");
    var link = el("a", "breadcrumb-trigger crumb-trigger", "🏠 Home");
    link.href = "/";
    item.appendChild(link);
    return item;
  }
  function makeMenu(items, currentPath) {
    var menu = el("div", "breadcrumb-menu algolassi-toolmenu-menu");
    items.forEach(function (entry) {
      var link = el("a", "", entry.title);
      link.href = entry.url;
      if (normalize(entry.url) === normalize(currentPath)) link.className = "breadcrumb-dropdown-current";
      menu.appendChild(link);
    });
    return menu;
  }
  function makeRoot(currentPath) {
    var item = el("div", "breadcrumb-item algolassi-toolmenu-managed algolassi-toolmenu-root");
    var link = el("a", "breadcrumb-trigger crumb-trigger", "🛠️ Developer Tools");
    link.href = ROOT;
    link.appendChild(el("span", "breadcrumb-arrow", "▼"));
    item.appendChild(link);
    var menu = makeMenu(CATEGORIES, currentPath);
    menu.setAttribute("data-menu", "developer-tools-categories");
    item.appendChild(menu);
    return item;
  }
  function makeCategory(category, currentPath) {
    var item = el("div", "breadcrumb-item algolassi-toolmenu-managed algolassi-toolmenu-category");
    var link = el("a", "breadcrumb-trigger crumb-trigger", category.title);
    link.href = category.url;
    link.appendChild(el("span", "breadcrumb-arrow", "▼"));
    item.appendChild(link);
    var menu = makeMenu(category.tools, currentPath);
    menu.setAttribute("data-menu", "devtools-" + category.key);
    item.appendChild(menu);
    return item;
  }
  function makeCurrent(category) {
    var heading = document.querySelector(".site-main h1");
    var title = heading && heading.textContent.trim() ? heading.textContent.trim() : document.title.replace(/\s*\|\s*Algolassi\s*$/i, "").trim();
    return el("span", "breadcrumb-current algolassi-toolmenu-managed", "📄 " + (title || "Developer Tool"));
  }
  function show(menu) {
    menu.classList.add("open");
    menu.style.setProperty("visibility", "visible", "important");
    menu.style.setProperty("opacity", "1", "important");
    menu.style.setProperty("pointer-events", "auto", "important");
    menu.style.setProperty("transform", "translateY(0) scale(1)", "important");
  }
  function hide(menu) {
    menu.classList.remove("open");
    menu.style.removeProperty("visibility");
    menu.style.removeProperty("opacity");
    menu.style.removeProperty("pointer-events");
    menu.style.removeProperty("transform");
  }
  function attach(item) {
    if (!item || item.dataset.toolmenuAttached === "1") return;
    item.dataset.toolmenuAttached = "1";
    var menu = item.querySelector(":scope > .algolassi-toolmenu-menu");
    if (!menu) return;
    item.addEventListener("mouseenter", function () { show(menu); });
    item.addEventListener("mouseleave", function () { hide(menu); });
    item.addEventListener("focusin", function () { show(menu); });
    item.addEventListener("focusout", function (event) { if (!item.contains(event.relatedTarget)) hide(menu); });
  }
  function rebuild() {
    var path = normalize(location.pathname);
    if (path.indexOf(ROOT) !== 0) return;
    var breadcrumbs = document.querySelector(".site-main > .breadcrumbs");
    if (!breadcrumbs) return;
    var category = currentCategory(path);
    var isRoot = path === ROOT;
    if (!isRoot && !category) return;
    breadcrumbs.querySelectorAll(".algolassi-toolmenu-managed").forEach(function (node) { node.remove(); });
    breadcrumbs.appendChild(makeHome());
    breadcrumbs.appendChild(sep());
    var root = makeRoot(path);
    breadcrumbs.appendChild(root);
    attach(root);
    if (isRoot) return;
    breadcrumbs.appendChild(sep());
    var categoryItem = makeCategory(category, path);
    breadcrumbs.appendChild(categoryItem);
    attach(categoryItem);
    if (normalize(category.url) !== path) {
      breadcrumbs.appendChild(sep());
      breadcrumbs.appendChild(makeCurrent(category));
    }
  }
  function refresh() {
    rebuild();
    window.setTimeout(rebuild, 50);
    window.setTimeout(rebuild, 200);
  }
  document.addEventListener("DOMContentLoaded", rebuild, { once: true });
  window.addEventListener("load", rebuild);
  window.addEventListener("algolassi:spa-navigation", refresh);
  window.addEventListener("popstate", refresh);
  if (document.readyState !== "loading") window.requestAnimationFrame(rebuild);
})();
