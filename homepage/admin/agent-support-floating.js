/* 5G88 Dual Floating LiveChat - separate Agent Support and Site Admin */
(() => {
'use strict';
if(window.self!==window.top)return;
if((location.pathname.split('/').pop()||'index.html').toLowerCase()==='login.html')return;
if(window.__agentSupportFloatingInit)return;
window.__agentSupportFloatingInit=true;
const AGENT_PATH='adminConfig/agentSupportFloating';
const SITE_PATH='adminConfig/siteAdminFloating';
const defaults={enabled:false,accessMode:'super_only',allowedUids:{},url:'',label:'Agent Support',side:'right',width:400,height:600,openMode:'panel',showLabel:false,animationMode:'off',animationSpeed:35,animationRange:400};
const siteDefaults={...defaults,accessMode:'site_all',label:'LiveChat'};
const configs={agent:{...defaults},site:{...siteDefaults}};
const instances={agent:null,site:null};
let uid = null;
let profile = null;
let unsubscribe = null;

const unreadCleanup = {
  agent: null,
  site: null
};

const unreadCounts = {
  agent: 0,
  site: 0
};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const safeUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:'';}catch{return '';}};
const positionKey=type=>`5g88.floating.position.v2:${type}:${uid}`;
function savedY(type){try{let value=localStorage.getItem(positionKey(type));if(!value&&type==='agent'){value=localStorage.getItem(`5g88.agentSupportFloat.position.v1:${uid}`);}const parsed=JSON.parse(value);return Number.isFinite(parsed?.y)?parsed.y:null;}catch{return null;}}
function saveY(type,y){if(uid)localStorage.setItem(positionKey(type),JSON.stringify({y}));}
function eligible(){return !!uid&&!!profile&&profile.active===true&&profile.secondPasswordEnabled===true&&sessionStorage.getItem('5g88.adminSession')===uid;}

function canAccess(type) {
  if (!eligible()) return false;

  const d = configs[type];

  if (!d.enabled || !safeUrl(d.url)) {
    return false;
  }

  const role = profile.role;

  // Floating Agent Support
  if (type === 'agent') {
    return role === 'superadmin';
  }

  // Floating LiveChat Site Admin
  if (type === 'site') {

    // Super Admin boleh melihat kedua-dua floating
    if (role === 'superadmin') {
      return true;
    }

    // Akaun selain Site Admin tidak dibenarkan
    if (role !== 'siteadmin') {
      return false;
    }

    // Semua Site Admin
    if (d.accessMode === 'site_all') {
      return true;
    }

    // Site Admin yang dipilih sahaja
    if (d.accessMode === 'site_selected') {
      return d.allowedUids?.[uid] === true;
    }

    return false;
  }

  return false;
}
function limits(inst){return {min:0,max:Math.max(0,innerHeight-(inst.root?.offsetHeight||56))};}
function position(inst,y){if(!inst.root)return;const {min,max}=limits(inst);inst.root.style.top=`${clamp(y,min,max)}px`;}
function stopAnimation(inst){if(inst.raf)cancelAnimationFrame(inst.raf);inst.raf=0;}

function animationEnabled(inst) {
  return inst.config.animationMode === 'float' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function animate(inst, now) {
  if (
    !inst.root ||
    !animationEnabled(inst) ||
    inst.paused ||
    inst.dragging ||
    inst.panel
  ) {
    inst.raf = 0;
    return;
  }

  const { min, max } = limits(inst);
  const available = max - min;

  if (available <= 0) {
    inst.raf = 0;
    return;
  }

  const range = Math.min(
    clamp(Number(inst.config.animationRange) || 400, 10, 700),
    available
  );

  const speed = clamp(
    Number(inst.config.animationSpeed) || 35,
    5,
    150
  );

  const amplitude = range / 2;

  const center = clamp(
    inst.animationBase,
    min + amplitude,
    max - amplitude
  );

  const elapsed = (now - inst.animationStart) / 1000;

  const offset = amplitude * Math.sin(
    elapsed * speed / Math.max(amplitude, 1)
  );

  position(inst, center + offset);

  inst.raf = requestAnimationFrame(time => animate(inst, time));
}

function startAnimation(inst) {
  stopAnimation(inst);

  if (
    !inst.root ||
    !animationEnabled(inst) ||
    inst.paused ||
    inst.dragging ||
    inst.panel
  ) return;

  inst.animationStart = performance.now();

  inst.raf = requestAnimationFrame(time => animate(inst, time));
}


function updateBadge(type) {
  const inst = instances[type];
  if (!inst) return;

  const badge = inst.root?.querySelector('.asf-badge');
  if (!badge) return;

  const count = Math.max(0, unreadCounts[type] || 0);

  badge.textContent = count > 99 ? '99+' : String(count);

  badge.hidden = count === 0 || !!inst.panel;
}
function closePanel(inst){if(!inst)return;inst.panel?.remove();inst.panel=null;if(inst.button){inst.button.hidden=false;inst.button.setAttribute('aria-expanded','false');}updateBadge(inst.type);startAnimation(inst);}
function openPanel(inst){if(inst.panel){closePanel(inst);return;}const d=inst.config,url=safeUrl(d.url);if(!url)return;if(d.openMode==='tab'){window.open(url,'_blank','noopener,noreferrer');return;}stopAnimation(inst);const panel=document.createElement('section');inst.panel=panel;panel.className='asf-panel';panel.setAttribute('aria-label',d.label);panel.style.width=`min(${clamp(+d.width||400,280,900)}px, calc(100vw - 20px))`;panel.style.height=`min(${clamp(+d.height||600,280,1000)}px, calc(100dvh - 30px))`;panel.innerHTML='<div class="asf-head"><strong></strong><div><button type="button" class="asf-external" title="Open admin tab">↗</button><button type="button" class="asf-close" title="Close">×</button></div></div><iframe title="LiveChat" referrerpolicy="strict-origin-when-cross-origin" allow="clipboard-read; clipboard-write"></iframe>';panel.querySelector('strong').textContent=d.label;
const iframe = panel.querySelector('iframe');

const targetUrl = new URL(url);


if (inst.type === 'agent' || inst.type === 'site') {
  targetUrl.searchParams.set('floating', '1');
}


iframe.src = targetUrl.href;
panel.querySelector('.asf-close').onclick=()=>closePanel(inst);panel.querySelector('.asf-external').onclick=()=>{window.dispatchEvent(new CustomEvent('5g88:open-admin-tab',{detail:{file:inst.type==='site'?'livechat.html':'livechat-support.html',name:d.label}}));closePanel(inst);};if(d.side==='left'){panel.style.left='12px';panel.style.right='auto';}else{panel.style.right='12px';panel.style.left='auto';}document.body.appendChild(panel);inst.button.hidden=true;inst.button.setAttribute('aria-expanded','true');updateBadge(inst.type);}
const svg='<svg class="asf-icon" width="20" height="20" viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true"><path d="M924.3 338.4a447.57 447.57 0 00-96.1-143.3 443.09 443.09 0 00-143-96.3A443.91 443.91 0 00512 64h-2c-60.5.3-119 12.3-174.1 35.9a444.08 444.08 0 00-141.7 96.5 445 445 0 00-95 142.8A449.89 449.89 0 0065 514.1c.3 69.4 16.9 138.3 47.9 199.9v152c0 25.4 20.6 46 45.9 46h151.8a447.72 447.72 0 00199.5 48h2.1c59.8 0 117.7-11.6 172.3-34.3A443.2 443.2 0 00827 830.5c41.2-40.9 73.6-88.7 96.3-142 23.5-55.2 35.5-113.9 35.8-174.5.2-60.9-11.6-120-34.8-175.6zM312.4 560c-26.4 0-47.9-21.5-47.9-48s21.5-48 47.9-48 47.9 21.5 47.9 48-21.4 48-47.9 48zm199.6 0c-26.4 0-47.9-21.5-47.9-48s21.5-48 47.9-48 47.9 21.5 47.9 48-21.5 48-47.9 48zm199.6 0c-26.4 0-47.9-21.5-47.9-48s21.5-48 47.9-48 47.9 21.5 47.9 48-21.5 48-47.9 48z"/></svg>';
function destroy(type){const inst=instances[type];if(!inst)return;stopAnimation(inst);inst.panel?.remove();inst.root?.remove();instances[type]=null;}
function render(type){destroy(type);if(!canAccess(type))return;const d=configs[type];const inst={type,config:d,root:null,button:null,panel:null,raf:0,animationBase:0,animationStart:0,paused:false,dragging:false};instances[type]=inst;const root=document.createElement('div');inst.root=root;root.className='asf-root '+(d.side==='left'?'asf-left':'asf-right');root.dataset.floating=type;const button=document.createElement('button');inst.button=button;button.type='button';button.className='asf-button';button.setAttribute('aria-label',d.label||'LiveChat');button.setAttribute('aria-expanded','false');button.innerHTML=svg+'<span class="asf-label"></span>';button.querySelector('.asf-label').textContent=d.label||'LiveChat';const badge=document.createElement('span');badge.className='asf-badge';badge.hidden=true;badge.setAttribute('aria-label','Unread messages');root.append(button,badge);document.body.appendChild(root);const defaultY = type === 'agent'
  ? Math.round(window.innerHeight * 0.30)
  : Math.round(window.innerHeight * 0.70);
inst.animationBase = savedY(type) ?? defaultY;
position(inst,inst.animationBase);updateBadge(type);button.addEventListener('pointerenter',()=>{inst.paused=true;stopAnimation(inst);});button.addEventListener('pointerleave',()=>{if(!inst.dragging){inst.animationBase=root.getBoundingClientRect().top;inst.paused=false;startAnimation(inst);}});let drag=null,suppressClick=false;button.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={startY:e.clientY,top:root.getBoundingClientRect().top,moved:false};inst.dragging=true;stopAnimation(inst);button.dataset.dragging='true';button.setPointerCapture(e.pointerId);});button.addEventListener('pointermove',e=>{if(!drag)return;if(Math.abs(e.clientY-drag.startY)>5)drag.moved=true;if(drag.moved){position(inst,drag.top+e.clientY-drag.startY);e.preventDefault();}});button.addEventListener('pointerup',()=>{if(!drag)return;if(drag.moved){inst.animationBase=root.getBoundingClientRect().top;saveY(type,inst.animationBase);suppressClick=true;}delete button.dataset.dragging;drag=null;inst.dragging=false;if(!button.matches(':hover')){inst.paused=false;startAnimation(inst);}});button.addEventListener('pointercancel',()=>{delete button.dataset.dragging;drag=null;inst.dragging=false;inst.paused=false;startAnimation(inst);});button.addEventListener('click',e=>{if(suppressClick){e.preventDefault();suppressClick=false;return;}openPanel(inst);});startAnimation(inst);}

function stopUnread() {
  for (const type of ['agent', 'site']) {
    if (typeof unreadCleanup[type] === 'function') {
      unreadCleanup[type]();
    }

    unreadCleanup[type] = null;
    unreadCounts[type] = 0;

    updateBadge(type);
  }
}

function startUnread() {
  stopUnread();

  if (!uid || !profile) return;

  const db = firebase.database();

  // =====================================
  // 1. AGENT SUPPORT UNREAD
  // =====================================
  if (
    profile.role === 'superadmin' &&
    canAccess('agent')
  ) {
    const ref = db.ref('users');

    const handler = snapshot => {
      let total = 0;

      snapshot.forEach(child => {
        const data = child.val() || {};

        const count = Number(
          data.unreadCountForAdmin || 0
        );

        total += count > 0
          ? count
          : (data.unreadForAdmin === true ? 1 : 0);
      });

      unreadCounts.agent = total;
      updateBadge('agent');
    };

    ref.on('value', handler, error => {
      console.error('Agent unread error:', error);
    });

    unreadCleanup.agent = () => {
      ref.off('value', handler);
    };
  }

  // =====================================
  // 2. LIVECHAT SITE ADMIN UNREAD
  // =====================================
  if (canAccess('site')) {
    const ref = db.ref(`chats/admin_${uid}`);

    const handler = snapshot => {
      let total = 0;

      snapshot.forEach(child => {
        const message = child.val();

        if (
          message?.from === 'admin' &&
          message.readByUser !== true
        ) {
          total++;
        }
      });

      unreadCounts.site = total;
      updateBadge('site');
    };

    ref.on('value', handler, error => {
      console.error('Site LiveChat unread error:', error);
    });

    unreadCleanup.site = () => {
      ref.off('value', handler);
    };
  }
}

document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const open=Object.values(instances).filter(inst=>inst?.panel);if(!open.length)return;e.preventDefault();open.forEach(closePanel);});
const style=document.createElement('style');style.textContent=`
.asf-root{
  position:fixed;
  z-index:50000 !important;
  touch-action:none;
  user-select:none;
  right:0;
  left:auto;
  width:44px;
  height:56px;
  overflow:visible;
}
    .asf-root.asf-left{left:0;right:auto}
    .asf-button {
  position: absolute;
  top: 0;
  right: 0;

  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0;

  box-sizing: border-box;
  width: 44px;
  height: 56px;
  padding: 0;

  overflow: hidden;
  white-space: nowrap;

  background: var(--dropdown-bg);
  color: #1668dc;

  border: 1px solid var(--main-tab-border);
  border-right: 0;
  border-radius: 16px 0 0 16px;

  box-shadow: -3px 4px 18px rgba(15,23,42,.12);
  cursor: grab;

  font: 600 13px system-ui, sans-serif;

  transform: none;

transition:
  width 300ms cubic-bezier(.22,1,.36,1),
  box-shadow 300ms ease,
  border-color 300ms ease;
}
/* ==========================================
   AGENT SUPPORT - UNREAD RED BADGE
========================================== */

.asf-badge {
  position: absolute;
top: -8px;
right: 3px;

  min-width: 22px;
  height: 22px;
  padding: 0 5px;

  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  background: #ff4d4f;
  color: #ffffff;

  border: 2px solid var(--dropdown-bg, #1f1f1f);
  border-radius: 999px;

  font: 700 11px Arial, sans-serif;
  line-height: 1;

  z-index: 5;
  pointer-events: none;
}

/* Bila floating berada di sebelah kiri */
.asf-root.asf-left .asf-badge {
  right: auto;
  left: 5px;
}

/* Sembunyikan jika tiada unread */
.asf-badge[hidden] {
  display: none !important;
}
.asf-left .asf-button{left:0;right:auto;border:1px solid #303030;border-left:0;border-radius:0 16px 16px 0}
.asf-icon {
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  margin-left: 11px;
  margin-right: 11px;
  color: #1668dc;
  display: block;
  pointer-events: none;
}
.asf-label {
  display: inline-block;
  flex: 0 0 auto;

  max-width: 0;
  overflow: hidden;
  opacity: 0;

  white-space: nowrap;
  color: var(--text);

  font-size: 13px;
  font-weight: 600;
  line-height: 1;

  transition:
    max-width 300ms cubic-bezier(.22,1,.36,1),
    opacity 200ms ease;
}
@media (hover: hover) and (pointer: fine) {
  .asf-button:not(:disabled):not([data-dragging="true"]):hover {
    width: 160px;
    border-color: var(--floating-border);
    box-shadow: -4px 6px 24px rgba(15,23,42,.16);
  }

  .asf-button:not(:disabled):not([data-dragging="true"]):hover .asf-label {
    max-width: 110px;
    opacity: 1;
  }

}
    .asf-button:focus-visible{outline:2px solid #1668dc;outline-offset:2px}
    .asf-button:active{cursor:grabbing}
    .asf-button[hidden]{display:none!important}
.asf-panel {
  position: fixed;
  top: 50%;
  right: 10px;
  left: auto;
  bottom: auto;
  transform: translateY(-50%);
  z-index: 50001 !important;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--tx-border);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 14px 45px #0007;
}
.asf-head{height:44px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:0 12px;background:var(--lc-panel);color:var(--text);font:600 13px system-ui,sans-serif}
    .asf-head button{background:transparent;color:var(--text);border:0;cursor:pointer;font-size:22px;padding:3px 8px}
    .asf-panel iframe{flex:1;width:100%;border:0;background:var(--lc-panel)}
@media (max-width: 600px) {
  .asf-panel {
    top: 50%;
    bottom: auto;

    width: calc(100vw - 20px) !important;
    max-height: calc(100dvh - 30px);

    transform: translateY(-50%);
  }
}
    @media(prefers-reduced-motion:reduce){.asf-button,.asf-label{transition:none}}
  `;document.head.appendChild(style);
window.addEventListener('resize',()=>{for(const inst of Object.values(instances)){if(!inst?.root)continue;inst.animationBase=clamp(inst.animationBase,limits(inst).min,limits(inst).max);position(inst,inst.animationBase);startAnimation(inst);}});
function start(){if(!window.firebase?.auth||!window.firebase?.database)return;firebase.auth().onAuthStateChanged(user=>{unsubscribe?.();unsubscribe=null;stopUnread();destroy('agent');destroy('site');uid=user?.uid||null;profile=null;configs.agent={...defaults};configs.site={...siteDefaults};if(!uid)return;const current=uid;const db=firebase.database(),profileRef=db.ref(`adminUsers/${current}`),agentRef=db.ref(AGENT_PATH),siteRef=db.ref(SITE_PATH);const refresh=()=>{render('agent');render('site');startUnread();};const profileHandler=snap=>{if(uid!==current)return;profile=snap.val()||null;refresh();};const agentHandler=snap=>{if(uid!==current)return;configs.agent={...defaults,...(snap.val()||{})};refresh();};const siteHandler=snap=>{if(uid!==current)return;configs.site={...siteDefaults,...(snap.val()||{})};refresh();};profileRef.on('value',profileHandler,err=>console.error('Floating profile:',err));agentRef.on('value',agentHandler,err=>console.error('Agent floating config:',err));siteRef.on('value',siteHandler,err=>console.error('Site floating config:',err));unsubscribe=()=>{profileRef.off('value',profileHandler);agentRef.off('value',agentHandler);siteRef.off('value',siteHandler);};});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
