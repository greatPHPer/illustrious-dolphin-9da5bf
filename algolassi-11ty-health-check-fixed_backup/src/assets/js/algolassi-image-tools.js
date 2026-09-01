/* Algolassi Image Tools: upload -> process -> history -> download. */
(function () {
  "use strict";

  var state = {
    items: [],
    current: -1,
    crop: null
  };

  function q(id) { return document.getElementById(id); }
  function currentItem() { return state.items[state.current] || null; }
  function revokeItem(item) {
    if (item && item.objectUrl) URL.revokeObjectURL(item.objectUrl);
  }

  function fileExt(type) {
    return ({"image/png":"png","image/jpeg":"jpg","image/webp":"webp","image/avif":"avif","image/gif":"gif"})[type] || "png";
  }

  function downloadBlob(blob, name) {
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function setStatus(text, good) {
    var el = q("image-status");
    if (!el) return;
    el.textContent = text || "";
    el.style.color = good ? "#087443" : "";
  }

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = reject; img.src = url;
    });
  }

  function addHistory(blob, name, operation, width, height) {
    var objectUrl = URL.createObjectURL(blob);
    state.items.push({blob: blob, objectUrl: objectUrl, name: name, operation: operation, width: width, height: height, type: blob.type || "image/png"});
    state.current = state.items.length - 1;
    renderHistory();
    showCurrent();
  }

  function renderHistory() {
    var history = q("image-history"), empty = q("image-history-empty");
    if (!history) return;
    history.innerHTML = "";
    if (!state.items.length) {
      if (empty) empty.classList.remove("image-hidden");
      return;
    }
    if (empty) empty.classList.add("image-hidden");

    state.items.forEach(function (item, index) {
      if (index) {
        var connector = document.createElement("div");
        connector.className = "image-history-connector";
        connector.setAttribute("aria-hidden", "true");
        history.appendChild(connector);
      }
      var card = document.createElement("article");
      card.className = "image-history-card" + (index === state.current ? " current" : "");
      var button = document.createElement("button");
      button.type = "button"; button.className = "image-history-link";
      var thumb = document.createElement("span"); thumb.className = "image-history-thumb";
      var img = document.createElement("img"); img.src = item.objectUrl; img.alt = item.name; thumb.appendChild(img); button.appendChild(thumb);
      var title = document.createElement("span"); title.className = "image-history-title"; title.textContent = (index + 1) + ". " + item.operation; button.appendChild(title);
      var meta = document.createElement("span"); meta.className = "image-history-meta"; meta.textContent = item.width + "×" + item.height + " • " + fileExt(item.type).toUpperCase(); button.appendChild(meta);
      button.addEventListener("click", function () { state.current = index; renderHistory(); showCurrent(); });
      card.appendChild(button);

      var actions = document.createElement("div"); actions.className = "image-history-actions";
      var format = document.createElement("select");
      ["image/png","image/jpeg","image/webp","image/avif"].forEach(function (type) { var o = document.createElement("option"); o.value = type; o.textContent = fileExt(type).toUpperCase(); format.appendChild(o); });
      format.value = item.type === "image/jpeg" ? "image/jpeg" : item.type === "image/webp" ? "image/webp" : item.type === "image/avif" ? "image/avif" : "image/png";
      var dl = document.createElement("button"); dl.type = "button"; dl.className = "image-download-button"; dl.textContent = "Download";
      dl.addEventListener("click", function (e) { e.stopPropagation(); exportItem(item, format.value); });
      actions.appendChild(format); actions.appendChild(dl); card.appendChild(actions);

      var menuWrap = document.createElement("div"); menuWrap.className = "image-card-menu";
      var menuBtn = document.createElement("button"); menuBtn.type = "button"; menuBtn.className = "image-menu-button"; menuBtn.textContent = "Edit ▾";
      var panel = document.createElement("div"); panel.className = "image-card-menu-panel";
      if (index === state.current) {
        [
          ["Use for editing", function () { state.current = index; showCurrent(); }],
        ].forEach(function (entry) { var b = document.createElement("button"); b.type="button"; b.textContent=entry[0]; b.addEventListener("click",entry[1]); panel.appendChild(b); });
      } else {
        var b = document.createElement("button"); b.type="button"; b.textContent="Use for editing"; b.addEventListener("click",function(){state.current=index;renderHistory();showCurrent();}); panel.appendChild(b);
      }
      menuBtn.addEventListener("click", function (e) { e.stopPropagation(); document.querySelectorAll(".image-card-menu.open").forEach(function (x) { if (x !== menuWrap) x.classList.remove("open"); }); menuWrap.classList.toggle("open"); });
      menuWrap.appendChild(menuBtn); menuWrap.appendChild(panel); card.appendChild(menuWrap);
      history.appendChild(card);
    });
  }

  function showCurrent() {
    var item = currentItem(), img = q("image-preview-img"), empty = q("image-preview-empty");
    if (!img) return;
    if (!item) { img.removeAttribute("src"); img.classList.add("image-hidden"); if (empty) empty.classList.remove("image-hidden"); return; }
    img.src = item.objectUrl; img.classList.remove("image-hidden"); if (empty) empty.classList.add("image-hidden");
    var dims = q("image-dimensions"); if (dims) dims.textContent = item.width + " × " + item.height + " • " + fileExt(item.type).toUpperCase();
  }

  function canvasFromItem(item) {
    return loadImageFromUrl(item.objectUrl).then(function (img) {
      var c = document.createElement("canvas"); c.width = item.width; c.height = item.height;
      var ctx = c.getContext("2d", {willReadFrequently:true}); ctx.drawImage(img,0,0,item.width,item.height); return c;
    });
  }

  function loadImageFromUrl(url) {
    return new Promise(function(resolve,reject){var img=new Image();img.onload=function(){resolve(img);};img.onerror=reject;img.src=url;});
  }

  function canvasBlob(canvas, type, quality) {
    return new Promise(function(resolve,reject){
      canvas.toBlob(function(blob){if(blob)resolve(blob);else reject(new Error("This browser cannot encode " + type));}, type, quality);
    });
  }

  function exportItem(item, type) {
    if (type === item.type) { downloadBlob(item.blob, baseName(item.name) + "." + fileExt(type)); return; }
    canvasFromItem(item).then(function(canvas){return canvasBlob(canvas,type,.92);}).then(function(blob){downloadBlob(blob,baseName(item.name)+"."+fileExt(type));}).catch(function(){setStatus("That output format is not supported by this browser.",false);});
  }

  function baseName(name) { return (name || "image").replace(/\.[^.]+$/," ").trim().replace(/\s+$/," ") || "image"; }

  function processCurrent(operation, fn) {
    var item=currentItem(); if(!item)return;
    setStatus("Processing…");
    fn(item).then(function(result){addHistory(result.blob,result.name,operation,result.width,result.height);setStatus(operation+" completed.",true);}).catch(function(err){console.error(err);setStatus("Could not process the image.",false);});
  }

  function scaleCurrent() {
    var item=currentItem(), width=parseInt(q("scale-width").value,10), height=parseInt(q("scale-height").value,10);
    if(!item || !width || !height || width<1 || height<1)return setStatus("Enter valid dimensions.",false);
    processCurrent("Scaled to "+width+"×"+height,function(it){return canvasFromItem(it).then(function(c){var out=document.createElement("canvas");out.width=width;out.height=height;out.getContext("2d").drawImage(c,0,0,width,height);return canvasBlob(out,"image/png").then(function(blob){return {blob:blob,name:baseName(it.name)+"-scaled.png",width:width,height:height};});});});
  }

  function cropCurrent() {
    var item=currentItem(), x=parseInt(q("crop-x").value,10), y=parseInt(q("crop-y").value,10), w=parseInt(q("crop-width").value,10), h=parseInt(q("crop-height").value,10);
    if(!item || [x,y,w,h].some(function(v){return !Number.isFinite(v);}) || w<1 || h<1 || x<0 || y<0 || x+w>item.width || y+h>item.height)return setStatus("Enter a crop rectangle inside the image.",false);
    processCurrent("Cropped "+w+"×"+h,function(it){return canvasFromItem(it).then(function(c){var out=document.createElement("canvas");out.width=w;out.height=h;out.getContext("2d").drawImage(c,x,y,w,h,0,0,w,h);return canvasBlob(out,"image/png").then(function(blob){return {blob:blob,name:baseName(it.name)+"-cropped.png",width:w,height:h};});});});
  }

  function transparentCurrent() {
    var item=currentItem(), hex=(q("transparent-color").value||"#ffffff").replace("#","");
    var r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16),tol=parseInt(q("transparent-tolerance").value,10)||0;
    if([r,g,b].some(function(v){return Number.isNaN(v);}))return setStatus("Choose a valid background color.",false);
    processCurrent("Transparent background",function(it){return canvasFromItem(it).then(function(c){var ctx=c.getContext("2d",{willReadFrequently:true}),data=ctx.getImageData(0,0,c.width,c.height),px=data.data;for(var i=0;i<px.length;i+=4){if(Math.abs(px[i]-r)<=tol&&Math.abs(px[i+1]-g)<=tol&&Math.abs(px[i+2]-b)<=tol)px[i+3]=0;}ctx.putImageData(data,0,0);return canvasBlob(c,"image/png").then(function(blob){return {blob:blob,name:baseName(it.name)+"-transparent.png",width:it.width,height:it.height};});});});
  }

  function clearHistory() {
    state.items.forEach(revokeItem); state.items=[];state.current=-1;renderHistory();showCurrent();setStatus("");
  }

  function upload(file) {
    if (!file || !file.type || file.type.indexOf("image/")!==0) return setStatus("Please choose an image file.",false);
    clearHistory();
    loadImage(file).then(function(img){
      addHistory(file,file.name,"Original",img.naturalWidth||img.width,img.naturalHeight||img.height);
      setStatus("Image loaded. Processing versions will be added to the history below.",true);
    }).catch(function(){setStatus("Could not read that image.",false);});
  }

  function init() {
    if (!document.querySelector(".image-workspace")) return;
    q("image-file").addEventListener("change",function(){upload(this.files&&this.files[0]);});
    q("image-upload-button").addEventListener("click",function(){q("image-file").click();});
    q("image-scale-button").addEventListener("click",scaleCurrent);
    q("image-crop-button").addEventListener("click",cropCurrent);
    q("image-transparent-button").addEventListener("click",transparentCurrent);
    q("image-clear-button").addEventListener("click",clearHistory);
    var drop=q("image-drop");
    ["dragenter","dragover"].forEach(function(ev){drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.add("dragover");});});
    ["dragleave","drop"].forEach(function(ev){drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.remove("dragover");});});
    drop.addEventListener("drop",function(e){upload(e.dataTransfer.files&&e.dataTransfer.files[0]);});
    renderHistory();showCurrent();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();