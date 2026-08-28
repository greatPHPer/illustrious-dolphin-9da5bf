/* Algolassi T-SQL playground */
(function () {
  "use strict";

  function injectStyles() {
    if (document.getElementById("algolassi-sql-playground-styles")) return;
    var style = document.createElement("style");
    style.id = "algolassi-sql-playground-styles";
    style.textContent = [
      ".algolassi-sql-playground-intro{margin:1.25rem 0;padding:1rem 1.1rem;border:1px solid rgba(100,116,139,.25);border-radius:14px;background:rgba(100,116,139,.06)}",
      ".algolassi-sql-editor{margin:1rem 0 1.35rem;border:1px solid rgba(100,116,139,.28);border-radius:14px;overflow:hidden;background:var(--surface,#fff);box-shadow:0 8px 24px rgba(15,23,42,.07)}",
      ".algolassi-sql-editor-bar{display:flex;align-items:center;justify-content:space-between;gap:.6rem;flex-wrap:wrap;padding:.65rem .8rem;border-bottom:1px solid rgba(100,116,139,.2);background:rgba(100,116,139,.07)}",
      ".algolassi-sql-editor-title{font-weight:700;font-size:.86rem}",
      ".algolassi-sql-editor-actions{display:flex;gap:.4rem;flex-wrap:wrap}",
      ".algolassi-sql-editor-actions button{border:1px solid rgba(100,116,139,.35);background:var(--background,#fff);color:inherit;border-radius:8px;padding:.36rem .62rem;font:inherit;font-size:.78rem;cursor:pointer}",
      ".algolassi-sql-editor-actions button:hover{transform:translateY(-1px)}",
      ".algolassi-sql-editor textarea{display:block;width:100%;min-height:120px;box-sizing:border-box;border:0;resize:vertical;padding:1rem;font:500 .86rem/1.55 ui-monospace,SFMono-Regular,Consolas,'Liberation Mono',monospace;color:inherit;background:transparent;outline:none;tab-size:4}",
      ".algolassi-sql-editor-status{padding:.65rem .8rem;border-top:1px solid rgba(100,116,139,.2);font-size:.8rem;line-height:1.45;white-space:pre-wrap}",
      ".algolassi-sql-editor-status.ok{border-left:4px solid #16a34a}",
      ".algolassi-sql-editor-status.warn{border-left:4px solid #d97706}",
      ".algolassi-sql-editor-status.error{border-left:4px solid #dc2626}",
      ".algolassi-sql-editor-note{padding:.5rem .8rem;font-size:.73rem;opacity:.76;border-top:1px solid rgba(100,116,139,.15)}",
      "@media(max-width:600px){.algolassi-sql-editor-bar{align-items:flex-start}.algolassi-sql-editor-actions{width:100%}.algolassi-sql-editor-actions button{flex:1 1 auto}.algolassi-sql-editor textarea{min-height:150px;font-size:.8rem}}"
    ].join("");
    document.head.appendChild(style);
  }

  function stripForCheck(sql) {
    return sql.replace(/--[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/'(?:''|[^'])*'/g, "'value'").trim();
  }

  function basicCheck(sql) {
    var source = String(sql || "");
    if (!source.trim()) return { type: "error", message: "The editor is empty." };
    var stack = [];
    var inString = false;
    for (var i = 0; i < source.length; i++) {
      var ch = source[i];
      if (ch === "'") {
        if (inString && source[i + 1] === "'") { i++; continue; }
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === "(") stack.push(i);
      if (ch === ")") {
        if (!stack.length) return { type: "error", message: "Unmatched closing parenthesis near character " + (i + 1) + "." };
        stack.pop();
      }
    }
    if (inString) return { type: "error", message: "An SQL string appears to be missing its closing single quote." };
    if (stack.length) return { type: "error", message: "One or more opening parentheses are not closed." };

    var normalized = stripForCheck(source).replace(/\s+/g, " ");
    var statements = normalized.split(";").map(function (x) { return x.trim(); }).filter(Boolean);
    if (!statements.length) return { type: "error", message: "No SQL statement was found." };

    var warnings = [];
    for (var s = 0; s < statements.length; s++) {
      var statement = statements[s];
      var upper = statement.toUpperCase();
      if (/^SELECT\b/.test(upper) && !/\bFROM\b/.test(upper) && !/^SELECT\s+(?:@@VERSION|DB_NAME\s*\(\s*\)|GETDATE\s*\(\s*\)|SYSDATETIME\s*\(\s*\))/i.test(statement)) warnings.push("SELECT usually needs a FROM clause unless it selects a built-in expression or variable.");
      if (/^INSERT\b/.test(upper) && !/^INSERT\s+INTO\b/i.test(statement)) warnings.push("INSERT should normally use the form: INSERT INTO table (...)");
      if (/^UPDATE\b/.test(upper) && !/\bSET\b/.test(upper)) return { type: "error", message: "UPDATE is missing a SET clause." };
      if (/^DELETE\b/.test(upper) && !/^DELETE\s+FROM\b/i.test(statement)) warnings.push("DELETE should normally use the form: DELETE FROM table WHERE ...");
      if (/\bJOIN\b/.test(upper) && !/\bON\b/.test(upper)) return { type: "error", message: "A JOIN statement appears to be missing an ON condition." };
      if (/^CREATE\s+TABLE\b/i.test(statement) && !/\([^)]*\)/.test(statement)) return { type: "error", message: "CREATE TABLE appears to be missing its column definition parentheses." };
      if (/^CREATE\s+DATABASE\b/i.test(statement) && !/^CREATE\s+DATABASE\s+[A-Z0-9_\[\]]+/i.test(statement)) return { type: "error", message: "CREATE DATABASE should include a database name." };
      if (/^USE\b/i.test(statement) && !/^USE\s+[^\s;]+/i.test(statement)) return { type: "error", message: "USE should be followed by a database name." };
    }
    if (/\bUPDATE\b/i.test(normalized) && !/\bWHERE\b/i.test(normalized)) warnings.push("UPDATE has no WHERE clause, so it may affect every matching row. Review it carefully.");
    if (/\bDELETE\s+FROM\b/i.test(normalized) && !/\bWHERE\b/i.test(normalized)) warnings.push("DELETE has no WHERE clause, so it may remove every row from the target table.");
    if (warnings.length) return { type: "warn", message: "Basic T-SQL checks passed, with these warnings:\n- " + warnings.join("\n- ") };
    return { type: "ok", message: "Basic T-SQL checks passed. This is a client-side structural check, not a full SQL Server parser." };
  }

  function copyText(text, button, status) {
    function done() {
      var old = button.textContent;
      button.textContent = "Copied";
      setTimeout(function () { button.textContent = old; }, 1100);
    }
    function fallback() {
      var area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      try { document.execCommand("copy"); done(); } catch (e) { status.textContent = "Copy failed. Select the SQL manually."; }
      area.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback); else fallback();
  }

  function makeEditor(pre, index) {
    var code = pre.querySelector("code");
    if (!code || pre.closest(".algolassi-sql-editor")) return;
    var original = code.textContent.replace(/\n+$/, "");
    var editor = document.createElement("section");
    editor.className = "algolassi-sql-editor";

    var bar = document.createElement("div");
    bar.className = "algolassi-sql-editor-bar";
    var title = document.createElement("div");
    title.className = "algolassi-sql-editor-title";
    title.textContent = "T-SQL playground " + (index + 1);
    var actions = document.createElement("div");
    actions.className = "algolassi-sql-editor-actions";
    function makeButton(label) { var b = document.createElement("button"); b.type = "button"; b.textContent = label; return b; }
    var check = makeButton("Check syntax"), copy = makeButton("Copy"), reset = makeButton("Reset");
    actions.appendChild(check); actions.appendChild(copy); actions.appendChild(reset);
    bar.appendChild(title); bar.appendChild(actions);

    var textarea = document.createElement("textarea");
    textarea.spellcheck = false;
    textarea.value = original;
    textarea.setAttribute("aria-label", "Editable T-SQL example " + (index + 1));
    var status = document.createElement("div");
    status.className = "algolassi-sql-editor-status";
    status.textContent = "Edit the query, then choose Check syntax. SQL is not sent to a server.";
    var note = document.createElement("div");
    note.className = "algolassi-sql-editor-note";
    note.textContent = "Browser-side check • Use SSMS or SQL Server to actually execute the query.";

    editor.appendChild(bar); editor.appendChild(textarea); editor.appendChild(status); editor.appendChild(note); pre.replaceWith(editor);
    check.addEventListener("click", function () { var result = basicCheck(textarea.value); status.className = "algolassi-sql-editor-status " + result.type; status.textContent = result.message; });
    copy.addEventListener("click", function () { copyText(textarea.value, copy, status); });
    reset.addEventListener("click", function () { textarea.value = original; status.className = "algolassi-sql-editor-status"; status.textContent = "Reset to the original example."; });
    textarea.addEventListener("keydown", function (event) {
      if (event.key !== "Tab") return;
      event.preventDefault();
      var start = textarea.selectionStart, end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + "    " + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 4;
    });
  }

  function init(root) {
    root = root || document;
    var page = root.querySelector(".algolassi-sql-playground-page");
    if (!page || page.dataset.sqlPlaygroundReady === "1") return;
    page.dataset.sqlPlaygroundReady = "1";
    injectStyles();
    var intro = document.createElement("div");
    intro.className = "algolassi-sql-playground-intro";
    intro.innerHTML = "<strong>Try the SQL yourself.</strong> Edit any example below and use <em>Check syntax</em> for a lightweight T-SQL structure check. Nothing is sent to a server; use SSMS or SQL Server to execute your final query.";
    page.insertBefore(intro, page.firstElementChild);
    Array.prototype.slice.call(page.querySelectorAll("pre > code")).forEach(function (code, index) {
      var text = code.textContent || "";
      if (/^\s*(?:SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|USE|BEGIN|EXEC|WITH|DECLARE|MERGE|TRUNCATE)\b/i.test(text)) makeEditor(code.parentElement, index);
    });
  }

  document.addEventListener("DOMContentLoaded", function () { init(document); });
  if (document.readyState !== "loading") init(document);
  window.addEventListener("algolassi:spa-navigation", function () { setTimeout(function () { init(document); }, 50); });
  window.AlgolassiSqlPlaygroundInit = function () { init(document); };
})();
