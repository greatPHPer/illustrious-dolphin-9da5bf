/* Algolassi Chat - independent hide/reopen control */
(function () {
  "use strict";
  var STORAGE_KEY = "algolassi-chat-hidden-v2";
  var BUTTON_ID = "algolassi-chat-reopen-button";
  var applying = false;

  function hidden() { try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch (e) { return false; } }
  function setHidden(v) { try { localStorage.setItem(STORAGE_KEY, v ? "1" : "0"); } catch (e) {} }
  function host() { return document.getElementById("algolassi-chat-presence-host"); }

  function addStyles() {
    if (document.getElementById("algolassi-chat-toggle-styles")) return;
    var s=document.createElement("style"); s.id="algolassi-chat-toggle-styles";
    s.textContent="#algolassi-chat-presence-host.algolassi-chat-toggle-hidden{display:none!important;}#"+BUTTON_ID+"{display:none!important;position:fixed;right:18px;bottom:18px;width:42px;height:42px;border:0;border-radius:50%;background:#fff;box-shadow:0 3px 12px rgba(0,0,0,.28);font-size:21px;line-height:42px;text-align:center;cursor:pointer;z-index:2147483647;padding:0}#"+BUTTON_ID+".is-visible{display:block!important}#"+BUTTON_ID+":hover{transform:scale(1.06)}#algolassi-chat-presence-host .algolassi-chat-toggle-hide{margin-left:auto;border:0;background:transparent;color:inherit;font-size:18px;line-height:1;cursor:pointer;padding:4px 7px}@media(max-width:600px){#"+BUTTON_ID+"{right:10px;width:40px;height:40px;line-height:40px;font-size:20px}}";
    document.head.appendChild(s);
  }

  function ensureButton() {
    var b=document.getElementById(BUTTON_ID);
    if(b) return b;
    b=document.createElement("button"); b.id=BUTTON_ID; b.type="button"; b.textContent="💬"; b.setAttribute("aria-label","Open Algolassi Chat"); b.title="Open Algolassi Chat";
    b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();setHidden(false);apply();var h=host();if(h)h.classList.remove("algolassi-chat-toggle-hidden","algolassi-chat-is-hidden");});
    document.body.appendChild(b); return b;
  }

  function positionButton(){var b=document.getElementById(BUTTON_ID);if(!b)return;var bottom=window.innerWidth<=600?10:18;var radio=document.getElementById("algolassi-radio-host");if(radio){var r=radio.getBoundingClientRect();if(r.height>0&&r.top<window.innerHeight)bottom=Math.max(bottom,window.innerHeight-r.top+10);}b.style.bottom=bottom+"px";}

  function ensureHideButton(h){
    if(!h)return;
    var card=h.querySelector(".algolassi-chat-presence-card"); if(!card)return;
    var head=card.querySelector(".algolassi-chat-presence-head"); if(!head)return;
    var hide=head.querySelector(".algolassi-chat-toggle-hide");
    if(hide)return;
    hide=document.createElement("button");hide.type="button";hide.className="algolassi-chat-toggle-hide";hide.setAttribute("aria-label","Hide chat");hide.title="Hide chat";hide.textContent="×";
    hide.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();setHidden(true);apply();});head.appendChild(hide);
  }

  function apply(){
    if(applying)return; applying=true;
    try {
      addStyles();
      var b=ensureButton(), h=host(), isHidden=hidden();
      if(h){ensureHideButton(h);h.classList.toggle("algolassi-chat-toggle-hidden",isHidden);if(!isHidden)h.classList.remove("algolassi-chat-is-hidden");}
      b.classList.toggle("is-visible",isHidden);
      positionButton();
    } finally { applying=false; }
  }

  function init(){
    addStyles(); ensureButton();
    try { if(localStorage.getItem(STORAGE_KEY)===null)localStorage.setItem(STORAGE_KEY,"0"); } catch(e){}
    apply();
    window.addEventListener("resize",positionButton,{passive:true});
    window.addEventListener("scroll",positionButton,{passive:true});
    new MutationObserver(function(){apply();}).observe(document.body,{childList:true,subtree:true});
    window.addEventListener("algolassi:spa-navigation",function(){setTimeout(apply,50);setTimeout(apply,500);});
    setInterval(apply,1000);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
