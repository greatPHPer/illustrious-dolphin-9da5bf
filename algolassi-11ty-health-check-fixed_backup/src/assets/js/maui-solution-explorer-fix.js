/* Keep Solution Explorer clicks inside the playground. */
(function () {
  "use strict";

  function install() {
    var tree = document.querySelector(".maui-project-tree");
    if (!tree || tree.dataset.solutionExplorerFix === "true") return;
    tree.dataset.solutionExplorerFix = "true";

    /* The explorer uses internal anchors for its controls. Capture those clicks
       before any site-wide link/navigation handlers can treat them as normal links. */
    tree.addEventListener("click", function (event) {
      var link = event.target && event.target.closest ? event.target.closest(".maui-tree-link") : null;
      if (!link || !tree.contains(link)) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      if (typeof link.onclick === "function") {
        link.onclick({
          preventDefault: function () {},
          stopPropagation: function () {},
          stopImmediatePropagation: function () {}
        });
      }
    }, true);
  }

  function ready() {
    install();
    setTimeout(install, 0);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();

  window.addEventListener("load", install);
})();
