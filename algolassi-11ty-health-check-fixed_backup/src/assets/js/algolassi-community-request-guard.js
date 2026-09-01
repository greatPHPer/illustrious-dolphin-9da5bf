/* Algolassi community request guard.
   Keeps chat fallback polling from overwhelming the page while preserving realtime chat. */
(function () {
  "use strict";
  if (window.__algolassiCommunityRequestGuard) return;
  window.__algolassiCommunityRequestGuard = true;

  var originalSetInterval = window.setInterval;
  var originalClearInterval = window.clearInterval;
  var guardedIntervals = Object.create(null);
  var intervalSeq = 0;

  function isCommunityCallback(callback) {
    if (typeof callback !== "function") return false;
    var source = "";
    try { source = Function.prototype.toString.call(callback); } catch (e) { return false; }
    return /loadMessages|chat_messages|getCurrentUser|refreshIdentity|AlgolassiChat/i.test(source);
  }

  window.setInterval = function (callback, delay) {
    if (!isCommunityCallback(callback)) return originalSetInterval.apply(window, arguments);

    var key = "community:" + (/loadMessages|chat_messages/i.test(Function.prototype.toString.call(callback)) ? "messages" : "identity");
    if (guardedIntervals[key]) return guardedIntervals[key].id;

    var safeDelay = Math.max(Number(delay) || 0, key === "community:messages" ? 15000 : 20000);
    var id = originalSetInterval.call(window, callback, safeDelay);
    var token = { id: id, key: key, seq: ++intervalSeq };
    guardedIntervals[key] = token;
    return id;
  };

  window.clearInterval = function (id) {
    Object.keys(guardedIntervals).forEach(function (key) {
      if (guardedIntervals[key] && guardedIntervals[key].id === id) delete guardedIntervals[key];
    });
    return originalClearInterval.call(window, id);
  };

  var originalFetch = window.fetch;
  var cache = Object.create(null);
  var TTL = 4000;

  function isGuardedGet(url, options) {
    var method = options && options.method ? String(options.method).toUpperCase() : "GET";
    if (method !== "GET") return false;
    var text = String(url || "");
    return /ashezapnoqslggtxcncj\.supabase\.co\/(rest\/v1\/chat_messages|rest\/v1\/profiles|auth\/v1\/user)/i.test(text);
  }

  window.fetch = function (url, options) {
    if (!isGuardedGet(url, options)) return originalFetch.apply(window, arguments);

    var key = String(url);
    var now = Date.now();
    var hit = cache[key];
    if (hit && now - hit.time < TTL) return hit.promise.then(function (response) { return response.clone(); });

    var pending = originalFetch.apply(window, arguments).then(function (response) {
      return response.clone();
    });
    cache[key] = { time: now, promise: pending };
    pending.catch(function () { delete cache[key]; });
    return pending.then(function (response) { return response.clone(); });
  };
})();
