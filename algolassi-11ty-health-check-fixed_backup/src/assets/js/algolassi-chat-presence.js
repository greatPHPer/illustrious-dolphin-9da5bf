/* Algolassi Community - Phase 2: online presence + realtime chat */
(function () {
  "use strict";
  var SUPABASE_URL = "https://ashezapnoqslggtxcncj.supabase.co";
  var SUPABASE_KEY = "sb_publishable_ki4D3v_JZk4elETfkYtmGA_xWDtbpBg";
  var PRESENCE_CHANNEL = "algolassi-community-presence-v1";
  var CHAT_CHANNEL = "algolassi-community-chat-v1";
  var GUEST_KEY = "algolassi_guest_id_v1";
  var client = null, channel = null, chatChannel = null, host = null;
  var presence = {}, currentUser = null, initialized = false, chatLoaded = false, messages = [];
  var preserveChatScrollTop = null;

  function escapeHtml(value) { return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;"); }
  function guestId() { try { var existing = localStorage.getItem(GUEST_KEY); if (existing) return existing; var bytes = new Uint8Array(8); crypto.getRandomValues(bytes); var id = "Guest_" + Array.from(bytes, function (b) { return b.toString(16).padStart(2, "0"); }).join(""); localStorage.setItem(GUEST_KEY, id); return id; } catch (e) { return "Guest_" + Math.random().toString(16).slice(2, 10); } }
  function displayName(user) { var m = user && user.user_metadata ? user.user_metadata : {}; return m.full_name || m.name || user.email || "Google user"; }
  function ensureHost() { if (host && document.body.contains(host)) return host; host = document.getElementById("algolassi-chat-presence-host"); if (!host) { host = document.createElement("section"); host.id = "algolassi-chat-presence-host"; host.setAttribute("aria-label", "Algolassi community chat"); host.setAttribute("data-no-spa", "true"); document.body.appendChild(host); } return host; }
  function onlineUsers() { var map = {}; Object.keys(presence || {}).forEach(function (key) { (presence[key] || []).forEach(function (item) { map[item.user_id || item.guest_id || key] = item; }); }); return Object.keys(map).map(function (key) { return map[key]; }).sort(function (a, b) { return String(a.display_name || "").localeCompare(String(b.display_name || "")); }); }
  function captureChatScroll() { var box = document.getElementById("algolassi-chat-messages"); if (box) preserveChatScrollTop = box.scrollTop; }
  function render() {
    var el = ensureHost(), users = onlineUsers();
    var rows = users.map(function (user) { var name = user.display_name || (user.kind === "guest" ? user.guest_id : "Google user"); var badge = user.kind === "google" ? "Google" : "Guest"; return '<li class="algolassi-chat-online-user"><span class="algolassi-chat-online-dot" aria-hidden="true"></span><span class="algolassi-chat-online-name">' + escapeHtml(name) + '</span><span class="algolassi-chat-online-badge">' + badge + '</span></li>'; }).join("");
    var chatRows = messages.map(function (item) { var when = item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""; return '<div class="algolassi-chat-message"><div class="algolassi-chat-message-meta"><strong>' + escapeHtml(item.username) + '</strong><span>' + escapeHtml(when) + '</span></div><div class="algolassi-chat-message-text">' + renderMessage(item.message) + '</div></div>'; }).join("");
    var me = currentUser ? displayName(currentUser) : guestId();
    el.innerHTML = '<div class="algolassi-chat-presence-card"><div class="algolassi-chat-presence-head"><span>💬</span><strong>Algolassi Chat</strong><span class="algolassi-chat-online-count">' + users.length + '</span></div><div class="algolassi-chat-online-title">👥 Online now</div><ul class="algolassi-chat-online-list">' + (rows || '<li class="algolassi-chat-empty">No other users online yet.</li>') + '</ul><div class="algolassi-chat-messages" id="algolassi-chat-messages">' + (chatRows || '<div class="algolassi-chat-empty">No messages yet. Say hello! 👋</div>') + '</div><form class="algolassi-chat-form" id="algolassi-chat-form"><input id="algolassi-chat-input" maxlength="500" autocomplete="off" placeholder="Message as ' + escapeHtml(me) + '" aria-label="Chat message"><button type="submit" aria-label="Send chat message">Send</button></form><div class="algolassi-chat-status" id="algolassi-chat-status" aria-live="polite"></div></div>';
    bindForm();
    var box = document.getElementById("algolassi-chat-messages");
    if (box) {
      if (preserveChatScrollTop !== null) {
        box.scrollTop = preserveChatScrollTop;
        preserveChatScrollTop = null;
      } else {
        box.scrollTop = box.scrollHeight;
      }
    }
    reposition();
  }
  function allowedHost(hostname) { hostname = String(hostname || "").toLowerCase().replace(/\.$/, ""); return hostname === "localhost" || hostname === "algolassi.online" || hostname === "www.algolassi.online"; }
  function validateInternalLinks(text) { var matches = String(text || "").match(/(?:https?:\/\/|www\.)[^\s<]+/gi) || []; for (var i = 0; i < matches.length; i++) { var raw = matches[i].replace(/[),.!?;:'\"]+$/g, ""), candidate = raw.indexOf("www.") === 0 ? "https://" + raw : raw; try { if (!allowedHost(new URL(candidate, window.location.origin).hostname)) return { ok: false, url: raw }; } catch (e) { return { ok: false, url: raw }; } } return { ok: true }; }
  function renderMessage(text) { var value = escapeHtml(text); return value.replace(/(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi, function (encodedUrl) { var clean = encodedUrl.replace(/[),.!?;:'\"]+$/g, ""), trailing = encodedUrl.slice(clean.length), href = clean.indexOf("www.") === 0 ? "https://" + clean : clean; try { var parsed = new URL(href, window.location.origin); if (!allowedHost(parsed.hostname)) return encodedUrl; return '<a href="' + escapeHtml(parsed.href) + '" data-algolassi-spa-link="true" rel="noopener">' + clean + '</a>' + trailing; } catch (e) { return encodedUrl; } }); }
  function navigateChatLink(url) {
    if (window.__algolassiChatNavigating) return;
    var current = new URL(window.location.href);
    if (url.origin !== current.origin || !allowedHost(url.hostname) || url.href === current.href) return;
    captureChatScroll();
    window.__algolassiChatNavigating = true;
    fetch(url.href, { credentials: "same-origin" }).then(function (response) { if (!response.ok) throw new Error("HTTP " + response.status); return response.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, "text/html"), currentMain = document.querySelector(".site-main"), nextMain = doc.querySelector(".site-main");
      if (!currentMain || !nextMain) throw new Error("site-main not found");
      currentMain.innerHTML = nextMain.innerHTML;
      if (doc.title) document.title = doc.title;
      var currentDescription = document.querySelector('meta[name="description"]'), nextDescription = doc.querySelector('meta[name="description"]');
      if (currentDescription && nextDescription) currentDescription.setAttribute("content", nextDescription.getAttribute("content") || "");
      history.pushState({ algolassiChatSpa: true }, "", url.href);
      window.scrollTo(0, 0);
      Array.prototype.slice.call(currentMain.querySelectorAll("script")).forEach(function (oldScript) { if (!oldScript.src) { oldScript.parentNode.removeChild(oldScript); return; } var s = document.createElement("script"); Array.prototype.forEach.call(oldScript.attributes, function (a) { s.setAttribute(a.name, a.value); }); s.async = false; s.src = oldScript.src; oldScript.parentNode.replaceChild(s, oldScript); });
      window.dispatchEvent(new CustomEvent("algolassi:spa-navigation", { detail: { url: url.href } }));
      setTimeout(function () { render(); }, 0);
    }).catch(function (error) { console.error("Algolassi chat SPA navigation failed:", error); preserveChatScrollTop = null; window.location.href = url.href; }).finally(function () { window.__algolassiChatNavigating = false; });
  }
  function bindChatLinkNavigation() { if (document.documentElement.dataset.algolassiChatLinksBound === "true") return; document.documentElement.dataset.algolassiChatLinksBound = "true"; document.addEventListener("click", function (event) { if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; var link = event.target && event.target.closest ? event.target.closest("#algolassi-chat-presence-host a[data-algolassi-spa-link='true']") : null; if (!link) return; var url; try { url = new URL(link.getAttribute("href"), window.location.href); } catch (e) { return; } if (url.origin !== window.location.origin || !allowedHost(url.hostname)) return; event.preventDefault(); event.stopImmediatePropagation(); navigateChatLink(url); }, true); }
  function reposition() { var el = document.getElementById("algolassi-chat-presence-host"); if (!el) return; var radio = document.getElementById("algolassi-radio-host"), bottom = window.innerWidth <= 600 ? 10 : 18; if (radio) { var rect = radio.getBoundingClientRect(); if (rect.height > 0 && rect.top < window.innerHeight) bottom = Math.max(bottom, window.innerHeight - rect.top + 10); } el.style.bottom = bottom + "px"; }
  function getCurrentUser() { if (!client) return Promise.resolve(null); return client.auth.getUser().then(function (result) { return result.data && result.data.user ? result.data.user : null; }).catch(function () { return null; }); }
  function trackUser(user) { currentUser = user || null; if (!channel) return; var payload = user ? { user_id: user.id, display_name: displayName(user), kind: "google", reputation: 0 } : { guest_id: guestId(), display_name: guestId(), kind: "guest", reputation: 0 }; channel.track(payload).catch(function (error) { console.error("Algolassi presence track:", error); }); render(); }
  function loadMessages() { if (!client) return; client.from("chat_messages").select("id,user_id,guest_id,username,message,created_at").order("created_at", { ascending: false }).limit(50).then(function (result) { if (result.error) throw result.error; messages = (result.data || []).reverse(); chatLoaded = true; render(); }).catch(function (error) { console.error("Algolassi chat load:", error); chatLoaded = false; render(); }); }
  function bindChatRealtime() { chatChannel = client.channel(CHAT_CHANNEL); chatChannel.on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, function (payload) { if (!payload || !payload.new) return; if (!messages.some(function (item) { return String(item.id) === String(payload.new.id); })) { messages.push(payload.new); if (messages.length > 50) messages.shift(); render(); } }); chatChannel.subscribe(function (status) { if (status !== "SUBSCRIBED") console.warn("Algolassi chat realtime status:", status); }); }
  function bindForm() { var form = document.getElementById("algolassi-chat-form"); if (!form || form.dataset.bound === "true") return; form.dataset.bound = "true"; form.addEventListener("submit", function (event) { event.preventDefault(); var input = document.getElementById("algolassi-chat-input"), status = document.getElementById("algolassi-chat-status"), text = input ? input.value.trim() : ""; if (!text || !client) return; var linkCheck = validateInternalLinks(text); if (!linkCheck.ok) { if (status) status.textContent = "External links aren't allowed in Algolassi Chat. Please share an Algolassi link."; return; } var payload = currentUser ? { user_id: currentUser.id, guest_id: null, username: displayName(currentUser), message: text } : { user_id: null, guest_id: guestId(), username: guestId(), message: text }; if (status) status.textContent = "Sending..."; input.disabled = true; client.from("chat_messages").insert(payload).select("id,user_id,guest_id,username,message,created_at").single().then(function (result) { if (result.error) throw result.error; if (result.data && !messages.some(function (item) { return String(item.id) === String(result.data.id); })) { messages.push(result.data); if (messages.length > 50) messages.shift(); } input.value = ""; if (status) status.textContent = ""; render(); }).catch(function (error) { console.error("Algolassi chat send:", error); if (status) status.textContent = "Message could not be sent. Please try again."; }).finally(function () { var newInput = document.getElementById("algolassi-chat-input"); if (newInput) { newInput.disabled = false; newInput.focus(); } }); }); }
  function start() { if (initialized) return; initialized = true; ensureHost(); bindChatLinkNavigation(); import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm").then(function (module) { client = module.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }); window.AlgolassiChatSupabase = client; channel = client.channel(PRESENCE_CHANNEL, { config: { presence: { key: "algolassi-presence" } } }); channel.on("presence", { event: "sync" }, function () { presence = channel.presenceState(); render(); }); channel.on("presence", { event: "join" }, function () { presence = channel.presenceState(); render(); }); channel.on("presence", { event: "leave" }, function () { presence = channel.presenceState(); render(); }); return channel.subscribe(function (status) { if (status === "SUBSCRIBED") getCurrentUser().then(trackUser); }); }).then(function () { loadMessages(); bindChatRealtime(); }).catch(function (error) { console.error("Algolassi chat initialization:", error); render(); }); window.addEventListener("algolassi:auth-changed", function (event) { trackUser(event && event.detail ? event.detail.user : null); }); window.addEventListener("resize", reposition, { passive: true }); window.addEventListener("algolassi:spa-navigation", function () { setTimeout(reposition, 0); }); window.setInterval(reposition, 1000); }
  window.AlgolassiChatPresenceInit = start;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true }); else start();
})();
