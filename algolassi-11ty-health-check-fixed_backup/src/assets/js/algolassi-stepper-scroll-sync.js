/* Algolassi steppers: existing flow scroll sync + Developer Tools breadcrumb sync. */
(function () {
  "use strict";
  var ticking = false;

  var developerTools = {
    image: {
      title: "🖼️ Image Tools",
      url: "/developer-tools/image-tools/",
      tools: []
    },
    format: {
      title: "🔄 Format Converters",
      url: "/developer-tools/format-converters/",
      tools: [
        { title: "Base64 Encoder / Decoder", url: "/developer-tools/base64-encoder-decoder/", icon: "64" },
        { title: "URL Encoder / Decoder", url: "/developer-tools/url-encoder-decoder/", icon: "URL" },
        { title: "HTML Encoder / Decoder", url: "/developer-tools/html-encoder-decoder/", icon: "<>" }
      ]
    },
    data: {
      title: "🧪 Data & Validation",
      url: "/developer-tools/data-validation/",
      tools: [
        { title: "JSON Formatter & Validator", url: "/developer-tools/json-formatter/", icon: "{}" },
        { title: "JWT Inspector", url: "/developer-tools/jwt-decoder/", icon: "JWT" },
        { title: "Regular Expression Tester", url: "/developer-tools/regex-tester/", icon: ".*" }
      ]
    },
    utility: {
      title: "🧰 Developer Utilities",
      url: "/developer-tools/developer-utilities/",
      tools: [
        { title: "GUID / UUID Generator", url: "/developer-tools/guid-generator/", icon: "ID" },
        { title: "Unix Timestamp Converter", url: "/developer-tools/unix-timestamp-converter/", icon: "TS" },
        { title: "Code Equals Sign Aligner", url: "/developer-tools/code-equals-aligner/", icon: "=" }
      ]
    }
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

  function normalize(path) {
    var p = path || "/";
    if (p.length > 1 && p.charAt(p.length - 1) !== "/") p += "/";
    return p;
  }

  function toolCategory(path) {
    var keys = Object.keys(developerTools);
    for (var i = 0; i < keys.length; i++) {
      var category = developerTools[keys[i]];
      for (var j = 0; j < category.tools.length; j++) {
        if (category.tools[j].url === path) return { key: keys[i], category: category, tool: category.tools[j] };
      }
      if (category.url === path) return { key: keys[i], category: category, tool: null };
    }
    return null;
  }

  function allCategoryLinks() {
    return Object.keys(developerTools).map(function (key) {
      var category = developerTools[key];
      return { title: category.title, url: category.url };
    });
  }

  function renderDeveloperToolsBreadcrumb() {
    var path = normalize(location.pathname || "/");
    var container = document.querySelector(".site-main > .breadcrumbs");
    if (!container) container = document.querySelector(".breadcrumbs");
    if (!container) return;

    var info = toolCategory(path);
    var isDeveloperLanding = path === "/developer-tools/";
    if (!info && !isDeveloperLanding) return;

    var categories = allCategoryLinks();
    var html = '<div class="breadcrumb-item">' +
      '<a href="/" class="breadcrumb-trigger crumb-trigger" data-menu="home">🏠 Home <span class="breadcrumb-arrow">▼</span></a>' +
      '<div class="breadcrumb-menu" data-menu="home">' +
      '<a href="/developer-tools/">🛠️ Developer Tools</a>';

    categories.forEach(function (item) {
      html += '<a href="' + item.url + '">' + item.title + '</a>';
    });
    html += '</div></div><span class="breadcrumb-separator">/</span>';

    if (isDeveloperLanding) {
      html += '<span class="breadcrumb-current">🛠️ Developer Tools</span>';
      container.innerHTML = html;
      return;
    }

    var category = info.category;
    html += '<div class="breadcrumb-item">' +
      '<a href="' + category.url + '" class="breadcrumb-trigger crumb-trigger" data-menu="developer-category">' +
      category.title + ' <span class="breadcrumb-arrow">▼</span></a>' +
      '<div class="breadcrumb-menu" data-menu="developer-category">';

    category.tools.forEach(function (tool) {
      html += '<a href="' + tool.url + '"' +
        (tool.url === path ? ' class="breadcrumb-dropdown-current"' : '') + '>' +
        tool.title + '</a>';
    });

    html += '</div></div><span class="breadcrumb-separator">/</span>';
    html += '<span class="breadcrumb-current">' + (info.tool ? info.tool.title : category.title) + '</span>';
    container.innerHTML = html;
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
    renderDeveloperToolsBreadcrumb();
    document.querySelectorAll(".maui-flow,.algolassi-auto-stepper").forEach(attach);
    updateAllFlows();
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