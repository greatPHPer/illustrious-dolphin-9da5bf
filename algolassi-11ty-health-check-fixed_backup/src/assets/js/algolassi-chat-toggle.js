/* Algolassi Chat - independent hide/reopen control */
(function () {
  "use strict";
  var STORAGE_KEY = "algolassi-chat-hidden-v2";
  var BUTTON_ID = "algolassi-chat-reopen-button";

  function hidden() { try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch (e) { return false; } }
  function setHidden(value) { try { localStorage.setItem(STORAGE_KEY, value ? "1" : "0"); } catch (e) {} }
  function host() { return document.getElementById("algolassi-chat-presence-host"); }

  function addStyles() {
    if (document.getElementById("algolassi-chat-toggle-styles")) return;
    var s = document.createElement("style");
    s.id = "algolassi-chat-toggle-styles";
    s.textContent =
      "#algolassi-chat-presence-host.algolassi-chat-toggle-hidden{display:none!important;}" +
      "#" + BUTTON_ID + "{display:none!important;visibility:hidden!important;opacity:0!important;position:fixed!important;right:18px!important;bottom:18px!important;width:42px!important;height:42px!important;border:0!important;border-radius:50%!important;background:#fff!important;box-shadow:0 3px 12px rgba(0,0,0,.28)!important;font-size:21px!important;line-height:42px!important;text-align:center!important;cursor:pointer!important;z-index:2147483647!important;padding:0!important;}" +
      "#" + BUTTON_ID + ".is-visible{display:block!important;visibility:visible!important;opacity:1!important;}" +
      "#" + BUTTON_ID + ":hover{transform:scale(1.06);}" +
      "@media(max-width:600px){#" + BUTTON_ID + "{right:10px!important;width:40px!important;height:40px!important;line-height:40px!important;font-size:20px!important;}}";
    document.head.appendChild(s);
  }

  function ensureButton() {
    var b = document.getElementById(BUTTON_ID);
    if (b) return b;
    b = document.createElement("button");
    b.id = BUTTON_ID;
    b.type = "button";
    b.textContent = "💬";
    b.setAttribute("aria-label", "Open Algolassi Chat");
    b.title = "Open Algolassi Chat";
    b.addEventListener("click", function (e) {
      e.preventDefault(); e.stopPropagation();
      setHidden(false);
      var h = host();
      if (h) h.classList.remove("algolassi-chat-toggle-hidden", "algolassi-chat-is-hidden");
      apply();
    });
    document.body.appendChild(b);
    return b;
  }

  function positionButton() {
    var b = document.getElementById(BUTTON_ID);
    if (!b) return;
    var bottom = window.innerWidth <= 600 ? 10 : 18;
    var radio = document.getElementById("algolassi-radio-host");
    if (radio) { var r = radio.getBoundingClientRect(); if (r.height > 0 && r.top < window.innerHeight) bottom = Math.max(bottom, window.innerHeight - r.top + 10); }
    b.style.bottom = bottom + "px";
  }

  function apply() {
    addStyles();
    var b = ensureButton(), h = host(), isHidden = hidden();
    if (h) {
      h.classList.toggle("algolassi-chat-toggle-hidden", isHidden);
      if (!isHidden) h.classList.remove("algolassi-chat-is-hidden");
    }
    b.classList.toggle("is-visible", isHidden);
    positionButton();
  }

  function init() {
    addStyles();
    try { if (localStorage.getItem(STORAGE_KEY) === null) localStorage.setItem(STORAGE_KEY, "0"); } catch (e) {}
    ensureButton();
    apply();
    window.addEventListener("resize", positionButton, { passive: true });
    window.addEventListener("scroll", positionButton, { passive: true });
    var observer = new MutationObserver(function () { apply(); });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("algolassi:spa-navigation", function () { setTimeout(apply, 50); setTimeout(apply, 500); });
    setTimeout(apply, 100); setTimeout(apply, 1000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();
