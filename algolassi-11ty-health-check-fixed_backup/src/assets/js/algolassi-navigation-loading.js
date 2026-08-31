/* Algolassi site-wide navigation loading indicator. */
(function () {
  "use strict";

  var shown = false;
  var timer = null;

  function ensure() {
    var bar = document.getElementById("algolassi-navigation-loading");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "algolassi-navigation-loading";
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-label", "Loading page");
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    return bar;
  }

  function show() {
    var bar = ensure();
    if (timer) { clearTimeout(timer); timer = null; }
    shown = true;
    bar.setAttribute("aria-hidden", "false");
    bar.classList.remove("is-complete", "is-hidden");
    void bar.offsetWidth;
    bar.classList.add("is-loading");
  }

  function hide() {
    var bar = document.getElementById("algolassi-navigation-loading");
    if (!bar) return;
    shown = false;
    bar.classList.remove("is-loading");
    bar.classList.add("is-complete");
    bar.setAttribute("aria-hidden", "true");
    timer = setTimeout(function () {
      bar.classList.remove("is-complete");
      bar.classList.add("is-hidden");
    }, 180);
  }

  function shouldShowForLink(link, event) {
    if (!link || !event || event.defaultPrevented || event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (link.target && link.target !== "_self") return false;
    if (link.hasAttribute("download") || link.hasAttribute("data-no-spa")) return false;
    if (link.protocol !== window.location.protocol || link.host !== window.location.host) return false;
    if (link.hash && link.pathname === window.location.pathname && link.search === window.location.search) return false;
    if (link.closest && link.closest("#algolassi-radio-host,#algolassi-assistant-host,[data-no-spa='true']")) return false;
    return true;
  }

  function init() {
    ensure();

    document.addEventListener("click", function (event) {
      var target = event.target;
      var link = target && target.closest ? target.closest("a") : null;
      if (!shouldShowForLink(link, event)) return;
      show();
    }, true);

    window.addEventListener("pageshow", function () {
      hide();
    });

    window.addEventListener("load", function () {
      hide();
    });

    window.addEventListener("algolassi:navigation-start", show);
    window.addEventListener("algolassi:navigation-end", hide);
    window.addEventListener("algolassi:spa-navigation", hide);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
