/* Algolassi MAUI Hybrid browser playground */
(function () {
  "use strict";
  var dirtyFiles = {};
  var originalStart = window.__algolassiMauiPlaygroundStart;
  /* Dirty-state helpers are exposed so the existing playground renderer can use them. */
  window.algolassiMauiDirty = dirtyFiles;
  window.algolassiMauiMarkDirty = function (project, file) { dirtyFiles[project + "::" + file] = true; };
  window.algolassiMauiClearDirty = function (project, file) { delete dirtyFiles[project + "::" + file]; };
  window.algolassiMauiIsDirty = function (project, file) { return !!dirtyFiles[project + "::" + file]; };

  /* Preserve the current playground implementation while adding dirty markers and Save. */
  function installDirtyUi() {
    var editor = document.getElementById("maui-code-editor");
    var tabs = document.getElementById("maui-editor-tabs");
    var tree = document.querySelector(".maui-project-tree");
    var run = document.getElementById("maui-run-preview");
    if (!editor || !tabs || !tree || !run || window.__algolassiDirtyUiInstalled) return;
    window.__algolassiDirtyUiInstalled = true;

    var save = document.createElement("button");
    save.type = "button";
    save.id = "maui-save-file";
    save.textContent = "💾 Save";
    save.className = "maui-editor-save";
    run.parentNode.insertBefore(save, run.nextSibling);

    var style = document.createElement("style");
    style.textContent = ".maui-dirty-marker{font-weight:800;margin-left:3px}.maui-editor-save{margin-left:6px}.maui-editor-save.has-unsaved{font-weight:700}.maui-project-tree,.maui-project-tree ul,.maui-project-tree li{list-style:none}";
    document.head.appendChild(style);

    function current() { return { project: editor.dataset.project || "", file: editor.dataset.file || "" }; }
    function refreshMarkers() {
      var c = current();
      tabs.querySelectorAll("button").forEach(function (b) {
        var text = b.textContent.replace(/\s*\*\s*$/, "");
        var name = text.trim();
        var key = c.project + "::" + name;
        if (dirtyFiles[key]) {
          if (!b.querySelector(".maui-dirty-marker")) b.insertAdjacentHTML("beforeend", ' <span class="maui-dirty-marker">*</span>');
        } else {
          var mark = b.querySelector(".maui-dirty-marker");
          if (mark) mark.remove();
        }
      });
      tree.querySelectorAll("a").forEach(function (a) {
        var text = a.textContent.replace(/\s*\*\s*$/, "").trim();
        var mark = a.querySelector(".maui-dirty-marker");
        var project = a.closest("ul") && a.closest("li") ? (a.closest("ul").parentElement && a.closest("ul").parentElement.querySelector("strong") ? a.closest("ul").parentElement.querySelector("strong").textContent : "") : "";
        if (project && dirtyFiles[project + "::" + text]) {
          if (!mark) a.insertAdjacentHTML("beforeend", ' <span class="maui-dirty-marker">*</span>');
        } else if (mark) mark.remove();
      });
      save.classList.toggle("has-unsaved", !!dirtyFiles[c.project + "::" + c.file]);
    }

    editor.addEventListener("input", function () {
      var c = current();
      if (c.project && c.file) dirtyFiles[c.project + "::" + c.file] = true;
      refreshMarkers();
    });
    save.onclick = function () {
      var c = current();
      if (!c.project || !c.file) return;
      delete dirtyFiles[c.project + "::" + c.file];
      refreshMarkers();
      editor.dispatchEvent(new Event("change", { bubbles: true }));
    };
    refreshMarkers();
  }

  function boot() {
    installDirtyUi();
    if (!window.__algolassiDirtyBootTimer) {
      window.__algolassiDirtyBootTimer = setInterval(installDirtyUi, 500);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
