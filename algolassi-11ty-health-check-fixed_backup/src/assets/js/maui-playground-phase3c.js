/* Algolassi MAUI Hybrid playground - Phase 3C component demos */
(function () {
  "use strict";

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function findFileLink(project, file) {
    var roots = document.querySelectorAll(".maui-project-tree > li");
    for (var i = 0; i < roots.length; i++) {
      var strong = roots[i].querySelector(".maui-tree-folder-link strong");
      if (!strong || strong.textContent.trim() !== project) continue;
      var links = roots[i].querySelectorAll(".maui-tree-link");
      for (var j = 0; j < links.length; j++) {
        var text = links[j].textContent.replace(/\s*\*$/, "").trim();
        if (text === "📄 " + file || text === file) return links[j];
      }
    }
    return null;
  }

  function installDemoFiles() {
    var editor = document.getElementById("maui-code-editor");
    var output = document.getElementById("maui-console-output");
    var run = document.getElementById("maui-run-preview");
    if (!editor || !run) return false;

    var link = findFileLink("MyMauiApp.Web.Client", "Home.razor");
    if (!link) return false;

    var code = '@page "/"\n@using Radzen\n@using Radzen.Blazor\n@inject DialogService DialogService\n\n<h1>Radzen Dialog Demo</h1>\n<p>Open a modal dialog from a Razor component using Radzen DialogService.</p>\n\n<RadzenButton Text="Open Dialog" Click="@OpenDialog" />\n\n@code {\n    private async Task OpenDialog()\n    {\n        await DialogService.OpenAsync("Hello", ds => @<div style="padding:20px">\n            <p>This dialog was opened by DialogService.</p>\n            <RadzenButton Text="Close" Click="@(() => ds.Close())" />\n        </div>);\n    }\n}';

    link.click();
    setTimeout(function () {
      editor.value = code;
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      setTimeout(function () {
        run.click();
        if (output) output.textContent = "Demo loaded: Radzen Dialog\n\nDialogService.OpenAsync is simulated in the browser preview.";
        setTimeout(renderDialog, 80);
      }, 120);
    }, 120);
    return true;
  }

  function renderDialog() {
    var preview = document.getElementById("maui-browser-preview");
    if (!preview) return;
    var content = preview.querySelector(".maui-browser-content");
    if (!content) return;

    content.innerHTML = '<div class="p3c-dialog-demo"><h2>Radzen Dialog</h2><p>Interactive browser preview of <code>DialogService.OpenAsync()</code>.</p><button type="button" id="p3c-dialog-open">Open Dialog</button><p id="p3c-dialog-status" class="p3c-dialog-status">No dialog is open.</p><div id="p3c-dialog-overlay" class="p3c-dialog-overlay" hidden><div class="p3c-dialog" role="dialog" aria-modal="true" aria-labelledby="p3c-dialog-title"><div class="p3c-dialog-header"><strong id="p3c-dialog-title">Hello</strong><button type="button" id="p3c-dialog-x" aria-label="Close dialog">×</button></div><div class="p3c-dialog-body"><p>This dialog was opened by <code>DialogService.OpenAsync()</code>.</p><p>You can close it with the button below or the × button.</p></div><div class="p3c-dialog-footer"><button type="button" id="p3c-dialog-close">Close</button></div></div></div></div>';

    addStyles();

    var open = content.querySelector("#p3c-dialog-open");
    var overlay = content.querySelector("#p3c-dialog-overlay");
    var close = content.querySelector("#p3c-dialog-close");
    var closeX = content.querySelector("#p3c-dialog-x");
    var status = content.querySelector("#p3c-dialog-status");

    function closeDialog() {
      overlay.hidden = true;
      status.textContent = "Dialog closed.";
      open.focus();
    }

    open.addEventListener("click", function () {
      overlay.hidden = false;
      status.textContent = "Dialog is open.";
      close.focus();
    });
    close.addEventListener("click", closeDialog);
    closeX.addEventListener("click", closeDialog);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closeDialog();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !overlay.hidden) closeDialog();
    });
  }

  function renderDataGrid() {
    var preview = document.getElementById("maui-browser-preview");
    if (!preview) return;
    var content = preview.querySelector(".maui-browser-content");
    if (!content) return;

    var rows = [
      { id: 1, name: "Anand", department: "Development", city: "Chennai" },
      { id: 2, name: "Bala", department: "QA", city: "Bengaluru" },
      { id: 3, name: "Divya", department: "HR", city: "Chennai" },
      { id: 4, name: "Karthik", department: "Development", city: "Hyderabad" },
      { id: 5, name: "Meena", department: "Support", city: "Coimbatore" },
      { id: 6, name: "Naveen", department: "Development", city: "Chennai" },
      { id: 7, name: "Priya", department: "QA", city: "Madurai" },
      { id: 8, name: "Rahul", department: "Support", city: "Bengaluru" },
      { id: 9, name: "Sanjay", department: "Development", city: "Pune" },
      { id: 10, name: "Swetha", department: "HR", city: "Chennai" },
      { id: 11, name: "Vijay", department: "QA", city: "Hyderabad" },
      { id: 12, name: "Yamini", department: "Support", city: "Coimbatore" }
    ];

    var state = { page: 1, pageSize: 4, sort: null, direction: 1, filter: "" };

    content.innerHTML = '<div class="p3c-grid-demo">' +
      '<h2>Radzen DataGrid</h2>' +
      '<p>Interactive browser preview of <code>&lt;RadzenDataGrid&gt;</code>.</p>' +
      '<div class="p3c-grid-toolbar"><input id="p3c-grid-filter" type="search" placeholder="Filter rows..." aria-label="Filter rows"><span id="p3c-grid-count"></span></div>' +
      '<div class="p3c-grid-wrap"><table class="p3c-grid-table"><thead><tr>' +
      '<th><button type="button" data-sort="id">ID ↕</button></th>' +
      '<th><button type="button" data-sort="name">Name ↕</button></th>' +
      '<th><button type="button" data-sort="department">Department ↕</button></th>' +
      '<th><button type="button" data-sort="city">City ↕</button></th>' +
      '</tr></thead><tbody id="p3c-grid-body"></tbody></table></div>' +
      '<div class="p3c-grid-footer"><span id="p3c-grid-page"></span><div><button type="button" id="p3c-grid-prev">Previous</button><button type="button" id="p3c-grid-next">Next</button></div></div>' +
      '</div>';

    addStyles();

    var filter = content.querySelector("#p3c-grid-filter");
    var body = content.querySelector("#p3c-grid-body");
    var count = content.querySelector("#p3c-grid-count");
    var pageLabel = content.querySelector("#p3c-grid-page");
    var previous = content.querySelector("#p3c-grid-prev");
    var next = content.querySelector("#p3c-grid-next");

    function filteredRows() {
      var needle = state.filter.trim().toLowerCase();
      var result = rows.filter(function (row) {
        if (!needle) return true;
        return [row.id, row.name, row.department, row.city].join(" ").toLowerCase().indexOf(needle) >= 0;
      });
      if (state.sort) {
        result.sort(function (a, b) {
          var av = a[state.sort];
          var bv = b[state.sort];
          if (av < bv) return -1 * state.direction;
          if (av > bv) return 1 * state.direction;
          return 0;
        });
      }
      return result;
    }

    function draw() {
      var result = filteredRows();
      var pageCount = Math.max(1, Math.ceil(result.length / state.pageSize));
      if (state.page > pageCount) state.page = pageCount;
      var start = (state.page - 1) * state.pageSize;
      var visible = result.slice(start, start + state.pageSize);
      body.innerHTML = visible.map(function (row) {
        return '<tr><td>' + esc(row.id) + '</td><td>' + esc(row.name) + '</td><td>' + esc(row.department) + '</td><td>' + esc(row.city) + '</td></tr>';
      }).join("");
      count.textContent = result.length + " of " + rows.length + " rows";
      pageLabel.textContent = "Page " + state.page + " of " + pageCount;
      previous.disabled = state.page <= 1;
      next.disabled = state.page >= pageCount;
      content.querySelectorAll("[data-sort]").forEach(function (button) {
        var key = button.getAttribute("data-sort");
        button.textContent = key.charAt(0).toUpperCase() + key.slice(1) + (state.sort === key ? (state.direction === 1 ? " ↑" : " ↓") : " ↕");
      });
    }

    filter.addEventListener("input", function () {
      state.filter = filter.value;
      state.page = 1;
      draw();
    });
    content.querySelectorAll("[data-sort]").forEach(function (button) {
      button.addEventListener("click", function () {
        var key = button.getAttribute("data-sort");
        if (state.sort === key) state.direction *= -1;
        else { state.sort = key; state.direction = 1; }
        draw();
      });
    });
    previous.addEventListener("click", function () { if (state.page > 1) { state.page--; draw(); } });
    next.addEventListener("click", function () { var max = Math.max(1, Math.ceil(filteredRows().length / state.pageSize)); if (state.page < max) { state.page++; draw(); } });
    draw();
  }

  function addStyles() {
    if (document.getElementById("algolassi-phase3c-styles")) return;
    var style = document.createElement("style");
    style.id = "algolassi-phase3c-styles";
    style.textContent = ".p3c-grid-demo{max-width:760px}.p3c-grid-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:16px 0}.p3c-grid-toolbar input{width:100%;max-width:320px;box-sizing:border-box;padding:9px 11px;border:1px solid #d0d5dd;border-radius:7px}.p3c-grid-toolbar span{font-size:12px;color:#667085;white-space:nowrap}.p3c-grid-wrap{overflow:auto;border:1px solid #d0d5dd;border-radius:9px}.p3c-grid-table{width:100%;border-collapse:collapse;font-size:13px}.p3c-grid-table th{background:#f8fafc;text-align:left;border-bottom:1px solid #d0d5dd}.p3c-grid-table th,.p3c-grid-table td{padding:10px 12px;border-bottom:1px solid #eaecf0}.p3c-grid-table tbody tr:last-child td{border-bottom:0}.p3c-grid-table tbody tr:hover{background:#f8fafc}.p3c-grid-table th button{border:0;background:transparent;font:inherit;font-weight:700;color:#344054;padding:0;cursor:pointer}.p3c-grid-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;font-size:12px;color:#667085}.p3c-grid-footer button{border:1px solid #d0d5dd;background:#fff;color:#344054;border-radius:6px;padding:7px 10px;margin-left:6px;cursor:pointer}.p3c-grid-footer button:disabled{opacity:.45;cursor:not-allowed}.p3c-dialog-demo{max-width:760px}.p3c-dialog-status{font-size:13px;color:#667085;margin-top:14px}.p3c-dialog-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(16,24,40,.48)}.p3c-dialog-overlay[hidden]{display:none}.p3c-dialog{width:min(460px,calc(100vw - 40px));background:#fff;border-radius:10px;box-shadow:0 20px 50px rgba(16,24,40,.25);overflow:hidden}.p3c-dialog-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #eaecf0}.p3c-dialog-header button{border:0;background:transparent;color:#667085;font-size:24px;line-height:1;padding:2px 6px;cursor:pointer}.p3c-dialog-body{padding:18px 16px;color:#344054}.p3c-dialog-footer{display:flex;justify-content:flex-end;padding:12px 16px;border-top:1px solid #eaecf0}.p3c-dialog-footer button{border:0;border-radius:7px;background:#0d6efd;color:#fff;padding:8px 14px;font-weight:700;cursor:pointer}";
    document.head.appendChild(style);
  }

  function start() {
    var params = new URLSearchParams(window.location.search || "");
    var demo = (params.get("demo") || "").toLowerCase().trim();
    if (demo !== "radzen-datagrid" && demo !== "radzen-dialog") return;
    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      if (demo === "radzen-dialog" ? installDialogFiles() : installDemoFiles()) clearInterval(timer);
      else if (attempts > 100) clearInterval(timer);
    }, 100);
  }

  function installDialogFiles() {
    return installDemoFiles();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  window.addEventListener("algolassi:spa-navigation", start);
})();
