/* Algolassi MAUI Hybrid playground - Phase 3C #5: MudCard */
(function () {
  "use strict";

  var code = '@page "/"\n@using MudBlazor\n\n<h1>MudCard Demo</h1>\n<p>A MudBlazor card groups related content into a simple surface.</p>\n\n<MudCard>\n    <MudCardContent>\n        <MudText Typo="Typo.h6">MAUI Hybrid</MudText>\n        <MudText Typo="Typo.body2">This content is displayed inside a MudCard.</MudText>\n    </MudCardContent>\n    <MudCardActions>\n        <MudButton Variant="Variant.Filled" Color="Color.Primary" OnClick="ShowMessage">Learn More</MudButton>\n    </MudCardActions>\n</MudCard>\n\n<p>@message</p>\n\n@code {\n    private string message = "";\n\n    private void ShowMessage()\n    {\n        message = "MudCard action clicked!";\n    }\n}';

  function findHomeLink() {
    var roots = document.querySelectorAll(".maui-project-tree > li");
    for (var i = 0; i < roots.length; i++) {
      var strong = roots[i].querySelector(".maui-tree-folder-link strong");
      if (!strong || strong.textContent.trim() !== "MyMauiApp.Web.Client") continue;
      var links = roots[i].querySelectorAll(".maui-tree-link");
      for (var j = 0; j < links.length; j++) {
        var text = links[j].textContent.replace(/\s*\*$/, "").trim();
        if (text === "📄 Home.razor" || text === "Home.razor") return links[j];
      }
    }
    return null;
  }

  function renderMudCard() {
    var preview = document.getElementById("maui-browser-preview");
    if (!preview) return false;
    var content = preview.querySelector(".maui-browser-content");
    if (!content) return false;

    content.innerHTML =
      '<div class="p3c-mudcard-demo">' +
        '<h2>MudCard Demo</h2>' +
        '<p>Interactive browser preview of <code>&lt;MudCard&gt;</code>.</p>' +
        '<div class="p3c-mudcard">' +
          '<div class="p3c-mudcard-content">' +
            '<h3>MAUI Hybrid</h3>' +
            '<p>This content is displayed inside a MudCard.</p>' +
          '</div>' +
          '<div class="p3c-mudcard-actions">' +
            '<button type="button" id="p3c-mudcard-button">Learn More</button>' +
          '</div>' +
        '</div>' +
        '<p id="p3c-mudcard-message" class="p3c-mudcard-message"></p>' +
      '</div>';

    addStyles();

    var button = content.querySelector("#p3c-mudcard-button");
    var message = content.querySelector("#p3c-mudcard-message");
    button.addEventListener("click", function () {
      message.textContent = "MudCard action clicked!";
    });
    return true;
  }

  function loadEditor() {
    var editor = document.getElementById("maui-code-editor");
    var link = findHomeLink();
    if (!editor || !link) return false;

    link.click();
    setTimeout(function () {
      editor.value = code;
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    }, 100);
    return true;
  }

  function start() {
    var params = new URLSearchParams(window.location.search || "");
    if ((params.get("demo") || "").toLowerCase().trim() !== "mud-card") return;

    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      var previewReady = !!document.getElementById("maui-browser-preview");
      if (previewReady) {
        clearInterval(timer);
        loadEditor();
        renderMudCard();
        var output = document.getElementById("maui-console-output");
        if (output) output.textContent = "Demo loaded: MudCard\n\nMudCard content and its Learn More action are simulated in the browser preview.";
      } else if (attempts > 100) {
        clearInterval(timer);
      }
    }, 100);
  }

  function addStyles() {
    if (document.getElementById("algolassi-phase3c-mudcard-styles")) return;
    var style = document.createElement("style");
    style.id = "algolassi-phase3c-mudcard-styles";
    style.textContent =
      ".p3c-mudcard-demo{max-width:760px}.p3c-mudcard-demo>p{color:#475467}.p3c-mudcard{max-width:520px;margin-top:18px;border:1px solid #d0d5dd;border-radius:10px;background:#fff;box-shadow:0 4px 14px rgba(16,24,40,.12);overflow:hidden}.p3c-mudcard-content{padding:20px}.p3c-mudcard-content h3{margin:0 0 8px;font-size:18px;color:#101828}.p3c-mudcard-content p{margin:0;color:#475467}.p3c-mudcard-actions{display:flex;justify-content:flex-end;padding:12px 16px;border-top:1px solid #eaecf0;background:#f8fafc}.p3c-mudcard-actions button{border:0;border-radius:6px;background:#0d6efd;color:#fff;padding:8px 14px;font-weight:700;cursor:pointer}.p3c-mudcard-actions button:hover{filter:brightness(.95)}.p3c-mudcard-message{font-weight:700;color:#0d6efd}";
    document.head.appendChild(style);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  window.addEventListener("load", start);
  window.addEventListener("algolassi:spa-navigation", start);
})();
