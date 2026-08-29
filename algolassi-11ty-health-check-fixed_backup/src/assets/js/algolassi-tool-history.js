(function () {
  "use strict";

  var STORAGE_KEY = "algolassi_developer_tool_history_v1";
  var MAX_ENTRIES = 100;
  var MAX_FIELD_LENGTH = 16000;
  var initialized = false;
  var renderTimer = null;
  var styleInstalled = false;

  function installStyle() {
    if (styleInstalled || document.getElementById("algolassi-tool-history-style")) return;
    styleInstalled = true;
    var style = document.createElement("style");
    style.id = "algolassi-tool-history-style";
    style.textContent = ".algolassi-tool-history-wrap{margin:.35rem 0 1rem}.algolassi-tool-history-button{display:inline-flex;align-items:center;gap:.35rem;padding:.55rem .8rem;border:1px solid var(--border-color,#cbd5e1);border-radius:8px;text-decoration:none;color:inherit;background:var(--card-bg,#fff);font-weight:600}.algolassi-tool-history-button:hover{background:var(--code-bg,#f6f8fa)}html[data-theme=\"dark\"] .algolassi-tool-history-button{background:var(--card-bg,#111827)}";
    document.head.appendChild(style);
  }

  function readHistory() {
    try {
      var value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function writeHistory(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    } catch (error) {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 20)));
      } catch (ignored) {}
    }
  }

  function trim(value) {
    value = String(value == null ? "" : value);
    return value.length > MAX_FIELD_LENGTH ? value.slice(0, MAX_FIELD_LENGTH) + "\n…[truncated]" : value;
  }

  function getToolTitle() {
    var heading = document.querySelector(".dt h1, .devtools-page h1");
    return heading ? heading.textContent.trim() : document.title.replace(/\s*\|\s*Algolassi.*$/i, "").trim();
  }

  function isToolPage() {
    return /^\/developer-tools\//.test(window.location.pathname) && !/\/developer-tools\/history\/?$/.test(window.location.pathname);
  }

  function isHistoryPage() {
    return /\/developer-tools\/history\/?$/.test(window.location.pathname);
  }

  function snapshotInputs() {
    var nodes = document.querySelectorAll(".dt input:not([type=button]):not([type=submit]):not([type=hidden]), .dt textarea, .dt select");
    var values = [];
    nodes.forEach(function (node) {
      var value = node.value;
      if (!value) return;
      values.push({ id: node.id || "", name: node.name || "", value: trim(value) });
    });
    return values;
  }

  function snapshotOutput() {
    var node = document.getElementById("output");
    if (!node) node = document.querySelector(".dt pre.out, .dt .out");
    return node ? trim(node.textContent || node.innerText || "") : "";
  }

  function addEntry(operation) {
    if (!isToolPage()) return;
    var entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      timestamp: new Date().toISOString(),
      tool: getToolTitle(),
      operation: operation,
      url: window.location.pathname,
      input: snapshotInputs(),
      output: snapshotOutput()
    };
    var history = readHistory();
    history.unshift(entry);
    writeHistory(history);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatTime(iso) {
    try { return new Date(iso).toLocaleString(); }
    catch (error) { return iso; }
  }

  function renderHistoryPage() {
    if (!isHistoryPage()) return;
    var host = document.getElementById("algolassi-tool-history-app");
    if (!host) return;

    var history = readHistory();
    if (!history.length) {
      host.innerHTML = '<div class="alth-empty"><strong>No tool history yet.</strong><p>Run an operation in any Algolassi Developer Tool and it will appear here.</p></div>';
      return;
    }

    host.innerHTML = '<div class="alth-toolbar"><p>' + history.length + ' saved operation' + (history.length === 1 ? '' : 's') + ' · stored only in this browser</p><button type="button" id="alth-clear-all" class="alth-danger">Clear all history</button></div>' +
      history.map(function (entry) {
        var inputs = entry.input && entry.input.length
          ? '<div class="alth-section"><h3>Input</h3>' + entry.input.map(function (item) {
              var label = item.id || item.name || "Value";
              return '<div class="alth-field"><strong>' + escapeHtml(label) + '</strong><pre>' + escapeHtml(item.value) + '</pre></div>';
            }).join("") + '</div>' : '';
        var output = entry.output
          ? '<div class="alth-section"><h3>Result</h3><pre>' + escapeHtml(entry.output) + '</pre></div>'
          : '<div class="alth-section"><h3>Result</h3><p class="alth-muted">No text result captured.</p></div>';
        return '<article class="alth-card" data-history-id="' + escapeHtml(entry.id) + '">' +
          '<div class="alth-card-head"><div><h2>' + escapeHtml(entry.tool) + '</h2><p>' + escapeHtml(entry.operation) + ' · ' + escapeHtml(formatTime(entry.timestamp)) + '</p></div><div class="alth-actions"><a class="alth-link" href="' + escapeHtml(entry.url) + '">Open tool</a><button type="button" class="alth-delete" data-history-delete="' + escapeHtml(entry.id) + '">Delete</button></div></div>' +
          inputs + output + '</article>';
      }).join("");

    var clearButton = document.getElementById("alth-clear-all");
    if (clearButton) clearButton.addEventListener("click", function () {
      if (!window.confirm("Clear all saved Developer Tool history from this browser?")) return;
      try { localStorage.removeItem(STORAGE_KEY); } catch (error) {}
      renderHistoryPage();
    });

    host.querySelectorAll("[data-history-delete]").forEach(function (button) {
      button.addEventListener("click", function () {
        var id = button.getAttribute("data-history-delete");
        writeHistory(readHistory().filter(function (item) { return item.id !== id; }));
        renderHistoryPage();
      });
    });
  }

  function addHistoryButton() {
    if (!/^\/developer-tools(?:\/|$)/.test(window.location.pathname) || isHistoryPage()) return;
    if (document.getElementById("algolassi-tool-history-button")) return;
    var heading = document.querySelector(".dt h1, .devtools-page h1");
    if (!heading) return;
    var wrap = document.createElement("div");
    wrap.className = "algolassi-tool-history-wrap";
    wrap.innerHTML = '<a id="algolassi-tool-history-button" class="algolassi-tool-history-button" href="/developer-tools/history/">↺ History</a>';
    heading.insertAdjacentElement("afterend", wrap);
  }

  function scheduleRender() {
    if (renderTimer) window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(function () {
      installStyle();
      addHistoryButton();
      renderHistoryPage();
    }, 40);
  }

  function operationIsIgnorable(button) {
    var text = (button.textContent || "").trim().toLowerCase();
    return !text || /^(clear|copy|history)(\s|$)/i.test(text) || /copy result/.test(text);
  }

  function start() {
    if (initialized) return;
    initialized = true;
    installStyle();

    document.addEventListener("click", function (event) {
      var button = event.target && event.target.closest ? event.target.closest("button") : null;
      if (!button || operationIsIgnorable(button)) return;
      if (!button.closest(".dt")) return;
      if (!/^\/developer-tools\//.test(window.location.pathname)) return;
      window.setTimeout(function () { addEntry((button.textContent || "Operation").trim()); }, 60);
    });

    window.addEventListener("algolassi:spa-navigation", scheduleRender);
    window.addEventListener("storage", function (event) {
      if (event.key === STORAGE_KEY) renderHistoryPage();
    });
    scheduleRender();
  }

  window.AlgolassiToolHistory = {
    getAll: readHistory,
    add: addEntry,
    clear: function () { try { localStorage.removeItem(STORAGE_KEY); } catch (error) {} renderHistoryPage(); },
    render: renderHistoryPage
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
