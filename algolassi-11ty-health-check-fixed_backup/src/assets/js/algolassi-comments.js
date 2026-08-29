(function () {
  "use strict";

  var SUPABASE_URL = "https://ashezapnoqslggtxcncj.supabase.co";
  var SUPABASE_KEY = "sb_publishable_ki4D3v_JZk4elETfkYtmGA_xWDtbpBg";
  var ENDPOINT = SUPABASE_URL + "/rest/v1/comments";
  var REQUEST_TIMEOUT_MS = 10000;

  function escapeHtml(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getSession() {
    if (!window.AlgolassiSupabase || !window.AlgolassiSupabase.auth) return Promise.resolve(null);
    return window.AlgolassiSupabase.auth.getSession()
      .then(function (r) { return r && r.data && r.data.session ? r.data.session : null; })
      .catch(function (e) { console.warn("Algolassi comment auth lookup:", e); return null; });
  }

  function getUsername(user) {
    if (!user || !window.AlgolassiSupabase) return Promise.resolve("");
    return window.AlgolassiSupabase.from("profiles").select("username").eq("user_id", user.id).maybeSingle()
      .then(function (r) { return !r.error && r.data ? (r.data.username || "") : ""; })
      .catch(function (e) { console.warn("Algolassi comment profile lookup:", e); return ""; });
  }

  function updateIdentity() {
    var nameInput = document.getElementById("comment-name"), status = document.getElementById("comment-status");
    if (!nameInput) return Promise.resolve();
    return getSession().then(function (session) {
      var user = session && session.user;
      if (!user) {
        nameInput.readOnly = false;
        if (status) status.textContent = "Anonymous comments are reviewed before publishing.";
        return;
      }
      return getUsername(user).then(function (username) {
        var metadata = user.user_metadata || {};
        nameInput.value = username || metadata.full_name || metadata.name || user.email || "Google user";
        nameInput.readOnly = true;
        if (status) status.textContent = "✓ Signed in with Google. Your comment will be published immediately.";
      });
    });
  }

  function fetchWithTimeout(url, options) {
    options = options || {};
    if (!window.AbortController) return fetch(url, options);
    var controller = new AbortController();
    var timer = window.setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT_MS);
    return fetch(url, Object.assign({}, options, { signal: controller.signal }))
      .then(function (response) { window.clearTimeout(timer); return response; }, function (error) {
        window.clearTimeout(timer);
        if (error && error.name === "AbortError") throw new Error("Comments request timed out.");
        throw error;
      });
  }

  function initComments() {
    var list = document.getElementById("algolassi-comment-list"), form = document.getElementById("algolassi-comment-form"), status = document.getElementById("comment-status");
    if (!list || !form || list.dataset.initialized === "true") return;
    list.dataset.initialized = "true";

    var slug = window.location.pathname.replace(/^\/+|\/+$/g, "") || "home";
    var headers = { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY, "Content-Type": "application/json" };

    function loadComments() {
      list.innerHTML = "<p>Loading comments...</p>";
      var url = ENDPOINT + "?select=id,name,comment,created_at&approved=eq.true&page_slug=eq." + encodeURIComponent(slug) + "&order=created_at.desc";
      return fetchWithTimeout(url, { headers: headers })
        .then(function (response) {
          if (!response.ok) throw new Error("Comments request failed: HTTP " + response.status);
          return response.json();
        })
        .then(function (items) {
          if (!Array.isArray(items) || !items.length) {
            list.innerHTML = "<p>No comments yet. Be the first to comment!</p>";
            return;
          }
          list.innerHTML = items.map(function (item) {
            return '<article class="comment-item"><div><span class="comment-author">' + escapeHtml(item.name) + '</span><span class="comment-date">' + escapeHtml(new Date(item.created_at).toLocaleString()) + '</span></div><div class="comment-body">' + escapeHtml(item.comment) + '</div></article>';
          }).join("");
        })
        .catch(function (error) {
          list.innerHTML = "<p>Comments are temporarily unavailable. Please try again later.</p>";
          console.error("Algolassi comments:", error);
        });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var nameInput = document.getElementById("comment-name"), commentInput = document.getElementById("comment-text");
      var name = nameInput ? nameInput.value.trim() : "", comment = commentInput ? commentInput.value.trim() : "";
      if (!name || !comment) { if (status) status.textContent = "Please enter your name and comment."; return; }

      var button = form.querySelector("button[type=submit]");
      if (button) button.disabled = true;
      if (status) status.textContent = "Posting comment...";

      getSession().then(function (session) {
        var payload = { page_slug: slug, name: name, comment: comment };
        if (session && session.user && window.AlgolassiSupabase) {
          return window.AlgolassiSupabase.from("comments").insert(payload).then(function (result) {
            if (result.error) throw result.error;
            form.reset();
            return updateIdentity();
          }).then(function () { if (status) status.textContent = "Thanks! Your comment is now published."; });
        }
        return fetchWithTimeout(ENDPOINT, { method: "POST", headers: Object.assign({}, headers, { Prefer: "return=minimal" }), body: JSON.stringify(Object.assign({}, payload, { approved: false })) })
          .then(function (response) {
            if (response.ok) return;
            return response.text().then(function (text) { throw new Error("Comments POST failed: HTTP " + response.status + (text ? " " + text : "")); });
          })
          .then(function () { form.reset(); return updateIdentity(); })
          .then(function () { if (status) status.textContent = "Thanks! Your comment was submitted and will appear after approval."; });
      }).then(function () { return loadComments(); }).catch(function (error) {
        if (status) status.textContent = "Sorry, your comment could not be submitted. Please try again.";
        console.error("Algolassi comment submit:", error);
      }).finally(function () { if (button) button.disabled = false; });
    });

    loadComments();
    updateIdentity();
    window.addEventListener("algolassi:auth-changed", updateIdentity);
    window.addEventListener("algolassi:username-changed", updateIdentity);
  }

  window.AlgolassiCommentsInit = initComments;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initComments, { once: true });
  else initComments();
})();
