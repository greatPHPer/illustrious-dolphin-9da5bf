/* Algolassi steppers: existing flow scroll sync + Developer Tools breadcrumb sync. */
(function () {
  "use strict";
  var ticking = false;
  var developerToolTitles = {
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

  function update(flow) {
    if (!flow || !document.documentElement.contains(flow)) return;
    var buttons = Array.prototype.slice.call(flow.querySelectorAll("button[data-target]"));
    if (!buttons.length) return;
    var items = buttons.map(function (button) {
      return { button: button, target: document.getElementById(button.getAttribute("data-target")) };
    }).filter(function (item) { return !!item.target; });
    if (!items.length) return;
    var mobile = window.innerWidth <= 1250;
    var marker = mobile ? Math.max(140, flow.getBoundingClientRect().bottom + 18) : Math.min(260, Math.max(150, window.innerHeight * 0.30));
    var current = items[0];
    items.forEach(function (item) { if (item.target.getBoundingClientRect().top <= marker) current = item; });
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8) current = items[items.length - 1];
    buttons.forEach(function (button) {
      var isCurrent = button === current.button;
      button.classList.toggle("active", isCurrent);
      button.setAttribute("aria-current", isCurrent ? "step" : "false");
    });
  }

  function updateAllFlows() {
    document.querySelectorAll(".maui-flow,.algolassi-auto-stepper").forEach(update);
  }

  function syncDeveloperToolsBreadcrumb() {
    var path = location.pathname || "/";
    if (path.charAt(path.length - 1) !== "/") path += "/";
    var title = developerToolTitles[path];
    if (!title) return;
    var current = document.querySelector(".breadcrumbs > .breadcrumb-current");
    if (!current) current = document.querySelector(".site-main .breadcrumbs .breadcrumb-current");
    if (!current) return;
    var menu = null;
    Array.prototype.slice.call(current.children || []).forEach(function (child) {
      if (child.classList && child.classList.contains("breadcrumb-child-menu")) menu = child;
    });
    Array.prototype.slice.call(current.childNodes).forEach(function (node) {
      if (node.nodeType === 3) node.parentNode.removeChild(node);
    });
    var text = document.createTextNode(" " + title + " ");
    if (menu) current.insertBefore(text, menu); else current.appendChild(text);
  }

  function attach(flow) {
    if (!flow || flow.dataset.scrollSyncAttached === "1") return;
    flow.dataset.scrollSyncAttached = "1";
    flow.addEventListener("click", function (event) {
      var button = event.target && event.target.closest ? event.target.closest("button[data-target]") : null;
      if (!button || !flow.contains(button)) return;
      var target = document.getElementById(button.getAttribute("data-target"));
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      var offset = window.innerWidth <= 1250 ? flow.getBoundingClientRect().height + 18 : 110;
      var top = window.scrollY + target.getBoundingClientRect().top - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        updateAllFlows();
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update(flow);
  }

  function init() {
    document.querySelectorAll(".maui-flow,.algolassi-auto-stepper").forEach(attach);
    syncDeveloperToolsBreadcrumb();
  }

  document.addEventListener("DOMContentLoaded", init);
  if (document.readyState !== "loading") init();

  window.addEventListener("algolassi:spa-navigation", function () {
    window.requestAnimationFrame(function () {
      init();
      window.setTimeout(function () {
        init();
        updateAllFlows();
      }, 50);
    });
  });

  window.addEventListener("popstate", function () {
    window.requestAnimationFrame(function () {
      init();
      window.setTimeout(function () {
        init();
        updateAllFlows();
      }, 50);
    });
  });
})();