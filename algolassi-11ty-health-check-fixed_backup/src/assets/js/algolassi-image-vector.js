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

  function loadCurrentImage() {
    var img = q("image-preview-img");
    if (!img || img.classList.contains("image-hidden") || !img.src) {
      return Promise.reject(new Error("Upload an image first."));
    }
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.onload = function () { resolve(image); };
      image.onerror = function () { reject(new Error("Could not read the current image.")); };
      image.src = img.src;
    });
  }

  function traceCurrent() {
    return Promise.all([loadTracer(), loadCurrentImage()]).then(function (parts) {
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
      out.push(r.toFixed(4) + " " + g.toFixed(4) + " " + b.toFixed(4) + " setrgbcolor");

      var tokens = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) || [];
      var i = 0;
      var cmd = "";
      while (i < tokens.length) {
        if (/^[a-zA-Z]$/.test(tokens[i])) cmd = tokens[i++];
        if (!cmd) break;
        var lower = cmd.toLowerCase();
        var rel = cmd === cmd.toLowerCase();

        if (lower === "m" || lower === "l") {
          if (i + 1 >= tokens.length) break;
          var x = Number(tokens[i++]), y = Number(tokens[i++]);
          out.push((lower === "m" ? "moveto" : "lineto") + " " + x + " " + y);
          if (rel) { /* ImageTracer path data is normally absolute; retained for safety. */ }
          if (lower === "m") cmd = rel ? "l" : "L";
        } else if (lower === "h") {
          if (i >= tokens.length) break;
          out.push("lineto " + Number(tokens[i++]) + " currentpoint exch pop");
        } else if (lower === "v") {
          if (i >= tokens.length) break;
          out.push("currentpoint pop " + Number(tokens[i++]) + " lineto");
        } else if (lower === "c") {
          if (i + 5 >= tokens.length) break;
          out.push(Number(tokens[i++]) + " " + Number(tokens[i++]) + " " + Number(tokens[i++]) + " " + Number(tokens[i++]) + " " + Number(tokens[i++]) + " " + Number(tokens[i++]) + " curveto");
        } else if (lower === "q") {
          if (i + 3 >= tokens.length) break;
          var qx = Number(tokens[i++]), qy = Number(tokens[i++]);
          var qex = Number(tokens[i++]), qey = Number(tokens[i++]);
          out.push("currentpoint");
          out.push(qx + " " + qy + " "+ qex + " " + qey + " curveto");
        } else if (lower === "z") {
          out.push("closepath fill");
          cmd = "";
        } else {
          break;
        }
      }
      out.push("fill");
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
    status("Vectorizing image…");
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