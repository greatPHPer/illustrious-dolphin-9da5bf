/* Algolassi 4.0 - keep assistant/news, radio and chat in a stable vertical stack. */
(function () {
  "use strict";
  var GAP = 14;
  var timer = null;

  function visibleRect(el) {
    if (!el) return null;
    var cs = window.getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0" || el.getAttribute("aria-hidden") === "true") return null;
    var r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return null;
    return r;
  }

  function assistantRect() {
    var host = document.getElementById("algolassi-assistant-host");
    if (!host) return null;
    var toast = host.querySelector(".algolassi-assistant-toast");
    return visibleRect(toast || host);
  }

  function chatVisible() {
    var host = document.getElementById("algolassi-chat-presence-host");
    if (!host) return null;
    var card = host.querySelector(".algolassi-chat-presence-card");
    if (!card || !visibleRect(card)) return null;
    if (host.classList.contains("algolassi-chat-is-hidden")) return null;
    return host;
  }

  function update() {
    var chat = chatVisible();
    if (!chat) return;

    var radio = visibleRect(document.getElementById("algolassi-radio-host"));
    var radioReopen = visibleRect(document.getElementById("algolassi-radio-reopen"));
    var news = assistantRect();
    var lower = radio || radioReopen || news || null;
    var base = window.innerWidth <= 600 ? 10 : 18;

    if (lower) {
      var targetBottom = window.innerHeight - lower.top + GAP;
      chat.style.bottom = Math.max(base, targetBottom) + "px";
    } else {
      chat.style.bottom = base + "px";
    }
  }

  function settle() {
    update();
    [40, 100, 180, 300, 500].forEach(function (delay) {
      setTimeout(update, delay);
    });
  }

  function start() {
    settle();
    window.addEventListener("resize", settle, { passive: true });
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("algolassi:radio-layout-change", settle);
    window.addEventListener("algolassi:spa-navigation", settle);

    /* Observe only the three floating hosts, not the entire document. */
    if (window.MutationObserver) {
      var observer = new MutationObserver(function () { settle(); });
      [
        document.getElementById("algolassi-chat-presence-host"),
        document.getElementById("algolassi-radio-host"),
        document.getElementById("algolassi-radio-reopen"),
        document.getElementById("algolassi-assistant-host")
      ].forEach(function (host) {
        if (host) observer.observe(host, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["style", "class", "aria-hidden"]
        });
      });
    }

    if (window.ResizeObserver) {
      var resizeObserver = new ResizeObserver(function () { settle(); });
      var chat = document.getElementById("algolassi-chat-presence-host");
      var radio = document.getElementById("algolassi-radio-host");
      var radioReopen = document.getElementById("algolassi-radio-reopen");
      var assistant = document.getElementById("algolassi-assistant-host");
      if (chat) resizeObserver.observe(chat);
      if (radio) resizeObserver.observe(radio);
      if (radioReopen) resizeObserver.observe(radioReopen);
      if (assistant) resizeObserver.observe(assistant);
    }

    timer = setInterval(update, 250);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
