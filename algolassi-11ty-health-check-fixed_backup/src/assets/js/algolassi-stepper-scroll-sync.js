/* Algolassi steppers: existing flow scroll sync + Developer Tools navigation. */
(function () {
  "use strict";
  var ticking = false;
  var devTools = [
    ["JSON", "/developer-tools/json-formatter/"],
    ["Base64", "/developer-tools/base64-encoder-decoder/"],
    ["GUID", "/developer-tools/guid-generator/"],
    ["JWT", "/developer-tools/jwt-decoder/"],
    ["Regex", "/developer-tools/regex-tester/"],
    ["Timestamp", "/developer-tools/unix-timestamp-converter/"],
    ["URL", "/developer-tools/url-encoder-decoder/"],
    ["HTML", "/developer-tools/html-encoder-decoder/"]
  ];
  var devIndex = -1;

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
      window.requestAnimationFrame(function () { ticking = false; update(flow); });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update(flow);
  }

  function devToolIndex(path) {
    for (var i = 0; i < devTools.length; i++) if (path === devTools[i][1] || path === devTools[i][1].slice(0, -1)) return i;
    return -1;
  }

  function addDevToolStyles() {
    if (document.getElementById("algolassi-devtools-stepper-style")) return;
    var style = document.createElement("style");
    style.id = "algolassi-devtools-stepper-style";
    style.textContent = ".algolassi-devtools-stepper{margin:0 0 1.5rem;padding:.65rem .75rem;border:1px solid var(--border-color,#d8dee4);border-radius:12px;background:var(--card-bg,#fff);overflow:hidden}.algolassi-devtools-stepper-track{display:flex;align-items:center;gap:.25rem;overflow-x:auto;scrollbar-width:thin;padding:.15rem}.algolassi-devtools-step{display:inline-flex;align-items:center;gap:.4rem;flex:0 0 auto;padding:.55rem .7rem;border-radius:8px;color:inherit;text-decoration:none;font-size:.88rem;white-space:nowrap;transition:background .18s ease,color .18s ease,transform .18s ease}.algolassi-devtools-step:hover{background:var(--hover-bg,#f1f5f9)}.algolassi-devtools-step.active{background:var(--accent-color,#2563eb);color:#fff}.algolassi-devtools-step-number{display:inline-flex;align-items:center;justify-content:center;width:1.45rem;height:1.45rem;border-radius:50%;border:1px solid currentColor;font-size:.74rem;font-weight:700}.algolassi-devtools-step.active .algolassi-devtools-step-number{border-color:rgba(255,255,255,.7)}.algolassi-devtools-arrow{flex:0 0 auto;opacity:.4;font-size:.85rem}.page-content.algolassi-devtools-slide-forward{animation:algolassiDtSlideForward .3s ease both}.page-content.algolassi-devtools-slide-back{animation:algolassiDtSlideBack .3s ease both}@keyframes algolassiDtSlideForward{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}@keyframes algolassiDtSlideBack{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}@media(max-width:700px){.algolassi-devtools-step{padding:.5rem .58rem;font-size:.8rem}.algolassi-devtools-step-number{width:1.3rem;height:1.3rem}.algolassi-devtools-arrow{display:none}.algolassi-devtools-stepper{margin-left:-.25rem;margin-right:-.25rem}}@media(prefers-reduced-motion:reduce){.page-content.algolassi-devtools-slide-forward,.page-content.algolassi-devtools-slide-back{animation:none}}html[data-theme=\"dark\"] .algolassi-devtools-stepper{background:var(--card-bg,#111827)}";
    document.head.appendChild(style);
  }

  function createDevStepper(index) {
    var nav = document.createElement("nav");
    nav.className = "algolassi-devtools-stepper";
    nav.setAttribute("aria-label", "Developer Tools navigation");
    var track = document.createElement("div");
    track.className = "algolassi-devtools-stepper-track";
    devTools.forEach(function (tool, i) {
      if (i) { var arrow = document.createElement("span"); arrow.className = "algolassi-devtools-arrow"; arrow.setAttribute("aria-hidden", "true"); arrow.textContent = "→"; track.appendChild(arrow); }
      var link = document.createElement("a");
      link.className = "algolassi-devtools-step";
      link.href = tool[1];
      link.dataset.devtoolIndex = String(i);
      if (i === index) { link.classList.add("active"); link.setAttribute("aria-current", "page"); }
      var number = document.createElement("span"); number.className = "algolassi-devtools-step-number"; number.textContent = String(i + 1);
      var label = document.createElement("span"); label.textContent = tool[0];
      link.appendChild(number); link.appendChild(label); track.appendChild(link);
    });
    nav.appendChild(track);
    return nav;
  }

  function initDevTools() {
    addDevToolStyles();
    var page = document.querySelector(".page-content");
    if (!page) return;
    var index = devToolIndex(location.pathname);
    document.querySelectorAll(".algolassi-devtools-stepper").forEach(function (x) { x.remove(); });
    page.classList.remove("algolassi-devtools-slide-forward", "algolassi-devtools-slide-back");
    if (index < 0) { devIndex = -1; return; }
    devIndex = index;
    page.insertBefore(createDevStepper(index), page.firstChild);
    var active = page.querySelector(".algolassi-devtools-step.active");
    if (active) active.scrollIntoView({ block: "nearest", inline: "center" });
  }

  function init() {
    document.querySelectorAll(".maui-flow,.algolassi-auto-stepper").forEach(attach);
    initDevTools();
  }

  document.addEventListener("click", function (event) {
    var link = event.target && event.target.closest ? event.target.closest("a[data-devtool-index]") : null;
    if (!link) return;
    var next = Number(link.dataset.devtoolIndex);
    if (next === devIndex) return;
    var page = document.querySelector(".page-content");
    if (!page) return;
    page.classList.remove("algolassi-devtools-slide-forward", "algolassi-devtools-slide-back");
    void page.offsetWidth;
    page.classList.add(next > devIndex ? "algolassi-devtools-slide-forward" : "algolassi-devtools-slide-back");
  }, false);

  document.addEventListener("DOMContentLoaded", init);
  if (document.readyState !== "loading") init();
  window.addEventListener("algolassi:spa-navigation", function () { window.setTimeout(init, 30); });
})();