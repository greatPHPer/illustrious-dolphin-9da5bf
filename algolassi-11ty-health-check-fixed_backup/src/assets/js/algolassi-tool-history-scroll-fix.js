(function () {
  "use strict";

  document.addEventListener("click", function (event) {
    var item = event.target && event.target.closest ? event.target.closest(".althp-item") : null;
    if (!item) return;
    window.setTimeout(function () {
      var anchor = document.getElementById("input-2");
      if (!anchor) return;
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      var anchorTop = anchor.getBoundingClientRect().top + scrollTop;
      window.scrollTo({ top: Math.max(0, anchorTop - 100), behavior: "smooth" });
    }, 120);
  }, true);
})();
