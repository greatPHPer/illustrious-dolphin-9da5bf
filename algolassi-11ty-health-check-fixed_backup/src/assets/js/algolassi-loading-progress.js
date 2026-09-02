/* Algolassi centered loading progress controller. */
(function () {
  "use strict";

  var KEY = "__algolassiCenteredLoading_v1";
  if (window[KEY]) return;

  var loading = false;
  var hideTimer = null;
  var shownAt = 0;
  var MIN_VISIBLE_MS = 800;

  function ensure() {
    var host = document.getElementById("algolassi-centered-loading");
    if (host) return host;
    host = document.createElement("div");
    host.id = "algolassi-centered-loading";
    host.setAttribute("aria-hidden", "true");
    host.innerHTML = '<div class="algolassi-loader-core" role="status" aria-label="Loading"><span class="algolassi-loader-ring" aria-hidden="true"></span><span class="algolassi-loader-square" aria-hidden="true"></span><span class="algolassi-loader-leak algolassi-loader-leak-a" aria-hidden="true"></span><span class="algolassi-loader-leak algolassi-loader-leak-b" aria-hidden="true"></span><img class="algolassi-loader-logo" src="/wp-content/uploads/2025/09/cropped-algolassi_logo_icon-32x32.png" alt="Algolassi"></div>';
    document.body.appendChild(host);
    return host;
  }

  function show() {
    var host = ensure();
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    loading = true;
    shownAt = Date.now();
    host.setAttribute("aria-hidden", "false");
    host.classList.remove("is-hidden");
    host.classList.add("is-loading");
  }

  function finishHide(host) {
    if (!host) return;
    loading = false;
    host.classList.remove("is-loading");
    host.setAttribute("aria-hidden", "true");
    hideTimer = setTimeout(function () {
      host.classList.add("is-hidden");
      hideTimer = null;
    }, 220);
  }

  function hide() {
    var host = document.getElementById("algolassi-centered-loading");
    if (!host) return;

    var elapsed = shownAt ? Date.now() - shownAt : MIN_VISIBLE_MS;
    var remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }

    if (loading && remaining > 0) {
      hideTimer = setTimeout(function () {
        finishHide(host);
      }, remaining);
      return;
    }

    finishHide(host);
  }

  function shouldShow(link, event) {
    if (!link || !event || event.defaultPrevented || event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (link.target && link.target !== "_self") return false;
    if (link.hasAttribute("download") || link.hasAttribute("data-no-spa")) return false;
    if (link.protocol !== window.location.protocol || link.host !== window.location.host) return false;
    if (link.hash && link.pathname === window.location.pathname && link.search === window.location.search) return false;
    if (link.closest && link.closest("#algolassi-radio-host,#algolassi-assistant-host,[data-no-spa='true']")) return false;
    return true;
  }

  function bind() {
    ensure();
    document.addEventListener("click", function (event) {
      var target = event.target;
      var link = target && target.closest ? target.closest("a") : null;
      if (shouldShow(link, event)) show();
    }, true);
    window.addEventListener("algolassi:navigation-start", show);
    window.addEventListener("algolassi:navigation-end", hide);
    window.addEventListener("algolassi:spa-navigation", hide);
    window.addEventListener("pageshow", hide);
    window.addEventListener("load", hide);
  }

  window[KEY] = { show: show, hide: hide };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once: true });
  else bind();
})();
