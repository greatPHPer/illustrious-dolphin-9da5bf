/* Algolassi search result jump/highlight helper. */
(function () {
  "use strict";

  var PARAM = "algolassiSearch";
  var MARK_CLASS = "algolassi-search-highlight";

  function escapeRegExp(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function queryText() {
    try {
      return new URLSearchParams(window.location.search).get(PARAM) || "";
    } catch (e) {
      return "";
    }
  }

  function searchTerms(query) {
    return String(query || "")
      .replace(/\s+/g, " ")
      .trim()
      .split(/\s+/)
      .map(function (term) { return term.trim(); })
      .filter(function (term) { return term.length > 1; })
      .slice(0, 8);
  }

  function clearHighlights() {
    document.querySelectorAll("." + MARK_CLASS).forEach(function (mark) {
      var parent = mark.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
      parent.normalize();
    });
  }

  function styleOnce() {
    if (document.getElementById("algolassi-search-jump-styles")) return;
    var style = document.createElement("style");
    style.id = "algolassi-search-jump-styles";
    style.textContent =
      "." + MARK_CLASS + "{" +
      "background:#fde68a!important;" +
      "color:inherit!important;" +
      "border-radius:3px;" +
      "padding:0 .08em;" +
      "box-shadow:0 0 0 2px rgba(245,158,11,.14);" +
      "scroll-margin-top:110px;" +
      "}";
    document.head.appendChild(style);
  }

  function getRoots() {
    var roots = [];
    document.querySelectorAll("main.site-main").forEach(function (main) {
      main.querySelectorAll(
        ".article-content, .page-content, .portfolio, .portfolio-content, [class*='portfolio'], [class*='project-content']"
      ).forEach(function (root) {
        if (!root.closest(".breadcrumbs, .algolassi-search-panel, .algolassi-search-cloud, #algolassi-comment-list, #algolassi-comment-form")) {
          roots.push(root);
        }
      });

      if (!roots.length) roots.push(main);
    });
    return roots;
  }

  function shouldSkipElement(parent) {
    if (!parent) return true;
    return !!parent.closest(
      "script,style,noscript,textarea,input,select,option," +
      ".algolassi-icon-inline,pre,code," +
      ".breadcrumbs,.algolassi-search-panel,.algolassi-search-cloud," +
      "#algolassi-comment-list,#algolassi-comment-form,.comments,.comment-list,.comment-form," +
      ".site-header,.site-footer,nav"
    );
  }

  function highlightTerms(query) {
    var terms = searchTerms(query);
    if (!terms.length) return null;

    styleOnce();
    clearHighlights();

    var pattern = new RegExp("(" + terms.map(escapeRegExp).join("|") + ")", "ig");
    var firstMark = null;

    getRoots().forEach(function (root) {
      var walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function (node) {
            if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
            var parent = node.parentElement;
            if (shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT;
            pattern.lastIndex = 0;
            return pattern.test(node.nodeValue)
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT;
          }
        }
      );

      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      nodes.forEach(function (node) {
        pattern.lastIndex = 0;
        var text = node.nodeValue;
        var fragment = document.createDocumentFragment();
        var lastIndex = 0;
        var match;

        while ((match = pattern.exec(text)) !== null) {
          if (match.index > lastIndex) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
          }

          var mark = document.createElement("mark");
          mark.className = MARK_CLASS;
          mark.textContent = match[0];
          fragment.appendChild(mark);
          if (!firstMark) firstMark = mark;
          lastIndex = match.index + match[0].length;
        }

        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        if (fragment.childNodes.length) node.parentNode.replaceChild(fragment, node);
      });
    });

    return firstMark;
  }

  function scrollToMatch(mark) {
    if (!mark) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        try {
          mark.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        } catch (e) {
          mark.scrollIntoView();
        }
      });
    });
  }

  function cleanUrl() {
    try {
      var url = new URL(window.location.href);
      if (!url.searchParams.has(PARAM)) return;
      url.searchParams.delete(PARAM);
      window.history.replaceState(window.history.state, "", url.href);
    } catch (e) {}
  }

  function applyFromUrl() {
    var query = queryText();
    if (!query) return;

    var mark = highlightTerms(query);
    if (mark) scrollToMatch(mark);
    cleanUrl();
  }

  document.addEventListener("click", function (event) {
    var link = event.target && event.target.closest
      ? event.target.closest(".algolassi-search-result[data-search-key]")
      : null;
    if (!link || !link.href) return;

    try {
      var url = new URL(link.href, window.location.href);
      var searchBox = document.querySelector(".algolassi-home-search-input");
      var query = searchBox ? searchBox.value.trim() : "";
      if (!query) return;
      url.searchParams.set(PARAM, query);
      link.href = url.href;
    } catch (e) {}
  }, true);

  window.addEventListener("algolassi:spa-navigation", function () {
    requestAnimationFrame(applyFromUrl);
  });

  window.addEventListener("load", function () {
    applyFromUrl();
  }, { once: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyFromUrl, { once: true });
  } else {
    requestAnimationFrame(applyFromUrl);
  }
})();