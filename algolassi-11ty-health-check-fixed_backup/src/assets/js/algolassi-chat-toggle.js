/* Algolassi Chat - independent hide/reopen control */
(function () {
  "use strict";
  var STORAGE_KEY = "algolassi-chat-hidden";
  var BUTTON_ID = "algolassi-chat-reopen-button";

  function hidden() {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch (e) { return false; }
  }
  function setHidden(value) {
    try { localStorage.setItem(STORAGE_KEY, value ? "1" : "0"); } catch (e) {}
  }
  function host() { return document.getElementById("algolassi-chat-presence-host"); }
  function card() { var h = host(); return h && h.querySelector(".algolassi-chat-presence-card"); }

  function addStyles() {
    if (document.getElementById("algolassi-chat-toggle-styles")) return;
    var s = document.createElement("style");
    s.id = "algolassi-chat-toggle-styles";
    s.textContent =
      "#algolassi-chat-presence-host.algolassi-chat-toggle-hidden{display:none!important;}" +
      "#" + BUTTON_ID + "{display:none;position:fixed;right:18px;bottom:18px;width:42px;height:42px;border:0;border-radius:50%;background:#fff;box-shadow:0 3px 12px rgba(0,0,0,.28);font-size:21px;line-height:42px;text-align:center;cursor:pointer;z-index:2147483646;padding:0;}" +
      "#" + BUTTON_ID + ".is-visible{display:block;}" +
      "#" + BUTTON_ID + ":hover{transform:scale(1.06);}" +
      "#algolassi-chat-presence-host .algolassi-chat-toggle-hide{margin-left:auto;border:0;background:transparent;color:inherit;font-size:18px;line-height:1;cursor:pointer;padding:4px 7px;}" +
      "@media(max-width:600px){#" + BUTTON_ID + "{right:10px;width:40px;height:40px;line-height:40px;font-size:20px;}}";
    document.head.appendChild(s);
  }

  function positionButton() {
    var b = document.getElementById(BUTTON_ID);
    if (!b) return;
    var bottom = window.innerWidth <= 600 ? 10 : 18;
    var radio = document.getElementById("algolassi-radio-host");
    if (radio) {
      var r = radio.getBoundingClientRect();
      if (r.height > 0 && r.top < window.innerHeight) {
        bottom = Math.max(bottom, window.innerHeight - r.top + 10);
      }
    }
    b.style.bottom = bottom + "px";
  }

  function apply() {
    addStyles();
    var h = host();
    if (!h) return;
    var c = card();
    if (c && !c.querySelector(".algolassi-chat-toggle-hide")) {
      var hide = document.createElement("button");
      hide.type = "button";
      hide.className = "algolassi-chat-toggle-hide";
      hide.setAttribute("aria-label", "Hide chat");
      hide.title = "Hide chat";
      hide.textContent = "×";
      var head = c.querySelector(".algolassi-chat-presence-head");
      if (head) head.appendChild(hide);
      hide.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        setHidden(true);
        apply();
      });
    }
    var b = document.getElementById(BUTTON_ID);
    if (!b) {
      b = document.createElement("button");
      b.id = BUTTON_ID;
      b.type = "button";
      b.textContent = "💬";
      b.setAttribute("aria-label", "Open Algolassi Chat");
      b.title = "Open Algolassi Chat";
      b.addEventListener("click", function () {
        setHidden(false);
        apply();
      });
      document.body.appendChild(b);
    }
    h.classList.toggle("algolassi-chat-toggle-hidden", hidden());
    b.classList.toggle("is-visible", hidden());
    positionButton();
  }

  function init() {
    addStyles();
    apply();
    window.addEventListener("resize", positionButton, { passive: true });
    window.addEventListener("scroll", positionButton, { passive: true });
    var observer = new MutationObserver(function () { apply(); });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("algolassi:spa-navigation", function () { setTimeout(apply, 50); setTimeout(apply, 500); });
    setTimeout(apply, 100);
    setTimeout(apply, 1000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();
