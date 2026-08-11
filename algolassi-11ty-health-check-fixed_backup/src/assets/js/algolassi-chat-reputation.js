/* Algolassi Community - Phase 3C: reputation UI */
(function () {
  "use strict";
  var initialized = false;
  var decorating = false;
  var lastSignature = "";
  var styleAdded = false;

  function esc(v) { return String(v || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;"); }

  function addStyles() {
    if (styleAdded) return;
    styleAdded = true;
    var style = document.createElement("style");
    style.textContent = ".algolassi-chat-author-line{display:inline-flex;align-items:center;gap:5px}.algolassi-chat-reputation{font-size:.78em;font-weight:600;opacity:.85;white-space:nowrap}.algolassi-chat-reaction-row{display:flex;align-items:center;gap:7px;margin-top:6px}.algolassi-chat-like{border:1px solid rgba(127,127,127,.35);background:transparent;border-radius:999px;padding:3px 9px;cursor:pointer;font:inherit;line-height:1.2}.algolassi-chat-like:hover{transform:translateY(-1px)}.algolassi-chat-like.is-reacted{font-weight:700}.algolassi-chat-like:disabled{opacity:.55;cursor:not-allowed}.algolassi-chat-reaction-count{font-size:.82em;opacity:.75}.algolassi-chat-reputation-loading{font-size:.75em;opacity:.5}";
    document.head.appendChild(style);
  }

  function getClient() { return window.AlgolassiChatSupabase || null; }

  async function decorate() {
    var host = document.getElementById("algolassi-chat-presence-host");
    var client = getClient();
    if (!host || !client || decorating) return;
    var nodes = Array.prototype.slice.call(host.querySelectorAll(".algolassi-chat-message"));
    if (!nodes.length) return;

    var result = await client.from("chat_messages").select("id,user_id,username,created_at").order("created_at", { ascending: false }).limit(50);
    if (result.error) { console.warn("Algolassi reputation messages:", result.error); return; }
    var rows = (result.data || []).reverse();
    if (rows.length !== nodes.length) return;

    var signature = rows.map(function (r) { return r.id; }).join(",") + ":" + nodes.length;
    var allDecorated = nodes.every(function (node) {
      return !!node.querySelector(".algolassi-chat-reaction-row");
    });
    if (signature === lastSignature && allDecorated) return;

    decorating = true;
    try {
      var usernames = rows.map(function (r) { return r.username; }).filter(Boolean);
      var profilesResult = usernames.length ? await client.from("profiles").select("user_id,username,reputation").in("username", usernames) : { data: [], error: null };
      var profiles = profilesResult.data || [];
      var profileByName = {};
      profiles.forEach(function (p) { profileByName[p.username] = p; });

      var ids = rows.map(function (r) { return r.id; });
      var reactionsResult = ids.length ? await client.from("chat_message_reactions").select("message_id,user_id").in("message_id", ids) : { data: [], error: null };
      var reactions = reactionsResult.data || [];
      var counts = {}, mine = {};
      var authResult = await client.auth.getUser();
      var myId = authResult.data && authResult.data.user ? authResult.data.user.id : null;
      reactions.forEach(function (r) {
        counts[r.message_id] = (counts[r.message_id] || 0) + 1;
        if (myId && r.user_id === myId) mine[r.message_id] = true;
      });

      nodes.forEach(function (node, index) {
        var row = rows[index];
        if (!row) return;
        var meta = node.querySelector(".algolassi-chat-message-meta");
        if (meta) {
          var old = meta.querySelector(".algolassi-chat-author-line");
          if (old) old.remove();
          var strong = meta.querySelector("strong");
          if (strong) {
            var line = document.createElement("span");
            line.className = "algolassi-chat-author-line";
            var name = document.createElement("strong");
            name.textContent = strong.textContent;
            strong.replaceWith(line);
            line.appendChild(name);
            var p = profileByName[row.username];
            var rep = document.createElement("span");
            rep.className = "algolassi-chat-reputation";
            rep.textContent = "⭐ " + String(p && Number.isFinite(Number(p.reputation)) ? Number(p.reputation) : 0);
            line.appendChild(rep);
          }
        }

        var oldRow = node.querySelector(".algolassi-chat-reaction-row");
        if (oldRow) oldRow.remove();
        var reactionRow = document.createElement("div");
        reactionRow.className = "algolassi-chat-reaction-row";
        var button = document.createElement("button");
        button.type = "button";
        button.className = "algolassi-chat-like" + (mine[row.id] ? " is-reacted" : "");
        button.textContent = mine[row.id] ? "👍 Liked" : "👍 Like";
        button.disabled = !myId;
        button.title = myId ? "Give this message one positive reputation point" : "Sign in with Google to give reputation";
        var count = document.createElement("span");
        count.className = "algolassi-chat-reaction-count";
        count.textContent = String(counts[row.id] || 0);
        button.addEventListener("click", async function () {
          button.disabled = true;
          var rpc = await client.rpc("toggle_chat_positive_reaction", { p_message_id: row.id });
          if (rpc.error) {
            console.error("Algolassi reputation reaction:", rpc.error);
            button.disabled = false;
            return;
          }
          var data = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
          var reacted = !!(data && data.reacted);
          var newCount = data && data.reaction_count != null ? data.reaction_count : 0;
          button.textContent = reacted ? "👍 Liked" : "👍 Like";
          button.classList.toggle("is-reacted", reacted);
          count.textContent = String(newCount);
          button.disabled = false;
          lastSignature = "";
          decorate();
        });
        reactionRow.appendChild(button);
        reactionRow.appendChild(count);
        node.appendChild(reactionRow);
      });
      lastSignature = signature;
    } finally { decorating = false; }
  }

  function refreshAfterVisibilityChange() {
    lastSignature = "";
    setTimeout(function () { decorate(); }, 50);
  }

  function start() {
    if (initialized) return;
    initialized = true;
    addStyles();
    var observer = new MutationObserver(function () { setTimeout(decorate, 30); });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("algolassi:username-changed", function () { lastSignature = ""; setTimeout(decorate, 100); });
    window.addEventListener("algolassi:auth-changed", function () { lastSignature = ""; setTimeout(decorate, 100); });
    window.addEventListener("algolassi:spa-navigation", function () { lastSignature = ""; setTimeout(decorate, 100); });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") refreshAfterVisibilityChange();
    });
    var tries = 0;
    var timer = setInterval(function () { decorate(); if (++tries > 30) clearInterval(timer); }, 1000);
  }

  window.AlgolassiChatReputationInit = start;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true }); else start();
})();
