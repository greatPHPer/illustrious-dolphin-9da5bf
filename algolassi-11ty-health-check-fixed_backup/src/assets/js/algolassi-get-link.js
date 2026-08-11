/* Algolassi section permalink / Get Link */
(function () {
  "use strict";

  function slugify(text) {
    return String(text || "").toLowerCase().trim().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "section";
  }

  function ensureId(heading) {
    if (heading.id) return heading.id;
    var base = slugify(heading.textContent), id = base, n = 2;
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
      setTimeout(function () { button.innerHTML = old; button.classList.remove("algolassi-link-copied"); button.setAttribute("aria-label", "Copy link to this section"); }, 1800);
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url.href).then(done).catch(function () { fallbackCopy(url.href, done); });
    else fallbackCopy(url.href, done);
  }

  function fallbackCopy(text, done) {
    var input = document.createElement("textarea");
    input.value = text; input.setAttribute("readonly", ""); input.style.position = "fixed"; input.style.opacity = "0";
    document.body.appendChild(input); input.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(input); done();
  }

  function addHeadingLink(heading) {
    if (heading.dataset.algolassiSectionLinkReady === "true" || !heading.textContent.trim()) return;
    heading.dataset.algolassiSectionLinkReady = "true"; ensureId(heading); heading.classList.add("algolassi-section-heading");
    var button = document.createElement("button");
    button.type = "button"; button.className = "algolassi-section-link"; button.innerHTML = "🔗"; button.title = "Copy link to this section"; button.setAttribute("aria-label", "Copy link to this section");
    button.addEventListener("click", function (event) { event.preventDefault(); event.stopPropagation(); copyLink(button); });
    heading.appendChild(button);
  }

  function addHeadingLinks() {
    injectStyles();
    document.querySelectorAll(".article-content h2,.article-content h3,.article-content h4,.article-content h5,.article-content h6,.page-content h2,.page-content h3,.page-content h4,.page-content h5,.page-content h6").forEach(addHeadingLink);
  }

  function scrollToHash() {
    if (!location.hash) return;
    var id = decodeURIComponent(location.hash.slice(1)), target = document.getElementById(id);
    if (!target) return;
    requestAnimationFrame(function () { setTimeout(function () { target.scrollIntoView({ behavior: "smooth", block: "start" }); target.classList.add("algolassi-section-target"); setTimeout(function () { target.classList.remove("algolassi-section-target"); }, 1800); }, 50); });
  }

  function init() {
    addHeadingLinks();
    document.querySelectorAll(".get-link,[data-get-link],[data-action='get-link'],button[title='Get Link'],a[title='Get Link']").forEach(function (button) {
      if (button.dataset.algolassiGetLinkReady === "true") return;
      button.dataset.algolassiGetLinkReady = "true";
      button.addEventListener("click", function (event) { event.preventDefault(); event.stopPropagation(); copyLink(button); });
    });
    scrollToHash();
  }

  function updateMeta(doc) {
    if (doc.title) document.title = doc.title;
    var currentDescription = document.querySelector('meta[name="description"]'), nextDescription = doc.querySelector('meta[name="description"]');
    if (currentDescription && nextDescription) currentDescription.setAttribute("content", nextDescription.getAttribute("content") || "");
    else if (!currentDescription && nextDescription) document.head.appendChild(nextDescription.cloneNode(true));
    else if (currentDescription && !nextDescription) currentDescription.remove();
    var currentCanonical = document.querySelector('link[rel="canonical"]'), nextCanonical = doc.querySelector('link[rel="canonical"]');
    if (currentCanonical && nextCanonical) currentCanonical.setAttribute("href", nextCanonical.getAttribute("href") || "");
    else if (!currentCanonical && nextCanonical) document.head.appendChild(nextCanonical.cloneNode(true));
  }

  function sameDocumentUrl(a, b) {
    return a.origin === b.origin &&
      a.pathname === b.pathname &&
      a.search === b.search &&
      a.hash === b.hash;
  }

  function normalizedScriptUrl(src) {
    try {
      var url = new URL(src, window.location.href);
      return url.origin + url.pathname + url.search;
    } catch (e) {
      return String(src || "");
    }
  }

  function dispatchSpaNavigation(url) {
    try {
      window.dispatchEvent(new CustomEvent("algolassi:spa-navigation", { detail: { url: url.href } }));
    } catch (e) {
      var event = document.createEvent("Event");
      event.initEvent("algolassi:spa-navigation", false, false);
      window.dispatchEvent(event);
    }
  }

  function loadPlayground(url) {
    if (sameDocumentUrl(url, new URL(window.location.href))) {
      console.log("Algolassi SPA: Playground already at requested URL; ignoring duplicate navigation");
      return;
    }
    if (window.__algolassiPlaygroundNavigating) return;
    window.__algolassiPlaygroundNavigating = true;
    console.log("Algolassi SPA: loading Playground", url.href);
    fetch(url.href, { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var currentMain = document.querySelector(".site-main"), nextMain = doc.querySelector(".site-main");
        if (!currentMain || !nextMain) throw new Error("site-main not found");
        currentMain.innerHTML = nextMain.innerHTML;
        updateMeta(doc);
        history.pushState({ algolassiPlaygroundSpa: true }, "", url.href);
        window.scrollTo(0, 0);

        if (!window.__algolassiLoadedScriptUrls) window.__algolassiLoadedScriptUrls = {};
        var scripts = Array.prototype.slice.call(currentMain.querySelectorAll("script")), index = 0;
        function runNextScript() {
          if (index >= scripts.length) {
            scripts.forEach(function (oldScript) { if (oldScript.parentNode) oldScript.parentNode.removeChild(oldScript); });
            dispatchSpaNavigation(url);
            if (typeof window.AlgolassiCommentsInit === "function") window.AlgolassiCommentsInit();
            if (typeof window.AlgolassiRadioInit === "function") window.AlgolassiRadioInit();
            console.log("Algolassi SPA: Playground loaded without document navigation");
            return;
          }
          var oldScript = scripts[index++], newScript = document.createElement("script");
          Array.prototype.forEach.call(oldScript.attributes, function (attribute) { newScript.setAttribute(attribute.name, attribute.value); });
          if (oldScript.src) {
            var scriptKey = normalizedScriptUrl(oldScript.src);
            if (window.__algolassiLoadedScriptUrls[scriptKey]) {
              runNextScript();
              return;
            }
            newScript.async = false;
            newScript.onload = function () {
              window.__algolassiLoadedScriptUrls[scriptKey] = true;
              runNextScript();
            };
            newScript.onerror = function () {
              console.error("Algolassi SPA: failed to load", oldScript.src);
              runNextScript();
            };
            newScript.src = oldScript.src;
            document.body.appendChild(newScript);
          } else {
            newScript.textContent = oldScript.textContent;
            document.body.appendChild(newScript);
            runNextScript();
          }
        }
        runNextScript();
      })
      .catch(function (error) {
        console.error("Algolassi SPA: Playground navigation failed; staying on current page.", error);
      })
      .finally(function () { window.__algolassiPlaygroundNavigating = false; });
  }

  function isPlaygroundLink(link) {
    if (!link || !link.href) return false;
    try { var url = new URL(link.href, location.href); return url.origin === location.origin && url.pathname === "/maui-hybrid-playground/"; }
    catch (e) { return false; }
  }

  function handlePlaygroundClick(event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var target = event.target, link = target && target.closest ? target.closest("a") : null;
    if (!isPlaygroundLink(link)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    loadPlayground(new URL(link.href, location.href));
  }

  document.addEventListener("click", handlePlaygroundClick, true);
  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("hashchange", scrollToHash);
  window.addEventListener("algolassi:spa-navigation", init);
  if (document.readyState !== "loading") init();
})();