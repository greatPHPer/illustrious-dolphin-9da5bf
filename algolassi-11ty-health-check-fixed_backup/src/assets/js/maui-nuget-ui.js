/* Algolassi MAUI playground NuGet browser */
(function () {
  "use strict";
  var catalog = [
    { id: "Radzen.Blazor", version: "6.x", description: "Radzen Blazor UI components" },
    { id: "MudBlazor", version: "8.x", description: "Material Design components for Blazor" },
    { id: "Blazored.LocalStorage", version: "4.x", description: "Local storage support for Blazor" },
    { id: "Microsoft.Extensions.Http", version: "9.0.x", description: "HttpClient dependency injection extensions" },
    { id: "Microsoft.AspNetCore.Components", version: "9.0.x", description: "Blazor component framework" },
    { id: "Microsoft.AspNetCore.Components.Web", version: "9.0.x", description: "Blazor web components and rendering" },
    { id: "Microsoft.Maui.Controls", version: "9.0.x", description: "Core .NET MAUI controls" }
  ];
  var basePackages = [
    { id: "Microsoft.Maui.Controls", version: "9.0.x" },
    { id: "Microsoft.AspNetCore.Components", version: "9.0.x" },
    { id: "Microsoft.AspNetCore.Components.Web", version: "9.0.x" },
    { id: "Radzen.Blazor", version: "6.x" }
  ];
  var installed = {};
  basePackages.forEach(function (pkg) { installed[pkg.id] = pkg; });
  function esc(value) { return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function renderInstalled() {
    var list = document.getElementById("maui-packages-list");
    var count = document.getElementById("maui-packages-count");
    if (!list || !count) return;
    var packages = Object.keys(installed).map(function (key) { return installed[key]; });
    packages.sort(function (a, b) { return a.id.localeCompare(b.id); });
    //list.innerHTML = packages.map(function (pkg) { return '<div class="maui-package"><span>📦 ' + esc(pkg.id) + '</span><code>' + esc(pkg.version) + '</code></div>'; }).join("");
    list.innerHTML = packages.map(function (pkg) {
  var isRequiredPackage =
  pkg.id === "Microsoft.Maui.Controls" ||
  pkg.id === "Microsoft.AspNetCore.Components" ||
  pkg.id === "Microsoft.AspNetCore.Components.Web";

return '<div class="maui-package">' +
  '<span>📦 ' + esc(pkg.id) + '</span>' +
  '<code>' + esc(pkg.version) + '</code>' +
  (isRequiredPackage
    ? '<span class="maui-package-required">Required</span>'
    : '<button type="button" class="maui-package-remove" data-nuget-id="' +
      esc(pkg.id) +
      '">Remove</button>') +
  '</div>';
}).join("");

list.querySelectorAll(".maui-package-remove").forEach(function (button) {
  button.addEventListener("click", function () {
    var id = button.getAttribute("data-nuget-id");

    if (!installed[id]) return;

    delete installed[id];

    renderInstalled();

    var input = document.getElementById("maui-nuget-input");
    if (input) {
      renderResults(input.value);
    }

    var status = document.getElementById("maui-nuget-status");
    if (status) {
      status.textContent = id + " removed from this playground session.";
    }
  });
});
    count.textContent = packages.length + (packages.length === 1 ? " package" : " packages");
  }
  function renderResults(query) {
    var results = document.getElementById("maui-nuget-results");
    if (!results) return;
    var q = String(query || "").trim().toLowerCase();
    if (!q) { results.innerHTML = ""; return; }
    var matches = catalog.filter(function (pkg) { return pkg.id.toLowerCase().indexOf(q) >= 0 || pkg.description.toLowerCase().indexOf(q) >= 0; }).slice(0, 6);
    results.innerHTML = matches.length ? matches.map(function (pkg) {
      //var action = installed[pkg.id] ? '<span class="maui-nuget-installed">Installed</span>' : '<button type="button" data-nuget-id="' + esc(pkg.id) + '">Install</button>';//removed installed label dhilip 20260810
      var action = installed[pkg.id]
  ? '<button type="button" class="maui-nuget-remove" data-nuget-id="' + esc(pkg.id) + '">Remove</button>'
  : '<button type="button" data-nuget-id="' + esc(pkg.id) + '">Install</button>';
      return '<div class="maui-nuget-result"><div><strong>' + esc(pkg.id) + '</strong><small>' + esc(pkg.description) + ' · ' + esc(pkg.version) + '</small></div>' + action + '</div>';
    }).join("") : '<div class="maui-nuget-empty">No matching packages.</div>';
    results.querySelectorAll("button[data-nuget-id]").forEach(function (button) {
      button.addEventListener("click", function () {
        var id = button.getAttribute("data-nuget-id");
        var pkg = catalog.find(function (item) { return item.id === id; });
        /*if (!pkg || installed[id]) return;
        installed[id] = pkg;
        renderInstalled();*/
        if (!pkg) return;

if (installed[id]) {
  delete installed[id];
  renderInstalled();
  renderResults(
    document.getElementById("maui-nuget-input")?.value || ""
  );

  var status = document.getElementById("maui-nuget-status");
  if (status) {
    status.textContent = id + " removed from this playground session.";
  }

  return;
}

installed[id] = pkg;
renderInstalled();
renderResults("");

var status = document.getElementById("maui-nuget-status");
if (status) {
  status.textContent = id + " installed for this playground session.";
}
        var input = document.getElementById("maui-nuget-input");
        if (input) input.value = "";
        renderResults("");
        var status = document.getElementById("maui-nuget-status");
        if (status) status.textContent = id + " installed for this playground session.";
        var legacyButton = document.getElementById("maui-nuget-install");
        var legacyInput = document.querySelector(".maui-nuget-bar input#maui-nuget-input");
        if (legacyButton && legacyInput && legacyButton !== button) { legacyInput.value = id; legacyButton.click(); legacyInput.value = ""; }
      });
    });
  }
  function enhance() {
    var bar = document.querySelector(".maui-nuget-bar");
    if (!bar || bar.dataset.enhanced === "true") return false;
    bar.dataset.enhanced = "true";
    bar.innerHTML = '<div class="maui-nuget-search-wrap"><input id="maui-nuget-input" autocomplete="off" placeholder="Search NuGet packages..."><div id="maui-nuget-results" class="maui-nuget-results"></div></div><span class="maui-nuget-status" id="maui-nuget-status">Search for a package to install it.</span>';
    var input = document.getElementById("maui-nuget-input");
    input.addEventListener("input", function () { renderResults(input.value); });
    input.addEventListener("focus", function () { renderResults(input.value); });
    renderInstalled();
    return true;
  }
  function start() {
    var attempts = 0;
    var timer = setInterval(function () { attempts++; if (enhance() || attempts > 100) clearInterval(timer); }, 100);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
