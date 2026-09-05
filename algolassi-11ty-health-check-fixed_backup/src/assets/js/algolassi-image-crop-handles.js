/* Algolassi Image Tools - restore 9-point crop resize handles without changing crop math. */
(function(){
  "use strict";

  var KEY="__algolassiImageCropHandles_v1";
  if(window[KEY])return;
  window[KEY]=true;

  function q(id){return document.getElementById(id);}
  function stage(){return q("image-preview-stage");}
  function box(){return q("image-crop-rectangle");}
  function overlay(){return q("image-crop-overlay");}
  function imageRect(){
    var img=q("image-preview-img");
    if(!img||!img.naturalWidth)return null;
    var r=img.getBoundingClientRect();
    if(!r.width||!r.height)return null;
    return {left:r.left,top:r.top,width:r.width,height:r.height,scaleX:img.naturalWidth/r.width,scaleY:img.naturalHeight/r.height};
  }
  function visible(){
    var o=overlay(),b=box();
    return !!(o&&b&&!o.classList.contains("image-hidden")&&b.style.width&&b.style.height);
  }
  function cssNumber(v){var n=parseFloat(v);return Number.isFinite(n)?n:0;}
  function currentRect(){
    var b=box();
    if(!b)return null;
    return {x:cssNumber(b.style.left),y:cssNumber(b.style.top),w:cssNumber(b.style.width),h:cssNumber(b.style.height)};
  }
  function writeCropFields(r,ir){
    if(!r||!ir)return;
    var x=Math.round(r.x*ir.scaleX),y=Math.round(r.y*ir.scaleY),w=Math.max(1,Math.round(r.w*ir.scaleX)),h=Math.max(1,Math.round(r.h*ir.scaleY));
    if(q("crop-x"))q("crop-x").value=x;
    if(q("crop-y"))q("crop-y").value=y;
    if(q("crop-width"))q("crop-width").value=w;
    if(q("crop-height"))q("crop-height").value=h;
    if(q("crop-live-size"))q("crop-live-size").textContent=w+" × "+h;
  }
  function renderRect(r,ir){
    var b=box();
    if(!b||!r)return;
    r.x=Math.max(0,Math.min(Math.max(0,ir.width-r.w),r.x));
    r.y=Math.max(0,Math.min(Math.max(0,ir.height-r.h),r.y));
    r.w=Math.max(1,Math.min(ir.width,r.w));
    r.h=Math.max(1,Math.min(ir.height,r.h));
    b.style.left=Math.round(r.x)+"px";
    b.style.top=Math.round(r.y)+"px";
    b.style.width=Math.round(r.w)+"px";
    b.style.height=Math.round(r.h)+"px";
    b.style.margin="0";
    b.style.padding="0";
    b.style.boxSizing="border-box";
    writeCropFields(r,ir);
  }
  function ensureHandles(){
    var b=box();
    if(!b)return;
    var wanted=["nw","n","ne","w","center","e","sw","s","se"];
    wanted.forEach(function(name){
      var h=b.querySelector('.image-crop-handle[data-handle="'+name+'"]');
      if(!h){
        h=document.createElement("span");
        h.className="image-crop-handle image-crop-handle-"+name;
        h.dataset.handle=name;
        h.setAttribute("aria-hidden","true");
        b.appendChild(h);
      }
    });
  }
  function installStyle(){
    if(q("image-crop-handles-style"))return;
    var s=document.createElement("style");
    s.id="image-crop-handles-style";
    s.textContent=""
      +"#image-crop-rectangle{pointer-events:auto!important;}"
      +"#image-crop-rectangle>.image-crop-handle{position:absolute!important;width:10px!important;height:10px!important;margin:0!important;padding:0!important;border-radius:50%!important;background:#0d6efd!important;border:2px solid #fff!important;box-sizing:border-box!important;z-index:10!important;pointer-events:auto!important;}"
      +"#image-crop-rectangle>.image-crop-handle-nw{left:-5px!important;top:-5px!important;cursor:nwse-resize!important;}"
      +"#image-crop-rectangle>.image-crop-handle-n{left:50%!important;top:-5px!important;transform:translateX(-50%)!important;cursor:ns-resize!important;}"
      +"#image-crop-rectangle>.image-crop-handle-ne{right:-5px!important;top:-5px!important;cursor:nesw-resize!important;}"
      +"#image-crop-rectangle>.image-crop-handle-w{left:-5px!important;top:50%!important;transform:translateY(-50%)!important;cursor:ew-resize!important;}"
      +"#image-crop-rectangle>.image-crop-handle-center{left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;cursor:move!important;}"
      +"#image-crop-rectangle>.image-crop-handle-e{right:-5px!important;top:50%!important;transform:translateY(-50%)!important;cursor:ew-resize!important;}"
      +"#image-crop-rectangle>.image-crop-handle-sw{left:-5px!important;bottom:-5px!important;cursor:nesw-resize!important;}"
      +"#image-crop-rectangle>.image-crop-handle-s{left:50%!important;bottom:-5px!important;transform:translateX(-50%)!important;cursor:ns-resize!important;}"
      +"#image-crop-rectangle>.image-crop-handle-se{right:-5px!important;bottom:-5px!important;cursor:nwse-resize!important;}"
      +"#image-crop-rectangle>span:not(.image-crop-handle){display:none!important;}";
    document.head.appendChild(s);
  }

  var active=null;
  function pointerImage(e,ir){return{x:Math.max(0,Math.min(ir.width,e.clientX-ir.left)),y:Math.max(0,Math.min(ir.height,e.clientY-ir.top))};}

  function onDown(e){
    if(!visible())return;
    var b=box(),t=e.target;
    if(!b||!t||!(t.closest&&(t.closest("#image-crop-rectangle"))))return;
    var handle=t.closest(".image-crop-handle"),name=handle?(handle.dataset.handle||"center"):"center";
    var ir=imageRect(),r=currentRect();
    if(!ir||!r)return;
    var p=pointerImage(e,ir);
    active={name:name,start:p,rect:r,ir:ir};
    var st=stage();
    try{st&&st.setPointerCapture&&st.setPointerCapture(e.pointerId);}catch(_){}
    e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
  }

  function onMove(e){
    if(!active)return;
    var ir=imageRect(),p=pointerImage(e,ir||active.ir),o=active.rect,dx=p.x-active.start.x,dy=p.y-active.start.y;
    if(!ir){e.preventDefault();return;}
    var r={x:o.x,y:o.y,w:o.w,h:o.h},n=active.name,minW=Math.max(1,1/Math.max(.0001,ir.scaleX)),minH=Math.max(1,1/Math.max(.0001,ir.scaleY));
    if(n==="center"){
      r.x=Math.max(0,Math.min(ir.width-r.w,o.x+dx));
      r.y=Math.max(0,Math.min(ir.height-r.h,o.y+dy));
    }else{
      if(n.indexOf("w")!==-1){r.x=Math.max(0,Math.min(o.x+o.w-minW,o.x+dx));r.w=o.x+o.w-r.x;}
      if(n.indexOf("e")!==-1){r.w=Math.max(minW,Math.min(ir.width-o.x,o.w+dx));}
      if(n.indexOf("n")!==-1){r.y=Math.max(0,Math.min(o.y+o.h-minH,o.y+dy));r.h=o.y+o.h-r.y;}
      if(n.indexOf("s")!==-1){r.h=Math.max(minH,Math.min(ir.height-o.y,o.h+dy));}
    }
    renderRect(r,ir);
    e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
  }

  function onUp(e){
    if(!active)return;
    active=null;
    var st=stage();
    try{st&&st.releasePointerCapture&&st.releasePointerCapture(e.pointerId);}catch(_){}
    e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
  }
  function onCancel(e){
    if(!active)return;
    active=null;
    var st=stage();
    try{st&&st.releasePointerCapture&&st.releasePointerCapture(e.pointerId);}catch(_){}
    e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
  }

  function bind(){
    var st=stage(),b=box();
    if(!st||!b)return false;
    if(st.dataset.cropHandlesBound!=="1"){
      st.dataset.cropHandlesBound="1";
      st.addEventListener("pointerdown",onDown,true);
      st.addEventListener("pointermove",onMove,true);
      st.addEventListener("pointerup",onUp,true);
      st.addEventListener("pointercancel",onCancel,true);
    }
    ensureHandles();
    installStyle();
    if(window.MutationObserver&&st.dataset.cropHandlesObserver!=="1"){
      st.dataset.cropHandlesObserver="1";
      var observer=new MutationObserver(function(){ensureHandles();});
      observer.observe(b,{attributes:true,attributeFilter:["style"],childList:true});
      window.__algolassiImageCropHandlesObserver=observer;
    }
    return true;
  }
  function init(){requestAnimationFrame(bind);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
  window.addEventListener("algolassi:spa-navigation",function(){requestAnimationFrame(function(){setTimeout(bind,0);});});
})();
