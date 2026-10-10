
function setBtnLoading(btn, state, text){
  if (!btn) return;

  if (state){
    btn.dataset.oldHtml = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add("btn-loading");
    btn.innerHTML = `
      <span class="btn-spinner"></span>
      <span>${text}</span>
    `;
  } else {
    btn.disabled = false;
    btn.classList.remove("btn-loading");
    btn.innerHTML = btn.dataset.oldHtml || text.replace("...", "");
    delete btn.dataset.oldHtml;
  }
}

const DEFAULT_PAGE_TITLE = "Back Office Editor 5G88";
let livechatTitleTimer = null;
let livechatTitleIndex = 0;
let livechatUnreadActive = false;
let livechatUnreadCount = 0;
let livechatLoopAudio = null;
let livechatLoopPlaying = false;
let userHasInteractedForAudio = false;

function initLivechatLoopAudio() {
  if (livechatLoopAudio) return livechatLoopAudio;

  const existing = document.getElementById("notifSound");
 livechatLoopAudio =
  existing ||
  new Audio("./audio/audio.wav");

  livechatLoopAudio.loop = true;
  livechatLoopAudio.preload = "auto";

  return livechatLoopAudio;
}

function unlockLivechatAudio() {
  const firstUnlock = !userHasInteractedForAudio;
  userHasInteractedForAudio = true;

  const audio = initLivechatLoopAudio();
  if (!audio) return;

  if (firstUnlock) {
    try {
      const oldMuted = audio.muted;
      const oldVolume = audio.volume;

      audio.muted = true;
      audio.volume = 0;

      const p = audio.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = oldMuted;
          audio.volume = oldVolume;

          if (livechatUnreadCount > 0 && !window.isLivechatTabActive?.()) {
            startLivechatLoopSound();
          }
        }).catch(() => {
          audio.muted = oldMuted;
          audio.volume = oldVolume;
        });
      } else {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = oldMuted;
        audio.volume = oldVolume;

        if (livechatUnreadCount > 0 && !window.isLivechatTabActive?.()) {
          startLivechatLoopSound();
        }
      }
    } catch (_) {}
  } else {
    if (livechatUnreadCount > 0 && !window.isLivechatTabActive?.()) {
      startLivechatLoopSound();
    }
  }
}

["pointerdown", "mousedown", "touchstart", "click", "keydown"].forEach(evt => {
  window.addEventListener(evt, unlockLivechatAudio, { passive: true, capture: true });
  document.addEventListener(evt, unlockLivechatAudio, { passive: true, capture: true });
});

function startLivechatLoopSound() {
  if (!userHasInteractedForAudio) return;
  if (window.isLivechatTabActive?.()) return;

  const audio = initLivechatLoopAudio();
  if (!audio) return;

  audio.loop = true;

  if (!audio.paused && livechatLoopPlaying) return;

  audio.currentTime = 0;

  audio.play().then(() => {
    livechatLoopPlaying = true;
  }).catch(() => {
    livechatLoopPlaying = false;

    setTimeout(() => {
      if (userHasInteractedForAudio && livechatUnreadCount > 0 && !window.isLivechatTabActive?.()) {
        const a = initLivechatLoopAudio();
        if (!a) return;
        a.play().then(() => {
          livechatLoopPlaying = true;
        }).catch(() => {});
      }
    }, 120);
  });
}

function stopLivechatLoopSound() {
  const audio = initLivechatLoopAudio();
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
  livechatLoopPlaying = false;
}
function syncLivechatAlertState(unreadCount = 0) {
  const count = Number(unreadCount || 0);

  livechatUnreadCount = count;
  livechatUnreadActive = count > 0;

  if (count > 0 && !window.isLivechatTabActive?.()) {
    startLivechatTitleAlert(count);
    startLivechatLoopSound();
  } else {
    stopLivechatTitleAlert(false);
    stopLivechatLoopSound();
  }
}
function startLivechatTitleAlert(unreadCount = 0) {
  livechatUnreadActive = true;
  livechatUnreadCount = Number(unreadCount || 0);

  if (livechatTitleTimer) return;

  livechatTitleIndex = 0;

  livechatTitleTimer = setInterval(() => {
    if (!livechatUnreadActive) return;

    const text = `   🔔 You Have (${livechatUnreadCount}) New Message!   `;
    const rotated =
      text.slice(livechatTitleIndex) + text.slice(0, livechatTitleIndex);

    document.title = rotated;
    livechatTitleIndex = (livechatTitleIndex + 1) % text.length;
  }, 220);
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && livechatUnreadCount > 0 && !window.isLivechatTabActive?.()) {
    stopLivechatTitleAlert(false);
    startLivechatTitleAlert(livechatUnreadCount);
    startLivechatLoopSound();
  }
});
function stopLivechatTitleAlert(resetUnread = false) {
  livechatUnreadActive = false;

  if (resetUnread) {
    livechatUnreadCount = 0;
  }

  if (livechatTitleTimer) {
    clearInterval(livechatTitleTimer);
    livechatTitleTimer = null;
  }

  document.title = DEFAULT_PAGE_TITLE;
}

(function(){
  const SESS_ROOT = 'singleSessions';
  const HB_MS = 15000;

  function makeToken(){
    if (crypto?.getRandomValues) {
      const a = new Uint32Array(4);
      crypto.getRandomValues(a);
      return Array.from(a).map(x=>x.toString(16)).join('-');
    }
    return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  }

  function keyify(s){
    return String(s||'').trim().toLowerCase().replace(/[.#$\[\]/\s]/g,'_');
  }

  let _session = null;

  async function startSingleSession(ownerId, onForcedLogout){
    await stopSingleSession();
    if (!ownerId) return;

    const token = makeToken();
    const key = keyify(ownerId);
    const sessRef = db.ref(`${SESS_ROOT}/${key}`);

    try { await sessRef.onDisconnect().remove(); } catch(_){}

    await sessRef.set({
      token,
      owner: key,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      lastSeen: firebase.database.ServerValue.TIMESTAMP
    });

    const onValue = sessRef.on('value', snap => {
      const v = snap.val();
      if (!v) return;
      if (v.token && v.token !== token) {
        hardLogout('token-changed');
      }
    });

    const hb = setInterval(() => {
      sessRef.child('lastSeen')
        .set(firebase.database.ServerValue.TIMESTAMP)
        .catch(()=>{});
    }, HB_MS);

    async function hardLogout(reason){
      try { sessRef.off('value', onValue); } catch(_){}
      try { clearInterval(hb); } catch(_){}
      try { await sessRef.remove(); } catch(_){}
      try { await auth.signOut(); } catch(_){}

      if (typeof onForcedLogout === 'function') {
        onForcedLogout(reason);
      } else {
        location.reload();
      }
    }

    _session = { sessRef, onValue, hb };
  }

  async function stopSingleSession(){
    if (!_session) return;
    const { sessRef, onValue, hb } = _session;
    try { clearInterval(hb); } catch(_){}
    try { sessRef.off('value', onValue); } catch(_){}
    try { await sessRef.remove(); } catch(_){}
    _session = null;
  }

  function getSessionOwnerFrom(loginData){
    const email = (loginData?.email || '').toLowerCase();
    if (!email) return null;
    if (email.endsWith('@5g88.local')) return email.split('@')[0];
    return email;
  }

  window.startSingleSession = startSingleSession;
  window.stopSingleSession = stopSingleSession;
  window.getSessionOwnerFrom = getSessionOwnerFrom;
})();

(function(){
  // === SETTING MUDAH ===
  const DEFAULT_MINUTES = 10080; // ganti default di sini (contoh: 20)
  const LOGIN_URL = "./login.html";
  const STORAGE_EXPIRE = "autoLogout.expireAt";
  const STORAGE_MIN = "autoLogout.minutes"; // kalau di-set, override DEFAULT_MINUTES
  const CHANNEL = "autoLogout-5g88";
  const TICK = 5000; // cek tiap 5 detik
  // (opsional) logout absolut walau aktif bergerak (null = mati)
  const ABSOLUTE_MAX_MS = null; // contoh: 8*60*60*1000 (8 jam)

  let bc = null, checkTimer = null, expireAt = null, absoluteExpireAt = null;

  function getMinutes(){
    const v = parseInt(localStorage.getItem(STORAGE_MIN) || "", 10);
    return Number.isFinite(v) && v > 0 ? v : DEFAULT_MINUTES;
  }
  const minutesToMs = (m)=> m*60*1000;
  const now = ()=> Date.now();

  function setExpireFromNow(){
    expireAt = now() + minutesToMs(getMinutes());
    localStorage.setItem(STORAGE_EXPIRE, String(expireAt));
    try { bc && bc.postMessage({t:"reset", expireAt}); } catch {}
  }
  function setAbsoluteExpireFromNow(){
    absoluteExpireAt = ABSOLUTE_MAX_MS ? (now() + ABSOLUTE_MAX_MS) : null;
  }
  function loadExpire(){
    const v = localStorage.getItem(STORAGE_EXPIRE);
    expireAt = v ? Number(v) : null;
  }
async function doLogout(reason="timeout"){
  try { clearInterval(checkTimer); } catch {}

  try { await auth.signOut(); } catch(_) {}

  try { localStorage.removeItem("gmailLogin"); } catch(_) {}
  try { localStorage.removeItem("useremail"); } catch(_) {}
  try { localStorage.removeItem(STORAGE_EXPIRE); } catch(_) {}
  try { localStorage.removeItem("autoLogout.expireAt"); } catch(_) {}
  try { localStorage.removeItem("login.livechatUnreadCount"); } catch(_) {}

  try { sessionStorage.removeItem("justLoggedIn"); } catch(_) {}
  try { sessionStorage.removeItem("forceLogout"); } catch(_) {}
  try { sessionStorage.removeItem("autoOpenTab"); } catch(_) {}
  try { sessionStorage.removeItem("queryUserAppliedOnce"); } catch(_) {}

  try { bc && bc.postMessage({ t:"logout", reason }); } catch {}
  try { window.google?.accounts?.id?.disableAutoSelect(); } catch(_){}

  window.location.replace(LOGIN_URL);
}
  function shouldLogout(){
    const t = now();
    if (expireAt && t >= expireAt) return true;
    if (absoluteExpireAt && t >= absoluteExpireAt) return true;
    return false;
  }
  function heartbeat(){
    loadExpire();
    if (shouldLogout()) doLogout("timeout");
  }
  function bindActivityReset(){
    const reset = ()=> setExpireFromNow();
    ["mousemove","mousedown","keydown","scroll","touchstart","pointerdown","wheel","focus"]
      .forEach(ev => window.addEventListener(ev, reset, {passive:true}));
    document.addEventListener("visibilitychange", ()=> { if (!document.hidden) reset(); });
    window.addEventListener("focus", reset);
  }
  function setupChannel(){
    try {
      bc = new BroadcastChannel(CHANNEL);
      bc.onmessage = (msg)=>{
        const d = msg?.data || {};
        if (d.t === "reset") {
          expireAt = Number(d.expireAt || 0) || expireAt;
          localStorage.setItem(STORAGE_EXPIRE, String(expireAt));
        } else if (d.t === "logout") {
          doLogout("multi-tab");
        }
      };
    } catch { bc = null; }
  }
  function start(){
    setupChannel();
    setExpireFromNow();
    setAbsoluteExpireFromNow();
    bindActivityReset();
    checkTimer = setInterval(heartbeat, TICK);
    heartbeat();
  }
  window.AutoLogout = {
    start,
    reset: setExpireFromNow,
    setMinutes: (m)=> {
      if (typeof m === "number" && m > 0) {
        localStorage.setItem(STORAGE_MIN, String(m));
        setExpireFromNow();
      }
    },
    stop: ()=> { try { clearInterval(checkTimer); } catch {} },

    // 🔍 DEBUG: lihat status timer
    status: ()=> {
      loadExpire();
      const left = expireAt ? Math.max(0, expireAt - now()) : null;
      return {
        minutesConfigured: getMinutes(),
        expireAt,
        msLeft: left,
        secLeft: left !== null ? Math.round(left/1000) : null,
        absoluteExpireAt
      };
    },

    // 🔍 DEBUG: paksa logout (cek kalau redirect jalan)
    forceLogout: ()=> doLogout("manual"),

    // 🔍 DEBUG: nyalakan log
    debugOn: ()=> {
      const log = (...a)=> console.log("[AutoLogout]", ...a);
      const _setExpireFromNow = setExpireFromNow;
      const _heartbeat = heartbeat;

      setExpireFromNow = function(){
        _setExpireFromNow();
        log("reset → expireAt:", new Date(expireAt).toLocaleTimeString());
      };
      heartbeat = function(){
        loadExpire();
        const left = expireAt ? (expireAt - now()) : null;
        log("tick → left(ms):", left);
        _heartbeat();
      };
      log("debug ON");
    }
  };
})();

function formatTimestamp(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

function cleanUrl() {
  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function checkLogin() {
  try {
    const gl = JSON.parse(
      localStorage.getItem("gmailLogin") || "null"
    );

    if (gl && gl.email) {
      return true;
    }
  } catch (_) {}

  if (sessionStorage.getItem("justLoggedIn") === "1") {
    return true;
  }

  const currentFile =
    location.pathname
      .split("/")
      .pop()
      ?.toLowerCase() || "";

  if (currentFile !== "login.html") {
    const returnTo = encodeURIComponent(location.href);

    location.replace(
      `./login.html?redirect=${returnTo}`
    );
  }

  return false;
}

function initLivechatNotifListener(userIdParam) {
  const login = JSON.parse(localStorage.getItem("gmailLogin") || "{}");
  if (!login?.email || !userIdParam) return;

  db.ref("chats/" + userIdParam).on("value", (snapshot) => {
    let unreadCount = 0;

    snapshot.forEach((child) => {
      const msg = child.val() || {};
      const from = String(msg.from || "").trim().toLowerCase();

      if (from === "admin" && msg.seenByUser !== true) {
        unreadCount++;
      }
    });

    const livechatDot = document.getElementById("livechatDot");
if (livechatDot) {
  if (unreadCount > 0) {
    livechatDot.style.display = "flex";
    livechatDot.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
  } else {
    livechatDot.style.display = "none";
    livechatDot.textContent = "";
  }
}

syncLivechatAlertState(unreadCount);

    if (window.updateFloatingFabLivechatDot) {
      window.updateFloatingFabLivechatDot(unreadCount);
    }
  });
}

function markLivechatAsRead() {
  const cur = JSON.parse(localStorage.getItem("gmailLogin") || "{}");
  if (!cur?.email || !userId) return;

  const chatRef = db.ref("chats/" + userId);

  chatRef.once("value", (snapshot) => {
    if (!snapshot.exists()) return;

    const updates = {};
    snapshot.forEach((child) => {
      const v = child.val();
      if (v?.from === "admin" && v?.seenByUser !== true) {
        updates[child.key + "/seenByUser"] = true;
        updates[child.key + "/readAt"] = Date.now(); // optional
      }
    });

    if (Object.keys(updates).length) {
      chatRef.update(updates).catch(()=>{});
    }
syncLivechatAlertState(0);

const livechatDot = document.getElementById("livechatDot");
if (livechatDot) {
  livechatDot.style.display = "none";
  livechatDot.textContent = "";
}

if (window.updateFloatingFabLivechatDot) {
  window.updateFloatingFabLivechatDot(0);
}
  });
}
// Optional: blokir buka tab untuk feature yang di-hide
// PANGGIL ini di awal fungsi addTab()
function isTabAllowed(label){
  return !isFeatureHidden(label);
}
const APP_VERSION_STORAGE_KEY = "5g88_seen_app_version";

function getAcceptedAppVersion() {
  return (localStorage.getItem(APP_VERSION_STORAGE_KEY) || "").trim();
}

function renderSidebarVersion(versionText) {
  const el = document.getElementById("sidebarVersionText");
  if (!el) return;
  el.textContent = versionText && String(versionText).trim() ? String(versionText).trim() : "-";
}

function refreshSidebarVersionFromStorage() {
  renderSidebarVersion(getAcceptedAppVersion());
}
async function initAppUpdatePopup() {
  const modal = document.getElementById("appUpdateModal");
  const titleEl = document.getElementById("appUpdateTitle");
  const msgEl = document.getElementById("appUpdateMessage");
  const btnEl = document.getElementById("appUpdateBtn");

  if (!modal || !titleEl || !msgEl || !btnEl) return;

  const STORAGE_KEY = "5g88_seen_app_version";

  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-store"
    });

    if (!res.ok) return;

    const data = await res.json();
    const latestVersion = String(data.version || "").trim();
    const latestTitle = String(data.title || "Update Available").trim();
    const latestMessage = String(
      data.message || `A new version ${latestVersion} is available. Would you like to update?`
    ).trim();

    if (!latestVersion) return;

    const seenVersion = localStorage.getItem(STORAGE_KEY) || "";

    if (seenVersion !== latestVersion) {
      titleEl.textContent = latestTitle;
      msgEl.textContent = latestMessage;
      modal.style.display = "flex";
      modal.setAttribute("aria-hidden", "false");

btnEl.onclick = function () {
  localStorage.setItem(STORAGE_KEY, latestVersion);
  renderSidebarVersion(latestVersion);
  window.location.reload();
};
    }
  } catch (err) {
    console.error("Version check failed:", err);
  }
}
// ⬇️ GANTI seluruh blok ini
document.addEventListener("DOMContentLoaded", async () => {
  const forceLogout = sessionStorage.getItem("forceLogout");
  if (forceLogout === "1") {
    sessionStorage.removeItem("forceLogout");
    cleanUrl();
  }

if (!checkLogin()) return;
refreshSidebarVersionFromStorage();
initAppUpdatePopup();

  const loginDataRaw = localStorage.getItem("gmailLogin");
  let sessionData = null;

  try {
    sessionData = JSON.parse(loginDataRaw);
  } catch (e) {
    console.error("❌ Failed to parse login data:", e);
    localStorage.removeItem("gmailLogin");
    window.location.href =
  "./login.html";
    return;
  }

  if (!sessionData || !sessionData.email) {
    window.location.href =
  "./login.html";
    return;
  }
try {
  await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
} catch (_) {}

  // ✅ 1) RTDB rules `auth != null` → login anon di project loginApp
async function ensureAnonAuth(maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      if (auth.currentUser) return true;
      await auth.signInAnonymously();
      return true;
    } catch (err) {
      console.warn(`[AnonAuth] Percobaan ${i + 1} gagal:`, err?.message || err);
      await new Promise(r => setTimeout(r, 400));
    }
  }
  return false;
}

  const authed = await ensureAnonAuth();
  if (!authed) {
    console.warn("⚠️ Anonymous auth gagal. Single-session tidak bisa menulis ke RTDB.");
    // lanjutkan UI tanpa enforcement
  }

  // ✅ 2) Auto-logout inactivity
  window.AutoLogout && window.AutoLogout.start();

  // ✅ 3) Single-Session
  try {
    const ownerId = window.getSessionOwnerFrom(sessionData);
await window.startSingleSession(ownerId, () => {
  try { localStorage.removeItem('gmailLogin'); } catch (_){}
  try { localStorage.removeItem('useremail'); } catch (_){}
  try { sessionStorage.setItem('forceLogout','1'); } catch (_){}
  try { window.google?.accounts?.id?.disableAutoSelect?.(); } catch (_){}
  window.location.replace("./login.html?dup=1");
});
  } catch (e) {
    console.warn('[single-session] gagal start:', e);
  }

  // ======= SEMUA YANG DI BAWAH INI BUTUH sessionData =======
  userId = (sessionData.email || '').toLowerCase().replace(/\./g, '_');

// Admin override (paksa logout user tertentu)
const myOverrideRef = db.ref('logins/admin_override/' + userId);
let adminOverrideProcessing = false;

myOverrideRef.on('value', async (snap) => {
  const v = snap.val();
  if (!v || v.forceLogout !== true) return;
  if (adminOverrideProcessing) return;

  adminOverrideProcessing = true;

  try { myOverrideRef.off(); } catch (_) {}

  // ✅ buang command Firebase dulu supaya login balik tidak kena baca command lama
  try { await myOverrideRef.remove(); } catch (_) {}

  try { await auth.signOut(); } catch (_) {}

  // ✅ memang clear semua storage kalau admin logout
  try { localStorage.clear(); } catch (_) {}
  try { sessionStorage.clear(); } catch (_) {}

  try { window.google?.accounts?.id?.disableAutoSelect?.(); } catch (_) {}

  setTimeout(() => {
    window.location.replace("./login.html?blocked=1");
  }, 300);
});

  // User diblok
  db.ref(`logins/blocked_users/${userId}`).on("value", async (s) => {
    if (s.val() === true) {
      try { if (auth) await auth.signOut(); } catch(_) {}
      localStorage.removeItem("gmailLogin");
      try { window.google?.accounts?.id?.disableAutoSelect?.(); } catch(_){}
      window.location.href = "./login.html?blocked=1";
    }
  });

// Simpan info user di blurphp + status online
const sanitizedEmail = sessionData.email.toLowerCase().replace(/\./g, '_');

db.ref('users/' + sanitizedEmail).update({
  name: sessionData.name,
  email: sessionData.email,
  photoURL: sessionData.photo || '',
  lastLoginTime: Date.now(),
  pageLoginTime: Date.now()
});

  const connectedRef = db.ref(".info/connected");
  const onlineRef = db.ref("users/" + sanitizedEmail + "/online");
  connectedRef.on("value", (snap) => {
    if (snap.val() === true) {
      onlineRef.set(true);
      onlineRef.onDisconnect().set(false);
    }
  });

  window.addEventListener("beforeunload", () => {
    try { db.ref("users/" + sanitizedEmail + "/online").set(false); } catch (_){}
    try { db.ref("chats/" + userId).off(); } catch (_){}
    try { db.ref("logins/admin_override/" + userId).off(); } catch (_){}
  });

  // Livechat: bunyi + dot notifikasi
  let lastNotifTime = 0;
  let userHasInteracted = false;
  document.body.addEventListener("click", () => { userHasInteracted = true; });

const chatsRef = db.ref("chats/" + userId);
chatsRef.off("child_added");

chatsRef.on("child_added", (snapshot) => {
  const msg = snapshot.val() || {};
  const from = String(msg.from || "").trim().toLowerCase();

  if (from !== "admin") return;
  if (msg.seenByUser === true) return;

const livechatDot = document.getElementById("livechatDot");
const notifSound  = document.getElementById("notifSound");

const timestamp = Number(msg.time || msg.atMs || Date.now());

if (timestamp > lastNotifTime) {
  lastNotifTime = timestamp;

  db.ref("chats/" + userId).once("value", (snap) => {
    let unreadCount = 0;

    snap.forEach((child) => {
      const row = child.val() || {};
      const fromRow = String(row.from || "").trim().toLowerCase();
      if (fromRow === "admin" && row.seenByUser !== true) {
        unreadCount++;
      }
    });

if (livechatDot) {
  if (unreadCount > 0) {
    livechatDot.style.display = "flex";
    livechatDot.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
  } else {
    livechatDot.style.display = "none";
    livechatDot.textContent = "";
  }
}
syncLivechatAlertState(unreadCount);

    if (window.updateFloatingFabLivechatDot) {
      window.updateFloatingFabLivechatDot(unreadCount);
    }
  });

if (!window.isLivechatTabActive?.()) {
  startLivechatLoopSound();
}
}
});

  // indikator unread
  initLivechatNotifListener(userId);  
}); // ⬅️ tutup DOMContentLoaded

  const loadingScreen = document.getElementById("loadingScreen");
  if (loadingScreen) {
    loadingScreen.style.display = "none";
  }
// ====== ❄️ SNOW EFFECT – MERRY CHRISTMAS ❄️ ======
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    // Hanya aktif di bulan Desember (0 = Jan, 11 = Des)
    const now = new Date();
    if (now.getMonth() !== 11) return;  // kalau mau selalu ON, hapus 2 baris ini

    const flakesCount = 80; // jumlah kepingan salju (atur sesuka hati)

    const snowLayer = document.createElement('div');
    snowLayer.className = 'snow-layer';
    document.body.appendChild(snowLayer);

    for (let i = 0; i < flakesCount; i++) {
      const flake = document.createElement('span');
      flake.className = 'snowflake';
      flake.textContent = '✻'; // bintang salju putih (bukan emoji)

      // Posisi horizontal random
      flake.style.left = Math.random() * 100 + 'vw';

      // Ukuran random
      const size = 8 + Math.random() * 12;   // 8px – 20px
      flake.style.fontSize = size + 'px';

      // Durasi jatuh random
      const duration = 6 + Math.random() * 10;  // 6s – 16s
      flake.style.animationDuration = duration + 's';

      // Delay random biar nggak bareng-bareng
      const delay = Math.random() * 10;
      flake.style.animationDelay = delay + 's';

      // Opacity sedikit beda-beda
      flake.style.opacity = (0.5 + Math.random() * 0.5).toFixed(2);

      snowLayer.appendChild(flake);
    }
  });
})();
// ===== 🎄 CHRISTMAS MUSIC SYSTEM =====
(function () {

  // ✅ 1) SWITCH UTAMA (tukar true/false)
  const CHRISTMAS_MUSIC_ENABLED = false; // ❌ OFF (dah lepas Christmas)
  // const CHRISTMAS_MUSIC_ENABLED = true; // ✅ ON (bila nak hidupkan semula)

  const music = document.getElementById("christmasMusic");
  const btn   = document.getElementById("musicToggle");
  if (!music || !btn) return;

  // ✅ 2) Kalau OFF → terus matikan semuanya, hide button, clear storage
  if (!CHRISTMAS_MUSIC_ENABLED) {
    try { music.pause(); } catch(e){}
    music.currentTime = 0;
    music.remove();                 // buang audio element dari DOM
    btn.style.display = "none";     // sembunyi button
    localStorage.removeItem("christmasMusic"); // buang state lama
    return;                         // STOP script
  }

  music.volume = 0.3;
  let isPlaying = false;
  let pausedByHidden = false;

  function setLabel(on){
    btn.textContent = on ? "🔊 MUSIC ON" : "🎵 MUSIC OFF";
  }

  function startMusic() {
    music.play().then(() => {
      isPlaying = true;
      pausedByHidden = false;
      setLabel(true);
      localStorage.setItem("christmasMusic", "on");
    }).catch(err => {
      console.log("Autoplay blocked:", err);
    });
  }

  function stopMusic() {
    music.pause();
    isPlaying = false;
    pausedByHidden = false;
    setLabel(false);
    localStorage.setItem("christmasMusic", "off");
  }

  const savedState = localStorage.getItem("christmasMusic");
  setLabel(savedState === "on");

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isPlaying) {
      stopMusic();
    } else {
      localStorage.setItem("christmasMusic", "on");
      startMusic();
    }
  });

  function resumeIfWanted() {
    if (!isPlaying && localStorage.getItem("christmasMusic") === "on") {
      startMusic();
    }
  }

  ["pointerdown", "keydown"].forEach(ev => {
    const handler = () => {
      resumeIfWanted();
      document.removeEventListener(ev, handler);
    };
    document.addEventListener(ev, handler);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (!music.paused) {
        music.pause();
        pausedByHidden = true;
      }
    } else {
      const state = localStorage.getItem("christmasMusic");
      if (pausedByHidden && state === "on") {
        music.play().then(() => {
          isPlaying = true;
          setLabel(true);
        }).catch(()=>{});
      }
    }
  });
})();
