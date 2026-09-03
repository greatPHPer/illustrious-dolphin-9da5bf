/* Algolassi Image Tools - true vector SVG/EPS export. */
(function () {
  "use strict";
  var tracerUrl = "https://cdn.jsdelivr.net/npm/imagetracerjs@1.2.6/imagetracer_v1.2.6.js";
  var tracerPromise = null;
  var selectedHistoryUrl = null;
  var captureBound = false;
  function q(id) { return document.getElementById(id); }
  function status(text, good) { var el = q("image-status"); if (!el) return; el.textContent = text || ""; el.classList.toggle("image-status-good", !!good); var menu = q("image-menu-status"); if (menu && text) menu.textContent = text; }
  function loadTracer() {
    if (window.ImageTracer) return Promise.resolve(window.ImageTracer);
    if (tracerPromise) return tracerPromise;
    tracerPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script"); script.src = tracerUrl; script.async = true;
      script.onload = function () { if (window.ImageTracer) resolve(window.ImageTracer); else reject(new Error("ImageTracer failed to initialize.")); };
      script.onerror = function () { reject(new Error("Could not load the vectorization engine.")); };
      document.head.appendChild(script);
    });
    return tracerPromise;
  }
  function syncSelectedHistory() { var selected = document.querySelector("#image-history .image-history-card.current .image-history-thumb img"); selectedHistoryUrl = selected && selected.src ? selected.src : null; }
  function bindHistorySelection() {
    var history = q("image-history");
    if (!history || history.dataset.vectorSelectionBound === "1") { syncSelectedHistory(); return; }
    history.dataset.vectorSelectionBound = "1";
    history.addEventListener("click", function (event) {
      var link = event.target && event.target.closest ? event.target.closest(".image-history-link") : null;
      if (!link || !history.contains(link)) return;
      var card = link.closest(".image-history-card"), image = card && card.querySelector(".image-history-thumb img");
      if (image && image.src) selectedHistoryUrl = image.src;
    });
    syncSelectedHistory();
  }
  function loadSelectedImage() {
    bindHistorySelection();
    var current = document.querySelector("#image-history .image-history-card.current .image-history-thumb img"), preview = q("image-preview-img");
    var sourceUrl = (current && current.src) || selectedHistoryUrl || (preview && preview.src);
    if (!sourceUrl || (preview && preview.classList.contains("image-hidden") && !current && !selectedHistoryUrl)) return Promise.reject(new Error("Select or upload an image first."));
    return new Promise(function (resolve, reject) { var image = new Image(); image.onload = function () { resolve(image); }; image.onerror = function () { reject(new Error("Could not read the selected history image.")); }; image.src = sourceUrl; });
  }
  function traceCurrent() {
    return Promise.all([loadTracer(), loadSelectedImage()]).then(function (parts) {
      var tracer = parts[0], image = parts[1], canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width; canvas.height = image.naturalHeight || image.height;
      var ctx = canvas.getContext("2d", { willReadFrequently: true }); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      return tracer.imagedataToSVG(ctx.getImageData(0, 0, canvas.width, canvas.height), { colorsampling: 2, numberofcolors: 24, colorquantcycles: 2, pathomit: 4, ltres: 1, qtres: 1, linefilter: true, roundcoords: 2, layering: 0, strokewidth: 0, viewbox: true, desc: false });
    });
  }
  function svgPathToEps(d, out) {
    var tokens = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) || [], i = 0, cmd = "", x = 0, y = 0, startX = 0, startY = 0, ok = true;
    function num() { if (i >= tokens.length || /^[a-zA-Z]$/.test(tokens[i])) { ok = false; return 0; } var v = Number(tokens[i++]); if (!Number.isFinite(v)) ok = false; return v; }
    while (i < tokens.length && ok) {
      if (/^[a-zA-Z]$/.test(tokens[i])) cmd = tokens[i++]; if (!cmd) { ok = false; break; }
      var lower = cmd.toLowerCase(), relative = cmd === lower;
      if (lower === "m" || lower === "l") { var nx = num(), ny = num(); if (relative) { nx += x; ny += y; } out.push(nx + " " + ny + " " + (lower === "m" ? "moveto" : "lineto")); x = nx; y = ny; if (lower === "m") { startX = x; startY = y; cmd = relative ? "l" : "L"; } }
      else if (lower === "h") { var hx = num(); if (relative) hx += x; x = hx; out.push(x + " " + y + " lineto"); }
      else if (lower === "v") { var vy = num(); if (relative) vy += y; y = vy; out.push(x + " " + y + " lineto"); }
      else if (lower === "c") { var c1x = num(), c1y = num(), c2x = num(), c2y = num(), ex = num(), ey = num(); if (relative) { c1x += x; c1y += y; c2x += x; c2y += y; ex += x; ey += y; } out.push(c1x + " " + c1y + " " + c2x + " " + c2y + " " + ex + " " + ey + " curveto"); x = ex; y = ey; }
      else if (lower === "q") { var qx = num(), qy = num(), qex = num(), qey = num(); if (relative) { qx += x; qy += y; qex += x; qey += y; } out.push((x + 2/3*(qx-x)) + " " + (y + 2/3*(qy-y)) + " " + (qex + 2/3*(qx-qex)) + " " + (qey + 2/3*(qy-qey)) + " " + qex + " " + qey + " curveto"); x = qex; y = qey; }
      else if (lower === "z") { out.push("closepath"); x = startX; y = startY; }
      else ok = false;
    }
    return ok;
  }
  function svgToEps(svg) {
    var doc = new DOMParser().parseFromString(svg, "image/svg+xml"); if (doc.querySelector("parsererror")) throw new Error("Invalid traced SVG.");
    var root = doc.documentElement, width = parseFloat(root.getAttribute("width")) || 1, height = parseFloat(root.getAttribute("height")) || 1, viewBox = (root.getAttribute("viewBox") || "").trim().split(/\s+/).map(Number);
    if (viewBox.length === 4 && viewBox.every(function (v) { return Number.isFinite(v); })) { width = viewBox[2]; height = viewBox[3]; }
    var out = ["%!PS-Adobe-3.0 EPSF-3.0", "%%Creator: Algolassi Image Tools", "%%BoundingBox: 0 0 " + Math.ceil(width) + " " + Math.ceil(height), "%%Pages: 1", "%%EndComments", "gsave", "0 " + Math.ceil(height) + " translate", "1 -1 scale"];
    Array.prototype.forEach.call(doc.querySelectorAll("path"), function (path) { var d = path.getAttribute("d") || "", fill = path.getAttribute("fill") || "none"; if (!d || fill === "none" || fill === "transparent") return; var match = fill.match(/^#([0-9a-f]{6})$/i); if (!match) return; var hex = match[1], r = parseInt(hex.slice(0,2),16)/255, g = parseInt(hex.slice(2,4),16)/255, b = parseInt(hex.slice(4,6),16)/255, commands = []; if (!svgPathToEps(d, commands)) return; out.push(r.toFixed(4)+" "+g.toFixed(4)+" "+b.toFixed(4)+" setrgbcolor"); out.push(commands.join("\n")); out.push("eofill"); });
    out.push("grestore", "showpage", "%%EOF"); return out.join("\n");
  }
  function downloadText(text, name, type) { var blob = new Blob([text], { type: type }), url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(url); }, 1500); }
  function vectorExport(kind) { status("Vectorizing selected image…"); traceCurrent().then(function(svg){ if(kind === "svg"){ downloadText(svg,"algolassi-vector.svg","image/svg+xml"); status("Vector SVG created.",true); return; } downloadText(svgToEps(svg),"algolassi-vector.eps","application/postscript"); status("Vector EPS created.",true); }).catch(function(error){ console.error("Algolassi vector export:",error); status(error&&error.message?error.message:"Could not create a vector file.",false); }); }
  function bind() {
    bindHistorySelection();
    if (!captureBound) { captureBound = true; document.addEventListener("click", function(event){ var target = event.target && event.target.closest ? event.target.closest("#image-vector-svg-button, #image-vector-eps-button") : null; if (!target) return; event.preventDefault(); event.stopPropagation(); vectorExport(target.id === "image-vector-svg-button" ? "svg" : "eps"); }, true); }
    var svgButton = q("image-vector-svg-button"), epsButton = q("image-vector-eps-button");
    if(svgButton && svgButton.dataset.vectorBound !== "1"){svgButton.dataset.vectorBound="1";svgButton.addEventListener("click",function(){vectorExport("svg");});}
    if(epsButton && epsButton.dataset.vectorBound !== "1"){epsButton.dataset.vectorBound="1";epsButton.addEventListener("click",function(){vectorExport("eps");});}
  }
  function init(){bind();}
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",init,{once:true}); else init();
  window.addEventListener("algolassi:spa-navigation",function(){requestAnimationFrame(init);});
})();
