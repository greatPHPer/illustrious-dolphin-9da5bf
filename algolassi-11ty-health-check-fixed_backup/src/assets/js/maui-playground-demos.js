/* Algolassi MAUI Hybrid playground demo loader */
(function () {
  "use strict";

  var demos = {
    "build-first-maui": { title: "Build your first MAUI page", files: [{ project: "1. MyMauiApp", file: "MainPage.xaml", code: '<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui">\n    <VerticalStackLayout Padding="30" Spacing="15">\n        <Label Text="Hello, MAUI!" FontSize="28" />\n        <Label Text="This is a live MAUI XAML playground demo." FontSize="18" />\n        <Label Text="You can edit this XAML and run the preview." />\n    </VerticalStackLayout>\n</ContentPage>' }] },
    "blazor-hybrid-architecture": { title: "Blazor Hybrid architecture", files: [{ project: "2. MyMauiApp.Shared", file: "Home.razor", code: '@page "/home"\n\n<h1>Blazor Hybrid UI</h1>\n<p>This Razor component represents the UI hosted by a .NET MAUI BlazorWebView.</p>\n<p>Native MAUI code can host this Razor UI while shared services connect the layers.</p>\n<button @onclick="ChangeMessage">Change message</button>\n<p>@message</p>\n\n@code {\n    private string message = "Razor is running in the playground!";\n\n    private void ChangeMessage()\n    {\n        message = "The Hybrid UI re-rendered successfully!";\n    }\n}' }] },
    "maui-dependency-injection": { title: "MAUI dependency injection", files: [{ project: "4. MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n\n<h1>Dependency Injection Demo</h1>\n<p>A Razor component can consume application state supplied by services.</p>\n<p>Current message: <strong>@message</strong></p>\n<button @onclick="ChangeMessage">Use service-like state</button>\n\n@code {\n    private string message = "Initial application state";\n\n    private void ChangeMessage()\n    {\n        message = "State was changed by the component method.";\n    }\n}' }] },
    "razor-code": { title: "Razor @code + @onclick", files: [{ project: "4. MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n\n<h1>@message</h1>\n<p>Click the button to update the component state.</p>\n<button @onclick="SetMessage">Set A</button>\n\n@code {\n    private string message = "Initial value";\n\n    private void SetMessage()\n    {\n        message = "123";\n    }\n}' }] },
    "razor-counter": { title: "Razor counter and automatic re-rendering", files: [{ project: "4. MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n\n<h1>Counter</h1>\n<p>Current value: <strong>@count</strong></p>\n<button @onclick="Increment">Increment</button>\n\n@code {\n    private int count = 0;\n\n    private void Increment()\n    {\n        count++;\n    }\n}' }] },
    "razor-routing": { title: "Blazor routing", files: [{ project: "2. MyMauiApp.Shared", file: "Home.razor", code: '@page "/home"\n\n<h1>Home Page</h1>\n<p>This page was loaded by the playground router.</p>\n<a href="/home">Reload Home</a>' }] },
    "dependency-injection": { title: "ASP.NET Core dependency injection", files: [
      { project: "3. MyMauiApp.Web", file: "Program.cs", code: 'var builder = WebApplication.CreateBuilder(args);\n\n// Register a service\nbuilder.Services.AddScoped<IGreetingService, GreetingService>();\nbuilder.Services.AddRazorComponents().AddInteractiveServerComponents();\n\nvar app = builder.Build();\napp.MapRazorComponents<App>().AddInteractiveServerRenderMode();\napp.Run();\n\npublic interface IGreetingService\n{\n    string GetGreeting();\n}\n\npublic class GreetingService : IGreetingService\n{\n    public string GetGreeting() => "Hello from Dependency Injection!";\n}' },
      { project: "4. MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n\n<h1>Dependency Injection Demo</h1>\n<p>The Web project contains a registered scoped service.</p>\n<p>Edit Program.cs and experiment with the registration.</p>' }
    ] },
    "radzen-button": { title: "Radzen Button", files: [
      { project: "3. MyMauiApp.Web", file: "Program.cs", code: 'var builder = WebApplication.CreateBuilder(args);\nbuilder.Services.AddRadzenComponents();\nbuilder.Services.AddRazorComponents().AddInteractiveServerComponents();\nvar app = builder.Build();\napp.MapRazorComponents<App>().AddInteractiveServerRenderMode();\napp.Run();' },
      { project: "4. MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n@using Radzen\n@using Radzen.Blazor\n\n<h1>Radzen Button Demo</h1>\n<RadzenButton Text="Click me" />' }
    ] },
    "maui-xaml-label": { title: "MAUI XAML Label", files: [{ project: "1. MyMauiApp", file: "MainPage.xaml", code: '<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui">\n    <VerticalStackLayout Padding="30">\n        <Label Text="Hello from the article demo!" FontSize="28" />\n    </VerticalStackLayout>\n</ContentPage>' }] },
    "maui-stacklayout": { title: "MAUI VerticalStackLayout spacing", files: [{ project: "1. MyMauiApp", file: "MainPage.xaml", code: '<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui">\n    <VerticalStackLayout Padding="30" Spacing="20">\n        <Label Text="VerticalStackLayout" FontSize="28" />\n        <Label Text="First item" />\n        <Label Text="Second item" />\n        <Label Text="Third item" />\n    </VerticalStackLayout>\n</ContentPage>' }] },
    "maui-label-styling": { title: "MAUI Label font sizes", files: [{ project: "1. MyMauiApp", file: "MainPage.xaml", code: '<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui">\n    <VerticalStackLayout Padding="30" Spacing="12">\n        <Label Text="Heading" FontSize="32" />\n        <Label Text="Subheading" FontSize="22" />\n        <Label Text="Normal body text" FontSize="16" />\n        <Label Text="Small helper text" FontSize="12" />\n    </VerticalStackLayout>\n</ContentPage>' }] },
    "razor-two-way-binding": { title: "Blazor two-way binding", files: [{ project: "4. MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n\n<h1>Two-way Binding</h1>\n<p>Edit the text below and the value updates automatically.</p>\n<input @bind="name" />\n<p>Hello, <strong>@name</strong>!</p>\n\n@code {\n    private string name = "Dhilip";\n}' }] },
    "razor-two-buttons": { title: "Blazor multiple event handlers", files: [{ project: "4. MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n\n<h1>Event Handlers</h1>\n<p>Current choice: <strong>@choice</strong></p>\n<button @onclick="ChooseFirst">Choose A</button>\n<button @onclick="ChooseSecond">Choose B</button>\n\n@code {\n    private string choice = "Nothing selected";\n\n    private void ChooseFirst()\n    {\n        choice = "A";\n    }\n\n    private void ChooseSecond()\n    {\n        choice = "B";\n    }\n}' }] },
    "razor-calculator": { title: "Blazor simple calculated value", files: [{ project: "4. MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n\n<h1>Calculated Value</h1>\n<p>Click the buttons to change the value.</p>\n<p>Value: <strong>@value</strong></p>\n<button @onclick="AddFive">Add 5</button>\n<button @onclick="SubtractTwo">Subtract 2</button>\n\n@code {\n    private int value = 10;\n\n    private void AddFive()\n    {\n        value += 5;\n    }\n\n    private void SubtractTwo()\n    {\n        value -= 2;\n    }\n}' }] }
  };

  function cleanProjectLabels() {
    var tree = document.querySelector(".maui-project-tree");
    if (!tree) return;
    tree.querySelectorAll(".maui-tree-folder-link strong").forEach(function (strong) {
      var current = strong.textContent.trim();
      var cleaned = current.replace(/^\d+\.\s*/, "");
      if (cleaned !== current) strong.textContent = cleaned;
    });
  }

  function watchProjectLabels() {
    var tree = document.querySelector(".maui-project-tree");
    if (!tree) return;
    cleanProjectLabels();
    if (tree.__algolassiProjectLabelObserver) return;
    var observer = new MutationObserver(function () { cleanProjectLabels(); });
    observer.observe(tree, { childList: true, subtree: true });
    tree.__algolassiProjectLabelObserver = observer;
  }

  function loadDemo() {
    var params = new URLSearchParams(window.location.search);
    var demoName = params.get("demo");
    var demo = demos[demoName];
    if (!demo) return;
    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      var editor = document.getElementById("maui-code-editor");
      var tree = document.querySelector(".maui-project-tree");
      var run = document.getElementById("maui-run-preview");
      if (!editor || !tree || !run) { if (attempts > 100) clearInterval(timer); return; }
      clearInterval(timer);
      watchProjectLabels();
      loadFiles(demo, 0);
    }, 100);
  }

  function findFileLink(project, file) {
    var roots = document.querySelectorAll(".maui-project-tree > li");
    var expectedProject = project.replace(/^\d+\.\s*/, "");
    for (var i = 0; i < roots.length; i++) {
      var strong = roots[i].querySelector(".maui-tree-folder-link strong");
      if (!strong || strong.textContent.trim().replace(/^\d+\.\s*/, "") !== expectedProject) continue;
      var links = roots[i].querySelectorAll(".maui-tree-link");
      for (var j = 0; j < links.length; j++) {
        var text = links[j].textContent.replace(/\s*\*\s*$/, "").trim();
        if (text === "📄 " + file || text === file) return links[j];
      }
    }
    return null;
  }

  function loadFiles(demo, index) {
    var files = demo.files || [];
    if (index >= files.length) {
      var run = document.getElementById("maui-run-preview");
      if (run) run.click();
      var output = document.getElementById("maui-console-output");
      if (output) output.textContent = "Demo loaded: " + demo.title + "\n\nThe example was loaded automatically and Run Preview was clicked.";
      return;
    }
    var item = files[index];
    var link = findFileLink(item.project, item.file);
    var editor = document.getElementById("maui-code-editor");
    var output = document.getElementById("maui-console-output");
    if (!link || !editor) { if (output) output.textContent = "Demo error: could not find " + item.project + " / " + item.file + "."; return; }
    link.click();
    setTimeout(function () {
      editor.value = item.code;
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      setTimeout(function () { loadFiles(demo, index + 1); }, 80);
    }, 120);
  }

  function start() {
    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      if (document.querySelector(".maui-project-tree")) {
        clearInterval(timer);
        watchProjectLabels();
        loadDemo();
      } else if (attempts > 100) clearInterval(timer);
    }, 100);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();

  window.addEventListener("algolassi:spa-navigation", function () {
    watchProjectLabels();
    loadDemo();
  });
})();
