/* Algolassi MAUI Hybrid browser playground */
(function () {
  "use strict";

  var projects = {
    "1. MyMauiApp": {
      "MainPage.xaml": '<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"><VerticalStackLayout Padding="30"><Label Text="Hello from MAUI Hybrid!" FontSize="24" /></VerticalStackLayout></ContentPage>',
      "MainPage.xaml.cs": 'namespace MyMauiApp;\n\npublic partial class MainPage : ContentPage\n{\n    public MainPage() { InitializeComponent(); }\n}',
      "MauiProgram.cs": 'namespace MyMauiApp;\n\npublic static class MauiProgram\n{\n    public static MauiApp CreateMauiApp()\n    {\n        var builder = MauiApp.CreateBuilder();\n        builder.UseMauiApp<App>();\n        return builder.Build();\n    }\n}'
    },
    "2. MyMauiApp.Shared": {
      "Home.razor": '@page "/home"\n\n<h1>Hello from Shared!</h1>\n<p>This Home.razor belongs to the Shared project.</p>\n<a href="/home">Go Home</a>',
      "Models/AppMessage.cs": 'namespace MyMauiApp.Shared.Models;\n\npublic record AppMessage(string Text);'
    },
    "3. MyMauiApp.Web": {
      "Program.cs": 'var builder = WebApplication.CreateBuilder(args);\nbuilder.Services.AddRazorComponents().AddInteractiveServerComponents();\nvar app = builder.Build();\napp.MapRazorComponents<App>().AddInteractiveServerRenderMode();\napp.Run();'
    },
    "4. MyMauiApp.Web.Client": {
      "Home.razor": '@page "/"\n\n<h1>@message</h1>\n<button @onclick="ChangeMessage">Click Me</button>\n\n@code {\n    private string message = "Hello from Web Client!";\n    private void ChangeMessage() => message = "You clicked the button!";\n}'
    }
  };

  var installedPackages = {};
  var dirtyFiles = {};
  var componentState = {};
  var packageRecipes = {
    "Radzen.Blazor": {
      project: "3. MyMauiApp.Web",
      registration: "builder.Services.AddRadzenComponents();",
      components: {
        RadzenButton: function (a, inner) { return '<button class="playground-radzen-button"' + clickAttr(a) + '>' + esc(inner || a.Text || "Radzen Button") + '</button>'; },
        RadzenTextBox: function (a) { return '<input class="playground-radzen-input" placeholder="' + esc(a.Placeholder || "") + '" value="' + esc(a.Value || "") + '">'; },
        RadzenLabel: function (a, inner) { return '<span class="playground-radzen-label">' + esc(inner || a.Text || "") + '</span>'; }
      }
    },
    "MudBlazor": {
      project: "3. MyMauiApp.Web",
      registration: "builder.Services.AddMudServices();",
      components: {
        MudButton: function (a, inner) { return '<button class="playground-mud-button"' + clickAttr(a) + '>' + esc(inner || a.Text || "MudButton") + '</button>'; },
        MudTextField: function (a) { return '<input class="playground-mud-input" placeholder="' + esc(a.Label || a.Placeholder || "") + '">'; }
      }
    },
    "Blazored.LocalStorage": {
      project: "3. MyMauiApp.Web",
      registration: "builder.Services.AddBlazoredLocalStorage();",
      components: {}
    },
    "Microsoft.Extensions.Http": {
      project: "3. MyMauiApp.Web",
      registration: "builder.Services.AddHttpClient();",
      components: {}
    }
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function clickAttr(a) {
    var n = a["@onclick"] || a.onclick || "";
    return n ? ' data-playground-click="' + esc(n) + '"' : "";
  }

  function start() {
    var currentProject = "1. MyMauiApp";
    var currentFile = "MainPage.xaml";
    var editor = document.getElementById("maui-code-editor");
    var output = document.getElementById("maui-console-output");
    var preview = document.getElementById("maui-browser-preview");
    var tabs = document.getElementById("maui-editor-tabs");
    var tree = document.querySelector(".maui-project-tree");
    var run = document.getElementById("maui-run-preview");
    var create = document.getElementById("maui-create-project");

    if (!editor || !output || !preview || !tabs || !tree) return;

    addStyles();
    setupNuget();
    addSaveButton();

    function fileMap(project) { return projects[project || currentProject] || {}; }
    function fileKey(project, file) { return project + "::" + file; }
    function isDirty(project, file) { return !!dirtyFiles[fileKey(project, file)]; }

    function syncEditor() {
      if (currentProject && currentFile && Object.prototype.hasOwnProperty.call(fileMap(), currentFile)) {
        fileMap()[currentFile] = editor.value;
      }
    }

    function load(project, file) {
      if (!projects[project] || !Object.prototype.hasOwnProperty.call(projects[project], file)) return;
      currentProject = project;
      currentFile = file;
      editor.value = projects[project][file];
      editor.dataset.project = project;
      editor.dataset.file = file;
    }

    function markDirty() {
      dirtyFiles[fileKey(currentProject, currentFile)] = true;
      renderTree();
      renderTabs();
    }

    function saveCurrentView() {
      syncEditor();
      renderTree();
      renderTabs();
    }

    function saveProject() {
      syncEditor();
      dirtyFiles = {};
      renderTree();
      renderTabs();
      output.textContent = "Project saved successfully.\n\nAll modified files are now saved.";
    }

    function renderTabs() {
      tabs.innerHTML = "";
      Object.keys(fileMap()).forEach(function (name) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "maui-editor-tab" + (name === currentFile ? " active" : "");
        button.appendChild(document.createTextNode(name));
        if (isDirty(currentProject, name)) {
          var star = document.createElement("span");
          star.className = "maui-file-dirty";
          star.textContent = " *";
          button.appendChild(star);
        }
        button.onclick = function (e) {
          e.preventDefault();
          saveCurrentView();
          load(currentProject, name);
          renderTree();
          renderTabs();
          render();
        };
        tabs.appendChild(button);
      });
    }

    function renderTree() {
      tree.innerHTML = "";
      Object.keys(projects).forEach(function (project) {
        var root = document.createElement("li");
        var row = document.createElement("div");
        var folder = document.createElement("a");
        var plus = document.createElement("a");
        var children = document.createElement("ul");

        row.className = "maui-tree-folder-row";
        folder.href = "#";
        folder.className = "maui-tree-link maui-tree-folder-link";
        folder.innerHTML = "▾ 📁 <strong>" + esc(project) + "</strong>";
        plus.href = "#";
        plus.className = "maui-tree-link maui-tree-add-link";
        plus.textContent = "+";
        plus.title = "Add file";
        row.append(folder, plus);
        children.className = "maui-tree-children";
        root.append(row, children);

        Object.keys(projects[project]).forEach(function (file) {
          var li = document.createElement("li");
          var link = document.createElement("a");
          link.href = "#";
          link.className = "maui-tree-link" + (project === currentProject && file === currentFile ? " active" : "");
          link.appendChild(document.createTextNode("📄 " + file));
          if (isDirty(project, file)) {
            var star = document.createElement("span");
            star.className = "maui-file-dirty";
            star.textContent = " *";
            link.appendChild(star);
          }
          link.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            saveCurrentView();
            load(project, file);
            renderTree();
            renderTabs();
            render();
          };
          li.appendChild(link);
          children.appendChild(li);
        });

        plus.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          var name = prompt("New file name", "NewFile.razor");
          if (!name) return;
          name = name.trim();
          if (!name || Object.prototype.hasOwnProperty.call(projects[project], name)) return;
          saveCurrentView();
          projects[project][name] = "";
          dirtyFiles[fileKey(project, name)] = true;
          load(project, name);
          renderTree();
          renderTabs();
          render();
        };

        folder.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          saveCurrentView();
          var first = Object.keys(projects[project])[0];
          if (first) load(project, first);
          renderTree();
          renderTabs();
          render();
        };

        tree.appendChild(root);
      });
    }

    function attrs(text) {
      var result = {};
      var re = /([:@\w-]+)\s*=\s*["']([^"']*)["']/g;
      var match;
      while ((match = re.exec(text || ""))) result[match[1]] = match[2];
      return result;
    }

    function codeBlock(source) {
      var start = source.search(/@code\s*\{/i);
      if (start < 0) return null;
      var open = source.indexOf("{", start);
      var depth = 0;
      var quote = null;
      for (var i = open; i < source.length; i++) {
        var ch = source[i];
        if (quote) {
          if (ch === quote && source[i - 1] !== "\\") quote = null;
          continue;
        }
        if (ch === '"' || ch === "'") { quote = ch; continue; }
        if (ch === "{") depth++;
        if (ch === "}" && --depth === 0) return { start: start, end: i + 1, code: source.slice(open + 1, i) };
      }
      return null;
    }

    function defaultValue(type) {
      type = String(type || "").toLowerCase();
      if (type === "string") return "";
      if (/^(int|long|short|double|float|decimal)$/.test(type)) return 0;
      if (type === "bool") return false;
      return null;
    }

    function evalExpr(expression, state) {
      var value = String(expression || "").trim().replace(/;$/, "").replace(/^await\s+/i, "");
      if (value === "true") return true;
      if (value === "false") return false;
      if (value === "null") return null;
      if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
      if ((value[0] === '"' && value[value.length - 1] === '"') || (value[0] === "'" && value[value.length - 1] === "'")) return value.slice(1, -1);
      if (Object.prototype.hasOwnProperty.call(state, value)) return state[value];
      var parts = value.split(/\s*\+\s*/);
      if (parts.length > 1) {
        var values = parts.map(function (part) { return evalExpr(part, state); });
        if (values.some(function (v) { return typeof v === "string"; })) return values.join("");
        return values.reduce(function (a, b) { return Number(a || 0) + Number(b || 0); }, 0);
      }
      return value;
    }

    function stateFor(code) {
      var key = fileKey(currentProject, currentFile);
      var state = componentState[key] || (componentState[key] = {});
      var match;
      var properties = /\b(?:private|public|protected|internal)?\s*([\w<>?]+)\s+(\w+)\s*\{\s*get\s*;\s*set\s*;\s*\}/g;
      while ((match = properties.exec(code))) if (!(match[2] in state)) state[match[2]] = defaultValue(match[1]);
      var fields = /\b(?:private|public|protected|internal)?\s*([\w<>?]+)\s+(\w+)\s*=\s*([^;]+);/g;
      while ((match = fields.exec(code))) if (!(match[2] in state)) state[match[2]] = evalExpr(match[3], state);
      return state;
    }

    function methodBody(code, name) {
      var safe = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      var re = new RegExp("(?:private|public|protected|internal)?\\s*(?:async\\s+)?(?:Task(?:<[^>]+>)?|void|[\\w<>?]+)\\s+" + safe + "\\s*\\([^)]*\\)\\s*\\{", "m");
      var match = re.exec(code);
      if (!match) {
        var expression = new RegExp("(?:private|public|protected|internal)?\\s*(?:async\\s+)?(?:void|[\\w<>?]+)\\s+" + safe + "\\s*\\([^)]*\\)\\s*=>\\s*([^;]+);", "m").exec(code);
        return expression ? expression[1] : null;
      }
      var open = code.indexOf("{", match.index);
      var depth = 0;
      for (var i = open; i < code.length; i++) {
        if (code[i] === "{") depth++;
        if (code[i] === "}" && --depth === 0) return code.slice(open + 1, i);
      }
      return null;
    }

    function executeMethod(name, code, state) {
      var body = methodBody(code, name);
      if (body === null) throw new Error("Method '" + name + "' was not found in @code.");
      var statements = body.match(/(?:this\.)?\w+\s*(?:\+\+|--|\+=|-=|=)\s*[^;]+;?/g) || [];
      statements.forEach(function (statement) {
        statement = statement.replace(/;$/, "").trim();
        var match = statement.match(/^(?:this\.)?(\w+)\s*(\+\+|--)$/);
        if (match) { state[match[1]] = Number(state[match[1]] || 0) + (match[2] === "++" ? 1 : -1); return; }
        match = statement.match(/^(?:this\.)?(\w+)\s*(\+=|-=)\s*(.+)$/);
        if (match) { var n = Number(evalExpr(match[3], state) || 0); state[match[1]] = Number(state[match[1]] || 0) + (match[2] === "+=" ? n : -n); return; }
        match = statement.match(/^(?:this\.)?(\w+)\s*=\s*(.+)$/);
        if (match) state[match[1]] = evalExpr(match[2], state);
      });
    }

    function validate(markup) {
      var errors = [];
      Object.keys(packageRecipes).forEach(function (id) {
        var recipe = packageRecipes[id];
        Object.keys(recipe.components).forEach(function (component) {
          if (!new RegExp("<" + component + "\\b", "i").test(markup)) return;
          if (!installedPackages[id]) {
            errors.push("Runtime error: " + component + " requires NuGet package " + id + ".");
            return;
          }
          var program = projects[recipe.project] && projects[recipe.project]["Program.cs"] || "";
          if (program.indexOf(recipe.registration) < 0) errors.push("Runtime error: " + component + " is not registered in Program.cs. Expected: " + recipe.registration);
        });
      });
      return errors;
    }

    function renderComponents(markup) {
      var result = markup;
      Object.keys(packageRecipes).forEach(function (id) {
        var recipe = packageRecipes[id];
        Object.keys(recipe.components).forEach(function (component) {
          var re = new RegExp("<" + component + "\\b([^>]*)>([\\s\\S]*?)</" + component + ">|<" + component + "\\b([^>]*)/>", "gi");
          result = result.replace(re, function (_, a, inner, b) { return recipe.components[component](attrs(a || b || ""), inner || ""); });
        });
      });
      return result;
    }

    function razorPage(source) {
      var block = codeBlock(source);
      var code = block ? block.code : "";
      var markup = block ? source.slice(0, block.start) + source.slice(block.end) : source;
      var routeMatch = markup.match(/@page\s+["']([^"']+)["']/i);
      var route = routeMatch ? routeMatch[1] : "/";
      markup = markup.replace(/@page\s+["'][^"']+["']/gi, "");
      var errors = validate(markup);
      if (errors.length) return { route: route, html: '<div class="maui-runtime-error"><strong>Runtime error</strong><pre>' + esc(errors.join("\n\n")) + '</pre></div>' };
      var state = stateFor(code);
      markup = renderComponents(markup);
      markup = markup.replace(/@onclick\s*=\s*["']([^"']+)["']/gi, 'data-playground-click="$1"');
      markup = markup.replace(/@([A-Za-z_]\w*)/g, function (all, name) { return Object.prototype.hasOwnProperty.call(state, name) ? esc(state[name]) : all; });
      markup = markup.replace(/<a\b([^>]*href=["'](\/[^"']*)["'][^>]*)>([\s\S]*?)<\/a>/gi, function (_, attributes, href, text) { return '<a ' + attributes + ' data-playground-route="' + esc(href) + '">' + text + '</a>'; });
      return { route: route, html: markup, code: code };
    }

    function findRoute(path) {
      var found = null;
      Object.keys(projects).some(function (project) {
        return Object.keys(projects[project]).some(function (file) {
          if (!/\.razor$/i.test(file)) return false;
          var oldProject = currentProject, oldFile = currentFile;
          currentProject = project;
          currentFile = file;
          var page = razorPage(projects[project][file]);
          currentProject = oldProject;
          currentFile = oldFile;
          if (page.route === path) { found = { project: project, file: file }; return true; }
          return false;
        });
      });
      return found;
    }

    function renderXaml(source) {
      var outputHtml = [];
      var re = /<Label\b([^>]*?)(?:\/>|>)/gi;
      var match;
      while ((match = re.exec(source))) {
        var a = attrs(match[1]);
        if (a.Text) outputHtml.push('<div style="font-size:' + (parseFloat(a.FontSize) || 16) + 'px;margin-bottom:16px">' + esc(a.Text) + '</div>');
      }
      return outputHtml.join("") || "<p>No previewable Label was found.</p>";
    }

    function render() {
      syncEditor();
      var source = fileMap()[currentFile] || "";
      var body;
      if (currentProject === "1. MyMauiApp" && currentFile === "MainPage.xaml") body = renderXaml(source);
      else if (/\.razor$/i.test(currentFile)) body = razorPage(source).html;
      else body = "<p>This source file is editable but has no browser renderer yet.</p>";
      preview.innerHTML = '<div class="maui-browser-toolbar"><span>●</span><span>●</span><span>●</span><code>https://preview.algolassi.local/</code></div><div class="maui-browser-content">' + body + '</div>';

      preview.querySelectorAll("[data-playground-click]").forEach(function (element) {
        element.onclick = function (e) {
          e.preventDefault();
          try {
            var block = codeBlock(fileMap()[currentFile] || "");
            executeMethod(element.getAttribute("data-playground-click").replace(/\(.*\)$/, ""), block ? block.code : "", stateFor(block ? block.code : ""));
            render();
          } catch (error) {
            output.textContent = "Runtime error:\n\n" + error.message;
            var content = preview.querySelector(".maui-browser-content");
            if (content) content.insertAdjacentHTML("afterbegin", '<div class="maui-runtime-error"><strong>Runtime error</strong><pre>' + esc(error.message) + '</pre></div>');
          }
        };
      });

      preview.querySelectorAll("a[data-playground-route]").forEach(function (link) {
        link.onclick = function (e) {
          var href = link.getAttribute("href");
          if (href && href.charAt(0) === "/") {
            e.preventDefault();
            var target = findRoute(href);
            if (target) {
              saveCurrentView();
              load(target.project, target.file);
              renderTree();
              renderTabs();
              render();
            }
          }
        };
      });
      output.textContent = "Preview refreshed.\n\nCurrent file: " + currentProject + " / " + currentFile;
    }

    function loadDemoFromQuery() {
      var params = new URLSearchParams(window.location.search || "");
      var demo = (params.get("demo") || "").toLowerCase().trim();
      if (!demo) return false;

      var demos = {
        "razor-counter": {
          project: "4. MyMauiApp.Web.Client",
          file: "Home.razor",
          source: '@page "/"\n\n<h1>Razor Counter Demo</h1>\n<p>Current count: @count</p>\n<button @onclick="Increment">Increment</button>\n\n@code {\n    private int count { get; set; }\n\n    private void Increment()\n    {\n        count++;\n    }\n}'
        }
      };

      var selected = demos[demo];
      if (!selected || !projects[selected.project]) {
        output.textContent = "Demo not found: " + demo;
        return false;
      }

      if (!Object.prototype.hasOwnProperty.call(projects[selected.project], selected.file)) {
        projects[selected.project][selected.file] = "";
      }

      projects[selected.project][selected.file] = selected.source;
      delete dirtyFiles[fileKey(selected.project, selected.file)];
      componentState = {};
      load(selected.project, selected.file);
      renderTree();
      renderTabs();
      render();
      output.textContent = "Demo loaded: " + demo + "\n\n" + selected.project + " / " + selected.file + "\n\nThe demo was loaded automatically from the URL.";
      return true;
    }

    function packageReference(id, version, project) {
      var name = project.split(".").pop() + ".csproj";
      var file = projects[project][name] || '<Project Sdk="Microsoft.NET.Sdk.Web">\n  <PropertyGroup><TargetFramework>net9.0</TargetFramework></PropertyGroup>\n</Project>';
      if (file.indexOf('PackageReference Include="' + id + '"') < 0) file = file.replace(/<\/Project>\s*$/, '  <ItemGroup>\n    <PackageReference Include="' + id + '" Version="' + (version || "latest") + '" />\n  </ItemGroup>\n</Project>');
      projects[project][name] = file;
    }

    function installPackage(pkg) {
      if (installedPackages[pkg.id]) return;
      installedPackages[pkg.id] = pkg;
      var recipe = packageRecipes[pkg.id];
      var target = recipe ? recipe.project : "3. MyMauiApp.Web";
      packageReference(pkg.id, pkg.version, target);
      if (recipe && recipe.registration) {
        var program = projects[target]["Program.cs"] || "";
        if (program.indexOf(recipe.registration) < 0) {
          var marker = "var app =";
          var pos = program.indexOf(marker);
          program = pos >= 0 ? program.slice(0, pos) + recipe.registration + "\n" + program.slice(pos) : program + "\n" + recipe.registration + "\n";
          projects[target]["Program.cs"] = program;
        }
      }
      renderTree();
      renderTabs();
      renderNugetInstalled();
      output.textContent = "NuGet package installed: " + pkg.id + "\nTarget project: " + target + (recipe ? "\nProgram.cs: " + recipe.registration : "");
    }

    function renderNugetInstalled() {
      var list = document.getElementById("maui-installed-packages");
      if (!list) return;
      var ids = Object.keys(installedPackages);
      list.innerHTML = ids.length ? ids.map(function (id) { var p = installedPackages[id]; return '<div class="maui-installed-package"><span>📦 <strong>' + esc(id) + '</strong><small>v' + esc(p.version || "latest") + '</small></span><span class="maui-installed-badge">Installed</span></div>'; }).join("") : '<div class="maui-installed-empty">No packages installed yet.</div>';
    }

    function setupNuget() {
      var existingPanel = document.getElementById("maui-nuget-panel");
      var existingToggle = document.getElementById("maui-nuget-toggle");

      if (existingPanel && existingToggle) {
        renderNugetInstalled();
        return;
      }

      var host = tree.parentElement || tree.parentNode;

      var toggle = existingToggle || document.createElement("button");
      toggle.type = "button";
      toggle.id = "maui-nuget-toggle";
      toggle.textContent = "📦 NuGet";
      toggle.style.cssText = "display:block;width:100%;box-sizing:border-box;margin-top:12px;padding:8px 10px;border:1px solid rgba(127,127,127,.3);border-radius:6px;background:rgba(127,127,127,.06);color:inherit;text-align:left;cursor:pointer;";

      if (!existingToggle) host.appendChild(toggle);

      var panel = existingPanel || document.createElement("section");

      if (!existingPanel) {
        panel.id = "maui-nuget-panel";
        panel.innerHTML = '<div class="maui-nuget-header"><strong>📦 NuGet Packages</strong><button type="button" id="maui-nuget-close">Hide</button></div><div class="maui-nuget-search-row"><input id="maui-nuget-query" type="search" placeholder="Search NuGet packages…" autocomplete="off"><button type="button" id="maui-nuget-search-btn">Search</button></div><div id="maui-nuget-status"></div><div id="maui-nuget-results"></div><div class="maui-installed-section"><div class="maui-installed-title">Installed Packages</div><div id="maui-installed-packages"></div></div>';
        host.appendChild(panel);
      }

      var q = panel.querySelector("#maui-nuget-query");
      var results = panel.querySelector("#maui-nuget-results");
      var status = panel.querySelector("#maui-nuget-status");
      var close = panel.querySelector("#maui-nuget-close");
      var searchButton = panel.querySelector("#maui-nuget-search-btn");

      function search() {
        var term = q.value.trim();
        if (!term) { status.textContent = "Enter a package name."; results.innerHTML = ""; return; }
        status.textContent = "Searching NuGet.org…";
        results.innerHTML = "";
        fetch("https://azuresearch-usnc.nuget.org/query?q=" + encodeURIComponent(term) + "&prerelease=false&take=20")
          .then(function (r) { if (!r.ok) throw new Error("NuGet search failed"); return r.json(); })
          .then(function (data) {
            var items = data.data || [];
            status.textContent = items.length + " package" + (items.length === 1 ? "" : "s") + " found";
            results.innerHTML = items.map(function (p) {
              var recipe = packageRecipes[p.id];
              var installed = !!installedPackages[p.id];
              return '<div class="maui-nuget-result"><div class="maui-nuget-result-head"><strong>' + esc(p.id || "") + '</strong><button type="button" class="maui-nuget-install ' + (installed ? "installed" : "") + '" data-id="' + esc(p.id || "") + '"' + (installed ? " disabled" : "") + '>' + (installed ? "Installed" : "Install") + '</button></div><div>' + esc(p.description || "No description available.") + '</div><small>v' + esc(p.version || "") + ' · Downloads: ' + Number(p.totalDownloads || 0).toLocaleString() + '</small>' + (recipe ? '<div class="maui-package-setup">✓ Setup available<br>Program.cs: <code>' + esc(recipe.registration) + '</code><br>Target: ' + esc(recipe.project) + '</div>' : "") + '</div>';
            }).join("") || "<div>No packages found.</div>";
            results.querySelectorAll(".maui-nuget-install:not([disabled])").forEach(function (button) {
              button.onclick = function () {
                var pkg = items.find(function (item) { return item.id === button.dataset.id; });
                if (pkg) { installPackage(pkg); search(); }
              };
            });
          })
          .catch(function () { status.textContent = "NuGet search is unavailable right now."; results.innerHTML = "<div>Could not reach NuGet.org.</div>"; });
      }

      toggle.onclick = function () {
        var hidden = panel.style.display === "none";
        panel.style.display = hidden ? "block" : "none";
        if (hidden && q) q.focus();
      };
      close.onclick = function () { panel.style.display = "none"; };
      searchButton.onclick = search;
      q.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); search(); } };
      renderNugetInstalled();
      panel.style.display = "block";
    }

    function addSaveButton() {
      if (document.getElementById("maui-save-project") || !run || !run.parentElement) return;
      var button = document.createElement("button");
      button.type = "button";
      button.id = "maui-save-project";
      button.innerHTML = "💾 <span>Save Project</span>";
      button.onclick = saveProject;
      run.parentElement.insertBefore(button, run.nextSibling);
    }

    function addStyles() {
      if (document.getElementById("maui-playground-runtime-style")) return;
      var style = document.createElement("style");
      style.id = "maui-playground-runtime-style";
      style.textContent = ".maui-project-tree li{list-style:none;margin:0;padding:0}.maui-project-tree .maui-tree-link{display:block;width:100%;box-sizing:border-box;border:0;background:transparent;color:inherit;text-decoration:none;text-align:left;font:inherit;cursor:pointer;padding:4px 8px;border-radius:4px;line-height:1.35}.maui-project-tree .maui-tree-link:hover{background:rgba(127,127,127,.12)}.maui-project-tree .maui-tree-link.active{background:rgba(0,120,212,.16)}.maui-project-tree .maui-tree-folder-row{display:flex;align-items:center;gap:2px}.maui-project-tree .maui-tree-folder-link{flex:1;font-weight:600}.maui-project-tree .maui-tree-add-link{width:auto;flex:0 0 auto;padding:2px 7px;opacity:.65}.maui-project-tree .maui-tree-children{margin:0;padding-left:14px}.maui-nuget-toggle{display:flex;align-items:center;gap:6px;width:100%;box-sizing:border-box;padding:8px 10px;margin:8px 0;border:1px solid rgba(127,127,127,.25);border-radius:6px;background:rgba(127,127,127,.06);text-decoration:none;color:inherit;font-weight:600;cursor:pointer}.maui-nuget-toggle:hover{background:rgba(127,127,127,.12)}#maui-nuget-panel{box-sizing:border-box;width:100%;max-width:100%;overflow:hidden}.maui-nuget-search-row{display:flex;gap:6px;width:100%;box-sizing:border-box}.maui-nuget-search-row input{min-width:0;flex:1;box-sizing:border-box}.maui-nuget-search-row button{flex:0 0 auto;box-sizing:border-box;white-space:nowrap}.maui-nuget-result{padding:10px 0;border-bottom:1px solid rgba(127,127,127,.18)}.maui-nuget-result-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.maui-nuget-install{display:inline-block;border:1px solid rgba(127,127,127,.45);border-radius:4px;padding:3px 9px;text-decoration:none;font-size:.85em;cursor:pointer;background:transparent;color:inherit}.maui-nuget-install:hover{background:rgba(0,120,212,.12)}.maui-nuget-install.installed{opacity:.7;cursor:default}.maui-package-setup{margin-top:7px;padding:7px;border-left:3px solid rgba(0,120,212,.55);font-size:.85em}.playground-radzen-button,.playground-mud-button{padding:8px 16px;border-radius:4px;color:#fff;cursor:pointer}.playground-radzen-button{border:1px solid #1677ff;background:#1677ff}.playground-mud-button{border:1px solid #594ae2;background:#594ae2}.playground-radzen-input,.playground-mud-input{padding:8px 10px;border:1px solid #aaa;border-radius:4px}.playground-radzen-label{display:inline-block;padding:4px 0}#maui-nuget-results{max-height:420px;overflow-y:auto;overflow-x:hidden;padding-right:6px;scrollbar-width:thin}#maui-nuget-results::-webkit-scrollbar{width:8px}#maui-nuget-results::-webkit-scrollbar-thumb{border-radius:8px;background:rgba(127,127,127,.45)}#maui-nuget-results::-webkit-scrollbar-track{background:transparent}.maui-save-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:8px 14px;border:1px solid #1677ff;border-radius:6px;background:#1677ff;color:#fff;font-weight:600;cursor:pointer;box-sizing:border-box}.maui-save-button:hover{background:#0f65d6}.maui-save-button:active{transform:translateY(1px)}.maui-runtime-error{margin:12px;padding:12px;border:1px solid #d33;border-radius:6px;background:rgba(220,50,50,.08);color:inherit}.maui-runtime-error pre{white-space:pre-wrap;margin:8px 0 0}#maui-nuget-panel{margin-top:16px;padding:12px;border-top:1px solid rgba(127,127,127,.25);font-size:.9rem}.maui-nuget-panel #maui-nuget-results{max-height:360px;overflow-y:auto;overflow-x:hidden;padding-right:4px}";
      document.head.appendChild(style);
    }

    if (run) run.onclick = function () { syncEditor(); render(); };
    if (create) create.onclick = function () { saveCurrentView(); load("1. MyMauiApp", "MainPage.xaml"); renderTree(); renderTabs(); render(); };
    editor.oninput = function () { syncEditor(); markDirty(); output.textContent = "Unsaved changes in " + currentProject + " / " + currentFile + ". Click Save Project to save."; };

    load(currentProject, currentFile);
    renderTree();
    renderTabs();
    renderNugetInstalled();
    if (!loadDemoFromQuery()) render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
