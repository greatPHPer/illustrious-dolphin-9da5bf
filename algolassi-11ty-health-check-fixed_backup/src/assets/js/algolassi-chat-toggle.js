/* Algolassi Chat - independent hide/reopen control */
(function () {
  "use strict";
  var STORAGE_KEY = "algolassi-chat-hidden-v2";
  var BUTTON_ID = "algolassi-chat-reopen-button";
  var GAP = 14;
  var ICON_SIZE = 42;
  var applying = false;

  function hidden(){try{return localStorage.getItem(STORAGE_KEY)==="1";}catch(e){return false;}}
  function setHidden(v){try{localStorage.setItem(STORAGE_KEY,v?"1":"0");}catch(e){}}
  function host(){return document.getElementById("algolassi-chat-presence-host");}

  function addStyles(){
    if(document.getElementById("algolassi-chat-toggle-styles"))return;
    var s=document.createElement("style");s.id="algolassi-chat-toggle-styles";
    s.textContent="#algolassi-chat-presence-host.algolassi-chat-toggle-hidden{display:none!important;}#"+BUTTON_ID+"{display:none!important;position:fixed;right:18px;bottom:18px;width:"+ICON_SIZE+"px;height:"+ICON_SIZE+"px;border:0;border-radius:50%;background:#fff;box-shadow:0 3px 12px rgba(0,0,0,.28);font-size:21px;line-height:"+ICON_SIZE+"px;text-align:center;cursor:pointer;z-index:2147483647;padding:0}#"+BUTTON_ID+".is-visible{display:flex!important;align-items:center;justify-content:center}#"+BUTTON_ID+":hover{transform:scale(1.06)}#algolassi-chat-presence-host .algolassi-chat-toggle-hide{margin-left:auto;border:0;background:transparent;color:inherit;font-size:18px;line-height:1;cursor:pointer;padding:4px 7px}@media(max-width:600px){#"+BUTTON_ID+"{right:10px;width:40px;height:40px;line-height:40px;font-size:20px}}";
    document.head.appendChild(s);
  }

  function ensureButton(){
    var b=document.getElementById(BUTTON_ID);if(b)return b;
    b=document.createElement("button");b.id=BUTTON_ID;b.type="button";b.textContent="💬";b.setAttribute("aria-label","Open Algolassi Chat");b.title="Open Algolassi Chat";
    b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();setHidden(false);apply();var h=host();if(h)h.classList.remove("algolassi-chat-toggle-hidden","algolassi-chat-is-hidden");});
    document.body.appendChild(b);return b;
  }

  function visibleRect(el){if(!el)return null;var r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<window.innerHeight?r:null;}

  function positionButton(){
    var b=document.getElementById(BUTTON_ID);if(!b)return;
    var base=window.innerWidth<=600?10:18;
    var radio=document.getElementById("algolassi-radio-host");
    var target=null;
    if(radio){
      target=visibleRect(radio.querySelector(".algolassi-radio-toast"));
      if(!target)target=visibleRect(radio.querySelector("button"));
      if(!target)target=visibleRect(radio);
    }

    if(target){
      /* Radio is open/visible: put chat above the actual radio control. */
      var bottom=window.innerHeight-target.top+GAP;
      b.style.bottom=Math.max(bottom,base+ICON_SIZE+GAP)+"px";
    } else if(radio && hiddenRadioReopenLikely(radio)) {
      /* Radio itself is hidden but its small reopen control remains at the
         bottom-right. Reserve one icon-height so the two launchers stack. */
      b.style.bottom=(base+ICON_SIZE+GAP)+"px";
    } else {
      b.style.bottom=base+"px";
    }
    b.style.right=window.innerWidth<=600?"10px":"18px";
  }

  function hiddenRadioReopenLikely(radio){
    /* The radio implementation can hide its toast while leaving a launcher
       in the same fixed corner. Treat the radio host as reserving that corner
       whenever it exists but has no visible toast/control. This prevents the
       chat launcher from occupying the radio launcher's coordinates. */
    if(!radio)return false;
    var toast=radio.querySelector(".algolassi-radio-toast");
    if(toast && !visibleRect(toast))return true;
    var buttons=radio.querySelectorAll("button");
    if(buttons.length){for(var i=0;i<buttons.length;i++){if(!visibleRect(buttons[i]))continue;return false;}}
    return true;
  }

  function ensureHideButton(h){
    if(!h)return;var card=h.querySelector(".algolassi-chat-presence-card");if(!card)return;var head=card.querySelector(".algolassi-chat-presence-head");if(!head)return;
    var hide=head.querySelector(".algolassi-chat-toggle-hide");if(hide)return;
    hide=document.createElement("button");hide.type="button";hide.className="algolassi-chat-toggle-hide";hide.setAttribute("aria-label","Hide chat");hide.title="Hide chat";hide.textContent="×";
    hide.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();setHidden(true);apply();});head.appendChild(hide);
  }

  function apply(){
    if(applying)return;applying=true;
    try{addStyles();var b=ensureButton(),h=host(),isHidden=hidden();if(h){ensureHideButton(h);h.classList.toggle("algolassi-chat-toggle-hidden",isHidden);if(!isHidden)h.classList.remove("algolassi-chat-is-hidden");}b.classList.toggle("is-visible",isHidden);positionButton();}finally{applying=false;}
  }

  function init(){
    addStyles();ensureButton();
    try{if(localStorage.getItem(STORAGE_KEY)===null)localStorage.setItem(STORAGE_KEY,"0");}catch(e){}
    apply();window.addEventListener("resize",positionButton,{passive:true});window.addEventListener("scroll",positionButton,{passive:true});
    new MutationObserver(function(){apply();}).observe(document.body,{childList:true,subtree:true});
    window.addEventListener("algolassi:spa-navigation",function(){setTimeout(apply,50);setTimeout(apply,500);});
    setInterval(apply,1000);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
