/* Algolassi Image Tools: upload -> process -> visual history -> download. */
(function () {
  "use strict";

  var state = { items: [], current: -1, cropStart: null, cropDrag: false, cropMode: null, cropRect: null, cropOrigin: null, scalePreviewUrl: null, previewToken: 0 };
  var GLOBAL_KEY = "__algolassiImageToolsDelegated_v1";

  function q(id){return document.getElementById(id);} function currentItem(){return state.items[state.current]||null;}
  function normalizeBase(name){return(name||"image").replace(/\.[^.]+$/,"").trim()||"image";}
  function fileExt(type){return({"image/png":"png","image/jpeg":"jpg","image/webp":"webp","image/avif":"avif","image/x-icon":"ico","image/tiff":"tiff","image/svg+xml":"svg","application/postscript":"eps"})[type]||"png";}
  function formatDefinitions(){return[
    {type:"image/png",label:"PNG"},
    {type:"image/jpeg",label:"JPG"},
    {type:"image/x-icon",label:"ICO"},
    {type:"image/webp",label:"WebP"},
    {type:"image/avif",label:"AVIF"},
    {type:"image/tiff",label:"TIFF"},
    {type:"image/svg+xml",label:"SVG"},
    {type:"application/postscript",label:"EPS"}
  ];}
  function revokeItem(item){if(item&&item.objectUrl)URL.revokeObjectURL(item.objectUrl);}
  function downloadBlob(blob,name){var url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1500);}
  function setStatus(text,good){var el=q("image-status");if(!el)return;el.textContent=text||"";el.classList.toggle("image-status-good",!!good);var menuStatus=q("image-menu-status");if(menuStatus&&text)menuStatus.textContent=text;}
  function loadImage(file){return new Promise(function(resolve,reject){var url=URL.createObjectURL(file),img=new Image();img.onload=function(){URL.revokeObjectURL(url);resolve(img);};img.onerror=function(){URL.revokeObjectURL(url);reject(new Error("Image could not be read"));};img.src=url;});}
  function loadImageFromUrl(url){return new Promise(function(resolve,reject){var img=new Image();img.onload=function(){resolve(img);};img.onerror=reject;img.src=url;});}
  function canvasBlob(canvas,type,quality){return new Promise(function(resolve,reject){canvas.toBlob(function(blob){blob?resolve(blob):reject(new Error("Unsupported output format"));},type,quality);});}
  function canvasFromItem(item){return loadImageFromUrl(item.objectUrl).then(function(img){var c=document.createElement("canvas");c.width=item.width;c.height=item.height;c.getContext("2d").drawImage(img,0,0,item.width,item.height);return c;});}
  function addHistory(blob,name,operation,width,height){var objectUrl=URL.createObjectURL(blob);state.items.push({blob:blob,objectUrl:objectUrl,name:name,operation:operation,width:width,height:height,type:blob.type||"image/png"});state.current=state.items.length-1;renderHistory();showCurrent();resetCropSelection();hideScalePreview();}
  function formatOptions(item){return formatDefinitions().map(function(def){return{type:def.type,label:def.label,selected:def.type===item.type};});}
  function exportCanvasBlob(canvas,type){
    if(type==="image/x-icon"){
      return canvasBlob(canvas,"image/png").then(function(png){
        return png.arrayBuffer().then(function(buf){
          var src=new Uint8Array(buf),out=new ArrayBuffer(6+16+src.length),view=new DataView(out),bytes=new Uint8Array(out);
          view.setUint16(0,0,true);view.setUint16(2,1,true);view.setUint16(4,1,true);
          bytes[6]=canvas.width>=256?0:Math.max(1,canvas.width);bytes[7]=canvas.height>=256?0:Math.max(1,canvas.height);
          bytes[8]=0;bytes[9]=0;view.setUint16(10,1,true);view.setUint16(12,32,true);view.setUint32(14,src.length,true);view.setUint32(18,22,true);
          bytes.set(src,22);
          return new Blob([out],{type:"image/x-icon"});
        });
      });
    }
    if(type==="image/tiff"){
      var width=canvas.width,height=canvas.height,ctx=canvas.getContext("2d",{willReadFrequently:true}),rgba=ctx.getImageData(0,0,width,height).data;
      var entries=10,ifdOffset=8,ifdSize=2+entries*12+4,extraOffset=ifdOffset+ifdSize;
      var xResOffset=extraOffset,yResOffset=xResOffset+8,pixelsOffset=yResOffset+8,total=pixelsOffset+rgba.length;
      var buffer=new ArrayBuffer(total),dv=new DataView(buffer),u8=new Uint8Array(buffer);
      dv.setUint16(0,0x4949,true);dv.setUint16(2,42,true);dv.setUint32(4,ifdOffset,true);dv.setUint16(ifdOffset,entries,true);
      var e=ifdOffset+2;
      function tag(id,type,count,value){dv.setUint16(e,id,true);dv.setUint16(e+2,type,true);dv.setUint32(e+4,count,true);if(type===3&&count===1)dv.setUint16(e+8,value,true);else dv.setUint32(e+8,value,true);e+=12;}
      tag(256,4,1,width);tag(257,4,1,height);tag(258,3,4,extraOffset);tag(259,3,1,1);tag(262,3,1,2);tag(273,4,1,pixelsOffset);tag(277,3,1,4);tag(278,4,1,height);tag(279,4,1,rgba.length);tag(282,5,1,xResOffset);tag(283,5,1,yResOffset);
      dv.setUint32(ifdOffset+2+entries*12,0,true);
      [8,8,8,8].forEach(function(v,i){dv.setUint16(extraOffset+i*2,v,true);});
      dv.setUint32(xResOffset,72,true);dv.setUint32(xResOffset+4,1,true);dv.setUint32(yResOffset,72,true);dv.setUint32(yResOffset+4,1,true);
      u8.set(rgba,pixelsOffset);
      return Promise.resolve(new Blob([buffer],{type:"image/tiff"}));
    }
    if(type==="image/svg+xml"){
      var pngUrl=canvas.toDataURL("image/png");
      var svg='<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="'+canvas.width+'" height="'+canvas.height+'" viewBox="0 0 '+canvas.width+' '+canvas.height+'">\n<image href="'+pngUrl+'" width="'+canvas.width+'" height="'+canvas.height+'"/>\n</svg>';
      return Promise.resolve(new Blob([svg],{type:"image/svg+xml"}));
    }
    if(type==="application/postscript"){
      var width=canvas.width,height=canvas.height,ctx=canvas.getContext("2d",{willReadFrequently:true}),rgba=ctx.getImageData(0,0,width,height).data,hex="";
      for(var i=0;i<rgba.length;i+=4)hex+=((rgba[i]<<16)|(rgba[i+1]<<8)|rgba[i+2]).toString(16).padStart(6,"0");
      var eps="%!PS-Adobe-3.0 EPSF-3.0\n%%BoundingBox: 0 0 "+width+" "+height+"\n/DeviceRGB setcolorspace\n"+width+" "+height+" 8 ["+width+" 0 0 -"+height+" 0 "+height+"] {currentfile 3 string readhexstring pop} false 3 colorimage\n"+hex.replace(/(.{120})/g,"$1\n")+"\nshowpage\n%%EOF\n";
      return Promise.resolve(new Blob([eps],{type:"application/postscript"}));
    }
    return canvasBlob(canvas,type,.92);
  }
  function exportItem(item,type){
    if(!item)return;
    if(type===item.type){downloadBlob(item.blob,normalizeBase(item.name)+"."+fileExt(type));return;}
    canvasFromItem(item).then(function(canvas){return exportCanvasBlob(canvas,type);}).then(function(blob){downloadBlob(blob,normalizeBase(item.name)+"."+fileExt(type));}).catch(function(){setStatus("That output format is not supported by this browser.",false);});
  }

  function closeMenus(){
    ["image-file-menu","image-edit-menu"].forEach(function(id){var menu=q(id);if(menu)menu.classList.add("image-hidden");});
    [["image-file-menu-button","image-file-menu"],["image-edit-menu-button","image-edit-menu"]].forEach(function(pair){var btn=q(pair[0]);if(btn)btn.setAttribute("aria-expanded","false");});
  }
  function toggleMenu(id,buttonId){
    var menu=q(id),button=q(buttonId);if(!menu||!button)return;
    var open=menu.classList.contains("image-hidden");closeMenus();
    if(open){menu.classList.remove("image-hidden");button.setAttribute("aria-expanded","true");}
  }
  function showToolPanel(panelId,label){
    var panels=document.querySelectorAll(".image-tool-panel-view");
    for(var i=0;i<panels.length;i++)panels[i].classList.add("image-hidden");
    var panel=q(panelId)||q("image-tool-panel-empty");
    if(panel)panel.classList.remove("image-hidden");
    var menuStatus=q("image-menu-status");
    if(menuStatus)menuStatus.textContent=label||"Image Tools";
    if(panelId==="image-file-save-as-panel"){
      var item=currentItem(),select=q("image-save-as-format");
      if(item&&select)select.value=item.type;
    }
    if(panelId==="image-scale-panel"){
      var item=currentItem(),w=q("scale-width"),h=q("scale-height");
      if(item&&w&&h&&(!w.value||!h.value)){w.value=item.width;h.value=item.height;}
    }
  }
  function saveCurrent(){
    var item=currentItem();
    if(!item)return setStatus("Select an image from Processing History first.",false);
    exportItem(item,item.type);
    setStatus("Saved selected history image.",true);
  }
  function saveAsCurrent(){
    var item=currentItem(),select=q("image-save-as-format");
    if(!item)return setStatus("Select an image from Processing History first.",false);
    exportItem(item,select?select.value:item.type);
    setStatus("Saved selected image as "+(select?select.options[select.selectedIndex].text:fileExt(item.type).toUpperCase())+".",true);
  }
  function handleImageCommand(command){
    switch(command){
      case "upload": closeMenus(); q("image-file")&&q("image-file").click(); break;
      case "save": closeMenus(); saveCurrent(); break;
      case "save-as": closeMenus(); showToolPanel("image-file-save-as-panel","File • Save As"); break;
      case "transparent": closeMenus(); showToolPanel("image-transparent-panel","Edit • Background Transparent"); break;
      case "crop": closeMenus(); showToolPanel("image-crop-panel","Edit • Crop"); break;
      case "scale": closeMenus(); showToolPanel("image-scale-panel","Edit • Scale"); break;
    }
  }
  function bindMenus(){
    var bar=document.querySelector(".image-menu-bar");
    if(!bar||bar.dataset.imageMenusBound==="1")return;
    bar.dataset.imageMenusBound="1";
    q("image-file-menu-button").addEventListener("click",function(e){e.stopPropagation();toggleMenu("image-file-menu","image-file-menu-button");});
    q("image-edit-menu-button").addEventListener("click",function(e){e.stopPropagation();toggleMenu("image-edit-menu","image-edit-menu-button");});
    bar.addEventListener("click",function(e){
      var item=e.target&&e.target.closest?e.target.closest("[data-image-command]"):null;
      if(item&&bar.contains(item)){e.preventDefault();e.stopPropagation();handleImageCommand(item.getAttribute("data-image-command"));return;}
    });
    document.addEventListener("click",function(e){if(!e.target.closest||!e.target.closest(".image-menu-bar"))closeMenus();});
    document.addEventListener("keydown",function(e){if(e.key==="Escape")closeMenus();});
    var saveAs=q("image-save-as-button");if(saveAs)saveAs.addEventListener("click",saveAsCurrent);
  }

  function renderHistory(){var history=q("image-history"),empty=q("image-history-empty");if(!history)return;history.innerHTML="";if(!state.items.length){if(empty)empty.classList.remove("image-hidden");return;}if(empty)empty.classList.add("image-hidden");state.items.forEach(function(item,index){if(index){var connector=document.createElement("div");connector.className="image-history-connector";connector.setAttribute("aria-hidden","true");history.appendChild(connector);}var card=document.createElement("article");card.className="image-history-card"+(index===state.current?" current":"");card.dataset.index=index;var button=document.createElement("button");button.type="button";button.className="image-history-link";button.setAttribute("aria-label","View stage "+(index+1)+": "+item.operation);var thumb=document.createElement("span");thumb.className="image-history-thumb";var img=document.createElement("img");img.src=item.objectUrl;img.alt=item.name;thumb.appendChild(img);button.appendChild(thumb);var title=document.createElement("span");title.className="image-history-title";title.textContent=(index+1)+". "+item.operation;button.appendChild(title);var meta=document.createElement("span");meta.className="image-history-meta";meta.textContent=item.width+"×"+item.height+" • "+fileExt(item.type).toUpperCase();button.appendChild(meta);card.appendChild(button);var actions=document.createElement("div");actions.className="image-history-actions";var format=document.createElement("select");format.setAttribute("aria-label","Download format for stage "+(index+1));formatOptions(item).forEach(function(opt){var o=document.createElement("option");o.value=opt.type;o.textContent=opt.label;o.selected=opt.selected;format.appendChild(o);});var dl=document.createElement("button");dl.type="button";dl.className="image-download-button";dl.textContent="Download";actions.appendChild(format);actions.appendChild(dl);card.appendChild(actions);history.appendChild(card);});}
  function showCurrent(){var item=currentItem(),img=q("image-preview-img"),empty=q("image-preview-empty"),dims=q("image-dimensions");if(!img)return;if(!item){img.removeAttribute("src");img.classList.add("image-hidden");if(empty)empty.classList.remove("image-hidden");if(dims)dims.textContent="No image selected";return;}img.src=item.objectUrl;img.classList.remove("image-hidden");if(empty)empty.classList.add("image-hidden");if(dims)dims.textContent=item.width+" × "+item.height+" • "+fileExt(item.type).toUpperCase();}
  function processCurrent(operation,fn){var item=currentItem();if(!item)return;setStatus("Processing…");fn(item).then(function(r){addHistory(r.blob,r.name,operation,r.width,r.height);setStatus(operation+" completed.",true);}).catch(function(err){console.error(err);setStatus("Could not process the image.",false);});}
  function scaleCanvas(item,width,height){return canvasFromItem(item).then(function(c){var out=document.createElement("canvas");out.width=width;out.height=height;out.getContext("2d").drawImage(c,0,0,width,height);return out;});}
  function updateScalePreview(){
    var token=++state.previewToken,item=currentItem(),width=parseInt(q("scale-width").value,10),height=parseInt(q("scale-height").value,10),box=q("image-scale-preview"),img=q("image-scale-preview-img"),label=q("scale-live-size");
    if(!item||!width||!height||width<1||height<1){hideScalePreview();return;}
    scaleCanvas(item,width,height).then(function(c){return canvasBlob(c,"image/png");}).then(function(blob){
      if(token!==state.previewToken||item!==currentItem())return;
      if(state.scalePreviewUrl)URL.revokeObjectURL(state.scalePreviewUrl);state.scalePreviewUrl=URL.createObjectURL(blob);
      if(img){img.src=state.scalePreviewUrl;}
      if(box){box.classList.remove("image-hidden");box.setAttribute("aria-hidden","false");}
      if(label)label.textContent="Preview: "+width+" × "+height;
    }).catch(function(err){if(token===state.previewToken)console.error(err);});
  }
  var scalePreviewTimer=null;
  function scheduleScalePreview(){clearTimeout(scalePreviewTimer);scalePreviewTimer=setTimeout(updateScalePreview,140);}
  function hideScalePreview(){state.previewToken++;if(state.scalePreviewUrl){URL.revokeObjectURL(state.scalePreviewUrl);state.scalePreviewUrl=null;}var box=q("image-scale-preview"),img=q("image-scale-preview-img");if(img)img.removeAttribute("src");if(box){box.classList.add("image-hidden");box.setAttribute("aria-hidden","true");}}
  function syncScaleRatio(changed){var item=currentItem(),lock=q("scale-lock-ratio");if(!item)return;var w=parseInt(q("scale-width").value,10),h=parseInt(q("scale-height").value,10);if(lock&&lock.checked){if(changed==="width"&&w)q("scale-height").value=Math.max(1,Math.round(w*item.height/item.width));if(changed==="height"&&h)q("scale-width").value=Math.max(1,Math.round(h*item.width/item.height));}scheduleScalePreview();}
  function scaleCurrent(){var item=currentItem(),width=parseInt(q("scale-width").value,10),height=parseInt(q("scale-height").value,10);if(!item||!width||!height||width<1||height<1)return setStatus("Enter valid dimensions.",false);processCurrent("Scaled to "+width+"×"+height,function(it){return scaleCanvas(it,width,height).then(function(out){return canvasBlob(out,"image/png").then(function(blob){return{blob:blob,name:normalizeBase(it.name)+"-scaled.png",width:width,height:height};});});});}
  function imageDisplayRect(){var img=q("image-preview-img"),item=currentItem();if(!img||!item||img.classList.contains("image-hidden")||!img.naturalWidth)return null;var r=img.getBoundingClientRect();return{left:r.left,top:r.top,width:r.width,height:r.height,scaleX:item.width/r.width,scaleY:item.height/r.height};}
  function pointerInImage(e){var r=imageDisplayRect();if(!r||!e)return null;var cx=Number(e.clientX),cy=Number(e.clientY);if(!Number.isFinite(cx)||!Number.isFinite(cy))return null;var x=Math.max(0,Math.min(r.width,cx-r.left)),y=Math.max(0,Math.min(r.height,cy-r.top));return{x:x,y:y,px:x*r.scaleX,py:y*r.scaleY};}
  function ensureCropHandles(box){if(!box)return;var handles=["nw","n","ne","e","se","s","sw","w"];handles.forEach(function(dir){if(box.querySelector('[data-crop-handle="'+dir+'"]'))return;var h=document.createElement("span");h.className="image-crop-handle image-crop-handle-"+dir;h.dataset.cropHandle=dir;h.setAttribute("aria-hidden","true");h.style.position="absolute";h.style.width="12px";h.style.height="12px";h.style.margin="-6px 0 0 -6px";h.style.border="2px solid #fff";h.style.borderRadius="50%";h.style.background="#0d6efd";h.style.boxSizing="border-box";h.style.zIndex="3";h.style.pointerEvents="auto";h.style.touchAction="none";var pos={nw:[0,0],n:[50,0],ne:[100,0],e:[100,50],se:[100,100],s:[50,100],sw:[0,100],w:[0,50]}[dir];h.style.left=pos[0]+"%";h.style.top=pos[1]+"%";h.style.cursor=({nw:"nwse-resize",n:"ns-resize",ne:"nesw-resize",e:"ew-resize",se:"nwse-resize",s:"ns-resize",sw:"nesw-resize",w:"ew-resize"})[dir];box.appendChild(h);});}
  function drawCrop(start,end){var r=imageDisplayRect(),overlay=q("image-crop-overlay"),box=q("image-crop-rectangle");if(!r||!overlay||!box||!start||!end)return;var rect={x:Math.min(start.x,end.x),y:Math.min(start.y,end.y),w:Math.abs(start.x-end.x),h:Math.abs(start.y-end.y)};state.cropRect=rect;overlay.classList.remove("image-hidden");box.style.left=Math.round(rect.x)+"px";box.style.top=Math.round(rect.y)+"px";box.style.width=Math.round(rect.w)+"px";box.style.height=Math.round(rect.h)+"px";ensureCropHandles(box);var live=q("crop-live-size");if(live)live.textContent=Math.max(1,Math.round(rect.w*r.scaleX))+" × "+Math.max(1,Math.round(rect.h*r.scaleY));}
  function renderCropRect(rect,r){var box=q("image-crop-rectangle"),overlay=q("image-crop-overlay");if(!box||!overlay||!rect||!r)return;rect.x=Math.max(0,Math.min(r.width-1,rect.x));rect.y=Math.max(0,Math.min(r.height-1,rect.y));rect.w=Math.max(1,Math.min(r.width-rect.x,rect.w));rect.h=Math.max(1,Math.min(r.height-rect.y,rect.h));state.cropRect=rect;overlay.classList.remove("image-hidden");box.style.left=Math.round(rect.x)+"px";box.style.top=Math.round(rect.y)+"px";box.style.width=Math.round(rect.w)+"px";box.style.height=Math.round(rect.h)+"px";ensureCropHandles(box);var live=q("crop-live-size");if(live)live.textContent=Math.max(1,Math.round(rect.w*r.scaleX))+" × "+Math.max(1,Math.round(rect.h*r.scaleY));}
  function commitCropRect(rect,r){if(!rect||!r)return;var x=Math.round(rect.x*r.scaleX),y=Math.round(rect.y*r.scaleY),w=Math.round(rect.w*r.scaleX),h=Math.round(rect.h*r.scaleY);if(![x,y,w,h].every(function(v){return Number.isFinite(v);})||w<1||h<1)return;q("crop-x").value=x;q("crop-y").value=y;q("crop-width").value=w;q("crop-height").value=h;var live=q("crop-live-size");if(live)live.textContent=w+" × "+h;setStatus("Crop selected. Create Cropped Version to apply it.",true);}
  function resetCropSelection(){var overlay=q("image-crop-overlay"),box=q("image-crop-rectangle");if(overlay)overlay.classList.add("image-hidden");if(box){box.style.cssText="";box.innerHTML="";}["crop-x","crop-y","crop-width","crop-height"].forEach(function(id){if(q(id))q(id).value="";});if(q("crop-live-size"))q("crop-live-size").textContent="";state.cropStart=null;state.cropDrag=false;state.cropMode=null;state.cropRect=null;state.cropOrigin=null;}
  function resizeCrop(rect,dir,p,start,r){var min=12,x=rect.x,y=rect.y,w=rect.w,h=rect.h,dx=p.x-start.x,dy=p.y-start.y,right=x+w,bottom=y+h;if(dir.indexOf("n")!==-1){var newY=Math.max(0,Math.min(bottom-min,y+dy));y=newY;h=bottom-y;}if(dir.indexOf("s")!==-1){h=Math.max(min,Math.min(r.height-y,h+dy));}if(dir.indexOf("w")!==-1){var newX=Math.max(0,Math.min(right-min,x+dx));x=newX;w=right-x;}if(dir.indexOf("e")!==-1){w=Math.max(min,Math.min(r.width-x,w+dx));}return{x:x,y:y,w:w,h:h};}
  function bindCrop(stage){if(!stage||stage.dataset.imageCropBound==="1")return;stage.dataset.imageCropBound="1";stage.addEventListener("pointerdown",function(e){var item=currentItem();if(!item||e.target.closest&&e.target.closest("#image-scale-preview"))return;var r=imageDisplayRect();var p=pointerInImage(e);if(!r||!p)return;var handle=e.target.closest&&e.target.closest("[data-crop-handle]");var box=e.target.closest&&e.target.closest("#image-crop-rectangle");if(handle&&box&&state.cropRect){state.cropMode="resize";state.cropStart=p;state.cropOrigin={rect:{x:state.cropRect.x,y:state.cropRect.y,w:state.cropRect.w,h:state.cropRect.h},dir:handle.getAttribute("data-crop-handle")};}else if(box&&state.cropRect){state.cropMode="move";state.cropStart=p;state.cropOrigin={rect:{x:state.cropRect.x,y:state.cropRect.y,w:state.cropRect.w,h:state.cropRect.h}};}else{state.cropMode="draw";state.cropStart={x:p.x,y:p.y};state.cropOrigin=null;state.cropRect=null;}state.cropDrag=true;try{stage.setPointerCapture&&stage.setPointerCapture(e.pointerId);}catch(_){}e.preventDefault();});stage.addEventListener("pointermove",function(e){if(!state.cropDrag)return;var r=imageDisplayRect(),p=pointerInImage(e);if(!r||!p)return;if(state.cropMode==="draw"){drawCrop(state.cropStart,p);}else if(state.cropMode==="move"&&state.cropOrigin){var o=state.cropOrigin.rect,dx=p.x-state.cropStart.x,dy=p.y-state.cropStart.y;renderCropRect({x:Math.max(0,Math.min(r.width-o.w,o.x+dx)),y:Math.max(0,Math.min(r.height-o.h,o.y+dy)),w:o.w,h:o.h},r);}else if(state.cropMode==="resize"&&state.cropOrigin){renderCropRect(resizeCrop(state.cropOrigin.rect,state.cropOrigin.dir,p,state.cropStart,r),r);}});stage.addEventListener("pointerup",function(e){if(!state.cropDrag)return;var r=imageDisplayRect();state.cropDrag=false;var rect=state.cropRect;state.cropMode=null;state.cropOrigin=null;if(rect&&r)commitCropRect(rect,r);try{stage.releasePointerCapture&&stage.releasePointerCapture(e.pointerId);}catch(_){} });stage.addEventListener("pointercancel",function(e){state.cropDrag=false;state.cropMode=null;state.cropOrigin=null;try{stage.releasePointerCapture&&stage.releasePointerCapture(e.pointerId);}catch(_){} });}
  function bindWorkspace(){var ws=document.querySelector(".image-workspace");if(!ws)return false;if(ws.dataset.imageToolsBound==="1")return true;ws.dataset.imageToolsBound="1";
    q("image-file").addEventListener("change",function(){upload(this.files&&this.files[0]);});
    q("image-scale-button").addEventListener("click",scaleCurrent);q("image-scale-preview-button").addEventListener("click",updateScalePreview);q("image-crop-button").addEventListener("click",cropCurrent);q("image-transparent-button").addEventListener("click",transparentCurrent);q("image-clear-button").addEventListener("click",clearHistory);
    q("scale-width").addEventListener("input",function(){syncScaleRatio("width");});q("scale-height").addEventListener("input",function(){syncScaleRatio("height");});bindCrop(q("image-preview-stage"));bindMenus();
    var drop=q("image-drop");["dragenter","dragover"].forEach(function(ev){drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.add("dragover");});});["dragleave","drop"].forEach(function(ev){drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.remove("dragover");});});drop.addEventListener("drop",function(e){upload(e.dataTransfer.files&&e.dataTransfer.files[0]);});
    renderHistory();showCurrent();return true;}
  function bindHistory(){var history=q("image-history");if(!history||history.dataset.imageHistoryBound==="1")return;history.dataset.imageHistoryBound="1";history.addEventListener("click",function(e){var target=e.target&&e.target.closest?e.target.closest("button"):null;var card=e.target&&e.target.closest?e.target.closest(".image-history-card"):null;if(!card||!history.contains(card))return;var index=parseInt(card.dataset.index,10);if(!Number.isFinite(index)||!state.items[index])return;if(target&&target.matches(".image-history-link")){e.preventDefault();state.current=index;renderHistory();showCurrent();resetCropSelection();hideScalePreview();var selected=state.items[index],menuStatus=q("image-menu-status");if(menuStatus)menuStatus.textContent="Selected: "+(index+1)+". "+selected.operation;return;}if(target&&target.matches(".image-download-button")){e.preventDefault();var format=card.querySelector(".image-history-actions select");exportItem(state.items[index],format?format.value:state.items[index].type);return;}});history.addEventListener("change",function(e){var target=e.target;if(!target||!target.matches(".image-history-actions select"))return;var card=target.closest(".image-history-card");if(!card)return;var index=parseInt(card.dataset.index,10);if(Number.isFinite(index)&&state.items[index])exportItem(state.items[index],target.value);});}
  function upload(file){if(!file||!file.type||file.type.indexOf("image/")!==0)return setStatus("Please choose an image file.",false);clearHistory();loadImage(file).then(function(img){addHistory(file,file.name,"Original",img.naturalWidth||img.width,img.naturalHeight||img.height);setStatus("Image loaded. Select a File or Edit command.",true);}).catch(function(){setStatus("Could not read that image.",false);});}
  function clearHistory(){state.items.forEach(revokeItem);state.items=[];state.current=-1;resetCropSelection();hideScalePreview();renderHistory();showCurrent();showToolPanel("image-tool-panel-empty","Select File or Edit");setStatus("");}
  function cropCurrent(){var item=currentItem(),x=parseInt(q("crop-x").value,10),y=parseInt(q("crop-y").value,10),w=parseInt(q("crop-width").value,10),h=parseInt(q("crop-height").value,10);if(!item||[x,y,w,h].some(function(v){return !Number.isFinite(v);})||w<1||h<1||x<0||y<0||x+w>item.width||y+h>item.height)return setStatus("Enter a crop rectangle inside the image.",false);processCurrent("Cropped "+w+"×"+h,function(it){return canvasFromItem(it).then(function(c){var out=document.createElement("canvas");out.width=w;out.height=h;out.getContext("2d").drawImage(c,x,y,w,h,0,0,w,h);return canvasBlob(out,"image/png").then(function(blob){return{blob:blob,name:normalizeBase(it.name)+"-cropped.png",width:w,height:h};});});});}
  function transparentCurrent(){
    var item=currentItem();
    if(!item)return;
    var pick=window.__algolassiTransparentPick;
    var colorInput=q("transparent-color");
    var hex=((colorInput&&colorInput.value)||"#ffffff").replace("#","");
    var r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);
    var tol=parseInt(q("transparent-tolerance").value,10)||0;
    var seedX=pick&&Number.isFinite(Number(pick.x))?Math.floor(Number(pick.x)):null;
    var seedY=pick&&Number.isFinite(Number(pick.y))?Math.floor(Number(pick.y)):null;
    if((seedX===null)!==(seedY===null)){window.__algolassiTransparentPick=null;return setStatus("Select a background region by clicking the image.",false);}
    if(seedX===null&&[r,g,b].some(function(v){return Number.isNaN(v);}))return setStatus("Choose a valid background color.",false);
    processCurrent(seedX!==null?"Transparent background region":"Transparent background",function(it){
      return canvasFromItem(it).then(function(c){
        var ctx=c.getContext("2d",{willReadFrequently:true});
        var data=ctx.getImageData(0,0,c.width,c.height),px=data.data;
        if(seedX!==null){
          seedX=Math.max(0,Math.min(c.width-1,seedX));seedY=Math.max(0,Math.min(c.height-1,seedY));
          var seedIndex=(seedY*c.width+seedX)*4,sr=px[seedIndex],sg=px[seedIndex+1],sb=px[seedIndex+2];
          var visited=new Uint8Array(c.width*c.height),stack=[seedY*c.width+seedX];visited[seedY*c.width+seedX]=1;
          while(stack.length){
            var pos=stack.pop(),py=Math.floor(pos/c.width),pxIndex=pos-py*c.width,di=pos*4;
            if(px[di+3]===0)continue;
            if(Math.abs(px[di]-sr)>tol||Math.abs(px[di+1]-sg)>tol||Math.abs(px[di+2]-sb)>tol)continue;
            px[di+3]=0;
            if(pxIndex>0){var left=pos-1;if(!visited[left]){visited[left]=1;stack.push(left);}}
            if(pxIndex<c.width-1){var right=pos+1;if(!visited[right]){visited[right]=1;stack.push(right);}}
            if(py>0){var up=pos-c.width;if(!visited[up]){visited[up]=1;stack.push(up);}}
            if(py<c.height-1){var down=pos+c.width;if(!visited[down]){visited[down]=1;stack.push(down);}}
          }
          window.__algolassiTransparentPick=null;
        }else{
          for(var i=0;i<px.length;i+=4){if(Math.abs(px[i]-r)<=tol&&Math.abs(px[i+1]-g)<=tol&&Math.abs(px[i+2]-b)<=tol)px[i+3]=0;}
        }
        ctx.putImageData(data,0,0);
        return canvasBlob(c,"image/png").then(function(blob){return{blob:blob,name:normalizeBase(it.name)+"-transparent.png",width:it.width,height:it.height};});
      });
    });
  }
  if(!window[GLOBAL_KEY])window[GLOBAL_KEY]={initialized:true};
  function init(){bindWorkspace();bindHistory();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
  window.addEventListener("algolassi:spa-navigation",function(){requestAnimationFrame(init);});
})();