(function(){
  "use strict";
  var projects={
    "1. MyMauiApp":{
      "MainPage.xaml":"<ContentPage xmlns=\"http://schemas.microsoft.com/dotnet/2021/maui\"\n             xmlns:x=\"http://schemas.microsoft.com/winfx/2009/xaml\"\n             x:Class=\"MyMauiApp.MainPage\">\n    <VerticalStackLayout Padding=\"30\">\n        <Label Text=\"Hello from MAUI Hybrid!\" FontSize=\"24\" />\n    </VerticalStackLayout>\n</ContentPage>",
      "MainPage.xaml.cs":"namespace MyMauiApp;\n\npublic partial class MainPage : ContentPage\n{\n    public MainPage()\n    {\n        InitializeComponent();\n    }\n}",
      "MauiProgram.cs":"namespace MyMauiApp;\n\npublic static class MauiProgram\n{\n    public static MauiApp CreateMauiApp()\n    {\n        var builder = MauiApp.CreateBuilder();\n        builder.UseMauiApp<App>();\n        return builder.Build();\n    }\n}"
    },
    "2. MyMauiApp.Shared":{"Models/AppMessage.cs":"namespace MyMauiApp.Shared.Models;\n\npublic record AppMessage(string Text);"},
    "3. MyMauiApp.Web":{"Program.cs":"var builder = WebApplication.CreateBuilder(args);\nbuilder.Services.AddRazorComponents().AddInteractiveServerComponents();\nvar app = builder.Build();\napp.MapRazorComponents<App>().AddInteractiveServerRenderMode();\napp.Run();"},
    "4. MyMauiApp.Web.Client":{"Home.razor":"@page \"/\"\n\n<h1>@message</h1>\n<button @onclick=\"ChangeMessage\">Click Me</button>\n\n@code {\n    private string message = \"Hello from MAUI Hybrid!\";\n    private void ChangeMessage() => message = \"You clicked the button!\";\n}"}
  };
  var currentProject="1. MyMauiApp", currentFile="MainPage.xaml";
  var editor=document.getElementById("maui-code-editor"), output=document.getElementById("maui-console-output"), preview=document.getElementById("maui-browser-preview");
  if(!editor||!output||!preview)return;
  function files(){return projects[currentProject]||{};}
  function loadFile(name){currentFile=name;editor.value=files()[name]||"";document.querySelectorAll(".maui-file-tabs button").forEach(function(b){b.classList.toggle("active",b.dataset.file===name);});}
  function renderTabs(){var tabs=document.querySelector(".maui-file-tabs");if(!tabs)return;tabs.innerHTML="";Object.keys(files()).forEach(function(name){var b=document.createElement("button");b.type="button";b.dataset.file=name;b.textContent=name;b.onclick=function(){save();loadFile(name);};tabs.appendChild(b);});var names=Object.keys(files());loadFile(names.indexOf(currentFile)>=0?currentFile:names[0]);}
  function save(){if(currentFile&&files()[currentFile]!==undefined)files()[currentFile]=editor.value;}
  function renderPreview(){save();var source=projects["4. MyMauiApp.Web.Client"]["Home.razor"]||"";var match=source.match(/<h1>([\s\S]*?)<\/h1>/i);var text=match?match[1].replace(/@message/g,"Hello from MAUI Hybrid!"):"Hello from MAUI Hybrid!";var message=text.replace(/<[^>]+>/g,"");preview.innerHTML='<div class="maui-browser-toolbar"><span>●</span><span>●</span><span>●</span><code>https://preview.algolassi.local/</code></div><div class="maui-browser-content"><h2>'+escapeHtml(message)+'</h2><p>This is the web-compatible browser preview.</p><button type="button" id="maui-demo-button">Click Me</button><p id="maui-demo-output" class="maui-demo-output"></p></div>';var btn=document.getElementById("maui-demo-button"),msg=document.getElementById("maui-demo-output");if(btn)btn.onclick=function(){msg.textContent="You clicked the button!";};output.textContent="Preview refreshed from the current solution.\nWeb.Client is the executable preview target.";}
  function escapeHtml(v){return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");}
  function createProject(){renderTabs();output.textContent="Project created successfully.\n\n1. MyMauiApp\n2. MyMauiApp.Shared\n3. MyMauiApp.Web\n4. MyMauiApp.Web.Client";renderPreview();}
  var create=document.getElementById("maui-create-project"),run=document.getElementById("maui-run-preview");
  if(create)create.addEventListener("click",createProject);
  if(run)run.addEventListener("click",renderPreview);
  document.querySelectorAll(".maui-tree-project").forEach(function(b){b.addEventListener("click",function(){save();var label=b.querySelector("span");currentProject=label?label.textContent.trim():b.textContent.replace(/^\s*📁\s*/,"").trim();document.querySelectorAll(".maui-tree-project").forEach(function(x){x.classList.remove("active")});b.classList.add("active");currentFile="";renderTabs();});});
  editor.addEventListener("input",function(){output.textContent="Unsaved changes in "+currentFile+".";});
  renderTabs();
})();
