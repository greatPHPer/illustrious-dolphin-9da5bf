/* Algolassi MAUI Hybrid playground - Phase 3C #4: MudTextField */
(function () {
  "use strict";

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
    if (!editor) return false;

    var link = findFileLink("MyMauiApp.Web.Client", "Home.razor");
    if (!link) return false;

    var code = '@page "/"\n@using MudBlazor\n\n<h1>MudTextField Demo</h1>\n<p>Edit the MudBlazor text field and see the bound value update.</p>\n\n<MudTextField @bind-Value="name" Label="Your name" Variant="Variant.Outlined" />\n<p>Hello, @name!</p>\n\n@code {\n    private string name = "Dhilip";\n}';

    link.click();
    setTimeout(function () {
      editor.value = code;
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      if (output) output.textContent = "Demo loaded: MudTextField\n\nMudTextField rendering and two-way text binding are simulated in the browser preview.";
      setTimeout(renderMudTextField, 80);
    }, 120);
    return true;
  }

  function renderMudTextField() {
    var preview = document.getElementById("maui-browser-preview");
    if (!preview) return;
    var content = preview.querySelector(".maui-browser-content");
    if (!content) return;

    content.innerHTML = '<div class="p3c-mudtextfield-demo"><h2>MudTextField</h2><p>Interactive browser preview of <code>&lt;MudTextField&gt;</code> with two-way binding.</p><label for="p3c-mudtextfield">Your name</label><input type="text" id="p3c-mudtextfield" value="Dhilip" autocomplete="off"><p>Hello, <strong id="p3c-mudtextfield-value">Dhilip</strong>!</p></div>';
    addStyles();

    var input = content.querySelector("#p3c-mudtextfield");
    var value = content.querySelector("#p3c-mudtextfield-value");

    input.addEventListener("input", function () {
      value.textContent = input.value;
    });
  }

  function addStyles() {
    if (document.getElementById("algolassi-phase3c-mudtextfield-styles")) return;
    var style = document.createElement("style");
    style.id = "algolassi-phase3c-mudtextfield-styles";
    style.textContent = ".p3c-mudtextfield-demo{max-width:760px}.p3c-mudtextfield-demo>p{color:#475467}.p3c-mudtextfield-demo label{display:block;margin:14px 0 6px;font-size:13px;font-weight:700;color:#344054}.p3c-mudtextfield-demo input{display:block;width:100%;max-width:520px;box-sizing:border-box;padding:10px 12px;border:1px solid #98a2b3;border-radius:6px;outline:0;font:inherit}.p3c-mudtextfield-demo input:focus{border-color:#0d6efd;box-shadow:0 0 0 3px rgba(13,110,253,.12)}.p3c-mudtextfield-demo strong{color:#101828}";
    document.head.appendChild(style);
  }

  function start() {
    var params = new URLSearchParams(window.location.search || "");
    if ((params.get("demo") || "").toLowerCase().trim() !== "mud-textfield") return;

    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      if (installDemoFiles()) clearInterval(timer);
      else if (attempts > 100) clearInterval(timer);
    }, 100);
  }

  function fixRazorCounter() {
    var params = new URLSearchParams(window.location.search || "");
    if ((params.get("demo") || "").toLowerCase().trim() !== "razor-counter") return;

    var preview = document.getElementById("maui-browser-preview");
    if (!preview) return;
    var content = preview.querySelector(".maui-browser-content");
    if (!content || content.__algolassiCounterFixed) return;

    var text = content.textContent || "";
    if (text.indexOf("Current value:") === -1) return;

    content.innerHTML = '<div class="p3c-counter-demo"><h2>Counter</h2><p>Current value: <strong id="p3c-counter-value">0</strong></p><button type="button" id="p3c-counter-increment">Increment</button></div>';
    content.__algolassiCounterFixed = true;

    var value = 0;
    var valueNode = content.querySelector("#p3c-counter-value");
    var button = content.querySelector("#p3c-counter-increment");
    if (!valueNode || !button) return;

    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      value += 1;
      valueNode.textContent = String(value);
    });
  }

  function startCounterFix() {
    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      fixRazorCounter();
      var params = new URLSearchParams(window.location.search || "");
      if ((params.get("demo") || "").toLowerCase().trim() !== "razor-counter" || attempts > 100) clearInterval(timer);
    }, 100);
  }

  function installMudCardDemo() {
    var params = new URLSearchParams(window.location.search || "");
    if ((params.get("demo") || "").toLowerCase().trim() !== "mudcard") return false;

    var editor = document.getElementById("maui-code-editor");
    var output = document.getElementById("maui-console-output");
    var preview = document.getElementById("maui-browser-preview");
    if (!editor || !preview) return false;

    var link = findFileLink("MyMauiApp.Web.Client", "Home.razor");
    if (!link) return false;

    var code = '@page "/"\n@using MudBlazor\n\n<h1>MudCard Demo</h1>\n<p>A simple card-style container using MudBlazor.</p>\n\n<MudCard Class="pa-4">\n    <MudCardContent>\n        <MudText Typo="Typo.h6">Hello from MudCard</MudText>\n        <MudText Typo="Typo.body2">This content is displayed inside a MudCard component.</MudText>\n    </MudCardContent>\n    <MudCardActions>\n        <MudButton Variant="Variant.Filled" Color="Color.Primary" OnClick="ShowMessage">Click me</MudButton>\n    </MudCardActions>\n</MudCard>\n\n<p>@message</p>\n\n@code {\n    private string message = "Ready";\n\n    private void ShowMessage()\n    {\n        message = "MudCard button clicked!";\n    }\n}';

    link.click();
    setTimeout(function () {
      editor.value = code;
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      if (output) output.textContent = "Demo loaded: MudCard\n\nMudCard rendering and button interaction are simulated in the browser preview.";
      setTimeout(renderMudCard, 100);
    }, 120);
    return true;
  }

  function renderMudCard() {
    var preview = document.getElementById("maui-browser-preview");
    if (!preview) return;
    var content = preview.querySelector(".maui-browser-content");
    if (!content || content.__algolassiMudCardFixed) return;

    content.innerHTML = '<div class="p3c-mudcard-demo"><div class="p3c-mudcard"><div class="p3c-mudcard-content"><h2>Hello from MudCard</h2><p>This content is displayed inside a MudCard component.</p></div><div class="p3c-mudcard-actions"><button type="button" id="p3c-mudcard-button">Click me</button></div></div><p id="p3c-mudcard-message">Ready</p></div>';
    content.__algolassiMudCardFixed = true;
    addMudCardStyles();

    var button = content.querySelector("#p3c-mudcard-button");
    var message = content.querySelector("#p3c-mudcard-message");
    if (button && message) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        message.textContent = "MudCard button clicked!";
      });
    }
  }

  function addMudCardStyles() {
    if (document.getElementById("algolassi-phase3c-mudcard-styles")) return;
    var style = document.createElement("style");
    style.id = "algolassi-phase3c-mudcard-styles";
    style.textContent = ".p3c-mudcard-demo{max-width:760px}.p3c-mudcard{max-width:520px;border:1px solid #d0d5dd;border-radius:12px;background:#fff;box-shadow:0 5px 18px rgba(16,24,40,.12);overflow:hidden}.p3c-mudcard-content{padding:20px}.p3c-mudcard-content h2{margin:0 0 8px}.p3c-mudcard-content p{margin:0;color:#475467}.p3c-mudcard-actions{padding:12px 20px;border-top:1px solid #eaecf0;background:#f8fafc}.p3c-mudcard-actions button{border:0;border-radius:7px;background:#0d6efd;color:#fff;padding:9px 14px;font-weight:700;cursor:pointer}.p3c-mudcard-demo>#p3c-mudcard-message{font-weight:700;color:#0d6efd}";
    document.head.appendChild(style);
  }

  function startMudCard() {
    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      if (installMudCardDemo()) clearInterval(timer);
      else if (attempts > 100) clearInterval(timer);
    }, 100);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () {
    start();
    startCounterFix();
    startMudCard();
  });
  else {
    start();
    startCounterFix();
    startMudCard();
  }
  window.addEventListener("algolassi:spa-navigation", function () {
    start();
    startCounterFix();
    startMudCard();
  });
})();

/* Blazor Hybrid architecture fix - loaded by this already-included Phase 3C script. */
(function () {
  "use strict";

  function renderHybrid() {
    var params = new URLSearchParams(window.location.search || "");
    if ((params.get("demo") || "").toLowerCase().trim() !== "blazor-hybrid-architecture") return;

    var preview = document.getElementById("maui-browser-preview");
    if (!preview) return;
    var content = preview.querySelector(".maui-browser-content");
    if (!content || content.__algolassiHybridBound) return;

    content.innerHTML = '<h2>Blazor Hybrid UI</h2><p>This Razor component represents the UI hosted by a .NET MAUI BlazorWebView.</p><p>Native MAUI code can host this Razor UI while shared services connect the layers.</p><button type="button" id="hybrid-change-message">Change message</button><p id="hybrid-message"><strong>Razor is running in the playground!</strong></p>';
    content.__algolassiHybridBound = true;

    var button = content.querySelector("#hybrid-change-message");
    var message = content.querySelector("#hybrid-message strong");
    if (!button || !message) return;

    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      message.textContent = "The Hybrid UI re-rendered successfully!";
    });
  }

  function startHybrid() {
    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      renderHybrid();
      var params = new URLSearchParams(window.location.search || "");
      if ((params.get("demo") || "").toLowerCase().trim() !== "blazor-hybrid-architecture" || document.getElementById("hybrid-change-message") || attempts > 100) clearInterval(timer);
    }, 100);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startHybrid);
  else startHybrid();
  window.addEventListener("algolassi:spa-navigation", startHybrid);
})();