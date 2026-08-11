/* Algolassi Community - Phase 3A: username */
(function () {
  "use strict";
  var SUPABASE_URL = "https://ashezapnoqslggtxcncj.supabase.co";
  var SUPABASE_KEY = "sb_publishable_ki4D3v_JZk4elETfkYtmGA_xWDtbpBg";
  var client = null, user = null, profile = null, initialized = false;

  function esc(v) { return String(v || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;"); }
  function ensureUi() {
    var host = document.getElementById("algolassi-username-host");
    if (host) return host;
    host = document.createElement("div");
    host.id = "algolassi-username-host";
    host.innerHTML = '<div class="algolassi-username-backdrop"></div><section class="algolassi-username-toast" role="dialog" aria-modal="false" aria-labelledby="algolassi-username-title"><button type="button" class="algolassi-username-close" aria-label="Close">×</button><div class="algolassi-username-icon">👤</div><h3 id="algolassi-username-title">Set your Algolassi username</h3><p class="algolassi-username-help">Choose the name other users will see in the community chat.</p><div class="algolassi-username-row"><input id="algolassi-username-input" maxlength="24" autocomplete="off" spellcheck="false" placeholder="e.g. DhilipCoder"><button type="button" id="algolassi-username-set">Set</button></div><div id="algolassi-username-check" class="algolassi-username-check" aria-live="polite">Auto checking availability...</div></section>';
    document.body.appendChild(host);
    host.querySelector(".algolassi-username-close").addEventListener("click", function () { host.classList.remove("is-visible"); });
    host.querySelector(".algolassi-username-backdrop").addEventListener("click", function () { host.classList.remove("is-visible"); });
    host.querySelector("#algolassi-username-input").addEventListener("input", checkAvailability);
    host.querySelector("#algolassi-username-set").addEventListener("click", saveUsername);
    return host;
  }
  function show() { var host = ensureUi(); host.classList.add("is-visible"); var input = document.getElementById("algolassi-username-input"); if (profile && profile.username) input.value = profile.username; setTimeout(function () { if (input) input.focus(); checkAvailability(); }, 50); }
  function checkAvailability() {
    var input = document.getElementById("algolassi-username-input"), check = document.getElementById("algolassi-username-check");
    if (!input || !check) return;
    var name = input.value.trim();
    if (!/^[A-Za-z0-9_]{3,24}$/.test(name)) { check.textContent = name ? "Use 3–24 letters, numbers, or underscores." : "Auto checking availability..."; check.className = "algolassi-username-check is-invalid"; return; }
    check.textContent = "Checking availability..."; check.className = "algolassi-username-check is-checking";
    if (!client) return;
    client.from("profiles").select("user_id").eq("username", name).maybeSingle().then(function (result) {
      if (result.error) throw result.error;
      var takenByOther = result.data && (!user || result.data.user_id !== user.id);
      check.textContent = takenByOther ? "Username is already taken." : "Username is available ✓";
      check.className = "algolassi-username-check " + (takenByOther ? "is-invalid" : "is-available");
    }).catch(function (error) { console.error("Algolassi username availability:", error); check.textContent = "Could not check availability. Please try again."; check.className = "algolassi-username-check is-invalid"; });
  }
  function saveUsername() {
    var input = document.getElementById("algolassi-username-input"), check = document.getElementById("algolassi-username-check"), button = document.getElementById("algolassi-username-set");
    if (!input || !user) return;
    var name = input.value.trim();
    if (!/^[A-Za-z0-9_]{3,24}$/.test(name)) { check.textContent = "Use 3–24 letters, numbers, or underscores."; return; }
    button.disabled = true; check.textContent = "Saving username...";
    client.from("profiles").upsert({ user_id: user.id, username: name }, { onConflict: "user_id" }).select("user_id,username,reputation,created_at,updated_at").single().then(function (result) {
      if (result.error) {
        if (result.error.code === "23505") throw new Error("That username is already taken.");
        throw result.error;
      }
      profile = result.data;
      check.textContent = "Username saved ✓"; check.className = "algolassi-username-check is-available";
      window.dispatchEvent(new CustomEvent("algolassi:username-changed", { detail: { profile: profile } }));
      setTimeout(function () { var host = document.getElementById("algolassi-username-host"); if (host) host.classList.remove("is-visible"); }, 650);
    }).catch(function (error) { console.error("Algolassi username save:", error); check.textContent = error.message || "Username could not be saved."; check.className = "algolassi-username-check is-invalid"; }).finally(function () { button.disabled = false; });
  }
  function loadForUser(nextUser) {
    user = nextUser || null;
    if (!user || !client) return;
    client.from("profiles").select("user_id,username,reputation,created_at,updated_at").eq("user_id", user.id).maybeSingle().then(function (result) {
      if (result.error) throw result.error;
      profile = result.data || null;
      if (!profile || !profile.username) show();
      window.dispatchEvent(new CustomEvent("algolassi:username-loaded", { detail: { profile: profile, user: user } }));
    }).catch(function (error) { console.error("Algolassi profile load:", error); });
  }
  function start() {
    if (initialized) return; initialized = true; ensureUi();
    var useExisting = window.AlgolassiChatSupabase;
    if (useExisting) { client = useExisting; loadCurrent(); }
    else import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm").then(function (module) { client = module.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }); loadCurrent(); }).catch(function (e) { console.error("Algolassi username initialization:", e); });
    window.addEventListener("algolassi:auth-changed", function (event) { loadForUser(event && event.detail ? event.detail.user : null); });
    window.addEventListener("algolassi:spa-navigation", function () { if (user && (!profile || !profile.username)) setTimeout(show, 200); });
  }
  function loadCurrent() { client.auth.getUser().then(function (result) { loadForUser(result.data && result.data.user ? result.data.user : null); }).catch(function () {}); }
  window.AlgolassiUsernameInit = start;
  window.AlgolassiUsernameGet = function () { return profile; };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true }); else start();
})();
