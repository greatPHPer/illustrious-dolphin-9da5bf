/* Algolassi Community - Phase 2: online presence + realtime chat */
(function () {
  "use strict";

  var SUPABASE_URL = "https://ashezapnoqslggtxcncj.supabase.co";
  var SUPABASE_KEY = "sb_publishable_ki4D3v_JZk4elETfkYtmGA_xWDtbpBg";
  var PRESENCE_CHANNEL = "algolassi-community-presence-v1";
  var CHAT_CHANNEL = "algolassi-community-chat-v1";
  var GUEST_KEY = "algolassi_guest_id_v1";
  var client = null;
  var channel = null;
  var chatChannel = null;
  var host = null;
  var presence = {};
  var currentUser = null;
  var initialized = false;
  var chatLoaded = false;
  var messages = [];

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
      host.setAttribute("aria-label", "Algolassi community chat");
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

    var chatRows = messages.map(function (item) {
      var when = item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
      return '<div class="algolassi-chat-message"><div class="algolassi-chat-message-meta"><strong>' + escapeHtml(item.username) + '</strong><span>' + escapeHtml(when) + '</span></div><div class="algolassi-chat-message-text">' + escapeHtml(item.message) + '</div></div>';
    }).join("");

    var me = currentUser ? displayName(currentUser) : guestId();
    el.innerHTML = '<div class="algolassi-chat-presence-card">' +
      '<div class="algolassi-chat-presence-head"><span>💬</span><strong>Algolassi Chat</strong><span class="algolassi-chat-online-count">' + users.length + '</span></div>' +
      '<div class="algolassi-chat-online-title">👥 Online now</div>' +
      '<ul class="algolassi-chat-online-list">' + (rows || '<li class="algolassi-chat-empty">No other users online yet.</li>') + '</ul>' +
      '<div class="algolassi-chat-messages" id="algolassi-chat-messages">' + (chatRows || '<div class="algolassi-chat-empty">No messages yet. Say hello! 👋</div>') + '</div>' +
      '<form class="algolassi-chat-form" id="algolassi-chat-form">' +
      '<input id="algolassi-chat-input" maxlength="500" autocomplete="off" placeholder="Message as ' + escapeHtml(me) + '" aria-label="Chat message">' +
      '<button type="submit" aria-label="Send chat message">Send</button>' +
      '</form>' +
      '<div class="algolassi-chat-status" id="algolassi-chat-status" aria-live="polite"></div>' +
      '</div>';

    bindForm();
    var box = document.getElementById("algolassi-chat-messages");
    if (box) box.scrollTop = box.scrollHeight;
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
    currentUser = user || null;
    if (!channel) return;
    var payload;
    if (user) {
      payload = { user_id: user.id, display_name: displayName(user), kind: "google", reputation: 0 };
    } else {
      var id = guestId();
      payload = { guest_id: id, display_name: id, kind: "guest", reputation: 0 };
    }
    channel.track(payload).catch(function (error) { console.error("Algolassi presence track:", error); });
    render();
  }

  function loadMessages() {
    if (!client) return;
    client.from("chat_messages").select("id,user_id,guest_id,username,message,created_at").order("created_at", { ascending: false }).limit(50).then(function (result) {
      if (result.error) throw result.error;
      messages = (result.data || []).reverse();
      chatLoaded = true;
      render();
    }).catch(function (error) {
      console.error("Algolassi chat load:", error);
      chatLoaded = false;
      render();
    });
  }

  function bindChatRealtime() {
    chatChannel = client.channel(CHAT_CHANNEL);
    chatChannel.on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, function (payload) {
      if (!payload || !payload.new) return;
      if (!messages.some(function (item) { return String(item.id) === String(payload.new.id); })) {
        messages.push(payload.new);
        if (messages.length > 50) messages.shift();
        render();
      }
    });
    chatChannel.subscribe();
  }

  function bindForm() {
    var form = document.getElementById("algolassi-chat-form");
    if (!form || form.dataset.bound === "true") return;
    form.dataset.bound = "true";
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var input = document.getElementById("algolassi-chat-input");
      var status = document.getElementById("algolassi-chat-status");
      var text = input ? input.value.trim() : "";
      if (!text) return;
      if (!client) return;
      var payload;
      if (currentUser) {
        payload = { user_id: currentUser.id, guest_id: null, username: displayName(currentUser), message: text };
      } else {
        var id = guestId();
        payload = { user_id: null, guest_id: id, username: id, message: text };
      }
      if (status) status.textContent = "Sending...";
      input.disabled = true;
      client.from("chat_messages").insert(payload).then(function (result) {
        if (result.error) throw result.error;
        input.value = "";
        if (status) status.textContent = "";
      }).catch(function (error) {
        console.error("Algolassi chat send:", error);
        if (status) status.textContent = "Message could not be sent. Please try again.";
      }).finally(function () {
        input.disabled = false;
        input.focus();
      });
    });
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
      channel = client.channel(PRESENCE_CHANNEL, { config: { presence: { key: "algolassi-presence" } } });
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
        if (status === "SUBSCRIBED") getCurrentUser().then(trackUser);
      });
    }).then(function () {
      loadMessages();
      bindChatRealtime();
    }).catch(function (error) {
      console.error("Algolassi chat initialization:", error);
      render();
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
