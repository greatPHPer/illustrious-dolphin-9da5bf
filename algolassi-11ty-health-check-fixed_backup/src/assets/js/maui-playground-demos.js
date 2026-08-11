/* Algolassi MAUI Hybrid playground demo loader */
(function () {
  "use strict";

  var demos = {
    "build-first-maui": { title: "Build your first MAUI page", files: [{ project: "MyMauiApp", file: "MainPage.xaml", code: '<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui">\n    <VerticalStackLayout Padding="30" Spacing="15">\n        <Label Text="Hello, MAUI!" FontSize="28" />\n        <Label Text="This is a live MAUI XAML playground demo." FontSize="18" />\n        <Label Text="You can edit this XAML and run the preview." />\n    </VerticalStackLayout>\n</ContentPage>' }] },
    "blazor-hybrid-architecture": { title: "Blazor Hybrid architecture", files: [{ project: "MyMauiApp.Shared", file: "Home.razor", code: '@page "/home"\n\n<h1>Blazor Hybrid UI</h1>\n<p>This Razor component represents the UI hosted by a .NET MAUI BlazorWebView.</p>\n<p>Native MAUI code can host this Razor UI while shared services connect the layers.</p>\n<button @onclick="ChangeMessage">Change message</button>\n<p>@message</p>\n\n@code {\n    private string message = "Razor is running in the playground!";\n\n    private void ChangeMessage()\n    {\n        message = "The Hybrid UI re-rendered successfully!";\n    }\n}' }] },
    "maui-dependency-injection": { title: "MAUI dependency injection", files: [{ project: "MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n\n<h1>Dependency Injection Demo</h1>\n<p>A Razor component can consume application state supplied by services.</p>\n<p>Current message: <strong>@message</strong></p>\n<button @onclick="ChangeMessage">Use service-like state</button>\n\n@code {\n    private string message = "Initial application state";\n\n    private void ChangeMessage()\n    {\n        message = "State was changed by the component method.";\n    }\n}' }] },
    "razor-code": { title: "Razor @code + @onclick", files: [{ project: "MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n\n<h1>@message</h1>\n<p>Click the button to update the component state.</p>\n<button @onclick="SetMessage">Set A</button>\n\n@code {\n    private string message = "Initial value";\n\n    private void SetMessage()\n    {\n        message = "123";\n    }\n}' }] },
    "razor-counter": { title: "Razor counter and automatic re-rendering", files: [{ project: "MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n\n<h1>Counter</h1>\n<p>Current value: <strong>@count</strong></p>\n<button @onclick="Increment">Increment</button>\n\n@code {\n    private int count = 0;\n\n    private void Increment()\n    {\n        count++;\n    }\n}' }] },
    "razor-routing": { title: "Blazor routing", files: [{ project: "MyMauiApp.Shared", file: "Home.razor", code: '@page "/home"\n\n<h1>Home Page</h1>\n<p>This page was loaded by the playground router.</p>\n<a href="/home">Reload Home</a>' }] },
    "dependency-injection": { title: "ASP.NET Core dependency injection", files: [{ project: "MyMauiApp.Web", file: "Program.cs", code: 'var builder = WebApplication.CreateBuilder(args);\n\n// Register a service\nbuilder.Services.AddScoped<IGreetingService, GreetingService>();\nbuilder.Services.AddRazorComponents().AddInteractiveServerComponents();\n\nvar app = builder.Build();\napp.MapRazorComponents<App>().AddInteractiveServerRenderMode();\napp.Run();\n\npublic interface IGreetingService\n{\n    string GetGreeting();\n}\n\npublic class GreetingService : IGreetingService\n{\n    public string GetGreeting() => "Hello from Dependency Injection!";\n}' }, { project: "MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n\n<h1>Dependency Injection Demo</h1>\n<p>The Web project contains a registered scoped service.</p>\n<p>Edit Program.cs and experiment with the registration.</p>' }] },
    "radzen-button": { title: "Radzen Button", files: [{ project: "MyMauiApp.Web", file: "Program.cs", code: 'var builder = WebApplication.CreateBuilder(args);\nbuilder.Services.AddRadzenComponents();\nbuilder.Services.AddRazorComponents().AddInteractiveServerComponents();\nvar app = builder.Build();\napp.MapRazorComponents<App>().AddInteractiveServerRenderMode();\napp.Run();' }, { project: "MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n@using Radzen\n@using Radzen.Blazor\n\n<h1>Radzen Button Demo</h1>\n<RadzenButton Text="Click me" />' }] },
    "maui-xaml-label": { title: "MAUI XAML Label", files: [{ project: "MyMauiApp", file: "MainPage.xaml", code: '<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui">\n    <VerticalStackLayout Padding="30">\n        <Label Text="Hello from the article demo!" FontSize="28" />\n    </VerticalStackLayout>\n</ContentPage>' }] },
    "maui-stacklayout": { title: "MAUI VerticalStackLayout spacing", files: [{ project: "MyMauiApp", file: "MainPage.xaml", code: '<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui">\n    <VerticalStackLayout Padding="30" Spacing="20">\n        <Label Text="VerticalStackLayout" FontSize="28" />\n        <Label Text="First item" />\n        <Label Text="Second item" />\n        <Label Text="Third item" />\n    </VerticalStackLayout>\n</ContentPage>' }] },
    "maui-grid": { title: "MAUI Grid layout", files: [{ project: "MyMauiApp", file: "MainPage.xaml", code: '<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui">\n    <Grid Padding="20" RowDefinitions="Auto,Auto,Auto,Auto" ColumnDefinitions="120,*" RowSpacing="12" ColumnSpacing="12">\n        <Label Text="Name" Grid.Row="0" Grid.Column="0" />\n        <Entry Text="Dhilip" Grid.Row="0" Grid.Column="1" />\n        <Label Text="Age" Grid.Row="1" Grid.Column="0" />\n        <Entry Text="32" Grid.Row="1" Grid.Column="1" />\n        <Label Text="Department" Grid.Row="2" Grid.Column="0" />\n        <Entry Text="IT" Grid.Row="2" Grid.Column="1" />\n        <Button Text="Save" Grid.Row="3" Grid.ColumnSpan="2" />\n    </Grid>\n</ContentPage>' }] },
    "maui-vertical-stacklayout":{title:"MAUI VerticalStackLayout",description:"Arrange controls vertically with spacing and padding.",category:"MAUI Layouts",xaml:'<VerticalStackLayout Padding="20" Spacing="12"><Label Text="Vertical Stack Layout" FontSize="24" /><Label Text="Name" /><Entry Text="Dhilip" Placeholder="Enter name" /><Label Text="Age" /><Entry Text="32" Keyboard="Numeric" /><Label Text="Department" /><Entry Text="IT" Placeholder="Enter department" /><Button Text="Save" /></VerticalStackLayout>'},
    "maui-horizontal-stacklayout":{title:"MAUI HorizontalStackLayout",description:"Arrange controls horizontally with spacing and alignment.",category:"MAUI Layouts",xaml:'<HorizontalStackLayout Padding="20" Spacing="12"><Label Text="Actions:" VerticalOptions="Center" /><Button Text="Save" /><Button Text="Edit" /><Button Text="Delete" /></HorizontalStackLayout>'},
    "maui-scrollview":{title:"MAUI ScrollView",description:"Display long content in a vertically scrollable area.",category:"MAUI Layouts",xaml:'<ScrollView><VerticalStackLayout Padding="20" Spacing="12"><Label Text="ScrollView Demo" FontSize="24" /><Label Text="Scroll through this long list of content." FontSize="16" /><Label Text="Item 1 - Welcome to MAUI" /><Label Text="Item 2 - Layouts are reusable" /><Label Text="Item 3 - ScrollView handles long content" /><Label Text="Item 4 - Useful on mobile screens" /><Label Text="Item 5 - Keep scrolling" /><Label Text="Item 6 - Almost there" /><Label Text="Item 7 - You reached the bottom!" /><Button Text="Done" /></VerticalStackLayout></ScrollView>'},
    "maui-border":{title:"MAUI Border",files:[{project:"MyMauiApp",file:"MainPage.xaml",code:'<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"><Border Stroke="#0d6efd" StrokeThickness="2" StrokeShape="RoundRectangle 12" Padding="16"><VerticalStackLayout Spacing="8"><Label Text="MAUI Border Demo" FontSize="24" /><Label Text="This content is inside a bordered container." /><Button Text="Save" /></VerticalStackLayout></Border></ContentPage>'}]},
    "maui-label-styling": { title: "MAUI Label font sizes", files: [{ project: "MyMauiApp", file: "MainPage.xaml", code: '<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui">\n    <VerticalStackLayout Padding="30" Spacing="12">\n        <Label Text="Heading" FontSize="32" />\n        <Label Text="Subheading" FontSize="22" />\n        <Label Text="Normal body text" FontSize="16" />\n        <Label Text="Small helper text" FontSize="12" />\n    </VerticalStackLayout>\n</ContentPage>' }] },
    "razor-two-way-binding": { title: "Blazor two-way binding", files: [{ project: "MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n\n<h1>Two-way Binding</h1>\n<p>Edit the text below and the value updates automatically.</p>\n<input @bind="name" />\n<p>Hello, <strong>@name</strong>!</p>\n\n@code {\n    private string name = "Dhilip";\n}' }] },
    "razor-two-buttons": { title: "Blazor multiple event handlers", files: [{ project: "MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n\n<h1>Event Handlers</h1>\n<p>Current choice: <strong>@choice</strong></p>\n<button @onclick="ChooseFirst">Choose A</button>\n<button @onclick="ChooseSecond">Choose B</button>\n\n@code {\n    private string choice = "Nothing selected";\n\n    private void ChooseFirst()\n    {\n        choice = "A";\n    }\n\n    private void ChooseSecond()\n    {\n        choice = "B";\n    }\n}' }] },
    "razor-calculator": { title: "Blazor simple calculated value", files: [{ project: "MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n\n<h1>Calculated Value</h1>\n<p>Click the buttons to change the value.</p>\n<p>Value: <strong>@value</strong></p>\n<button @onclick="AddFive">Add 5</button>\n<button @onclick="SubtractTwo">Subtract 2</button>\n\n@code {\n    private int value = 10;\n\n    private void AddFive()\n    {\n        value += 5;\n    }\n\n    private void SubtractTwo()\n    {\n        value -= 2;\n    }\n}' }] },
    "razor-conditional-rendering": { title: "Razor conditional rendering", files: [{ project: "MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n\n<h1>Conditional Rendering</h1>\n<p>Click the button to show or hide content with <code>@if</code>.</p>\n<button @onclick="ToggleMessage">Toggle message</button>\n\n@if (showMessage)\n{\n    <p><strong>The message is visible.</strong></p>\n}\nelse\n{\n    <p>The message is hidden.</p>\n}\n\n@code {\n    private bool showMessage = true;\n\n    private void ToggleMessage()\n    {\n        showMessage = !showMessage;\n    }\n}' }] },
    "razor-list-rendering": { title: "Razor list rendering", files: [{ project: "MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n\n<h1>List Rendering</h1>\n<p>This list is rendered with <code>@foreach</code>.</p>\n<ul>\n@foreach (var item in items)\n{\n    <li>@item</li>\n}\n</ul>\n\n@code {\n    private string[] items = { "Apple", "Banana", "Orange" };\n}' }] },
    "razor-event-handling": { title: "Razor event handling", files: [{ project: "MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n\n<h1>Event Handling</h1>\n<p>Last action: <strong>@message</strong></p>\n<button @onclick="SayHello">Say Hello</button>\n<button @onclick="ResetMessage">Reset</button>\n\n@code {\n    private string message = "No action yet";\n\n    private void SayHello()\n    {\n        message = "Hello from @onclick!";\n    }\n\n    private void ResetMessage()\n    {\n        message = "No action yet";\n    }\n}' }] },
    "razor-component-parameters": { title: "Razor component parameters", files: [{ project: "MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n\n<h1>Component Parameters</h1>\n<p>A parent component passes a value to a child component with <code>[Parameter]</code>.</p>\n<div class="child-card">\n    <strong>Child component</strong>\n    <p>Hello, @name!</p>\n</div>\n\n@code {\n    private string name = "Dhilip";\n\n    // Child component example:\n    // [Parameter] public string Name { get; set; }\n}' }] },
    "razor-form-validation": { title: "Razor form validation", files: [{ project: "MyMauiApp.Web.Client", file: "Home.razor", code: '@page "/"\n\n<h1>Form Validation</h1>\n<EditForm Model="model" OnValidSubmit="Submit">\n    <DataAnnotationsValidator />\n    <InputText @bind-Value="model.Name" />\n    <ValidationMessage For="@(() => model.Name)" />\n    <button type="submit">Submit</button>\n</EditForm>\n\n@code {\n    private FormModel model = new();\n\n    private void Submit()\n    {\n        message = "Form submitted successfully.";\n    }\n\n    private string message = "Enter a name and submit.";\n\n    private class FormModel\n    {\n        [System.ComponentModel.DataAnnotations.Required]\n        public string Name { get; set; } = "";\n    }\n}' }] }
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

  function wireDemoInteractions() {
    var params = new URLSearchParams(window.location.search || "");
    var demoName = (params.get("demo") || "").toLowerCase().trim();
    var preview = document.getElementById("maui-browser-preview");
    if (!preview) return;

    if (demoName === "razor-routing") {
      var routingLink = preview.querySelector('.maui-browser-content a[href="/home"]');
      if (routingLink && !routingLink.__algolassiRoutingBound) {
        routingLink.__algolassiRoutingBound = true;
        routingLink.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopImmediatePropagation();
          var content = preview.querySelector(".maui-browser-content");
          if (!content) return;
          content.innerHTML = '<h2>Home Page</h2><p>This page was loaded by the playground router.</p><a href="/home">Reload Home</a>';
          wireDemoInteractions();
        }, true);
      }
    }

    if (demoName === "razor-two-way-binding") {
      var input = preview.querySelector("input");
      var valueNode = preview.querySelector("p strong");
      if (input && valueNode && !input.__algolassiBindingBound) {
        input.__algolassiBindingBound = true;
        input.value = valueNode.textContent.trim();
        input.addEventListener("input", function () {
          valueNode.textContent = input.value;
        });
      }
    }

    if (demoName === "razor-calculator") {
      var strong = preview.querySelector("p strong");
      var buttons = preview.querySelectorAll("button");
      if (!strong || buttons.length < 2 || buttons[0].__algolassiCalcBound) return;
      buttons[0].__algolassiCalcBound = true;
      buttons[1].__algolassiCalcBound = true;
      var value = Number(strong.textContent.trim()) || 0;
      buttons[0].addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        value += 5;
        strong.textContent = String(value);
      });
      buttons[1].addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        value -= 2;
        strong.textContent = String(value);
      });
    }

    if (demoName === "razor-conditional-rendering") {
      var content = preview.querySelector(".maui-browser-content");
      if (!content) return;
      content.innerHTML = '<h2>Conditional Rendering</h2><p>Click the button to show or hide content with <code>@if</code>.</p><button type="button" id="conditional-toggle">Hide message</button><p id="conditional-message"><strong>The message is visible.</strong></p>';
      var toggle = content.querySelector("#conditional-toggle");
      var message = content.querySelector("#conditional-message");
      if (!toggle || toggle.__algolassiConditionalBound) return;
      toggle.__algolassiConditionalBound = true;
      toggle.addEventListener("click", function () {
        var visible = message.style.display !== "none";
        message.style.display = visible ? "none" : "block";
        toggle.textContent = visible ? "Show message" : "Hide message";
      });
    }

    if (demoName === "razor-list-rendering") {
      var listContent = preview.querySelector(".maui-browser-content");
      if (!listContent) return;
      listContent.innerHTML = '<h2>List Rendering</h2><p>This list is rendered with <code>@foreach</code>.</p><ul id="demo-list"><li>Apple</li><li>Banana</li><li>Orange</li></ul><button type="button" id="list-add">Add item</button>';
      var items = ["Apple", "Banana", "Orange"];
      var addButton = listContent.querySelector("#list-add");
      if (!addButton || addButton.__algolassiListBound) return;
      addButton.__algolassiListBound = true;
      addButton.addEventListener("click", function () {
        items.push("Item " + (items.length + 1));
        listContent.querySelector("#demo-list").innerHTML = items.map(function (item) { return "<li>" + escDemo(item) + "</li>"; }).join("");
      });
    }

    if (demoName === "razor-event-handling") {
      var eventContent = preview.querySelector(".maui-browser-content");
      if (!eventContent) return;
      eventContent.innerHTML = '<h2>Event Handling</h2><p>Last action: <strong id="event-message">No action yet</strong></p><button type="button" id="event-hello">Say Hello</button> <button type="button" id="event-reset">Reset</button>';
      var eventMessage = eventContent.querySelector("#event-message");
      eventContent.querySelector("#event-hello").addEventListener("click", function () { eventMessage.textContent = "Hello from @onclick!"; });
      eventContent.querySelector("#event-reset").addEventListener("click", function () { eventMessage.textContent = "No action yet"; });
    }

    if (demoName === "razor-component-parameters") {
      var parameterContent = preview.querySelector(".maui-browser-content");
      if (!parameterContent) return;
      parameterContent.innerHTML = '<h2>Component Parameters</h2><p>A parent component passes a value to a child component with <code>[Parameter]</code>.</p><label>Parent value <input id="parameter-name" value="Dhilip"></label><div class="child-card" style="margin-top:12px;padding:12px;border:1px solid #ddd;border-radius:8px"><strong>Child component</strong><p>Hello, <strong id="child-name">Dhilip</strong>!</p></div>';
      var parameterInput = parameterContent.querySelector("#parameter-name");
      var childName = parameterContent.querySelector("#child-name");
      parameterInput.addEventListener("input", function () { childName.textContent = parameterInput.value || ""; });
    }

    if (demoName === "razor-form-validation") {
      var formContent = preview.querySelector(".maui-browser-content");
      if (!formContent) return;
      formContent.innerHTML = '<h2>Form Validation</h2><p>Enter a name. The field is required.</p><form id="demo-form"><input id="form-name" placeholder="Name"><button type="submit">Submit</button><p id="form-error" style="display:none">Name is required.</p><p id="form-success" style="display:none"><strong>Form submitted successfully.</strong></p></form>';
      var form = formContent.querySelector("#demo-form");
      var formName = formContent.querySelector("#form-name");
      var formError = formContent.querySelector("#form-error");
      var formSuccess = formContent.querySelector("#form-success");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        formError.style.display = formName.value.trim() ? "none" : "block";
        formSuccess.style.display = formName.value.trim() ? "block" : "none";
      });
    }
  }

  function escDemo(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function findFileLink(project, file) {
    var roots = document.querySelectorAll(".maui-project-tree > li");
    var expectedProject = String(project || "").replace(/^\d+\.\s*/, "").trim();
    for (var i = 0; i < roots.length; i++) {
      var strong = roots[i].querySelector(".maui-tree-folder-link strong");
      if (!strong) continue;
      var actualProject = strong.textContent.trim().replace(/^\d+\.\s*/, "").trim();
      if (actualProject !== expectedProject) continue;
      var links = roots[i].querySelectorAll(".maui-tree-link");
      for (var j = 0; j < links.length; j++) {
        var text = links[j].textContent.replace(/\s*\*\s*$/, "").trim();
        if (text === "📄 " + file || text === file) return links[j];
      }
    }
    return null;
  }

  function requestedFilesReady(demo) {
    var files = demo && demo.files || [];
    if (!files.length) return true;
    for (var i = 0; i < files.length; i++) {
      if (!findFileLink(files[i].project, files[i].file)) return false;
    }
    return true;
  }

  function loadFiles(demo, index, token) {
    if (token !== window.__algolassiMauiDemoLoadToken) return;
    var files = demo.files || [];
    if (index >= files.length) {
      var run = document.getElementById("maui-run-preview");
      if (run) run.click();
      var output = document.getElementById("maui-console-output");
      if (output) output.textContent = "Demo loaded: " + demo.title + "\n\nThe example was loaded automatically and Run Preview was clicked.";
      setTimeout(wireDemoInteractions, 50);
      return;
    }
    var item = files[index];
    var link = findFileLink(item.project, item.file);
    var editor = document.getElementById("maui-code-editor");
    var output = document.getElementById("maui-console-output");
    if (!link || !editor) {
      if (output) output.textContent = "Demo error: could not find " + item.project + " / " + item.file + ".";
      return;
    }
    link.click();
    setTimeout(function () {
      if (token !== window.__algolassiMauiDemoLoadToken) return;
      var currentEditor = document.getElementById("maui-code-editor");
      if (!currentEditor) return;
      currentEditor.value = item.code;
      currentEditor.dispatchEvent(new Event("input", { bubbles: true }));
      setTimeout(function () { loadFiles(demo, index + 1, token); }, 80);
    }, 120);
  }

  function loadDemo() {
    var params = new URLSearchParams(window.location.search || "");
    var demoName = (params.get("demo") || "").toLowerCase().trim();
    var demo = demos[demoName];
    if (!demo) return;

    var token = (window.__algolassiMauiDemoLoadToken || 0) + 1;
    window.__algolassiMauiDemoLoadToken = token;

    var attempts = 0;
    var timer = setInterval(function () {
      if (token !== window.__algolassiMauiDemoLoadToken) { clearInterval(timer); return; }
      attempts++;
      var editor = document.getElementById("maui-code-editor");
      var tree = document.querySelector(".maui-project-tree");
      var run = document.getElementById("maui-run-preview");
      if (!editor || !tree || !run) {
        if (attempts > 150) clearInterval(timer);
        return;
      }

      watchProjectLabels();

      // During SPA navigation the playground DOM can exist before its
      // JavaScript has rebuilt the file tree. Do not use the old/static
      // project-only tree as a signal that the new demo is ready.
      if (!requestedFilesReady(demo)) {
        if (attempts > 150) {
          clearInterval(timer);
          var waitingOutput = document.getElementById("maui-console-output");
          if (waitingOutput) waitingOutput.textContent = "Demo error: playground files did not finish loading for " + demo.title + ".";
        }
        return;
      }

      clearInterval(timer);
      loadFiles(demo, 0, token);
    }, 100);
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
    // The URL changes before the playground's replacement DOM is fully
    // rebuilt. Start a fresh demo load and let loadDemo() wait for the
    // requested file links rather than racing the previous tree.
    watchProjectLabels();
    loadDemo();
  });
})();
