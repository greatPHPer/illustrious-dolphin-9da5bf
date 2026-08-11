/* Algolassi MAUI Hybrid playground - Phase 3C #2: Radzen Dialog */
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

  function installDialogFiles() {
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
    function closeDialog() { overlay.hidden = true; status.textContent = "Dialog closed."; open.focus(); }
    open.addEventListener("click", function () { overlay.hidden = false; status.textContent = "Dialog is open."; close.focus(); });
    close.addEventListener("click", closeDialog);
    closeX.addEventListener("click", closeDialog);
    overlay.addEventListener("click", function (event) { if (event.target === overlay) closeDialog(); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !overlay.hidden) closeDialog(); });
  }

  function addStyles() {
    if (document.getElementById("algolassi-phase3c-dialog-styles")) return;
    var style = document.createElement("style");
    style.id = "algolassi-phase3c-dialog-styles";
    style.textContent = ".p3c-dialog-demo{max-width:760px}.p3c-dialog-status{font-size:13px;color:#667085;margin-top:14px}.p3c-dialog-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(16,24,40,.48)}.p3c-dialog-overlay[hidden]{display:none}.p3c-dialog{width:min(460px,calc(100vw - 40px));background:#fff;border-radius:10px;box-shadow:0 20px 50px rgba(16,24,40,.25);overflow:hidden}.p3c-dialog-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #eaecf0}.p3c-dialog-header button{border:0;background:transparent;color:#667085;font-size:24px;line-height:1;padding:2px 6px;cursor:pointer}.p3c-dialog-body{padding:18px 16px;color:#344054}.p3c-dialog-footer{display:flex;justify-content:flex-end;padding:12px 16px;border-top:1px solid #eaecf0}.p3c-dialog-footer button{border:0;border-radius:7px;background:#0d6efd;color:#fff;padding:8px 14px;font-weight:700;cursor:pointer}";
    document.head.appendChild(style);
  }

  function start() {
    var params = new URLSearchParams(window.location.search || "");
    if ((params.get("demo") || "").toLowerCase().trim() !== "radzen-dialog") return;
    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      if (installDialogFiles()) clearInterval(timer);
      else if (attempts > 100) clearInterval(timer);
    }, 100);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  window.addEventListener("algolassi:spa-navigation", start);
})();

/* Blazor Hybrid architecture browser interaction */
(function () {
  "use strict";
  function wireHybridArchitecture() {
    var params = new URLSearchParams(window.location.search || "");
    if ((params.get("demo") || "").toLowerCase().trim() !== "blazor-hybrid-architecture") return;
    var preview = document.getElementById("maui-browser-preview");
    if (!preview) return;
    var content = preview.querySelector(".maui-browser-content");
    if (!content || content.__algolassiHybridArchitectureBound) return;
    content.__algolassiHybridArchitectureBound = true;
    content.innerHTML = '<h2>Blazor Hybrid UI</h2><p>This Razor component represents the UI hosted by a .NET MAUI BlazorWebView.</p><p>Native MAUI code can host this Razor UI while shared services connect the layers.</p><button type="button" id="hybrid-change-message">Change message</button><p id="hybrid-message"><strong>Razor is running in the playground!</strong></p>';
    var button = content.querySelector("#hybrid-change-message");
    var message = content.querySelector("#hybrid-message strong");
    if (!button || !message) return;
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      message.textContent = "The Hybrid UI re-rendered successfully!";
    });
  }
  function startHybridArchitecture() {
    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      if (document.getElementById("maui-browser-preview")) {
        clearInterval(timer);
        setTimeout(wireHybridArchitecture, 100);
      } else if (attempts > 100) clearInterval(timer);
    }, 100);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startHybridArchitecture);
  else startHybridArchitecture();
  window.addEventListener("algolassi:spa-navigation", startHybridArchitecture);
})();