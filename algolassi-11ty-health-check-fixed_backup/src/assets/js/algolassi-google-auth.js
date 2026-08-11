(function () {
  "use strict";

  var CLIENT_ID = "82669071-dvo4ur39m1a4b4a6a8katj9hkhquti2e.apps.googleusercontent.com";
  var SUPABASE_URL = "https://ashezapnoqslggtxcncj.supabase.co";
  var SUPABASE_KEY = "sb_publishable_ki4D3v_JZK4elETfkYtmGA_xWDtbpBg";
  var SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
  var containerId = "algolassi-google-auth";
  var supabaseClient = null;
  var nonce = null;
  var profileCache = {};

  function ensureContainer() {
    var existing = document.getElementById(containerId); if (existing) return existing;
    var header = document.querySelector(".site-header-inner"); if (!header) return null;
    var el = document.createElement("div"); el.id = containerId; el.setAttribute("aria-live", "polite"); el.style.cssText = "margin-left:auto;display:flex;align-items:center;gap:10px;position:relative;z-index:1000"; header.appendChild(el); return el;
  }
  function loadScript(src) { return new Promise(function (resolve, reject) { var s = document.createElement("script"); s.src = src; s.async = true; s.defer = true; s.onload = resolve; s.onerror = reject; document.head.appendChild(s); }); }
  function escapeHtml(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;"); }
  function getDisplayName(user) { var metadata = user && user.user_metadata ? user.user_metadata : {}; return metadata.full_name || metadata.name || user.email || "Google user"; }

  async function getUsername(user) {
    if (!user || !supabaseClient) return "";
    if (profileCache[user.id] !== undefined) return profileCache[user.id];
    try {
      var result = await supabaseClient.from("profiles").select("username").eq("user_id", user.id).maybeSingle();
      if (result.error) throw result.error;
      var username = result.data && result.data.username ? result.data.username : "";
      profileCache[user.id] = username;
      return username;
    } catch (error) { console.warn("Algolassi profile lookup:", error); profileCache[user.id] = ""; return ""; }
  }

  async function publishAuth(user) {
    var username = user ? await getUsername(user) : "";
    window.dispatchEvent(new CustomEvent("algolassi:auth-changed", { detail: { user: user || null, name: username || (user ? getDisplayName(user) : ""), email: user && user.email ? user.email : "", username: username } }));
  }

  async function renderSignedIn(user) {
    var el = ensureContainer(); if (!el) return;
    var username = await getUsername(user), name = username || getDisplayName(user);
    el.innerHTML = '<span style="font-size:13px;font-weight:600">Hi, ' + escapeHtml(name) + '</span>' + '<button type="button" id="algolassi-google-signout" style="border:1px solid #d0d5dd;background:#fff;border-radius:7px;padding:7px 10px;cursor:pointer">Sign out</button>';
    document.getElementById("algolassi-google-signout").addEventListener("click", function () { supabaseClient.auth.signOut().then(function () { renderSignedOut(); publishAuth(null); }); });
    await publishAuth(user);
  }
  function renderSignedOut() { var el = ensureContainer(); if (!el) return; el.innerHTML = '<button type="button" id="algolassi-google-login" style="border:1px solid #d0d5dd;background:#fff;border-radius:7px;padding:8px 12px;cursor:pointer;font-weight:600">Sign in with Google</button>'; var button = document.getElementById("algolassi-google-login"); if (button) button.addEventListener("click", function () { supabaseClient.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + window.location.pathname } }); }); publishAuth(null); }
  function randomNonce() { var bytes = new Uint8Array(32); crypto.getRandomValues(bytes); return Array.from(bytes, function (b) { return b.toString(16).padStart(2, "0"); }).join(""); }
  async function sha256(value) { var data = new TextEncoder().encode(value); var digest = await crypto.subtle.digest("SHA-256", data); return Array.from(new Uint8Array(digest), function (b) { return b.toString(16).padStart(2, "0"); }).join(""); }
  async function signInWithGoogleToken(token) { if (!supabaseClient || !token || !nonce) return; var timeout = new Promise(function (_, reject) { setTimeout(function () { reject(new Error("Google sign-in timed out.")); }, 15000); }); try { var result = await Promise.race([supabaseClient.auth.signInWithIdToken({ provider: "google", token: token, nonce: nonce }), timeout]); if (!result || result.error) throw (result && result.error) || new Error("Google sign-in failed."); if (result.data && result.data.user) await renderSignedIn(result.data.user); } catch (error) { console.error("Algolassi Google One Tap sign-in failed:", error); var el = ensureContainer(); if (el) { var old = el.querySelector(".algolassi-google-error"); if (old) old.remove(); var msg = document.createElement("span"); msg.className = "algolassi-google-error"; msg.style.cssText = "font-size:12px;color:#b42318"; msg.textContent = "Google sign-in failed. Please use Sign in with Google."; el.appendChild(msg); } }
  }
  async function initGoogleOneTap() {
    if (window.location.pathname !== "/") return;
    if (!window.google || !window.google.accounts || !window.google.accounts.id) return;
    if (supabaseClient) {
      var sessionResult = await supabaseClient.auth.getSession();
      if (sessionResult.data && sessionResult.data.session && sessionResult.data.session.user) {
        if (window.google.accounts.id.cancel) window.google.accounts.id.cancel();
        return;
      }
    }
    nonce = randomNonce(); var hashedNonce = await sha256(nonce); window.google.accounts.id.initialize({ client_id: CLIENT_ID, nonce: hashedNonce, callback: function (response) { signInWithGoogleToken(response.credential); }, auto_select: false, cancel_on_tap_outside: false, use_fedcm_for_prompt: true }); window.google.accounts.id.prompt();
  }
  function init() { ensureContainer(); import(SUPABASE_JS).then(function (module) { supabaseClient = window.AlgolassiChatSupabase || window.AlgolassiSupabase || module.createClient(SUPABASE_URL, SUPABASE_KEY); window.AlgolassiSupabase = supabaseClient; return supabaseClient.auth.getSession(); }).then(function (result) { if (result.data && result.data.session && result.data.session.user) renderSignedIn(result.data.session.user); else renderSignedOut(); supabaseClient.auth.onAuthStateChange(function (_event, session) { if (session && session.user) renderSignedIn(session.user); else renderSignedOut(); }); return loadScript("https://accounts.google.com/gsi/client"); }).then(function () { return initGoogleOneTap(); }).catch(function (error) { console.error("Algolassi Google authentication initialization failed:", error); renderSignedOut(); }); }
  window.AlgolassiGoogleAuthInit = init;
  window.AlgolassiGetGoogleDisplayName = getDisplayName;
  window.AlgolassiGetUsername = getUsername;
  window.AlgolassiRefreshUsername = async function (user) { if (user && user.id) delete profileCache[user.id]; if (user) await renderSignedIn(user); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
