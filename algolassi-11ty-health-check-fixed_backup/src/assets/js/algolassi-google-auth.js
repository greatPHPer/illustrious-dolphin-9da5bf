(function () {
  "use strict";

  var CLIENT_ID = "82669071-dvo4ur39m1a4b4a6a8katj9hkhquti2e.apps.googleusercontent.com";
  var SUPABASE_URL = "https://ashezapnoqslggtxcncj.supabase.co";
  var SUPABASE_KEY = "sb_publishable_ki4D3v_JZk4elETfkYtmGA_xWDtbpBg";
  var SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
  var containerId = "algolassi-google-auth";
  var supabaseClient = null;

  function ensureContainer() {
    var existing = document.getElementById(containerId);
    if (existing) return existing;
    var header = document.querySelector(".site-header-inner");
    if (!header) return null;
    var el = document.createElement("div");
    el.id = containerId;
    el.setAttribute("aria-live", "polite");
    el.style.cssText = "margin-left:auto;display:flex;align-items:center;gap:10px;position:relative;z-index:1000";
    header.appendChild(el);
    return el;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.defer = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function renderSignedIn(user) {
    var el = ensureContainer();
    if (!el) return;
    var name = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || user.email || "Google user";
    el.innerHTML = '<span style="font-size:13px;font-weight:600">Hi, ' + escapeHtml(name) + '</span>' +
      '<button type="button" id="algolassi-google-signout" style="border:1px solid #d0d5dd;background:#fff;border-radius:7px;padding:7px 10px;cursor:pointer">Sign out</button>';
    document.getElementById("algolassi-google-signout").addEventListener("click", function () {
      supabaseClient.auth.signOut().then(function () { renderSignedOut(); });
    });
    window.dispatchEvent(new CustomEvent("algolassi:auth-changed", { detail: { user: user } }));
  }

  function renderSignedOut() {
    var el = ensureContainer();
    if (!el) return;
    el.innerHTML = '<button type="button" id="algolassi-google-login" style="border:1px solid #d0d5dd;background:#fff;border-radius:7px;padding:8px 12px;cursor:pointer;font-weight:600">Sign in with Google</button>';
    document.getElementById("algolassi-google-login").addEventListener("click", function () {
      supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + window.location.pathname }
      });
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function initGoogleOneTap() {
    if (!window.google || !window.google.accounts || !window.google.accounts.id) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: function (response) {
        supabaseClient.auth.signInWithIdToken({
          provider: "google",
          token: response.credential
        }).then(function (result) {
          if (result.error) throw result.error;
          renderSignedIn(result.data.user);
          window.dispatchEvent(new CustomEvent("algolassi:auth-changed", { detail: { user: result.data.user } }));
        }).catch(function (error) {
          console.error("Algolassi Google sign-in failed:", error);
        });
      },
      auto_select: false,
      cancel_on_tap_outside: false,
      use_fedcm_for_prompt: true
    });
    window.google.accounts.id.prompt();
  }

  function init() {
    ensureContainer();
    import(SUPABASE_JS).then(function (module) {
      supabaseClient = module.createClient(SUPABASE_URL, SUPABASE_KEY);
      window.AlgolassiSupabase = supabaseClient;
      supabaseClient.auth.getSession().then(function (result) {
        if (result.data && result.data.session && result.data.session.user) renderSignedIn(result.data.session.user);
        else renderSignedOut();
      });
      supabaseClient.auth.onAuthStateChange(function (_event, session) {
        if (session && session.user) renderSignedIn(session.user);
        else renderSignedOut();
      });
      return loadScript("https://accounts.google.com/gsi/client");
    }).then(function () {
      initGoogleOneTap();
    }).catch(function (error) {
      console.error("Algolassi Google authentication initialization failed:", error);
      renderSignedOut();
    });
  }

  window.AlgolassiGoogleAuthInit = init;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
