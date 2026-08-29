(function () {
  "use strict";

  var STORAGE_KEY = "algolassi_developer_tool_history_v1";
  var MAX_ENTRIES = 100;
  var MAX_FIELD_LENGTH = 16000;
  var initialized = false;
  var renderTimer = null;
  var styleInstalled = false;
  var panelOpen = false;

  function installStyle() {
    if (styleInstalled || document.getElementById("algolassi-tool-history-style")) return;
    styleInstalled = true;
    var style = document.createElement("style");
    style.id = "algolassi-tool-history-style";
    style.textContent = [
      ".algolassi-tool-history-wrap{margin:.35rem 0 1rem}",
      ".algolassi-tool-history-button{display:inline-flex;align-items:center;gap:.35rem;padding:.55rem .8rem;border:1px solid var(--border-color,#cbd5e1);border-radius:8px;text-decoration:none;color:inherit;background:var(--card-bg,#fff);font-weight:600;cursor:pointer}",
      ".algolassi-tool-history-button:hover{background:var(--code-bg,#f6f8fa)}",
      "html[data-theme=\\\"dark\\\"] .algolassi-tool-history-button{background:var(--card-bg,#111827)}",
      ".algolassi-tool-history-panel{display:none;border:1px solid var(--border-color,#d8dee4);border-radius:12px;background:var(--card-bg,#fff);margin:0 0 1rem;overflow:hidden}",
      ".algolassi-tool-history-panel.open{display:block}",
      "html[data-theme=\\\"dark\\\"] .algolassi-tool-history-panel{background:var(--card-bg,#111827)}",
      ".althp-head{display:flex;align-items:center;justify-content:space-between;gap:.75rem;padding:.7rem .85rem;border-bottom:1px solid var(--border-color,#d8dee4)}",
      ".althp-head strong{font-size:.95rem}",
      ".althp-head-actions{display:flex;gap:.4rem;align-items:center}",
      ".althp-small{padding:.35rem .55rem;border:1px solid var(--border-color,#cbd5e1);border-radius:7px;background:transparent;color:inherit;cursor:pointer;font-size:.82rem}",
      ".althp-list{max-height:360px;overflow:auto}",
      ".althp-empty{padding:1rem;color:var(--muted,#667085)}",
      ".althp-item{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid var(--border-color,#e5e7eb);background:transparent;color:inherit;padding:.72rem .85rem;cursor:pointer}",
      ".althp-item:last-child{border-bottom:0}",
      ".althp-item:hover{background:var(--code-bg,#f6f8fa)}",
      ".althp-item-meta{display:flex;justify-content:space-between;gap:.75rem;font-size:.78rem;color:var(--muted,#667085);margin-bottom:.25rem}",
      ".althp-item-operation{font-weight:700;font-size:.86rem;margin-bottom:.2rem}",
      ".althp-item-preview{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.88}",
      ".althp-note{padding:.55rem .85rem;font-size:.74rem;color:var(--muted,#667085);border-top:1px solid var(--border-color,#e5e7eb)}",
      ".althp-danger{color:#b91c1c}",
      "@media(max-width:700px){.althp-list{max-height:45vh}.althp-item{padding:.65rem .75rem}.althp-item-preview{font-size:.74rem}.althp-head{padding:.65rem .75rem}}"
    ].join("");
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
    refreshPanel();
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

  function preview(entry) {
    var values = entry.input || [];
    for (var i = 0; i < values.length; i++) {
      if (values[i] && values[i].value) {
        var text = String(values[i].value).replace(/\s+/g, " ").trim();
        return text.length > 160 ? text.slice(0, 160) + "…" : text;
      }
    }
    if (entry.output) {
      var result = String(entry.output).replace(/\s+/g, " ").trim();
      return result.length > 160 ? result.slice(0, 160) + "…" : result;
    }
    return "No text input captured";
  }

  function restoreEntry(entry) {
    if (!entry || !isToolPage()) return;

    var fields = entry.input || [];
    fields.forEach(function (saved) {
      var node = saved.id ? document.getElementById(saved.id) : null;
      if (!node && saved.name) node = document.querySelector('.dt [name="' + CSS.escape(saved.name) + '"]');
      if (!node) return;
      node.value = saved.value == null ? "" : saved.value;
      node.dispatchEvent(new Event("input", { bubbles: true }));
      node.dispatchEvent(new Event("change", { bubbles: true }));
    });

    var output = document.getElementById("output") || document.querySelector(".dt pre.out, .dt .out");
    if (output) {
      output.textContent = entry.output || "";
      output.classList.remove("err");
    }

    // Keep the history panel open. Users can close it explicitly.
    refreshPanel();

    var box = document.querySelector(".dt .box");
    if (box) {
      var currentScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      var boxTop = box.getBoundingClientRect().top + currentScroll;
      var targetScroll = currentScroll + ((boxTop - currentScroll) / 2);
      window.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
    }
  }

  function renderPanel() {
    var panel = document.getElementById("algolassi-tool-history-panel");
    if (!panel || !isToolPage()) return;

    var history = readHistory().filter(function (entry) {
      return entry && entry.url === window.location.pathname;
    });

    panel.classList.toggle("open", panelOpen);
    panel.setAttribute("aria-hidden", panelOpen ? "false" : "true");

    var list = panel.querySelector(".althp-list");
    if (!list) return;

    if (!history.length) {
      list.innerHTML = '<div class="althp-empty">No history for this tool yet.</div>';
      return;
    }

    list.innerHTML = history.map(function (entry) {
      return '<button type="button" class="althp-item" data-history-id="' + escapeHtml(entry.id) + '">' +
        '<div class="althp-item-meta"><span>' + escapeHtml(formatTime(entry.timestamp)) + '</span></div>' +
        '<div class="althp-item-operation">' + escapeHtml(entry.operation || "Operation") + '</div>' +
        '<div class="althp-item-preview" title="' + escapeHtml(preview(entry)) + '">' + escapeHtml(preview(entry)) + '</div>' +
        '</button>';
    }).join("");

    list.querySelectorAll("[data-history-id]").forEach(function (button) {
      button.addEventListener("click", function () {
        var id = button.getAttribute("data-history-id");
        var entry = readHistory().find(function (item) { return item.id === id; });
        restoreEntry(entry);
      });
    });
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
    wrap.innerHTML = '<button type="button" id="algolassi-tool-history-button" class="algolassi-tool-history-button" aria-expanded="false" aria-controls="algolassi-tool-history-panel">↺ History</button>' +
      '<div id="algolassi-tool-history-panel" class="algolassi-tool-history-panel" aria-hidden="true">' +
      '<div class="althp-head"><strong>History</strong><div class="althp-head-actions"><button type="button" class="althp-small althp-clear">Clear</button><button type="button" class="althp-small althp-close" aria-label="Close history">×</button></div></div>' +
      '<div class="althp-list"></div><div class="althp-note">Stored only in this browser. Tap an entry to restore its saved input and result.</div></div>';
    heading.insertAdjacentElement("afterend", wrap);

    var button = wrap.querySelector("#algolassi-tool-history-button");
    var clear = wrap.querySelector(".althp-clear");
    var close = wrap.querySelector(".althp-close");

    button.addEventListener("click", function () {
      panelOpen = !panelOpen;
      button.setAttribute("aria-expanded", panelOpen ? "true" : "false");
      refreshPanel();
    });

    close.addEventListener("click", function () {
      panelOpen = false;
      button.setAttribute("aria-expanded", "false");
      refreshPanel();
    });

    clear.addEventListener("click", function () {
      var current = readHistory().filter(function (entry) { return entry.url !== window.location.pathname; });
      writeHistory(current);
      refreshPanel();
    });
  }

  function refreshPanel() {
    addHistoryButton();
    renderPanel();
    renderHistoryPage();
    var button = document.getElementById("algolassi-tool-history-button");
    if (button) button.setAttribute("aria-expanded", panelOpen ? "true" : "false");
  }

  function scheduleRender() {
    if (renderTimer) window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(function () {
      installStyle();
      panelOpen = false;
      refreshPanel();
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
      window.setTimeout(function () {
        addEntry((button.textContent || "Operation").trim());
      }, 60);
    });

    window.addEventListener("algolassi:spa-navigation", scheduleRender);
    window.addEventListener("storage", function (event) {
      if (event.key === STORAGE_KEY) {
        refreshPanel();
      }
    });

    scheduleRender();
  }

  window.AlgolassiToolHistory = {
    getAll: readHistory,
    add: addEntry,
    clear: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (error) {}
      refreshPanel();
    },
    render: refreshPanel
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
