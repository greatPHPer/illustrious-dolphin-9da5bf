/* Algolassi floating stack - news, radio and chat share one dynamic stack. */
(function () {
  "use strict";
  var GAP = 14;
  var BASE_DESKTOP = 18;
  var BASE_MOBILE = 10;
  var NEWS_BUTTON_ID = "algolassi-news-reopen";
  var timer = null;
  var newsObserver = null;
  var applyingNews = false;

  function baseBottom() {
    return window.innerWidth <= 600 ? BASE_MOBILE : BASE_DESKTOP;
  }

  function visibleRect(el) {
    if (!el) return null;
    var cs = window.getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0" || el.getAttribute("aria-hidden") === "true") return null;
    var r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return null;
    return r;
  }

  function assistantHost() { return document.getElementById("algolassi-assistant-host"); }
  function newsToast() {
    var host = assistantHost();
    if (!host) return null;
    var toast = host.querySelector(".algolassi-assistant-news");
    return visibleRect(toast);
  }

  function radioLauncher() {
    return visibleRect(document.getElementById("algolassi-radio-reopen"));
  }

  function chatLauncher() {
    var b = document.getElementById("algolassi-chat-reopen-button");
    return visibleRect(b && b.classList.contains("is-visible") ? b : null);
  }

  function chatCard() {
    var host = document.getElementById("algolassi-chat-presence-host");
    if (!host || host.classList.contains("algolassi-chat-toggle-hidden") || host.classList.contains("algolassi-chat-is-hidden")) return null;
    return visibleRect(host.querySelector(".algolassi-chat-presence-card"));
  }

  function ensureNewsButton(toast) {
    if (!toast || applyingNews) return;
    var head = toast.querySelector(".algolassi-assistant-head");
    if (!head || head.querySelector(".algolassi-news-hide")) return;
    applyingNews = true;
    try {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "algolassi-assistant-action algolassi-news-hide";
      button.setAttribute("aria-label", "Hide news");
      button.title = "Hide news";
      button.textContent = "✕ Hide";
      button.style.cssText = "margin-left:auto;border:0;border-radius:7px;background:transparent;color:inherit;font-size:12px;line-height:1;cursor:pointer;padding:5px 8px";
      button.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        hideNewsToast(toast);
      }, false);
      head.appendChild(button);
    } finally {
      applyingNews = false;
    }
  }

  function hideNewsToast(toast) {
    var host = assistantHost();
    if (!toast || !host || !host.contains(toast)) return;
    toast.classList.add("algolassi-assistant-toast-hide");
    window.setTimeout(function () {
      if (host.contains(toast)) host.removeChild(toast);
      showNewsLauncher();
      updateAll();
    }, 200);
    try { window.dispatchEvent(new Event("algolassi:news-layout-change")); } catch (e) {}
  }

  function removeNewsLauncher() {
    var b = document.getElementById(NEWS_BUTTON_ID);
    if (b) b.remove();
  }

  function showNewsLauncher() {
    if (document.getElementById(NEWS_BUTTON_ID)) return;
    var b = document.createElement("button");
    b.id = NEWS_BUTTON_ID;
    b.type = "button";
    b.textContent = "📰";
    b.setAttribute("aria-label", "Show news");
    b.title = "Show news";
    b.style.cssText = "position:fixed;right:14px;bottom:14px;z-index:2147483646;width:46px;height:46px;border:0;border-radius:50%;font-size:22px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);background:#fff;";
    b.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      removeNewsLauncher();
      updateAll();
      try { window.dispatchEvent(new Event("algolassi:news-reopen")); } catch (err) {}
    }, false);
    document.body.appendChild(b);
    updateAll();
  }

  function syncNewsLauncher() {
    var toast = newsToast();
    var launcher = document.getElementById(NEWS_BUTTON_ID);
    if (toast) {
      ensureNewsButton(document.querySelector("#algolassi-assistant-host .algolassi-assistant-news"));
      if (launcher) launcher.remove();
    }
  }

  function floatingItems() {
    var items = [];
    var news = newsToast();
    if (news) items.push({ el: document.getElementById("algolassi-assistant-host"), rect: news, kind: "news" });
    var radio = radioLauncher();
    if (radio) items.push({ el: document.getElementById("algolassi-radio-reopen"), rect: radio, kind: "radio" });
    var chat = chatLauncher();
    if (chat) items.push({ el: document.getElementById("algolassi-chat-reopen-button"), rect: chat, kind: "chat" });
    return items;
  }

  function setBottom(el, bottom) {
    if (el) el.style.bottom = Math.max(baseBottom(), bottom) + "px";
  }

  function updateAll() {
    syncNewsLauncher();

    var news = newsToast();
    var radio = radioLauncher();
    var chat = chatLauncher();
    var bottom = baseBottom();

    /* Priority/order from bottom upward: news -> radio -> chat. */
    if (news) {
      bottom = window.innerHeight - news.top + GAP;
    } else if (radio) {
      bottom = window.innerHeight - radio.top + GAP;
    }

    if (radio) {
      if (news) setBottom(document.getElementById("algolassi-radio-reopen"), window.innerHeight - news.top + GAP);
      else setBottom(document.getElementById("algolassi-radio-reopen"), baseBottom());
    }

    if (chat) {
      var lower = radioLauncher() || news;
      if (lower) setBottom(document.getElementById("algolassi-chat-reopen-button"), window.innerHeight - lower.top + GAP);
      else setBottom(document.getElementById("algolassi-chat-reopen-button"), baseBottom());
    }

    /* If the full chat card is open, keep it above the currently visible lower item. */
    var card = chatCard();
    if (card) {
      var lowerCard = radioLauncher() || news;
      var chatHost = document.getElementById("algolassi-chat-presence-host");
      if (chatHost) chatHost.style.bottom = lowerCard ? Math.max(baseBottom(), window.innerHeight - lowerCard.top + GAP) + "px" : baseBottom() + "px";
    }
  }

  function settle() {
    updateAll();
    [40, 100, 180, 300, 500].forEach(function (delay) { setTimeout(updateAll, delay); });
  }

  function start() {
    settle();
    window.addEventListener("resize", settle, { passive: true });
    window.addEventListener("scroll", updateAll, { passive: true });
    window.addEventListener("algolassi:radio-layout-change", settle);
    window.addEventListener("algolassi:spa-navigation", settle);
    window.addEventListener("algolassi:news-layout-change", settle);
    window.addEventListener("algolassi:news-reopen", settle);

    if (window.MutationObserver) {
      newsObserver = new MutationObserver(function () { settle(); });
      [
        document.getElementById("algolassi-chat-presence-host"),
        document.getElementById("algolassi-radio-host"),
        document.getElementById("algolassi-radio-reopen"),
        document.getElementById("algolassi-assistant-host")
      ].forEach(function (host) {
        if (host) newsObserver.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class", "aria-hidden"] });
      });
    }

    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { settle(); });
      [
        document.getElementById("algolassi-chat-presence-host"),
        document.getElementById("algolassi-radio-host"),
        document.getElementById("algolassi-radio-reopen"),
        document.getElementById("algolassi-assistant-host")
      ].forEach(function (host) { if (host) ro.observe(host); });
    }

    timer = setInterval(updateAll, 250);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
