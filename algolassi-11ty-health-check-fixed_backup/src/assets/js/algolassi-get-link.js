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

  function injectStyles() {
    if (document.getElementById("algolassi-section-link-styles")) return;
    var style = document.createElement("style");
    style.id = "algolassi-section-link-styles";
    style.textContent = ".algolassi-section-heading{position:relative}.algolassi-section-link{display:inline-flex;align-items:center;justify-content:center;margin-left:8px;padding:2px 6px;border:0;background:transparent;color:#98a2b3;font-size:.72em;line-height:1;opacity:0;visibility:hidden;cursor:pointer;border-radius:4px;vertical-align:middle;transition:opacity .15s ease,background .15s ease,color .15s ease}.algolassi-section-heading:hover .algolassi-section-link,.algolassi-section-heading:focus-within .algolassi-section-link{opacity:1;visibility:visible}.algolassi-section-link:hover{background:#f2f4f7;color:#667085}.algolassi-section-link:focus-visible{opacity:1;visibility:visible;outline:2px solid #98a2b3;outline-offset:2px}.algolassi-section-link.algolassi-link-copied{color:#667085;background:#f2f4f7}.algolassi-section-target{outline:3px solid rgba(13,110,253,.35);outline-offset:8px;transition:outline-color .2s ease} @media(max-width:700px){.algolassi-section-link{opacity:.7;visibility:visible;margin-left:6px;padding:4px 7px}}";
    document.head.appendChild(style);
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
      var old = button.innerHTML;
      button.innerHTML = "✓";
      button.classList.add("algolassi-link-copied");
      button.setAttribute("aria-label", "Section link copied");
      setTimeout(function () {
        button.innerHTML = old;
        button.classList.remove("algolassi-link-copied");
        button.setAttribute("aria-label", "Copy link to this section");
      }, 1800);
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

  function addHeadingLink(heading) {
    if (heading.dataset.algolassiSectionLinkReady === "true") return;
    if (!heading.textContent.trim()) return;
    heading.dataset.algolassiSectionLinkReady = "true";
    ensureId(heading);
    heading.classList.add("algolassi-section-heading");

    var button = document.createElement("button");
    button.type = "button";
    button.className = "algolassi-section-link";
    button.innerHTML = "🔗";
    button.title = "Copy link to this section";
    button.setAttribute("aria-label", "Copy link to this section");
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      copyLink(button);
    });
    heading.appendChild(button);
  }

  function addHeadingLinks() {
    injectStyles();
    document.querySelectorAll(".article-content h2,.article-content h3,.article-content h4,.article-content h5,.article-content h6,.page-content h2,.page-content h3,.page-content h4,.page-content h5,.page-content h6").forEach(addHeadingLink);
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
    addHeadingLinks();
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
