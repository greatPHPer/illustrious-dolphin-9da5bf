(function () {
  "use strict";

  var MAIN_SELECTOR = ".site-main";
  var navigating = false;
  var initialized = false;

  function updateReadingProgress() {
    var bar = document.getElementById("algolassi-reading-progress");
    if (!bar) return;

    var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    var doc = document.documentElement;
    var scrollHeight = Math.max(doc.scrollHeight, document.body.scrollHeight);
    var viewport = window.innerHeight || doc.clientHeight;
    var total = Math.max(1, scrollHeight - viewport);
    var progress = Math.min(100, Math.max(0, (scrollTop / total) * 100));
    bar.style.width = progress + "%";
  }

  function shouldHandle(link, event) {
    if (!link || !link.href || !event || event.defaultPrevented || event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (link.target && link.target !== "_self") return false;
    if (link.hasAttribute("download") || link.hasAttribute("data-no-spa")) return false;

    if (link.closest && link.closest("#algolassi-radio-host,#algolassi-assistant-host,[data-no-spa='true']")) return false;
    if (link.closest && link.closest("#algolassi-chat-presence-host") && !link.hasAttribute("data-algolassi-spa-link")) return false;

    if (link.protocol !== window.location.protocol || link.host !== window.location.host) return false;

    try {
      if (new URL(link.href, window.location.href).pathname === "/maui-hybrid-playground/") return false;
    } catch (error) {
      return false;
    }

    if (link.hash && link.pathname === window.location.pathname && link.search === window.location.search) return false;
    return true;
  }

  function updateMeta(doc) {
    if (doc.title) document.title = doc.title;

    var currentDescription = document.querySelector('meta[name="description"]');
    var nextDescription = doc.querySelector('meta[name="description"]');

    if (currentDescription && nextDescription) {
      currentDescription.setAttribute("content", nextDescription.getAttribute("content") || "");
    } else if (currentDescription && !nextDescription) {
      currentDescription.remove();
    } else if (!currentDescription && nextDescription) {
      document.head.appendChild(nextDescription.cloneNode(true));
    }

    var currentCanonical = document.querySelector('link[rel="canonical"]');
    var nextCanonical = doc.querySelector('link[rel="canonical"]');

    if (currentCanonical && nextCanonical) {
      currentCanonical.setAttribute("href", nextCanonical.getAttribute("href") || "");
    } else if (currentCanonical && !nextCanonical) {
      currentCanonical.remove();
    } else if (!currentCanonical && nextCanonical) {
      document.head.appendChild(nextCanonical.cloneNode(true));
    }
  }

  function activateImageToolScripts(main) {
    if (!main || !main.querySelector(".image-workspace")) return;

    Array.prototype.slice.call(main.querySelectorAll("script[src]")).forEach(function (source) {
      var src = source.getAttribute("src") || "";
      if (src.indexOf("/assets/js/algolassi-image-tools.js") === -1 &&
          src.indexOf("/assets/js/algolassi-image-tools-stability.js") === -1) {
        return;
      }

      var script = document.createElement("script");
      script.src = src;
      script.async = false;
      document.body.appendChild(script);
    });
  }

  function initPage() {
    var initializers = [
      "AlgolassiCommentsInit",
      "AlgolassiNewsletterInit",
      "AlgolassiRadioInit",
      "AlgolassiGetLinkInit",
      "AlgolassiChatPresenceInit",
      "AlgolassiUsernameInit",
      "AlgolassiSearchInit",
      "AlgolassiChatReputationInit",
      "AlgolassiThemeInit",
      "AlgolassiSqlPlaygroundInit"
    ];

    initializers.forEach(function (name) {
      if (typeof window[name] === "function") {
        try {
          window[name]();
        } catch (error) {
          console.error("Algolassi SPA initializer failed:", name, error);
        }
      }
    });
  }

  function loadPage(url, push) {
    if (navigating) return;
    navigating = true;

    fetch(url.href, { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var currentMain = document.querySelector(MAIN_SELECTOR);
        var nextMain = doc.querySelector(MAIN_SELECTOR);

        if (!currentMain || !nextMain) throw new Error("site-main not found");

        currentMain.innerHTML = nextMain.innerHTML;
        activateImageToolScripts(currentMain);
        updateMeta(doc);

        if (push) {
          window.history.pushState({ algolassiSpa: true }, "", url.href);
        }

        window.scrollTo(0, 0);
        initPage();
        window.dispatchEvent(new CustomEvent("algolassi:spa-navigation", {
          detail: { url: url.href }
        }));
        updateReadingProgress();
      })
      .catch(function (error) {
        console.error("Algolassi SPA navigation failed:", error);
        window.location.href = url.href;
      })
      .finally(function () {
        navigating = false;
      });
  }

  function start() {
    if (initialized) return;
    initialized = true;

    window.addEventListener("scroll", updateReadingProgress, { passive: true });
    window.addEventListener("resize", updateReadingProgress);
    window.addEventListener("load", updateReadingProgress);
    window.addEventListener("algolassi:spa-navigation", function () {
      window.scrollTo(0, 0);
      requestAnimationFrame(updateReadingProgress);
    });

    document.addEventListener("click", function (event) {
      var target = event.target;
      if (target && target.closest && target.closest("#algolassi-radio-host,#algolassi-assistant-host,[data-no-spa='true']")) return;

      var link = target && target.closest ? target.closest("a") : null;
      if (!shouldHandle(link, event)) return;

      event.preventDefault();
      loadPage(new URL(link.href), true);
    }, false);

    window.addEventListener("popstate", function () {
      loadPage(new URL(window.location.href), false);
    });

    initPage();
    updateReadingProgress();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
