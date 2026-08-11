/* Algolassi MAUI Hybrid playground - isolated Razor compatibility renderer */
(function () {
  "use strict";

  var affected = {
    "blazor-hybrid-architecture": true,
    "maui-dependency-injection": true,
    "razor-code": true,
    "radzen-button": true,
    "razor-two-buttons": true
  };

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function demoId() {
    return (new URLSearchParams(window.location.search || "").get("demo") || "").toLowerCase();
  }

  function attrs(text) {
    var result = {};
    var re = /([:@\w.-]+)\s*=\s*["']([^"']*)["']/g;
    var match;
    while ((match = re.exec(text || ""))) result[match[1]] = match[2];
    return result;
  }

  function codeBlock(source) {
    var start = source.search(/@code\s*\{/i);
    if (start < 0) return { markup: source, code: "" };
    var open = source.indexOf("{", start);
    var depth = 0;
    var quote = null;
    for (var i = open; i < source.length; i++) {
      var ch = source[i];
      if (quote) {
        if (ch === quote && source[i - 1] !== "\\") quote = null;
        continue;
      }
      if (ch === '"' || ch === "'") { quote = ch; continue; }
      if (ch === "{") depth++;
      if (ch === "}" && --depth === 0) {
        return { markup: source.slice(0, start) + source.slice(i + 1), code: source.slice(open + 1, i) };
      }
    }
    return { markup: source, code: "" };
  }

  function literal(value, state) {
    var v = String(value || "").trim().replace(/;$/, "");
    if (v === "true") return true;
    if (v === "false") return false;
    if (v === "null") return null;
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    if ((v[0] === '"' && v[v.length - 1] === '"') || (v[0] === "'" && v[v.length - 1] === "'")) return v.slice(1, -1);
    if (Object.prototype.hasOwnProperty.call(state, v)) return state[v];
    var parts = v.split(/\s*\+\s*/);
    if (parts.length > 1) {
      var values = parts.map(function (part) { return literal(part, state); });
      return values.some(function (x) { return typeof x === "string"; }) ? values.join("") : values.reduce(function (a, b) { return Number(a || 0) + Number(b || 0); }, 0);
    }
    return v;
  }

  function initialState(code) {
    var state = {};
    var match;
    var fields = /\b(?:private|public|protected|internal)?\s*(?:readonly\s+)?([\w<>?]+)\s+(\w+)\s*=\s*([^;]+);/g;
    while ((match = fields.exec(code))) state[match[2]] = literal(match[3], state);
    var properties = /\b(?:private|public|protected|internal)?\s*([\w<>?]+)\s+(\w+)\s*\{\s*get\s*;\s*set\s*;\s*\}/g;
    while ((match = properties.exec(code))) if (!(match[2] in state)) state[match[2]] = "";
    return state;
  }

  function methodBody(code, name) {
    var safe = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    var block = new RegExp("(?:private|public|protected|internal)?\\s*(?:async\\s+)?(?:Task(?:<[^>]+>)?|void|[\\w<>?]+)\\s+" + safe + "\\s*\\([^)]*\\)\\s*\\{", "m").exec(code);
    if (block) {
      var open = code.indexOf("{", block.index);
      var depth = 0;
      for (var i = open; i < code.length; i++) {
        if (code[i] === "{") depth++;
        if (code[i] === "}" && --depth === 0) return code.slice(open + 1, i);
      }
    }
    var expression = new RegExp("(?:private|public|protected|internal)?\\s*(?:async\\s+)?(?:void|[\\w<>?]+)\\s+" + safe + "\\s*\\([^)]*\\)\\s*=>\\s*([^;]+);", "m").exec(code);
    return expression ? expression[1] : null;
  }

  function execute(code, name, state) {
    name = String(name || "").trim();
    if (!name) return;
    var expression = name.match(/^\(.*?\)\s*=>\s*(.+)$/);
    var body = expression ? expression[1] : methodBody(code, name);
    if (!body) return;
    var statements = body.match(/(?:this\.)?\w+\s*(?:\+\+|--|\+=|-=|=)\s*[^;]*(?:;|$)/g) || [];
    statements.forEach(function (statement) {
      statement = statement.replace(/;$/, "").trim();
      var match = statement.match(/^(?:this\.)?(\w+)\s*(\+\+|--)$/);
      if (match) { state[match[1]] = Number(state[match[1]] || 0) + (match[2] === "++" ? 1 : -1); return; }
      match = statement.match(/^(?:this\.)?(\w+)\s*(\+=|-=)\s*(.+)$/);
      if (match) { var n = Number(literal(match[3], state) || 0); state[match[1]] = Number(state[match[1]] || 0) + (match[2] === "+=" ? n : -n); return; }
      match = statement.match(/^(?:this\.)?(\w+)\s*=\s*(.+)$/);
      if (match) state[match[1]] = literal(match[2], state);
    });
  }

  function interpolate(text, state) {
    return text.replace(/@([A-Za-z_]\w*)/g, function (_, key) {
      return Object.prototype.hasOwnProperty.call(state, key) ? esc(state[key]) : "@" + key;
    });
  }

  function render() {
    if (!affected[demoId()]) return;
    var editor = document.getElementById("maui-code-editor");
    var preview = document.getElementById("maui-browser-preview");
    if (!editor || !preview) return;
    var content = preview.querySelector(".maui-browser-content");
    if (!content) return;

    var source = editor.value || "";
    var block = codeBlock(source);
    var state = initialState(block.code);
    var markup = block.markup
      .replace(/@page\s+["'][^"']+["']/gi, "")
      .replace(/@using\s+[^\r\n]+/gi, "")
      .trim();

    markup = markup.replace(/<(RadzenButton|MudButton)\b([^>]*)\/>/gi, function (_, tag, raw) {
      var a = attrs(raw);
      var action = a["@onclick"] || a.onclick || a.OnClick || "";
      var text = a.Text || "";
      return '<button type="button" class="playground-compat-button" data-compat-click="' + esc(action) + '">' + esc(text || tag) + '</button>';
    });

    markup = markup.replace(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi, function (_, raw, inner) {
      var a = attrs(raw);
      var action = a["@onclick"] || a.onclick || "";
      var clean = raw.replace(/\s+@onclick\s*=\s*["'][^"']*["']/i, "").replace(/\s+onclick\s*=\s*["'][^"']*["']/i, "");
      return '<button type="button"' + clean + (action ? ' data-compat-click="' + esc(action) + '"' : "") + '>' + inner + '</button>';
    });

    markup = markup.replace(/<input\b([^>]*)>/gi, function (_, raw) {
      var a = attrs(raw);
      var bind = a["@bind"] || a["@bind-value"] || "";
      var clean = raw.replace(/\s+@bind(?:-value)?\s*=\s*["'][^"']*["']/i, "");
      if (bind && Object.prototype.hasOwnProperty.call(state, bind)) clean += ' value="' + esc(state[bind]) + '" data-compat-bind="' + esc(bind) + '"';
      return '<input' + clean + '>';
    });

    markup = interpolate(markup, state);
    markup = markup.replace(/\bdata-compat-click="([^"]*)"/g, function (_, value) { return 'data-compat-click="' + esc(value) + '"'; });
    content.innerHTML = '<div class="maui-razor-compat">' + markup + '</div>';

    content.querySelectorAll("[data-compat-click]").forEach(function (button) {
      button.addEventListener("click", function () {
        execute(block.code, button.getAttribute("data-compat-click"), state);
        renderWithState(block.markup, block.code, state, content);
      });
    });

    content.querySelectorAll("[data-compat-bind]").forEach(function (input) {
      input.addEventListener("input", function () {
        state[input.getAttribute("data-compat-bind")] = input.value;
        renderWithState(block.markup, block.code, state, content);
      });
    });
  }

  function renderWithState(rawMarkup, code, state, content) {
    var markup = rawMarkup
      .replace(/@page\s+["'][^"']+["']/gi, "")
      .replace(/@using\s+[^\r\n]+/gi, "")
      .trim();
    markup = markup.replace(/<(RadzenButton|MudButton)\b([^>]*)\/>/gi, function (_, tag, raw) {
      var a = attrs(raw); var action = a["@onclick"] || a.onclick || a.OnClick || "";
      return '<button type="button" class="playground-compat-button" data-compat-click="' + esc(action) + '">' + esc(a.Text || tag) + '</button>';
    });
    markup = markup.replace(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi, function (_, raw, inner) {
      var a = attrs(raw); var action = a["@onclick"] || a.onclick || "";
      var clean = raw.replace(/\s+@onclick\s*=\s*["'][^"']*["']/i, "").replace(/\s+onclick\s*=\s*["'][^"']*["']/i, "");
      return '<button type="button"' + clean + (action ? ' data-compat-click="' + esc(action) + '"' : "") + '>' + inner + '</button>';
    });
    markup = interpolate(markup, state);
    content.innerHTML = '<div class="maui-razor-compat">' + markup + '</div>';
    content.querySelectorAll("[data-compat-click]").forEach(function (button) {
      button.addEventListener("click", function () {
        execute(code, button.getAttribute("data-compat-click"), state);
        renderWithState(rawMarkup, code, state, content);
      });
    });
  }

  function install() {
    if (!affected[demoId()]) return;
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      var editor = document.getElementById("maui-code-editor");
      var run = document.getElementById("maui-run-preview");
      if (editor && run) {
        if (!run.dataset.razorCompatInstalled) {
          run.dataset.razorCompatInstalled = "1";
          run.addEventListener("click", function () { setTimeout(render, 0); });
        }
        if (editor.value) { render(); clearInterval(timer); }
      }
      if (tries > 120) clearInterval(timer);
    }, 100);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
  else install();
  window.addEventListener("algolassi:spa-navigation", install);
})();
