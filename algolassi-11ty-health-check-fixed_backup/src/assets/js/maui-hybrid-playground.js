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

  var installedPackages = {"Radzen.Blazor": true};
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
        //folder.href = "#";
        folder.className = "maui-tree-link maui-tree-folder-link";
        folder.innerHTML = "▾ 📁 <strong>" + esc(project) + "</strong>";
        //plus.href = "#";
        plus.className = "maui-tree-link maui-tree-add-link";
        plus.textContent = "+";
        plus.title = "Add file";
        row.append(folder, plus);
        children.className = "maui-tree-children";
        root.append(row, children);

        Object.keys(projects[project]).forEach(function (file) {
          var li = document.createElement("li");
          var link = document.createElement("a");
          //link.href = "#";
          //var link = document.createElement("button");
          //link.type = "button";
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

    var first = Object.keys(projects[project] || {})[0];

    if (first) {
        load(project, first);
    }

    renderTree();
    renderTabs();
    render();
};

        tree.appendChild(root);
      });
    }

    function attrs(text) {
      var result = {};
      var re = /([:@\w.-]+)\s*=\s*["']([^"']*)["']/g;
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
          var re = new RegExp("<" + component + "\\b", "i");
          if (re.test(markup) && !installedPackages[id]) errors.push(component + " requires " + id + ".");
        });
      });
      return errors;
    }

    function renderComponents(markup) {
      var result = markup;
      Object.keys(packageRecipes).forEach(function (id) {
        var recipe = packageRecipes[id];
        Object.keys(recipe.components).forEach(function (component) {
          var renderer = recipe.components[component];
          var re = new RegExp("<" + component + "\\b([^>]*)>([\\s\\S]*?)</" + component + ">|<" + component + "\\b([^>]*)/>", "gi");
          result = result.replace(re, function (whole, openAttrs, inner, selfAttrs) {
            if (!installedPackages[id]) return whole;
            return renderer(attrs(openAttrs || selfAttrs || ""), inner || "");
          });
        });
      });
      return result;
    }

    function renderRazorMarkup(markup, state) {
      var html = markup;
      html = html.replace(/@\(([^)]+)\)/g, function (_, expr) { return esc(evalExpr(expr, state)); });
      html = html.replace(/@if\s*\(([^)]+)\)\s*\{([\s\S]*?)\}/g, function (_, expr, yes) { return evalExpr(expr, state) ? yes : ""; });
      html = html.replace(/@foreach\s*\([^)]*\)\s*\{([\s\S]*?)\}/g, function (_, body) { return body; });
      html = html.replace(/@(\w+)/g, function (_, name) { return esc(state[name] == null ? "" : state[name]); });
      return html;
    }

    function razorPage(source) {
      var code = codeBlock(source);
      var codeText = code ? code.code : "";
      var state = stateFor(codeText);
      var markup = code ? source.slice(0, code.start) + source.slice(code.end) : source;
      markup = markup.replace(/@page\s+["'][^"']*["']/gi, "");
      var errors = validate(markup);
      if (errors.length) return { html: '<div class="maui-runtime-error"><strong>Component package error</strong><pre>' + esc(errors.join("\n")) + '</pre></div>', state: state, code: codeText };
      markup = renderComponents(markup);
      markup = markup.replace(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi, function (_, attrsText, inner) {
        var a = attrs(attrsText);
        var click = a["@onclick"] || a.onclick || "";
        return '<button' + clickAttr({ "@onclick": click }) + '>' + inner + '</button>';
      });
      var html = renderRazorMarkup(markup, state);
      html = html.replace(/<input\b([^>]*)>/gi, function (_, attrsText) {
        var a = attrs(attrsText);
        return '<input' + (a.Value != null ? ' value="' + esc(a.Value) + '"' : '') + '>'; 
      });
      return { html: html, state: state, code: codeText };
    }

    function findRoute(path) {
      var found = null;
      Object.keys(projects).some(function (project) {
        return Object.keys(projects[project]).some(function (file) {
          if (!/\.razor$/i.test(file)) return false;
          var source = projects[project][file];
          var page = source.match(/@page\s+["']([^"']+)["']/i);
          if (page && page[1] === path) { found = { project: project, file: file }; return true; }
          return false;
        });
      });
      return found;
    }

    function renderXaml(source) {
      function cssValue(value, fallback) {
        return value ? esc(value) : fallback;
      }
      function parseDefinitionCount(definition) {
        if (!definition) return 1;
        var parts = definition.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
        return parts.length || 1;
      }
      var gridMatch = /<Grid\b([^>]*)>([\s\S]*?)<\/Grid>/i.exec(source);
      if (gridMatch) {
        var ga = attrs(gridMatch[1]);
        var body = gridMatch[2];
        var rows = parseDefinitionCount(ga.RowDefinitions);
        var cols = parseDefinitionCount(ga.ColumnDefinitions);
        var padding = ga.Padding || "0";
        var rowGap = ga.RowSpacing || "0";
        var colGap = ga.ColumnSpacing || "0";
        var children = [];
        var childRe = /<(Label|Entry|Button)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/gi;
        var match;
        while ((match = childRe.exec(body))) {
          var tag = match[1].toLowerCase();
          var a = attrs(match[2]);
          var inner = (match[3] || "").trim();
          if (tag === "grid") {
            var gridChildren = [];
            var gridChildRe = /<([A-Za-z][\w.]*)\b([^>]*)>([\s\S]*?)<\/\1>|<([A-Za-z][\w.]*)\b([^>]*)\/>/gi;
            var gm;
            while ((gm = gridChildRe.exec(inner))) {
              var childTag = (gm[1] || gm[4] || "").toLowerCase();
              var childAttrs = attrs(gm[2] || gm[5] || "");
              var childInner = (gm[3] || "").trim();
              var row = parseInt(childAttrs["Grid.Row"], 10); var column = parseInt(childAttrs["Grid.Column"], 10); var rowSpan = parseInt(childAttrs["Grid.RowSpan"], 10); var columnSpan = parseInt(childAttrs["Grid.ColumnSpan"], 10);
              if (isNaN(row)) row = 0; if (isNaN(column)) column = 0; if (isNaN(rowSpan) || rowSpan < 1) rowSpan = 1; if (isNaN(columnSpan) || columnSpan < 1) columnSpan = 1;
              var style = 'grid-row:' + (row + 1) + ' / span ' + rowSpan + ';grid-column:' + (column + 1) + ' / span ' + columnSpan + ';min-width:0;box-sizing:border-box;';
              if (childTag === "label") gridChildren.push('<div style="' + style + 'font-size:' + (parseFloat(childAttrs.FontSize) || 16) + 'px;align-self:center;">' + esc(childAttrs.Text || childInner) + '</div>');
              else if (childTag === "entry") gridChildren.push('<input type="text" value="' + esc(childAttrs.Text || "") + '" placeholder="' + esc(childAttrs.Placeholder || "") + '" style="' + style + 'width:100%;padding:8px 10px;border:1px solid #d0d5dd;border-radius:6px;">');
              else if (childTag === "button") gridChildren.push('<button type="button" style="' + style + 'padding:8px 14px;border:0;border-radius:6px;background:#0d6efd;color:#fff;cursor:pointer;">' + esc(childAttrs.Text || childInner || "Button") + '</button>');
            }
            children.push('<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:20px;align-items:start;box-sizing:border-box;width:100%;">' + gridChildren.join("") + '</div>');
          } else if (tag === "verticalstacklayout") {
            var spacing = parseFloat(a.Spacing); if (isNaN(spacing)) spacing = 8;
            children.push('<div style="display:flex;flex-direction:column;gap:' + spacing + 'px;padding:20px;box-sizing:border-box;width:100%;">' + renderSimpleChildren(inner) + '</div>');
          } else if (tag === "horizontalstacklayout") {
            var hSpacing = parseFloat(a.Spacing); if (isNaN(hSpacing)) hSpacing = 8;
            children.push('<div style="display:flex;flex-direction:row;align-items:center;gap:' + hSpacing + 'px;padding:20px;box-sizing:border-box;width:100%;flex-wrap:wrap;">' + renderSimpleChildren(inner) + '</div>');
          } else if (tag === "scrollview") {
            children.push('<div style="overflow-y:auto;max-height:100%;width:100%;box-sizing:border-box;">' + renderSimpleChildren(inner) + '</div>');
          } else if (tag === "border") {
            var stroke = a.Stroke || "#0d6efd"; var strokeThickness = parseFloat(a.StrokeThickness); if (isNaN(strokeThickness)) strokeThickness = 2; var radius = 12; var shape = a.StrokeShape || ""; var radiusMatch = shape.match(/RoundRectangle\s+([\d.]+)/i); if (radiusMatch) radius = parseFloat(radiusMatch[1]) || 12; var borderPadding = a.Padding || "16";
            children.push('<div style="display:block;width:100%;box-sizing:border-box;border:' + strokeThickness + 'px solid ' + esc(stroke) + ';border-radius:' + radius + 'px;padding:' + parseFloat(borderPadding) + 'px;margin:4px 0;background:#fff;">' + renderSimpleChildren(inner) + '</div>');
          } else if (tag === "label") children.push('<div style="font-size:' + (parseFloat(a.FontSize) || 16) + 'px;align-self:center;">' + esc(a.Text || inner) + '</div>');
          else if (tag === "entry") children.push('<input type="text" value="' + esc(a.Text || "") + '" placeholder="' + esc(a.Placeholder || "") + '" style="width:100%;padding:8px 10px;border:1px solid #d0d5dd;border-radius:6px;box-sizing:border-box;">');
          else if (tag === "button") children.push('<button type="button" style="padding:8px 14px;border:0;border-radius:6px;background:#0d6efd;color:#fff;cursor:pointer;">' + esc(a.Text || inner || "Button") + '</button>');
        }
        if (children.length) return '<div style="display:grid;grid-template-columns:repeat(' + cols + ',minmax(0,1fr));grid-template-rows:repeat(' + rows + ',auto);gap:' + cssValue(rowGap, '0') + 'px ' + cssValue(colGap, '0') + 'px;padding:' + cssValue(padding, '0') + 'px;align-items:start;box-sizing:border-box;width:100%;">' + children.join("") + '</div>';
      }
      var outputHtml = [];
      var re = /<(Label|Entry|Button)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/gi;
      var match;
      while ((match = re.exec(source))) {
        var tag = match[1].toLowerCase(); var a = attrs(match[2]); var inner = (match[3] || "").trim();
        if (tag === "label") outputHtml.push('<div style="font-size:' + (parseFloat(a.FontSize) || 16) + 'px;margin-bottom:16px">' + esc(a.Text || inner) + '</div>');
        if (tag === "entry") outputHtml.push('<input type="text" value="' + esc(a.Text || "") + '" placeholder="' + esc(a.Placeholder || "") + '" style="display:block;width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #d0d5dd;border-radius:6px;margin-bottom:16px;">');
        if (tag === "button") outputHtml.push('<button type="button" style="padding:8px 14px;border:0;border-radius:6px;background:#0d6efd;color:#fff;cursor:pointer;margin-bottom:16px;">' + esc(a.Text || inner || "Button") + '</button>');
      }
      return outputHtml.join("") || '<p>No web-compatible XAML content was found.</p>';
    }

    function renderSimpleChildren(body) {
      var result = [];
      var re = /<([A-Za-z][\w.]*)\b([^>]*)>([\s\S]*?)<\/\1>|<([A-Za-z][\w.]*)\b([^>]*)\/>/gi;
      var match;
      while ((match = re.exec(body))) {
        var tag = (match[1] || match[4] || "").toLowerCase(); var a = attrs(match[2] || match[5] || ""); var inner = (match[3] || "").trim();
        if (tag === "label") result.push('<div style="font-size:' + (parseFloat(a.FontSize) || 16) + 'px;">' + esc(a.Text || inner) + '</div>');
        else if (tag === "entry") result.push('<input type="text" value="' + esc(a.Text || "") + '" placeholder="' + esc(a.Placeholder || "") + '" style="width:100%;padding:8px 10px;border:1px solid #d0d5dd;border-radius:6px;box-sizing:border-box;">');
        else if (tag === "button") result.push('<button type="button" style="padding:8px 14px;border:0;border-radius:6px;background:#0d6efd;color:#fff;cursor:pointer;">' + esc(a.Text || inner || "Button") + '</button>');
      }
      return result.join("");
    }

    function render() {
      syncEditor();
      var source = fileMap()[currentFile] || "";
      if (/\.xaml$/i.test(currentFile)) { preview.querySelector(".maui-browser-content").innerHTML = renderXaml(source); return; }
      if (/\.razor$/i.test(currentFile)) { var page = razorPage(source); preview.querySelector(".maui-browser-content").innerHTML = page.html; bindPreviewEvents(source); return; }
      preview.querySelector(".maui-browser-content").innerHTML = '<pre>' + esc(source) + '</pre>';
    }

    function bindPreviewEvents(source) {
      var content = preview.querySelector(".maui-browser-content");
      content.querySelectorAll("[data-playground-click]").forEach(function (button) {
        button.addEventListener("click", function (event) {
          event.preventDefault(); var name = button.getAttribute("data-playground-click").trim(); var state = stateFor(source);
          try { executeMethod(name, source, state); render(); } catch (error) { output.textContent = error.message; }
        });
      });
    }

    editor.addEventListener("input", function () { syncEditor(); markDirty(); });
    run.onclick = function () { render(); output.textContent = "Preview rendered successfully."; };
    create.onclick = function () { output.textContent = "Project creation is available in the playground editor."; };
    renderTree(); renderTabs(); load(currentProject, currentFile); render();
    var params = new URLSearchParams(window.location.search); var demo = params.get("demo");
    if (demo && window.MauiPlaygroundDemos && typeof window.MauiPlaygroundDemos.load === "function") window.MauiPlaygroundDemos.load(demo);
    window.MauiPlayground = { projects: projects, load: load, render: render, saveProject: saveProject, stateFor: stateFor, executeMethod: executeMethod };
  }

  function addStyles() {
    if (document.getElementById("maui-playground-js-styles")) return;
    var style = document.createElement("style"); style.id = "maui-playground-js-styles";
    style.textContent = ".maui-tree-folder-row{display:flex;align-items:center;justify-content:space-between}.maui-tree-folder-link{display:flex;align-items:center;white-space:nowrap;min-width:0}.maui-tree-folder-link strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.maui-tree-children{margin:0;padding-left:22px;list-style:none}.maui-tree-link{cursor:pointer;display:block;color:#344054;text-decoration:none !important;padding:4px 6px;border-radius:5px;color: inherit}.maui-tree-link:hover,.maui-tree-link.active{background:#e8f1ff;color:#0d6efd;text-decoration:none !important;}.maui-tree-add-link{display:inline-block}.maui-file-dirty{color:#d92d20}.maui-runtime-error{padding:18px;border:1px solid #fecdca;background:#fef3f2;color:#b42318;border-radius:8px}.maui-runtime-error pre{white-space:pre-wrap}.maui-nuget-bar{display:flex;gap:8px;align-items:center;padding:8px 12px;border-bottom:1px solid #d0d5dd;background:#fff}.maui-nuget-bar input{flex:1;padding:7px 9px;border:1px solid #d0d5dd;border-radius:6px}.maui-nuget-bar button,.maui-save-button{border:0;border-radius:6px;padding:7px 10px;background:#0d6efd;color:#fff;cursor:pointer}.maui-nuget-status{font-size:12px;color:#667085}.maui-save-button{margin-left:auto}.playground-radzen-button,.playground-mud-button{border:0;border-radius:6px;padding:8px 12px;background:#0d6efd;color:#fff;cursor:pointer}.playground-radzen-input,.playground-mud-input{display:block;padding:8px;border:1px solid #d0d5dd;border-radius:6px;margin:8px 0}.playground-radzen-label{display:inline-block;margin:8px 0}";
    document.head.appendChild(style);
  }

  function setupNuget() {
    var bar = document.getElementById("maui-nuget-bar");
    if (!bar) return;
    var input = bar.querySelector("input"); var button = bar.querySelector("button"); var status = bar.querySelector(".maui-nuget-status");
    if (!input || !button || !status) return;
    input.value = "";
    button.onclick = function () { var name = input.value.trim(); if (!name) return; installedPackages[name] = true; status.textContent = name + " installed for playground preview."; };
  }

  function addSaveButton() {
    var run = document.getElementById("maui-run-preview");
    if (!run || document.getElementById("maui-save-project")) return;
    var button = document.createElement("button"); button.id = "maui-save-project"; button.type = "button"; button.className = "maui-save-button"; button.textContent = "Save";
    run.parentNode.appendChild(button);
    button.onclick = function () { if (window.MauiPlayground && window.MauiPlayground.saveProject) window.MauiPlayground.saveProject(); };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
