/* Keep news/assistant, radio and chat vertically separated. */
(function () {
  "use strict";
  var GAP = 12;
  var timer = null;

  function visibleRect(el) {
    if (!el) return null;
    var cs = window.getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return null;
    var r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return null;
    return r;
  }

  function getAssistantRect() {
    var host = document.getElementById("algolassi-assistant-host");
    if (!host) return null;
    var toast = host.querySelector(".algolassi-assistant-toast");
    return visibleRect(toast || host);
  }

  function update() {
    var chat = document.getElementById("algolassi-chat-presence-host");
    if (!chat) return;

    var chatCard = chat.querySelector(".algolassi-chat-presence-card");
    if (!chatCard || !visibleRect(chatCard)) return;

    var radio = visibleRect(document.getElementById("algolassi-radio-host"));
    var assistant = getAssistantRect();
    var lower = null;

    /* Whichever visible floating item is lower on screen becomes the
       immediate item underneath chat. This handles radio disappearing,
       news disappearing, or either/both being hidden. */
    [radio, assistant].forEach(function (r) {
      if (r && (!lower || r.top > lower.top)) lower = r;
    });

    var base = window.innerWidth <= 600 ? 10 : 18;
    if (lower) {
      chat.style.bottom = Math.max(base, window.innerHeight - lower.top + GAP) + "px";
    } else {
      chat.style.bottom = base + "px";
    }
  }

  function start() {
    update();
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("algolassi:spa-navigation", function () {
      setTimeout(update, 0);
      setTimeout(update, 100);
      setTimeout(update, 400);
    });
    if (window.MutationObserver) {
      var observer = new MutationObserver(function () { update(); });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class", "aria-hidden"] });
    }
    timer = setInterval(update, 250);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
