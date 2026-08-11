/* Algolassi MAUI Hybrid playground - Phase 3C #3: MudButton */
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
    if (!editor) return false;

    var link = findFileLink("MyMauiApp.Web.Client", "Home.razor");
    if (!link) return false;

    var code = '@page "/"\n@using MudBlazor\n\n<h1>MudButton Demo</h1>\n<p>Use a MudBlazor button and handle its click event from Razor.</p>\n\n<MudButton Variant="Variant.Filled" Color="Color.Primary" OnClick="@Increment">Click me</MudButton>\n<p>Clicked: @count times</p>\n\n@code {\n    private int count = 0;\n\n    private void Increment()\n    {\n        count++;\n    }\n}';

    link.click();
    setTimeout(function () {
      editor.value = code;
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      if (output) output.textContent = "Demo loaded: MudButton\n\nMudButton rendering and the click interaction are simulated in the browser preview.";
      setTimeout(renderMudButton, 80);
    }, 120);
    return true;
  }

  function renderMudButton() {
    var preview = document.getElementById("maui-browser-preview");
    if (!preview) return;
    var content = preview.querySelector(".maui-browser-content");
    if (!content) return;

    content.innerHTML = '<div class="p3c-mudbutton-demo"><h2>MudButton</h2><p>Interactive browser preview of <code>&lt;MudButton&gt;</code>.</p><button type="button" id="p3c-mudbutton">Click me</button><p id="p3c-mudbutton-status">Clicked: 0 times</p></div>';
    addStyles();

    var button = content.querySelector("#p3c-mudbutton");
    var status = content.querySelector("#p3c-mudbutton-status");
    var count = 0;

    button.addEventListener("click", function () {
      count++;
      status.textContent = "Clicked: " + count + " time" + (count === 1 ? "" : "s");
    });
  }

  function addStyles() {
    if (document.getElementById("algolassi-phase3c-mudbutton-styles")) return;
    var style = document.createElement("style");
    style.id = "algolassi-phase3c-mudbutton-styles";
    style.textContent = ".p3c-mudbutton-demo{max-width:760px}.p3c-mudbutton-demo>p{color:#475467}.p3c-mudbutton-demo button{border:0;border-radius:6px;padding:9px 16px;background:#0d6efd;color:#fff;font-weight:700;cursor:pointer;box-shadow:0 2px 5px rgba(16,24,40,.15)}.p3c-mudbutton-demo button:hover{filter:brightness(.96)}.p3c-mudbutton-demo button:active{transform:translateY(1px)}";
    document.head.appendChild(style);
  }

  function start() {
    var params = new URLSearchParams(window.location.search || "");
    if ((params.get("demo") || "").toLowerCase().trim() !== "mud-button") return;

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
