/* Algolassi community singleton guard.
   The SPA router may call page initializers repeatedly after navigation.
   Chat/Realtime must remain a single long-lived instance. */
(function () {
  "use strict";
  if (window.__algolassiCommunitySingletonBound) return;
  window.__algolassiCommunitySingletonBound = true;

  function wrapOnce(name) {
    var original = window[name];
    if (typeof original !== "function" || original.__algolassiOnceWrapped) return;
    var invoked = false;
    function onceWrapper() {
      if (invoked) return;
      invoked = true;
      return original.apply(this, arguments);
    }
    onceWrapper.__algolassiOnceWrapped = true;
    onceWrapper.__algolassiOriginal = original;
    window[name] = onceWrapper;
  }

  wrapOnce("AlgolassiChatPresenceInit");

  /* Developer Tools SPA navigation imports .page-content and re-creates
     embedded scripts with Node.replaceChild(). Do not replay global
     community/auth/navigation scripts already owned by the base layout. */
  if (!window.__algolassiSpaScriptReplayGuard) {
    window.__algolassiSpaScriptReplayGuard = true;
    var originalReplaceChild = Node.prototype.replaceChild;
    var globalScriptRe = /(?:^|\/)(?:algolassi-(comments|chat-presence|chat-reputation|chat-toggle|floating-stack|user-profile|google-auth|theme|search|search-jump|newsletter|get-link|assistant|assistant-country-fix|assistant-phase5|radio|breadcrumb-hover|devtools-menu|navigation-loading|tool-history|tool-history-scroll-fix|stepper-scroll-sync|spa-router)\.js)(?:\?|$)/i;
    Node.prototype.replaceChild = function (newChild, oldChild) {
      try {
        if (newChild && newChild.nodeType === 1 && String(newChild.tagName).toLowerCase() === "script") {
          var src = newChild.getAttribute("src") || "";
          if (src && globalScriptRe.test(src)) return oldChild;
        }
      } catch (e) {}
      return originalReplaceChild.call(this, newChild, oldChild);
    };
  }
})();
