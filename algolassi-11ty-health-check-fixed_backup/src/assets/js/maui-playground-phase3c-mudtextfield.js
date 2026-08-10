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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () {
    start();
    startCounterFix();
  });
  else {
    start();
    startCounterFix();
  }
  window.addEventListener("algolassi:spa-navigation", function () {
    start();
    startCounterFix();
  });
})();
