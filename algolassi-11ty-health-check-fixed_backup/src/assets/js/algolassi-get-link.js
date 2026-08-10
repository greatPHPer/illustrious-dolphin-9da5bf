/* Algolassi section permalink / Get Link */
(function () {
  "use strict";

  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .trim()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) || "section";
  }

  function ensureId(heading) {
    if (heading.id) return heading.id;
    var base = slugify(heading.textContent);
    var id = base;
    var n = 2;
    while (document.getElementById(id)) id = base + "-" + n++;
    heading.id = id;
    return id;
  }

  function findHeading(button) {
    var el = button;
    while (el && el !== document.body) {
      var heading = el.querySelector && el.querySelector("h2[id],h3[id],h4[id],h5[id],h6[id],h2,h3,h4,h5,h6");
      if (heading) return heading;
      el = el.parentElement;
    }
    var previous = button.previousElementSibling;
    while (previous) {
      if (/^H[2-6]$/.test(previous.tagName)) return previous;
      previous = previous.previousElementSibling;
    }
    return null;
  }

  function copyLink(button) {
    var id = button.getAttribute("data-section-id") || button.getAttribute("data-target");
    if (id) id = id.replace(/^#/, "");
    var heading = id ? document.getElementById(id) : findHeading(button);
    if (!heading) return;
    id = ensureId(heading);
    var url = new URL(window.location.href);
    url.hash = id;

    function done() {
      var old = button.textContent;
      button.textContent = "✓ Link copied";
      button.setAttribute("aria-label", "Section link copied");
      setTimeout(function () { button.textContent = old; }, 1800);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url.href).then(done).catch(function () { fallbackCopy(url.href, done); });
    } else {
      fallbackCopy(url.href, done);
    }
  }

  function fallbackCopy(text, done) {
    var input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(input);
    done();
  }

  function scrollToHash() {
    if (!location.hash) return;
    var id = decodeURIComponent(location.hash.slice(1));
    var target = document.getElementById(id);
    if (!target) return;
    requestAnimationFrame(function () {
      setTimeout(function () {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        target.classList.add("algolassi-section-target");
        setTimeout(function () { target.classList.remove("algolassi-section-target"); }, 1800);
      }, 50);
    });
  }

  function init() {
    document.querySelectorAll(".get-link,[data-get-link],[data-action='get-link'],button[title='Get Link'],a[title='Get Link']").forEach(function (button) {
      if (button.dataset.algolassiGetLinkReady === "true") return;
      button.dataset.algolassiGetLinkReady = "true";
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        copyLink(button);
      });
    });
    scrollToHash();
  }

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("hashchange", scrollToHash);
  window.addEventListener("algolassi:spa-navigation", init);
  if (document.readyState !== "loading") init();
})();
