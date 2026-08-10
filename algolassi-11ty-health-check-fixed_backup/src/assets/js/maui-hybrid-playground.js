/* Algolassi MAUI Hybrid browser playground */
(function () {
  "use strict";
  var projects = {
    "1. MyMauiApp": {
      "MainPage.xaml": "<ContentPage xmlns=\"http://schemas.microsoft.com/dotnet/2021/maui\"\n             xmlns:x=\"http://schemas.microsoft.com/winfx/2009/xaml\"\n             x:Class=\"MyMauiApp.MainPage\">\n    <VerticalStackLayout Padding=\"30\">\n        <Label Text=\"Hello from MAUI Hybrid!\" FontSize=\"24\" />\n    </VerticalStackLayout>\n</ContentPage>",
      "MainPage.xaml.cs": "namespace MyMauiApp;\n\npublic partial class MainPage : ContentPage\n{\n    public MainPage()\n    {\n        InitializeComponent();\n    }\n}",
      "MauiProgram.cs": "namespace MyMauiApp;\n\npublic static class MauiProgram\n{\n    public static MauiApp CreateMauiApp()\n    {\n        var builder = MauiApp.CreateBuilder();\n        builder.UseMauiApp<App>();\n        return builder.Build();\n    }\n}"
    },
    "2. MyMauiApp.Shared": { "Models/AppMessage.cs": "namespace MyMauiApp.Shared.Models;\n\npublic record AppMessage(string Text);" },
    "3. MyMauiApp.Web": { "Program.cs": "var builder = WebApplication.CreateBuilder(args);\nbuilder.Services.AddRazorComponents().AddInteractiveServerComponents();\nvar app = builder.Build();\napp.MapRazorComponents<App>().AddInteractiveServerRenderMode();\napp.Run();" },
    "4. MyMauiApp.Web.Client": { "Home.razor": "@page \"/\"\n\n<h1>@message</h1>\n<button @onclick=\"ChangeMessage\">Click Me</button>\n\n@code {\n    private string message = \"Hello from MAUI Hybrid!\";\n    private void ChangeMessage() => message = \"You clicked the button!\";\n}" }
  };

  function start() {
    var currentProject = "1. MyMauiApp", currentFile = "MainPage.xaml";
    var editor = document.getElementById("maui-code-editor") || document.getElementById("maui-editor");
    var output = document.getElementById("maui-console-output") || document.getElementById("maui-console");
    var preview = document.getElementById("maui-browser-preview") || document.getElementById("maui-preview");
    var tabs = document.getElementById("maui-editor-tabs");
    if (!editor || !output || !preview || !tabs) return;

    function files() { return projects[currentProject] || {}; }
    function saveEditor() { var f = files(); if (currentFile && Object.prototype.hasOwnProperty.call(f, currentFile)) f[currentFile] = editor.value; }
    function setEditor(name) {
      saveEditor(); currentFile = name;
      var f = files();
      editor.value = Object.prototype.hasOwnProperty.call(f, name) ? f[name] : "";
      tabs.querySelectorAll("button").forEach(function (b) { b.classList.toggle("active", b.dataset.file === name); });
    }
    function renderTabs() {
      saveEditor(); tabs.innerHTML = "";
      var names = Object.keys(files());
      names.forEach(function (name) { var b = document.createElement("button"); b.type="button"; b.dataset.file=name; b.textContent=name; b.addEventListener("click",function(){setEditor(name);}); tabs.appendChild(b); });
      if (!names.length) { currentFile=""; editor.value=""; return; }
      setEditor(names.indexOf(currentFile) !== -1 ? currentFile : names[0]);
    }
    function esc(v) { return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;"); }
    function renderXaml(source) {
      var result=[], re=/<Label\b([^>]*?)(?:\/?>)/gi, m;
      while((m=re.exec(source))) { var a=m[1], t=a.match(/\bText\s*=\s*["']([^"']*)["']/i), s=a.match(/\bFontSize\s*=\s*["']([^"']*)["']/i); if(t) result.push('<div style="font-size:'+(s?parseFloat(s[1]):16)+'px;margin-bottom:16px;font-weight:500">'+esc(t[1])+'</div>'); }
      return result.join("");
    }
    function renderPreview() {
      saveEditor();
      var xaml=projects["1. MyMauiApp"]["MainPage.xaml"]||"", razor=projects["4. MyMauiApp.Web.Client"]["Home.razor"]||"", body=renderXaml(xaml);
      if(!body){var m=(razor.match(/string\s+message\s*=\s*["']([\s\S]*?)["']/i)||[,"Hello from MAUI Hybrid!"])[1];body='<h1>'+esc(m)+'</h1><button>Click Me</button>';}
      var html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;margin:0;padding:32px;background:#fff;color:#182230}button{padding:9px 14px;border:0;border-radius:7px;background:#0d6efd;color:#fff}</style></head><body>'+body+'</body></html>';
      if(preview.tagName.toLowerCase()==="iframe") preview.srcdoc=html; else preview.innerHTML=body;
      output.textContent="Preview refreshed from current editor contents.\n\nCurrent file: "+currentProject+" / "+currentFile;
    }
    document.querySelectorAll(".maui-tree-project").forEach(function(button){button.addEventListener("click",function(){saveEditor();var s=button.querySelector("span"),name=s?s.textContent.trim():button.textContent.replace(/^\s*📁\s*/,"").trim();if(!projects[name])return;currentProject=name;currentFile="";document.querySelectorAll(".maui-tree-project").forEach(function(x){x.classList.remove("active")});button.classList.add("active");renderTabs();});});
    var create=document.getElementById("maui-create-project"),run=document.getElementById("maui-run-preview");
    if(create)create.addEventListener("click",function(){currentProject="1. MyMauiApp";currentFile="MainPage.xaml";renderTabs();renderPreview();});
    if(run)run.addEventListener("click",renderPreview);
    editor.addEventListener("input",function(){output.textContent="Unsaved changes in "+currentProject+" / "+currentFile+". Click Run Preview to apply them.";});
    renderTabs(); renderPreview();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
