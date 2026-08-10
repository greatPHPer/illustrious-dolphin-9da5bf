/* Algolassi MAUI Hybrid browser playground */
(function () {
  "use strict";

  var projects = {
    "1. MyMauiApp": {
      "MainPage.xaml":
        "<ContentPage xmlns=\"http://schemas.microsoft.com/dotnet/2021/maui\" xmlns:x=\"http://schemas.microsoft.com/winfx/2009/xaml\" x:Class=\"MyMauiApp.MainPage\">\n" +
        "    <VerticalStackLayout Padding=\"30\">\n" +
        "        <Label Text=\"Hello from MAUI Hybrid!\" FontSize=\"24\" />\n" +
        "    </VerticalStackLayout>\n" +
        "</ContentPage>",

      "MainPage.xaml.cs":
        "namespace MyMauiApp;\n\n" +
        "public partial class MainPage : ContentPage\n" +
        "{\n" +
        "    public MainPage() { InitializeComponent(); }\n" +
        "}",

      "MauiProgram.cs":
        "namespace MyMauiApp;\n\n" +
        "public static class MauiProgram\n" +
        "{\n" +
        "    public static MauiApp CreateMauiApp()\n" +
        "    {\n" +
        "        var builder = MauiApp.CreateBuilder();\n" +
        "        builder.UseMauiApp<App>();\n" +
        "        return builder.Build();\n" +
        "    }\n" +
        "}"
    },

    "2. MyMauiApp.Shared": {
      "Home.razor":
        "@page \"/home\"\n\n" +
        "<h1>Hello from Shared!</h1>\n" +
        "<p>This Home.razor belongs to the Shared project.</p>\n" +
        "<a href=\"/home\">Go Home</a>",

      "Models/AppMessage.cs":
        "namespace MyMauiApp.Shared.Models;\n\n" +
        "public record AppMessage(string Text);"
    },

    "3. MyMauiApp.Web": {
      "Program.cs":
        "var builder = WebApplication.CreateBuilder(args);\n" +
        "builder.Services.AddRazorComponents().AddInteractiveServerComponents();\n" +
        "var app = builder.Build();\n" +
        "app.MapRazorComponents<App>().AddInteractiveServerRenderMode();\n" +
        "app.Run();"
    },

    "4. MyMauiApp.Web.Client": {
      "Home.razor":
        "@page \"/\"\n\n" +
        "<h1>@message</h1>\n" +
        "<button @onclick=\"ChangeMessage\">Click Me</button>\n\n" +
        "@code {\n" +
        "    private string message = \"Hello from Web Client!\";\n" +
        "    private void ChangeMessage() => message = \"You clicked the button!\";\n" +
        "}"
    }
  };

  var installedPackages = {};
  var dirtyFiles = {};
  var componentState = {};
  var currentRenderContext = null;

  var packageRecipes = {
    "Radzen.Blazor": {
      project: "3. MyMauiApp.Web",
      registration: "builder.Services.AddRadzenComponents();",
      usings: ["@using Radzen", "@using Radzen.Blazor"],
      components: {
        RadzenButton: function (a, inner) {
          return (
            '<button class="playground-radzen-button">' +
            esc(inner || a.Text || "Radzen Button") +
            "</button>"
          );
        },

        RadzenTextBox: function (a) {
          return (
            '<input class="playground-radzen-input" placeholder="' +
            esc(a.Placeholder || "") +
            '" value="' +
            esc(a.Value || "") +
            '">'
          );
        },

        RadzenLabel: function (a, inner) {
          return (
            '<span class="playground-radzen-label">' +
            esc(inner || a.Text || "") +
            "</span>"
          );
        }
      }
    },

    "MudBlazor": {
      project: "3. MyMauiApp.Web",
      registration: "builder.Services.AddMudServices();",
      usings: ["@using MudBlazor"],
      components: {
        MudButton: function (a, inner) {
          return (
            '<button class="playground-mud-button">' +
            esc(inner || a.ChildContent || a.Text || "MudButton") +
            "</button>"
          );
        },

        MudTextField: function (a) {
          return (
            '<input class="playground-mud-input" placeholder="' +
            esc(a.Label || a.Placeholder || "") +
            '">'
          );
        }
      }
    },

    "Blazored.LocalStorage": {
      project: "3. MyMauiApp.Web",
      registration: "builder.Services.AddBlazoredLocalStorage();",
      usings: ["@using Blazored.LocalStorage"],
      components: {}
    },

    "Microsoft.Extensions.Http": {
      project: "3. MyMauiApp.Web",
      registration: "builder.Services.AddHttpClient();",
      usings: [],
      components: {}
    }
  };

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function start() {
    var currentProject = "1. MyMauiApp";
    var currentFile = "MainPage.xaml";

    var editor = document.getElementById("maui-code-editor");
    var output = document.getElementById("maui-console-output");
    var preview = document.getElementById("maui-browser-preview");
    var tabs = document.getElementById("maui-editor-tabs");
    var tree = document.querySelector(".maui-project-tree");

    if (!editor || !output || !preview || !tabs || !tree) {
      return;
    }

    addStyles();

    function fileKey(project, file) {
      return project + "::" + file;
    }

    function isDirty(project, file) {
      return !!dirtyFiles[fileKey(project, file)];
    }

    function markDirty(project, file) {
      dirtyFiles[fileKey(project, file)] = true;
    }

    function markClean(project, file) {
      delete dirtyFiles[fileKey(project, file)];
    }

    function files() {
      return projects[currentProject] || {};
    }

    function saveCurrentFile() {
      if (
        currentProject &&
        currentFile &&
        Object.prototype.hasOwnProperty.call(files(), currentFile)
      ) {
        files()[currentFile] = editor.value;
        markClean(currentProject, currentFile);
      }
    }

    function saveAllFiles() {
      if (
        currentProject &&
        currentFile &&
        Object.prototype.hasOwnProperty.call(files(), currentFile)
      ) {
        files()[currentFile] = editor.value;
      }

      dirtyFiles = {};

      renderTree();
      renderTabs();

      output.textContent =
        "Project saved successfully.\n\n" +
        "All modified files have been saved.";
    }

    function load(project, file) {
      currentProject = project;
      currentFile = file;

      editor.value =
        Object.prototype.hasOwnProperty.call(projects[project], file)
          ? projects[project][file]
          : "";

      editor.dataset.project = project;
      editor.dataset.file = file;
    }

    function renderTabs() {
      tabs.innerHTML = "";

      var names = Object.keys(files());

      if (names.indexOf(currentFile) < 0) {
        currentFile = names[0] || "";
      }

      names.forEach(function (name) {
        var b = document.createElement("button");

        b.type = "button";
        b.className =
          name === currentFile ? "active maui-editor-tab" : "maui-editor-tab";

        var label = document.createElement("span");
        label.textContent = name;

        b.appendChild(label);

        if (isDirty(currentProject, name)) {
          var star = document.createElement("span");
          star.className = "maui-file-dirty";
          star.textContent = " *";
          star.title = "Unsaved changes";
          b.appendChild(star);
        }

        b.onclick = function (e) {
          e.preventDefault();

          saveCurrentFile();

          load(currentProject, name);

          renderTabs();
          renderTree();
          render();
        };

        tabs.appendChild(b);
      });
    }

    function addFile(project) {
      var name = prompt("New file name", "NewFile.razor");

      if (!name) {
        return;
      }

      name = name.trim();

      if (!name) {
        return;
      }

      if (projects[project][name] !== undefined) {
        alert("That file already exists.");
        return;
      }

      saveCurrentFile();

      projects[project][name] = "";

      load(project, name);

      markDirty(project, name);

      renderTree();
      renderTabs();
      render();
    }

    function renderTree() {
      tree.innerHTML = "";

      Object.keys(projects).forEach(function (project) {
        var root = document.createElement("li");

        var row = document.createElement("div");
        row.className = "maui-tree-folder-row";

        var folder = document.createElement("a");
        folder.href = "#";
        folder.className =
          "maui-tree-link maui-tree-folder-link";

        folder.innerHTML =
          "▾ 📁 <strong>" + esc(project) + "</strong>";

        var plus = document.createElement("a");
        plus.href = "#";
        plus.className =
          "maui-tree-link maui-tree-add-link";

        plus.textContent = "+";
        plus.title = "Add file";

        row.append(folder, plus);

        var ul = document.createElement("ul");
        ul.className = "maui-tree-children";

        root.append(row, ul);

        Object.keys(projects[project]).forEach(function (path) {
          var li = document.createElement("li");

          var a = document.createElement("a");

          a.href = "#";
          a.className = "maui-tree-link";

          if (
            project === currentProject &&
            path === currentFile
          ) {
            a.classList.add("active");
          }

          var fileText = document.createElement("span");
          fileText.textContent = "📄 " + path;

          a.appendChild(fileText);

          if (isDirty(project, path)) {
            var star = document.createElement("span");
            star.className = "maui-file-dirty";
            star.textContent = " *";
            star.title = "Unsaved changes";
            a.appendChild(star);
          }

          a.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();

            saveCurrentFile();

            load(project, path);

            renderTree();
            renderTabs();
            render();
          };

          li.appendChild(a);
          ul.appendChild(li);
        });

        plus.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();

          addFile(project);
        };

        folder.onclick = function (e) {
          e.preventDefault();

          saveCurrentFile();

          currentProject = project;

          currentFile =
            Object.keys(projects[project])[0] || "";

          load(currentProject, currentFile);

          renderTabs();
          renderTree();
          render();
        };

        tree.appendChild(root);
      });
    }

    function attrs(s) {
      var a = {};
      var r = /([:@\w-]+)\s*=\s*["']([^"']*)["']/g;
      var m;

      while ((m = r.exec(s))) {
        a[m[1]] = m[2];
      }

      return a;
    }

    function extractCodeBlock(source) {
      var match = source.match(
        /@code\s*\{([\s\S]*)\}\s*$/i
      );

      return match ? match[1] : "";
    }

    function removeCodeBlock(source) {
      return source.replace(
        /@code\s*\{([\s\S]*)\}\s*$/i,
        ""
      );
    }

    function getStateKey(project, file) {
      return project + "::" + file;
    }

    function createRuntimeState(project, file, code) {
      var key = getStateKey(project, file);

      if (!componentState[key]) {
        componentState[key] = {};
      }

      var state = componentState[key];

      /*
       * Supports simple declarations such as:
       *
       * private string a { get; set; }
       * private string a = "hello";
       * private int count = 0;
       * private bool visible = true;
       */
      var propertyRegex =
        /(?:private|public|protected|internal)?\s*(?:static\s+)?([\w<>?]+)\s+(\w+)\s*\{\s*get\s*;\s*set\s*;\s*\}/g;

      var propertyMatch;

      while ((propertyMatch = propertyRegex.exec(code))) {
        var propertyName = propertyMatch[2];

        if (!Object.prototype.hasOwnProperty.call(state, propertyName)) {
          state[propertyName] = defaultValueForType(
            propertyMatch[1]
          );
        }
      }

      /*
       * Supports:
       *
       * private string a = "123";
       * private int count = 0;
       * private bool enabled = true;
       */
      var fieldRegex =
        /(?:private|public|protected|internal)?\s*(?:static\s+)?([\w<>?]+)\s+(\w+)\s*=\s*([^;]+);/g;

      var fieldMatch;

      while ((fieldMatch = fieldRegex.exec(code))) {
        var fieldName = fieldMatch[2];

        if (!Object.prototype.hasOwnProperty.call(state, fieldName)) {
          state[fieldName] = parseLiteral(
            fieldMatch[3].trim()
          );
        }
      }

      return state;
    }

    function defaultValueForType(type) {
      switch (String(type).toLowerCase()) {
        case "string":
          return "";

        case "int":
        case "long":
        case "short":
        case "double":
        case "float":
        case "decimal":
          return 0;

        case "bool":
          return false;

        default:
          return null;
      }
    }

    function parseLiteral(value) {
      value = value.trim();

      if (
        (value.charAt(0) === '"' &&
          value.charAt(value.length - 1) === '"') ||
        (value.charAt(0) === "'" &&
          value.charAt(value.length - 1) === "'")
      ) {
        return value.substring(1, value.length - 1);
      }

      if (value === "true") {
        return true;
      }

      if (value === "false") {
        return false;
      }

      if (value === "null") {
        return null;
      }

      var n = Number(value);

      if (!isNaN(n)) {
        return n;
      }

      return value;
    }

    function getInterpolatedValue(expression, state) {
      expression = expression.trim();

      if (
        Object.prototype.hasOwnProperty.call(state, expression)
      ) {
        return state[expression];
      }

      /*
       * Basic property access:
       *
       * @user.Name
       */
      var parts = expression.split(".");

      if (
        parts.length > 1 &&
        Object.prototype.hasOwnProperty.call(state, parts[0])
      ) {
        var value = state[parts[0]];

        for (var i = 1; i < parts.length; i++) {
          if (value == null) {
            return "";
          }

          value = value[parts[i]];
        }

        return value;
      }

      return "";
    }

    function applySimpleMethod(methodBody, state) {
      /*
       * Supports simple assignments:
       *
       * a = "123";
       * count = count + 1;
       * count++;
       * count--;
       * visible = true;
       */

      var statements = methodBody
        .split(";")
        .map(function (x) {
          return x.trim();
        })
        .filter(Boolean);

      statements.forEach(function (statement) {
        var incrementMatch = statement.match(
          /^(\w+)\s*(\+\+|--)$/
        );

        if (incrementMatch) {
          var variable = incrementMatch[1];

          if (
            Object.prototype.hasOwnProperty.call(
              state,
              variable
            )
          ) {
            state[variable] =
              Number(state[variable] || 0) +
              (incrementMatch[2] === "++" ? 1 : -1);
          }

          return;
        }

        var assignmentMatch = statement.match(
          /^(\w+)\s*=\s*(.+)$/
        );

        if (!assignmentMatch) {
          return;
        }

        var target = assignmentMatch[1];
        var expression = assignmentMatch[2].trim();

        if (
          !Object.prototype.hasOwnProperty.call(
            state,
            target
          )
        ) {
          return;
        }

        /*
         * Handle:
         *
         * a = "123"
         * count = count + 1
         * count = count - 1
         */
        var arithmetic = expression.match(
          /^(\w+)\s*([+-])\s*(\d+)$/
        );

        if (arithmetic) {
          var base =
            Number(
              Object.prototype.hasOwnProperty.call(
                state,
                arithmetic[1]
              )
                ? state[arithmetic[1]]
                : 0
            ) || 0;

          var amount = Number(arithmetic[3]);

          state[target] =
            arithmetic[2] === "+"
              ? base + amount
              : base - amount;

          return;
        }

        state[target] = parseLiteral(expression);
      });
    }

    function findMethod(code, methodName) {
      /*
       * Supports:
       *
       * private void setA()
       * private async Task setA()
       * void setA()
       * async Task setA()
       */
      var escaped = methodName.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      var regex = new RegExp(
        "(?:private|public|protected|internal)?\\s*" +
          "(?:static\\s+)?" +
          "(?:async\\s+)?" +
          "(?:Task(?:<[^>]+>)?|void|[\\w<>?]+)\\s+" +
          escaped +
          "\\s*\\([^)]*\\)\\s*" +
          "\\{([\\s\\S]*?)\\}",
        "m"
      );

      var match = code.match(regex);

      return match ? match[1] : null;
    }

    function executeMethod(project, file, methodName) {
      var source = projects[project][file] || "";
      var code = extractCodeBlock(source);

      var state = createRuntimeState(
        project,
        file,
        code
      );

      var body = findMethod(code, methodName);

      if (body === null) {
        output.textContent =
          "Runtime error:\n\n" +
          "Method '" +
          methodName +
          "' was not found in @code.";
        return;
      }

      try {
        applySimpleMethod(body, state);

        currentRenderContext = {
          project: project,
          file: file,
          state: state
        };

        render();

        output.textContent =
          "Event executed successfully.\n\n" +
          "Method: " +
          methodName;
      } catch (error) {
        output.textContent =
          "Runtime error:\n\n" +
          error.message;
      }
    }

    function renderComponents(source) {
      var out = "";

      Object.keys(packageRecipes).forEach(function (id) {
        var recipe = packageRecipes[id];

        if (!installedPackages[id]) {
          return;
        }

        Object.keys(recipe.components).forEach(
          function (component) {
            var regex = new RegExp(
              "<" +
                component +
                "\\b([^>]*)>([\\s\\S]*?)<\\/" +
                component +
                ">|<" +
                component +
                "\\b([^>]*)\\/>",
              "gi"
            );

            var match;

            while ((match = regex.exec(source))) {
              var attributeText =
                match[1] || match[3] || "";

              var inner =
                match[2] || "";

              out += recipe.components[
                component
              ](
                attrs(attributeText),
                stripMarkup(inner)
              );
            }
          }
        );
      });

      return out;
    }

    function stripMarkup(value) {
      return String(value || "")
        .replace(/<[^>]+>/g, "")
        .trim();
    }

    function renderRazorMarkup(
      source,
      project,
      file
    ) {
      var code = extractCodeBlock(source);
      var markup = removeCodeBlock(source);

      var state = createRuntimeState(
        project,
        file,
        code
      );

      currentRenderContext = {
        project: project,
        file: file,
        state: state
      };

      /*
       * @variable interpolation
       */
      markup = markup.replace(
        /@([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)/g,
        function (full, expression) {
          return esc(
            getInterpolatedValue(
              expression,
              state
            )
          );
        }
      );

      /*
       * Convert @onclick="MethodName"
       * into a playground event marker.
       */
      markup = markup.replace(
        /@onclick\s*=\s*"([^"]+)"/gi,
        function (full, method) {
          return (
            'data-playground-onclick="' +
            esc(method.trim()) +
            '"'
          );
        }
      );

      /*
       * Render known installed components.
       */
      var components =
        renderComponents(markup);

      /*
       * Remove component markup from the normal
       * HTML path after rendering the known components.
       */
      Object.keys(packageRecipes).forEach(
        function (id) {
          if (!installedPackages[id]) {
            return;
          }

          Object.keys(
            packageRecipes[id].components
          ).forEach(function (component) {
            var regex = new RegExp(
              "<" +
                component +
                "\\b[^>]*(?:>[\\s\\S]*?<\\/" +
                component +
                ">|\\/>)",
              "gi"
            );

            markup = markup.replace(regex, "");
          });
        }
      );

      /*
       * Keep normal HTML markup.
       */
      var html = markup;

      /*
       * If there are component outputs,
       * append them where appropriate.
       */
      if (components) {
        html += components;
      }

      /*
       * Convert Blazor buttons to regular HTML buttons
       * while preserving the onclick runtime marker.
       */
      html = html.replace(
        /<button\b([^>]*)>([\s\S]*?)<\/button>/gi,
        function (full, attributes, inner) {
          return (
            "<button " +
            attributes +
            ">" +
            inner +
            "</button>"
          );
        }
      );

      return html;
    }

    function razorPage(s) {
      var routeMatch = s.match(
        /@page\s+["']([^"']+)["']/i
      );

      var route =
        routeMatch && routeMatch[1]
          ? routeMatch[1]
          : "/";

      return {
        route: route,
        html: renderRazorMarkup(
          s,
          currentProject,
          currentFile
        )
      };
    }

    function findRoute(path) {
      var found = null;

      Object.keys(projects).some(
        function (project) {
          return Object.keys(
            projects[project]
          ).some(function (file) {
            if (!/\.razor$/i.test(file)) {
              return false;
            }

            var page =
              razorPage(
                projects[project][file]
              );

            if (page.route === path) {
              found = {
                project: project,
                file: file
              };

              return true;
            }

            return false;
          });
        }
      );

      return found;
    }

    function route(path) {
      var target = findRoute(path);

      if (!target) {
        return;
      }

      saveCurrentFile();

      load(
        target.project,
        target.file
      );

      renderTree();
      renderTabs();
      render();
    }

    function xaml(s) {
      var out = [];

      var regex =
        /<Label\b([^>]*?)(?:\/?>)/gi;

      var match;

      while ((match = regex.exec(s))) {
        var textMatch =
          match[1].match(
            /\bText\s*=\s*["']([^"']*)["']/i
          );

        var fontMatch =
          match[1].match(
            /\bFontSize\s*=\s*["']([^"']*)["']/i
          );

        if (textMatch) {
          out.push(
            '<div style="font-size:' +
              (fontMatch
                ? parseFloat(fontMatch[1])
                : 16) +
              'px;margin-bottom:16px">' +
              esc(textMatch[1]) +
              "</div>"
          );
        }
      }

      return (
        out.join("") ||
        "<p>No previewable Label was found.</p>"
      );
    }

    function packageReference(
      id,
      version,
      project
    ) {
      if (!projects[project]) {
        return;
      }

      var name =
        project.split(".").pop() +
        ".csproj";

      var file =
        projects[project][name] ||
        '<Project Sdk="Microsoft.NET.Sdk.Web">\n' +
        "  <PropertyGroup>\n" +
        "    <TargetFramework>net9.0</TargetFramework>\n" +
        "  </PropertyGroup>\n" +
        "</Project>";

      if (
        file.indexOf(
          'PackageReference Include="' +
            id +
            '"'
        ) < 0
      ) {
        file = file.replace(
          /<\/Project>\s*$/,
          "  <ItemGroup>\n" +
            '    <PackageReference Include="' +
            id +
            '" Version="' +
            (version || "latest") +
            '" />\n" +
            "  </ItemGroup>\n" +
            "</Project>"
        );
      }

      projects[project][name] = file;

      markDirty(project, name);
    }

    function applyRecipe(id, version) {
      var recipe = packageRecipes[id];

      if (!recipe) {
        packageReference(
          id,
          version,
          "3. MyMauiApp.Web"
        );

        return null;
      }

      packageReference(
        id,
        version,
        recipe.project
      );

      var program =
        projects[recipe.project][
          "Program.cs"
        ] || "";

      if (
        recipe.registration &&
        program.indexOf(recipe.registration) < 0
      ) {
        var marker = "var app =";
        var position =
          program.indexOf(marker);

        if (position >= 0) {
          program =
            program.slice(0, position) +
            recipe.registration +
            "\n" +
            program.slice(position);
        } else {
          program +=
            "\n" +
            recipe.registration +
            "\n";
        }

        projects[recipe.project][
          "Program.cs"
        ] = program;

        markDirty(
          recipe.project,
          "Program.cs"
        );
      }

      return recipe;
    }

    function installPackage(
      pkg,
      button
    ) {
      if (installedPackages[pkg.id]) {
        return;
      }

      installedPackages[pkg.id] = pkg;

      var recipe = applyRecipe(
        pkg.id,
        pkg.version
      );

      button.textContent = "Installed";
      button.classList.add("installed");
      button.onclick = null;

      renderTree();
      renderTabs();
      render();

      output.textContent =
        "NuGet package installed: " +
        pkg.id +
        (
          recipe
            ? "\nTarget project: " +
              recipe.project +
              "\nProgram.cs: " +
              recipe.registration
            : "\nNo package-specific setup recipe is registered yet; PackageReference was added to Web."
        );
    }

    function setupNuget() {
      if (
        document.getElementById(
          "maui-nuget-panel"
        )
      ) {
        return;
      }

      var host =
        tree.parentElement ||
        tree.parentNode;

      var panel =
        document.createElement("section");

      var toggle =
        document.createElement("a");

      panel.id =
        "maui-nuget-panel";

      panel.innerHTML =
        '<div class="maui-nuget-title">' +
        "<strong>📦 NuGet</strong> " +
        '<a href="#" id="maui-nuget-close">Hide</a>' +
        "</div>" +
        '<div class="maui-nuget-search-row">' +
        '<input id="maui-nuget-query" type="search" placeholder="Search NuGet packages…" autocomplete="off">' +
        '<a href="#" id="maui-nuget-search-btn">Search</a>' +
        "</div>" +
        '<div id="maui-nuget-status"></div>' +
        '<div id="maui-nuget-results"></div>';

      panel.style.cssText =
        "display:none;margin-top:12px;padding:10px;font-size:.9rem";

      toggle.href = "#";
      toggle.id =
        "maui-nuget-toggle";
      toggle.textContent =
        "📦 NuGet";

      toggle.style.cssText =
        "display:block;margin:8px 0;padding:4px 2px;text-decoration:none";

      host.insertBefore(
        toggle,
        tree
      );

      host.insertBefore(
        panel,
        tree
      );

      var q =
        panel.querySelector(
          "#maui-nuget-query"
        );

      var results =
        panel.querySelector(
          "#maui-nuget-results"
        );

      var status =
        panel.querySelector(
          "#maui-nuget-status"
        );

      function search() {
        var term =
          q.value.trim();

        if (!term) {
          status.textContent =
            "Enter a package name.";

          results.innerHTML = "";

          return;
        }

        status.textContent =
          "Searching NuGet.org…";

        results.innerHTML = "";

        fetch(
          "https://azuresearch-usnc.nuget.org/query?q=" +
            encodeURIComponent(term) +
            "&prerelease=false&take=20"
        )
          .then(function (r) {
            if (!r.ok) {
              throw new Error(
                "NuGet search failed"
              );
            }

            return r.json();
          })
          .then(function (data) {
            var items =
              data.data || [];

            status.textContent =
              items.length +
              " package" +
              (items.length === 1
                ? ""
                : "s") +
              " found";

            results.innerHTML =
              items
                .map(function (p) {
                  var recipe =
                    packageRecipes[p.id];

                  var installed =
                    !!installedPackages[
                      p.id
                    ];

                  return (
                    '<div class="maui-nuget-result">' +
                    '<div class="maui-nuget-result-head">' +
                    "<strong>" +
                    esc(p.id || "") +
                    "</strong>" +
                    '<a href="#" class="maui-nuget-install ' +
                    (installed
                      ? "installed"
                      : "") +
                    '" data-id="' +
                    esc(p.id || "") +
                    '">' +
                    (installed
                      ? "Installed"
                      : "Install") +
                    "</a>" +
                    "</div>" +
                    "<div>" +
                    esc(
                      p.description ||
                        "No description available."
                    ) +
                    "</div>" +
                    "<small>v" +
                    esc(
                      p.version || ""
                    ) +
                    " · Downloads: " +
                    Number(
                      p.totalDownloads || 0
                    ).toLocaleString() +
                    "</small>" +
                    (
                      recipe
                        ? '<div class="maui-package-setup">' +
                          "✓ Package-specific setup available<br>" +
                          "Program.cs: <code>" +
                          esc(
                            recipe.registration ||
                              "None"
                          ) +
                          "</code><br>" +
                          "Target: " +
                          esc(
                            recipe.project
                          ) +
                          "</div>"
                        : ""
                    ) +
                    "</div>"
                  );
                })
                .join("") ||
              "<div>No packages found.</div>";

            results
              .querySelectorAll(
                ".maui-nuget-install"
              )
              .forEach(function (button) {
                button.onclick =
                  function (e) {
                    e.preventDefault();

                    var pkg =
                      items.find(
                        function (p) {
                          return (
                            p.id ===
                            button.dataset
                              .id
                          );
                        }
                      );

                    if (pkg) {
                      installPackage(
                        pkg,
                        button
                      );
                    }
                  };
              });
          })
          .catch(function () {
            status.textContent =
              "NuGet search is unavailable right now.";

            results.innerHTML =
              "<div>Could not reach NuGet.org.</div>";
          });
      }

      toggle.onclick = function (e) {
        e.preventDefault();

        panel.style.display =
          panel.style.display === "none"
            ? "block"
            : "none";

        if (
          panel.style.display !==
          "none"
        ) {
          q.focus();
        }
      };

      panel.querySelector(
        "#maui-nuget-close"
      ).onclick = function (e) {
        e.preventDefault();

        panel.style.display =
          "none";
      };

      panel.querySelector(
        "#maui-nuget-search-btn"
      ).onclick = function (e) {
        e.preventDefault();

        search();
      };

      q.onkeydown = function (e) {
        if (e.key === "Enter") {
          e.preventDefault();

          search();
        }
      };
    }

    function render() {
      saveCurrentFile();

      var body;

      if (
        currentProject ===
          "1. MyMauiApp" &&
        currentFile ===
          "MainPage.xaml"
      ) {
        body = xaml(
          files()[currentFile]
        );
      } else if (
        /\.razor$/i.test(
          currentFile
        )
      ) {
        body =
          razorPage(
            files()[currentFile]
          ).html;
      } else {
        body =
          "<p>This source file is editable but has no browser renderer yet.</p>";
      }

      preview.innerHTML =
        '<div class="maui-browser-toolbar">' +
        "<span>●</span>" +
        "<span>●</span>" +
        "<span>●</span>" +
        "<code>https://preview.algolassi.local/</code>" +
        "</div>" +
        '<div class="maui-browser-content">' +
        body +
        "</div>";

      /*
       * Handle normal playground navigation.
       */
      preview
        .querySelectorAll(
          "a[data-playground-route]"
        )
        .forEach(function (a) {
          a.addEventListener(
            "click",
            function (e) {
              var href =
                a.getAttribute(
                  "href"
                );

              if (
                href &&
                href.charAt(0) === "/"
              ) {
                e.preventDefault();

                route(href);
              }
            }
          );
        });

      /*
       * Handle @onclick.
       */
      preview
        .querySelectorAll(
          "[data-playground-onclick]"
        )
        .forEach(function (element) {
          element.addEventListener(
            "click",
            function (e) {
              e.preventDefault();

              var method =
                element.getAttribute(
                  "data-playground-onclick"
                );

              executeMethod(
                currentProject,
                currentFile,
                method
              );
            }
          );
        });

      output.textContent =
        "Preview refreshed.\n\n" +
        "Current file: " +
        currentProject +
        " / " +
        currentFile;
    }

    function addStyles() {
      if (
        document.getElementById(
          "maui-playground-runtime-style"
        )
      ) {
        return;
      }

      var st =
        document.createElement("style");

      st.id =
        "maui-playground-runtime-style";

      st.textContent =
        ".maui-project-tree li{list-style:none;margin:0;padding:0}" +
        ".maui-project-tree ul{list-style:none}" +
        ".maui-project-tree .maui-tree-link{display:block;width:100%;box-sizing:border-box;border:0;background:transparent;color:inherit;text-decoration:none;text-align:left;font:inherit;cursor:pointer;padding:4px 8px;border-radius:4px;line-height:1.35}" +
        ".maui-project-tree .maui-tree-link:hover{background:rgba(127,127,127,.12)}" +
        ".maui-project-tree .maui-tree-link.active{background:rgba(0,120,212,.16)}" +
        ".maui-project-tree .maui-tree-folder-row{display:flex;align-items:center;gap:2px}" +
        ".maui-project-tree .maui-tree-folder-link{flex:1;font-weight:600}" +
        ".maui-project-tree .maui-tree-add-link{width:auto;flex:0 0 auto;padding:2px 7px;opacity:.65}" +
        ".maui-project-tree .maui-tree-children{margin:0;padding-left:14px}" +

        ".maui-file-dirty{font-weight:700;margin-left:3px}" +

        ".maui-nuget-result{padding:10px 0;border-bottom:1px solid rgba(127,127,127,.18)}" +
        ".maui-nuget-result-head{display:flex;align-items:center;justify-content:space-between;gap:8px}" +
        ".maui-nuget-install{display:inline-block;border:1px solid rgba(127,127,127,.45);border-radius:4px;padding:3px 9px;text-decoration:none;font-size:.85em;cursor:pointer;background:transparent;color:inherit}" +
        ".maui-nuget-install:hover{background:rgba(0,120,212,.12)}" +
        ".maui-nuget-install.installed{opacity:.7;cursor:default}" +
        ".maui-package-setup{margin-top:7px;padding:7px;border-left:3px solid rgba(0,120,212,.55);font-size:.85em}" +

        ".playground-radzen-button,.playground-mud-button{padding:8px 16px;border-radius:4px;color:#fff;cursor:pointer}" +
        ".playground-radzen-button{border:1px solid #1677ff;background:#1677ff}" +
        ".playground-mud-button{border:1px solid #594ae2;background:#594ae2}" +
        ".playground-radzen-input,.playground-mud-input{padding:8px 10px;border:1px solid #aaa;border-radius:4px}" +
        ".playground-radzen-label{display:inline-block;padding:4px 0}" +

        "#maui-nuget-results{max-height:420px;overflow-y:auto;overflow-x:hidden;padding-right:6px;scrollbar-width:thin}" +
        "#maui-nuget-results::-webkit-scrollbar{width:8px}" +
        "#maui-nuget-results::-webkit-scrollbar-thumb{border-radius:8px;background:rgba(127,127,127,.45)}" +
        "#maui-nuget-results::-webkit-scrollbar-track{background:transparent}" +

        ".maui-browser-content button{cursor:pointer}" +
        ".maui-browser-content [data-playground-onclick]{cursor:pointer}";

      document.head.appendChild(st);
    }

    var run =
      document.getElementById(
        "maui-run-preview"
      );

    var create =
      document.getElementById(
        "maui-create-project"
      );

    var saveButton =
      document.getElementById(
        "maui-save-project"
      );

    /*
     * Run Preview
     */
    if (run) {
      run.onclick = function () {
        saveCurrentFile();

        renderTree();
        renderTabs();

        render();
      };
    }

    /*
     * Save Project
     */
    if (saveButton) {
      saveButton.onclick =
        function () {
          saveAllFiles();
        };
    }

    /*
     * Create/reset playground project.
     */
    if (create) {
      create.onclick =
        function () {
          saveCurrentFile();

          load(
            "1. MyMauiApp",
            "MainPage.xaml"
          );

          renderTree();
          renderTabs();
          render();
        };
    }

    /*
     * IMPORTANT:
     *
     * Do NOT save immediately on every keystroke.
     *
     * This is what allows the * indicator to remain
     * until the user presses Save.
     */
    editor.oninput =
      function () {
        if (
          currentProject &&
          currentFile
        ) {
          markDirty(
            currentProject,
            currentFile
          );
        }

        renderTree();
        renderTabs();

        output.textContent =
          "Unsaved changes in " +
          currentProject +
          " / " +
          currentFile +
          ".\n\nClick Save to save the project or Run Preview to test the current code.";
      };

    /*
     * Initial state
     */
    load(
      currentProject,
      currentFile
    );

    renderTree();
    renderTabs();
    setupNuget();
    render();
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      start
    );
  } else {
    start();
  }
})();
