/* Algolassi Tutorial Quiz - 11.0 */
(function () {
  "use strict";

  var STORAGE_KEY = "algolassi_tutorial_quiz_v1";
  var ACTIVE_TICK_MS = 1000;
  var QUIZ_INTERVAL_MS = 90 * 1000;
  var MIN_ADDITIONAL_COVERAGE = 0.12;
  var SKIP_COOLDOWN_MS = 5 * 60 * 1000;
  var MIN_BLOCK_COVERAGE = 0.72;
  var REWARD = 1;
  var state = loadState();
  var currentKey = "";
  var currentQuestion = null;
  var host = null;
  var active = document.visibilityState !== "hidden";
  var lastTick = Date.now();

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return Object.assign({ pages: {} }, parsed);
    } catch (e) {
      return { pages: {} };
    }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function pageState(key) {
    if (!state.pages[key]) state.pages[key] = {
      ranges: [],
      lastPromptAt: 0,
      lastCoverageAtPrompt: 0,
      skippedUntil: 0,
      completed: {},
      quizCount: 0
    };
    return state.pages[key];
  }

  function isTutorialPage() {
    var path = window.location.pathname || "/";
    if (/^\/developer-tools(?:\/|$)/.test(path)) return false;
    return !!document.querySelector(".article-content pre code, .page-content pre code");
  }

  function pageKey() {
    return window.location.pathname + window.location.search;
  }

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function addRange(ranges, start, end) {
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return ranges;
    start = Math.max(0, start);
    var merged = [], inserted = false;
    for (var i = 0; i < ranges.length; i++) {
      var r = ranges[i];
      if (r[1] < start) {
        merged.push(r);
      } else if (end < r[0]) {
        if (!inserted) { merged.push([start, end]); inserted = true; }
        merged.push(r);
      } else {
        start = Math.min(start, r[0]);
        end = Math.max(end, r[1]);
      }
    }
    if (!inserted) merged.push([start, end]);
    return merged;
  }

  function rangeCovered(start, end, ranges) {
    if (end <= start) return 0;
    var covered = 0;
    ranges.forEach(function (r) {
      var a = Math.max(start, r[0]);
      var b = Math.min(end, r[1]);
      if (b > a) covered += b - a;
    });
    return covered / (end - start);
  }

  function totalCoverage(ranges) {
    return ranges.reduce(function (sum, r) { return sum + Math.max(0, r[1] - r[0]); }, 0);
  }

  function documentViewportRange() {
    var y = window.scrollY || window.pageYOffset || 0;
    var h = window.innerHeight || document.documentElement.clientHeight || 0;
    return [y, y + h];
  }

  function recordViewport() {
    if (!currentKey || !active) return;
    var ps = pageState(currentKey);
    var range = documentViewportRange();
    ps.ranges = addRange(ps.ranges, range[0], range[1]);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function normalizeAnswer(value) {
    return String(value == null ? "" : value).trim();
  }

  function codeCandidates() {
    return Array.prototype.slice.call(document.querySelectorAll(".article-content pre code, .page-content pre code"))
      .map(function (code, index) {
        var pre = code.closest ? code.closest("pre") : code.parentElement;
        if (!pre) return null;
        var text = String(code.textContent || "");
        var rect = pre.getBoundingClientRect();
        var top = rect.top + (window.scrollY || 0);
        var bottom = top + rect.height;
        return { code: code, pre: pre, text: text, top: top, bottom: bottom, index: index };
      })
      .filter(Boolean);
  }

  function makeQuestionFromLine(line) {
    var original = String(line || "").replace(/\s+$/g, "");
    if (!original || /^\s*(\/\/|#|\/\*|\*|<!--)/.test(original)) return null;

    var match = original.match(/Console\.([A-Za-z_][A-Za-z0-9_]*)/);
    if (match) {
      var method = match[1];
      if (/^(WriteLine|ReadLine)$/.test(method)) {
        var suffix = "Line";
        var prefix = method.slice(0, -suffix.length);
        if (prefix) {
          var idx = original.indexOf(match[0]) + "Console.".length;
          var start = idx;
          var end = idx + prefix.length;
          return {
            display: original.slice(0, start) + "_____" + original.slice(end),
            answer: prefix,
            source: original
          };
        }
      }
    }

    var call = original.match(/\.([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
    if (call && call[1].length >= 4) {
      var token = call[1];
      var suffixMatch = token.match(/([A-Z][A-Za-z0-9_]*)$/);
      var suffix = suffixMatch && suffixMatch[1] !== token ? suffixMatch[1] : "";
      var prefix = suffix ? token.slice(0, token.length - suffix.length) : "";
      if (prefix.length >= 2) {
        var start2 = original.indexOf("." + token) + 1;
        return {
          display: original.slice(0, start2) + "_____" + original.slice(start2 + prefix.length),
          answer: prefix,
          source: original
        };
      }
    }

    var words = original.match(/\b[A-Za-z_][A-Za-z0-9_]{3,}\b/g);
    if (words) {
      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        if (/^(using|namespace|public|private|protected|static|class|void|string|int|var|return|new|true|false|null|async|await|Task)$/.test(w)) continue;
        if (!/[A-Z_]/.test(w)) continue;
        var pos = original.indexOf(w);
        return {
          display: original.slice(0, pos) + "_____" + original.slice(pos + w.length),
          answer: w,
          source: original
        };
      }
    }
    return null;
  }

  function generateQuestion() {
    var ps = pageState(currentKey);
    var candidates = codeCandidates();
    var eligible = [];
    candidates.forEach(function (item) {
      var coverage = rangeCovered(item.top, item.bottom, ps.ranges);
      if (coverage < MIN_BLOCK_COVERAGE) return;
      var lines = item.text.replace(/\r/g, "").split("\n");
      lines.forEach(function (line, lineIndex) {
        var q = makeQuestionFromLine(line);
        if (!q) return;
        var quizId = simpleHash(window.location.pathname + "|" + item.index + "|" + lineIndex + "|" + q.answer);
        if (ps.completed[quizId]) return;
        eligible.push(Object.assign(q, {
          id: quizId,
          blockIndex: item.index,
          lineIndex: lineIndex,
          code: item.text
        }));
      });
    });
    if (!eligible.length) return null;
    eligible.sort(function () { return Math.random() - 0.5; });
    return eligible[0];
  }

  function simpleHash(value) {
    var hash = 2166136261;
    for (var i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  }

  function ensureHost() {
    if (host && document.body.contains(host)) return host;
    host = document.createElement("div");
    host.id = "algolassi-tutorial-quiz-host";
    host.setAttribute("aria-live", "polite");
    document.body.appendChild(host);
    return host;
  }

  function getReputationProfile() {
    try {
      if (window.AlgolassiUsernameGet) return window.AlgolassiUsernameGet() || null;
    } catch (e) {}
    return null;
  }

  function updateHeaderReputation(value) {
    var el = document.querySelector(".algolassi-auth-username");
    if (!el) return;
    var rep = el.querySelector(".algolassi-auth-reputation");
    if (!rep) {
      rep = document.createElement("span");
      rep.className = "algolassi-auth-reputation";
      el.appendChild(rep);
    }
    rep.textContent = "⭐ " + String(Number(value) || 0);
  }

  async function getSharedClient() {
    if (window.AlgolassiSupabase) return window.AlgolassiSupabase;
    if (window.AlgolassiSupabasePromise) return window.AlgolassiSupabasePromise;
    var url = "https://ashezapnoqslggtxcncj.supabase.co";
    var key = "sb_publishable_ki4D3v_JZk4elETfkYtmGA_xWDtbpBg";
    var module = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    if (!window.AlgolassiSupabase) {
      window.AlgolassiSupabase = module.createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    }
    return window.AlgolassiSupabase;
  }

  async function refreshHeaderReputation() {
    try {
      var client = await getSharedClient();
      var auth = await client.auth.getUser();
      var user = auth.data && auth.data.user;
      if (!user) return;
      var result = await client.from("profiles").select("reputation").eq("user_id", user.id).maybeSingle();
      if (result.error) throw result.error;
      updateHeaderReputation(result.data && result.data.reputation);
    } catch (e) {
      console.warn("Algolassi quiz reputation UI:", e);
    }
  }

  async function awardReputation(quizId) {
    var client = await getSharedClient();
    var result = await client.rpc("award_tutorial_quiz_reputation", {
      p_quiz_key: quizId,
      p_points: REWARD
    });
    if (result.error) throw result.error;
    var data = Array.isArray(result.data) ? result.data[0] : result.data;
    if (data && data.reputation != null) updateHeaderReputation(data.reputation);
    return data || {};
  }

  function renderQuiz(question) {
    currentQuestion = question;
    var root = ensureHost();
    root.innerHTML =
      '<section class="algolassi-tutorial-quiz" role="dialog" aria-label="Tutorial code quiz">' +
      '<span class="algolassi-tutorial-quiz-avatar" aria-hidden="true">🤖</span>' +
      '<span class="algolassi-tutorial-quiz-prompt">Fill the missing code:</span>' +
      '<code class="algolassi-tutorial-quiz-code">' + escapeHtml(question.display) + '</code>' +
      '<input class="algolassi-tutorial-quiz-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Your answer" placeholder="answer">' +
      '<button type="button" class="algolassi-tutorial-quiz-button">Check</button>' +
      '<button type="button" class="algolassi-tutorial-quiz-skip">Skip (no benefits)</button>' +
      '<span class="algolassi-tutorial-quiz-result" aria-live="polite"></span>' +
      '</section>';

    var quiz = root.querySelector(".algolassi-tutorial-quiz");
    var input = root.querySelector(".algolassi-tutorial-quiz-input");
    var check = root.querySelector(".algolassi-tutorial-quiz-button");
    var skip = root.querySelector(".algolassi-tutorial-quiz-skip");
    var result = root.querySelector(".algolassi-tutorial-quiz-result");

    function remove() {
      root.classList.remove("is-visible");
      currentQuestion = null;
    }

    function doSkip() {
      var ps = pageState(currentKey);
      ps.skippedUntil = Date.now() + SKIP_COOLDOWN_MS;
      ps.lastPromptAt = Date.now();
      ps.quizCount += 1;
      saveState();
      remove();
    }

    async function doCheck() {
      if (!currentQuestion) return;
      var answer = normalizeAnswer(input.value);
      if (!answer) return;
      check.disabled = true;
      skip.disabled = true;
      if (answer === currentQuestion.answer) {
        quiz.classList.add("is-correct");
        result.className = "algolassi-tutorial-quiz-result is-success";
        result.textContent = "Correct! +" + REWARD + " reputation";
        var ps = pageState(currentKey);
        ps.completed[currentQuestion.id] = true;
        ps.lastPromptAt = Date.now();
        ps.lastCoverageAtPrompt = totalCoverage(ps.ranges);
        ps.quizCount += 1;
        saveState();
        try {
          await awardReputation(currentQuestion.id);
          window.dispatchEvent(new CustomEvent("algolassi:tutorial-quiz-correct", { detail: { quizId: currentQuestion.id, points: REWARD } }));
        } catch (e) {
          result.textContent = "Correct! Sign in to earn reputation.";
          console.error("Algolassi quiz reputation:", e);
        }
        setTimeout(remove, 1400);
      } else {
        result.className = "algolassi-tutorial-quiz-result";
        result.textContent = "Not quite — check the code above.";
        check.disabled = false;
        skip.disabled = false;
      }
    }

    check.addEventListener("click", doCheck);
    skip.addEventListener("click", doSkip);
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") doCheck();
      if (event.key === "Escape") doSkip();
    });

    root.classList.add("is-visible");
    setTimeout(function () { input.focus(); }, 40);
  }

  function maybeQuiz() {
    if (!isTutorialPage() || !currentKey || currentQuestion || !active) return;
    var ps = pageState(currentKey);
    if (ps.skippedUntil > Date.now()) return;
    if (ps.lastPromptAt && Date.now() - ps.lastPromptAt < QUIZ_INTERVAL_MS) return;
    var coverage = totalCoverage(ps.ranges);
    if (coverage < (window.innerHeight || 600) * 1.5) return;
    if (ps.lastCoverageAtPrompt && coverage - ps.lastCoverageAtPrompt < (document.documentElement.scrollHeight || 1) * MIN_ADDITIONAL_COVERAGE) return;
    var question = generateQuestion();
    if (!question) return;
    ps.lastPromptAt = Date.now();
    ps.lastCoverageAtPrompt = coverage;
    saveState();
    renderQuiz(question);
  }

  function tick() {
    var now = Date.now();
    if (active && isTutorialPage()) recordViewport();
    if (active && now - lastTick >= 1000) {
      maybeQuiz();
      lastTick = now;
      saveState();
    }
  }

  function resetForNavigation() {
    if (host) host.classList.remove("is-visible");
    currentQuestion = null;
    currentKey = isTutorialPage() ? pageKey() : "";
    lastTick = Date.now();
    active = document.visibilityState !== "hidden";
    if (currentKey) {
      recordViewport();
      refreshHeaderReputation();
    }
  }

  function init() {
    currentKey = isTutorialPage() ? pageKey() : "";
    if (currentKey) {
      recordViewport();
      refreshHeaderReputation();
    }
    window.addEventListener("scroll", recordViewport, { passive: true });
    window.addEventListener("resize", recordViewport, { passive: true });
    document.addEventListener("visibilitychange", function () {
      active = document.visibilityState !== "hidden";
      if (active) recordViewport();
    });
    window.addEventListener("algolassi:spa-navigation", function () {
      window.requestAnimationFrame(function () {
        setTimeout(resetForNavigation, 80);
      });
    });
    window.addEventListener("algolassi:username-loaded", refreshHeaderReputation);
    window.addEventListener("algolassi:username-changed", refreshHeaderReputation);
    window.setInterval(tick, ACTIVE_TICK_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
