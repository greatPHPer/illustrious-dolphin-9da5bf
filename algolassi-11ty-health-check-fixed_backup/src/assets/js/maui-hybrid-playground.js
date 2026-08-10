/* Algolassi MAUI Hybrid browser playground */
(function () {
  "use strict";
  var projects = {
    "1. MyMauiApp": {
      "MainPage.xaml": "<ContentPage xmlns=\"http://schemas.microsoft.com/dotnet/2021/maui\"\n             xmlns:x=\"http://schemas.microsoft.com/winfx/2009/xaml\"\n             x:Class=\"MyMauiApp.MainPage\">\n    <VerticalStackLayout Padding=\"30\">\n        <Label Text=\"Hello from MAUI Hybrid!\" FontSize=\"24\" />\n    </VerticalStackLayout>\n</ContentPage>",
      "MainPage.xaml.cs": "namespace MyMauiApp;\n\npublic partial class MainPage : ContentPage\n{\n    public MainPage() { InitializeComponent(); }\n}",
      "MauiProgram.cs": "namespace MyMauiApp;\n\npublic static class MauiProgram { public static MauiApp CreateMauiApp() { var builder=MauiApp.CreateBuilder(); builder.UseMauiApp<App>(); return builder.Build(); } }"
    },
    "2. MyMauiApp.Shared": {
      "Home.razor": "@page \"/home\"\n\n<h1>Hello from Shared!</h1>\n<p>This Home.razor belongs to the Shared project.</p>\n<a href=\"/home\">Go Home</a>",
      "Models/AppMessage.cs": "namespace MyMauiApp.Shared.Models;\n\npublic record AppMessage(string Text);"
    },
    "3. MyMauiApp.Web": { "Program.cs": "var builder=WebApplication.CreateBuilder(args);\nbuilder.Services.AddRazorComponents().AddInteractiveServerComponents();\nvar app=builder.Build();\napp.MapRazorComponents<App>().AddInteractiveServerRenderMode();\napp.Run();" },
    "4. MyMauiApp.Web.Client": { "Home.razor": "@page \"/\"\n\n<h1>@message</h1>\n<button @onclick=\"ChangeMessage\">Click Me</button>\n\n@code {\n    private string message = \"Hello from Web Client!\";\n    private void ChangeMessage() => message = \"You clicked the button!\";\n}" }
  };

  function start() {
    var currentProject="1. MyMauiApp", currentFile="MainPage.xaml";
    var editor=document.getElementById("maui-code-editor")||document.getElementById("maui-editor");
    var output=document.getElementById("maui-console-output")||document.getElementById("maui-console");
    var preview=document.getElementById("maui-browser-preview")||document.getElementById("maui-preview");
    var tabs=document.getElementById("maui-editor-tabs"), tree=document.getElementById("maui-solution-tree");
    if(!editor||!output||!preview||!tabs)return;

    function files(){return projects[currentProject]||{};}
    function save(){var f=files();if(currentFile&&Object.prototype.hasOwnProperty.call(f,currentFile))f[currentFile]=editor.value;}
    function load(name){currentFile=name;var f=files();editor.value=Object.prototype.hasOwnProperty.call(f,name)?f[name]:"";editor.dataset.project=currentProject;editor.dataset.file=currentFile;tabs.querySelectorAll("button").forEach(function(b){b.classList.toggle("active",b.dataset.file===name);});}
    function renderTabs(){tabs.innerHTML="";var names=Object.keys(files());if(!names.length){currentFile="";editor.value="";return;}if(names.indexOf(currentFile)<0)currentFile=names[0];names.forEach(function(name){var b=document.createElement("button");b.type="button";b.dataset.file=name;b.textContent=name;b.addEventListener("click",function(){save();load(name);});tabs.appendChild(b);});load(currentFile);}
    function renderTree(){if(!tree)return;tree.innerHTML="";Object.keys(projects).forEach(function(project){var box=document.createElement("div");box.className="maui-tree-project";var pb=document.createElement("button");pb.type="button";pb.className="maui-project-button";pb.innerHTML="📁 <span>"+project+"</span>";pb.onclick=function(){save();currentProject=project;currentFile="";renderTabs();updateTree();};box.appendChild(pb);var fb=document.createElement("div");fb.className="maui-tree-files";Object.keys(projects[project]).forEach(function(name){var b=document.createElement("button");b.type="button";b.className="maui-tree-file";b.textContent="📄 "+name;b.onclick=function(){save();currentProject=project;load(name);updateTree();};fb.appendChild(b);});box.appendChild(fb);tree.appendChild(box);});updateTree();}
    function updateTree(){if(!tree)return;tree.querySelectorAll(".maui-tree-project").forEach(function(p){var s=p.querySelector(".maui-project-button span");p.classList.toggle("active",!!s&&s.textContent===currentProject);});}
    function esc(v){return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");}
    function xaml(src){var out=[],re=/<Label\b([^>]*?)(?:\/?>)/gi,m;while((m=re.exec(src))){var t=m[1].match(/\bText\s*=\s*["']([^"']*)["']/i),s=m[1].match(/\bFontSize\s*=\s*["']([^"']*)["']/i);if(t)out.push('<div style="font-size:'+(s?parseFloat(s[1]):16)+'px;margin-bottom:16px;font-weight:500">'+esc(t[1])+'</div>');}return out.join("");}
    function sharedHome(src){var h=(src.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[,"Shared Home"])[1],p=(src.match(/<p[^>]*>([\s\S]*?)<\/p>/i)||[ ,""])[1];return '<h1>'+h+'</h1><p>'+p+'</p><a href="/home">Go Home</a>';}
    function webHome(src){var m=(src.match(/string\s+message\s*=\s*["']([\s\S]*?)["']/i)||[,"Hello from Web Client!"])[1],c=(src.match(/=>\s*message\s*=\s*["']([\s\S]*?)["']/i)||[,"You clicked the button!"])[1];return '<h1>'+esc(m)+'</h1><button id="b">Click Me</button><p id="s"></p><script>document.getElementById("b").onclick=function(){document.getElementById("s").textContent='+JSON.stringify(c)+'};<\\/script>';}
    function render(){save();var body="";if(currentProject==="1. MyMauiApp"&&currentFile==="MainPage.xaml")body=xaml(files()[currentFile]);else if(currentProject==="2. MyMauiApp.Shared"&&currentFile==="Home.razor")body=sharedHome(files()[currentFile]);else if(currentProject==="4. MyMauiApp.Web.Client"&&currentFile==="Home.razor")body=webHome(files()[currentFile]);else body='<p>This file is source-only in the browser preview.</p>';var html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,sans-serif;margin:0;padding:32px;background:#fff;color:#182230}button{padding:9px 14px;border:0;border-radius:7px;background:#0d6efd;color:#fff}a{color:#0d6efd}</style></head><body>'+body+'<script>document.querySelectorAll("a[href]").forEach(function(a){a.onclick=function(e){var h=a.getAttribute("href");if(h&&h.charAt(0)==="/"){e.preventDefault();parent.postMessage({type:"maui-route",path:h},"*");}}});<\\/script></body></html>';if(preview.tagName.toLowerCase()==="iframe")preview.srcdoc=html;else preview.innerHTML=body;output.textContent="Preview refreshed.\n\nCurrent file: "+currentProject+" / "+currentFile;}
    function route(path){if(path==="/home"){save();currentProject="2. MyMauiApp.Shared";currentFile="Home.razor";renderTabs();render();updateTree();}}
    window.addEventListener("message",function(e){if(e.data&&e.data.type==="maui-route")route(e.data.path);});
    var create=document.getElementById("maui-create-project"),run=document.getElementById("maui-run-preview");if(create)create.onclick=function(){save();currentProject="1. MyMauiApp";currentFile="MainPage.xaml";renderTabs();render();updateTree();};if(run)run.onclick=render;editor.addEventListener("input",function(){output.textContent="Unsaved changes in "+currentProject+" / "+currentFile+". Click Run Preview to apply them.";});
    renderTree();renderTabs();render();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
