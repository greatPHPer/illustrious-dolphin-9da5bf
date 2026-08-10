/* Algolassi MAUI Hybrid playground - Phase 3C #4: MudTextField + #5: MudCard */
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
    var params = new URLSearchParams(window.location.search || "");
    var demo = (params.get("demo") || "").toLowerCase().trim();
    var editor = document.getElementById("maui-code-editor");
    var output = document.getElementById("maui-console-output");
    if (!editor) return false;

    var link = findFileLink("MyMauiApp.Web.Client", "Home.razor");
    if (!link) return false;

    if (demo === "mud-textfield") {
      var textFieldCode = '@page "/"\n@using MudBlazor\n\n<h1>MudTextField Demo</h1>\n<p>Edit the MudBlazor text field and see the bound value update.</p>\n\n<MudTextField @bind-Value="name" Label="Your name" Variant="Variant.Outlined" />\n<p>Hello, @name!</p>\n\n@code {\n    private string name = "Dhilip";\n}';
      link.click();
      setTimeout(function () {
        editor.value = textFieldCode;
        editor.dispatchEvent(new Event("input", { bubbles: true }));
        if (output) output.textContent = "Demo loaded: MudTextField\n\nMudTextField rendering and two-way text binding are simulated in the browser preview.";
        setTimeout(renderMudTextField, 80);
      }, 120);
      return true;
    }

    if (demo === "mud-card") {
      var cardCode = '@page "/"\n@using MudBlazor\n\n<h1>MudCard Demo</h1>\n<p>A MudBlazor card groups related content into a simple surface.</p>\n\n<MudCard>\n    <MudCardContent>\n        <MudText Typo="Typo.h5">Algolassi MudCard</MudText>\n        <MudText Typo="Typo.body2">This content is displayed inside a MudBlazor card.</MudText>\n    </MudCardContent>\n    <MudCardActions>\n        <MudButton Variant="Variant.Filled" Color="Color.Primary">Learn More</MudButton>\n    </MudCardActions>\n</MudCard>';
      link.click();
      setTimeout(function () {
        editor.value = cardCode;
        editor.dispatchEvent(new Event("input", { bubbles: true }));
        if (output) output.textContent = "Demo loaded: MudCard\n\nMudCard, MudCardContent, MudCardActions, MudText and MudButton are simulated in the browser preview.";
        setTimeout(renderMudCard, 80);
      }, 120);
      return true;
    }

    return false;
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

  function renderMudCard() {
    var preview = document.getElementById("maui-browser-preview");
    if (!preview) return;
    var content = preview.querySelector(".maui-browser-content");
    if (!content) return;

    content.innerHTML = '<div class="p3c-mudcard-demo"><h2>MudCard</h2><p>Interactive browser preview of <code>&lt;MudCard&gt;</code>.</p><div class="p3c-mudcard"><div class="p3c-mudcard-content"><h3>Algolassi MudCard</h3><p>This content is displayed inside a MudBlazor card.</p></div><div class="p3c-mudcard-actions"><button type="button" id="p3c-mudcard-button">Learn More</button><span id="p3c-mudcard-result"></span></div></div></div>';
    addStyles();

    var button = content.querySelector("#p3c-mudcard-button");
    var result = content.querySelector("#p3c-mudcard-result");
    button.addEventListener("click", function () {
      result.textContent = "Button clicked!";
    });
  }

  function addStyles() {
    if (document.getElementById("algolassi-phase3c-mudtextfield-styles")) return;
    var style = document.createElement("style");
    style.id = "algolassi-phase3c-mudtextfield-styles";
    style.textContent = ".p3c-mudtextfield-demo{max-width:760px}.p3c-mudtextfield-demo>p{color:#475467}.p3c-mudtextfield-demo label{display:block;margin:14px 0 6px;font-size:13px;font-weight:700;color:#344054}.p3c-mudtextfield-demo input{display:block;width:100%;max-width:520px;box-sizing:border-box;padding:10px 12px;border:1px solid #98a2b3;border-radius:6px;outline:0;font:inherit}.p3c-mudtextfield-demo input:focus{border-color:#0d6efd;box-shadow:0 0 0 3px rgba(13,110,253,.12)}.p3c-mudtextfield-demo strong{color:#101828}.p3c-mudcard-demo{max-width:760px}.p3c-mudcard-demo>p{color:#475467}.p3c-mudcard{max-width:560px;margin-top:18px;border:1px solid #d0d5dd;border-radius:10px;background:#fff;box-shadow:0 4px 14px rgba(16,24,40,.12);overflow:hidden}.p3c-mudcard-content{padding:20px}.p3c-mudcard-content h3{margin:0 0 8px;color:#101828}.p3c-mudcard-content p{margin:0;color:#475467}.p3c-mudcard-actions{display:flex;align-items:center;gap:12px;padding:12px 20px;border-top:1px solid #eaecf0;background:#f8fafc}.p3c-mudcard-actions button{border:0;border-radius:6px;padding:8px 14px;background:#0d6efd;color:#fff;font-weight:700;cursor:pointer}.p3c-mudcard-actions span{font-size:13px;color:#027a48;font-weight:700}";
    document.head.appendChild(style);
  }

  function start() {
    var params = new URLSearchParams(window.location.search || "");
    var demo = (params.get("demo") || "").toLowerCase().trim();
    if (demo !== "mud-textfield" && demo !== "mud-card") return;

    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      if (installDemoFiles()) clearInterval(timer);
      else if (attempts > 100) clearInterval(timer);
    }, 100);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  window.addEventListener("algolassi:spa-navigation", start);
})();
