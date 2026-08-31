/* Keep auto-generated article steppers in sync with the SPA page lifecycle. */
(function () {
  "use strict";

  function removeAutoStepper() {
    document.querySelectorAll(".algolassi-auto-stepper").forEach(function (el) {
      el.remove();
    });
  }

  function buildAutoStepper() {
    removeAutoStepper();

    var scope = document.querySelector(".article-content,.page-content");
    if (!scope) return;

    var headings = Array.prototype.slice.call(scope.querySelectorAll("h2,h3,h4"))
      .filter(function (heading) {
        return /^Step\s+\d+\b/i.test((heading.textContent || "").trim());
      });

    if (headings.length < 3) return;

    var flow = document.createElement("nav");
    flow.className = "algolassi-auto-stepper";
    flow.setAttribute("aria-label", "Article implementation steps");

    var strong = document.createElement("strong");
    strong.textContent = "Steps";
    flow.appendChild(strong);

    headings.forEach(function (heading, index) {
      if (!heading.id) heading.id = "algolassi-step-" + (index + 1);

      var button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-target", heading.id);

      var node = document.createElement("span");
      node.className = "node";
      node.textContent = String(index + 1);

      var label = document.createElement("span");
      label.className = "label";
      label.textContent = (heading.textContent || "")
        .replace(/^Step\s+\d+\s*[:—-]?\s*/i, "")
        .trim() || heading.textContent;

      button.appendChild(node);
      button.appendChild(label);
      flow.appendChild(button);
    });

    flow.addEventListener("click", function (event) {
      var button = event.target && event.target.closest
        ? event.target.closest("button[data-target]")
        : null;
      if (!button) return;

      event.preventDefault();
      var target = document.getElementById(button.getAttribute("data-target"));
      if (target) {
        window.scrollTo({
          top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - 110),
          behavior: "smooth"
        });
      }
    });

    document.body.appendChild(flow);

    requestAnimationFrame(function () {
      document.querySelectorAll(".maui-flow,.algolassi-auto-stepper").forEach(function (el) {
        if (typeof window.AlgolassiUpdateStepper === "function") {
          window.AlgolassiUpdateStepper(el);
        }
      });
    });
  }

  function syncAfterNavigation() {
    removeAutoStepper();
    requestAnimationFrame(function () {
      buildAutoStepper();
    });
  }

  window.addEventListener("algolassi:spa-navigation", syncAfterNavigation);
  window.addEventListener("popstate", syncAfterNavigation);
})();
