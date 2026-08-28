/* Keep the current Developer Tools breadcrumb label synchronized with SPA tool navigation. */
(function () {
  "use strict";

  var TITLES = {
    "/developer-tools/": "Developer Tools",
    "/developer-tools/json-formatter/": "JSON Formatter & Validator",
    "/developer-tools/base64-encoder-decoder/": "Base64 Encoder & Decoder",
    "/developer-tools/guid-generator/": "GUID / UUID Generator",
    "/developer-tools/jwt-decoder/": "JWT Decoder / Inspector",
    "/developer-tools/regex-tester/": "Regular Expression Tester",
    "/developer-tools/unix-timestamp-converter/": "Unix Timestamp Converter",
    "/developer-tools/url-encoder-decoder/": "URL Encoder & Decoder",
    "/developer-tools/html-encoder-decoder/": "HTML Encoder & Decoder",
    "/developer-tools/code-equals-aligner/": "Code Equals Sign Aligner"
  };

  function normalize(path) {
    var p = (path || "/").replace(/\\/+$/, "/");
    return p || "/";
  }

  function updateBreadcrumb() {
    var path = normalize(location.pathname);
    var title = TITLES[path];
    if (!title) return;

    var current = document.querySelector(".site-main > .breadcrumbs .breadcrumb-current");
    if (!current) return;

    Array.prototype.slice.call(current.childNodes).forEach(function (node) {
      if (node.nodeType === 3) node.remove();
    });

    var menu = current.querySelector(":scope > .breadcrumb-child-menu");
    var text = document.createTextNode(" " + title + " ");
    if (menu) current.insertBefore(text, menu);
    else current.appendChild(text);
  }

  document.addEventListener("DOMContentLoaded", updateBreadcrumb);
  window.addEventListener("algolassi:spa-navigation", function () {
    requestAnimationFrame(updateBreadcrumb);
  });
  window.addEventListener("popstate", function () {
    requestAnimationFrame(updateBreadcrumb);
  });
})();
