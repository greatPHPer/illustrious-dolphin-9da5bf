/* Algolassi Community - Phase 1: online presence */
(function () {
  "use strict";

  var SUPABASE_URL = "https://ashezapnoqslggtxcncj.supabase.co";
  var SUPABASE_KEY = "sb_publishable_ki4D3v_JZk4elETfkYtmGA_xWDtbpBg";
  var CHANNEL_NAME = "algolassi-community-presence-v1";
  var GUEST_KEY = "algolassi_guest_id_v1";
  var channel = null;
  var client = null;
  var host = null;
  var presence = {};
  var initialized = false;

  function escapeHtml(value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function guestId() {
    try {
      var existing = localStorage.getItem(GUEST_KEY);
      if (existing) return existing;
      var bytes = new Uint8Array(8);
      crypto.getRandomValues(bytes);
      var id = "Guest_" + Array.from(bytes, function (b) { return b.toString(16).padStart(2, "0"); }).join("");
      localStorage.setItem(GUEST_KEY, id);
      return id;
    } catch (e) {
      return "Guest_" + Math.random().toString(16).slice(2, 10);
    }
  }

  function displayName(user) {
    var metadata = user && user.user_metadata ? user.user_metadata : {};
    return metadata.full_name || metadata.name || user.email || "Google user";
  }

  function ensureHost() {
    if (host && document.body.contains(host)) return host;
    host = document.getElementById("algolassi-chat-presence-host");
    if (!host) {
      host = document.createElement("section");
      host.id = "algolassi-chat-presence-host";
      host.setAttribute("aria-label", "Algolassi users online");
      host.setAttribute("data-no-spa", "true");
      document.body.appendChild(host);
    }
    return host;
  }

  function onlineUsers() {
    var map = {};
    Object.keys(presence || {}).forEach(function (key) {
      (presence[key] || []).forEach(function (item) {
        var identity = item.user_id || item.guest_id || key;
        map[identity] = item;
      });
    });
    return Object.keys(map).map(function (key) { return map[key]; }).sort(function (a, b) {
      return String(a.display_name || "").localeCompare(String(b.display_name || ""));
    });
  }

  function render() {
    var el = ensureHost();
    var users = onlineUsers();
    var rows = users.map(function (user) {
      var name = user.display_name || (user.kind === "guest" ? user.guest_id : "Google user");
      var badge = user.kind === "google" ? "Google" : "Guest";
      return '<li class="algolassi-chat-online-user"><span class="algolassi-chat-online-dot" aria-hidden="true"></span><span class="algolassi-chat-online-name">' + escapeHtml(name) + '</span><span class="algolassi-chat-online-badge">' + badge + '</span></li>';
    }).join("");

    el.innerHTML = '<div class="algolassi-chat-presence-card">' +
      '<div class="algolassi-chat-presence-head"><span>👥</span><strong>Online now</strong><span class="algolassi-chat-online-count">' + users.length + '</span></div>' +
      '<ul class="algolassi-chat-online-list">' + (rows || '<li class="algolassi-chat-empty">No other users online yet.</li>') + '</ul>' +
      '<div class="algolassi-chat-phase-label">Community chat coming next</div>' +
      '</div>';
    reposition();
  }

  function reposition() {
    var el = document.getElementById("algolassi-chat-presence-host");
    if (!el) return;
    var radio = document.getElementById("algolassi-radio-host");
    var bottom = window.innerWidth <= 600 ? 10 : 18;
    if (radio) {
      var rect = radio.getBoundingClientRect();
      if (rect.height > 0 && rect.top < window.innerHeight) {
        bottom = Math.max(bottom, window.innerHeight - rect.top + 10);
      }
    }
    el.style.bottom = bottom + "px";
  }

  function getCurrentUser() {
    if (!client) return Promise.resolve(null);
    return client.auth.getUser().then(function (result) {
      return result.data && result.data.user ? result.data.user : null;
    }).catch(function () { return null; });
  }

  function trackUser(user) {
    if (!channel) return;
    var identity;
    var payload;
    if (user) {
      identity = user.id;
      payload = { user_id: user.id, display_name: displayName(user), kind: "google", reputation: 0 };
    } else {
      identity = guestId();
      payload = { guest_id: identity, display_name: identity, kind: "guest", reputation: 0 };
    }
    channel.track(payload).catch(function (error) { console.error("Algolassi presence track:", error); });
  }

  function start() {
    if (initialized) return;
    initialized = true;
    ensureHost();

    import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm").then(function (module) {
      client = module.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      window.AlgolassiChatSupabase = client;
      channel = client.channel(CHANNEL_NAME, { config: { presence: { key: "algolassi-presence" } } });
      channel.on("presence", { event: "sync" }, function () {
        presence = channel.presenceState();
        render();
      });
      channel.on("presence", { event: "join" }, function () {
        presence = channel.presenceState();
        render();
      });
      channel.on("presence", { event: "leave" }, function () {
        presence = channel.presenceState();
        render();
      });
      return channel.subscribe(function (status) {
        if (status === "SUBSCRIBED") {
          getCurrentUser().then(trackUser);
        }
      });
    }).catch(function (error) {
      console.error("Algolassi chat presence initialization:", error);
      var el = ensureHost();
      el.innerHTML = "";
    });

    window.addEventListener("algolassi:auth-changed", function (event) {
      var user = event && event.detail ? event.detail.user : null;
      trackUser(user || null);
    });
    window.addEventListener("resize", reposition, { passive: true });
    window.addEventListener("algolassi:spa-navigation", function () { setTimeout(reposition, 0); });
    window.setInterval(reposition, 1000);
  }

  window.AlgolassiChatPresenceInit = start;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
