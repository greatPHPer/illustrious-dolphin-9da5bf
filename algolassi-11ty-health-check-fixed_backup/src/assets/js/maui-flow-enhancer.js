/* Algolassi implementation flow enhancer + Developer Tools shell */
(function () {
  "use strict";
  var TOOL_RE=/^\/developer-tools\/(json-formatter|base64-encoder-decoder|guid-generator|jwt-decoder|regex-tester|unix-timestamp-converter|url-encoder-decoder|html-encoder-decoder|code-equals-aligner)\/$/;
  var DEV_HOME="/developer-tools/";
  var CATEGORIES={
    image:{title:"🖼️ Image Tools",url:"/developer-tools/image-tools/",tools:[]},
    format:{title:"🔄 Format Converters",url:"/developer-tools/format-converters/",tools:[
      ["base64-encoder-decoder","Base64"],["url-encoder-decoder","URL"],["html-encoder-decoder","HTML"]
    ]},
    data:{title:"{} Data & Validation",url:"/developer-tools/data-validation/",tools:[
      ["json-formatter","JSON"],["jwt-decoder","JWT"],["regex-tester","Regex"]
    ]},
    utility:{title:"🧰 Developer Utilities",url:"/developer-tools/developer-utilities/",tools:[
      ["guid-generator","GUID"],["unix-timestamp-converter","Timestamp"],["code-equals-aligner","Equals"]
    ]}
  };
  var navigating=false;

  function css(){
    if(document.getElementById("algolassi-flow-enhancer-styles"))return;
    var s=document.createElement("style");
    s.id="algolassi-flow-enhancer-styles";
    s.textContent=".devtools-stepper{position:relative;top:auto;z-index:20;overflow:hidden;margin:0 0 1.25rem;padding:.65rem .5rem;border:1px solid rgba(100,116,139,.24);border-radius:14px;background:rgba(255,255,255,.96);box-shadow:0 8px 24px rgba(15,23,42,.08);backdrop-filter:blur(8px)}.devtools-stepper-inner{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:0;min-width:0}.devtools-stepper a{display:inline-flex;align-items:center;gap:.4rem;padding:.45rem .65rem;border-radius:9px;color:inherit;text-decoration:none;font-weight:600;font-size:.84rem;white-space:nowrap}.devtools-stepper a:hover,.devtools-stepper a.active{background:rgba(13,110,253,.12)}.devtools-stepper a.active{box-shadow:inset 0 -3px #0d6efd}.devtools-stepper .step-node{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;font-size:.7rem;background:rgba(13,110,253,.1)}.devtools-stepper .step-arrow{opacity:.45;padding:0 .1rem}.devtools-tool-slider{position:relative;overflow:hidden;width:100%}.devtools-tool-slider>.page-content{will-change:transform;min-width:100%}.devtools-tool-slider.dt-next>.page-content{animation:algolassiToolNext .48s ease both}.devtools-tool-slider.dt-prev>.page-content{animation:algolassiToolPrev .48s ease both}@keyframes algolassiToolNext{from{opacity:0;transform:translateX(52px)}to{opacity:1;transform:translateX(0)}}@keyframes algolassiToolPrev{from{opacity:0;transform:translateX(-52px)}to{opacity:1;transform:translateX(0)}}#algolassi-google-auth #algolassi-google-signout{color:#475467!important}#algolassi-google-auth #algolassi-google-signout:hover{color:#344054!important}html[data-theme=\"dark\"] #algolassi-google-auth #algolassi-google-signout,html:not([data-theme=\"light\"]) #algolassi-google-auth #algolassi-google-signout{color:#e7edf5!important}html[data-theme=\"dark\"] #algolassi-google-auth #algolassi-google-signout:hover,html:not([data-theme=\"light\"]) #algolassi-google-auth #algolassi-google-signout:hover{color:#f2f4f7!important}@media(prefers-color-scheme:light){html:not([data-theme=\"dark\"]) #algolassi-google-auth #algolassi-google-signout{color:#475467!important}html:not([data-theme=\"dark\"]) #algolassi-google-auth #algolassi-google-signout:hover{color:#344054!important}}@media(prefers-reduced-motion:reduce){.devtools-tool-slider>.page-content{animation:none!important}}@media(max-width:700px){.devtools-stepper{overflow-x:hidden;overflow-y:visible;white-space:normal;width:100%;box-sizing:border-box;top:auto}.devtools-stepper-inner{justify-content:flex-start;align-items:center;flex-wrap:wrap;min-width:0;width:100%;gap:4px 6px}.devtools-stepper a{flex:0 1 auto;min-width:0;max-width:100%;font-size:.74rem;padding:.38rem .48rem;white-space:normal;overflow-wrap:anywhere;box-sizing:border-box}.devtools-stepper .step-node{width:21px;height:21px;flex:0 0 21px}.devtools-stepper .step-arrow{padding:0;flex:0 0 auto}}html[data-theme=\"dark\"] .devtools-stepper{background:rgba(17,24,39,.96)}";
    document.head.appendChild(s);
  }

  function isDeveloperToolsPath(path){
    var p=(path||"").replace(/\/+$/,"/");
    return p===DEV_HOME||TOOL_RE.test(p);
  }

  function currentCategory(path){
    var p=(path||"").replace(/\/+$/,"/");
    var keys=Object.keys(CATEGORIES);
    for(var i=0;i<keys.length;i++){
      var key=keys[i], category=CATEGORIES[key];
      if(category.url===p)return key;
      for(var j=0;j<category.tools.length;j++){
        if("/developer-tools/"+category.tools[j][0]+"/"===p)return key;
      }
    }
    return null;
  }

  function currentTool(path, categoryKey){
    var p=(path||"").replace(/\/+$/,"/");
    var category=CATEGORIES[categoryKey];
    if(!category)return null;
    for(var i=0;i<category.tools.length;i++){
      if("/developer-tools/"+category.tools[i][0]+"/"===p)return category.tools[i][0];
    }
    return null;
  }

  function removeLegacyStepper(){document.querySelectorAll(".algolassi-devtools-stepper").forEach(function(el){el.remove();});}
  function removeAutoStepper(){document.querySelectorAll(".algolassi-auto-stepper").forEach(function(el){el.remove();});}

  function buildShell(categoryKey){
    css();
    removeLegacyStepper();
    var category=CATEGORIES[categoryKey];
    if(!category||!category.tools.length)return null;

    var existing=document.getElementById("algolassi-devtools-common-shell");
    if(existing){
      existing.innerHTML="";
      existing.dataset.category=categoryKey;
      existing.style.display="block";
    }else{
      existing=document.createElement("nav");
      existing.id="algolassi-devtools-common-shell";
      existing.className="devtools-stepper";
      existing.setAttribute("aria-label","Developer Tools category");
      existing.dataset.category=categoryKey;
    }

    var inner=document.createElement("div");
    inner.className="devtools-stepper-inner";
    category.tools.forEach(function(t,i){
      if(i){
        var arrow=document.createElement("span");
        arrow.className="step-arrow";
        arrow.textContent="→";
        inner.appendChild(arrow);
      }
      var a=document.createElement("a");
      a.href="/developer-tools/"+t[0]+"/";
      a.dataset.tool=t[0];
      var n=document.createElement("span");
      n.className="step-node";
      n.textContent=String(i+1);
      a.appendChild(n);
      a.appendChild(document.createTextNode(t[1]));
      inner.appendChild(a);
    });
    existing.appendChild(inner);

    var main=document.querySelector(".site-main");
    var breadcrumbs=main&&main.querySelector(":scope > .breadcrumbs");
    if(main&&breadcrumbs){
      breadcrumbs.insertAdjacentElement("afterend",existing);
    }else if(main){
      main.insertBefore(existing,main.firstChild);
    }
    return existing;
  }

  function setActive(){
    var shell=document.getElementById("algolassi-devtools-common-shell");
    if(!shell)return;
    var categoryKey=shell.dataset.category;
    var path=currentTool(location.pathname,categoryKey);
    shell.querySelectorAll("a[data-tool]").forEach(function(a){
      var active=!!path&&a.getAttribute("href")==="/developer-tools/"+path+"/";
      a.classList.toggle("active",active);
    });
  }

  function showShell(){
    var path=location.pathname.replace(/\/+$/,"/");
    var categoryKey=currentCategory(path);
    var shell=null;
    if(categoryKey){
      shell=buildShell(categoryKey);
      if(shell)shell.style.display="block";
    }else{
      var old=document.getElementById("algolassi-devtools-common-shell");
      if(old)old.style.display="none";
    }
    setActive();
    removeLegacyStepper();
  }

  function executeScripts(container){Array.prototype.slice.call(container.querySelectorAll("script")).forEach(function(old){var script=document.createElement("script");Array.prototype.slice.call(old.attributes).forEach(function(a){script.setAttribute(a.name,a.value);});script.text=old.text||old.textContent||"";old.parentNode.replaceChild(script,script);});}
  function updateBreadcrumb(doc){var current=document.querySelector(".site-main > .breadcrumbs .breadcrumb-current"),next=doc.querySelector(".site-main > .breadcrumbs .breadcrumb-current");if(!current||!next)return;current.replaceWith(document.importNode(next,true));}
  function updateMeta(doc){if(doc.title)document.title=doc.title;var a=document.querySelector('meta[name="description"]'),b=doc.querySelector('meta[name="description"]');if(a&&b)a.setAttribute('content',b.getAttribute('content')||"");var c=document.querySelector('link[rel="canonical"]'),d=doc.querySelector('link[rel="canonical"]');if(c&&d)c.setAttribute('href',d.getAttribute('href')||"");}
  function ensureToolSlider(){var main=document.querySelector(".site-main");if(!main)return null;var slider=main.querySelector(":scope > .devtools-tool-slider");if(slider)return slider;var content=main.querySelector(":scope > .page-content");if(!content)return null;slider=document.createElement("div");slider.className="devtools-tool-slider";content.parentNode.insertBefore(slider,content);slider.appendChild(content);return slider;}
  function loadTool(url,push){if(navigating)return;navigating=true;var current=document.querySelector(".site-main"),slider=current&&current.querySelector(":scope > .devtools-tool-slider"),from=location.pathname,to=url.pathname,fromCategory=currentCategory(from),toCategory=currentCategory(to),category=toCategory||fromCategory,fromIndex=-1,toIndex=-1;if(fromCategory&&CATEGORIES[fromCategory])fromIndex=CATEGORIES[fromCategory].tools.findIndex(function(t){return "/developer-tools/"+t[0]+"/"===from;});if(toCategory&&CATEGORIES[toCategory])toIndex=CATEGORIES[toCategory].tools.findIndex(function(t){return "/developer-tools/"+t[0]+"/"===to;});var direction=toIndex>=Math.max(0,fromIndex)?"dt-next":"dt-prev";if(isDeveloperToolsPath(from))slider=slider||ensureToolSlider();fetch(url.href,{credentials:"same-origin"}).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.text();}).then(function(html){var doc=new DOMParser().parseFromString(html,"text/html"),next=doc.querySelector(".site-main > .page-content");if(!next)throw new Error("Developer tool content not found");var targetSlider=slider||ensureToolSlider();if(!targetSlider)throw new Error("Developer tool slider not found");removeLegacyStepper();removeAutoStepper();updateBreadcrumb(doc);targetSlider.innerHTML="";targetSlider.appendChild(document.importNode(next,true));removeLegacyStepper();targetSlider.classList.remove("dt-next","dt-prev");void targetSlider.offsetWidth;targetSlider.classList.add(direction);updateMeta(doc);if(push)history.pushState({algolassiDeveloperTool:true},"",url.href);showShell();setActive();window.scrollTo(0,0);executeScripts(targetSlider);window.dispatchEvent(new Event("algolassi:spa-navigation"));setTimeout(function(){targetSlider.classList.remove("dt-next","dt-prev");},550);}).catch(function(){location.href=url.href;}).finally(function(){navigating=false;});}

  function init(){
    css();
    removeLegacyStepper();
    showShell();
    removeAutoStepper();
    if(TOOL_RE.test(location.pathname))ensureToolSlider();
    var scope=document.querySelector(".article-content,.page-content");
    if(!scope)return;
    if(scope.querySelector(".maui-flow"))return;
    var hs=Array.prototype.slice.call(scope.querySelectorAll("h2,h3,h4")).filter(function(h){return /^Step\s+\d+\b/i.test((h.textContent||"").trim());});
    if(hs.length<3)return;
    var flow=document.createElement("nav");
    flow.className="algolassi-auto-stepper";
    flow.setAttribute("aria-label","Article implementation steps");
    var strong=document.createElement("strong");
    strong.textContent="Steps";
    flow.appendChild(strong);
    hs.forEach(function(h,i){if(!h.id)h.id="algolassi-step-"+(i+1);var b=document.createElement("button");b.type="button";b.setAttribute("data-target",h.id);var n=document.createElement("span");n.className="node";n.textContent=String(i+1);var l=document.createElement("span");l.className="label";l.textContent=(h.textContent||"").replace(/^Step\s+\d+\s*[:—-]?\s*/i,"").trim()||h.textContent;b.appendChild(n);b.appendChild(l);flow.appendChild(b);});
    document.body.appendChild(flow);
  }

  document.addEventListener("click",function(event){var target=event.target,link=target&&target.closest?target.closest("a"):null;if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;if(link.closest&&link.closest("#algolassi-devtools-common-shell")){var url=new URL(link.href,location.href);if(TOOL_RE.test(url.pathname)&&url.pathname!==location.pathname){event.preventDefault();event.stopImmediatePropagation();loadTool(url,true);return;}}},true);
  document.addEventListener("DOMContentLoaded",init);if(document.readyState!=="loading")init();
  window.addEventListener("resize",function(){showShell();},{passive:true});
  window.addEventListener("algolassi:spa-navigation",function(){setTimeout(function(){removeLegacyStepper();removeAutoStepper();showShell();if(TOOL_RE.test(location.pathname))ensureToolSlider();},0);});
  window.addEventListener("popstate",function(){setTimeout(function(){removeLegacyStepper();removeAutoStepper();showShell();if(TOOL_RE.test(location.pathname))ensureToolSlider();},0);});
})();