(function () {
  "use strict";

  var ids = [
    "be-text", "be-size", "be-weight", "be-text-color", "be-c1", "be-gradient",
    "be-c2", "be-direction", "be-shape", "be-width", "be-pady", "be-padx",
    "be-border", "be-borderw", "be-shadow", "be-gloss", "be-dark"
  ];

  function init() {
    if (!document.getElementById("be-preview")) return;
    var get = function (id) { return document.getElementById(id); };
    var defaults = {
      "be-text": "Get Started", "be-size": "15", "be-weight": "700", "be-text-color": "#ffffff",
      "be-c1": "#2563eb", "be-gradient": true, "be-c2": "#60a5fa", "be-direction": "135deg",
      "be-shape": "999px", "be-width": "170", "be-pady": "12", "be-padx": "20",
      "be-border": "#ffffff", "be-borderw": "1", "be-shadow": "16", "be-gloss": "72", "be-dark": false
    };

    function esc(text) {
      return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
    }

    function values() {
      return {
        text: get("be-text").value || "Button", size: Number(get("be-size").value), weight: get("be-weight").value,
        textColor: get("be-text-color").value, c1: get("be-c1").value, gradient: get("be-gradient").checked,
        c2: get("be-c2").value, dir: get("be-direction").value, shape: get("be-shape").value,
        width: Number(get("be-width").value), pady: Number(get("be-pady").value), padx: Number(get("be-padx").value),
        border: get("be-border").value, borderw: Number(get("be-borderw").value), shadow: Number(get("be-shadow").value),
        gloss: Number(get("be-gloss").value), dark: get("be-dark").checked
      };
    }

    function outputs() {
      var v = values();
      var bg = v.gradient ? "linear-gradient(" + v.dir + ", " + v.c1 + ", " + v.c2 + ")" : v.c1;
      var rgb = parseInt(v.c1.slice(1), 16);
      var rr = (rgb >> 16) & 255, gg = (rgb >> 8) & 255, bb = rgb & 255;
      var glow = "rgba(" + rr + "," + gg + "," + bb + ",.34)";
      var gloss = (v.gloss / 100).toFixed(2);
      var css = ".algolassi-generated-button {\n" +
        "  appearance: none; position: relative; overflow: hidden;\n" +
        "  min-width: " + v.width + "px; padding: " + v.pady + "px " + v.padx + "px;\n" +
        "  border: " + v.borderw + "px solid " + v.border + "; border-radius: " + v.shape + ";\n" +
        "  color: " + v.textColor + "; background: " + bg + ";\n" +
        "  font: " + v.weight + " " + v.size + "px/1.1 system-ui, -apple-system, \"Segoe UI\", sans-serif;\n" +
        "  cursor: pointer; text-shadow: 0 1px 2px rgba(0,0,0,.28);\n" +
        "  box-shadow: 0 " + Math.round(v.shadow / 2) + "px " + v.shadow + "px " + glow + ", inset 0 1px 0 rgba(255,255,255,.7), inset 0 -2px 5px rgba(0,0,0,.16);\n" +
        "  transition: transform .16s ease, box-shadow .16s ease, filter .16s ease;\n" +
        "}\n" +
        ".algolassi-generated-button::before { content: \"\"; position: absolute; left: 3%; right: 3%; top: 4%; height: 48%; border-radius: inherit; pointer-events: none; background: linear-gradient(180deg, rgba(255,255,255," + gloss + "), rgba(255,255,255,.05)); }\n" +
        ".algolassi-generated-button:hover { transform: translateY(-2px); filter: brightness(1.05) saturate(1.08); }\n" +
        ".algolassi-generated-button:active { transform: translateY(0); }\n" +
        ".algolassi-generated-button:focus-visible { outline: 3px solid rgba(37,99,235,.35); outline-offset: 3px; }";
      var html = "<button type=\"button\" class=\"algolassi-generated-button\">" + esc(v.text) + "</button>";
      var w = Math.max(180, v.width + v.padx * 2);
      var h = Math.max(48, v.pady * 2 + v.size + 10);
      var radius = v.shape === "999px" ? h / 2 : Math.min(parseInt(v.shape, 10) || 0, h / 2);
      var fill = v.gradient ? "url(#algolassiButtonGradient)" : v.c1;
      var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + w + "\" height=\"" + h + "\" viewBox=\"0 0 " + w + " " + h + "\">" +
        (v.gradient ? "<defs><linearGradient id=\"algolassiButtonGradient\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0%\" stop-color=\"" + v.c1 + "\"/><stop offset=\"100%\" stop-color=\"" + v.c2 + "\"/></linearGradient></defs>" : "") +
        "<rect x=\"" + v.borderw + "\" y=\"" + v.borderw + "\" width=\"" + (w - v.borderw * 2) + "\" height=\"" + (h - v.borderw * 2) + "\" rx=\"" + radius + "\" fill=\"" + fill + "\" stroke=\"" + v.border + "\" stroke-width=\"" + v.borderw + "\"/>" +
        "<text x=\"50%\" y=\"50%\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"" + v.textColor + "\" font-family=\"Arial, sans-serif\" font-size=\"" + v.size + "px\" font-weight=\"" + v.weight + "\">" + esc(v.text) + "</text></svg>";
      return { css: css, html: html, svg: svg };
    }

    function refresh() {
      var v = values(), o = outputs(), p = get("be-preview"), stage = get("be-stage");
      p.textContent = v.text;
      p.style.minWidth = v.width + "px";
      p.style.padding = v.pady + "px " + v.padx + "px";
      p.style.fontSize = v.size + "px";
      p.style.fontWeight = v.weight;
      p.style.color = v.textColor;
      p.style.background = v.gradient ? "linear-gradient(" + v.dir + "," + v.c1 + "," + v.c2 + ")" : v.c1;
      p.style.border = v.borderw + "px solid " + v.border;
      p.style.borderRadius = v.shape;
      p.style.boxShadow = "0 " + Math.round(v.shadow / 2) + "px " + v.shadow + "px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.7), inset 0 -2px 5px rgba(0,0,0,.16)";
      p.style.setProperty("--editor-gloss", (v.gloss / 100).toFixed(2));
      stage.classList.toggle("dark", v.dark);
      get("be-summary").textContent = (v.shape === "999px" ? "Pill" : "Rounded") + " • " + (v.gradient ? "Gradient" : "Solid") + " • " + v.size + "px";
      get("code-html").textContent = o.html;
      get("code-css").textContent = o.css;
      get("code-svg").textContent = o.svg;
      get("be-size-v").textContent = v.size + "px"; get("be-width-v").textContent = v.width + "px"; get("be-pady-v").textContent = v.pady + "px";
      get("be-padx-v").textContent = v.padx + "px"; get("be-borderw-v").textContent = v.borderw + "px"; get("be-shadow-v").textContent = v.shadow + "px";
      get("be-gloss-v").textContent = v.gloss + "%";
      get("be-c2").disabled = !v.gradient; get("be-direction").disabled = !v.gradient;
    }

    function copy(text, button) {
      function done() { var old = button.textContent; button.textContent = "Copied!"; setTimeout(function () { button.textContent = old; }, 900); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(function () {});
      else { var a = document.createElement("textarea"); a.value = text; a.style.position = "fixed"; a.style.opacity = "0"; document.body.appendChild(a); a.select(); document.execCommand("copy"); document.body.removeChild(a); done(); }
    }

    ids.forEach(function (id) { var e = get(id); if (e) { e.addEventListener("input", refresh); e.addEventListener("change", refresh); } });
    document.querySelectorAll(".btn-tab").forEach(function (tab) { tab.addEventListener("click", function () { document.querySelectorAll(".btn-tab").forEach(function (x) { x.classList.remove("active"); }); document.querySelectorAll(".btn-code-panel").forEach(function (x) { x.classList.remove("active"); }); tab.classList.add("active"); get("panel-" + tab.dataset.tab).classList.add("active"); }); });
    document.querySelectorAll(".btn-copy-output").forEach(function (b) { b.addEventListener("click", function () { var o = outputs(); copy(o[b.dataset.copy], b); }); });
    get("be-copy-all").addEventListener("click", function (e) { var o = outputs(); copy("HTML:\n" + o.html + "\n\nCSS:\n" + o.css + "\n\nSVG:\n" + o.svg, e.currentTarget); });
    get("be-reset").addEventListener("click", function () { ids.forEach(function (id) { var e = get(id); if (!e) return; if (e.type === "checkbox") e.checked = defaults[id]; else e.value = defaults[id]; }); refresh(); });
    var presets = { blue: ["#2563eb", "#60a5fa"], violet: ["#7c3aed", "#c4b5fd"], sunset: ["#f97316", "#facc15"], emerald: ["#059669", "#6ee7b7"], neon: ["#ec4899", "#06b6d4"] };
    document.querySelectorAll(".btn-preset").forEach(function (b) { b.addEventListener("click", function () { var p = presets[b.dataset.preset]; get("be-c1").value = p[0]; get("be-c2").value = p[1]; get("be-gradient").checked = true; refresh(); }); });
    refresh();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
  window.addEventListener("algolassi:spa-navigation", init);
})();
