/* Algolassi Image Tools: layers, Magic Wand, and non-destructive layer transforms. */
(function(){
  "use strict";
  if(window.__algolassiImageLayersLoaded)return;
  window.__algolassiImageLayersLoaded=true;

  var S={layers:[],current:-1,width:0,height:0,selection:null,selectionCanvas:null,active:false};
  function q(id){return document.getElementById(id);}
  function workspace(){return document.querySelector('.image-workspace');}
  function preview(){var img=q('image-preview-img');return img&&!img.classList.contains('image-hidden')?img:null;}
  function status(t,good){var s=q('image-status');if(s){s.textContent=t||'';s.classList.toggle('image-status-good',!!good);}var m=q('image-menu-status');if(m&&t)m.textContent=t;}
  function load(url){return new Promise(function(resolve,reject){var im=new Image();im.onload=function(){resolve(im);};im.onerror=reject;im.src=url;});}
  function newCanvas(w,h){var c=document.createElement('canvas');c.width=Math.max(1,w);c.height=Math.max(1,h);return c;}
  function blankCanvas(){return newCanvas(S.width,S.height);}
  function cloneCanvas(src){var c=newCanvas(src.width,src.height);c.getContext('2d').drawImage(src,0,0);return c;}
  function selected(){return S.layers[S.current]||null;}

  function ensureLayered(){
    if(S.layers.length)return Promise.resolve(true);
    var im=preview();if(!im)return Promise.resolve(false);
    return load(im.src).then(function(image){
      S.width=image.naturalWidth;S.height=image.naturalHeight;
      var c=newCanvas(S.width,S.height);c.getContext('2d').drawImage(image,0,0);
      S.layers=[{name:'Original',visible:true,opacity:1,canvas:c}];
      S.current=0;S.selection=null;render();draw();return true;
    });
  }
  function open(){return ensureLayered().then(function(ok){
    if(!ok){status('Upload or select an image first.',false);return;}
    S.active=false;
    var stage=q('image-preview-stage');if(stage)stage.classList.add('image-layers-active');
    var c=q('image-layers-canvas'),sel=q('image-layers-selection');
    if(c)c.classList.remove('image-hidden');if(sel)sel.classList.remove('image-hidden');
    showPanel();ensureMagicColorUI();setMagicColorUIVisible(false);ensureLayersSubtoolbox();setLayersSubtoolboxVisible(true);draw();status('Layers ready. Select a layer and use its tools on the right.',true);
  });}
  function showPanel(){var p=q('image-layers-panel');if(!p)return;document.querySelectorAll('.image-tool-panel-view').forEach(function(x){x.classList.add('image-hidden');});p.classList.remove('image-hidden');var m=q('image-menu-status');if(m)m.textContent='Toolbox • Layers';}

  function ensureLayersSubtoolbox(){
    if(q('image-layers-subtoolbox'))return;
    var ws=workspace(),anchor=ws&&ws.querySelector('[data-image-command="layers"]');
    if(!ws||!anchor)return;
    var box=document.createElement('div');
    box.id='image-layers-subtoolbox';
    box.className='image-layers-subtoolbox image-hidden';
    box.setAttribute('role','toolbar');
    box.setAttribute('aria-label','Layers quick tools');
    box.innerHTML='<span class="image-layers-subtoolbox-title">Layers</span><button type="button" data-layer-subtool="magic">Magic Wand</button><button type="button" data-layer-subtool="delete">Delete Selection</button><button type="button" data-layer-subtool="clear">Clear Selection</button><button type="button" data-layer-subtool="apply">Apply Layers to History</button><button type="button" data-layer-subtool="export">Export PNG</button>';
    anchor.insertAdjacentElement('afterend',box);
    box.addEventListener('click',function(e){
      var b=e.target&&e.target.closest?e.target.closest('[data-layer-subtool]'):null;
      if(!b||!box.contains(b))return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      var action=b.getAttribute('data-layer-subtool');
      if(action==='magic'){
        clearSelection();S.active=true;ensureMagicColorUI();setMagicColorUIVisible(true);status('Magic Wand active. Click a color region in the image.',true);
      }else if(action==='delete'){
        deleteSelection();
      }else if(action==='clear'){
        S.active=false;setMagicColorUIVisible(false);clearSelection();status('Selection cleared.',true);
      }else if(action==='apply'){
        applyHistory();
      }else if(action==='export'){
        exportPng();
      }
    });
    if(!q('image-layers-subtoolbox-style')){
      var style=document.createElement('style');style.id='image-layers-subtoolbox-style';style.textContent='.image-layers-subtoolbox{display:inline-flex;align-items:center;gap:.3rem;flex-wrap:wrap;margin-left:.45rem;padding:.3rem .4rem;border:1px solid rgba(139,90,43,.22);border-radius:9px;background:rgba(139,90,43,.055);box-shadow:0 1px 3px rgba(16,24,40,.06)}.image-layers-subtoolbox-title{font-size:.76rem;font-weight:800;opacity:.72;padding:0 .2rem}.image-layers-subtoolbox button{border:1px solid rgba(139,90,43,.22);background:transparent;border-radius:7px;padding:.28rem .5rem;font:inherit;font-size:.76rem;line-height:1.2;cursor:pointer;white-space:nowrap}.image-layers-subtoolbox button:hover{background:rgba(139,90,43,.1)}@media(max-width:700px){.image-layers-subtoolbox{width:100%;margin:.35rem 0 0}.image-layers-subtoolbox button{flex:1;min-width:0}.image-layers-subtoolbox-title{width:100%}}';document.head.appendChild(style);
    }
  }
  function setLayersSubtoolboxVisible(visible){var box=q('image-layers-subtoolbox');if(!box)return;box.classList.toggle('image-hidden',!visible);}

  /* Leaving Layers without pressing "Apply Layers to History" intentionally
     discards the temporary layer state. This keeps Processing History intact
     and makes the next tool operate on the last saved history image. */
  function leaveLayers(){
    if(!S.layers.length && !S.width)return;
    setMagicColorUIVisible(false);setLayersSubtoolboxVisible(false);
    S.layers=[];S.current=-1;S.width=0;S.height=0;S.selection=null;S.selectionCanvas=null;S.active=false;
    var stage=q('image-preview-stage');if(stage)stage.classList.remove('image-layers-active');
    var c=q('image-layers-canvas'),sel=q('image-layers-selection');
    if(c){c.classList.add('image-hidden');c.width=1;c.height=1;}
    if(sel){sel.classList.add('image-hidden');sel.width=1;sel.height=1;}
    status('Unapplied layer changes discarded.',true);
  }

  function render(){
    var list=q('image-layer-list');if(!list)return;list.innerHTML='';
    if(!S.layers.length){list.innerHTML='<div class="image-layers-empty">No layers yet.</div>';return;}
    for(var i=S.layers.length-1;i>=0;i--){(function(index){
      var l=S.layers[index],row=document.createElement('div');row.className='image-layer-row'+(index===S.current?' current':'');row.dataset.index=index;
      var eye=document.createElement('button');eye.type='button';eye.className='image-layer-eye';eye.title=l.visible?'Hide layer':'Show layer';eye.textContent=l.visible?'◉':'○';
      eye.addEventListener('click',function(e){e.stopPropagation();l.visible=!l.visible;render();draw();});row.appendChild(eye);
      var name=document.createElement('span');name.className='image-layer-name';name.textContent=l.name;name.title='Double-click to rename';
      name.addEventListener('dblclick',function(e){e.stopPropagation();name.contentEditable='true';name.focus();document.execCommand('selectAll',false,null);});
      name.addEventListener('blur',function(){name.contentEditable='false';l.name=name.textContent.trim()||('Layer '+(index+1));render();});row.appendChild(name);
      var re=document.createElement('span');re.className='image-layer-reorder';var up=document.createElement('button'),down=document.createElement('button');up.type=down.type='button';up.textContent='↑';down.textContent='↓';up.title='Move up';down.title='Move down';
      up.addEventListener('click',function(e){e.stopPropagation();moveLayer(index,1);});down.addEventListener('click',function(e){e.stopPropagation();moveLayer(index,-1);});re.appendChild(up);re.appendChild(down);row.appendChild(re);
      row.addEventListener('click',function(){setMagicColorUIVisible(false);setLayersSubtoolboxVisible(false);S.active=false;S.current=index;clearSelection();syncLayerControls();syncLayerTransformFields();render();draw();});list.appendChild(row);
    })(i);}syncLayerControls();syncLayerTransformFields();
  }
  function syncLayerControls(){var l=selected(),range=q('image-layer-opacity'),out=q('image-layer-opacity-value');if(range)range.value=l?Math.round(l.opacity*100):100;if(out)out.textContent=(l?Math.round(l.opacity*100):100)+'%';}
  function moveLayer(i,delta){var ni=i+delta;if(ni<0||ni>=S.layers.length)return;var t=S.layers[i];S.layers[i]=S.layers[ni];S.layers[ni]=t;S.current=ni;S.active=false;setMagicColorUIVisible(false);setLayersSubtoolboxVisible(false);render();draw();}
  function addLayer(){if(!S.width)return;S.active=false;setMagicColorUIVisible(false);setLayersSubtoolboxVisible(false);var c=blankCanvas();S.layers.push({name:'Layer '+(S.layers.length+1),visible:true,opacity:1,canvas:c});S.current=S.layers.length-1;clearSelection();render();draw();}
  function duplicateLayer(){var l=selected();if(!l)return status('Select a layer first.',false);S.active=false;setMagicColorUIVisible(false);setLayersSubtoolboxVisible(false);S.layers.splice(S.current+1,0,{name:l.name+' copy',visible:l.visible,opacity:l.opacity,canvas:cloneCanvas(l.canvas)});S.current++;clearSelection();render();draw();status('Layer duplicated.',true);}
  function deleteLayer(){if(S.layers.length<=1)return status('Keep at least one layer.',false);S.active=false;setMagicColorUIVisible(false);setLayersSubtoolboxVisible(false);S.layers.splice(S.current,1);S.current=Math.max(0,Math.min(S.current,S.layers.length-1));clearSelection();render();draw();}

  function resizeLayerCanvas(layer,w,h,offsetX,offsetY){var old=layer.canvas,out=newCanvas(w,h),ctx=out.getContext('2d');ctx.drawImage(old,offsetX||0,offsetY||0);layer.canvas=out;}
  function composite(){var c=blankCanvas(),ctx=c.getContext('2d');for(var i=0;i<S.layers.length;i++){var l=S.layers[i];if(!l.visible)continue;ctx.globalAlpha=l.opacity;ctx.drawImage(l.canvas,0,0);}ctx.globalAlpha=1;return c;}
  function draw(){var c=q('image-layers-canvas');if(!c||!S.width)return;c.width=S.width;c.height=S.height;var ctx=c.getContext('2d');ctx.clearRect(0,0,S.width,S.height);ctx.drawImage(composite(),0,0);drawSelection();syncLayerControls();}
  function stagePoint(e){var c=q('image-layers-canvas')||q('image-preview-stage');if(!c||!S.width)return null;var r=c.getBoundingClientRect();if(!r.width||!r.height)return null;var x=Math.floor((e.clientX-r.left)*S.width/r.width),y=Math.floor((e.clientY-r.top)*S.height/r.height);return{x:Math.max(0,Math.min(S.width-1,x)),y:Math.max(0,Math.min(S.height-1,y))};}
  function distance(r,g,b,tr,tg,tb){var dr=r-tr,dg=g-tg,db=b-tb;return Math.sqrt(dr*dr+dg*dg+db*db);}

  function ensureMagicColorUI(){
    if(q('image-magic-color-box'))return;
    var host=q('image-magic-wand-box')||q('image-layers-panel');
    if(!host)return;
    var box=document.createElement('div');
    box.id='image-magic-color-box';
    box.className='image-magic-color-box image-hidden';
    box.innerHTML='<label class="image-magic-color-label" for="image-magic-replace-color">Replace selected color</label><div class="image-magic-color-controls"><input id="image-magic-replace-color" type="color" value="#ff0000" aria-label="Replacement color"><button id="image-magic-replace-color-apply" type="button" class="image-action-button">Replace Color</button></div><p class="image-magic-color-help">Changes all currently selected regions on the active layer and keeps the selection active.</p>';
    host.appendChild(box);
    var button=q('image-magic-replace-color-apply');
    if(button)button.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();replaceSelectedColor();},true);
    if(!q('image-magic-color-style')){
      var style=document.createElement('style');style.id='image-magic-color-style';style.textContent='.image-magic-color-box{margin-top:.7rem;padding-top:.7rem;border-top:1px solid rgba(139,90,43,.16)}.image-magic-color-label{display:block;font-size:.84rem;font-weight:700;margin-bottom:.35rem}.image-magic-color-controls{display:flex;align-items:center;gap:.5rem}.image-magic-color-controls input[type=color]{width:44px;height:36px;padding:2px;border:1px solid rgba(139,90,43,.28);border-radius:7px;background:transparent;cursor:pointer}.image-magic-color-controls .image-action-button{flex:1}.image-magic-color-help{margin:.35rem 0 0;font-size:.76rem;opacity:.75}';document.head.appendChild(style);
    }
  }
  function setMagicColorUIVisible(visible){var box=q('image-magic-color-box');if(!box)return;box.classList.toggle('image-hidden',!visible);}
  function hexToRgb(hex){var h=(hex||'').replace('#','');if(h.length===3)h=h.split('').map(function(ch){return ch+ch;}).join('');if(!/^[0-9a-fA-F]{6}$/.test(h))return null;return{r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)};}
  function replaceSelectedColor(){
    var l=selected();if(!l||!S.selection)return status('Use Magic Wand to select a region first.',false);
    var picker=q('image-magic-replace-color'),rgb=hexToRgb(picker?picker.value:'#ff0000');if(!rgb)return status('Choose a valid replacement color.',false);
    var ctx=l.canvas.getContext('2d'),id=ctx.getImageData(0,0,l.canvas.width,l.canvas.height),a=id.data,changed=0;
    for(var i=0;i<S.selection.length;i++)if(S.selection[i]){var p=i*4;if(a[p+3]>0){a[p]=rgb.r;a[p+1]=rgb.g;a[p+2]=rgb.b;changed++;}}
    ctx.putImageData(id,0,0);S.active=true;draw();
    status('Recolored '+changed.toLocaleString()+' selected pixels to '+(picker?picker.value.toUpperCase():'#FF0000')+'. Click another region to add it, or choose another color to recolor the current selection.',true);
  }

  function magicWand(pt){
    var l=selected();if(!l)return;
    var lw=l.canvas.width,lh=l.canvas.height,total=lw*lh;
    if(total>16000000){S.active=false;status('Magic Wand is disabled for very large images. Scale the image smaller first.',false);return;}
    var ctx=l.canvas.getContext('2d',{willReadFrequently:true}),d=ctx.getImageData(0,0,lw,lh).data;
    var px=Math.max(0,Math.min(lw-1,pt.x)),py=Math.max(0,Math.min(lh-1,pt.y)),idx=(py*lw+px)*4,tr=d[idx],tg=d[idx+1],tb=d[idx+2],ta=d[idx+3];
    var tol=Number((q('image-magic-tolerance')||{}).value||24),maxDist=Math.max(4,tol),alphaTol=Math.max(8,Math.round(tol*0.6));
    var seen=new Uint8Array(total),queue=new Int32Array(total),head=0,tail=0,mask=new Uint8Array(total);
    queue[tail++]=py*lw+px;seen[py*lw+px]=1;
    while(head<tail){var p=queue[head++],x=p%lw,y=Math.floor(p/lw),di=p*4;
      if(Math.abs(d[di+3]-ta)>alphaTol)continue;
      if(distance(d[di],d[di+1],d[di+2],tr,tg,tb)<=maxDist){mask[p]=1;
        var np,nx=x+1;if(nx<lw){np=p+1;if(!seen[np]){seen[np]=1;queue[tail++]=np;}}
        nx=x-1;if(nx>=0){np=p-1;if(!seen[np]){seen[np]=1;queue[tail++]=np;}}
        var ny=y+1;if(ny<lh){np=p+lw;if(!seen[np]){seen[np]=1;queue[tail++]=np;}}
        ny=y-1;if(ny>=0){np=p-lw;if(!seen[np]){seen[np]=1;queue[tail++]=np;}}
      }
    }
    if(S.selection){
      for(var si=0;si<mask.length;si++)if(mask[si])S.selection[si]=1;
    }else{
      S.selection=mask;
    }
    S.selectionCanvas=maskToCanvas(S.selection);S.active=true;drawSelection();setMagicColorUIVisible(true);
    var count=0;for(var i=0;i<S.selection.length;i++)if(S.selection[i])count++;
    status('Magic Wand selected '+count.toLocaleString()+' pixels. Click another color region to add it, or use Delete Selection / another tool to finish.',true);
  }
  function maskToCanvas(mask){var c=newCanvas(S.width,S.height),id=c.getContext('2d').createImageData(S.width,S.height),a=id.data,len=Math.min(mask.length,S.width*S.height);for(var i=0;i<len;i++)if(mask[i]){a[i*4]=255;a[i*4+1]=210;a[i*4+2]=70;a[i*4+3]=150;}c.getContext('2d').putImageData(id,0,0);return c;}
  function drawSelection(){var c=q('image-layers-selection');if(!c||!S.width)return;c.width=S.width;c.height=S.height;var ctx=c.getContext('2d');ctx.clearRect(0,0,S.width,S.height);if(!S.selection)return;var id=ctx.createImageData(S.width,S.height),a=id.data,now=Date.now()%1200>600;for(var i=0;i<S.selection.length;i++)if(S.selection[i]&&now){a[i*4]=255;a[i*4+1]=255;a[i*4+2]=255;a[i*4+3]=190;}ctx.putImageData(id,0,0);}
  setInterval(function(){if(S.selection)drawSelection();},220);
  function clearSelection(){S.selection=null;S.selectionCanvas=null;drawSelection();}

  function updateTransformBounds(){var l=selected(),x=q('image-layer-crop-x'),y=q('image-layer-crop-y'),w=q('image-layer-crop-width'),h=q('image-layer-crop-height');if(!l)return;var ctx=l.canvas.getContext('2d',{willReadFrequently:true}),d=ctx.getImageData(0,0,l.canvas.width,l.canvas.height).data,minX=l.canvas.width,minY=l.canvas.height,maxX=-1,maxY=-1;for(var py=0;py<l.canvas.height;py++)for(var px=0;px<l.canvas.width;px++)if(d[(py*l.canvas.width+px)*4+3]>0){if(px<minX)minX=px;if(py<minY)minY=py;if(px>maxX)maxX=px;if(py>maxY)maxY=py;}if(maxX<0){minX=0;minY=0;maxX=l.canvas.width-1;maxY=l.canvas.height-1;}if(x)x.value=minX;if(y)y.value=minY;if(w)w.value=maxX-minX+1;if(h)h.value=maxY-minY+1;}
  function syncLayerTransformFields(){updateTransformBounds();}
  function cropLayer(){var l=selected();if(!l)return status('Select a layer first.',false);var x=Math.max(0,Math.min(l.canvas.width-1,parseInt(q('image-layer-crop-x').value,10)||0)),y=Math.max(0,Math.min(l.canvas.height-1,parseInt(q('image-layer-crop-y').value,10)||0)),w=Math.max(1,parseInt(q('image-layer-crop-width').value,10)||1),h=Math.max(1,parseInt(q('image-layer-crop-height').value,10)||1);w=Math.min(w,l.canvas.width-x);h=Math.min(h,l.canvas.height-y);var src=cloneCanvas(l.canvas),ctx=l.canvas.getContext('2d');ctx.clearRect(0,0,l.canvas.width,l.canvas.height);ctx.drawImage(src,x,y,w,h,x,y,w,h);S.active=false;setMagicColorUIVisible(false);setLayersSubtoolboxVisible(false);clearSelection();render();draw();status('Cropped selected layer only.',true);}
  function scaleLayer(){var l=selected();if(!l)return status('Select a layer first.',false);var nw=Math.max(1,parseInt(q('image-layer-scale-width').value,10)||l.canvas.width),nh=Math.max(1,parseInt(q('image-layer-scale-height').value,10)||l.canvas.height),src=cloneCanvas(l.canvas),out=newCanvas(S.width,S.height),ctx=out.getContext('2d');ctx.drawImage(src,(S.width-nw)/2,(S.height-nh)/2,nw,nh);l.canvas=out;S.active=false;setMagicColorUIVisible(false);setLayersSubtoolboxVisible(false);clearSelection();render();draw();syncLayerTransformFields();status('Scaled selected layer only.',true);}
  function rotateLayer(deg){var l=selected();if(!l)return status('Select a layer first.',false);var src=cloneCanvas(l.canvas),oldW=src.width,oldH=src.height,newW=oldH,newH=oldW,out=newCanvas(newW,newH),ctx=out.getContext('2d');ctx.translate(newW/2,newH/2);ctx.rotate(deg*Math.PI/180);ctx.drawImage(src,-oldW/2,-oldH/2);l.canvas=out;var targetW=Math.max(S.width,newW),targetH=Math.max(S.height,newH);if(targetW>S.width||targetH>S.height){var oldDocW=S.width,oldDocH=S.height,dx=Math.round((targetW-oldDocW)/2),dy=Math.round((targetH-oldDocH)/2);S.layers.forEach(function(layer){if(layer===l){var nc=newCanvas(targetW,targetH),nctx=nc.getContext('2d');nctx.drawImage(layer.canvas,Math.round((targetW-newW)/2),Math.round((targetH-newH)/2));layer.canvas=nc;}else{resizeLayerCanvas(layer,targetW,targetH,dx,dy);}});S.width=targetW;S.height=targetH;}else if(l.canvas.width!==S.width||l.canvas.height!==S.height){var centered=newCanvas(S.width,S.height);centered.getContext('2d').drawImage(l.canvas,(S.width-newW)/2,(S.height-newH)/2);l.canvas=centered;}S.active=false;setMagicColorUIVisible(false);setLayersSubtoolboxVisible(false);clearSelection();render();draw();syncLayerTransformFields();status('Rotated layer “'+l.name+'” only ('+deg+'°).',true);}
  function copySelection(){var l=selected();if(!l||!S.selection)return status('Use Magic Wand to select a region first.',false);var src=l.canvas.getContext('2d').getImageData(0,0,l.canvas.width,l.canvas.height),out=newCanvas(l.canvas.width,l.canvas.height),od=out.getContext('2d').createImageData(l.canvas.width,l.canvas.height),a=od.data;for(var i=0;i<S.selection.length;i++)if(S.selection[i]){a[i*4]=src.data[i*4];a[i*4+1]=src.data[i*4+1];a[i*4+2]=src.data[i*4+2];a[i*4+3]=src.data[i*4+3];}out.getContext('2d').putImageData(od,0,0);S.layers.splice(S.current+1,0,{name:'Magic Wand Copy',visible:true,opacity:1,canvas:out});S.current++;S.active=false;setMagicColorUIVisible(false);setLayersSubtoolboxVisible(false);clearSelection();render();draw();status('Selected region copied to a new layer.',true);}
  function deleteSelection(){var l=selected();if(!l||!S.selection)return status('Use Magic Wand to select a region first.',false);var ctx=l.canvas.getContext('2d'),id=ctx.getImageData(0,0,l.canvas.width,l.canvas.height),a=id.data;for(var i=0;i<S.selection.length;i++)if(S.selection[i])a[i*4+3]=0;ctx.putImageData(id,0,0);S.active=false;setMagicColorUIVisible(false);setLayersSubtoolboxVisible(false);clearSelection();draw();syncLayerTransformFields();status('Selected region removed from the active layer.',true);}
  function canvasBlob(c){return new Promise(function(resolve,reject){c.toBlob(function(b){b?resolve(b):reject(new Error('PNG export failed'));},'image/png');});}
  function resetLayerState(){setMagicColorUIVisible(false);setLayersSubtoolboxVisible(false);S.layers=[];S.current=-1;S.width=0;S.height=0;S.selection=null;S.selectionCanvas=null;S.active=false;var stage=q('image-preview-stage');if(stage)stage.classList.remove('image-layers-active');var c=q('image-layers-canvas'),sel=q('image-layers-selection');if(c)c.classList.add('image-hidden');if(sel)sel.classList.add('image-hidden');}
  function applyHistory(){canvasBlob(composite()).then(function(blob){var file=new File([blob],'layers-composite.png',{type:'image/png'}),input=q('image-file');if(!input)throw new Error('Image uploader unavailable.');window.__algolassiImageToolsAppendHistory=true;var dt=new DataTransfer();dt.items.add(file);input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));resetLayerState();status('All visible layers added as a new Processing History stage.',true);}).catch(function(){window.__algolassiImageToolsAppendHistory=false;status('Could not add the layered image to history.',false);});}
  function exportPng(){canvasBlob(composite()).then(function(blob){var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='algolassi-layers.png';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1500);status('Layered PNG exported.',true);});}
  function rotateLayerButton(id,deg){var b=q(id);if(!b||b.dataset.layerRotateBound==='1')return;b.dataset.layerRotateBound='1';b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();rotateLayer(deg);},true);}
  function bind(){
    var ws=workspace();if(!ws||ws.dataset.layersBound==='1')return;ws.dataset.layersBound='1';
    document.addEventListener('click',function(e){
      var b=e.target&&e.target.closest?e.target.closest('[data-image-command="layers"]'):null;
      if(b&&ws.contains(b)){e.preventDefault();e.stopPropagation();open();return;}
      var command=e.target&&e.target.closest?e.target.closest('[data-image-command]'):null;
      if(command&&ws.contains(command)&&command.getAttribute('data-image-command')!=='layers'&&S.layers.length){leaveLayers();}
    },true);
    q('image-layer-add')&&q('image-layer-add').addEventListener('click',addLayer);q('image-layer-duplicate')&&q('image-layer-duplicate').addEventListener('click',duplicateLayer);q('image-layer-delete')&&q('image-layer-delete').addEventListener('click',deleteLayer);
    q('image-layer-opacity')&&q('image-layer-opacity').addEventListener('input',function(){var l=selected();if(l)l.opacity=Number(this.value)/100;syncLayerControls();draw();});
    q('image-magic-tolerance')&&q('image-magic-tolerance').addEventListener('input',function(){var o=q('image-magic-tolerance-value');if(o)o.textContent=this.value;});
    q('image-magic-wand')&&q('image-magic-wand').addEventListener('click',function(e){e.preventDefault();e.stopPropagation();clearSelection();S.active=true;ensureMagicColorUI();setMagicColorUIVisible(true);status('Magic Wand active. Click a color region in the image.',true);});
    q('image-magic-copy')&&q('image-magic-copy').addEventListener('click',copySelection);q('image-magic-delete')&&q('image-magic-delete').addEventListener('click',deleteSelection);q('image-magic-clear')&&q('image-magic-clear').addEventListener('click',function(){S.active=false;setMagicColorUIVisible(false);clearSelection();status('Selection cleared.',true);});
    q('image-layers-export')&&q('image-layers-export').addEventListener('click',exportPng);q('image-layers-apply')&&q('image-layers-apply').addEventListener('click',applyHistory);
    q('image-layer-crop-apply')&&q('image-layer-crop-apply').addEventListener('click',cropLayer);q('image-layer-scale-apply')&&q('image-layer-scale-apply').addEventListener('click',scaleLayer);
    rotateLayerButton('image-layer-rotate-90',90);rotateLayerButton('image-layer-rotate-180',180);rotateLayerButton('image-layer-rotate-270',270);
    var stage=q('image-preview-stage');
    if(stage&&stage.dataset.magicWandBound!=='1'){
      stage.dataset.magicWandBound='1';
      stage.addEventListener('pointerdown',function(e){
        if(!S.active||!S.layers.length)return;
        if(e.target&&e.target.closest&&e.target.closest('button,input,select,textarea,a,.image-toolbar,.image-history'))return;
        var pt=stagePoint(e);if(!pt)return;
        e.preventDefault();
        magicWand(pt);
      },true);
    }
    var c=q('image-layers-canvas');
    if(c)c.addEventListener('click',function(e){if(!S.active||!S.layers.length)return;var pt=stagePoint(e);if(pt)magicWand(pt);});
  }
  function init(){bind();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('algolassi:spa-navigation',function(){setTimeout(function(){resetLayerState();bind();},50);});
})();