/* Algolassi community singleton guard.
   The SPA router may call page initializers repeatedly after navigation.
   Chat/Realt-time must remain a single long-lived instance. */
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

  // Chat owns the persistent realtime connection and should never be restarted
  // merely because the SPA replaces .site-main.
  wrapOnce("AlgolassiChatPresenceInit");
})();
