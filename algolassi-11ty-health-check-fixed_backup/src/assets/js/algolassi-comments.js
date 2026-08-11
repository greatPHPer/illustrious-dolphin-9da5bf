(function () {
  "use strict";

  var SUPABASE_URL = "https://ashezapnoqslggtxcncj.supabase.co";
  var SUPABASE_KEY = "sb_publishable_ki4D3v_JZk4elETfkYtmGA_xWDtbpBg";
  var endpoint = SUPABASE_URL + "/rest/v1/comments";

  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
  }

  async function getSession() {
    if (!window.AlgolassiSupabase) return null;
    var result = await window.AlgolassiSupabase.auth.getSession();
    return result.data && result.data.session ? result.data.session : null;
  }

  function initComments() {
    var list = document.getElementById("algolassi-comment-list");
    var form = document.getElementById("algolassi-comment-form");
    var status = document.getElementById("comment-status");
    if (!list || !form || list.dataset.initialized === "true") return;
    list.dataset.initialized = "true";

    var slug = window.location.pathname.replace(/^\/+|\/+$/g, "") || "home";
    var restHeaders = { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY, "Content-Type": "application/json" };

    async function loadComments() {
      try {
        var response = await fetch(endpoint + "?select=id,name,comment,created_at&approved=eq.true&page_slug=eq." + encodeURIComponent(slug) + "&order=created_at.desc", { headers: restHeaders });
        if (!response.ok) throw new Error("Unable to load comments.");
        var comments = await response.json();
        if (!comments.length) { list.innerHTML = "<p>No comments yet. Be the first to comment!</p>"; return; }
        list.innerHTML = comments.map(function (item) {
          return '<article class="comment-item"><div><span class="comment-author">' + escapeHtml(item.name) + '</span><span class="comment-date">' + escapeHtml(new Date(item.created_at).toLocaleString()) + '</span></div><div class="comment-body">' + escapeHtml(item.comment) + '</div></article>';
        }).join("");
      } catch (error) {
        list.innerHTML = "<p>Comments are temporarily unavailable. Please try again later.</p>";
        console.error("Algolassi comments:", error);
      }
    }

    async function updateIdentity() {
      var session = await getSession();
      var user = session && session.user;
      var nameInput = document.getElementById("comment-name");
      if (!nameInput) return;
      if (user) {
        var metadata = user.user_metadata || {};
        nameInput.value = metadata.full_name || metadata.name || user.email || "Google user";
        nameInput.readOnly = true;
        status.textContent = "✓ Signed in with Google. Your comment will be published immediately.";
      } else {
        nameInput.readOnly = false;
        status.textContent = "Anonymous comments are reviewed before publishing.";
      }
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var nameInput = document.getElementById("comment-name");
      var commentInput = document.getElementById("comment-text");
      var name = nameInput.value.trim();
      var comment = commentInput.value.trim();
      if (!name || !comment) { status.textContent = "Please enter your name and comment."; return; }
      var button = form.querySelector("button[type=submit]");
      button.disabled = true;
      status.textContent = "Posting comment...";
      try {
        var session = await getSession();
        var payload = { page_slug: slug, name: name, comment: comment };
        if (session && session.user && window.AlgolassiSupabase) {
          var result = await window.AlgolassiSupabase.from("comments").insert(payload);
          if (result.error) throw result.error;
          form.reset();
          await updateIdentity();
          status.textContent = "Thanks! Your comment is now published.";
        } else {
          var response = await fetch(endpoint, { method: "POST", headers: Object.assign({}, restHeaders, { Prefer: "return=minimal" }), body: JSON.stringify(payload) });
          if (!response.ok) throw new Error(await response.text());
          form.reset();
          await updateIdentity();
          status.textContent = "Thanks! Your comment was submitted and will appear after approval.";
        }
        await loadComments();
      } catch (error) {
        status.textContent = "Sorry, your comment could not be submitted. Please try again.";
        console.error("Algolassi comment submit:", error);
      } finally {
        button.disabled = false;
      }
    });

    loadComments();
    updateIdentity();
    window.addEventListener("algolassi:auth-changed", updateIdentity);
  }

  window.AlgolassiCommentsInit = initComments;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initComments);
  else initComments();
})();
