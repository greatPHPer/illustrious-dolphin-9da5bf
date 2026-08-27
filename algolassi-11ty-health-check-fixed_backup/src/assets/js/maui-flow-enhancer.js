/* Algolassi implementation flow enhancer
   - Preserves the custom MAUI .maui-flow behavior.
   - Automatically creates an interactive stepper on pages with 3+ numbered Step headings.
   - On mobile, shows every step by wrapping rather than requiring horizontal scrolling.
   - Scrolls targets below fixed navigation and highlights them briefly.
*/
(function () {
  "use strict";

  function getFlow() {
    return document.querySelector(".maui-flow") || document.querySelector(".algolassi-auto-stepper");
  }

  function getStepTarget(step) {
    var id = step && step.getAttribute("data-target");
    return id ? document.getElementById(id) : null;
  }

  function getMobileOffset(flow) {
    if (!flow || window.innerWidth > 1250) return 110;
    var rect = flow.getBoundingClientRect();
    return Math.max(100, Math.round(rect.bottom + 18));
  }

  function centerStep(flow, step, smooth) {
    if (!flow || !step || window.innerWidth > 1250) return;
    /* Auto steppers wrap on mobile; there is no horizontal rail to center. */
    if (flow.classList.contains("algolassi-auto-stepper")) return;
    var left = step.offsetLeft - (flow.clientWidth / 2) + (step.offsetWidth / 2);
    var maxLeft = Math.max(0, flow.scrollWidth - flow.clientWidth);
    left = Math.max(0, Math.min(left, maxLeft));
    flow.scrollTo({ left: left, behavior: smooth ? "smooth" : "auto" });
  }

  function setActive(flow, id, center) {
    if (!flow) return;
    var steps = flow.querySelectorAll("button[data-target]");
    var active = null;
    steps.forEach(function (step) {
      var on = step.getAttribute("data-target") === id;
      step.classList.toggle("active", on);
      if (on) active = step;
    });
    if (center && active) centerStep(flow, active, true);
  }

  function jumpToTarget(flow, step) {
    var target = getStepTarget(step);
    if (!target) return;
    var id = step.getAttribute("data-target");
    setActive(flow, id, true);

    var offset = getMobileOffset(flow);
    var rect = target.getBoundingClientRect();
    var destination = Math.max(0, window.scrollY + rect.top - offset);
    window.scrollTo({ top: destination, behavior: "smooth" });

    window.setTimeout(function () {
      var current = target.getBoundingClientRect();
      var desired = getMobileOffset(flow);
      if (Math.abs(current.top - desired) > 8) {
        window.scrollTo({ top: Math.max(0, window.scrollY + current.top - desired), behavior: "smooth" });
      }
    }, 450);

    target.classList.remove("algolassi-flow-focus");
    void target.offsetWidth;
    target.classList.add("algolassi-flow-focus");
    window.setTimeout(function () { target.classList.remove("algolassi-flow-focus"); }, 1400);
  }

  function injectAutoStyles() {
    if (document.getElementById("algolassi-auto-stepper-styles")) return;
    var style = document.createElement("style");
    style.id = "algolassi-auto-stepper-styles";
    style.textContent = [
      ".algolassi-auto-stepper{position:fixed;right:18px;top:132px;width:250px;max-height:calc(100vh - 155px);overflow:auto;padding:12px;border:1px solid rgba(100,116,139,.24);border-radius:16px;background:rgba(255,255,255,.97);box-shadow:0 14px 40px rgba(15,23,42,.14);backdrop-filter:blur(8px);z-index:100}",
      ".algolassi-auto-stepper strong{display:block;margin-bottom:8px}",
      ".algolassi-auto-stepper button{width:100%;display:flex;gap:8px;align-items:center;border:0;border-radius:9px;background:transparent;text-align:left;padding:7px;color:inherit;cursor:pointer}",
      ".algolassi-auto-stepper button:hover,.algolassi-auto-stepper button.active{background:rgba(13,110,253,.12)}",
      ".algolassi-auto-stepper button.active{box-shadow:inset 3px 0 #0d6efd}",
      ".algolassi-auto-stepper .node{width:25px;height:25px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex:0 0 25px;font-size:.72rem;font-weight:800;background:rgba(13,110,253,.1)}",
      ".algolassi-auto-stepper .label{font-size:.78rem;line-height:1.2}",
      ".algolassi-auto-step-target{scroll-margin-top:110px}",
      ".algolassi-flow-focus{box-shadow:0 0 0 3px rgba(13,110,253,.28),0 10px 24px rgba(13,110,253,.1);border-radius:10px}",
      "@media(max-width:1250px){.algolassi-auto-stepper{position:fixed;top:var(--algolassi-auto-stepper-top,110px);right:6px;left:6px;width:auto;max-width:none;height:auto;max-height:none;margin:0;padding:7px 8px;overflow:visible;display:flex;flex-wrap:wrap;align-content:flex-start;align-items:center;gap:4px 6px;z-index:2147483000}.algolassi-auto-stepper strong{flex:0 0 100%;font-size:.72rem;margin:0 0 2px 0}.algolassi-auto-stepper button{flex:0 1 auto;width:auto;min-width:0;max-width:100%;padding:4px 6px;gap:4px;border-radius:8px}.algolassi-auto-stepper .node{width:20px;height:20px;flex-basis:20px;font-size:.68rem}.algolassi-auto-stepper .label{font-size:.64rem;line-height:1.1;white-space:normal;text-align:left}.algolassi-auto-stepper button:not(:last-child)::after{content:\"→\";margin-left:3px;opacity:.45}.algolassi-auto-stepper button.active{box-shadow:inset 0 -2px #0d6efd}.algolassi-auto-step-target{scroll-margin-top:190px}}",
      "@media(max-width:600px){.algolassi-auto-stepper{top:var(--algolassi-auto-stepper-top,104px);padding:6px 6px;gap:3px 4px}.algolassi-auto-stepper strong{font-size:.68rem}.algolassi-auto-stepper button{padding:3px 5px}.algolassi-auto-stepper .label{font-size:.61rem}.algolassi-auto-stepper .node{width:19px;height:19px;flex-basis:19px}.algolassi-auto-step-target{scroll-margin-top:185px}}",
      "@media(max-width:390px){.algolassi-auto-stepper{top:var(--algolassi-auto-stepper-top,98px);padding:5px 5px;gap:2px 3px}.algolassi-auto-stepper strong{display:none}.algolassi-auto-stepper button{padding:3px 4px}.algolassi-auto-stepper .node{width:18px;height:18px;flex-basis:18px}.algolassi-auto-stepper .label{font-size:.58rem}.algolassi-auto-step-target{scroll-margin-top:175px}}"
    ].join("");
    document.head.appendChild(style);
  }

  function slug(text) {
    return String(text || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || "step";
  }

  function getHeaderBreadcrumbTop(flow) {
    if (window.innerWidth > 1250 || !flow) return;
    var header = document.querySelector(".site-header");
    var breadcrumb = document.querySelector(".breadcrumb,.breadcrumbs");
    var top = header ? header.getBoundingClientRect().bottom : 64;
    if (breadcrumb) top = Math.max(top, breadcrumb.getBoundingClientRect().bottom + 8);
    flow.style.setProperty("--algolassi-auto-stepper-top", Math.round(top) + "px");
  }

  function buildAutoStepper() {
    if (document.querySelector(".maui-flow") || document.querySelector(".algolassi-auto-stepper")) return null;
    var scope = document.querySelector(".article-content,.page-content");
    if (!scope) return null;
    var headings = Array.prototype.slice.call(scope.querySelectorAll("h2,h3,h4")).filter(function (heading) {
      return /^Step\s+\d+\b/i.test((heading.textContent || "").trim());
    });
    if (headings.length < 3) return null;

    injectAutoStyles();
    var flow = document.createElement("nav");
    flow.className = "algolassi-auto-stepper";
    flow.setAttribute("aria-label", "Article implementation steps");
    var title = document.createElement("strong");
    title.textContent = "Steps";
    flow.appendChild(title);

    headings.forEach(function (heading, index) {
      if (!heading.id) heading.id = "algolassi-step-" + (index + 1) + "-" + slug(heading.textContent);
      heading.classList.add("algolassi-auto-step-target");
      var button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-target", heading.id);
      var node = document.createElement("span");
      node.className = "node";
      node.textContent = String(index + 1);
      var label = document.createElement("span");
      label.className = "label";
      label.textContent = (heading.textContent || "").replace(/^Step\s+\d+\s*[:—-]?\s*/i, "").trim() || heading.textContent;
      button.appendChild(node);
      button.appendChild(label);
      flow.appendChild(button);
    });

    document.body.appendChild(flow);

    flow.addEventListener("click", function (event) {
      var step = event.target && event.target.closest ? event.target.closest("button[data-target]") : null;
      if (!step || !flow.contains(step)) return;
      event.preventDefault();
      event.stopPropagation();
      jumpToTarget(flow, step);
    }, true);

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        var visible = entries.filter(function (entry) { return entry.isIntersecting; }).sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
        if (!visible) return;
        setActive(flow, visible.target.id, false);
      }, { rootMargin: "-20% 0px -55% 0px", threshold: [0.08,0.2,0.4,0.7] });
      headings.forEach(function (heading) { observer.observe(heading); });
      flow._algolassiAutoObserver = observer;
    }

    var first = flow.querySelector("button[data-target]");
    if (first) setActive(flow, first.getAttribute("data-target"), false);
    getHeaderBreadcrumbTop(flow);
    return flow;
  }

  function install(flow) {
    if (!flow || flow.dataset.enhanced === "1") return;
    flow.dataset.enhanced = "1";
    flow.addEventListener("click", function (event) {
      var step = event.target && event.target.closest ? event.target.closest("button[data-target]") : null;
      if (!step || !flow.contains(step)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      jumpToTarget(flow, step);
    }, true);

    var targets = [];
    flow.querySelectorAll("button[data-target]").forEach(function (step) {
      var target = getStepTarget(step);
      if (target) targets.push({ step: step, target: target });
    });

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        var visible = entries.filter(function (entry) { return entry.isIntersecting; }).sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
        if (!visible) return;
        setActive(flow, visible.target.id, true);
      }, { rootMargin: "-20% 0px -55% 0px", threshold: [0.08,0.2,0.4,0.7] });
      targets.forEach(function (item) { observer.observe(item.target); });
      flow._mauiFlowObserver = observer;
    }

    var resizeTimer = null;
    function reposition() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        var active = flow.querySelector("button[data-target].active");
        if (active) centerStep(flow, active, false);
        getHeaderBreadcrumbTop(flow);
      }, 60);
    }
    window.addEventListener("resize", reposition, { passive: true });

    var first = flow.querySelector("button[data-target]");
    if (first) setActive(flow, first.getAttribute("data-target"), true);
    getHeaderBreadcrumbTop(flow);
  }

  function init() {
    var custom = document.querySelector(".maui-flow");
    if (custom) {
      install(custom);
      return;
    }
    buildAutoStepper();
  }

  document.addEventListener("DOMContentLoaded", init);
  if (document.readyState !== "loading") init();
  window.addEventListener("algolassi:spa-navigation", function () {
    window.setTimeout(function () {
      var old = document.querySelector(".algolassi-auto-stepper");
      if (old) old.remove();
      init();
    }, 50);
  });
  window.addEventListener("resize", function () {
    var flow = document.querySelector(".algolassi-auto-stepper");
    if (flow) getHeaderBreadcrumbTop(flow);
  }, { passive: true });
})();
