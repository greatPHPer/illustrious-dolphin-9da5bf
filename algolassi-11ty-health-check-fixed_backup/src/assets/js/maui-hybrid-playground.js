/* Algolassi MAUI Hybrid browser playground */
(function () {
  "use strict";

  var projects = {
    "1. MyMauiApp": {
      "MainPage.xaml": "<ContentPage xmlns=\"http://schemas.microsoft.com/dotnet/2021/maui\"\n             xmlns:x=\"http://schemas.microsoft.com/winfx/2009/xaml\"\n             x:Class=\"MyMauiApp.MainPage\">\n    <VerticalStackLayout Padding=\"30\">\n        <Label Text=\"Hello from MAUI Hybrid!\" FontSize=\"24\" />\n    </VerticalStackLayout>\n</ContentPage>",
      "MainPage.xaml.cs": "namespace MyMauiApp;\n\npublic partial class MainPage : ContentPage\n{\n    public MainPage()\n    {\n        InitializeComponent();\n    }\n}",
      "MauiProgram.cs": "namespace MyMauiApp;\n\npublic static class MauiProgram\n{\n    public static MauiApp CreateMauiApp()\n    {\n        var builder = MauiApp.CreateBuilder();\n        builder.UseMauiApp<App>();\n        return builder.Build();\n    }\n}"
    },
    "2. MyMauiApp.Shared": {
      "Models/AppMessage.cs": "namespace MyMauiApp.Shared.Models;\n\npublic record AppMessage(string Text);"
    },
    "3. MyMauiApp.Web": {
      "Program.cs": "var builder = WebApplication.CreateBuilder(args);\nbuilder.Services.AddRazorComponents().AddInteractiveServerComponents();\nvar app = builder.Build();\napp.MapRazorComponents<App>().AddInteractiveServerRenderMode();\napp.Run();"
    },
    "4. MyMauiApp.Web.Client": {
      "Home.razor": "@page \"/\"\n\n<h1>@message</h1>\n<button @onclick=\"ChangeMessage\">Click Me</button>\n\n@code {\n    private string message = \"Hello from MAUI Hybrid!\";\n    private void ChangeMessage() => message = \"You clicked the button!\";\n}"
    }
  };

  var currentProject = "1. MyMauiApp";
  var currentFile = "MainPage.xaml";
  var editor = document.getElementById("maui-editor") || document.getElementById("maui-code-editor");
  var output = document.getElementById("maui-console") || document.getElementById("maui-console-output");
  var preview = document.getElementById("maui-preview") || document.getElementById("maui-browser-preview");
  if (!editor || !output || !preview) return;

  function files() { return projects[currentProject] || {}; }

  function save() {
    if (currentFile && files()[currentFile] !== undefined) {
      files()[currentFile] = editor.value;
    }
  }

  function loadFile(name) {
    save();
    currentFile = name;
    editor.value = files()[name] || "";
    document.querySelectorAll(".maui-editor-tabs button, .maui-file-tabs button").forEach(function (button) {
      button.classList.toggle("active", button.dataset.file === name);
    });
  }

  function renderTabs() {
    var tabs = document.getElementById("maui-editor-tabs") || document.querySelector(".maui-file-tabs");
    if (!tabs) return;
    tabs.innerHTML = "";
    Object.keys(files()).forEach(function (name) {
      var button = document.createElement("button");
      button.type = "button";
      button.dataset.file = name;
      button.textContent = name;
      button.addEventListener("click", function () { loadFile(name); });
      tabs.appendChild(button);
    });
    var names = Object.keys(files());
    loadFile(names.indexOf(currentFile) >= 0 ? currentFile : names[0]);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function extractInitialValue(source) {
    var match = source.match(/(?:string|String)\s+message\s*=\s*[\"']([\s\S]*?)[\"']\s*;/i);
    return match ? match[1] : "Hello from MAUI Hybrid!";
  }

  function extractHeading(source) {
    var match = source.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (!match) return "Hello from MAUI Hybrid!";
    return match[1].replace(/@message/g, extractInitialValue(source)).replace(/<[^>]+>/g, "").trim();
  }

  function extractButtonText(source) {
    var match = source.match(/<button[^>]*>([\s\S]*?)<\/button>/i);
    return match ? match[1].replace(/@[^\s<]+/g, "").trim() || "Click Me" : "Click Me";
  }

  function extractClickMessage(source) {
    var match = source.match(/=>\s*message\s*=\s*[\"']([\s\S]*?)[\"']/i);
    return match ? match[1] : "You clicked the button!";
  }

  function renderPreview() {
    save();
    var source = projects["4. MyMauiApp.Web.Client"]["Home.razor"] || "";
    var heading = extractHeading(source);
    var buttonText = extractButtonText(source);
    var clickedMessage = extractClickMessage(source);
    var html = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>' +
      'body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;margin:0;padding:32px;background:#fff;color:#182230}h1{margin-top:0}button{padding:10px 16px;border:0;border-radius:8px;background:#0d6efd;color:#fff;font-weight:600;cursor:pointer}.message{margin-top:18px;font-weight:600}' +
      '</style></head><body><h1 id="preview-heading"></h1><button id="preview-button"></button><p id="preview-message" class="message"></p>' +
      '<script>(function(){var h=document.getElementById("preview-heading"),b=document.getElementById("preview-button"),m=document.getElementById("preview-message");h.textContent=' + JSON.stringify(heading) + ';b.textContent=' + JSON.stringify(buttonText) + ';b.onclick=function(){m.textContent=' + JSON.stringify(clickedMessage) + ';};})();<\\/script></body></html>';

    if (preview.tagName.toLowerCase() === "iframe") {
      preview.srcdoc = html;
    } else {
      preview.innerHTML = html;
      var button = preview.querySelector("#preview-button");
      var message = preview.querySelector("#preview-message");
      if (button) button.onclick = function () { message.textContent = clickedMessage; };
    }

    output.textContent = "Preview refreshed from your current edits.\n\nWeb.Client: " + currentFile + "\nBrowser preview is running the web-compatible sample.";
  }

  function createProject() {
    currentProject = "1. MyMauiApp";
    currentFile = "MainPage.xaml";
    renderTabs();
    output.textContent = "Project created successfully.\n\n1. MyMauiApp\n2. MyMauiApp.Shared\n3. MyMauiApp.Web\n4. MyMauiApp.Web.Client";
    renderPreview();
  }

  var create = document.getElementById("maui-create-project");
  var run = document.getElementById("maui-run-preview");
  if (create) create.addEventListener("click", createProject);
  if (run) run.addEventListener("click", function () { renderPreview(); });

  document.querySelectorAll(".maui-tree-project").forEach(function (button) {
    button.addEventListener("click", function () {
      save();
      var label = button.querySelector("span");
      currentProject = label ? label.textContent.trim() : button.textContent.replace(/^\s*📁\s*/, "").trim();
      document.querySelectorAll(".maui-tree-project").forEach(function (item) { item.classList.remove("active"); });
      button.classList.add("active");
      currentFile = "";
      renderTabs();
    });
  });

  editor.addEventListener("input", function () {
    output.textContent = "Unsaved changes in " + currentProject + " / " + currentFile + ". Click Run Preview to apply them.";
  });

  renderTabs();
  renderPreview();
})();
