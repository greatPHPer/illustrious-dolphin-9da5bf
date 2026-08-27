/* Algolassi MAUI article flow enhancer
   - Keeps the active mobile step centered in the horizontal rail.
   - Overrides the article's original click handler so the target lands below the fixed rail.
   - Activates only on pages containing .maui-flow.
*/
(function () {
  "use strict";

  function getFlow() {
    return document.querySelector(".maui-flow");
  }

  function getStepTarget(step) {
    var id = step && step.getAttribute("data-target");
    return id ? document.getElementById(id) : null;
  }

  function getMobileOffset() {
    var flow = getFlow();
    if (!flow || window.innerWidth > 1250) return 110;
    var bottom = flow.getBoundingClientRect().bottom;
    return Math.max(110, Math.round(bottom + 18));
  }

  function centerStep(step, smooth) {
    var flow = getFlow();
    if (!flow || !step || window.innerWidth > 1250) return;

    var left = step.offsetLeft - (flow.clientWidth / 2) + (step.offsetWidth / 2);
    var maxLeft = Math.max(0, flow.scrollWidth - flow.clientWidth);
    left = Math.max(0, Math.min(left, maxLeft));
    flow.scrollTo({ left: left, behavior: smooth ? "smooth" : "auto" });
  }

  function setActive(id, center) {
    var flow = getFlow();
    if (!flow) return;
    var steps = flow.querySelectorAll("button[data-target]");
    var active = null;
    steps.forEach(function (step) {
      var on = step.getAttribute("data-target") === id;
      step.classList.toggle("active", on);
      if (on) active = step;
    });
    if (center && active) centerStep(active, true);
  }

  function jumpToTarget(step) {
    var target = getStepTarget(step);
    if (!target) return;

    setActive(step.getAttribute("data-target"), true);

    var offset = getMobileOffset();
    var rect = target.getBoundingClientRect();
    var destination = window.scrollY + rect.top - offset;
    destination = Math.max(0, destination);

    window.scrollTo({ top: destination, behavior: "smooth" });

    window.setTimeout(function () {
      var current = target.getBoundingClientRect();
      var desired = getMobileOffset();
      if (Math.abs(current.top - desired) > 8) {
        window.scrollTo({
          top: Math.max(0, window.scrollY + current.top - desired),
          behavior: "smooth"
        });
      }
    }, 450);

    target.classList.remove("flash");
    void target.offsetWidth;
    target.classList.add("flash");
    window.setTimeout(function () {
      target.classList.remove("flash");
    }, 1400);
  }

  function install(flow) {
    if (!flow || flow.dataset.enhanced === "1") return;
    flow.dataset.enhanced = "1";

    // Capture phase intentionally runs before the article's original bubble-phase click handler.
    flow.addEventListener("click", function (event) {
      var step = event.target && event.target.closest
        ? event.target.closest("button[data-target]")
        : null;
      if (!step || !flow.contains(step)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      jumpToTarget(step);
    }, true);

    var targets = [];
    flow.querySelectorAll("button[data-target]").forEach(function (step) {
      var target = getStepTarget(step);
      if (target) targets.push({ step: step, target: target });
    });

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        var visible = entries
          .filter(function (entry) { return entry.isIntersecting; })
          .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
        if (!visible) return;

        var id = visible.target.id;
        setActive(id, true);
      }, {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.08, 0.2, 0.4, 0.7]
      });

      targets.forEach(function (item) { observer.observe(item.target); });
      flow._mauiFlowObserver = observer;
    }

    var resizeTimer = null;
    function reposition() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        var active = flow.querySelector("button[data-target].active");
        if (active) centerStep(active, false);
      }, 60);
    }
    window.addEventListener("resize", reposition, { passive: true });

    var first = flow.querySelector("button[data-target]");
    if (first) setActive(first.getAttribute("data-target"), true);
  }

  function init() {
    var flow = getFlow();
    if (!flow) return;
    install(flow);
  }

  document.addEventListener("DOMContentLoaded", init);
  if (document.readyState !== "loading") init();

  window.addEventListener("algolassi:spa-navigation", function () {
    window.setTimeout(init, 50);
  });
})();
