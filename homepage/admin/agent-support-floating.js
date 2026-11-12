/* 5G88 Agent Support Floating - all admin pages, animation enabled */
(() => {
  'use strict';
  if (window.self !== window.top) return;
  const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  if(page==='login.html')return;
  if(window.__agentSupportFloatingInit)return;
  window.__agentSupportFloatingInit=true;

  const CONFIG_PATH='adminConfig/agentSupportFloating';
  const defaults={enabled:false,accessMode:'all',allowedUids:{},url:'',label:'Agent Support',side:'right',width:400,height:600,openMode:'panel',showLabel:false,animationMode:'off',animationSpeed:35,animationRange:400};
  let config={...defaults},profile=null,uid=null,root=null,button=null,panel=null,unsubscribe=null;
  let raf=0,animationBase=0,animationStart=0,paused=false,dragging=false;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const safeUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:'';}catch{return '';}};
  const positionKey=()=>`5g88.agentSupportFloat.position.v1:${uid}`;
  const savedY=()=>{try{const v=JSON.parse(localStorage.getItem(positionKey()));return Number.isFinite(v?.y)?v.y:null;}catch{return null;}};
  const saveY=y=>{if(uid)localStorage.setItem(positionKey(),JSON.stringify({y}));};
  const limits=()=>({min:Math.min(100,Math.max(0,innerHeight-(root?.offsetHeight||48))),max:Math.max(0,innerHeight-(root?.offsetHeight||48))});
  function position(y){if(!root)return;const {min,max}=limits();root.style.top=`${clamp(y,min,max)}px`;}
  function stopAnimation(){if(raf)cancelAnimationFrame(raf);raf=0;}
  function animationEnabled(){return config.animationMode==='float'&&!matchMedia('(prefers-reduced-motion: reduce)').matches;}
  function animate(now){
    if(!root||!animationEnabled()||paused||dragging||panel){raf=0;return;}
    const {min,max}=limits();
    const range = Math.min(
  clamp(+config.animationRange || 400, 10, 700),
  Math.max(0, max - min)
);
    const speed=clamp(+config.animationSpeed||35,5,150);
    const period=Math.max(1000,2*Math.PI*(range/2)/speed*1000);
    const offset=range/2*Math.sin((now-animationStart)*2*Math.PI/period);
    const center = clamp(
  animationBase,
  min + range / 2,
  max - range / 2
);

position(center + offset);
    raf=requestAnimationFrame(animate);
  }
  function startAnimation(){stopAnimation();if(!root||!animationEnabled()||paused||dragging||panel)return;animationStart=performance.now();raf=requestAnimationFrame(animate);}
  function closePanel(){if(panel){panel.remove();panel=null;}if(button){button.hidden=false;button.setAttribute('aria-expanded','false');}startAnimation();}
  function openPanel(){
    if(panel){closePanel();return;}
    const url=safeUrl(config.url);if(!url)return;
    if(config.openMode==='tab'){window.open(url,'_blank','noopener,noreferrer');return;}
    stopAnimation();
    panel=document.createElement('section');panel.className='asf-panel';panel.setAttribute('aria-label',config.label||'Agent Support');
    panel.style.width=`min(${clamp(+config.width||400,280,900)}px, calc(100vw - 20px))`;
    panel.style.height=`min(${clamp(+config.height||600,280,1000)}px, calc(100dvh - 30px))`;
    panel.innerHTML='<div class="asf-head"><strong></strong><div><button type="button" class="asf-external" title="Open in new tab">↗</button><button type="button" class="asf-close" title="Close">×</button></div></div><iframe title="Agent Support LiveChat" referrerpolicy="strict-origin-when-cross-origin" allow="clipboard-read; clipboard-write"></iframe>';
    panel.querySelector('strong').textContent=config.label||'Agent Support';
    panel.querySelector('iframe').src=url;
    panel.querySelector('.asf-close').onclick=closePanel;
    panel.querySelector('.asf-external').onclick=()=>window.open(url,'_blank','noopener,noreferrer');
    if(config.side==='left'){panel.style.left='10px';panel.style.right='auto';}
    document.body.appendChild(panel);
    if(button){button.setAttribute('aria-expanded','true');button.hidden=true;}
  }
  function canAccess(){
    if(!profile||!config.enabled||profile.active!==true||profile.secondPasswordEnabled!==true||sessionStorage.getItem('5g88.adminSession')!==uid)return false;
    const role=profile.role;
    if(role!=='superadmin'&&role!=='siteadmin')return false;
    switch(config.accessMode||'all'){
      case 'all':return true;
      case 'site_all':return role==='siteadmin';
      case 'site_selected':return role==='siteadmin'&&config.allowedUids?.[uid]===true;
      case 'super_only':return role==='superadmin';
      default:return false;
    }
  }
  function render(){
    stopAnimation();closePanel();stopAnimation();root?.remove();root=null;button=null;
    if(!uid||!canAccess()||!safeUrl(config.url))return;
    root=document.createElement('div');root.className='asf-root';
    root.classList.add(config.side==='left'?'asf-left':'asf-right');
    button=document.createElement('button');button.className='asf-button';button.type='button';
    button.setAttribute('aria-label',config.label||'Agent Support');button.setAttribute('aria-expanded','false');
    button.innerHTML='<svg class="asf-icon" width="20" height="20" viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true"><path d="M924.3 338.4a447.57 447.57 0 00-96.1-143.3 443.09 443.09 0 00-143-96.3A443.91 443.91 0 00512 64h-2c-60.5.3-119 12.3-174.1 35.9a444.08 444.08 0 00-141.7 96.5 445 445 0 00-95 142.8A449.89 449.89 0 0065 514.1c.3 69.4 16.9 138.3 47.9 199.9v152c0 25.4 20.6 46 45.9 46h151.8a447.72 447.72 0 00199.5 48h2.1c59.8 0 117.7-11.6 172.3-34.3A443.2 443.2 0 00827 830.5c41.2-40.9 73.6-88.7 96.3-142 23.5-55.2 35.5-113.9 35.8-174.5.2-60.9-11.6-120-34.8-175.6zM312.4 560c-26.4 0-47.9-21.5-47.9-48s21.5-48 47.9-48 47.9 21.5 47.9 48-21.4 48-47.9 48zm199.6 0c-26.4 0-47.9-21.5-47.9-48s21.5-48 47.9-48 47.9 21.5 47.9 48-21.5 48-47.9 48zm199.6 0c-26.4 0-47.9-21.5-47.9-48s21.5-48 47.9-48 47.9 21.5 47.9 48-21.5 48-47.9 48z"/></svg><span class="asf-label"></span>';
button.querySelector('.asf-label').textContent =
  config.label || 'Agent Support';
    root.appendChild(button);document.body.appendChild(root);
    animationBase=savedY()??Math.round(innerHeight*.58);position(animationBase);
    button.addEventListener('pointerenter',()=>{paused=true;stopAnimation();});
    button.addEventListener('pointerleave',()=>{if(!dragging){animationBase=root.getBoundingClientRect().top;paused=false;startAnimation();}});
    let drag=null,suppressClick=false;
    button.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;
      drag={startY:e.clientY,top:root.getBoundingClientRect().top,moved:false};dragging=true;stopAnimation();
      button.dataset.dragging='true';
      button.setPointerCapture(e.pointerId);
    });
    button.addEventListener('pointermove',e=>{
      if(!drag)return;
      if(Math.abs(e.clientY-drag.startY)>5)drag.moved=true;
      if(drag.moved){position(drag.top+e.clientY-drag.startY);e.preventDefault();}
    });
    button.addEventListener('pointerup',()=>{
      if(!drag)return;
      if(drag.moved){animationBase=root.getBoundingClientRect().top;saveY(animationBase);suppressClick=true;}
      drag=null;dragging=false;
      if(!button.matches(':hover')){paused=false;startAnimation();}
    });
    button.addEventListener('pointercancel',()=>{delete button.dataset.dragging;drag=null;dragging=false;paused=false;startAnimation();});
    button.addEventListener('click',e=>{if(suppressClick){e.preventDefault();suppressClick=false;return;}openPanel();});
    startAnimation();
  }
  const style=document.createElement('style');style.textContent=`
    .asf-root{position:fixed;z-index:21000;touch-action:none;user-select:none;right:0;left:auto;width:44px;height:56px;overflow:visible}
    .asf-root.asf-left{left:0;right:auto}
    .asf-button{position:absolute;top:0;right:0;display:inline-flex;align-items:center;justify-content:flex-start;gap:8px;box-sizing:border-box;width:44px;height:56px;padding:0;overflow:hidden;white-space:nowrap;background:#1f1f1f;color:#1668dc;border:1px solid #303030;border-right:0;border-radius:16px 0 0 16px;box-shadow:-3px 4px 18px rgba(15,23,42,.12);cursor:grab;font:600 13px system-ui,sans-serif;transform:none;transition:width 200ms ease,box-shadow 200ms ease,border-color 200ms ease}
    .asf-left .asf-button{left:0;right:auto;border:1px solid #303030;border-left:0;border-radius:0 16px 16px 0}
    .asf-icon {
    width: 20px;
    height: 20px;
    flex: 0 0 43px;
    color: #1668dc;
    display: grid;
    place-items: center;
    pointer-events: none;
    font-size: 20px;
}
    .asf-label{display:inline-block;max-width:0;overflow:hidden;opacity:0;white-space:nowrap;color:#fff;font-size:13px;font-weight:600;transition:max-width 200ms ease,opacity 150ms ease}
    @media(hover:hover) and (pointer:fine){
      .asf-button:not(:disabled):not([data-dragging="true"]):hover{width:136px;border-color:#15325b;box-shadow:-4px 6px 24px rgba(15,23,42,.16)}
      .asf-button:not(:disabled):not([data-dragging="true"]):hover .asf-label{max-width:100px;opacity:1}
    }
    .asf-button:focus-visible{outline:2px solid #1668dc;outline-offset:2px}
    .asf-button:active{cursor:grabbing}
    .asf-button[hidden]{display:none!important}
    .asf-panel{position:fixed;z-index:21001;right:10px;bottom:10px;display:flex;flex-direction:column;background:#fff;border:1px solid #91caff;border-radius:12px;overflow:hidden;box-shadow:0 14px 45px #0007}
    .asf-head{height:44px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:0 12px;background:#001529;color:#fff;font:600 13px system-ui,sans-serif}
    .asf-head button{background:transparent;color:#fff;border:0;cursor:pointer;font-size:22px;padding:3px 8px}
    .asf-panel iframe{flex:1;width:100%;border:0;background:#fff}
    @media(max-width:600px){.asf-panel{right:10px;left:10px;bottom:10px;width:auto!important}}
    @media(prefers-reduced-motion:reduce){.asf-button,.asf-label{transition:none}}
  `;document.head.appendChild(style);
  window.addEventListener('resize',()=>{if(root){animationBase=clamp(animationBase,limits().min,limits().max);position(animationBase);startAnimation();}});
  function start(){
    if(!window.firebase?.auth||!window.firebase?.database)return;
    firebase.auth().onAuthStateChanged(user=>{
      if(unsubscribe){unsubscribe();unsubscribe=null;}
      uid=user?.uid||null;profile=null;config={...defaults};render();
      if(!uid)return;
      const authUid=uid;
      const profileRef=firebase.database().ref(`adminUsers/${authUid}`);
      const profileHandler=snap=>{if(uid!==authUid)return;profile=snap.val()||null;render();};
      profileRef.on('value',profileHandler,err=>{console.error('Agent Support profile read:',err);profile=null;render();});
      const configRef=firebase.database().ref(CONFIG_PATH);
      const configHandler=snap=>{if(uid!==authUid)return;config={...defaults,...(snap.val()||{})};render();};
      configRef.on('value',configHandler,err=>console.error('Agent Support config read:',err));
      unsubscribe=()=>{profileRef.off('value',profileHandler);configRef.off('value',configHandler);};
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
