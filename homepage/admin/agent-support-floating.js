/* 5G88 Agent Support Floating - all admin pages */
(() => {
  'use strict';

  // Jangan buat floating kedua di dalam iframe dashboard.
  if (window.self !== window.top) return;

  // Jangan paparkan floating pada halaman login.
  const currentPage =
    (location.pathname.split('/').pop() || 'index.html')
      .toLowerCase();

  if (currentPage === 'login.html') return;

  // Elakkan initialization berganda.
  if (window.__agentSupportFloatingInit) return;
  window.__agentSupportFloatingInit = true;
  const CONFIG_PATH = 'adminConfig/agentSupportFloating';
  const defaults = {enabled:false,accessMode:'all',allowedUids:{},url:'',label:'Agent Support',side:'right',width:400,height:600,openMode:'panel',showLabel:false};
  let config = {...defaults}, profile = null, uid = null, root = null, panel = null, button = null, unsubscribe = null;
  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const safeUrl = value => { try {const u=new URL(value);return u.protocol==='https:' ? u.href : '';} catch {return '';} };
  const positionKey = () => `5g88.agentSupportFloat.position.v1:${uid}`;
  function savedY(){try {const n=JSON.parse(localStorage.getItem(positionKey()));return Number.isFinite(n.y)?n.y:null;}catch{return null;}}
  function saveY(y){if(uid)localStorage.setItem(positionKey(),JSON.stringify({y}));}
  function position(y){if(!root)return;root.style.top=`${clamp(y,145,Math.max(145,innerHeight-root.offsetHeight-8))}px`;}
  function closePanel(){if(panel){panel.remove();panel=null;}button?.setAttribute('aria-expanded','false');}
  function openPanel(){
    if(panel){closePanel();return;}
    const url=safeUrl(config.url);if(!url)return;
    if(config.openMode==='tab'){window.open(url,'_blank','noopener,noreferrer');return;}
    panel=document.createElement('section');panel.className='asf-panel';panel.setAttribute('aria-label',config.label);
    panel.style.width=`min(${clamp(+config.width||400,280,900)}px, calc(100vw - 20px))`;
    panel.style.height=`min(${clamp(+config.height||600,280,1000)}px, calc(100dvh - 30px))`;
    panel.innerHTML='<div class="asf-head"><strong></strong><div><button type="button" class="asf-external" title="Open in new tab">↗</button><button type="button" class="asf-close" title="Close">×</button></div></div><iframe title="Agent Support LiveChat" referrerpolicy="strict-origin-when-cross-origin" allow="clipboard-read; clipboard-write"></iframe>';
    panel.querySelector('strong').textContent=config.label||'Agent Support';
    panel.querySelector('iframe').src=url;
    panel.querySelector('.asf-close').onclick=closePanel;
    panel.querySelector('.asf-external').onclick=()=>window.open(url,'_blank','noopener,noreferrer');
    document.body.appendChild(panel);
    button?.setAttribute('aria-expanded','true');
  }
  function canAccess(){
    if(!profile || !config.enabled || profile.active!==true || profile.secondPasswordEnabled!==true || sessionStorage.getItem('5g88.adminSession')!==uid)return false;
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
    closePanel();root?.remove();root=null;button=null;
    if(!uid||!canAccess()||!safeUrl(config.url))return;
    root=document.createElement('div');root.className='asf-root';root.style[config.side==='left'?'left':'right']='14px';
    button=document.createElement('button');button.className='asf-button';button.type='button';button.setAttribute('aria-label',config.label||'Agent Support');button.setAttribute('aria-expanded','false');
    button.innerHTML='<span class="asf-icon" aria-hidden="true">☏</span><span class="asf-label"></span>';
    button.querySelector('.asf-label').textContent=config.label||'Agent Support';
    if(!config.showLabel)button.querySelector('.asf-label').hidden=true;
    root.appendChild(button);document.body.appendChild(root);
    position(savedY()??Math.round(innerHeight*.58));
    let drag=null, moved=false;
    button.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;
      drag={startY:e.clientY,top:root.getBoundingClientRect().top};moved=false;
      button.setPointerCapture(e.pointerId);
    });
    button.addEventListener('pointermove',e=>{
      if(!drag)return;
      if(Math.abs(e.clientY-drag.startY)>5)moved=true;
      if(moved){position(drag.top+e.clientY-drag.startY);e.preventDefault();}
    });
    button.addEventListener('pointerup',()=>{if(drag&&moved)saveY(root.getBoundingClientRect().top);drag=null;});
    button.addEventListener('pointercancel',()=>{drag=null;});
    button.addEventListener('click',e=>{if(moved){e.preventDefault();moved=false;return;}openPanel();});
  }
  const style=document.createElement('style');style.textContent=`
    .asf-root{position:fixed;z-index:21000;touch-action:none;user-select:none}
    .asf-button{display:flex;align-items:center;gap:8px;min-height:48px;min-width:48px;justify-content:center;padding:10px 13px;border:1px solid #69b1ff;border-radius:999px;background:#1668dc;color:#fff;box-shadow:0 8px 24px #0005;cursor:grab;font:600 13px system-ui,sans-serif}
    .asf-button:active{cursor:grabbing}.asf-icon{font-size:22px;line-height:1}.asf-label[hidden]{display:none}
    .asf-panel{position:fixed;z-index:21001;right:70px;bottom:14px;display:flex;flex-direction:column;background:#fff;border:1px solid #91caff;border-radius:12px;overflow:hidden;box-shadow:0 14px 45px #0007}
    .asf-head{height:44px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:0 12px;background:#001529;color:#fff;font:600 13px system-ui,sans-serif}
    .asf-head button{background:transparent;color:#fff;border:0;cursor:pointer;font-size:22px;padding:3px 8px}
    .asf-panel iframe{flex:1;width:100%;border:0;background:#fff}
    @media(max-width:600px){.asf-panel{right:10px;left:10px;bottom:10px;width:auto!important}}
  `;document.head.appendChild(style);
  window.addEventListener('resize',()=>{if(root)position(root.getBoundingClientRect().top);});
  function start(){
    if(!window.firebase?.auth||!window.firebase?.database)return;
    firebase.auth().onAuthStateChanged(user=>{
      if(unsubscribe){unsubscribe();unsubscribe=null;}
      uid=user?.uid||null;profile=null;config={...defaults};render();
      if(!uid)return;
      const authUid=uid;
      firebase.database().ref(`adminUsers/${authUid}`).on('value', profileHandler, profileError);
      function profileHandler(snap){if(uid!==authUid)return;profile=snap.val()||null;render();}
      function profileError(err){console.error('Agent Support profile read:',err);profile=null;render();}
      const previousUnsubscribe=unsubscribe;
      unsubscribe=()=>{firebase.database().ref(`adminUsers/${authUid}`).off('value',profileHandler);previousUnsubscribe?.();};
      const ref=firebase.database().ref(CONFIG_PATH);
      const handler=snap=>{config={...defaults,...(snap.val()||{})};render();};
      ref.on('value',handler,err=>console.error('Agent Support config read:',err));
      const offProfile=unsubscribe;unsubscribe=()=>{ref.off('value',handler);offProfile?.();};
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
