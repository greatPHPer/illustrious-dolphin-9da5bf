/* Algolassi MAUI Hybrid browser playground */
(function () {
  "use strict";

  var projects = {
    "1. MyMauiApp": {
      "MainPage.xaml": "<ContentPage xmlns=\"http://schemas.microsoft.com/dotnet/2021/maui\" xmlns:x=\"http://schemas.microsoft.com/winfx/2009/xaml\" x:Class=\"MyMauiApp.MainPage\">\n    <VerticalStackLayout Padding=\"30\">\n        <Label Text=\"Hello from MAUI Hybrid!\" FontSize=\"24\" />\n    </VerticalStackLayout>\n</ContentPage>",
      "MainPage.xaml.cs": "namespace MyMauiApp;\n\npublic partial class MainPage : ContentPage\n{\n    public MainPage() { InitializeComponent(); }\n}",
      "MauiProgram.cs": "namespace MyMauiApp;\n\npublic static class MauiProgram\n{\n    public static MauiApp CreateMauiApp()\n    {\n        var builder = MauiApp.CreateBuilder();\n        builder.UseMauiApp<App>();\n        return builder.Build();\n    }\n}"
    },
    "2. MyMauiApp.Shared": {
      "Home.razor": "@page \"/home\"\n\n<h1>Hello from Shared!</h1>\n<p>This Home.razor belongs to the Shared project.</p>\n<a href=\"/home\">Go Home</a>",
      "Models/AppMessage.cs": "namespace MyMauiApp.Shared.Models;\n\npublic record AppMessage(string Text);"
    },
    "3. MyMauiApp.Web": {
      "Program.cs": "var builder = WebApplication.CreateBuilder(args);\nbuilder.Services.AddRazorComponents().AddInteractiveServerComponents();\nvar app = builder.Build();\napp.MapRazorComponents<App>().AddInteractiveServerRenderMode();\napp.Run();"
    },
    "4. MyMauiApp.Web.Client": {
      "Home.razor": "@page \"/\"\n\n<h1>@message</h1>\n<button @onclick=\"ChangeMessage\">Click Me</button>\n\n@code {\n    private string message = \"Hello from Web Client!\";\n    private void ChangeMessage() => message = \"You clicked the button!\";\n}"
    }
  };

  var installedPackages = {};
  var packageRecipes = {
    "Radzen.Blazor": {
      project: "3. MyMauiApp.Web",
      registration: "builder.Services.AddRadzenComponents();",
      usings: ["@using Radzen", "@using Radzen.Blazor"],
      components: {
        RadzenButton: function (a) { return '<button class="playground-radzen-button">' + esc(a.Text || "Radzen Button") + '</button>'; },
        RadzenTextBox: function (a) { return '<input class="playground-radzen-input" placeholder="' + esc(a.Placeholder || "") + '" value="' + esc(a.Value || "") + '">'; },
        RadzenLabel: function (a) { return '<span class="playground-radzen-label">' + esc(a.Text || "") + '</span>'; }
      }
    },
    "MudBlazor": {
      project: "3. MyMauiApp.Web",
      registration: "builder.Services.AddMudServices();",
      usings: ["@using MudBlazor"],
      components: {
        MudButton: function (a) { return '<button class="playground-mud-button">' + esc(a.ChildContent || a.Text || "MudButton") + '</button>'; },
        MudTextField: function (a) { return '<input class="playground-mud-input" placeholder="' + esc(a.Label || a.Placeholder || "") + '">'; }
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
    return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
  }

  function start() {
    var currentProject = "1. MyMauiApp";
    var currentFile = "MainPage.xaml";
    var editor = document.getElementById("maui-code-editor");
    var output = document.getElementById("maui-console-output");
    var preview = document.getElementById("maui-browser-preview");
    var tabs = document.getElementById("maui-editor-tabs");
    var tree = document.querySelector(".maui-project-tree");
    if (!editor || !output || !preview || !tabs || !tree) return;

    addStyles();

    function files() { return projects[currentProject] || {}; }
    function save() {
      if (currentProject && currentFile && Object.prototype.hasOwnProperty.call(files(), currentFile)) {
        files()[currentFile] = editor.value;
      }
    }
    function load(project, file) {
      currentProject = project;
      currentFile = file;
      editor.value = Object.prototype.hasOwnProperty.call(projects[project], file) ? projects[project][file] : "";
      editor.dataset.project = project;
      editor.dataset.file = file;
    }
    function renderTabs() {
      tabs.innerHTML = "";
      var names = Object.keys(files());
      if (names.indexOf(currentFile) < 0) currentFile = names[0] || "";
      names.forEach(function (name) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = name;
        b.className = name === currentFile ? "active" : "";
        b.onclick = function (e) {
          e.preventDefault();
          save();
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
      if (!name) return;
      name = name.trim();
      if (!name) return;
      if (projects[project][name] !== undefined) { alert("That file already exists."); return; }
      save();
      projects[project][name] = "";
      load(project, name);
      renderTree();
      renderTabs();
      render();
    }
    function renderTree() {
      tree.innerHTML = "";
      Object.keys(projects).forEach(function (project) {
        var root = document.createElement("li");
        var row = document.createElement("div");
        var folder = document.createElement("a");
        var plus = document.createElement("a");
        var ul = document.createElement("ul");
        row.className = "maui-tree-folder-row";
        folder.href = "#";
        plus.href = "#";
        folder.className = "maui-tree-link maui-tree-folder-link";
        plus.className = "maui-tree-link maui-tree-add-link";
        folder.innerHTML = "▾ 📁 <strong>" + esc(project) + "</strong>";
        plus.textContent = "+";
        plus.title = "Add file";
        row.append(folder, plus);
        ul.className = "maui-tree-children";
        root.append(row, ul);
        Object.keys(projects[project]).forEach(function (path) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.href = "#";
          a.className = "maui-tree-link";
          a.textContent = "📄 " + path;
          if (project === currentProject && path === currentFile) a.classList.add("active");
          a.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            save();
            load(project, path);
            renderTree();
            renderTabs();
            render();
          };
          li.appendChild(a);
          ul.appendChild(li);
        });
        plus.onclick = function (e) { e.preventDefault(); e.stopPropagation(); addFile(project); };
        folder.onclick = function (e) {
          e.preventDefault();
          save();
          currentProject = project;
          currentFile = Object.keys(projects[project])[0] || "";
          load(currentProject, currentFile);
          renderTabs();
          renderTree();
          render();
        };
        tree.appendChild(root);
      });
    }
    function attrs(s) {
      var a = {}, r = /([:@\w-]+)\s*=\s*["']([^"']*)["']/g, m;
      while ((m = r.exec(s))) a[m[1]] = m[2];
      return a;
    }
    function renderComponents(s) {
      var out = "";
      Object.keys(packageRecipes).forEach(function (id) {
        var recipe = packageRecipes[id];
        if (!installedPackages[id]) return;
        Object.keys(recipe.components).forEach(function (component) {
          var re = new RegExp("<" + component + "\\b([^>]*)\\/?>(?:<\\/" + component + ">)?", "gi"), m;
          while ((m = re.exec(s))) out += recipe.components[component](attrs(m[1] || ""));
        });
      });
      return out;
    }
    function razorPage(s) {
      var route = (s.match(/@page\s+["']([^"']+)["']/i) || [, ""])[1] || "/";
      var h = (s.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [, ""])[1];
      var p = (s.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [, ""])[1];
      var html = (h ? "<h1>" + h + "</h1>" : "") + (p ? "<p>" + p + "</p>" : "") + renderComponents(s);
      var r = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, m;
      while ((m = r.exec(s))) html += '<a href="' + esc(m[1]) + '" data-playground-route="' + esc(m[1]) + '">' + m[2] + "</a> ";
      return { route: route, html: html };
    }
    function findRoute(path) {
      var found = null;
      Object.keys(projects).some(function (project) {
        return Object.keys(projects[project]).some(function (file) {
          if (!/\.razor$/i.test(file)) return false;
          if (razorPage(projects[project][file]).route === path) { found = { project: project, file: file }; return true; }
          return false;
        });
      });
      return found;
    }
    function route(path) {
      var target = findRoute(path);
      if (!target) return;
      save();
      load(target.project, target.file);
      renderTree();
      renderTabs();
      render();
    }
    function xaml(s) {
      var out = [], r = /<Label\b([^>]*?)(?:\/?>)/gi, m;
      while ((m = r.exec(s))) {
        var t = m[1].match(/\bText\s*=\s*["']([^"']*)["']/i);
        var f = m[1].match(/\bFontSize\s*=\s*["']([^"']*)["']/i);
        if (t) out.push('<div style="font-size:' + (f ? parseFloat(f[1]) : 16) + 'px;margin-bottom:16px">' + esc(t[1]) + '</div>');
      }
      return out.join("") || "<p>No previewable Label was found.</p>";
    }
    function packageReference(id, version, project) {
      if (!projects[project]) return;
      var name = project.split(".").pop() + ".csproj";
      var file = projects[project][name] || '<Project Sdk="Microsoft.NET.Sdk.Web">\n  <PropertyGroup><TargetFramework>net9.0</TargetFramework></PropertyGroup>\n</Project>';
      if (file.indexOf('PackageReference Include="' + id + '"') < 0) {
        file = file.replace(/<\/Project>\s*$/, '  <ItemGroup>\n    <PackageReference Include="' + id + '" Version="' + (version || "latest") + '" />\n  </ItemGroup>\n</Project>');
      }
      projects[project][name] = file;
    }
    function applyRecipe(id, version) {
      var recipe = packageRecipes[id];
      if (!recipe) { packageReference(id, version, "3. MyMauiApp.Web"); return null; }
      packageReference(id, version, recipe.project);
      var program = projects[recipe.project]["Program.cs"] || "";
      if (recipe.registration && program.indexOf(recipe.registration) < 0) {
        var marker = "var app =";
        var pos = program.indexOf(marker);
        program = pos >= 0 ? program.slice(0, pos) + recipe.registration + "\n" + program.slice(pos) : program + "\n" + recipe.registration + "\n";
      }
      projects[recipe.project]["Program.cs"] = program;
      return recipe;
    }
    function installPackage(pkg, button) {
      if (installedPackages[pkg.id]) return;
      installedPackages[pkg.id] = pkg;
      var recipe = applyRecipe(pkg.id, pkg.version);
      button.textContent = "Installed";
      button.classList.add("installed");
      button.onclick = null;
      save();
      renderTree();
      renderTabs();
      render();
      output.textContent = "NuGet package installed: " + pkg.id + (recipe ? "\nTarget project: " + recipe.project + "\nProgram.cs: " + recipe.registration : "\nNo package-specific setup recipe is registered yet; PackageReference was added to Web.");
    }
    function setupNuget() {
      if (document.getElementById("maui-nuget-panel")) return;
      var host = tree.parentElement || tree.parentNode;
      var panel = document.createElement("section");
      var toggle = document.createElement("a");
      panel.id = "maui-nuget-panel";
      panel.innerHTML = '<div><strong>📦 NuGet</strong> <a href="#" id="maui-nuget-close">Hide</a></div><div><input id="maui-nuget-query" type="search" placeholder="Search NuGet packages…" autocomplete="off"> <a href="#" id="maui-nuget-search-btn">Search</a></div><div id="maui-nuget-status"></div><div id="maui-nuget-results"></div>';
      panel.style.cssText = "display:none;margin-top:12px;padding:10px;border-top:1px solid rgba(127,127,127,.25);font-size:.9rem";
      toggle.href = "#";
      toggle.id = "maui-nuget-toggle";
      toggle.textContent = "📦 NuGet";
      toggle.style.cssText = "display:block;margin:8px 0;padding:4px 2px;text-decoration:none";
      host.insertBefore(toggle, tree);
      host.insertBefore(panel, tree);
      var q = panel.querySelector("#maui-nuget-query");
      var results = panel.querySelector("#maui-nuget-results");
      var status = panel.querySelector("#maui-nuget-status");
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
              var recipe = packageRecipes[p.id], installed = !!installedPackages[p.id];
              return '<div class="maui-nuget-result"><div class="maui-nuget-result-head"><strong>' + esc(p.id || "") + '</strong><a href="#" class="maui-nuget-install ' + (installed ? "installed" : "") + '" data-id="' + esc(p.id || "") + '">' + (installed ? "Installed" : "Install") + '</a></div><div>' + esc(p.description || "No description available.") + '</div><small>v' + esc(p.version || "") + " · Downloads: " + Number(p.totalDownloads || 0).toLocaleString() + '</small>' + (recipe ? '<div class="maui-package-setup">✓ Package-specific setup available<br>Program.cs: <code>' + esc(recipe.registration || "None") + '</code><br>Target: ' + esc(recipe.project) + '</div>' : "") + '</div>';
            }).join("") || "<div>No packages found.</div>";
            results.querySelectorAll(".maui-nuget-install").forEach(function (button) {
              button.onclick = function (e) {
                e.preventDefault();
                var pkg = items.find(function (p) { return p.id === button.dataset.id; });
                if (pkg) installPackage(pkg, button);
              };
            });
          })
          .catch(function () { status.textContent = "NuGet search is unavailable right now."; results.innerHTML = "<div>Could not reach NuGet.org.</div>"; });
      }
      toggle.onclick = function (e) { e.preventDefault(); panel.style.display = panel.style.display === "none" ? "block" : "none"; if (panel.style.display !== "none") q.focus(); };
      panel.querySelector("#maui-nuget-close").onclick = function (e) { e.preventDefault(); panel.style.display = "none"; };
      panel.querySelector("#maui-nuget-search-btn").onclick = function (e) { e.preventDefault(); search(); };
      q.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); search(); } };
    }
    function render() {
      save();
      var body = currentProject === "1. MyMauiApp" && currentFile === "MainPage.xaml" ? xaml(files()[currentFile]) : /\.razor$/i.test(currentFile) ? razorPage(files()[currentFile]).html : "<p>This source file is editable but has no browser renderer yet.</p>";
      preview.innerHTML = '<div class="maui-browser-toolbar"><span>●</span><span>●</span><span>●</span><code>https://preview.algolassi.local/</code></div><div class="maui-browser-content">' + body + "</div>";
      preview.querySelectorAll("a[data-playground-route]").forEach(function (a) {
        a.addEventListener("click", function (e) {
          var href = a.getAttribute("href");
          if (href && href.charAt(0) === "/") { e.preventDefault(); route(href); }
        });
      });
      output.textContent = "Preview refreshed.\n\nCurrent file: " + currentProject + " / " + currentFile;
    }
    function addStyles() {
      if (document.getElementById("maui-playground-runtime-style")) return;
      var st = document.createElement("style");
      st.id = "maui-playground-runtime-style";
      st.textContent = ".maui-project-tree .maui-tree-link{display:block;width:100%;box-sizing:border-box;border:0;background:transparent;color:inherit;text-decoration:none;text-align:left;font:inherit;cursor:pointer;padding:4px 8px;border-radius:4px;line-height:1.35}.maui-project-tree .maui-tree-link:hover{background:rgba(127,127,127,.12)}.maui-project-tree .maui-tree-link.active{background:rgba(0,120,212,.16)}.maui-project-tree .maui-tree-folder-row{display:flex;align-items:center;gap:2px}.maui-project-tree .maui-tree-folder-link{flex:1;font-weight:600}.maui-project-tree .maui-tree-add-link{width:auto;flex:0 0 auto;padding:2px 7px;opacity:.65}.maui-project-tree .maui-tree-children{margin:0;padding-left:14px}.maui-nuget-result{padding:10px 0;border-bottom:1px solid rgba(127,127,127,.18)}.maui-nuget-result-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.maui-nuget-install{display:inline-block;border:1px solid rgba(127,127,127,.45);border-radius:4px;padding:3px 9px;text-decoration:none;font-size:.85em;cursor:pointer;background:transparent;color:inherit}.maui-nuget-install:hover{background:rgba(0,120,212,.12)}.maui-nuget-install.installed{opacity:.7;cursor:default}.maui-package-setup{margin-top:7px;padding:7px;border-left:3px solid rgba(0,120,212,.55);font-size:.85em}.playground-radzen-button,.playground-mud-button{padding:8px 16px;border-radius:4px;color:#fff;cursor:pointer}.playground-radzen-button{border:1px solid #1677ff;background:#1677ff}.playground-mud-button{border:1px solid #594ae2;background:#594ae2}.playground-radzen-input,.playground-mud-input{padding:8px 10px;border:1px solid #aaa;border-radius:4px}.playground-radzen-label{display:inline-block;padding:4px 0}#maui-nuget-results{max-height:420px;overflow-y:auto;overflow-x:hidden;padding-right:6px;scrollbar-width:thin}#maui-nuget-results::-webkit-scrollbar{width:8px}#maui-nuget-results::-webkit-scrollbar-thumb{border-radius:8px;background:rgba(127,127,127,.45)}#maui-nuget-results::-webkit-scrollbar-track{background:transparent}";
      document.head.appendChild(st);
    }

    var run = document.getElementById("maui-run-preview");
    var create = document.getElementById("maui-create-project");
    if (run) run.onclick = function () { save(); render(); };
    if (create) create.onclick = function () { save(); load("1. MyMauiApp", "MainPage.xaml"); renderTree(); renderTabs(); render(); };
    editor.oninput = function () { save(); output.textContent = "Unsaved changes in " + currentProject + " / " + currentFile + ". Click Run Preview to apply them."; };
    load(currentProject, currentFile);
    renderTree();
    renderTabs();
    setupNuget();
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();