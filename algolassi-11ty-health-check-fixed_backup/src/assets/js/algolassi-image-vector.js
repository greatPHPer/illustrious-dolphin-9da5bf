/* Algolassi Image Tools - true vector SVG/EPS export. */
(function () {
  "use strict";

  var tracerUrl = "https://cdn.jsdelivr.net/npm/imagetracerjs@1.2.6/imagetracer_v1.2.6.js";
  var tracerPromise = null;

  function q(id) { return document.getElementById(id); }

  function status(text, good) {
    var el = q("image-status");
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("image-status-good", !!good);
  }

  function loadTracer() {
    if (window.ImageTracer) return Promise.resolve(window.ImageTracer);
    if (tracerPromise) return tracerPromise;
    tracerPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = tracerUrl;
      script.async = true;
      script.onload = function () {
        if (window.ImageTracer) resolve(window.ImageTracer);
        else reject(new Error("ImageTracer failed to initialize."));
      };
      script.onerror = function () {
        reject(new Error("Could not load the vectorization engine."));
      };
      document.head.appendChild(script);
    });
    return tracerPromise;
  }

  function loadSelectedImage() {
    var selected = document.querySelector("#image-history .image-history-card.current .image-history-thumb img");
    var preview = q("image-preview-img");
    var source = selected && selected.src ? selected : preview;

    if (!source || source.classList.contains("image-hidden") || !source.src) {
      return Promise.reject(new Error("Select or upload an image first."));
    }

    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.onload = function () { resolve(image); };
      image.onerror = function () { reject(new Error("Could not read the selected history image.")); };
      image.src = source.src;
    });
  }

  function traceCurrent() {
    return Promise.all([loadTracer(), loadSelectedImage()]).then(function (parts) {
      var tracer = parts[0];
      var image = parts[1];
      var canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      var ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return tracer.imagedataToSVG(imageData, {
        colorsampling: 2,
        numberofcolors: 24,
        colorquantcycles: 2,
        pathomit: 4,
        ltres: 1,
        qtres: 1,
        linefilter: true,
        roundcoords: 2,
        layering: 0,
        strokewidth: 0,
        viewbox: true,
        desc: false
      });
    });
  }

  function svgPathToEps(d, out) {
    var tokens = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) || [];
    var i = 0, cmd = "", x = 0, y = 0, startX = 0, startY = 0;
    var ok = true;

    function num() {
      if (i >= tokens.length || /^[a-zA-Z]$/.test(tokens[i])) { ok = false; return 0; }
      var v = Number(tokens[i++]);
      if (!Number.isFinite(v)) ok = false;
      return v;
    }

    while (i < tokens.length && ok) {
      if (/^[a-zA-Z]$/.test(tokens[i])) cmd = tokens[i++];
      if (!cmd) { ok = false; break; }

      var lower = cmd.toLowerCase();
      var relative = cmd === lower;

      if (lower === "m" || lower === "l") {
        var nx = num(), ny = num();
        if (relative) { nx += x; ny += y; }
        out.push(nx + " " + ny + " " + (lower === "m" ? "moveto" : "lineto"));
        x = nx; y = ny;
        if (lower === "m") { startX = x; startY = y; cmd = relative ? "l" : "L"; }
      } else if (lower === "h") {
        var hx = num();
        if (relative) hx += x;
        x = hx;
        out.push(x + " " + y + " lineto");
      } else if (lower === "v") {
        var vy = num();
        if (relative) vy += y;
        y = vy;
        out.push(x + " " + y + " lineto");
      } else if (lower === "c") {
        var c1x = num(), c1y = num(), c2x = num(), c2y = num(), ex = num(), ey = num();
        if (relative) {
          c1x += x; c1y += y; c2x += x; c2y += y; ex += x; ey += y;
        }
        out.push(c1x + " " + c1y + " " + c2x + " " + c2y + " " + ex + " " + ey + " curveto");
        x = ex; y = ey;
      } else if (lower === "q") {
        var qx = num(), qy = num(), qex = num(), qey = num();
        if (relative) { qx += x; qy += y; qex += x; qey += y; }
        var c1qx = x + (2 / 3) * (qx - x);
        var c1qy = y + (2 / 3) * (qy - y);
        var c2qx = qex + (2 / 3) * (qx - qex);
        var c2qy = qey + (2 / 3) * (qy - qey);
        out.push(c1qx + " " + c1qy + " " + c2qx + " " + c2qy + " " + qex + " " + qey + " curveto");
        x = qex; y = qey;
      } else if (lower === "z") {
        out.push("closepath");
        x = startX; y = startY;
      } else {
        ok = false;
      }
    }

    return ok;
  }

  function svgToEps(svg) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(svg, "image/svg+xml");
    if (doc.querySelector("parsererror")) throw new Error("Invalid traced SVG.");
    var root = doc.documentElement;
    var width = parseFloat(root.getAttribute("width")) || 1;
    var height = parseFloat(root.getAttribute("height")) || 1;
    var viewBox = (root.getAttribute("viewBox") || "").trim().split(/\s+/).map(Number);
    if (viewBox.length === 4 && viewBox.every(function (v) { return Number.isFinite(v); })) {
      width = viewBox[2];
      height = viewBox[3];
    }

    var out = [
      "%!PS-Adobe-3.0 EPSF-3.0",
      "%%Creator: Algolassi Image Tools",
      "%%BoundingBox: 0 0 " + Math.ceil(width) + " " + Math.ceil(height),
      "%%Pages: 1",
      "%%EndComments",
      "gsave",
      "0 " + Math.ceil(height) + " translate",
      "1 -1 scale"
    ];

    Array.prototype.forEach.call(doc.querySelectorAll("path"), function (path) {
      var d = path.getAttribute("d") || "";
      var fill = path.getAttribute("fill") || "none";
      if (!d || fill === "none" || fill === "transparent") return;

      var match = fill.match(/^#([0-9a-f]{6})$/i);
      if (!match) return;
      var hex = match[1];
      var r = parseInt(hex.slice(0, 2), 16) / 255;
      var g = parseInt(hex.slice(2, 4), 16) / 255;
      var b = parseInt(hex.slice(4, 6), 16) / 255;
      var pathCommands = [];
      if (!svgPathToEps(d, pathCommands)) return;
      out.push(r.toFixed(4) + " " + g.toFixed(4) + " " + b.toFixed(4) + " setrgbcolor");
      out.push(pathCommands.join("\n"));
      out.push("eofill");
    });

    out.push("grestore", "showpage", "%%EOF");
    return out.join("\n");
  }

  function downloadText(text, name, type) {
    var blob = new Blob([text], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function vectorExport(kind) {
    status("Vectorizing selected image…");
    traceCurrent().then(function (svg) {
      if (kind === "svg") {
        downloadText(svg, "algolassi-vector.svg", "image/svg+xml");
        status("Vector SVG created.", true);
        return;
      }
      var eps = svgToEps(svg);
      downloadText(eps, "algolassi-vector.eps", "application/postscript");
      status("Vector EPS created.", true);
    }).catch(function (error) {
      console.error("Algolassi vector export:", error);
      status(error && error.message ? error.message : "Could not create a vector file.", false);
    });
  }

  function bind() {
    var svgButton = q("image-vector-svg-button");
    var epsButton = q("image-vector-eps-button");
    if (svgButton && svgButton.dataset.vectorBound !== "1") {
      svgButton.dataset.vectorBound = "1";
      svgButton.addEventListener("click", function () { vectorExport("svg"); });
    }
    if (epsButton && epsButton.dataset.vectorBound !== "1") {
      epsButton.dataset.vectorBound = "1";
      epsButton.addEventListener("click", function () { vectorExport("eps"); });
    }
  }

  function init() { bind(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
  window.addEventListener("algolassi:spa-navigation", function () { requestAnimationFrame(init); });
})();