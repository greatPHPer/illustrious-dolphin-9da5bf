/* Algolassi MAUI Hybrid playground demo loader */
(function () {
  "use strict";

  var demos = {
    "build-first-maui": {
      project: "1. MyMauiApp",
      file: "MainPage.xaml",
      code: '<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui">\n    <VerticalStackLayout Padding="30" Spacing="15">\n        <Label Text="Hello, MAUI!" FontSize="28" />\n        <Label Text="This is a live MAUI XAML playground demo." FontSize="18" />\n        <Label Text="You can edit this XAML and run the preview." />\n    </VerticalStackLayout>\n</ContentPage>'
    },
    "blazor-hybrid-architecture": {
      project: "2. MyMauiApp.Shared",
      file: "Home.razor",
      code: '@page "/home"\n\n<h1>Blazor Hybrid UI</h1>\n<p>This Razor component represents the UI hosted by a .NET MAUI BlazorWebView.</p>\n<p>Native MAUI code can host this Razor UI while shared services connect the layers.</p>\n<button @onclick="ChangeMessage">Change message</button>\n<p>@message</p>\n\n@code {\n    private string message = "Razor is running in the playground!";\n\n    private void ChangeMessage()\n    {\n        message = "The Hybrid UI re-rendered successfully!";\n    }\n}'
    },
    "maui-dependency-injection": {
      project: "4. MyMauiApp.Web.Client",
      file: "Home.razor",
      code: '@page "/"\n\n<h1>Dependency Injection Demo</h1>\n<p>A Razor component can consume application state supplied by services.</p>\n<p>Current message: <strong>@message</strong></p>\n<button @onclick="ChangeMessage">Use service-like state</button>\n\n@code {\n    private string message = "Initial application state";\n\n    private void ChangeMessage()\n    {\n        message = "State was changed by the component method.";\n    }\n}'
    }
  };

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
      if (!editor || !tree || !run) {
        if (attempts > 100) clearInterval(timer);
        return;
      }

      clearInterval(timer);

      var projectRows = tree.children;
      for (var i = 0; i < projectRows.length; i++) {
        var row = projectRows[i];
        var strong = row.querySelector(".maui-tree-folder-link strong");
        if (!strong || strong.textContent.trim() !== demo.project) continue;

        var links = row.querySelectorAll(".maui-tree-link");
        for (var j = 0; j < links.length; j++) {
          if (links[j].textContent.replace(/^📄\s*/, "").trim() === demo.file) {
            links[j].click();
            break;
          }
        }
        break;
      }

      setTimeout(function () {
        editor.value = demo.code;
        editor.dispatchEvent(new Event("input", { bubbles: true }));
        setTimeout(function () {
          run.click();
        }, 100);
      }, 150);
    }, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadDemo);
  } else {
    loadDemo();
  }

  window.addEventListener("algolassi:spa-navigation", function () {
    loadDemo();
  });
})();
