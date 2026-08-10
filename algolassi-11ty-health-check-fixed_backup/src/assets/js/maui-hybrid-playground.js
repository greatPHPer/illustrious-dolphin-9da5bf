/* Algolassi MAUI Hybrid browser playground */
(function () {
  "use strict";

  var projects = {
    "MyMauiApp": {
      "MainPage.xaml": '<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"><VerticalStackLayout Padding="30"><Label Text="Hello from MAUI Hybrid!" FontSize="24" /></VerticalStackLayout></ContentPage>',
      "MainPage.xaml.cs": 'namespace MyMauiApp;\n\npublic partial class MainPage : ContentPage\n{\n    public MainPage() { InitializeComponent(); }\n}',
      "MauiProgram.cs": 'namespace MyMauiApp;\n\npublic static class MauiProgram\n{\n    public static MauiApp CreateMauiApp()\n    {\n        var builder = MauiApp.CreateBuilder();\n        builder.UseMauiApp<App>();\n        return builder.Build();\n    }\n}'
    },
    "MyMauiApp.Shared": {
      "Home.razor": '@page "/home"\n\n<h1>Hello from Shared!</h1>\n<p>This Home.razor belongs to the Shared project.</p>\n<a href="/home">Go Home</a>',
      "Models/AppMessage.cs": 'namespace MyMauiApp.Shared.Models;\n\npublic record AppMessage(string Text);'
    },
    "MyMauiApp.Web": {
      "Program.cs": 'var builder = WebApplication.CreateBuilder(args);\nbuilder.Services.AddRazorComponents().AddInteractiveServerComponents();\nvar app = builder.Build();\napp.MapRazorComponents<App>().AddInteractiveServerRenderMode();\napp.Run();'
    },
    "MyMauiApp.Web.Client": {
      "Home.razor": '@page "/"\n\n<h1>@message</h1>\n<button @onclick="ChangeMessage">Click Me</button>\n\n@code {\n    private string message = "Hello from Web Client!";\n    private void ChangeMessage() => message = "You clicked the button!";\n}'
    }
  };

  var installedPackages = {};
  var dirtyFiles = {};
  var componentState = {};
  var packageRecipes = {
    "Radzen.Blazor": {
      project: "MyMauiApp.Web",
      registration: "builder.Services.AddRadzenComponents();",
      components: {
        RadzenButton: function (a, inner) { return '<button class="playground-radzen-button"' + clickAttr(a) + '>' + esc(inner || a.Text || "Radzen Button") + '</button>'; },
        RadzenTextBox: function (a) { return '<input class="playground-radzen-input" placeholder="' + esc(a.Placeholder || "") + '" value="' + esc(a.Value || "") + '">'; },
        RadzenLabel: function (a, inner) { return '<span class="playground-radzen-label">' + esc(inner || a.Text || "") + '</span>'; }
      }
    },
    "MudBlazor": {
      project: "MyMauiApp.Web",
      registration: "builder.Services.AddMudServices();",
      components: {
        MudButton: function (a, inner) { return '<button class="playground-mud-button"' + clickAttr(a) + '>' + esc(inner || a.Text || "MudButton") + '</button>'; },
        MudTextField: function (a) { return '<input class="playground-mud-input" placeholder="' + esc(a.Label || a.Placeholder || "") + '">'; }
      }
    },
    "Blazored.LocalStorage": {
      project: "MyMauiApp.Web",
      registration: "builder.Services.AddBlazoredLocalStorage();",
      components: {}
    },
    "Microsoft.Extensions.Http": {
      project: "MyMauiApp.Web",
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
    var currentProject = "MyMauiApp";
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
      var statements = body.match(/(?:this\.)?\w+\s*(?:\+\+|--|\+=|-=|=)(?:\s*[^;]+)?;?/g) || [];
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
      return outputHtml.join("") || '<p>No web-compatible XAML content was found.</p>';
    }

    function render() {
      syncEditor();
      var source = fileMap()[currentFile] || "";
      if (/\.xaml$/i.test(currentFile)) {
        preview.querySelector(".maui-browser-content").innerHTML = renderXaml(source);
        return;
      }
      if (/\.razor$/i.test(currentFile)) {
        var page = razorPage(source);
        preview.querySelector(".maui-browser-content").innerHTML = page.html;
        bindPreviewEvents(source);
        return;
      }
      preview.querySelector(".maui-browser-content").innerHTML = '<pre>' + esc(source) + '</pre>';
    }

    function bindPreviewEvents(source) {
      var content = preview.querySelector(".maui-browser-content");
      content.querySelectorAll("[data-playground-click]").forEach(function (button) {
        button.addEventListener("click", function (event) {
          event.preventDefault();
          var name = button.getAttribute("data-playground-click").trim();
          var state = stateFor(source);
          try {
            executeMethod(name, source, state);
            render();
          } catch (error) {
            output.textContent = error.message;
          }
        });
      });
    }

    editor.addEventListener("input", function () {
      syncEditor();
      markDirty();
    });

    run.onclick = function () { render(); output.textContent = "Preview rendered successfully."; };
    create.onclick = function () { output.textContent = "Project creation is available in the playground editor."; };

    renderTree();
    renderTabs();
    load(currentProject, currentFile);
    render();

    var params = new URLSearchParams(window.location.search);
    var demo = params.get("demo");
    if (demo && window.MauiPlaygroundDemos && typeof window.MauiPlaygroundDemos.load === "function") {
      window.MauiPlaygroundDemos.load(demo);
    }

    window.MauiPlayground = {
      projects: projects,
      load: load,
      render: render,
      saveProject: saveProject,
      stateFor: stateFor,
      executeMethod: executeMethod
    };
  }

  function addStyles() {
    if (document.getElementById("maui-playground-js-styles")) return;
    var style = document.createElement("style");
    style.id = "maui-playground-js-styles";
    //20260810 webclient name same line
    style.textContent = ".maui-tree-folder-row{display:flex;align-items:center;justify-content:space-between}.maui-tree-folder-link{display:flex;align-items:center;white-space:nowrap;min-width:0}.maui-tree-folder-link strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.maui-tree-children{margin:0;padding-left:22px;list-style:none}.maui-tree-link{display:block;color:#344054;text-decoration:none;padding:4px 6px;border-radius:5px}.maui-tree-link:hover,.maui-tree-link.active{background:#e8f1ff;color:#0d6efd}.maui-tree-add-link{display:inline-block}.maui-file-dirty{color:#d92d20}.maui-runtime-error{padding:18px;border:1px solid #fecdca;background:#fef3f2;color:#b42318;border-radius:8px}.maui-runtime-error pre{white-space:pre-wrap}.maui-nuget-bar{display:flex;gap:8px;align-items:center;padding:8px 12px;border-bottom:1px solid #d0d5dd;background:#fff}.maui-nuget-bar input{flex:1;padding:7px 9px;border:1px solid #d0d5dd;border-radius:6px}.maui-nuget-bar button,.maui-save-button{border:0;border-radius:6px;padding:7px 10px;background:#0d6efd;color:#fff;cursor:pointer}.maui-nuget-status{font-size:12px;color:#667085}.maui-save-button{margin-left:auto}.playground-radzen-button,.playground-mud-button{border:0;border-radius:6px;padding:8px 12px;background:#0d6efd;color:#fff;cursor:pointer}.playground-radzen-input,.playground-mud-input{display:block;padding:8px;border:1px solid #d0d5dd;border-radius:6px;margin:8px 0}.playground-radzen-label{display:inline-block;margin:8px 0}";
    //style.textContent = ".maui-tree-folder-row{display:flex;align-items:center;justify-content:space-between}.maui-tree-folder-link{display:flex;align-items:center;white-space:nowrap;min-width:0}.maui-tree-folder-link strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}...";
    document.head.appendChild(style);
  }

  function setupNuget() {
    var header = document.querySelector(".maui-code-panel .maui-panel-title");
    if (!header || document.querySelector(".maui-nuget-bar")) return;
    var bar = document.createElement("div");
    bar.className = "maui-nuget-bar";
    bar.innerHTML = '<input id="maui-nuget-input" placeholder="Install NuGet package, e.g. Radzen.Blazor"><button type="button" id="maui-nuget-install">Install</button><span class="maui-nuget-status" id="maui-nuget-status">No extra packages installed.</span>';
    header.parentNode.insertBefore(bar, header.nextSibling);
    var input = bar.querySelector("#maui-nuget-input");
    var button = bar.querySelector("#maui-nuget-install");
    var status = bar.querySelector("#maui-nuget-status");
    button.onclick = function () {
      var id = input.value.trim();
      if (!id) return;
      installedPackages[id] = true;
      status.textContent = id + " installed for this playground session.";
      input.value = "";
    };
  }

  function addSaveButton() {
    var header = document.querySelector(".maui-playground-header");
    if (!header || document.getElementById("maui-save-project")) return;
    var button = document.createElement("button");
    button.type = "button";
    button.id = "maui-save-project";
    button.className = "maui-save-button";
    button.textContent = "Save Project";
    button.onclick = function () { if (window.MauiPlayground) window.MauiPlayground.saveProject(); };
    header.appendChild(button);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
