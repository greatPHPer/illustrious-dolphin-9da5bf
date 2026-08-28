/* Algolassi steppers: existing flow scroll sync only. Developer Tools navigation is handled by maui-flow-enhancer.js. */
(function () {
  "use strict";
  var ticking = false;

  function update(flow) {
    if (!flow || !document.documentElement.contains(flow)) return;
    var buttons = Array.prototype.slice.call(flow.querySelectorAll("button[data-target]"));
    if (!buttons.length) return;
    var items = buttons.map(function (button) {
      return { button: button, target: document.getElementById(button.getAttribute("data-target")) };
    }).filter(function (item) { return !!item.target; });
    if (!items.length) return;
    var mobile = window.innerWidth <= 1250;
    var marker = mobile ? Math.max(140, flow.getBoundingClientRect().bottom + 18) : Math.min(260, Math.max(150, window.innerHeight * 0.30));
    var current = items[0];
    items.forEach(function (item) { if (item.target.getBoundingClientRect().top <= marker) current = item; });
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8) current = items[items.length - 1];
    buttons.forEach(function (button) {
      var isCurrent = button === current.button;
      button.classList.toggle("active", isCurrent);
      button.setAttribute("aria-current", isCurrent ? "step" : "false");
    });
  }

  function attach(flow) {
    if (!flow || flow.dataset.scrollSyncAttached === "1") return;
    flow.dataset.scrollSyncAttached = "1";
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        update(flow);
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update(flow);
  }

  function init() {
    document.querySelectorAll(".maui-flow,.algolassi-auto-stepper").forEach(attach);
  }

  document.addEventListener("DOMContentLoaded", init);
  if (document.readyState !== "loading") init();
})();