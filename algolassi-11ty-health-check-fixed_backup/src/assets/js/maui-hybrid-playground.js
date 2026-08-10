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

  var section = document.createElement("section");
  section.id = "maui-nuget-section";

  section.innerHTML =
    '<div class="maui-installed-header">' +
      '<div class="maui-installed-title">' +
        '<span class="maui-installed-icon">📦</span>' +
        '<strong>Installed Packages</strong>' +
        '<span id="maui-installed-count" class="maui-installed-count">0</span>' +
      '</div>' +
      '<a href="#" id="maui-nuget-toggle" class="maui-nuget-add">＋ Add Package</a>' +
    '</div>' +

    '<div id="maui-nuget-panel" class="maui-nuget-panel">' +
      '<div class="maui-nuget-search-row">' +
        '<input id="maui-nuget-query" type="search" ' +
          'placeholder="Search NuGet packages…" autocomplete="off">' +
        '<a href="#" id="maui-nuget-search-btn" class="maui-nuget-search-btn">Search</a>' +
        '<a href="#" id="maui-nuget-close" class="maui-nuget-close" title="Close">×</a>' +
      '</div>' +
      '<div id="maui-nuget-status" class="maui-nuget-status"></div>' +
      '<div id="maui-nuget-results" class="maui-nuget-results"></div>' +
    '</div>' +

    '<div id="maui-installed-packages" class="maui-installed-packages">' +
      '<div class="maui-no-packages">No packages installed yet.</div>' +
    '</div>';

  /*
   * IMPORTANT:
   * Put the whole NuGet section AFTER the Solution Explorer.
   */
  host.appendChild(section);

  var panel = section.querySelector("#maui-nuget-panel");
  var q = section.querySelector("#maui-nuget-query");
  var results = section.querySelector("#maui-nuget-results");
  var status = section.querySelector("#maui-nuget-status");
  var installedList = section.querySelector("#maui-installed-packages");
  var count = section.querySelector("#maui-installed-count");

  function renderInstalledPackages() {
    var ids = Object.keys(installedPackages);

    count.textContent = ids.length;

    if (!ids.length) {
      installedList.innerHTML =
        '<div class="maui-no-packages">' +
          'No packages installed yet.' +
        '</div>';
      return;
    }

    installedList.innerHTML = ids.map(function (id) {
      var pkg = installedPackages[id] || {};
      var recipe = packageRecipes[id];

      var version = pkg.version || "latest";
      var project = recipe ? recipe.project : "3. MyMauiApp.Web";

      return (
        '<div class="maui-installed-package">' +

          '<div class="maui-installed-package-icon">📦</div>' +

          '<div class="maui-installed-package-info">' +
            '<div class="maui-installed-package-name">' +
              esc(pkg.id || id) +
            '</div>' +

            '<div class="maui-installed-package-meta">' +
              'v' + esc(version) +
              ' · ' +
              esc(project) +
            '</div>' +

          '</div>' +

          '<span class="maui-installed-check">✓</span>' +

        '</div>'
      );
    }).join("");
  }

  function search() {
    var term = q.value.trim();

    if (!term) {
      status.textContent = "Enter a package name.";
      results.innerHTML = "";
      return;
    }

    status.textContent = "Searching NuGet.org…";
    results.innerHTML =
      '<div class="maui-nuget-loading">Searching packages…</div>';

    fetch(
      "https://azuresearch-usnc.nuget.org/query?q=" +
      encodeURIComponent(term) +
      "&prerelease=false&take=20"
    )
      .then(function (r) {
        if (!r.ok) throw new Error("NuGet search failed");
        return r.json();
      })

      .then(function (data) {
        var items = data.data || [];

        status.textContent =
          items.length +
          " package" +
          (items.length === 1 ? "" : "s") +
          " found";

        results.innerHTML =
          items.map(function (p) {

            var recipe = packageRecipes[p.id];
            var installed = !!installedPackages[p.id];

            return (
              '<div class="maui-nuget-result">' +

                '<div class="maui-nuget-result-head">' +

                  '<div class="maui-nuget-package-name">' +
                    '<span class="maui-package-icon">📦</span>' +
                    '<strong>' +
                      esc(p.id || "") +
                    '</strong>' +
                  '</div>' +

                  '<a href="#" ' +
                    'class="maui-nuget-install ' +
                    (installed ? "installed" : "") +
                    '" ' +
                    'data-id="' +
                    esc(p.id || "") +
                    '">' +
                    (installed ? "✓ Installed" : "Install") +
                  '</a>' +

                '</div>' +

                '<div class="maui-nuget-description">' +
                  esc(
                    p.description ||
                    "No description available."
                  ) +
                '</div>' +

                '<div class="maui-nuget-meta">' +
                  'v' + esc(p.version || "") +
                  ' · Downloads: ' +
                  Number(
                    p.totalDownloads || 0
                  ).toLocaleString() +
                '</div>' +

                (
                  recipe
                    ? '<div class="maui-package-setup">' +
                        '<strong>✓ Package setup available</strong>' +
                        '<br>Program.cs: <code>' +
                        esc(recipe.registration || "None") +
                        '</code>' +
                        '<br>Target: ' +
                        esc(recipe.project) +
                      '</div>'
                    : ""
                ) +

              '</div>'
            );
          }).join("") ||
          '<div class="maui-no-results">' +
            'No packages found.' +
          '</div>';

        results
          .querySelectorAll(".maui-nuget-install")
          .forEach(function (button) {

            button.onclick = function (e) {
              e.preventDefault();

              var pkg = items.find(function (p) {
                return p.id === button.dataset.id;
              });

              if (!pkg) return;

              installPackage(pkg, button);

              renderInstalledPackages();
            };
          });
      })

      .catch(function () {
        status.textContent =
          "NuGet search is unavailable right now.";

        results.innerHTML =
          '<div class="maui-no-results">' +
            'Could not reach NuGet.org.' +
          '</div>';
      });
  }

  /*
   * Open search panel.
   */
  section
    .querySelector("#maui-nuget-toggle")
    .onclick = function (e) {

      e.preventDefault();

      panel.classList.toggle("open");

      if (panel.classList.contains("open")) {
        q.focus();
      }
    };

  /*
   * Close search panel.
   */
  section
    .querySelector("#maui-nuget-close")
    .onclick = function (e) {

      e.preventDefault();

      panel.classList.remove("open");
    };

  /*
   * Search button.
   */
  section
    .querySelector("#maui-nuget-search-btn")
    .onclick = function (e) {

      e.preventDefault();
      search();
    };

  /*
   * Enter key.
   */
  q.onkeydown = function (e) {

    if (e.key === "Enter") {
      e.preventDefault();
      search();
    }
  };

  /*
   * Initial package list.
   */
  renderInstalledPackages();
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

  st.textContent =

    /*
     * Solution Explorer
     */
    ".maui-project-tree li{" +
      "list-style:none;" +
      "margin:0;" +
      "padding:0" +
    "}" +

    ".maui-project-tree .maui-tree-link{" +
      "display:block;" +
      "width:100%;" +
      "box-sizing:border-box;" +
      "border:0;" +
      "background:transparent;" +
      "color:inherit;" +
      "text-decoration:none;" +
      "text-align:left;" +
      "font:inherit;" +
      "cursor:pointer;" +
      "padding:4px 8px;" +
      "border-radius:4px;" +
      "line-height:1.35" +
    "}" +

    ".maui-project-tree .maui-tree-link:hover{" +
      "background:rgba(127,127,127,.12)" +
    "}" +

    ".maui-project-tree .maui-tree-link.active{" +
      "background:rgba(0,120,212,.16)" +
    "}" +

    ".maui-project-tree .maui-tree-folder-row{" +
      "display:flex;" +
      "align-items:center;" +
      "gap:2px" +
    "}" +

    ".maui-project-tree .maui-tree-folder-link{" +
      "flex:1;" +
      "font-weight:600" +
    "}" +

    ".maui-project-tree .maui-tree-add-link{" +
      "width:auto;" +
      "flex:0 0 auto;" +
      "padding:2px 7px;" +
      "opacity:.65" +
    "}" +

    ".maui-project-tree .maui-tree-children{" +
      "margin:0;" +
      "padding-left:14px" +
    "}" +

    /*
     * Installed Packages section
     */
    "#maui-nuget-section{" +
      "margin-top:18px;" +
      "border-top:1px solid rgba(127,127,127,.22);" +
      "padding-top:12px;" +
      "font-size:.9rem" +
    "}" +

    ".maui-installed-header{" +
      "display:flex;" +
      "align-items:center;" +
      "justify-content:space-between;" +
      "gap:8px;" +
      "margin-bottom:8px" +
    "}" +

    ".maui-installed-title{" +
      "display:flex;" +
      "align-items:center;" +
      "gap:7px;" +
      "min-width:0" +
    "}" +

    ".maui-installed-icon{" +
      "font-size:1.05rem" +
    "}" +

    ".maui-installed-count{" +
      "display:inline-flex;" +
      "align-items:center;" +
      "justify-content:center;" +
      "min-width:20px;" +
      "height:20px;" +
      "padding:0 5px;" +
      "box-sizing:border-box;" +
      "border-radius:10px;" +
      "background:rgba(0,120,212,.14);" +
      "font-size:.75rem;" +
      "font-weight:700" +
    "}" +

    ".maui-nuget-add{" +
      "white-space:nowrap;" +
      "text-decoration:none;" +
      "padding:5px 8px;" +
      "border-radius:5px;" +
      "font-size:.82rem;" +
      "font-weight:600;" +
      "color:inherit;" +
      "background:rgba(0,120,212,.10)" +
    "}" +

    ".maui-nuget-add:hover{" +
      "background:rgba(0,120,212,.18)" +
    "}" +

    /*
     * Installed package cards
     */
    ".maui-installed-packages{" +
      "display:flex;" +
      "flex-direction:column;" +
      "gap:5px;" +
      "max-height:220px;" +
      "overflow-y:auto;" +
      "overflow-x:hidden;" +
      "padding-right:3px" +
    "}" +

    ".maui-installed-package{" +
      "display:flex;" +
      "align-items:center;" +
      "gap:9px;" +
      "padding:8px 9px;" +
      "border:1px solid rgba(127,127,127,.18);" +
      "border-radius:7px;" +
      "background:rgba(127,127,127,.045);" +
      "transition:background .15s ease,transform .15s ease" +
    "}" +

    ".maui-installed-package:hover{" +
      "background:rgba(127,127,127,.10);" +
      "transform:translateX(1px)" +
    "}" +

    ".maui-installed-package-icon{" +
      "width:28px;" +
      "height:28px;" +
      "display:flex;" +
      "align-items:center;" +
      "justify-content:center;" +
      "border-radius:6px;" +
      "background:rgba(0,120,212,.10);" +
      "flex:0 0 auto" +
    "}" +

    ".maui-installed-package-info{" +
      "min-width:0;" +
      "flex:1" +
    "}" +

    ".maui-installed-package-name{" +
      "font-weight:600;" +
      "white-space:nowrap;" +
      "overflow:hidden;" +
      "text-overflow:ellipsis" +
    "}" +

    ".maui-installed-package-meta{" +
      "font-size:.73rem;" +
      "opacity:.62;" +
      "margin-top:2px;" +
      "white-space:nowrap;" +
      "overflow:hidden;" +
      "text-overflow:ellipsis" +
    "}" +

    ".maui-installed-check{" +
      "font-size:.85rem;" +
      "font-weight:700;" +
      "opacity:.7;" +
      "flex:0 0 auto" +
    "}" +

    ".maui-no-packages," +
    ".maui-no-results{" +
      "padding:10px;" +
      "text-align:center;" +
      "opacity:.6;" +
      "font-size:.82rem" +
    "}" +

    /*
     * NuGet search panel
     */
    ".maui-nuget-panel{" +
      "display:none;" +
      "margin-top:8px;" +
      "padding:9px;" +
      "border:1px solid rgba(127,127,127,.20);" +
      "border-radius:7px;" +
      "background:rgba(127,127,127,.035)" +
    "}" +

    ".maui-nuget-panel.open{" +
      "display:block" +
    "}" +

    ".maui-nuget-search-row{" +
      "display:flex;" +
      "align-items:center;" +
      "gap:5px" +
    "}" +

    "#maui-nuget-query{" +
      "flex:1;" +
      "min-width:0;" +
      "box-sizing:border-box;" +
      "padding:7px 9px;" +
      "border:1px solid rgba(127,127,127,.35);" +
      "border-radius:5px;" +
      "background:transparent;" +
      "color:inherit;" +
      "font:inherit;" +
      "outline:none" +
    "}" +

    "#maui-nuget-query:focus{" +
      "border-color:rgba(0,120,212,.65);" +
      "box-shadow:0 0 0 2px rgba(0,120,212,.10)" +
    "}" +

    ".maui-nuget-search-btn{" +
      "padding:7px 9px;" +
      "border-radius:5px;" +
      "text-decoration:none;" +
      "font-size:.82rem;" +
      "font-weight:600;" +
      "background:rgba(0,120,212,.14);" +
      "color:inherit" +
    "}" +

    ".maui-nuget-search-btn:hover{" +
      "background:rgba(0,120,212,.22)" +
    "}" +

    ".maui-nuget-close{" +
      "font-size:1.2rem;" +
      "line-height:1;" +
      "padding:5px;" +
      "text-decoration:none;" +
      "opacity:.65;" +
      "color:inherit" +
    "}" +

    ".maui-nuget-status{" +
      "padding:7px 2px;" +
      "font-size:.76rem;" +
      "opacity:.65" +
    "}" +

    ".maui-nuget-results{" +
      "max-height:300px;" +
      "overflow-y:auto;" +
      "overflow-x:hidden;" +
      "padding-right:4px;" +
      "scrollbar-width:thin" +
    "}" +

    ".maui-nuget-result{" +
      "padding:9px 2px;" +
      "border-bottom:1px solid rgba(127,127,127,.16)" +
    "}" +

    ".maui-nuget-result:last-child{" +
      "border-bottom:0" +
    "}" +

    ".maui-nuget-result-head{" +
      "display:flex;" +
      "align-items:center;" +
      "justify-content:space-between;" +
      "gap:7px" +
    "}" +

    ".maui-nuget-package-name{" +
      "display:flex;" +
      "align-items:center;" +
      "gap:5px;" +
      "min-width:0" +
    "}" +

    ".maui-package-icon{" +
      "font-size:.9rem;" +
      "flex:0 0 auto" +
    "}" +

    ".maui-nuget-install{" +
      "display:inline-block;" +
      "border:1px solid rgba(127,127,127,.40);" +
      "border-radius:5px;" +
      "padding:4px 8px;" +
      "text-decoration:none;" +
      "font-size:.76rem;" +
      "font-weight:600;" +
      "cursor:pointer;" +
      "background:transparent;" +
      "color:inherit;" +
      "white-space:nowrap;" +
      "flex:0 0 auto" +
    "}" +

    ".maui-nuget-install:hover{" +
      "background:rgba(0,120,212,.12)" +
    "}" +

    ".maui-nuget-install.installed{" +
      "opacity:.65;" +
      "cursor:default" +
    "}" +

    ".maui-nuget-description{" +
      "margin-top:5px;" +
      "font-size:.78rem;" +
      "line-height:1.4;" +
      "opacity:.78" +
    "}" +

    ".maui-nuget-meta{" +
      "margin-top:4px;" +
      "font-size:.70rem;" +
      "opacity:.55" +
    "}" +

    ".maui-package-setup{" +
      "margin-top:7px;" +
      "padding:7px;" +
      "border-left:3px solid rgba(0,120,212,.55);" +
      "font-size:.75rem;" +
      "line-height:1.45;" +
      "background:rgba(0,120,212,.045)" +
    "}" +

    ".maui-package-setup code{" +
      "font-size:.9em;" +
      "word-break:break-word" +
    "}" +

    ".maui-nuget-loading{" +
      "padding:15px;" +
      "text-align:center;" +
      "opacity:.6;" +
      "font-size:.8rem" +
    "}" +

    /*
     * NuGet scrollbars
     */
    ".maui-installed-packages::-webkit-scrollbar," +
    ".maui-nuget-results::-webkit-scrollbar{" +
      "width:7px" +
    "}" +

    ".maui-installed-packages::-webkit-scrollbar-thumb," +
    ".maui-nuget-results::-webkit-scrollbar-thumb{" +
      "border-radius:7px;" +
      "background:rgba(127,127,127,.35)" +
    "}" +

    ".maui-installed-packages::-webkit-scrollbar-track," +
    ".maui-nuget-results::-webkit-scrollbar-track{" +
      "background:transparent" +
    "}" +

    /*
     * Existing component styles
     */
    ".playground-radzen-button,.playground-mud-button{" +
      "padding:8px 16px;" +
      "border-radius:4px;" +
      "color:#fff;" +
      "cursor:pointer" +
    "}" +

    ".playground-radzen-button{" +
      "border:1px solid #1677ff;" +
      "background:#1677ff" +
    "}" +

    ".playground-mud-button{" +
      "border:1px solid #594ae2;" +
      "background:#594ae2" +
    "}" +

    ".playground-radzen-input,.playground-mud-input{" +
      "padding:8px 10px;" +
      "border:1px solid #aaa;" +
      "border-radius:4px" +
    "}" +

    ".playground-radzen-label{" +
      "display:inline-block;" +
      "padding:4px 0" +
    "}";

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
