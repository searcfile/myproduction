'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');    
const crypto = require('node:crypto');
const { rateLimit } = require('express-rate-limit');
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');    
const { getDatabase } = require('firebase-admin/database');     
  
for (const k of ['FIREBASE_SERVICE_ACCOUNT','FIREBASE_DATABASE_URL','FIREBASE_WEB_API_KEY','PIN_PEPPER','ALLOWED_ORIGINS']) {
  if (!process.env[k]) throw Error(`Missing environment variable: ${k}`);
} 
if (Buffer.byteLength(process.env.PIN_PEPPER) < 32) throw Error('PIN_PEPPER must be >= 32 bytes');
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (sa.project_id !== 'myproduction-v2') throw Error('Service account must belong to myproduction-v2');  
initializeApp({credential:cert(sa), databaseURL:process.env.FIREBASE_DATABASE_URL});
const auth = getAuth(), db = getDatabase(); 
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); 
// DEBUG: Periksa sama ada request sampai ke Express
app.use((req, res, next) => {
  const startedAt = Date.now();

  console.log(
    `[HTTP IN] ${req.method} ${req.originalUrl}`
  );

  res.on("finish", () => {
    console.log(
      `[HTTP OUT] ${req.method} ${req.originalUrl}` +
      ` status=${res.statusCode}` +
      ` duration=${Date.now() - startedAt}ms`
    );
  });

  next();
});
const origins = process.env.ALLOWED_ORIGINS.split(',').map(s=>s.trim());
app.use(cors({origin(origin,cb){ if(!origin || origins.includes(origin)) return cb(null,true); cb(new Error('Origin not allowed')); }, methods:['GET','POST','PATCH','DELETE'], allowedHeaders:['Content-Type','Authorization']}));
app.use(express.json({limit:'1mb'}));
/* ==========================================
   GLOBAL API - RATE LIMIT
   ========================================== */

function sendRateLimitResponse(req, res) {
  const resetTime = req.rateLimit?.resetTime?.getTime();

  const retryAfter = Math.max(
    1,
    Math.ceil(
      ((resetTime || Date.now() + 60_000) - Date.now()) / 1000
    )
  );

  res.setHeader('Retry-After', String(retryAfter));

  return res.status(429).json({
    ok: false,
    code: 'RATE_LIMIT',
    message: 'Too many login attempts.',
    retryAfter
  });
}

app.use('/api', rateLimit({
  windowMs: 60_000,
  limit: 45,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: sendRateLimitResponse
}));
app.get('/health', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  return res.json({
    ok: true,
    service: '5g88-admin-backend',
    version: 'livechat-migration-v4'
  });
});
const usernameOK = s => /^[a-z0-9._-]{3,40}$/.test(s);
const pinOK = s => /^\d{6}$/.test(s);
const passwordOK = s =>
  typeof s === "string" &&
  s.length >= 6 &&
  s.length <= 128;
const now = () => Date.now();

/* ==========================================
   CENTRALIZED LIVECHAT IDENTITY
   ========================================== */

function buildLiveChatId(username, uid) {
  const safeUsername = String(username || "")
    .trim()
    .toLowerCase()
    .replace(/[.#$\[\]\/\s]/g, "_");

  const safeUid = String(uid || "").trim();

  if (
    !safeUsername ||
    !safeUid ||
    /[.#$\[\]\/\s]/.test(safeUid)
  ) {
    throw new Error("Invalid LiveChat identity");
  }

  return `${safeUsername}_${safeUid}`;
}

function resolveLiveChatId(uid, profile) {
  const savedId = String(
    profile?.livechatId || ""
  ).trim();

  if (savedId) {
    if (
      /[.#$\[\]\/\s]/.test(savedId) ||
      !savedId.endsWith(`_${uid}`)
    ) {
      throw new Error("Invalid saved LiveChat ID");
    }

    return savedId;
  }

  // Backward compatibility untuk akaun lama
  return `admin_${uid}`;
}

/* ==========================================
   RISK ASSESSMENT - PUBLIC IP HISTORY
   ========================================== */

function normalizePublicIp(value) {
  if (typeof value !== 'string') return null;

  let ip = value.trim();

  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }

  if (require('node:net').isIP(ip) === 0) {
    return null;
  }

  // Jangan rekod IP private, loopback atau link-local
  const blockedV4 = [
    /^10\./,
    /^127\./,
    /^192\.168\./,
    /^169\.254\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^0\./,
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./
  ];

  if (blockedV4.some(pattern => pattern.test(ip))) {
    return null;
  }

  if (ip.includes(':')) {
    const lower = ip.toLowerCase();

    if (
      lower === '::1' ||
      lower === '::' ||
      lower.startsWith('fe80:') ||
      /^[fc-fd][0-9a-f]{2}:/i.test(lower)
    ) {
      return null;
    }
  }

  return ip;
}


function normalizeRecordedIp(value) {
  if (typeof value !== 'string') return null;

  let ip = value.trim();

  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }

  return require('node:net').isIP(ip) ? ip : null;
}

function getIpType(ip) {
  if (
    /^10\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    /^127\./.test(ip) ||
    /^169\.254\./.test(ip) ||
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(ip) ||
    ip === '::1' ||
    ip.toLowerCase().startsWith('fe80:') ||
    /^[fc-fd][0-9a-f]{2}:/i.test(ip)
  ) {
    return 'private';
  }

  return 'public';
}

async function recordLoginIp(uid, ip, timestamp) {
  const normalized = normalizeRecordedIp(ip);

  if (!normalized) {
    console.warn('[LOGIN IP] Invalid or missing IP');
    return;
  }

  const ipType = getIpType(normalized);
  const userRef = db.ref(`adminUsers/${uid}`);

  await userRef.child('ipHistory').transaction(current => {
    const history = Array.isArray(current) ? current : [];

    return [
      {
        ip: normalized,
        type: ipType,
        source: 'server-request',
        lastSeenAt: timestamp
      },
      ...history.filter(item => item?.ip !== normalized)
    ].slice(0, 5);
  });

  await userRef.update({
    lastLoginIp: normalized,
    'lastDevice/ip': normalized
  });
}


function passwordMatchTag(password) {
  return crypto
    .createHmac('sha256', process.env.PIN_PEPPER)
    .update('5g88-password-match-v1:')
    .update(password, 'utf8')
    .digest('hex');
}

const fail=(res,code,message)=>res.status(code).json({ok:false,message});
function pinHash(uid,pin,salt){return crypto.scryptSync(`${uid}:${pin}:${process.env.PIN_PEPPER}`,Buffer.from(salt,'hex'),64).toString('hex');}
async function setPin(uid,pin){
 const salt=crypto.randomBytes(16).toString('hex');
 await db.ref(`privateSecondFactors/${uid}`).set({salt,hash:pinHash(uid,pin,salt),updatedAt:now(),failedAttempts:0,lockedUntil:0});
 await db.ref(`adminUsers/${uid}`).update({secondPasswordEnabled:true,pinVersion:now()});
}
async function adminProfile(uid){const s=await db.ref(`adminUsers/${uid}`).once('value');return s.val();}

/* ==========================================
   PLAYER LOGIN FAILED COUNTERS
   ========================================== */

async function incrementLoginCounter(uid, field) {
  if (!uid || ![
    'loginFailedCount',
    'pinFailedCount'
  ].includes(field)) {
    return;
  }

  const ref = db.ref(`adminUsers/${uid}/${field}`);

  await ref.transaction(current => {
    const count = Number(current);

    return (
      Number.isSafeInteger(count) && count >= 0
        ? count
        : 0
    ) + 1;
  });
}

/* ==========================================
   SITE ADMIN - ACTIVE SITE ACCESS CHECK
   ========================================== */

async function hasActiveAssignedSite(profile) {
  if (profile.role === "superadmin") return true;

  if (profile.role !== "siteadmin") return false;

  const siteIds = Array.isArray(profile.siteIds)
    ? profile.siteIds
    : [];

  if (!siteIds.length) return false;

  const snapshot = await db.ref("sites").once("value");
  const sites = snapshot.val() || {};

  return siteIds.some(id => sites[id]?.active === true);
}
async function requireAdmin(req,res,next){
 try{
  const m=/^Bearer (\S+)$/.exec(req.headers.authorization||''); if(!m) return fail(res,401,'Authentication required');
  const token=await auth.verifyIdToken(m[1],true);
  if(token.firebase?.sign_in_provider==='anonymous' || token.secondVerified!==true) return fail(res,403,'Second password verification required');
  const p=await adminProfile(token.uid);
  if(!p || p.active!==true || !['superadmin','siteadmin'].includes(p.role) || p.secondPasswordEnabled!==true || token.pinVersion!==p.pinVersion) return fail(res,403,'Admin access denied');
if (!(await hasActiveAssignedSite(p))) {
  return fail(res, 403, "SITE_INACTIVE");
}

/* FORCE LOGOUT - reject old sessions */
const sessionVersion = Number(p.forceLogoutVersion || 0);

if (Number(token.forceLogoutVersion || 0) !== sessionVersion) {
  return fail(res, 401, 'Session revoked. Please login again.');
}

  req.admin={uid:token.uid,profile:p};next();
 }catch(e){return fail(res,401,'Invalid or expired session');}
}
function superOnly(req,res,next){if(req.admin.profile.role!=='superadmin')return fail(res,403,'Superadmin only');next();}
/* ==========================================
   PRIMARY SUPER ADMIN - OWNER ACCESS
   ========================================== */

function isPrimarySuperAdmin(admin) {
  const primaryUid = String(
    process.env.PRIMARY_SUPERADMIN_UID || ''
  ).trim();

  return Boolean(
    primaryUid &&
    admin &&
    admin.uid === primaryUid &&
    admin.profile?.role === 'superadmin' &&
    admin.profile?.username === 'admin33'
  );
}
/* ==========================================
   PRIMARY SUPER ADMIN - MANAGE SUPPORT
   ========================================== */

function canManageSupportAdmin(admin, uid, profile) {
  const primaryUid = String(
    process.env.PRIMARY_SUPERADMIN_UID || ''
  ).trim();

  return Boolean(
    isPrimarySuperAdmin(admin) &&
    primaryUid &&
    uid &&
    uid !== primaryUid &&
    uid !== admin.uid &&
    profile &&
    profile.role === 'superadmin' &&
    String(profile.username || '').toLowerCase() !== 'admin33'
  );
}
/* ==========================================
   ADMIN - CREATE ROLE CAPABILITIES
   ========================================== */

app.get(
  '/api/admin-users/create-capabilities',
  requireAdmin,
  superOnly,
  (req, res) => {
    return res.json({
      ok: true,
      canCreateSiteAdmin: true,
      canCreateSuperAdmin: isPrimarySuperAdmin(req.admin)
    });
  }
);
/* =====================================================
   SITE ADMIN PERMISSION MIDDLEWARE
   ===================================================== */

function requirePermission(moduleName, action = "view") {
  return (req, res, next) => {
    const admin = req.admin;

    if (!admin || !admin.profile) {
      return fail(res, 401, "Authentication required");
    }

    if (admin.profile.role === "superadmin") {
      return next();
    }

    if (admin.profile.role !== "siteadmin") {
      return fail(res, 403, "Admin access denied");
    }

const firebaseKey = moduleName.replace(/\.html$/, "_html");
const actions = admin.profile.permissions?.[firebaseKey];
if (moduleName === "maybank2u.html") {
  console.warn("[MAYBANK PERMISSION DEBUG]", {
    uid: admin.uid,
    role: admin.profile.role,
    moduleName,
    firebaseKey,
    requiredAction: action,
    savedKeys: Object.keys(admin.profile.permissions || {}),
    actions: Array.isArray(actions) ? actions : null
  });
}
    if (
      !Array.isArray(actions) ||
      !actions.includes("show") ||
      !actions.includes("view") ||
      !actions.includes(action)
    ) {
      return fail(res, 403, "Permission denied");
    }

    next();
  };
}

function publicUser(u, p) {
  return {
    uid: u.uid,
    username: p.username,
    livechatId: resolveLiveChatId(u.uid, p),
    displayName: p.displayName || p.username,
    role: p.role,
    siteIds: Array.isArray(p.siteIds) ? p.siteIds : [],
    permissions: Object.fromEntries(
  Object.entries(p.permissions || {}).map(([key, actions]) => [
    key.replace(/_html$/, ".html"),
    actions
  ])
),
    enabled: p.active === true && !u.disabled,

    remark: typeof p.remark === 'string'
      ? p.remark
      : '',

    createdAt: p.createdAt || null,
    updatedAt: p.updatedAt || null,
    firstLoginAt: p.firstLoginAt || null,
    lastLoginAt: p.lastLoginAt || null,


passwordUpdatedAt: p.passwordUpdatedAt || null,
passwordTracked: Boolean(p.passwordMatchTag),

// Player Login Details
loginFailedCount: p.loginFailedCount ?? 0,
pinFailedCount: p.pinFailedCount ?? 0,
totalLoginFailedCount:
  (Number(p.loginFailedCount) || 0) +
  (Number(p.pinFailedCount) || 0),

totalLoginCount: p.totalLoginCount ?? 0


  };
}

/* ==========================================
   LOGIN PASSWORD - ACCOUNT RATE LIMIT
   ========================================== */

/* ==========================================
   LOGIN PASSWORD - ACCOUNT COOLDOWN
   ========================================== */

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_COOLDOWN_MS = 15_000;
const LOGIN_ATTEMPT_EXPIRY_MS = 15 * 60_000;

const loginPasswordAttempts = new Map();

function getLoginRateLimitKey(username) {
  return 'login:' + String(username || '')
    .trim()
    .toLowerCase()
    .slice(0, 40);
}

function getLoginAttemptState(username) {
  const key = getLoginRateLimitKey(username);
  const timestamp = Date.now();

  let state = loginPasswordAttempts.get(key);

  if (
    !state ||
    (state.lockedUntil > 0 &&
      state.lockedUntil <= timestamp) ||
    (state.lockedUntil === 0 &&
      timestamp - state.updatedAt >= LOGIN_ATTEMPT_EXPIRY_MS)
  ) {
    state = {
      attempts: 0,
      lockedUntil: 0,
      updatedAt: timestamp
    };

    loginPasswordAttempts.set(key, state);
  }

  return state;
}

/* SEND COOLDOWN RESPONSE */

function sendLoginCooldown(res, state) {
  const retryAfter = Math.max(
    1,
    Math.ceil(
      (state.lockedUntil - Date.now()) / 1000
    )
  );

  res.setHeader(
    'Retry-After',
    String(retryAfter)
  );

  return res.status(429).json({
    ok: false,
    code: 'LOGIN_RATE_LIMIT',
    message: 'Too many login attempts.',
    retryAfter,
    resetAt: state.lockedUntil
  });
}

/* CHECK ACTIVE COOLDOWN */

function loginPasswordLimiter(req, res, next) {
  const state = getLoginAttemptState(
    req.body?.username
  );

  if (state.lockedUntil > Date.now()) {
    return sendLoginCooldown(res, state);
  }

  return next();
}

/* REGISTER FAILED LOGIN */

function registerFailedLogin(username, res) {
  const state = getLoginAttemptState(username);

  if (state.lockedUntil > Date.now()) {
    return sendLoginCooldown(res, state);
  }

  state.attempts += 1;
  state.updatedAt = Date.now();

  if (state.attempts >= LOGIN_MAX_ATTEMPTS) {
    state.lockedUntil =
      Date.now() + LOGIN_COOLDOWN_MS;

    return sendLoginCooldown(res, state);
  }

  return fail(res, 401, 'Invalid credentials');
}

/* RESET AFTER SUCCESSFUL LOGIN */

function resetLoginPasswordAttempts(username) {
  loginPasswordAttempts.delete(
    getLoginRateLimitKey(username)
  );
}

/* CLEANUP EXPIRED ATTEMPTS */

setInterval(() => {
  const timestamp = Date.now();

  for (const [key, state] of loginPasswordAttempts) {
    if (
      (state.lockedUntil > 0 &&
        state.lockedUntil <= timestamp) ||
      (state.lockedUntil === 0 &&
        timestamp - state.updatedAt >= LOGIN_ATTEMPT_EXPIRY_MS)
    ) {
      loginPasswordAttempts.delete(key);
    }
  }
}, 60_000).unref();

app.post('/api/login/start', loginPasswordLimiter, async(req,res)=>{
 const username=String(req.body?.username||'').trim().toLowerCase(), password=req.body?.password;
 if(!usernameOK(username)||typeof password!=='string')return fail(res,401,'Invalid credentials');
 try{
  const idx=(await db.ref(`adminUsernameIndex/${username}`).once('value')).val();
if (!idx?.uid) {
  return registerFailedLogin(username, res);
}
const profile = await adminProfile(idx.uid);

if (
  !profile ||
  profile.active !== true ||
  profile.secondPasswordEnabled !== true ||
  !['superadmin', 'siteadmin'].includes(profile.role)
) {
  return registerFailedLogin(username, res);
}
  if (!(await hasActiveAssignedSite(profile))) {
  return fail(res, 403, "SITE_INACTIVE");
}
  const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(process.env.FIREBASE_WEB_API_KEY)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:profile.email,password,returnSecureToken:true})});
  const data=await r.json();
 /* ==========================================
   FIREBASE LOGIN - ERROR DEBUG
   ========================================== */

if (!r.ok) {
  console.warn("[FIREBASE LOGIN ERROR]", {
    status: r.status,
    code: String(data?.error?.message || "UNKNOWN").split(" : ")[0]
  });
}
   /* ==========================================
   FIREBASE LOGIN - SECURITY RATE LIMIT
   ========================================== */

const firebaseErrorCode = String(
  data?.error?.message || ""
).split(" : ")[0].trim();

if (
  !r.ok &&
  firebaseErrorCode === "TOO_MANY_ATTEMPTS_TRY_LATER"
) {
  return res.status(429).json({
    ok: false,
    code: "FIREBASE_RATE_LIMIT",
    message: "Login temporarily restricted. Please try again later."
  });
}
if (!r.ok || data.localId !== idx.uid) {

  // Rekod kegagalan password untuk username
  // yang memang wujud dalam sistem.
  if (!r.ok && (
    data?.error?.message === 'INVALID_PASSWORD' ||
    data?.error?.message === 'INVALID_LOGIN_CREDENTIALS'
  )) {
    try {
      await incrementLoginCounter(
        idx.uid,
        'loginFailedCount'
      );
    } catch (counterError) {
      console.error(
        'Login failed counter error:',
        counterError
      );
    }
  }

  if (
    !r.ok &&
    (
      firebaseErrorCode === 'INVALID_PASSWORD' ||
      firebaseErrorCode === 'INVALID_LOGIN_CREDENTIALS'
    )
  ) {
    return registerFailedLogin(username, res);
  }

  return fail(res, 401, 'Invalid credentials');
}
         
  const challenge=crypto.randomBytes(32).toString('hex'), key=crypto.createHash('sha256').update(challenge).digest('hex');
  await db.ref(`loginChallenges/${key}`).set({uid:idx.uid,pinVersion:profile.pinVersion,expiresAt:now()+3*60_000,attempts:0});
  return res.json({ok:true,challenge,expiresInSeconds:180});
 }catch(e){console.error('Login start error',e.message);return fail(res,503,'Login temporarily unavailable');}
});
app.post('/api/login/finish',rateLimit({windowMs:15*60_000,limit:15}),async(req,res)=>{
 const challenge=String(req.body?.challenge||''),pin=String(req.body?.pin||'');
 if(!/^[0-9a-f]{64}$/.test(challenge)||!pinOK(pin))return fail(res,401,'Invalid verification');
 const key=crypto.createHash('sha256').update(challenge).digest('hex');
 const challengeRef=db.ref(`loginChallenges/${key}`);
 try{
   // Atomically reserve one attempt on this challenge.
   const challengeSnapshot = await challengeRef.once('value');

if (!challengeSnapshot.exists()) { 
  return fail(res, 401, 'Challenge expired or locked');
}
const result = await challengeRef.transaction(v => {

  const current = v === null
    ? challengeSnapshot.val()
    : v;

  if (!current) return;

  if (
    current.expiresAt <= now() ||
    (current.attempts || 0) >= 5 ||
    current.used === true
  ) {
    return;
  }

  return {
    ...current,
    attempts: (current.attempts || 0) + 1
  };

}, undefined, false);
if (!result.committed) {
  const current = (await challengeRef.once('value')).val();

  let reason = 'transaction_not_committed';

  if (!current) {
    reason = 'challenge_not_found';
  } else if (current.used === true) {
    reason = 'challenge_already_used';
  } else if (current.expiresAt < now()) {
    reason = 'challenge_expired';
  } else if (current.attempts >= 5) {
    reason = 'maximum_attempts';
  }

  console.warn('Login challenge rejected:', {
    reason,
    exists: Boolean(current),
    attempts: current?.attempts ?? null
  });

  return fail(res, 401, 'Challenge expired or locked');
}
   const ch=result.snapshot.val(),uid=ch.uid;
   const profile=await adminProfile(uid);
   if(!profile||profile.active!==true||profile.secondPasswordEnabled!==true||ch.pinVersion!==profile.pinVersion)return fail(res,403,'Access denied');
   const factorRef=db.ref(`privateSecondFactors/${uid}`);
   const factor=(await factorRef.once('value')).val();
   if(!factor||factor.lockedUntil>now())return fail(res,429,'PIN temporarily locked');
   const expected=Buffer.from(factor.hash,'hex'),actual=Buffer.from(pinHash(uid,pin,factor.salt),'hex');
   const correct=expected.length===actual.length && crypto.timingSafeEqual(expected,actual);
   // Lockout counter must be updated atomically across Render instances.
   await factorRef.once('value');
const countResult = await factorRef.transaction(v => {

  const current = v === null ? factor : v;

  if (
    !current ||
    current.salt !== factor.salt ||
    current.hash !== factor.hash
  ) {
    return;
  }

  if (current.lockedUntil > now()) return;

  if (correct) {
    return {
      ...current,
      failedAttempts: 0,
      lockedUntil: 0
    };
  }

  const attempts = (current.failedAttempts || 0) + 1;

  return {
    ...current,
    failedAttempts: attempts,
    lockedUntil: attempts >= 5
      ? now() + 15 * 60_000
      : 0
  };

}, undefined, false);

if (!countResult.committed) {
  return fail(
    res,
    429,
    'PIN changed or temporarily locked'
  );
}

if (!correct) {

  try {
    await incrementLoginCounter(
      uid,
      'pinFailedCount'
    );
  } catch (counterError) {
    console.error(
      'PIN failed counter error:',
      counterError
    );
  }

  return fail(res, 401, 'Invalid verification');
}

   // Consume the challenge once, even if two correct requests race.
const latestChallengeSnapshot = await challengeRef.once('value');

const used = await challengeRef.transaction(v => {

  const current = v === null
    ? latestChallengeSnapshot.val()
    : v;

  if (
    !current ||
    current.used === true ||
    current.expiresAt <= now() ||
    current.pinVersion !== ch.pinVersion
  ) {
    return;
  }

  return {
    ...current,
    used: true
  };

}, undefined, false);
   if(!used.committed)return fail(res,401,'Challenge already used');
   const current=await adminProfile(uid);
   if(!current||current.active!==true||current.pinVersion!==ch.pinVersion)return fail(res,403,'Access denied');
if (!(await hasActiveAssignedSite(current))) {
  return fail(res, 403, "SITE_INACTIVE");
}
  
const customToken = await auth.createCustomToken(uid, {
  secondVerified: true,
  pinVersion: current.pinVersion,
  forceLogoutVersion: Number(current.forceLogoutVersion || 0)
});

/* ==========================================
   LOGIN SUCCESS - RESET PASSWORD ATTEMPTS
   ========================================== */

resetLoginPasswordAttempts(current.username);

return res.json({ok:true,customToken});
 }catch(e){console.error('Login finish error',e.message);return fail(res,503,'Verification unavailable');}
});

/* ==========================================
   5G88 - FIRST LOGIN / LAST LOGIN
   ========================================== */

app.post('/api/account/session-event', requireAdmin, async (req, res) => {
  try {
    if (req.body?.event !== 'login') {
      return fail(res, 400, 'Invalid login event');
    }

    const uid = req.admin.uid;
    const userRef = db.ref(`adminUsers/${uid}`);
    const timestamp = now();

    // FIRST LOGIN - hanya simpan sekali.
    await userRef.child('firstLoginAt').transaction(current => {
      return current == null ? timestamp : undefined;
    });


    // LAST LOGIN - kemas kini setiap login.
    await userRef.child('lastLoginAt').set(timestamp);
           
// TOTAL LOGIN COUNT - tambah setiap login berjaya
await userRef.child('totalLoginCount').transaction(
  current => {
    const count = Number(current);

    return (
      Number.isSafeInteger(count) && count >= 0
        ? count
        : 0
    ) + 1;
  }
);



    // DEBUG sementara - semak sumber IP dari Render.
    console.log('[LOGIN IP DEBUG]', {
      expressIp: req.ip,
      expressIps: req.ips,
      socketIp: req.socket?.remoteAddress,
      forwardedFor: req.get('x-forwarded-for') || null
    });

    const loginIp = req.ip || null;
    await recordLoginIp(uid, loginIp, timestamp);
    

const device = req.body?.device;

if (device && typeof device === 'object') {
  const clean = (value, max = 256) =>
    typeof value === 'string'
      ? value.trim().slice(0, max)
      : '';

  const fingerprint = clean(
    device.fingerprint || device.id
  );

  const deviceId = clean(device.deviceId);

  const browser = clean(device.browser, 80);
  const os = clean(device.os, 80);
  const ua = clean(device.ua, 512);

  if (fingerprint || deviceId) {
    await userRef.child('lastDevice').update({
      id: fingerprint || null,
      fingerprint: fingerprint || null,
      deviceId: deviceId || null,
      browser,
      os,
      ua,
      recordedAt: timestamp
    });
  }
}


    return res.json({ ok: true });

  } catch (error) {
    console.error('Login tracking error:', error);
    return fail(res, 500, 'Cannot save login time');
  }
});

/* =====================================================
   CHANGE OWN PASSWORD / 2ND PASSWORD
   ===================================================== */

app.post('/api/account/change-password', requireAdmin, async (req, res) => {
  const oldPassword = req.body?.oldPassword;
  const newPassword = req.body?.newPassword;

  if (typeof oldPassword !== 'string' || !passwordOK(newPassword)) {
    return fail(res, 400, 'Invalid password or new password is too short');
  }

  if (oldPassword === newPassword) {
    return fail(res, 400, 'New password must be different');
  }

  try {
    const profile = req.admin.profile;

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(process.env.FIREBASE_WEB_API_KEY)}`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email: profile.email,
          password: oldPassword,
          returnSecureToken: true
        })
      }
    );

    const result = await response.json();

    if (!response.ok || result.localId !== req.admin.uid) {
      return fail(res, 401, 'Wrong current password');
    }

    await auth.updateUser(req.admin.uid, {
      password: newPassword
    });
await db.ref(`adminUsers/${req.admin.uid}`).update({
  passwordMatchTag: passwordMatchTag(newPassword),
  passwordUpdatedAt: now(),
  updatedAt: now()
});
    await auth.revokeRefreshTokens(req.admin.uid);

    return res.json({
      ok: true,
      message: 'Password changed successfully. Please log in again.'
    });

  } catch (error) {
    console.error('Change password:', error.message);
    return fail(res, 500, 'Failed to change password');
  }
});


app.post('/api/account/change-pin', requireAdmin, async (req, res) => {
  const oldPin = String(req.body?.oldPin ?? '');
  const newPin = String(req.body?.newPin ?? '');

  if (!pinOK(oldPin) || !pinOK(newPin)) {
    return fail(res, 400, 'PIN must contain exactly 6 digits');
  }

  if (oldPin === newPin) {
    return fail(res, 400, 'New PIN must be different');
  }

  try {
    const uid = req.admin.uid;
    const factorRef = db.ref(`privateSecondFactors/${uid}`);
    const snapshot = await factorRef.once('value');
    const factor = snapshot.val();

    if (!factor) {
      return fail(res, 404, '2nd password is not configured');
    }

    if ((factor.lockedUntil || 0) > now()) {
      return fail(res, 429, 'PIN temporarily locked');
    }

    const expected = Buffer.from(factor.hash, 'hex');
    const actual = Buffer.from(
      pinHash(uid, oldPin, factor.salt), 'hex'
    );

    const correct =
      expected.length === actual.length &&
      crypto.timingSafeEqual(expected, actual);

    const newSalt = correct
      ? crypto.randomBytes(16).toString('hex')
      : null;

const transaction = await factorRef.transaction(current => {
  const data = current === null ? factor : current;

  if (!data ||
      data.hash !== factor.hash ||
      data.salt !== factor.salt ||
      (data.lockedUntil || 0) > now()) {
    return;
  }

if (!correct) {
  const attempts = (data.failedAttempts || 0) + 1;

  return {
    ...data,
          failedAttempts: attempts,
          lockedUntil: attempts >= 5
            ? now() + 15 * 60_000
            : 0
        };
      }

return {
  ...data,
  salt: newSalt,
        hash: pinHash(uid, newPin, newSalt),
        updatedAt: now(),
        failedAttempts: 0,
        lockedUntil: 0
      };
    }, undefined, false);

    if (!transaction.committed) {
      return fail(res, 409, 'PIN changed or temporarily locked. Please retry.');
    }

    if (!correct) {
      return fail(res, 401, 'Wrong current 2nd password');
    }

    // Invalidate sessions that were verified using the old PIN.
    const version = now();
    await db.ref(`adminUsers/${uid}`).update({
      pinVersion: version
    });

    await auth.revokeRefreshTokens(uid);

    return res.json({
      ok: true,
      message: '2nd password changed successfully. Please log in again.'
    });

  } catch (error) {
    console.error('Change PIN:', error.message);
    return fail(res, 500, 'Failed to change 2nd password');
  }
});

/* ==========================================
   RISK ASSESSMENT - MATCHED USERS
   ========================================== */

app.get(
  '/api/admin-users/:uid/risk-matches',
  requireAdmin,
  superOnly,
  async (req, res) => {
    try {
      const uid = String(req.params.uid || '');
      const type = String(req.query.type || '');

      if (!['ip', 'password', 'fingerprint'].includes(type)) {
        return fail(res, 400, 'Invalid risk type');
      }

      const profiles = (
        await db.ref('adminUsers').once('value')
      ).val() || {};

      const selected = profiles[uid];

      if (!selected) {
        return fail(res, 404, 'User not found');
      }
/* PROTECT SUPER ADMIN RISK ASSESSMENT */

if (
  selected.role !== 'siteadmin' &&
  !canManageSupportAdmin(
    req.admin,
    uid,
    selected
  )
) {
  return fail(
    res,
    403,
    'This account is protected'
  );
}


const getIpHistory = profile => {
  const history = Array.isArray(profile?.ipHistory)
    ? profile.ipHistory
    : [];

  const combined = [];

  const addIp = (value, metadata = {}) => {
    const ip = normalizeRecordedIp(value);
    if (!ip) return;

    if (combined.some(item => item.ip === ip)) return;

    combined.push({
      ip,
      type: metadata.type || getIpType(ip),
      source: metadata.source || 'legacy',
      lastSeenAt: metadata.lastSeenAt || null
    });
  };

  // Sejarah IP yang sudah direkodkan
  for (const item of history) {
    addIp(item?.ip, item);
  }

  // Fallback daripada Same Password
  addIp(profile?.lastDevice?.ip, {
    source: 'legacy-lastDevice',
    lastSeenAt: profile?.lastLoginAt || null
  });

  // Fallback tambahan
  addIp(profile?.lastLoginIp, {
    source: 'legacy-lastLogin',
    lastSeenAt: profile?.lastLoginAt || null
  });

  return combined.slice(0, 5);
};


      const selectedIps = new Set(
        getIpHistory(selected).map(item => item.ip)
      );


      const selectedTag =
        String(selected.passwordMatchTag || '');

const getFingerprint = profile =>
  String(
    profile?.lastDevice?.fingerprint ||
    profile?.lastDevice?.id ||
    ''
  ).trim();


const selectedFingerprint = getFingerprint(selected);
      const matchedIds = new Set([uid]);

      for (const [otherUid, profile] of Object.entries(profiles)) {
        if (otherUid === uid) continue;


        if (type === 'ip') {
          const otherIps = getIpHistory(profile);

          const hasMatch = otherIps.some(item =>
            selectedIps.has(item.ip)
          );

          if (hasMatch) {
            matchedIds.add(otherUid);
          }
        }

        if (type === 'password') {
          const otherTag =
            String(profile.passwordMatchTag || '');

          if (
            selectedTag &&
            otherTag &&
            selectedTag === otherTag
          ) {
            matchedIds.add(otherUid);
          }
        }
if (type === 'fingerprint') {
  const otherFingerprint = getFingerprint(profile);

  if (
    selectedFingerprint &&
    otherFingerprint &&
    selectedFingerprint === otherFingerprint
  ) {
    matchedIds.add(otherUid);
  }
}
      }

      const users = [];

      for (const matchedUid of matchedIds) {
        try {
          const authUser = await auth.getUser(matchedUid);
          const profile = profiles[matchedUid];

          if (!profile) continue;

          users.push({
            ...publicUser(authUser, profile),

lastDevice: {
  os: profile.lastDevice?.os || null,
  browser: profile.lastDevice?.browser || null,
  ip: profile.lastDevice?.ip || null,
  id: profile.lastDevice?.id || null,
  fingerprint:
    profile.lastDevice?.fingerprint ||
    profile.lastDevice?.id ||
    null,
  deviceId: profile.lastDevice?.deviceId || null,
  ua: profile.lastDevice?.ua || null,
  recordedAt: profile.lastDevice?.recordedAt || null
},

  ipHistory: type === 'ip'
    ? getIpHistory(profile)
    : [],

  matchedIp: type === 'ip'
    ? (
        matchedUid === uid
          ? null
          : getIpHistory(profile).find(item =>
              selectedIps.has(item.ip)
            ) || null
      )
    : null
          });
        } catch (error) {
          console.warn(
            'Risk match user unavailable:',
            matchedUid
          );
        }
      }

      users.sort((a, b) => {
        if (a.uid === uid) return -1;
        if (b.uid === uid) return 1;

        return String(a.username || '')
          .localeCompare(String(b.username || ''));
      });

      return res.json({
        ok: true,
        type,
        users
      });

    } catch (error) {
      console.error('Risk matches:', error);
      return fail(res, 500, 'Cannot load risk matches');
    }
  }
);

app.get('/api/admin-users',requireAdmin,superOnly,async(req,res)=>{
 try{
  const profiles=(await db.ref('adminUsers').once('value')).val()||{};
  const users=[];let pageToken;
  do{const page=await auth.listUsers(1000,pageToken);for(const u of page.users){if(profiles[u.uid])users.push(publicUser(u,profiles[u.uid]));}pageToken=page.pageToken;}while(pageToken);
  return res.json({ok:true,users});
 }catch(e){console.error(e.message);return fail(res,500,'Cannot list users');}
});

/* ==========================================
   SUPER ADMIN - FORCE LOGOUT SITE ADMIN
   ========================================== */

app.post(
  '/api/admin-users/:uid/force-logout',
  requireAdmin,
  superOnly,
  async (req, res) => {
    try {
      const uid = String(req.params.uid || '');

      if (!uid || uid === req.admin.uid) {
        return fail(res, 400, 'Invalid target account');
      }

      const profile = await adminProfile(uid);

/* SITE ADMIN + MANAGED SUPPORT ADMIN */

if (
  !profile ||
  (
    profile.role !== 'siteadmin' &&
    !canManageSupportAdmin(req.admin, uid, profile)
  )
) {
  return fail(
    res,
    403,
    'This account is protected'
  );
}

      // Naikkan versi sesi secara atomic.
      const versionRef = db.ref(
        `adminUsers/${uid}/forceLogoutVersion`
      );

      const result = await versionRef.transaction(current => {
        return Number(current || 0) + 1;
      });

      if (!result.committed) {
        return fail(res, 503, 'Cannot revoke session');
      }

      // Batalkan Firebase refresh tokens lama.
      await auth.revokeRefreshTokens(uid);

      return res.json({
        ok: true,
        message: 'User session revoked'
      });

    } catch (error) {
      console.error('Force logout:', error);
      return fail(res, 500, 'Force logout failed');
    }
  }
);

/* ==========================================
   SUPER ADMIN - FORCE LOGOUT ALL SITE ADMINS
   ========================================== */

app.post(
  '/api/admin-users/force-logout-all',
  requireAdmin,
  superOnly,
  async (req, res) => {
    try {
      const snapshot = await db.ref('adminUsers').once('value');
      const profiles = snapshot.val() || {};

      const targets = Object.entries(profiles)
        .filter(([uid, profile]) =>
          uid !== req.admin.uid &&
          profile?.role === 'siteadmin'
        )
        .map(([uid]) => uid);

      if (!targets.length) {
        return res.json({
          ok: true,
          count: 0,
          failed: 0
        });
      }

      const results = await Promise.allSettled(
        targets.map(async uid => {
          const ref = db.ref(
            `adminUsers/${uid}/forceLogoutVersion`
          );

          const transaction = await ref.transaction(
            current => Number(current || 0) + 1
          );

          if (!transaction.committed) {
            throw new Error(
              'Cannot revoke session for ' + uid
            );
          }

          await auth.revokeRefreshTokens(uid);

          return uid;
        })
      );

      const count = results.filter(
        result => result.status === 'fulfilled'
      ).length;

      const failed = results.length - count;

      if (failed) {
        console.error(
          '[Force Logout All] Failed:',
          results
            .filter(result => result.status === 'rejected')
            .map(result => result.reason?.message)
        );
      }

      return res.json({
        ok: true,
        count,
        failed,
        message: failed
          ? 'Some accounts could not be logged out'
          : 'All Site Admin sessions revoked'
      });

    } catch (error) {
      console.error('Force Logout All:', error);

      return fail(
        res,
        500,
        'Cannot force logout all users'
      );
    }
  }
);

app.post('/api/admin-users',requireAdmin,superOnly,async(req,res)=>{
 const username=String(req.body?.username||'').trim().toLowerCase(),password=req.body?.password,pin=String(req.body?.secondPassword||''),enabled=req.body?.enabled!==false;
const email = `${username}@accounts.myproduction-v2.example`;

/* CREATE USERNAME - ROLE VALIDATION */

const role = req.body?.role ?? 'siteadmin';

if (!['siteadmin', 'superadmin'].includes(role)) {
  return fail(res, 400, 'Invalid admin role');
}

/* PRIMARY SUPER ADMIN ONLY */

if (
  role === 'superadmin' &&
  !isPrimarySuperAdmin(req.admin)
) {
  return fail(
    res,
    403,
    'Only Primary Super Admin can create Super Admin accounts'
  );
}

/* SUPER ADMIN DOES NOT REQUIRE SITE ASSIGNMENT */

const siteIds = role === 'superadmin'
  ? []
  : req.body?.siteIds;

if (
  !Array.isArray(siteIds) ||
  siteIds.length > 20 ||
  !siteIds.every(id =>
    typeof id === "string" &&
    /^[a-z0-9_-]{1,48}$/.test(id)
  ) ||
  new Set(siteIds).size !== siteIds.length
) {
  return fail(res, 400, "Invalid site assignments");
}

try {
  const siteSnap = await db.ref("sites").once("value");
  const existingSites = siteSnap.val() || {};

  if (!siteIds.every(id => existingSites[id]?.active === true)) {
    return fail(res, 400, "One or more sites are invalid or inactive");
  }
} catch (error) {
  console.error("Validate assigned sites:", error.message);
  return fail(res, 503, "Cannot validate assigned sites");
}
if (!usernameOK(username) || !passwordOK(password) || !pinOK(pin)) {
  return fail(
    res,
    400,
    "Provide username, password >=6 characters, and 6-digit PIN"
  );
}
 let created=null;
 try{
  const indexRef=db.ref(`adminUsernameIndex/${username}`);
  const reserved=await indexRef.transaction(v=>v===null?{reserved:true,at:now()}:undefined,undefined,false);
  if(!reserved.committed)return fail(res,409,'Username already exists');
  try{

created=await auth.createUser({email,password,disabled:!enabled,displayName:username});
const t=now();

// PERMANENT LIVECHAT ID
const livechatId = buildLiveChatId(
  username,
  created.uid
);

await db.ref(`adminUsers/${created.uid}`).set({
  username,
  email,
  livechatId,
  passwordMatchTag: passwordMatchTag(password),
  displayName: username,
  role: role,
  siteIds,
  active: enabled,
  secondPasswordEnabled: false,
  createdAt: t,
  updatedAt: t,
  createdBy: req.admin.uid
});

   await setPin(created.uid,pin);
   await indexRef.set({uid:created.uid});

return res.status(201).json({
  ok: true,
  user: {
    uid: created.uid,
    username,
    email,
    livechatId,
    enabled,
    role
  }
});

  }catch(e){if(created){await auth.deleteUser(created.uid).catch(()=>{});await db.ref(`adminUsers/${created.uid}`).remove().catch(()=>{});await db.ref(`privateSecondFactors/${created.uid}`).remove().catch(()=>{});}await indexRef.remove().catch(()=>{});throw e;}
 }catch(e){console.error('Create user',e.message);return fail(res,500,'Cannot create user; check email uniqueness and backend logs');}
});
/* ==========================================
   PRIMARY SUPER ADMIN - SUPPORT STATUS
   ========================================== */

app.patch(
  '/api/admin-users/:uid/support-status',
  requireAdmin,
  superOnly,
  async (req, res) => {

    try {
      const uid = String(req.params.uid || '');
      const profile = await adminProfile(uid);

      if (!canManageSupportAdmin(
        req.admin,
        uid,
        profile
      )) {
        return fail(
          res,
          403,
          'This account is protected'
        );
      }

      const enabled = req.body?.enabled;

      if (typeof enabled !== 'boolean') {
        return fail(
          res,
          400,
          'enabled must be boolean'
        );
      }

      const userRef = db.ref(`adminUsers/${uid}`);

      if (!enabled) {

        // Block access
        await userRef.update({
          active: false,
          updatedAt: now()
        });

        // Invalidate existing sessions
        await userRef
          .child('forceLogoutVersion')
          .transaction(current =>
            Number(current || 0) + 1
          );

        await auth.updateUser(uid, {
          disabled: true
        });

        await auth.revokeRefreshTokens(uid);

      } else {

        // Enable Firebase account
        await auth.updateUser(uid, {
          disabled: false
        });

        // Restore admin access
        await userRef.update({
          active: true,
          updatedAt: now()
        });

      }

      return res.json({
        ok: true,
        enabled,
        message: enabled
          ? 'Support account activated'
          : 'Support account deactivated'
      });

    } catch (error) {

      console.error(
        '[SUPPORT ADMIN STATUS]',
        error
      );

      return fail(
        res,
        500,
        'Cannot update support account'
      );

    }
  }
);
app.patch('/api/admin-users/:uid',requireAdmin,superOnly,async(req,res)=>{
  const uid = req.params.uid;

  try {

    const p = await adminProfile(uid);

    /* ==========================================
       SITE ADMIN + MANAGED SUPPORT ADMIN
       ========================================== */

    if (
      !p ||
      (
        p.role !== 'siteadmin' &&
        !canManageSupportAdmin(req.admin, uid, p)
      )
    ) {
      return fail(
        res,
        403,
        'This account is protected'
      );
    }

    const updates = {
      updatedAt: now()
    };

    const authUpdates = {};
          
/* ==========================================
   PLAYER INFO - SAVE REMARK
   ========================================== */

if (Object.hasOwn(req.body, 'remark')) {
  if (
    typeof req.body.remark !== 'string' ||
    req.body.remark.length > 2000
  ) {
    return fail(
      res,
      400,
      'Remark must be text with maximum 2000 characters'
    );
  }

  updates.remark = req.body.remark.trim();
}

  if(Object.hasOwn(req.body,'enabled')){
   if(typeof req.body.enabled!=='boolean')return fail(res,400,'enabled must be boolean');
   updates.active=req.body.enabled;authUpdates.disabled=!req.body.enabled;
  }
  if(Object.hasOwn(req.body,'password')){
if (!passwordOK(req.body.password)) {
  return fail(res, 400, "Password must have at least 6 characters");
}
   authUpdates.password=req.body.password;
   updates.passwordMatchTag =
  passwordMatchTag(req.body.password);
 updates.passwordUpdatedAt = now();
  }
  if(Object.hasOwn(req.body,'secondPassword')){
   if(!pinOK(String(req.body.secondPassword)))return fail(res,400,'PIN must be exactly 6 digits');
  }
/* ==========================================
   ACCOUNT UPDATE
   ========================================== */

if (Object.keys(authUpdates).length) {
  await auth.updateUser(uid, authUpdates);
}

await db.ref(`adminUsers/${uid}`).update(updates);

if (Object.hasOwn(req.body, 'secondPassword')) {
  await setPin(
    uid,
    String(req.body.secondPassword)
  );
}

/* ==========================================
   SUPPORT ADMIN - INVALIDATE OLD SESSIONS
   ========================================== */

const shouldRevokeSupportSession =
  p.role === 'superadmin' &&
  (
    req.body.enabled === false ||
    Object.hasOwn(req.body, 'password') ||
    Object.hasOwn(req.body, 'secondPassword')
  );

if (shouldRevokeSupportSession) {

  const result = await db
    .ref(`adminUsers/${uid}/forceLogoutVersion`)
    .transaction(current =>
      Number(current || 0) + 1
    );

  if (!result.committed) {
    return fail(
      res,
      503,
      'Account updated but session revocation failed'
    );
  }

  await auth.revokeRefreshTokens(uid);

}

return res.json({
  ok: true,
  message: 'Account updated successfully'
});
 }catch(e){console.error('Update user',e.message);return fail(res,500,'Cannot update user');}
});

/* DELETE USERNAME + OWNED SITE */

app.delete(
  '/api/admin-users/:uid',
  requireAdmin,
  superOnly,
  async (req, res) => {
    const uid = req.params.uid;

    try {
      const profile = await adminProfile(uid);

/* ==========================================
   DELETE ADDITIONAL SUPER ADMIN
   ========================================== */

if (
  !profile ||
  uid === req.admin.uid ||
  uid === String(
    process.env.PRIMARY_SUPERADMIN_UID || ''
  ).trim() ||
  String(profile.username || '').toLowerCase() === 'admin33'
) {
  return fail(
    res,
    403,
    'This account is protected'
  );
}

if (profile.role === 'superadmin') {

  if (!canManageSupportAdmin(
    req.admin,
    uid,
    profile
  )) {
    return fail(
      res,
      403,
      'Primary Super Admin only'
    );
  }

  const supportUsername = String(
    profile.username || ''
  ).trim().toLowerCase();

  if (!usernameOK(supportUsername)) {
    return fail(
      res,
      409,
      'Invalid username record'
    );
  }

  const supportIndex = await db
    .ref(`adminUsernameIndex/${supportUsername}`)
    .once('value');

  if (supportIndex.val()?.uid !== uid) {
    return fail(
      res,
      409,
      'Username index mismatch'
    );
  }

  // Block access before deletion
  await db.ref(`adminUsers/${uid}`).update({
    active: false,
    updatedAt: now()
  });

  // Permanently delete Firebase Auth account
  try {
    await auth.deleteUser(uid);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      throw error;
    }
  }

  // Remove account records only
  await db.ref().update({
    [`adminUsers/${uid}`]: null,
    [`privateSecondFactors/${uid}`]: null,
    [`adminUsernameIndex/${supportUsername}`]: null
  });

  return res.json({
    ok: true,
    deletedUsername: supportUsername,
    deletedSite: null,
    message: 'Support account deleted'
  });

}

/* EXISTING SITE ADMIN DELETE */

if (profile.role !== 'siteadmin') {
  return fail(
    res,
    403,
    'Invalid account role'
  );
}

      const username = String(profile.username || '')
        .trim()
        .toLowerCase();

      if (!usernameOK(username)) {
        return fail(res, 409, 'Invalid username record');
      }

      const [indexSnap, siteSnap, usersSnap] =
        await Promise.all([
          db.ref(`adminUsernameIndex/${username}`)
            .once('value'),
          db.ref(`sites/${username}`).once('value'),
          db.ref('adminUsers').once('value')
        ]);

      if (indexSnap.val()?.uid !== uid) {
        return fail(res, 409, 'Username index mismatch');
      }

      const site = siteSnap.val();
      const allUsers = usersSnap.val() || {};

      const assignedIds = Array.isArray(profile.siteIds)
        ? profile.siteIds
        : [];

      // Jangan delete jika user mempunyai site
      // assignment lain yang belum dimigrasikan.
      if (assignedIds.some(id => id !== username)) {
        return fail(
          res,
          409,
          'Other site assignments require manual review'
        );
      }

      if (site) {
        if (
          String(site.name || '').toLowerCase() !== username
        ) {
          return fail(res, 409, 'Site identity mismatch');
        }

        const shared = Object.entries(allUsers).some(
          ([otherUid, other]) =>
            otherUid !== uid &&
            Array.isArray(other?.siteIds) &&
            other.siteIds.includes(username)
        );

        if (shared) {
          return fail(
            res,
            409,
            'Site is assigned to another username'
          );
        }

        // Jangan padam site lama yang tidak terbukti
        // dimiliki oleh akaun ini.
        if (!assignedIds.includes(username)) {
          return fail(
            res,
            409,
            'Site ownership requires manual review'
          );
        }
      }

      // Firebase Auth dan RTDB ialah dua sistem berbeza.
      await auth.deleteUser(uid);

      const updates = {
        [`adminUsers/${uid}`]: null,
        [`privateSecondFactors/${uid}`]: null,
        [`adminUsernameIndex/${username}`]: null
      };

      if (site) {
        updates[`sites/${username}`] = null;
      }

      await db.ref().update(updates);

      return res.json({
        ok: true,
        deletedUsername: username,
        deletedSite: site ? username : null
      });

    } catch (error) {
      console.error('[DELETE USER + SITE]', error);

      return fail(
        res,
        500,
        'Deletion failed; verify Auth and Firebase records'
      );
    }
  }
);

/* =====================================================
   ADMIN PROFILE PERMISSIONS — SUPERADMIN ONLY
   ===================================================== */

/* =====================================================
   ADMIN MODULE VALIDATION
   ===================================================== */

const SUPERADMIN_ONLY_PAGES = new Set([
  "users.html",
  "site-management.html",
  "admin-users.html",
  "livechat-support.html",
  "notice.html",
  "config.html",
  "users-history.html"
]);

function isAllowedModule(moduleName) {
  return (
    typeof moduleName === "string" &&
    /^[a-z0-9_-]{1,80}\.html$/.test(moduleName) &&
    !SUPERADMIN_ONLY_PAGES.has(moduleName)
  );
}


const ALLOWED_ACTIONS = new Set([
  "show",
  "view",
  "create",
  "edit",
  "delete",
  "block"
]);

app.patch(
  "/api/admin-profiles/:uid",
  requireAdmin,
  superOnly,
  async (req, res) => {
    try {
      const uid = req.params.uid;
      const profile = await adminProfile(uid);

      if (!profile || profile.role !== "siteadmin") {
        return fail(res, 403, "Only Site Admin can be edited");
      }

      const { displayName, siteIds, permissions } = req.body || {};

      if (
        typeof displayName !== "string" ||
        !displayName.trim() ||
        displayName.trim().length > 80
      ) {
        return fail(res, 400, "Invalid display name");
      }

      if (
        !Array.isArray(siteIds) ||
        siteIds.length > 20 ||
        new Set(siteIds).size !== siteIds.length ||
        !siteIds.every(id =>
          typeof id === "string" &&
          /^[a-z0-9_-]{1,48}$/.test(id)
        )
      ) {
        return fail(res, 400, "Invalid site assignments");
      }

      const siteData = (
        await db.ref("sites").once("value")
      ).val() || {};

      if (!siteIds.every(id => siteData[id]?.active === true)) {
        return fail(res, 400, "Site missing or inactive");
      }

      if (
        !permissions ||
        typeof permissions !== "object" ||
        Array.isArray(permissions)
      ) {
        return fail(res, 400, "Invalid permissions");
      }

      const cleanPermissions = {};

      for (const [moduleName, actions] of Object.entries(permissions)) {
        if (
          !isAllowedModule(moduleName) ||
          !Array.isArray(actions) ||
          !actions.every(action =>
  action === "refresh" || ALLOWED_ACTIONS.has(action)
)
        ) {
          return fail(res, 400, "Invalid module permissions");
        }

       const uniqueActions = [
  ...new Set(actions.filter(action => action !== "refresh"))
];

const requiresView = uniqueActions.some(action =>
["create", "edit", "delete", "block"].includes(action)
);

if (requiresView && !uniqueActions.includes("view")) {
  return fail(
    res,
    400,
   "View permission is required for Create, Edit, Delete or Block"
  );
}

if (uniqueActions.length > 0) {
  const firebaseKey = moduleName.replace(/\.html$/, "_html");
cleanPermissions[firebaseKey] = uniqueActions;
}
      }

      await db.ref(`adminUsers/${uid}`).update({
        displayName: displayName.trim(),
        siteIds,
        permissions: cleanPermissions,
        updatedAt: now(),
        updatedBy: req.admin.uid
      });

      return res.json({
        ok: true,
        message: "Admin permissions updated"
      });

    } catch (error) {
      console.error("Update admin permissions:", error.message);
      return fail(res, 500, "Cannot update permissions");
    }
  }
);
/* =====================================================
   SITE MANAGEMENT API — SUPERADMIN ONLY
   ===================================================== */

const siteIdOK = id => /^[a-z0-9_-]{1,48}$/.test(id);

function validateSite(body) {
  const name = String(body?.name || "").trim();
  const walletGroupId = body?.walletGroupId == null ||
    body.walletGroupId === ""
    ? null
    : String(body.walletGroupId).trim();

  if (!name || name.length > 100) {
    throw Error("Site name must be 1–100 characters");
  }

  if (
    walletGroupId !== null &&
    !/^[a-zA-Z0-9_-]{1,60}$/.test(walletGroupId)
  ) {
    throw Error("Invalid wallet group ID");
  }

  if (typeof body?.active !== "boolean") {
    throw Error("Site status must be true or false");
  }

  return { name, walletGroupId, active: body.active };
}

app.get(
  "/api/link-download/sites",
  requireAdmin,
  requirePermission("linkdownload.html", "view"),
  async (req, res) => {
    try {
      const snapshot = await db.ref("sites").once("value");
      const allSites = snapshot.val() || {};

      const sites = Object.entries(allSites)
        .filter(([, site]) => site?.active === true)
        .map(([id, site]) => ({
          id,
          name: site.name || id,
          active: true
        }));

      return res.json({ ok: true, sites });
    } catch (error) {
      console.error("Link Download sites:", error);
      return fail(res, 500, "Cannot load sites");
    }
  }
);
/* =====================================================
   LINK DOWNLOAD - SAVE CARD WITH POSITION
   ===================================================== */

app.post(
  "/api/link-download/save-position",
  requireAdmin,
  async (req, res) => {
    try {
      const id = req.body?.id || null;
      const record = req.body?.record;
      const position = Number(req.body?.position);

      if (req.admin.profile.role !== "superadmin") {
        return fail(res, 403, "Super Admin only");
      }

      if (
        !Number.isSafeInteger(position) ||
        position < 1 ||
        position > 100000
      ) {
        return fail(res, 400, "Invalid card position");
      }

      if (
        id !== null &&
        (typeof id !== "string" ||
          !/^[A-Za-z0-9_-]{1,128}$/.test(id))
      ) {
        return fail(res, 400, "Invalid card ID");
      }

      if (
        !record ||
        typeof record !== "object" ||
        Array.isArray(record)
      ) {
        return fail(res, 400, "Invalid card data");
      }

      const name = String(record.name || "").trim();
      const platform = String(record.platform || "").trim();
      const image = String(record.image || "").trim();

      if (
        !name ||
        name.length > 120 ||
        !platform ||
        platform.length > 100 ||
        (image && !/^https:\/\//i.test(image))
      ) {
        return fail(res, 400, "Invalid card information");
      }

      if (
        typeof record.active !== "boolean" ||
        !Array.isArray(record.links) ||
        record.links.length < 1 ||
        record.links.length > 100
      ) {
        return fail(res, 400, "Invalid card links");
      }

      const links = [];

      for (const link of record.links) {
        const label = String(link?.label || "").trim();
        const url = String(link?.url || "").trim();
        const action = link?.action;

        if (
          !label ||
          label.length > 200 ||
          typeof link?.enabled !== "boolean" ||
          !["copy", "open"].includes(action) ||
          (link.enabled && !/^https?:\/\//i.test(url))
        ) {
          return fail(res, 400, "Invalid link row");
        }

        links.push({
          label,
          url,
          action,
          enabled: link.enabled
        });
      }

      const siteVisibility = {};

      if (
        record.siteVisibility &&
        typeof record.siteVisibility === "object" &&
        !Array.isArray(record.siteVisibility)
      ) {
        for (const [siteId, visible] of Object.entries(
          record.siteVisibility
        )) {
          if (
            !/^[A-Za-z0-9_-]{1,128}$/.test(siteId) ||
            typeof visible !== "boolean"
          ) {
            return fail(res, 400, "Invalid site visibility");
          }

          siteVisibility[siteId] = visible;
        }
      }

const rootRef = db.ref("download_links/cards");
const cardId = id || rootRef.push().key;
const timestamp = Date.now();

// Baca data sebenar sebelum memulakan transaction.
const initialSnapshot = await rootRef.once("value");
const initialRecords = initialSnapshot.val() || {};

if (id && !initialRecords[id]) {
  return fail(res, 404, "Card not found. Please refresh.");
}
const result = await rootRef.transaction(current => {

  const all = current === null
    ? initialRecords
    : current;

  if (id && !all[id]) return;
  if (!id && all[cardId]) return;

        const previous = id ? all[id] : null;

        const updated = {
          name,
          platform,
          image,
          active: record.active,
          siteVisibility,
          links,
          createdAt: previous?.createdAt ?? timestamp,
          updatedAt: timestamp
        };

        const items = Object.entries(all)
          .filter(([key, card]) =>
            key !== cardId &&
            card &&
            typeof card === "object"
          )
          .sort((a, b) =>
            (Number(a[1].order) || 9999) -
            (Number(b[1].order) || 9999) ||
            a[0].localeCompare(b[0])
          );

        const target = Math.max(
          0,
          Math.min(position - 1, items.length)
        );

        items.splice(target, 0, [cardId, updated]);

        const next = { ...all };

        items.forEach(([key, card], index) => {
          next[key] = {
            ...card,
            order: index + 1
          };
        });

        return next;
      }, undefined, false);

      if (!result.committed) {
        return fail(
          res,
          409,
          "Card changed. Please refresh and retry."
        );
      }

      return res.json({
        ok: true,
        id: cardId,
        message: "Card position saved"
      });

    } catch (error) {
      console.error("Link Download save position:", error);
      return fail(res, 500, "Cannot save card position");
    }
  }
);
/* =====================================================
   TIPS GAME — SITE VISIBILITY + PERMISSIONS
   ===================================================== */

const TIPS_PATH = "tips_game/platforms";
const TIPS_MODULE = "tipsgame.html";

function tipsVisible(record, profile) {
  if (profile.role === "superadmin") return true;
  if (record?.active === false) return false;

  const siteIds = Array.isArray(profile.siteIds)
    ? profile.siteIds
    : [];

  if (record?.visibleToAllSites === true) {
    return siteIds.length > 0;
  }

  return siteIds.some(id =>
    record?.siteVisibility?.[id] === true
  );
}

function validateTipsPayload(body) {
  const name = String(body?.name || "").trim();
  const games = body?.games;

const position = Number(body?.position);

if (
  !Number.isSafeInteger(position) ||
  position < 1 ||
  position > 100000
) {
  throw Error("Invalid platform position");
}
         
  if (!name || name.length > 100) {
    throw Error("Invalid platform name");
  }

  if (
!Array.isArray(games) ||
games.length < 1 ||
games.length > 3000 ||
!games.every(g =>
  typeof g === "string" &&
  g.trim().length > 0 &&
  g.length <= 150
)
  ) {
    throw Error("Invalid games list");
  }

  if (
    typeof body?.active !== "boolean" ||
    typeof body?.visibleToAllSites !== "boolean"
  ) {
    throw Error("Invalid visibility settings");
  }

  const siteVisibility = body?.siteVisibility || {};

  if (
    !siteVisibility ||
    typeof siteVisibility !== "object" ||
    Array.isArray(siteVisibility) ||
    Object.keys(siteVisibility).length > 100 ||
    !Object.entries(siteVisibility).every(([id, value]) =>
      /^[a-z0-9_-]{1,48}$/.test(id) &&
      typeof value === "boolean"
    )
  ) {
    throw Error("Invalid site visibility");
  }

  return {
    name,
    games: games.map(g => g.trim()),
    active: body.active,
    visibleToAllSites: body.visibleToAllSites,
    siteVisibility,
    position
  };
}

async function validateTipsSites(siteVisibility) {
  const sites = (
    await db.ref("sites").once("value")
  ).val() || {};

  return Object.keys(siteVisibility).every(id =>
    sites[id]?.active === true
  );
}

function reorderTipsPlatforms(records, id, data) {
  const items = Object.entries(records || {})
    .filter(([key]) => key !== id)
    .sort((a, b) =>
      (a[1].order ?? 9999) - (b[1].order ?? 9999) ||
      String(a[1].name || "").localeCompare(
        String(b[1].name || "")
      )
    );

  const position = Math.max(
    1,
    Math.min(data.position, items.length + 1)
  );

  const { position: _position, ...fields } = data;

  const existing = records?.[id] || {};
  items.splice(position - 1, 0, [
    id,
    { ...existing, ...fields }
  ]);

  return Object.fromEntries(
    items.map(([key, record], index) => [
      key,
      { ...record, order: index + 1 }
    ])
  );
}

// Site list for custom chips
app.get(
  "/api/tips-game/sites",
  requireAdmin,
  requirePermission(TIPS_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (
        await db.ref("sites").once("value")
      ).val() || {};

      const sites = Object.entries(all)
        .filter(([, s]) => s?.active === true)
        .map(([id, s]) => ({
          id,
          name: s.name || id
        }));

      return res.json({ ok: true, sites });
    } catch (error) {
      console.error("Tips sites:", error);
      return fail(res, 500, "Cannot load sites");
    }
  }
);

// Read platforms filtered by assigned sites
app.get(
  "/api/tips-game/platforms",
  requireAdmin,
  requirePermission(TIPS_MODULE, "view"),
  async (req, res) => {
    try {
      const records = (
        await db.ref(TIPS_PATH).once("value")
      ).val() || {};

      const platforms = Object.entries(records)
        .filter(([, record]) =>
          tipsVisible(record, req.admin.profile)
        )
        .map(([id, record]) => ({
          id,
          ...record
        }));

      return res.json({ ok: true, platforms });
    } catch (error) {
      console.error("Tips list:", error);
      return fail(res, 500, "Cannot load platforms");
    }
  }
);


 // Create platform
app.post(
  "/api/tips-game/platforms",
  requireAdmin,
  requirePermission(TIPS_MODULE, "create"),
  async (req, res) => {
    try {
      const data = validateTipsPayload(req.body);

      if (!(await validateTipsSites(data.siteVisibility))) {
        return fail(res, 400, "Invalid site selection");
      }

      const ref = db.ref(TIPS_PATH).push();
      const timestamp = now();

      const rootRef = db.ref(TIPS_PATH);
      const initial = (await rootRef.once("value")).val() || {};

      const result = await rootRef.transaction(records => {
        if (records === null) records = initial;

        // Jangan cipta semula ID jika sudah wujud.
        if (records[ref.key]) return;

        return reorderTipsPlatforms(records, ref.key, {
          ...data,
          createdAt: timestamp,
          createdBy: req.admin.uid,
          updatedAt: timestamp,
          updatedBy: req.admin.uid
        });
      }, undefined, false);

      if (!result.committed) {
        return fail(res, 409, "Cannot create platform");
      }

      return res.status(201).json({
        ok: true,
        id: ref.key
      });
    } catch (error) {
      console.error("Tips create:", error);
      return fail(res, 400, error.message);
    }
  }
);



 // Edit platform
app.patch(
  "/api/tips-game/platforms/:id",
  requireAdmin,
  requirePermission(TIPS_MODULE, "edit"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
        return fail(res, 400, "Invalid platform ID");
      }

      const ref = db.ref(`${TIPS_PATH}/${id}`);
      const snapshot = await ref.once("value");

      if (!snapshot.exists()) {
        return fail(res, 404, "Platform not found");
      }

      if (!tipsVisible(snapshot.val(), req.admin.profile)) {
        return fail(res, 403, "Platform access denied");
      }

      const data = validateTipsPayload(req.body);

      if (!(await validateTipsSites(data.siteVisibility))) {
        return fail(res, 400, "Invalid site selection");
      }

      const rootRef = db.ref(TIPS_PATH);
      const initial = (await rootRef.once("value")).val() || {};
      const updatedAt = now();

      if (!initial[id]) {
        return fail(res, 404, "Platform not found");
      }

      const result = await rootRef.transaction(records => {
        if (records === null) records = initial;

        if (!records || !records[id]) return;

        // Pastikan platform masih boleh diakses.
        if (!tipsVisible(records[id], req.admin.profile)) {
          return;
        }

        return reorderTipsPlatforms(records, id, {
          ...data,
          updatedAt,
          updatedBy: req.admin.uid
        });
      }, undefined, false);

      if (!result.committed) {
        console.warn("[TIPS EDIT CONFLICT]", {
          id,
          existedInitially: Boolean(initial[id])
        });

        return fail(res, 409, "Platform changed or deleted");
      }

      return res.json({ ok: true });
    } catch (error) {
      console.error("Tips edit:", error);
      return fail(res, 400, error.message);
    }
  }
);


// Delete platform
app.delete(
  "/api/tips-game/platforms/:id",
  requireAdmin,
  requirePermission(TIPS_MODULE, "delete"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
        return fail(res, 400, "Invalid platform ID");
      }

      const ref = db.ref(`${TIPS_PATH}/${id}`);
      const snapshot = await ref.once("value");

      if (!snapshot.exists()) {
        return fail(res, 404, "Platform not found");
      }

      if (!tipsVisible(snapshot.val(), req.admin.profile)) {
        return fail(res, 403, "Platform access denied");
      }

      await ref.remove();

      return res.json({ ok: true });
    } catch (error) {
      console.error("Tips delete:", error);
      return fail(res, 500, "Cannot delete platform");
    }
  }
);

/* =====================================================
   ITEM COLLECTION — SITE VISIBILITY + PERMISSIONS
   ===================================================== */

const ITEM_PATH = "item_collection/items";
const ITEM_MODULE = "item.html";

const itemIdOK = id =>
  /^[A-Za-z0-9_-]{1,128}$/.test(id);

const itemSiteIds = profile =>
  Array.isArray(profile.siteIds) ? profile.siteIds : [];

// Tentukan item yang boleh dilihat Site Admin
function itemVisible(item, profile) {
  if (profile.role === "superadmin") return true;

  if (item?.active === false) return false;

  const ids = itemSiteIds(profile);

  return ids.length > 0 && (
    item?.visibleToAllSites === true ||
    ids.some(id => item?.siteVisibility?.[id] === true)
  );
}

// Validate data Create / Edit
function validateItemPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw Error("Invalid item");
  }

  const title = typeof body.title === "string"
    ? body.title.trim() : "";

  const collection = typeof body.collection === "string"
    ? body.collection.trim() : "";

  const code = typeof body.code === "string"
    ? body.code.trim() : "";

  const tag = typeof body.tag === "string"
    ? body.tag.trim() : "";

  const img = typeof body.img === "string"
    ? body.img.trim() : "";

  if (!title || title.length > 120) {
    throw Error("Invalid item name");
  }

  if (!collection || collection.length > 100) {
    throw Error("Invalid collection");
  }

  if (code.length > 120 || tag.length > 120) {
    throw Error("Invalid code or tags");
  }

  if (
    img.length > 2048 ||
    !/^https:\/\/[^\s]+$/i.test(img)
  ) {
    throw Error("Invalid image URL");
  }

  if (
    typeof body.active !== "boolean" ||
    typeof body.visibleToAllSites !== "boolean"
  ) {
    throw Error("Invalid active settings");
  }

  const visibility = body.siteVisibility ?? {};

  if (
    !visibility ||
    typeof visibility !== "object" ||
    Array.isArray(visibility) ||
    Object.keys(visibility).length > 100 ||
    !Object.entries(visibility).every(
      ([id, enabled]) =>
        siteIdOK(id) &&
        typeof enabled === "boolean"
    )
  ) {
    throw Error("Invalid site visibility");
  }

  return {
    title,
    collection,
    code,
    tag,
    img,
    active: body.active,
    visibleToAllSites: body.visibleToAllSites,
    siteVisibility: visibility
  };
}

// Pastikan site yang dipilih sah
async function itemValidateSites(data, profile, oldItem = null) {
  const sites = (
    await db.ref("sites").once("value")
  ).val() || {};

  if (
    !Object.keys(data.siteVisibility).every(
      id => sites[id]?.active === true
    )
  ) {
    throw Error("Invalid site selection");
  }

  if (profile.role !== "superadmin") {
    const assigned = itemSiteIds(profile);

    if (
      !assigned.length ||
      data.visibleToAllSites === true ||
      Object.keys(data.siteVisibility).some(
        id => !assigned.includes(id)
      )
    ) {
      throw Error("Site visibility outside assigned sites");
    }

    if (oldItem?.visibleToAllSites === true) {
      throw Error("Global item can only be edited by Super Admin");
    }
  }
}

// GET — Site dropdown chips
app.get(
  "/api/item-collection/sites",
  requireAdmin,
  requirePermission(ITEM_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (
        await db.ref("sites").once("value")
      ).val() || {};

      const assigned = itemSiteIds(req.admin.profile);

      const sites = Object.entries(all)
        .filter(([id, site]) =>
          site?.active === true &&
          (
            req.admin.profile.role === "superadmin" ||
            assigned.includes(id)
          )
        )
        .map(([id, site]) => ({
          id,
          name: site.name || id
        }));

      return res.json({ ok: true, sites });

    } catch (error) {
      console.error("Item sites:", error);
      return fail(res, 500, "Cannot load sites");
    }
  }
);

// GET — Item list
app.get(
  "/api/item-collection/items",
  requireAdmin,
  requirePermission(ITEM_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (
        await db.ref(ITEM_PATH).once("value")
      ).val() || {};

      const items = Object.entries(all)
        .filter(([, item]) =>
          itemVisible(item, req.admin.profile)
        )
        .map(([id, item]) => ({
          id,
          ...item
        }));

      return res.json({ ok: true, items });

    } catch (error) {
      console.error("Item list:", error);
      return fail(res, 500, "Cannot load items");
    }
  }
);

// POST — Create Item
app.post(
  "/api/item-collection/items",
  requireAdmin,
  requirePermission(ITEM_MODULE, "create"),
  async (req, res) => {
    try {
      const data = validateItemPayload(req.body);

      await itemValidateSites(data, req.admin.profile);

      const ref = db.ref(ITEM_PATH).push();

      await ref.set({
        ...data,
        createdAt: now(),
        updatedAt: now(),
        createdBy: req.admin.uid
      });

      return res.status(201).json({
        ok: true,
        id: ref.key
      });

    } catch (error) {
      console.error("Item create:", error);
      return fail(res, 400, error.message);
    }
  }
);

// PATCH — Edit Item / Active / Inactive
app.patch(
  "/api/item-collection/items/:id",
  requireAdmin,
  requirePermission(ITEM_MODULE, "edit"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!itemIdOK(id)) {
        return fail(res, 400, "Invalid item ID");
      }

      const ref = db.ref(`${ITEM_PATH}/${id}`);
      const snap = await ref.once("value");

      if (!snap.exists()) {
        return fail(res, 404, "Item not found");
      }

      const old = snap.val();

      if (!itemVisible(old, req.admin.profile)) {
        return fail(res, 403, "Item access denied");
      }

      const data = validateItemPayload(req.body);

      await itemValidateSites(
        data,
        req.admin.profile,
        old
      );

      await ref.update({
        ...data,
        updatedAt: now(),
        updatedBy: req.admin.uid
      });

      return res.json({ ok: true });

    } catch (error) {
      console.error("Item edit:", error);
      return fail(res, 400, error.message);
    }
  }
);

// DELETE — Delete Item
app.delete(
  "/api/item-collection/items/:id",
  requireAdmin,
  requirePermission(ITEM_MODULE, "delete"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!itemIdOK(id)) {
        return fail(res, 400, "Invalid item ID");
      }

      const ref = db.ref(`${ITEM_PATH}/${id}`);
      const snap = await ref.once("value");

      if (!snap.exists()) {
        return fail(res, 404, "Item not found");
      }

      if (!itemVisible(snap.val(), req.admin.profile)) {
        return fail(res, 403, "Item access denied");
      }

      await ref.remove();

      return res.json({ ok: true });

    } catch (error) {
      console.error("Item delete:", error);
      return fail(res, 500, "Cannot delete item");
    }
  });

/* =====================================================
   GAME LOGO — BACKEND CRUD + SITE PERMISSIONS
   ===================================================== */

const GAME_LOGO_PATH = "game_logos";
const GAME_LOGO_MODULE = "logogame.html";

function gameLogoVisible(logo, profile) {
  if (profile.role === "superadmin") return true;
  if (logo?.active === false) return false;

  const assigned = Array.isArray(profile.siteIds)
    ? profile.siteIds : [];

  return assigned.length > 0 && (
    logo?.visibleToAllSites === true ||
    assigned.some(id => logo?.siteVisibility?.[id] === true)
  );
}

function gameLogoData(body) {
  const name = String(body?.name ?? "").trim();
  const alias = String(body?.alias ?? "").trim();
  const type = String(body?.type ?? "").trim();
  const image = String(body?.image ?? "").trim();
  const platform = body?.platform;

  if (!name || name.length > 120 ||
      !alias || alias.length > 120) {
    throw Error("Invalid game name or alias");
  }

  if (!["slot", "live", "table"].includes(type)) {
    throw Error("Invalid method");
  }

  if (!Array.isArray(platform) ||
      !platform.length || platform.length > 20 ||
      !platform.every(p =>
        typeof p === "string" &&
        /^[a-z0-9_-]{1,48}$/.test(p)
      )) {
    throw Error("Invalid platforms");
  }

  if (!/^https:\/\/[^\s]+$/i.test(image) ||
      image.length > 2048) {
    throw Error("Invalid image URL");
  }

  if (typeof body.active !== "boolean" ||
      typeof body.visibleToAllSites !== "boolean") {
    throw Error("Invalid status");
  }

  const siteVisibility = body.siteVisibility ?? {};

  if (!siteVisibility ||
      typeof siteVisibility !== "object" ||
      Array.isArray(siteVisibility) ||
      Object.keys(siteVisibility).length > 100 ||
      !Object.entries(siteVisibility).every(
        ([id, enabled]) =>
          siteIdOK(id) && enabled === true
      )) {
    throw Error("Invalid Site Visibility");
  }

  if (!body.visibleToAllSites &&
      !Object.keys(siteVisibility).length) {
    throw Error("Select at least one site");
  }

  return {
    name, alias, type,
    platform: [...new Set(platform)],
    image,
    active: body.active,
    visibleToAllSites: body.visibleToAllSites,
    siteVisibility
  };
}

async function gameLogoCheckSites(data, profile, old = null) {
  const sites = (
    await db.ref("sites").once("value")
  ).val() || {};

  const ids = Object.keys(data.siteVisibility);

  if (!ids.every(id => sites[id]?.active === true)) {
    throw Error("Selected site is invalid or inactive");
  }

  if (profile.role !== "superadmin") {
    const assigned = Array.isArray(profile.siteIds)
      ? profile.siteIds : [];

    if (!assigned.length ||
        data.visibleToAllSites ||
        ids.some(id => !assigned.includes(id))) {
      throw Error("Site selection not permitted");
    }

    if (old?.visibleToAllSites === true) {
      throw Error("Global logo is managed by Super Admin");
    }
  }
}

app.get(
  "/api/game-logos/sites",
  requireAdmin,
  requirePermission(GAME_LOGO_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (
        await db.ref("sites").once("value")
      ).val() || {};

      const profile = req.admin.profile;
      const assigned = Array.isArray(profile.siteIds)
        ? profile.siteIds : [];

      const sites = Object.entries(all)
        .filter(([id, site]) =>
          site?.active === true &&
          (profile.role === "superadmin" ||
           assigned.includes(id))
        )
        .map(([id, site]) => ({
          id,
          name: site.name || id
        }));

      res.json({ok:true, sites});
    } catch (e) {
      console.error("Game logo sites", e);
      fail(res, 500, "Cannot load sites");
    }
  }
);

app.get(
  "/api/game-logos",
  requireAdmin,
  requirePermission(GAME_LOGO_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (
        await db.ref(GAME_LOGO_PATH).once("value")
      ).val() || {};

      const logos = Object.entries(all)
        .filter(([, logo]) =>
          gameLogoVisible(logo, req.admin.profile)
        )
        .map(([id, logo]) => ({...logo, id}));

      res.json({ok:true, logos});
    } catch (e) {
      console.error("Game logos", e);
      fail(res, 500, "Cannot load game logos");
    }
  }
);

app.post(
  "/api/game-logos",
  requireAdmin,
  requirePermission(GAME_LOGO_MODULE, "create"),
  async (req, res) => {
    try {
      const data = gameLogoData(req.body);
      await gameLogoCheckSites(data, req.admin.profile);

      const ref = db.ref(GAME_LOGO_PATH).push();
      await ref.set({
        ...data,
        createdAt: now(),
        updatedAt: now(),
        createdBy: req.admin.uid
      });

      res.status(201).json({ok:true, id:ref.key});
    } catch (e) {
      console.error("Create game logo", e);
      fail(res, 400, e.message);
    }
  }
);

app.patch(
  "/api/game-logos/:id",
  requireAdmin,
  requirePermission(GAME_LOGO_MODULE, "edit"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
        return fail(res, 400, "Invalid logo ID");
      }

      const ref = db.ref(`${GAME_LOGO_PATH}/${id}`);
      const snap = await ref.once("value");

      if (!snap.exists()) {
        return fail(res, 404, "Logo not found");
      }

      const old = snap.val();

      if (!gameLogoVisible(old, req.admin.profile)) {
        return fail(res, 403, "Logo access denied");
      }

      const data = gameLogoData(req.body);
      await gameLogoCheckSites(
        data, req.admin.profile, old
      );

      await ref.update({
        ...data,
        updatedAt: now(),
        updatedBy: req.admin.uid
      });

      res.json({ok:true});
    } catch (e) {
      console.error("Edit game logo", e);
      fail(res, 400, e.message);
    }
  }
);

app.delete(
  "/api/game-logos/:id",
  requireAdmin,
  requirePermission(GAME_LOGO_MODULE, "delete"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
        return fail(res, 400, "Invalid logo ID");
      }

      const ref = db.ref(`${GAME_LOGO_PATH}/${id}`);
      const snap = await ref.once("value");

      if (!snap.exists()) {
        return fail(res, 404, "Logo not found");
      }

      if (!gameLogoVisible(snap.val(), req.admin.profile)) {
        return fail(res, 403, "Logo access denied");
      }

      await ref.remove();
      res.json({ok:true});
    } catch (e) {
      console.error("Delete game logo", e);
      fail(res, 500, "Cannot delete logo");
    }
  }
);

/* =====================================================
   FIND GAME — API, SITE VISIBILITY & PERMISSIONS
   ===================================================== */

const FIND_GAME_PATH = "find_game/games";
const FIND_GAME_MODULE = "findgame.html";

function fgServerVisible(game, profile) {
  if (profile.role === "superadmin") return true;
  if (game?.active === false) return false;

  const assigned = Array.isArray(profile.siteIds)
    ? profile.siteIds : [];

  return assigned.length > 0 && (
    game?.visibleToAllSites === true ||
    assigned.some(id => game?.siteVisibility?.[id] === true)
  );
}

function fgServerValidate(body) {
  const name = String(body?.name ?? "").trim();
  const alias = String(body?.alias ?? "").trim();
  const type = String(body?.type ?? "").trim();
  const payline = body?.payline;
  const tags = body?.tags;
  const bets = body?.bets;
  const image = String(body?.image ?? "").trim();
  const active = body?.active;
  const visibleToAllSites = body?.visibleToAllSites;
  const siteVisibility = body?.siteVisibility ?? {};

  if (!name || name.length > 120 || alias.length > 120) {
    throw Error("Invalid game name or alias");
  }

  if (!["Slot", "Live Game", "Table"].includes(type)) {
    throw Error("Invalid game type");
  }


if (!Number.isInteger(payline) ||
    payline < 1 || payline > 5000) {
  throw Error("Invalid paylines");
}

  if (!Array.isArray(tags) ||
      !tags.length || tags.length > 30 ||
      !tags.every(t =>
        typeof t === "string" &&
        /^[a-z0-9_-]{1,48}$/.test(t)
      )) {
    throw Error("Invalid platforms");
  }

  if (!bets || typeof bets !== "object" ||
      Array.isArray(bets) ||
      !Object.keys(bets).length ||
      Object.keys(bets).length > 1000) {
    throw Error("Invalid bet values");
  }

  for (const [line, values] of Object.entries(bets)) {
    const number = Number(line);

    if (!/^[1-9]\d*$/.test(line) ||
        !Number.isInteger(number) ||
        number > payline ||
        !Array.isArray(values) ||
        !values.length ||
        values.length > 200 ||
        values.some(v =>
          typeof v !== "number" ||
          !Number.isFinite(v) || v <= 0
        )) {
      throw Error("Invalid bet line: " + line);
    }
  }

  if (!/^https:\/\/[^\s]+$/i.test(image) ||
      image.length > 2048) {
    throw Error("Invalid image URL");
  }

  if (typeof body?.adjustable !== "boolean" ||
      typeof active !== "boolean" ||
      typeof visibleToAllSites !== "boolean") {
    throw Error("Invalid game status");
  }

  if (!siteVisibility ||
      typeof siteVisibility !== "object" ||
      Array.isArray(siteVisibility) ||
      Object.keys(siteVisibility).length > 100 ||
      !Object.entries(siteVisibility).every(
        ([id, value]) => siteIdOK(id) && value === true
      )) {
    throw Error("Invalid site visibility");
  }

  if (!visibleToAllSites &&
      !Object.keys(siteVisibility).length) {
    throw Error("Select at least one site");
  }

  return {
    name, alias, type, payline,
    adjustable: body.adjustable,
    tags: [...new Set(tags)],
    bets, image, active,
    visibleToAllSites,
    siteVisibility
  };
}

async function fgServerCheckSites(data, profile, old = null) {
  const sites = (
    await db.ref("sites").once("value")
  ).val() || {};

  const ids = Object.keys(data.siteVisibility);

  if (!ids.every(id => sites[id]?.active === true)) {
    throw Error("Site missing or inactive");
  }

  if (profile.role !== "superadmin") {
    const assigned = Array.isArray(profile.siteIds)
      ? profile.siteIds : [];

    if (!assigned.length ||
        data.visibleToAllSites ||
        ids.some(id => !assigned.includes(id))) {
      throw Error("Site selection not permitted");
    }

    if (old?.visibleToAllSites === true) {
      throw Error("Global game is managed by Super Admin");
    }
  }
}

app.get(
  "/api/find-game/sites",
  requireAdmin,
  requirePermission(FIND_GAME_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (
        await db.ref("sites").once("value")
      ).val() || {};

      const profile = req.admin.profile;
      const assigned = Array.isArray(profile.siteIds)
        ? profile.siteIds : [];

      const sites = Object.entries(all)
        .filter(([id, site]) =>
          site?.active === true &&
          (profile.role === "superadmin" ||
           assigned.includes(id))
        )
        .map(([id, site]) => ({
          id,
          name: site.name || id
        }));

      return res.json({ok:true, sites});
    } catch (error) {
      console.error("Find Game sites:", error);
      return fail(res, 500, "Cannot load sites");
    }
  }
);

app.get(
  "/api/find-game/games",
  requireAdmin,
  requirePermission(FIND_GAME_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (
        await db.ref(FIND_GAME_PATH).once("value")
      ).val() || {};

      const games = Object.entries(all)
        .filter(([, game]) =>
          fgServerVisible(game, req.admin.profile)
        )
        .map(([id, game]) => ({...game, id}));

      return res.json({ok:true, games});
    } catch (error) {
      console.error("Find Game list:", error);
      return fail(res, 500, "Cannot load games");
    }
  }
);

app.post(
  "/api/find-game/games",
  requireAdmin,
  requirePermission(FIND_GAME_MODULE, "create"),
  async (req, res) => {
    try {
      const data = fgServerValidate(req.body);
      await fgServerCheckSites(data, req.admin.profile);

      const ref = db.ref(FIND_GAME_PATH).push();

      await ref.set({
        ...data,
        createdAt: now(),
        updatedAt: now(),
        createdBy: req.admin.uid
      });

      return res.status(201).json({
        ok:true,
        id:ref.key
      });
    } catch (error) {
      console.error("Create Find Game:", error);
      return fail(res, 400, error.message);
    }
  }
);

app.patch(
  "/api/find-game/games/:id",
  requireAdmin,
  requirePermission(FIND_GAME_MODULE, "edit"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
        return fail(res, 400, "Invalid game ID");
      }

      const ref = db.ref(`${FIND_GAME_PATH}/${id}`);
      const snap = await ref.once("value");

      if (!snap.exists()) {
        return fail(res, 404, "Game not found");
      }

      const old = snap.val();

      if (!fgServerVisible(old, req.admin.profile)) {
        return fail(res, 403, "Game access denied");
      }

      const data = fgServerValidate(req.body);
      await fgServerCheckSites(
        data, req.admin.profile, old
      );

      await ref.update({
        ...data,
        updatedAt: now(),
        updatedBy: req.admin.uid
      });

      return res.json({ok:true});
    } catch (error) {
      console.error("Edit Find Game:", error);
      return fail(res, 400, error.message);
    }
  }
);

app.delete(
  "/api/find-game/games/:id",
  requireAdmin,
  requirePermission(FIND_GAME_MODULE, "delete"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
        return fail(res, 400, "Invalid game ID");
      }

      const ref = db.ref(`${FIND_GAME_PATH}/${id}`);
      const snap = await ref.once("value");

      if (!snap.exists()) {
        return fail(res, 404, "Game not found");
      }

      if (!fgServerVisible(snap.val(), req.admin.profile)) {
        return fail(res, 403, "Game access denied");
      }

      await ref.remove();
      return res.json({ok:true});
    } catch (error) {
      console.error("Delete Find Game:", error);
      return fail(res, 500, "Cannot delete game");
    }
  }
);

/* =====================================================
   918KISS GAME CATALOG — BACKEND CRUD
   ===================================================== */

const KISS_MODULE = "918kiss.html";
const KISS_PATH = "918kiss/games";

function kissVisible(game, profile) {
  if (profile.role === "superadmin") return true;
  if (game?.active === false) return false;

  // Legacy games: treated as global until migrated.
  if (game?.visibleToAllSites !== false) return true;

  const assigned = Array.isArray(profile.siteIds)
    ? profile.siteIds : [];

  return assigned.some(id =>
    game?.siteVisibility?.[id] === true
  );
}

function kissEditable(game, profile) {
  if (profile.role === "superadmin") return true;

  // Global and legacy games are superadmin-managed.
  if (game?.visibleToAllSites !== false) return false;

  const assigned = Array.isArray(profile.siteIds)
    ? profile.siteIds : [];

  const visibleSites = Object.keys(game?.siteVisibility || {})
    .filter(id => game.siteVisibility[id] === true);

  return visibleSites.length > 0 &&
    visibleSites.every(id => assigned.includes(id));
}

function kissValidate(body) {
  const name = String(body?.name || "").trim();
  const bets = body?.bets;
  const pecahan = body?.pecahan;
  const freeGameOptions = body?.freeGameOptions;
  const siteVisibility = body?.siteVisibility;

  if (!name || name.length > 120) {
    throw Error("Invalid game name");
  }

  if (!Array.isArray(bets) ||
      bets.length < 1 || bets.length > 200 ||
      bets.some(n => typeof n !== "number" ||
        !Number.isFinite(n) || n <= 0) ||
      new Set(bets).size !== bets.length) {
    throw Error("Invalid bets");
  }

  if (!pecahan || typeof pecahan !== "object" ||
      Array.isArray(pecahan)) {
    throw Error("Invalid win options");
  }

  if (Object.keys(pecahan).length !== bets.length ||
      bets.some(bet => {
        const values = pecahan[megaBetKey(bet)];
        return !Array.isArray(values) ||
          !values.length || values.length > 200 ||
          values.some(n => typeof n !== "number" ||
            !Number.isFinite(n) || n < 0);
      })) {
    throw Error("Invalid win options");
  }

  if (!Array.isArray(freeGameOptions) ||
      freeGameOptions.length > 10 ||
      freeGameOptions.some(n =>
        !Number.isSafeInteger(n) || n < 1 || n > 100)) {
    throw Error("Invalid Free Game Options");
  }

  if (typeof body?.active !== "boolean" ||
      typeof body?.visibleToAllSites !== "boolean") {
    throw Error("Invalid status");
  }

  if (!siteVisibility || typeof siteVisibility !== "object" ||
      Array.isArray(siteVisibility) ||
      Object.keys(siteVisibility).length > 100 ||
      !Object.entries(siteVisibility).every(
        ([id, value]) => siteIdOK(id) && value === true
      )) {
    throw Error("Invalid Site Visibility");
  }

  if (!body.visibleToAllSites &&
      !Object.keys(siteVisibility).length) {
    throw Error("Select at least one site");
  }

  return {
    name, bets, pecahan, freeGameOptions,
    active: body.active,
    visibleToAllSites: body.visibleToAllSites,
    siteVisibility
  };
}

async function kissCheckSites(data, profile) {
  const all = (await db.ref("sites").once("value")).val() || {};
  const ids = Object.keys(data.siteVisibility);

  if (!ids.every(id => all[id]?.active === true)) {
    throw Error("Site missing or inactive");
  }

  if (profile.role !== "superadmin") {
    const assigned = Array.isArray(profile.siteIds)
      ? profile.siteIds : [];

    if (data.visibleToAllSites ||
        !assigned.length ||
        ids.some(id => !assigned.includes(id))) {
      throw Error("Site selection not permitted");
    }
  }
}

app.get("/api/918kiss/access",
  requireAdmin,
  requirePermission(KISS_MODULE, "view"),
  (req, res) => {
    const p = req.admin.profile;
    const actions = p.role === "superadmin"
      ? ["show", "view", "create", "edit", "delete"]
      : p.permissions?.["918kiss_html"] || [];

    res.json({
      ok: true,
      role: p.role,
      actions
    });
  }
);

app.get("/api/918kiss/sites",
  requireAdmin,
  requirePermission(KISS_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (await db.ref("sites").once("value")).val() || {};
      const p = req.admin.profile;
      const assigned = Array.isArray(p.siteIds) ? p.siteIds : [];

      const sites = Object.entries(all)
        .filter(([id, site]) =>
          site?.active === true &&
          (p.role === "superadmin" || assigned.includes(id))
        )
        .map(([id, site]) => ({
          id, name: site.name || id
        }));

      return res.json({ok:true, sites});
    } catch (e) {
      console.error("918KISS sites", e);
      return fail(res, 500, "Cannot load sites");
    }
  }
);

app.get("/api/918kiss/games",
  requireAdmin,
  requirePermission(KISS_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (await db.ref(KISS_PATH).once("value")).val() || {};
      const games = Object.entries(all)
        .filter(([, game]) => kissVisible(game, req.admin.profile))
        .map(([id, game]) => ({...game, id}));

      return res.json({ok:true, games});
    } catch (e) {
      console.error("918KISS list", e);
      return fail(res, 500, "Cannot load games");
    }
  }
);

app.post("/api/918kiss/games",
  requireAdmin,
  requirePermission(KISS_MODULE, "create"),
  async (req, res) => {
    try {
      const data = kissValidate(req.body);
      await kissCheckSites(data, req.admin.profile);

      const all = (await db.ref(KISS_PATH).once("value")).val() || {};
      if (Object.values(all).some(game =>
        String(game?.name || "").toLowerCase() === data.name.toLowerCase()
      )) {
        return fail(res, 409, "Game name already exists");
      }

      const ref = db.ref(KISS_PATH).push();
      await ref.set({
        ...data,
        createdAt: now(),
        updatedAt: now()
      });

      return res.status(201).json({ok:true, id:ref.key});
    } catch (e) {
      return fail(res, 400, e.message);
    }
  }
);

app.patch("/api/918kiss/games/:id",
  requireAdmin,
  requirePermission(KISS_MODULE, "edit"),
  async (req, res) => {
    try {
      const id = req.params.id;
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
        return fail(res, 400, "Invalid game ID");
      }

      const ref = db.ref(`${KISS_PATH}/${id}`);
      const old = (await ref.once("value")).val();
      if (!old) return fail(res, 404, "Game not found");

      if (!kissEditable(old, req.admin.profile)) {
        return fail(res, 403, "Game edit not permitted");
      }

      const data = kissValidate(req.body);
      await kissCheckSites(data, req.admin.profile);

      const all = (await db.ref(KISS_PATH).once("value")).val() || {};
      if (Object.entries(all).some(([otherId, game]) =>
        otherId !== id &&
        String(game?.name || "").toLowerCase() === data.name.toLowerCase()
      )) {
        return fail(res, 409, "Game name already exists");
      }

      await ref.update({...data, updatedAt:now()});
      return res.json({ok:true});
    } catch (e) {
      return fail(res, 400, e.message);
    }
  }
);

app.delete("/api/918kiss/games/:id",
  requireAdmin,
  requirePermission(KISS_MODULE, "delete"),
  async (req, res) => {
    try {
      const id = req.params.id;
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
        return fail(res, 400, "Invalid game ID");
      }

      const ref = db.ref(`${KISS_PATH}/${id}`);
      const game = (await ref.once("value")).val();
      if (!game) return fail(res, 404, "Game not found");

      if (!kissEditable(game, req.admin.profile)) {
        return fail(res, 403, "Game delete not permitted");
      }

      await ref.remove();
      return res.json({ok:true});
    } catch (e) {
      console.error("918KISS delete", e);
      return fail(res, 500, "Cannot delete game");
    }
  }
);


/* =====================================================
   JILI GAME CATALOG — BACKEND CRUD
   ===================================================== */

const JILI_MODULE = "jilislot.html";
const JILI_PATH = "jili/games";

const jiliIdOK = id => /^[A-Za-z0-9_-]{1,128}$/.test(id);

function jiliVisible(game, profile) {
  if (profile.role === "superadmin") return true;
  if (game?.active === false) return false;

  const assigned = Array.isArray(profile.siteIds)
    ? profile.siteIds : [];

  if (!assigned.length) return false;

  // Game lama dianggap global sehingga dimigrasi.
  if (game?.visibleToAllSites !== false) return true;

  return assigned.some(id =>
    game?.siteVisibility?.[id] === true
  );
}

function jiliEditable(game, profile) {
  if (profile.role === "superadmin") return true;

  // Global dan legacy hanya boleh diurus Super Admin.
  if (game?.visibleToAllSites !== false) return false;

  const assigned = Array.isArray(profile.siteIds)
    ? profile.siteIds : [];

  const selected = Object.keys(game?.siteVisibility || {})
    .filter(id => game.siteVisibility[id] === true);

  return selected.length > 0 &&
    selected.every(id => assigned.includes(id));
}

function jiliValidate(body) {
  const name = String(body?.name || "").trim();
  const bets = body?.bets;
  const pecahan = body?.pecahan;
  const siteVisibility = body?.siteVisibility ?? {};

  if (!name || name.length > 120) {
    throw Error("Invalid game name");
  }

  if (
    !Array.isArray(bets) ||
    !bets.length ||
    bets.length > 200 ||
    bets.some(n => typeof n !== "number" ||
      !Number.isFinite(n) || n <= 0) ||
    new Set(bets).size !== bets.length
  ) {
    throw Error("Invalid bets");
  }

  if (
    !pecahan ||
    typeof pecahan !== "object" ||
    Array.isArray(pecahan) ||
    Object.keys(pecahan).length !== bets.length
  ) {
    throw Error("Invalid win options");
  }

  for (const bet of bets) {
    const values = pecahan[megaBetKey(bet)];

    if (
      !Array.isArray(values) ||
      !values.length ||
      values.length > 200 ||
      values.some(n =>
        typeof n !== "number" ||
        !Number.isFinite(n) ||
        n < 0
      )
    ) {
      throw Error("Invalid win values for bet " + bet);
    }
  }

  if (
    typeof body?.active !== "boolean" ||
    typeof body?.visibleToAllSites !== "boolean"
  ) {
    throw Error("Invalid game status");
  }

  if (
    !siteVisibility ||
    typeof siteVisibility !== "object" ||
    Array.isArray(siteVisibility) ||
    Object.keys(siteVisibility).length > 100 ||
    !Object.entries(siteVisibility).every(
      ([id, value]) => siteIdOK(id) && value === true
    )
  ) {
    throw Error("Invalid site visibility");
  }

  if (
    !body.visibleToAllSites &&
    !Object.keys(siteVisibility).length
  ) {
    throw Error("Select at least one site");
  }

  return {
    name,
    bets,
    pecahan,
    active: body.active,
    visibleToAllSites: body.visibleToAllSites,
    siteVisibility
  };
}

async function jiliCheckSites(data, profile) {
  const all = (await db.ref("sites").once("value")).val() || {};
  const ids = Object.keys(data.siteVisibility);

  if (!ids.every(id => all[id]?.active === true)) {
    throw Error("Site missing or inactive");
  }

  if (profile.role !== "superadmin") {
    const assigned = Array.isArray(profile.siteIds)
      ? profile.siteIds : [];

    if (
      !assigned.length ||
      data.visibleToAllSites ||
      ids.some(id => !assigned.includes(id))
    ) {
      throw Error("Site selection not permitted");
    }
  }
}

// GET — Current permissions
app.get(
  "/api/jili/access",
  requireAdmin,
  requirePermission(JILI_MODULE, "view"),
  (req, res) => {
    const p = req.admin.profile;

    const actions = p.role === "superadmin"
      ? ["show", "view", "create", "edit", "delete"]
      : p.permissions?.["jilislot_html"] || [];

    return res.json({ ok: true, role: p.role, actions });
  }
);

// GET — Available sites
app.get(
  "/api/jili/sites",
  requireAdmin,
  requirePermission(JILI_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (await db.ref("sites").once("value")).val() || {};
      const p = req.admin.profile;
      const assigned = Array.isArray(p.siteIds)
        ? p.siteIds : [];

      const sites = Object.entries(all)
        .filter(([id, site]) =>
          site?.active === true &&
          (p.role === "superadmin" || assigned.includes(id))
        )
        .map(([id, site]) => ({
          id,
          name: site.name || id
        }));

      return res.json({ ok: true, sites });
    } catch (e) {
      console.error("JILI sites:", e);
      return fail(res, 500, "Cannot load sites");
    }
  }
);

// GET — Games
app.get(
  "/api/jili/games",
  requireAdmin,
  requirePermission(JILI_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (await db.ref(JILI_PATH).once("value")).val() || {};

      const games = Object.entries(all)
        .filter(([, game]) => jiliVisible(game, req.admin.profile))
        .map(([id, game]) => ({ ...game, id }));

      return res.json({ ok: true, games });
    } catch (e) {
      console.error("JILI list:", e);
      return fail(res, 500, "Cannot load games");
    }
  }
);

// POST — Create Game
app.post(
  "/api/jili/games",
  requireAdmin,
  requirePermission(JILI_MODULE, "create"),
  async (req, res) => {
    try {
      const data = jiliValidate(req.body);
      await jiliCheckSites(data, req.admin.profile);

      const all = (await db.ref(JILI_PATH).once("value")).val() || {};

      if (Object.values(all).some(game =>
        String(game?.name || "").toLowerCase() ===
        data.name.toLowerCase()
      )) {
        return fail(res, 409, "Game name already exists");
      }

      const ref = db.ref(JILI_PATH).push();

      await ref.set({
        ...data,
        createdAt: now(),
        updatedAt: now(),
        createdBy: req.admin.uid
      });

      return res.status(201).json({ ok: true, id: ref.key });
    } catch (e) {
      console.error("JILI create:", e);
      return fail(res, 400, e.message);
    }
  }
);

// PATCH — Edit Game
app.patch(
  "/api/jili/games/:id",
  requireAdmin,
  requirePermission(JILI_MODULE, "edit"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!jiliIdOK(id)) {
        return fail(res, 400, "Invalid game ID");
      }

      const ref = db.ref(`${JILI_PATH}/${id}`);
      const old = (await ref.once("value")).val();

      if (!old) {
        return fail(res, 404, "Game not found");
      }

      if (!jiliEditable(old, req.admin.profile)) {
        return fail(res, 403, "Game edit not permitted");
      }

      const data = jiliValidate(req.body);
      await jiliCheckSites(data, req.admin.profile);

      const all = (await db.ref(JILI_PATH).once("value")).val() || {};

      if (Object.entries(all).some(([otherId, game]) =>
        otherId !== id &&
        String(game?.name || "").toLowerCase() ===
        data.name.toLowerCase()
      )) {
        return fail(res, 409, "Game name already exists");
      }

      await ref.update({
        ...data,
        updatedAt: now(),
        updatedBy: req.admin.uid
      });

      return res.json({ ok: true });
    } catch (e) {
      console.error("JILI edit:", e);
      return fail(res, 400, e.message);
    }
  }
);

// DELETE — Delete Game
app.delete(
  "/api/jili/games/:id",
  requireAdmin,
  requirePermission(JILI_MODULE, "delete"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!jiliIdOK(id)) {
        return fail(res, 400, "Invalid game ID");
      }

      const ref = db.ref(`${JILI_PATH}/${id}`);
      const game = (await ref.once("value")).val();

      if (!game) {
        return fail(res, 404, "Game not found");
      }

      if (!jiliEditable(game, req.admin.profile)) {
        return fail(res, 403, "Game delete not permitted");
      }

      await ref.remove();
      return res.json({ ok: true });
    } catch (e) {
      console.error("JILI delete:", e);
      return fail(res, 500, "Cannot delete game");
    }
  }
);

/* =====================================================
   END JILI GAME API
   ===================================================== */

/* =====================================================
   MEGA888 GAME CATALOG — BACKEND CRUD
   ===================================================== */

const MEGA_MODULE = "mega888.html";
const MEGA_PATH = "mega888/games";

function megaVisible(game, profile) {
  if (profile.role === "superadmin") return true;
  if (game?.active === false) return false;

  // Legacy games: global until migrated
  if (game?.visibleToAllSites !== false) return true;

  const assigned = Array.isArray(profile.siteIds)
    ? profile.siteIds : [];

  return assigned.some(id =>
    game?.siteVisibility?.[id] === true
  );
}

function megaEditable(game, profile) {
  if (profile.role === "superadmin") return true;

  // Global games can only be managed by Super Admin
  if (game?.visibleToAllSites !== false) return false;

  const assigned = Array.isArray(profile.siteIds)
    ? profile.siteIds : [];

  const visibleSites = Object.keys(game?.siteVisibility || {})
    .filter(id => game.siteVisibility[id] === true);

  return visibleSites.length > 0 &&
    visibleSites.every(id => assigned.includes(id));
}
function megaBetKey(bet) {
  return "bet_" + String(Number(bet)).replace(".", "_");
}
function megaValidate(body) {
  const name = String(body?.name || "").trim();
  const bets = body?.bets;
  const pecahan = body?.pecahan;
  const freeGameOptions = body?.freeGameOptions;
  const siteVisibility = body?.siteVisibility;

  if (!name || name.length > 120) {
    throw Error("Invalid game name");
  }

  if (!Array.isArray(bets) ||
      bets.length < 1 || bets.length > 200 ||
      bets.some(n => typeof n !== "number" ||
        !Number.isFinite(n) || n <= 0) ||
      new Set(bets).size !== bets.length) {
    throw Error("Invalid bets");
  }

  if (!pecahan || typeof pecahan !== "object" ||
      Array.isArray(pecahan)) {
    throw Error("Invalid win options");
  }

  if (Object.keys(pecahan).length !== bets.length ||
      bets.some(bet => {
       const values = pecahan[megaBetKey(bet)];
        return !Array.isArray(values) ||
          !values.length || values.length > 200 ||
          values.some(n => typeof n !== "number" ||
            !Number.isFinite(n) || n < 0);
      })) {
    throw Error("Invalid win options");
  }

  if (!Array.isArray(freeGameOptions) ||
      freeGameOptions.length > 10 ||
      freeGameOptions.some(n =>
        !Number.isSafeInteger(n) || n < 1 || n > 100)) {
    throw Error("Invalid Free Game Options");
  }

  if (typeof body?.active !== "boolean" ||
      typeof body?.visibleToAllSites !== "boolean") {
    throw Error("Invalid status");
  }

  if (!siteVisibility || typeof siteVisibility !== "object" ||
      Array.isArray(siteVisibility) ||
      Object.keys(siteVisibility).length > 100 ||
      !Object.entries(siteVisibility).every(
        ([id, value]) => siteIdOK(id) && value === true
      )) {
    throw Error("Invalid Site Visibility");
  }

  if (!body.visibleToAllSites &&
      !Object.keys(siteVisibility).length) {
    throw Error("Select at least one site");
  }

  return {
    name,
    bets,
    pecahan,
    freeGameOptions,
    active: body.active,
    visibleToAllSites: body.visibleToAllSites,
    siteVisibility
  };
}

async function megaCheckSites(data, profile) {
  const all = (await db.ref("sites").once("value")).val() || {};
  const ids = Object.keys(data.siteVisibility);

  if (!ids.every(id => all[id]?.active === true)) {
    throw Error("Site missing or inactive");
  }

  if (profile.role !== "superadmin") {
    const assigned = Array.isArray(profile.siteIds)
      ? profile.siteIds : [];

    if (data.visibleToAllSites ||
        !assigned.length ||
        ids.some(id => !assigned.includes(id))) {
      throw Error("Site selection not permitted");
    }
  }
}

/* ===== ACCESS ===== */

app.get(
  "/api/mega888/access",
  requireAdmin,
  requirePermission(MEGA_MODULE, "view"),
  (req, res) => {
    const p = req.admin.profile;

    const actions = p.role === "superadmin"
      ? ["show", "view", "create", "edit", "delete"]
      : p.permissions?.["mega888_html"] || [];

    return res.json({
      ok: true,
      role: p.role,
      actions
    });
  }
);

/* ===== SITES ===== */

app.get(
  "/api/mega888/sites",
  requireAdmin,
  requirePermission(MEGA_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (await db.ref("sites").once("value")).val() || {};
      const p = req.admin.profile;

      const assigned = Array.isArray(p.siteIds)
        ? p.siteIds : [];

      const sites = Object.entries(all)
        .filter(([id, site]) =>
          site?.active === true &&
          (
            p.role === "superadmin" ||
            assigned.includes(id)
          )
        )
        .map(([id, site]) => ({
          id,
          name: site.name || id
        }));

      return res.json({ ok: true, sites });

    } catch (e) {
      console.error("MEGA888 sites:", e);
      return fail(res, 500, "Cannot load sites");
    }
  }
);

/* ===== LIST GAMES ===== */

app.get(
  "/api/mega888/games",
  requireAdmin,
  requirePermission(MEGA_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (
        await db.ref(MEGA_PATH).once("value")
      ).val() || {};

      const games = Object.entries(all)
        .filter(([, game]) =>
          megaVisible(game, req.admin.profile)
        )
        .map(([id, game]) => ({
          ...game,
          id
        }));

      return res.json({ ok: true, games });

    } catch (e) {
      console.error("MEGA888 list:", e);
      return fail(res, 500, "Cannot load games");
    }
  }
);

/* ===== CREATE GAME ===== */

app.post(
  "/api/mega888/games",
  requireAdmin,
  requirePermission(MEGA_MODULE, "create"),
  async (req, res) => {
    try {
      const data = megaValidate(req.body);

      await megaCheckSites(data, req.admin.profile);

      const all = (
        await db.ref(MEGA_PATH).once("value")
      ).val() || {};

      if (Object.values(all).some(game =>
        String(game?.name || "").toLowerCase() ===
        data.name.toLowerCase()
      )) {
        return fail(res, 409, "Game name already exists");
      }

      const ref = db.ref(MEGA_PATH).push();

      await ref.set({
        ...data,
        createdAt: now(),
        updatedAt: now(),
        createdBy: req.admin.uid
      });

      return res.status(201).json({
        ok: true,
        id: ref.key
      });

    } catch (e) {
      console.error("MEGA888 create:", e);
      return fail(res, 400, e.message);
    }
  }
);

/* ===== EDIT GAME ===== */

app.patch(
  "/api/mega888/games/:id",
  requireAdmin,
  requirePermission(MEGA_MODULE, "edit"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
        return fail(res, 400, "Invalid game ID");
      }

      const ref = db.ref(`${MEGA_PATH}/${id}`);
      const old = (await ref.once("value")).val();

      if (!old) {
        return fail(res, 404, "Game not found");
      }

      if (!megaEditable(old, req.admin.profile)) {
        return fail(res, 403, "Game edit not permitted");
      }

      const data = megaValidate(req.body);

      await megaCheckSites(data, req.admin.profile);

      const all = (
        await db.ref(MEGA_PATH).once("value")
      ).val() || {};

      if (Object.entries(all).some(([otherId, game]) =>
        otherId !== id &&
        String(game?.name || "").toLowerCase() ===
        data.name.toLowerCase()
      )) {
        return fail(res, 409, "Game name already exists");
      }

      await ref.update({
        ...data,
        updatedAt: now(),
        updatedBy: req.admin.uid
      });

      return res.json({ ok: true });

    } catch (e) {
      console.error("MEGA888 edit:", e);
      return fail(res, 400, e.message);
    }
  }
);

/* ===== DELETE GAME ===== */

app.delete(
  "/api/mega888/games/:id",
  requireAdmin,
  requirePermission(MEGA_MODULE, "delete"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
        return fail(res, 400, "Invalid game ID");
      }

      const ref = db.ref(`${MEGA_PATH}/${id}`);
      const game = (await ref.once("value")).val();

      if (!game) {
        return fail(res, 404, "Game not found");
      }

      if (!megaEditable(game, req.admin.profile)) {
        return fail(res, 403, "Game delete not permitted");
      }

      await ref.remove();

      return res.json({ ok: true });

    } catch (e) {
      console.error("MEGA888 delete:", e);
      return fail(res, 500, "Cannot delete game");
    }
  }
);
/* =====================================================
   PUSSY888 GAME CATALOG — BACKEND CRUD
   ===================================================== */

const PUSSY_MODULE = "pussy888.html";
const PUSSY_PATH = "pussy888/games";

/* ===== VISIBILITY ===== */

function pussyVisible(game, profile) {
  if (profile.role === "superadmin") return true;

  if (game?.active === false) return false;

  const assigned = Array.isArray(profile.siteIds)
    ? profile.siteIds
    : [];

  if (!assigned.length) return false;

  // Legacy games remain global until migrated
  if (game?.visibleToAllSites !== false) return true;

  return assigned.some(id =>
    game?.siteVisibility?.[id] === true
  );
}

/* ===== EDIT PERMISSION ===== */

function pussyEditable(game, profile) {
  if (profile.role === "superadmin") return true;

  if (game?.visibleToAllSites !== false) return false;

  const assigned = Array.isArray(profile.siteIds)
    ? profile.siteIds
    : [];

  const selected = Object.keys(game?.siteVisibility || {})
    .filter(id => game.siteVisibility[id] === true);

  return selected.length > 0 &&
    selected.every(id => assigned.includes(id));
}

/* ===== VALIDATION ===== */

function pussyValidate(body) {
  // Reuse the existing MEGA888 payload validation.
  return megaValidate(body);
}

async function pussyCheckSites(data, profile) {
  return megaCheckSites(data, profile);
}

/* ===== GET ACCESS ===== */

app.get(
  "/api/pussy888/access",
  requireAdmin,
  requirePermission(PUSSY_MODULE, "view"),
  (req, res) => {
    const profile = req.admin.profile;

    const actions = profile.role === "superadmin"
      ? ["show", "view", "create", "edit", "delete"]
      : profile.permissions?.["pussy888_html"] || [];

    return res.json({
      ok: true,
      role: profile.role,
      actions
    });
  }
);

/* ===== GET SITES ===== */

app.get(
  "/api/pussy888/sites",
  requireAdmin,
  requirePermission(PUSSY_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (
        await db.ref("sites").once("value")
      ).val() || {};

      const profile = req.admin.profile;

      const assigned = Array.isArray(profile.siteIds)
        ? profile.siteIds
        : [];

      const sites = Object.entries(all)
        .filter(([id, site]) =>
          site?.active === true &&
          (
            profile.role === "superadmin" ||
            assigned.includes(id)
          )
        )
        .map(([id, site]) => ({
          id,
          name: site.name || id
        }));

      return res.json({ ok: true, sites });

    } catch (error) {
      console.error("PUSSY888 sites:", error);
      return fail(res, 500, "Cannot load sites");
    }
  }
);

/* ===== GET GAMES ===== */

app.get(
  "/api/pussy888/games",
  requireAdmin,
  requirePermission(PUSSY_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (
        await db.ref(PUSSY_PATH).once("value")
      ).val() || {};

      const games = Object.entries(all)
        .filter(([, game]) =>
          pussyVisible(game, req.admin.profile)
        )
        .map(([id, game]) => ({
          ...game,
          id
        }));

      return res.json({
        ok: true,
        games
      });

    } catch (error) {
      console.error("PUSSY888 list:", error);
      return fail(res, 500, "Cannot load games");
    }
  }
);

/* ===== CREATE GAME ===== */

app.post(
  "/api/pussy888/games",
  requireAdmin,
  requirePermission(PUSSY_MODULE, "create"),
  async (req, res) => {
    try {
      const data = pussyValidate(req.body);

      await pussyCheckSites(data, req.admin.profile);

      const all = (
        await db.ref(PUSSY_PATH).once("value")
      ).val() || {};

      const exists = Object.values(all).some(game =>
        String(game?.name || "").toLowerCase() ===
        data.name.toLowerCase()
      );

      if (exists) {
        return fail(res, 409, "Game name already exists");
      }

      const ref = db.ref(PUSSY_PATH).push();

      await ref.set({
        ...data,
        createdAt: now(),
        updatedAt: now(),
        createdBy: req.admin.uid
      });

      return res.status(201).json({
        ok: true,
        id: ref.key
      });

    } catch (error) {
      console.error("PUSSY888 create:", error);
      return fail(res, 400, error.message);
    }
  }
);

/* ===== EDIT GAME ===== */

app.patch(
  "/api/pussy888/games/:id",
  requireAdmin,
  requirePermission(PUSSY_MODULE, "edit"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
        return fail(res, 400, "Invalid game ID");
      }

      const ref = db.ref(`${PUSSY_PATH}/${id}`);
      const old = (await ref.once("value")).val();

      if (!old) {
        return fail(res, 404, "Game not found");
      }

      if (!pussyEditable(old, req.admin.profile)) {
        return fail(res, 403, "Game edit not permitted");
      }

      const data = pussyValidate(req.body);

      await pussyCheckSites(data, req.admin.profile);

      const all = (
        await db.ref(PUSSY_PATH).once("value")
      ).val() || {};

      const duplicate = Object.entries(all).some(
        ([otherId, game]) =>
          otherId !== id &&
          String(game?.name || "").toLowerCase() ===
          data.name.toLowerCase()
      );

      if (duplicate) {
        return fail(res, 409, "Game name already exists");
      }

      await ref.update({
        ...data,
        updatedAt: now(),
        updatedBy: req.admin.uid
      });

      return res.json({ ok: true });

    } catch (error) {
      console.error("PUSSY888 edit:", error);
      return fail(res, 400, error.message);
    }
  }
);

/* ===== DELETE GAME ===== */

app.delete(
  "/api/pussy888/games/:id",
  requireAdmin,
  requirePermission(PUSSY_MODULE, "delete"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
        return fail(res, 400, "Invalid game ID");
      }

      const ref = db.ref(`${PUSSY_PATH}/${id}`);
      const game = (await ref.once("value")).val();

      if (!game) {
        return fail(res, 404, "Game not found");
      }

      if (!pussyEditable(game, req.admin.profile)) {
        return fail(res, 403, "Game delete not permitted");
      }

      await ref.remove();

      return res.json({ ok: true });

    } catch (error) {
      console.error("PUSSY888 delete:", error);
      return fail(res, 500, "Cannot delete game");
    }
  }
);
/* =====================================================
   EVO888 GAME CATALOG — BACKEND CRUD
   ===================================================== */

const EVO_MODULE = "evo888.html";
const EVO_PATH = "evo888/games";

function evoVisible(game, profile) {
  if (profile.role === "superadmin") return true;
  if (game?.active === false) return false;

  const assigned = Array.isArray(profile.siteIds)
    ? profile.siteIds : [];

  if (!assigned.length) return false;
  if (game?.visibleToAllSites !== false) return true;

  return assigned.some(id =>
    game?.siteVisibility?.[id] === true
  );
}

function evoEditable(game, profile) {
  if (profile.role === "superadmin") return true;
  if (game?.visibleToAllSites !== false) return false;

  const assigned = Array.isArray(profile.siteIds)
    ? profile.siteIds : [];

  const selected = Object.keys(game?.siteVisibility || {})
    .filter(id => game.siteVisibility[id] === true);

  return selected.length > 0 &&
    selected.every(id => assigned.includes(id));
}

app.get(
  "/api/evo888/access",
  requireAdmin,
  requirePermission(EVO_MODULE, "view"),
  (req, res) => {
    const p = req.admin.profile;

    res.json({
      ok: true,
      role: p.role,
      actions: p.role === "superadmin"
        ? ["show", "view", "create", "edit", "delete"]
        : p.permissions?.evo888_html || []
    });
  }
);

app.get(
  "/api/evo888/sites",
  requireAdmin,
  requirePermission(EVO_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (
        await db.ref("sites").once("value")
      ).val() || {};

      const p = req.admin.profile;
      const assigned = Array.isArray(p.siteIds)
        ? p.siteIds : [];

      const sites = Object.entries(all)
        .filter(([id, site]) =>
          site?.active === true &&
          (p.role === "superadmin" || assigned.includes(id))
        )
        .map(([id, site]) => ({
          id,
          name: site.name || id
        }));

      res.json({ ok: true, sites });
    } catch (err) {
      console.error("EVO888 sites:", err);
      fail(res, 500, "Cannot load sites");
    }
  }
);

app.get(
  "/api/evo888/games",
  requireAdmin,
  requirePermission(EVO_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (
        await db.ref(EVO_PATH).once("value")
      ).val() || {};

      const games = Object.entries(all)
        .filter(([, game]) =>
          evoVisible(game, req.admin.profile)
        )
        .map(([id, game]) => ({ ...game, id }));

      res.json({ ok: true, games });
    } catch (err) {
      console.error("EVO888 games:", err);
      fail(res, 500, "Cannot load games");
    }
  }
);

app.post(
  "/api/evo888/games",
  requireAdmin,
  requirePermission(EVO_MODULE, "create"),
  async (req, res) => {
    try {
      const data = megaValidate(req.body);
      await megaCheckSites(data, req.admin.profile);

      const all = (
        await db.ref(EVO_PATH).once("value")
      ).val() || {};

      if (Object.values(all).some(game =>
        String(game?.name || "").toLowerCase() ===
        data.name.toLowerCase()
      )) {
        return fail(res, 409, "Game name already exists");
      }

      const ref = db.ref(EVO_PATH).push();

      await ref.set({
        ...data,
        createdAt: now(),
        updatedAt: now(),
        createdBy: req.admin.uid
      });

      res.status(201).json({ ok: true, id: ref.key });
    } catch (err) {
      console.error("EVO888 create:", err);
      fail(res, 400, err.message);
    }
  }
);

app.patch(
  "/api/evo888/games/:id",
  requireAdmin,
  requirePermission(EVO_MODULE, "edit"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
        return fail(res, 400, "Invalid game ID");
      }

      const ref = db.ref(`${EVO_PATH}/${id}`);
      const old = (await ref.once("value")).val();

      if (!old) return fail(res, 404, "Game not found");

      if (!evoEditable(old, req.admin.profile)) {
        return fail(res, 403, "Game edit not permitted");
      }

      const data = megaValidate(req.body);
      await megaCheckSites(data, req.admin.profile);

      const all = (
        await db.ref(EVO_PATH).once("value")
      ).val() || {};

      if (Object.entries(all).some(([otherId, game]) =>
        otherId !== id &&
        String(game?.name || "").toLowerCase() ===
        data.name.toLowerCase()
      )) {
        return fail(res, 409, "Game name already exists");
      }

      await ref.update({
        ...data,
        updatedAt: now(),
        updatedBy: req.admin.uid
      });

      res.json({ ok: true });
    } catch (err) {
      console.error("EVO888 edit:", err);
      fail(res, 400, err.message);
    }
  }
);

app.delete(
  "/api/evo888/games/:id",
  requireAdmin,
  requirePermission(EVO_MODULE, "delete"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
        return fail(res, 400, "Invalid game ID");
      }

      const ref = db.ref(`${EVO_PATH}/${id}`);
      const old = (await ref.once("value")).val();

      if (!old) return fail(res, 404, "Game not found");

      if (!evoEditable(old, req.admin.profile)) {
        return fail(res, 403, "Game delete not permitted");
      }

      await ref.remove();
      res.json({ ok: true });
    } catch (err) {
      console.error("EVO888 delete:", err);
      fail(res, 500, "Cannot delete game");
    }
  }
);

/* =====================================================
   SCR888H5 GAME CATALOG — BACKEND CRUD
   ===================================================== */

const SCR_MODULE = "scr888h5.html";
const SCR_PATH = "scr888h5/games";

function scrVisible(game, profile) {
  if (profile.role === "superadmin") return true;
  if (game?.active === false) return false;

  const assigned = Array.isArray(profile.siteIds)
    ? profile.siteIds : [];

  if (!assigned.length) return false;
  if (game?.visibleToAllSites !== false) return true;

  return assigned.some(id =>
    game?.siteVisibility?.[id] === true
  );
}

function scrEditable(game, profile) {
  if (profile.role === "superadmin") return true;

  if (profile.role !== "siteadmin") return false;

  const assigned = Array.isArray(profile.siteIds)
    ? profile.siteIds
    : [];

  if (!assigned.length) return false;

  // Game global yang boleh dilihat oleh Site Admin.
  if (game?.visibleToAllSites !== false) {
    return game?.active !== false;
  }

  // Game khusus site: hanya jika semua site game
  // termasuk dalam site yang ditugaskan.
  const selected = Object.keys(game?.siteVisibility || {})
    .filter(id => game.siteVisibility[id] === true);

  return selected.length > 0 &&
    selected.every(id => assigned.includes(id));
}

/* =====================================================
   GET — ADMIN ACCESS / PERMISSIONS
   ===================================================== */

app.get(
  "/api/scr888h5/access",
  requireAdmin,
  requirePermission(SCR_MODULE, "view"),
  (req, res) => {
    const p = req.admin.profile;

    res.json({
      ok: true,
      role: p.role,
      actions: p.role === "superadmin"
        ? ["show", "view", "create", "edit", "delete"]
        : p.permissions?.scr888h5_html || []
    });
  }
);

/* =====================================================
   GET — AVAILABLE SITES
   ===================================================== */

app.get(
  "/api/scr888h5/sites",
  requireAdmin,
  requirePermission(SCR_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (
        await db.ref("sites").once("value")
      ).val() || {};

      const p = req.admin.profile;
      const assigned = Array.isArray(p.siteIds)
        ? p.siteIds : [];

      const sites = Object.entries(all)
        .filter(([id, site]) =>
          site?.active === true &&
          (
            p.role === "superadmin" ||
            assigned.includes(id)
          )
        )
        .map(([id, site]) => ({
          id,
          name: site.name || id
        }));

      return res.json({ ok: true, sites });

    } catch (err) {
      console.error("SCR888H5 sites:", err);
      return fail(res, 500, "Cannot load sites");
    }
  }
);

/* =====================================================
   GET — LIST GAMES
   ===================================================== */

app.get(
  "/api/scr888h5/games",
  requireAdmin,
  requirePermission(SCR_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (
        await db.ref(SCR_PATH).once("value")
      ).val() || {};

      const games = Object.entries(all)
        .filter(([, game]) =>
          scrVisible(game, req.admin.profile)
        )
        .map(([id, game]) => ({
          ...game,
          id
        }));

      return res.json({ ok: true, games });

    } catch (err) {
      console.error("SCR888H5 games:", err);
      return fail(res, 500, "Cannot load games");
    }
  }
);

/* =====================================================
   POST — CREATE GAME
   ===================================================== */

app.post(
  "/api/scr888h5/games",
  requireAdmin,
  requirePermission(SCR_MODULE, "create"),
  async (req, res) => {
    try {
      const data = megaValidate(req.body);

      await megaCheckSites(data, req.admin.profile);

      const all = (
        await db.ref(SCR_PATH).once("value")
      ).val() || {};

      const duplicate = Object.values(all).some(game =>
        String(game?.name || "").toLowerCase() ===
        data.name.toLowerCase()
      );

      if (duplicate) {
        return fail(res, 409, "Game name already exists");
      }

      const ref = db.ref(SCR_PATH).push();

      await ref.set({
        ...data,
        createdAt: now(),
        updatedAt: now(),
        createdBy: req.admin.uid
      });

      return res.status(201).json({
        ok: true,
        id: ref.key
      });

    } catch (err) {
      console.error("SCR888H5 create:", err);
      return fail(res, 400, err.message);
    }
  }
);

/* =====================================================
   PATCH — EDIT GAME
   ===================================================== */

app.patch(
  "/api/scr888h5/games/:id",
  requireAdmin,
  requirePermission(SCR_MODULE, "edit"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
        return fail(res, 400, "Invalid game ID");
      }

      const ref = db.ref(`${SCR_PATH}/${id}`);
      const old = (await ref.once("value")).val();

      if (!old) {
        return fail(res, 404, "Game not found");
      }

      if (!scrEditable(old, req.admin.profile)) {
        return fail(res, 403, "Game edit not permitted");
      }

const data = megaValidate(req.body);

const profile = req.admin.profile;

if (
  profile.role === "siteadmin" &&
  old.visibleToAllSites !== false
) {
  // Site Admin boleh edit data game global,
  // tetapi tidak boleh ubah visibility atau site assignment.
  if (
    data.visibleToAllSites !== true ||
    JSON.stringify(
      Object.keys(data.siteVisibility).sort()
    ) !== JSON.stringify(
      Object.keys(old.siteVisibility || {})
        .filter(id => old.siteVisibility[id] === true)
        .sort()
    )
  ) {
    return fail(
      res,
      403,
      "Cannot change global game visibility"
    );
  }

} else {
  await megaCheckSites(data, profile);
}

      const all = (
        await db.ref(SCR_PATH).once("value")
      ).val() || {};

      const duplicate = Object.entries(all).some(
        ([otherId, game]) =>
          otherId !== id &&
          String(game?.name || "").toLowerCase() ===
          data.name.toLowerCase()
      );

      if (duplicate) {
        return fail(res, 409, "Game name already exists");
      }

      await ref.update({
        ...data,
        updatedAt: now(),
        updatedBy: req.admin.uid
      });

      return res.json({ ok: true });

    } catch (err) {
      console.error("SCR888H5 edit:", err);
      return fail(res, 400, err.message);
    }
  }
);

/* =====================================================
   DELETE — REMOVE GAME
   ===================================================== */

app.delete(
  "/api/scr888h5/games/:id",
  requireAdmin,
  requirePermission(SCR_MODULE, "delete"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
        return fail(res, 400, "Invalid game ID");
      }

      const ref = db.ref(`${SCR_PATH}/${id}`);
      const old = (await ref.once("value")).val();

      if (!old) {
        return fail(res, 404, "Game not found");
      }

      if (!scrEditable(old, req.admin.profile)) {
        return fail(res, 403, "Game delete not permitted");
      }

      await ref.remove();

      return res.json({ ok: true });

    } catch (err) {
      console.error("SCR888H5 delete:", err);
      return fail(res, 500, "Cannot delete game");
    }
  }
);
/* =====================================================
   CIMB CLICKS - BANK CATALOG API
   ===================================================== */

const CIMB_MODULE = "cimbclick.html";
const CIMB_PATH = "bank_catalog/cimbclicks";

const cimbIdOK = id =>
  /^[A-Za-z0-9_-]{1,128}$/.test(id);

const cimbAssigned = profile =>
  Array.isArray(profile.siteIds)
    ? profile.siteIds
    : [];

function cimbVisible(bank, profile) {
  if (profile.role === "superadmin") return true;
  if (bank?.active === false) return false;

  const assigned = cimbAssigned(profile);
  if (!assigned.length) return false;

  if (bank?.visibleToAllSites === true) return true;

  return assigned.some(id =>
    bank?.siteVisibility?.[id] === true
  );
}

function cimbEditable(bank, profile) {
  if (profile.role === "superadmin") return true;
  if (profile.role !== "siteadmin") return false;

  const assigned = cimbAssigned(profile);

  if (!assigned.length || !cimbVisible(bank, profile)) {
    return false;
  }

  if (bank?.visibleToAllSites === true) {
    return true;
  }

  const selected = Object.keys(bank?.siteVisibility || {})
    .filter(id => bank.siteVisibility[id] === true);

  return selected.length > 0 &&
    selected.every(id => assigned.includes(id));
}

function cimbValidate(body) {
  if (!body || typeof body !== "object" ||
      Array.isArray(body)) {
    throw Error("Invalid bank data");
  }

  const name = String(body.name || "").trim();
  const len = Number(body.len);
  const rule = body.rule;
  const digits = String(body.digits ?? "");

  if (!name || name.length > 100) {
    throw Error("Invalid bank name");
  }

  if (!Number.isInteger(len) || len < 1 || len > 30) {
    throw Error("Invalid account length");
  }

  if (!["prefix", "start"].includes(rule)) {
    throw Error("Invalid number rule");
  }

  if (!/^\d*$/.test(digits) || digits.length > len) {
    throw Error("Invalid prefix/start digits");
  }

  if (
    typeof body.active !== "boolean" ||
    typeof body.visibleToAllSites !== "boolean"
  ) {
    throw Error("Invalid status or visibility");
  }

  const visibility = body.siteVisibility;

  if (
    !visibility ||
    typeof visibility !== "object" ||
    Array.isArray(visibility) ||
    Object.keys(visibility).length > 100 ||
    !Object.entries(visibility).every(([id, enabled]) =>
      /^[a-z0-9_-]{1,48}$/.test(id) &&
      enabled === true
    )
  ) {
    throw Error("Invalid site visibility");
  }

  return {
    name,
    len,
    rule,
    digits,
    active: body.active,
    visibleToAllSites: body.visibleToAllSites,
    siteVisibility: visibility
  };
}

async function cimbCheckScope(data, profile) {
  const allSites = (
    await db.ref("sites").once("value")
  ).val() || {};

  const selected = Object.entries(data.siteVisibility)
  .filter(([, enabled]) => enabled === true)
  .map(([id]) => id);

  if (!selected.every(id => allSites[id]?.active === true)) {
    throw Error("Site missing or inactive");
  }

  if (profile.role === "siteadmin") {
   if (data.visibleToAllSites) {
      throw Error("Only Super Admin can enable Global Active");
    }

    const assigned = cimbAssigned(profile);

    if (
      selected.length === 0 ||
      !selected.every(id => assigned.includes(id))
    ) {
      throw Error("Site selection is not assigned to you");
    }
  }

  if (!data.visibleToAllSites && selected.length === 0) {
    throw Error("Select at least one site");
  }
}

// ===== AVAILABLE SITES =====

app.get(
  "/api/cimbclick/sites",
  requireAdmin,
  requirePermission(CIMB_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (
        await db.ref("sites").once("value")
      ).val() || {};

      const profile = req.admin.profile;
      const assigned = new Set(cimbAssigned(profile));

      const sites = Object.entries(all)
        .filter(([id, site]) =>
          site?.active === true &&
          (
            profile.role === "superadmin" ||
            assigned.has(id)
          )
        )
        .map(([id, site]) => ({
          id,
          name: String(site.name || id)
        }));

      return res.json({ ok: true, sites });
    } catch (error) {
      console.error("CIMB sites:", error);
      return fail(res, 500, "Cannot load sites");
    }
  }
);

// ===== PERMISSION INFORMATION =====

app.get(
  "/api/cimbclick/access",
  requireAdmin,
  requirePermission(CIMB_MODULE, "view"),
  (req, res) => {
    const profile = req.admin.profile;
    const isSuper = profile.role === "superadmin";

    const key = CIMB_MODULE.replace(/\.html$/, "_html");
    const actions = isSuper
      ? ["show", "view", "create", "edit", "delete"]
      : (profile.permissions?.[key] || []);

    return res.json({
      ok: true,
      role: profile.role,
      actions
    });
  }
);

// ===== GET BANKS =====

app.get(
  "/api/cimbclick/banks",
  requireAdmin,
  requirePermission(CIMB_MODULE, "view"),
  async (req, res) => {
    try {
      const data = (
        await db.ref(CIMB_PATH).once("value")
      ).val() || {};

      const banks = Object.entries(data)
        .filter(([, bank]) =>
          cimbVisible(bank, req.admin.profile)
        )
        .map(([id, bank]) => ({
          id,
          ...bank,
          canManage: cimbEditable(bank, req.admin.profile),
canDelete:
  cimbEditable(bank, req.admin.profile) &&
  (
    req.admin.profile.role === "superadmin" ||
    bank.visibleToAllSites !== true
  )
        }));

      return res.json({ ok: true, banks });
    } catch (error) {
      console.error("CIMB banks:", error);
      return fail(res, 500, "Cannot load banks");
    }
  }
);

// ===== CREATE BANK =====

app.post(
  "/api/cimbclick/banks",
  requireAdmin,
  requirePermission(CIMB_MODULE, "create"),
  async (req, res) => {
    try {

const data = cimbValidate(req.body);
await cimbCheckScope(data, req.admin.profile);

      const ref = db.ref(CIMB_PATH);
      const existing = (await ref.once("value")).val() || {};

      if (Object.values(existing).some(bank =>
        String(bank?.name || "").toLowerCase() ===
        data.name.toLowerCase()
      )) {
        return fail(res, 409, "Bank name already exists");
      }

      const newRef = ref.push();

      await newRef.set({
        ...data,
        createdAt: now(),
        updatedAt: now(),
        createdBy: req.admin.uid
      });

      return res.status(201).json({
        ok: true,
        id: newRef.key
      });
    } catch (error) {
      console.error("CIMB create:", error);
      return fail(res, 400, error.message);
    }
  }
);

// ===== EDIT BANK =====

app.patch(
  "/api/cimbclick/banks/:id",
  requireAdmin,
  requirePermission(CIMB_MODULE, "edit"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!cimbIdOK(id)) {
        return fail(res, 400, "Invalid bank ID");
      }

      const ref = db.ref(`${CIMB_PATH}/${id}`);
      const snap = await ref.once("value");

      if (!snap.exists()) {
        return fail(res, 404, "Bank not found");
      }

if (!cimbEditable(snap.val(), req.admin.profile)) {
  return fail(res, 403, "Bank edit access denied");
}

const existing = snap.val();
const data = cimbValidate(req.body);

if (req.admin.profile.role === "siteadmin") {
  // Site Admin tidak boleh menukar status Global
  // atau menukar site yang sudah ditetapkan.
  const oldSites = Object.keys(existing.siteVisibility || {})
    .filter(id => existing.siteVisibility[id] === true)
    .sort();

  const newSites = Object.keys(data.siteVisibility || {})
    .filter(id => data.siteVisibility[id] === true)
    .sort();

  if (
    data.visibleToAllSites !== existing.visibleToAllSites ||
    JSON.stringify(oldSites) !== JSON.stringify(newSites)
  ) {
    return fail(
      res,
      403,
      "Only Super Admin can change bank visibility"
    );
  }

  // Bank Global mungkin mempunyai siteVisibility kosong.
  // Benarkan hanya skop asal yang tidak berubah.
  if (existing.visibleToAllSites === true) {
    const allSites = (
      await db.ref("sites").once("value")
    ).val() || {};

    if (!newSites.every(id => allSites[id]?.active === true)) {
      return fail(res, 400, "Site missing or inactive");
    }

    // Jangan benarkan perubahan skop bank Global.
    // Pemeriksaan kesamaan skop sudah dibuat di atas.
  } else {
    await cimbCheckScope(data, req.admin.profile);
  }
} else {
  await cimbCheckScope(data, req.admin.profile);
}

      const all = (
        await db.ref(CIMB_PATH).once("value")
      ).val() || {};

      if (Object.entries(all).some(([key, bank]) =>
        key !== id &&
        String(bank?.name || "").toLowerCase() ===
        data.name.toLowerCase()
      )) {
        return fail(res, 409, "Bank name already exists");
      }

      await ref.update({
        ...data,
        updatedAt: now(),
        updatedBy: req.admin.uid
      });

      return res.json({ ok: true });
    } catch (error) {
      console.error("CIMB edit:", error);
      return fail(res, 400, error.message);
    }
  }
);

// ===== DELETE BANK =====

app.delete(
  "/api/cimbclick/banks/:id",
  requireAdmin,
  requirePermission(CIMB_MODULE, "delete"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!cimbIdOK(id)) {
        return fail(res, 400, "Invalid bank ID");
      }

      const ref = db.ref(`${CIMB_PATH}/${id}`);
      const snap = await ref.once("value");

      if (!snap.exists()) {
        return fail(res, 404, "Bank not found");
      }

if (
  !cimbEditable(snap.val(), req.admin.profile) ||
  (
    req.admin.profile.role === "siteadmin" &&
    snap.val()?.visibleToAllSites === true
  )
) {
  return fail(res, 403, "Bank delete access denied");
}

      await ref.remove();

      return res.json({ ok: true });
    } catch (error) {
      console.error("CIMB delete:", error);
      return fail(res, 500, "Cannot delete bank");
    }
  }
);

/* =====================================================
   END PUSSY888 GAME CATALOG
   ===================================================== */
// GET — List all sites

// GET — Sites visible to current admin
app.get("/api/sites", requireAdmin, async (req, res) => {
  try {
    const profile = req.admin.profile;
    const snap = await db.ref("sites").once("value");
    const data = snap.val() || {};

    const allowedIds = new Set(
      Array.isArray(profile.siteIds)
        ? profile.siteIds.map(String)
        : []
    );

    const sites = Object.entries(data)
      .filter(([id, site]) => {
        if (!site) return false;

        if (profile.role === "superadmin") return true;

return (
  profile.role === "siteadmin" &&
  site.active === true &&
  allowedIds.has(id)
);
      })
.map(([id, site]) => ({
  id,
  name: site.name || id,
  walletGroupId: site.walletGroupId || null,
  active: site.active === true,

  createdAt: site.createdAt ?? null,
  updatedAt: site.updatedBy
    ? (site.updatedAt ?? null)
    : null
}));
    return res.json({ ok: true, sites });

  } catch (error) {
    console.error("GET /api/sites:", error);
    return fail(res, 500, "Cannot load sites");
  }
});



 
/* ==========================================
   CREATE SITE + ASSIGN USERNAME TOGETHER
   ========================================== */

app.post("/api/sites", requireAdmin, superOnly, async (req, res) => {
  try {
    const id = String(req.body?.id || "")
      .trim()
      .toLowerCase();

    const name = String(req.body?.name || "")
      .trim()
      .toLowerCase();

    if (!siteIdOK(id) || !usernameOK(id)) {
      return fail(res, 400, "Invalid Site ID or username");
    }

    if (name !== id) {
      return fail(res, 400, "Site Name must match username");
    }

    const data = validateSite({
      ...req.body,
      name: id.toUpperCase()
    });

    // 1. Cari username yang sudah dicipta.
    const index = (
      await db.ref(`adminUsernameIndex/${id}`).once("value")
    ).val();

    if (!index?.uid) {
      return fail(res, 400, "Username not valid or not found");
    }

    const uid = index.uid;

    // 2. Semak profil Site Admin.
    const profile = await adminProfile(uid);

    if (
      !profile ||
      profile.role !== "siteadmin" ||
      String(profile.username || "").toLowerCase() !== id
    ) {
      return fail(res, 400, "Username is not a valid Site Admin");
    }

    const assigned = Array.isArray(profile.siteIds)
      ? profile.siteIds
      : [];

    if (
      assigned.length > 0 &&
      !(assigned.length === 1 && assigned[0] === id)
    ) {
      return fail(
        res,
        409,
        "Username already has another site assignment"
      );
    }

    // 3. Semak site sedia ada.
    const siteRef = db.ref(`sites/${id}`);
    const existingSite = (await siteRef.once("value")).val();

    if (existingSite) {
      if (
        String(existingSite.name || "").toLowerCase() !== id ||
        existingSite.createdBy !== req.admin.uid
      ) {
        return fail(
          res,
          409,
          "Existing site requires manual review"
        );
      }
    }

    // 4. Jangan assign site kepada akaun lain.
    const allProfiles = (
      await db.ref("adminUsers").once("value")
    ).val() || {};

    const usedByOther = Object.entries(allProfiles).some(
      ([otherUid, other]) =>
        otherUid !== uid &&
        Array.isArray(other?.siteIds) &&
        other.siteIds.includes(id)
    );

    if (usedByOther) {
      return fail(
        res,
        409,
        "Site is assigned to another admin"
      );
    }

    // 5. Jika sudah lengkap, pulangkan success.
    if (
      existingSite &&
      assigned.length === 1 &&
      assigned[0] === id
    ) {
      return res.json({
        ok: true,
        id,
        name: existingSite.name,
        message: "Site already created and assigned"
      });
    }

    const timestamp = now();

    // 6. Sediakan semua perubahan dahulu.
    const updates = {};

    if (!existingSite) {
      updates[`sites/${id}`] = {
        ...data,
        name: id.toUpperCase(),
        createdAt: timestamp,
        createdBy: req.admin.uid,
        updatedAt: timestamp
      };
    }

    updates[`adminUsers/${uid}/siteIds`] = [id];
    updates[`adminUsers/${uid}/updatedAt`] = timestamp;

    // 7. Satu atomic multi-location update.
    // Jika operasi ini gagal, tiada perubahan separa
    // daripada update ini yang disimpan.
    await db.ref().update(updates);

    // 8. Sahkan rekod selepas update.
    const [siteSnap, userSnap] = await Promise.all([
      siteRef.once("value"),
      db.ref(`adminUsers/${uid}`).once("value")
    ]);

    const savedSite = siteSnap.val();
    const savedUser = userSnap.val();

    if (
      !savedSite ||
      !savedUser ||
      !Array.isArray(savedUser.siteIds) ||
      !savedUser.siteIds.includes(id)
    ) {
      console.error("[SITE VERIFY FAILED]", { id, uid });

      return fail(
        res,
        503,
        "Site save verification failed. Check Firebase."
      );
    }

    return res.status(existingSite ? 200 : 201).json({
      ok: true,
      id,
      name: savedSite.name,
      message: existingSite
        ? "Existing site assignment completed"
        : "Site created and assigned successfully"
    });

  } catch (error) {
    console.error("[CREATE SITE ERROR]", error);

    if (
      /Site name|wallet group|Site status/i.test(error.message)
    ) {
      return fail(res, 400, error.message);
    }

    return fail(res, 500, "Cannot save site");
  }
});



/* =====================================================
   PATCH — EDIT SITE / ACTIVE / INACTIVE
   SUPERADMIN ONLY
   ===================================================== */

app.patch("/api/sites/:id", requireAdmin, superOnly, async (req, res) => {
  try {
    const id = String(req.params.id || "").trim().toLowerCase();

    if (!siteIdOK(id)) {
      return fail(res, 400, "Invalid Site ID");
    }

const data = validateSite(req.body);

// Untuk site yang mempunyai username sepadan,
// kekalkan Site Name mengikut username.
const usernameSnap = await db.ref(
  `adminUsernameIndex/${id}`
).once("value");

if (usernameSnap.val()?.uid) {
  const linkedProfile = await adminProfile(
    usernameSnap.val().uid
  );

  if (
    linkedProfile?.role === "siteadmin" &&
    linkedProfile.username === id
  ) {
    data.name = id.toUpperCase();
  }
}

const siteRef = db.ref(`sites/${id}`);

    // Semak site wujud sebelum update
    const snapshot = await siteRef.once("value");

    if (!snapshot.exists()) {
      return fail(res, 404, "Site not found");
    }

    // Update hanya field yang diperlukan
    await siteRef.update({
      name: data.name,
      walletGroupId: data.walletGroupId,
      active: data.active,
      updatedAt: now(),
      updatedBy: req.admin.uid
    });
// Revoke sesi Site Admin yang kehilangan semua site aktif.
if (data.active === false) {
  const profilesSnapshot = await db.ref("adminUsers").once("value");
  const profiles = profilesSnapshot.val() || {};

  const affected = Object.entries(profiles).filter(([uid, profile]) => {
    return profile?.role === "siteadmin" &&
      Array.isArray(profile.siteIds) &&
      profile.siteIds.includes(id);
  });

  for (const [uid, profile] of affected) {
    if (await hasActiveAssignedSite(profile)) continue;

    try {
      await db.ref(
        `adminUsers/${uid}/forceLogoutVersion`
      ).transaction(value => Number(value || 0) + 1);

      await auth.revokeRefreshTokens(uid);
    } catch (error) {
      console.error("[SITE AUTO LOGOUT]", uid, error);
    }
  }
}
    return res.json({
      ok: true,
      message: "Site updated successfully",
      id
    });

  } catch (error) {
    if (
      error.message.startsWith("Site name") ||
      error.message.startsWith("Invalid wallet") ||
      error.message.startsWith("Site status")
    ) {
      return fail(res, 400, error.message);
    }

    console.error("Update site:", error.message);
    return fail(res, 500, "Cannot update site");
  }
});

/* =====================================================
   DELETE SITE - SUPER ADMIN ONLY
   ===================================================== */

app.delete(
  "/api/sites/:id",
  requireAdmin,
  superOnly,
  async (req, res) => {
    try {
      const id = String(req.params.id || "")
        .trim()
        .toLowerCase();

      if (!siteIdOK(id)) {
        return fail(res, 400, "Invalid Site ID");
      }

      const siteRef = db.ref(`sites/${id}`);
      const siteSnap = await siteRef.once("value");

      if (!siteSnap.exists()) {
        return fail(res, 404, "Site not found");
      }

      // Jangan padam jika masih digunakan Site Admin
      const usersSnap = await db.ref("adminUsers").once("value");
      const users = usersSnap.val() || {};

      const assignedUsers = Object.values(users).filter(user =>
        user?.role === "siteadmin" &&
        Array.isArray(user.siteIds) &&
        user.siteIds.includes(id)
      );

      if (assignedUsers.length > 0) {
        return fail(
          res,
          409,
          "This site is still assigned to " +
          assignedUsers.length +
          " Site Admin account(s). Remove their site assignments first."
        );
      }

      // Padam rekod site
      await siteRef.remove();

      return res.json({
        ok: true,
        message: "Site deleted successfully",
        id
      });

    } catch (error) {
      console.error("DELETE SITE:", error);

      return fail(
        res,
        500,
        "Cannot delete site"
      );
    }
  }
);
/* =====================================================
   MAYBANK2U - BANK CATALOG API
   SITE VISIBILITY + PERMISSIONS
   ===================================================== */

const MAYBANK_MODULE = "maybank2u.html";
const MAYBANK_PATH = "bank_catalog/maybankm2u";

const maybankIdOK = id =>
  /^[A-Za-z0-9_-]{1,128}$/.test(id);

const maybankAssigned = profile =>
  Array.isArray(profile.siteIds) ? profile.siteIds : [];

function maybankVisible(bank, profile) {
  if (profile.role === "superadmin") return true;
  if (bank?.active === false) return false;

  const assigned = maybankAssigned(profile);
  if (!assigned.length) return false;

  return bank?.visibleToAllSites === true ||
    assigned.some(id => bank?.siteVisibility?.[id] === true);
}

function maybankEditable(bank, profile) {
  if (profile.role === "superadmin") {
    return true;
  }

  if (profile.role !== "siteadmin") {
    return false;
  }

  // Site Admin tidak boleh edit bank Global
  if (bank?.visibleToAllSites === true) {
    return false;
  }

  if (!maybankVisible(bank, profile)) {
    return false;
  }

  const assigned = maybankAssigned(profile);

  const selected = Object.keys(
    bank?.siteVisibility || {}
  ).filter(id => bank.siteVisibility[id] === true);

  return selected.length > 0 &&
    selected.every(id => assigned.includes(id));
}

function maybankValidate(body) {
  if (!body || typeof body !== "object" ||
      Array.isArray(body)) {
    throw Error("Invalid bank data");
  }

  const name = String(body.name || "").trim();
  const len = Number(body.len);
  const rule = body.rule;
  const digits = String(body.digits ?? "");

  if (!name || name.length > 100)
    throw Error("Invalid bank name");

  if (!Number.isInteger(len) || len < 1 || len > 30)
    throw Error("Invalid account length");

  if (!["prefix", "start"].includes(rule))
    throw Error("Invalid number rule");

  if (!/^\d*$/.test(digits) || digits.length > len)
    throw Error("Invalid prefix/start digits");

  if (typeof body.active !== "boolean" ||
      typeof body.visibleToAllSites !== "boolean") {
    throw Error("Invalid status or visibility");
  }

  const siteVisibility = body.siteVisibility ?? {};

  if (!siteVisibility ||
      typeof siteVisibility !== "object" ||
      Array.isArray(siteVisibility) ||
      Object.keys(siteVisibility).length > 100 ||
      !Object.entries(siteVisibility).every(
        ([id, value]) => siteIdOK(id) && value === true
      )) {
    throw Error("Invalid site visibility");
  }

  if (!body.visibleToAllSites &&
      !Object.keys(siteVisibility).length) {
    throw Error("Select at least one site");
  }

  return {
    name,
    len,
    rule,
    digits,
    active: body.active,
    visibleToAllSites: body.visibleToAllSites,
    siteVisibility
  };
}

async function maybankCheckScope(data, profile) {
  const sites = (
    await db.ref("sites").once("value")
  ).val() || {};

  const selected = Object.keys(data.siteVisibility);

  if (!selected.every(id => sites[id]?.active === true)) {
    throw Error("Site missing or inactive");
  }

  if (profile.role === "siteadmin") {
    if (data.visibleToAllSites === true) {
      throw Error("Only Super Admin can enable Global Active");
    }

    const assigned = maybankAssigned(profile);

    if (!selected.length ||
        !selected.every(id => assigned.includes(id))) {
      throw Error("Site selection is not assigned to you");
    }
  }
}

// ===== SITE DROPDOWN =====

app.get(
  "/api/maybank2u/sites",
  requireAdmin,
  requirePermission(MAYBANK_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (
        await db.ref("sites").once("value")
      ).val() || {};

      const profile = req.admin.profile;
      const assigned = maybankAssigned(profile);

      const sites = Object.entries(all)
        .filter(([id, site]) =>
          site?.active === true &&
          (
            profile.role === "superadmin" ||
            assigned.includes(id)
          )
        )
        .map(([id, site]) => ({
          id,
          name: site.name || id
        }));

      return res.json({ ok: true, sites });
    } catch (error) {
      console.error("Maybank sites:", error);
      return fail(res, 500, "Cannot load sites");
    }
  }
);

// ===== ACCESS PERMISSIONS =====

app.get(
  "/api/maybank2u/access",
  requireAdmin,
  requirePermission(MAYBANK_MODULE, "view"),
  (req, res) => {
    const profile = req.admin.profile;
    const key = MAYBANK_MODULE.replace(/\.html$/, "_html");

    const actions = profile.role === "superadmin"
      ? ["show", "view", "create", "edit", "delete"]
      : (profile.permissions?.[key] || []);

    return res.json({
      ok: true,
      role: profile.role,
      actions
    });
  }
);

// ===== LIST BANKS =====

app.get(
  "/api/maybank2u/banks",
  requireAdmin,
  requirePermission(MAYBANK_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (
        await db.ref(MAYBANK_PATH).once("value")
      ).val() || {};

      const banks = Object.entries(all)
        .filter(([, bank]) =>
          maybankVisible(bank, req.admin.profile)
        )
        .map(([id, bank]) => ({
          id,
          ...bank,
          canManage: maybankEditable(
            bank, req.admin.profile
          ),
          canDelete:
            maybankEditable(bank, req.admin.profile) &&
            (
              req.admin.profile.role === "superadmin" ||
              bank.visibleToAllSites !== true
            )
        }));

      return res.json({ ok: true, banks });
    } catch (error) {
      console.error("Maybank list:", error);
      return fail(res, 500, "Cannot load banks");
    }
  }
);

// ===== CREATE BANK =====

app.post(
  "/api/maybank2u/banks",
  requireAdmin,
  requirePermission(MAYBANK_MODULE, "create"),
  async (req, res) => {
    try {
      const data = maybankValidate(req.body);
      await maybankCheckScope(data, req.admin.profile);

      const root = db.ref(MAYBANK_PATH);
      const all = (await root.once("value")).val() || {};

      if (Object.values(all).some(bank =>
        String(bank?.name || "").toLowerCase() ===
        data.name.toLowerCase()
      )) {
        return fail(res, 409, "Bank name already exists");
      }

      const ref = root.push();

      await ref.set({
        ...data,
        createdAt: now(),
        updatedAt: now(),
        createdBy: req.admin.uid
      });

      return res.status(201).json({
        ok: true,
        id: ref.key
      });
    } catch (error) {
      console.error("Maybank create:", error);
      return fail(res, 400, error.message);
    }
  }
);

// ===== EDIT BANK =====

app.patch(
  "/api/maybank2u/banks/:id",
  requireAdmin,
  requirePermission(MAYBANK_MODULE, "edit"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!maybankIdOK(id))
        return fail(res, 400, "Invalid bank ID");

      const ref = db.ref(`${MAYBANK_PATH}/${id}`);
      const snap = await ref.once("value");

      if (!snap.exists())
        return fail(res, 404, "Bank not found");

      const old = snap.val();

      if (!maybankEditable(old, req.admin.profile))
        return fail(res, 403, "Bank edit access denied");

      const data = maybankValidate(req.body);

      if (req.admin.profile.role === "siteadmin") {
        const oldSites = Object.keys(old.siteVisibility || {})
          .filter(id => old.siteVisibility[id] === true)
          .sort();

        const newSites = Object.keys(data.siteVisibility)
          .sort();

        if (
          data.visibleToAllSites !==
            (old.visibleToAllSites === true) ||
          JSON.stringify(oldSites) !==
            JSON.stringify(newSites)
        ) {
          return fail(
            res, 403,
            "Only Super Admin can change bank visibility"
          );
        }

if (old.visibleToAllSites === true) {

  data.visibleToAllSites = true;
  data.siteVisibility = old.siteVisibility || {};
} else {
  await maybankCheckScope(data, req.admin.profile);
}
      } else {
        await maybankCheckScope(data, req.admin.profile);
      }

      const all = (
        await db.ref(MAYBANK_PATH).once("value")
      ).val() || {};

      if (Object.entries(all).some(([key, bank]) =>
        key !== id &&
        String(bank?.name || "").toLowerCase() ===
        data.name.toLowerCase()
      )) {
        return fail(res, 409, "Bank name already exists");
      }

      await ref.update({
        ...data,
        updatedAt: now(),
        updatedBy: req.admin.uid
      });

      return res.json({ ok: true });
    } catch (error) {
      console.error("Maybank edit:", error);
      return fail(res, 400, error.message);
    }
  }
);

// ===== DELETE BANK =====

app.delete(
  "/api/maybank2u/banks/:id",
  requireAdmin,
  requirePermission(MAYBANK_MODULE, "delete"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!maybankIdOK(id))
        return fail(res, 400, "Invalid bank ID");

      const ref = db.ref(`${MAYBANK_PATH}/${id}`);
      const snap = await ref.once("value");

      if (!snap.exists())
        return fail(res, 404, "Bank not found");

      const bank = snap.val();

      if (
        !maybankEditable(bank, req.admin.profile) ||
        (
          req.admin.profile.role === "siteadmin" &&
          bank.visibleToAllSites === true
        )
      ) {
        return fail(res, 403, "Bank delete access denied");
      }

      await ref.remove();

      return res.json({ ok: true });
    } catch (error) {
      console.error("Maybank delete:", error);
      return fail(res, 500, "Cannot delete bank");
    }
  }
);

/* =====================================================
   RHB BANK - CATALOG API
   ===================================================== */

const RHB_MODULE = "rhbbank.html";
const RHB_PATH = "bank_catalog/rhb";

const rhbIdOK = id =>
  /^[A-Za-z0-9_-]{1,128}$/.test(id);

const rhbAssigned = profile =>
  Array.isArray(profile.siteIds) ? profile.siteIds : [];

function rhbVisible(bank, profile) {
  if (profile.role === "superadmin") return true;
  if (bank?.active === false) return false;

  const assigned = rhbAssigned(profile);
  if (!assigned.length) return false;

  return bank?.visibleToAllSites === true ||
    assigned.some(id =>
      bank?.siteVisibility?.[id] === true
    );
}

function rhbEditable(bank, profile) {
  if (profile.role === "superadmin") return true;
  if (profile.role !== "siteadmin") return false;
  if (bank?.visibleToAllSites === true) return false;
  if (!rhbVisible(bank, profile)) return false;

  const selected = Object.keys(
    bank?.siteVisibility || {}
  ).filter(id => bank.siteVisibility[id] === true);

  return selected.length > 0 &&
    selected.every(id => rhbAssigned(profile).includes(id));
}
function rhbSameSites(a, b) {
  const left = Object.keys(a || {})
    .filter(id => a[id] === true)
    .sort();

  const right = Object.keys(b || {})
    .filter(id => b[id] === true)
    .sort();

  return left.length === right.length &&
    left.every((id, index) => id === right[index]);
}
function rhbValidate(body) {
  if (!body || typeof body !== "object" ||
      Array.isArray(body)) {
    throw Error("Invalid bank data");
  }

  const name = String(body.name || "").trim();
  const pattern = String(body.pattern || "").trim();

  if (!name || name.length > 100) {
    throw Error("Invalid bank name");
  }

  if (!/^\d{1,2}(-\d{1,2})*$/.test(pattern)) {
    throw Error("Invalid account pattern");
  }

  const groups = pattern.split("-").map(Number);
  const total = groups.reduce((sum, n) => sum + n, 0);

  if (groups.some(n => n < 1 || n > 30) ||
      total > 30) {
    throw Error("Invalid account pattern length");
  }

  if (typeof body.active !== "boolean" ||
      typeof body.visibleToAllSites !== "boolean") {
    throw Error("Invalid status or visibility");
  }

  const siteVisibility = body.siteVisibility ?? {};

  if (!siteVisibility ||
      typeof siteVisibility !== "object" ||
      Array.isArray(siteVisibility) ||
      Object.keys(siteVisibility).length > 100 ||
      !Object.entries(siteVisibility).every(
        ([id, value]) => siteIdOK(id) && value === true
      )) {
    throw Error("Invalid site visibility");
  }

  if (!body.visibleToAllSites &&
      !Object.keys(siteVisibility).length) {
    throw Error("Select at least one site");
  }

  return {
    name,
    pattern,
    active: body.active,
    visibleToAllSites: body.visibleToAllSites,
    siteVisibility
  };
}

async function rhbCheckScope(data, profile) {
  const sites = (
    await db.ref("sites").once("value")
  ).val() || {};

  const selected = Object.keys(data.siteVisibility);

  if (!selected.every(id => sites[id]?.active === true)) {
    throw Error("Site missing or inactive");
  }

  if (profile.role === "siteadmin") {
    if (data.visibleToAllSites) {
      throw Error("Only Super Admin can enable Global Active");
    }

    if (!selected.length ||
        !selected.every(id => rhbAssigned(profile).includes(id))) {
      throw Error("Site selection is not assigned to you");
    }
  }
}

app.get(
  "/api/rhb/access",
  requireAdmin,
  requirePermission(RHB_MODULE, "view"),
  (req, res) => {
    const profile = req.admin.profile;
    const key = RHB_MODULE.replace(/\.html$/, "_html");

    return res.json({
      ok: true,
      role: profile.role,
      actions: profile.role === "superadmin"
        ? ["show", "view", "create", "edit", "delete"]
        : (profile.permissions?.[key] || [])
    });
  }
);

app.get(
  "/api/rhb/sites",
  requireAdmin,
  requirePermission(RHB_MODULE, "view"),
  async (req, res) => {
    try {
      const profile = req.admin.profile;
      const raw = (
        await db.ref("sites").once("value")
      ).val() || {};

      const sites = Object.entries(raw)
        .filter(([id, site]) =>
          site?.active === true &&
          (profile.role === "superadmin" ||
           rhbAssigned(profile).includes(id))
        )
        .map(([id, site]) => ({
          id,
          name: site.name || id
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return res.json({ ok: true, sites });
    } catch (error) {
      console.error("RHB sites:", error);
      return fail(res, 500, "Cannot load sites");
    }
  }
);

app.get(
  "/api/rhb/banks",
  requireAdmin,
  requirePermission(RHB_MODULE, "view"),
  async (req, res) => {
    try {
      const profile = req.admin.profile;
      const raw = (
        await db.ref(RHB_PATH).once("value")
      ).val() || {};

      const banks = Object.entries(raw)
        .filter(([, bank]) => rhbVisible(bank, profile))
        .map(([id, bank]) => ({
          id,
          ...bank,
          canManage: rhbEditable(bank, profile),
          canDelete: rhbEditable(bank, profile)
        }));

      return res.json({ ok: true, banks });
    } catch (error) {
      console.error("RHB banks:", error);
      return fail(res, 500, "Cannot load banks");
    }
  }
);

app.post(
  "/api/rhb/banks",
  requireAdmin,
  requirePermission(RHB_MODULE, "create"),
  async (req, res) => {
    try {
      const data = rhbValidate(req.body);
      await rhbCheckScope(data, req.admin.profile);

      const ref = db.ref(RHB_PATH).push();

      await ref.set({
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: req.admin.uid
      });

      return res.status(201).json({
        ok: true,
        id: ref.key
      });
    } catch (error) {
      return fail(res, 400, error.message);
    }
  }
);

app.patch(
  "/api/rhb/banks/:id",
  requireAdmin,
  requirePermission(RHB_MODULE, "edit"),
  async (req, res) => {
    try {
      const id = req.params.id;
      if (!rhbIdOK(id)) {
        return fail(res, 400, "Invalid bank ID");
      }

      const ref = db.ref(`${RHB_PATH}/${id}`);
      const existing = (await ref.once("value")).val();

      if (!existing) {
        return fail(res, 404, "Bank not found");
      }

      const profile = req.admin.profile;

      if (!rhbEditable(existing, profile)) {
        return fail(res, 403, "Bank edit access denied");
      }

      const data = rhbValidate(req.body);

      if (profile.role === "siteadmin") {
        if (data.visibleToAllSites !==
            (existing.visibleToAllSites === true) ||
!rhbSameSites(
  data.siteVisibility,
  existing.siteVisibility || {}
)) {
          return fail(res, 403, "Cannot change site visibility");
        }
      }

      await rhbCheckScope(data, profile);

      await ref.update({
        ...data,
        updatedAt: Date.now(),
        updatedBy: req.admin.uid
      });

      return res.json({ ok: true });
    } catch (error) {
      return fail(res, 400, error.message);
    }
  }
);

app.delete(
  "/api/rhb/banks/:id",
  requireAdmin,
  requirePermission(RHB_MODULE, "delete"),
  async (req, res) => {
    try {
      const id = req.params.id;
      if (!rhbIdOK(id)) {
        return fail(res, 400, "Invalid bank ID");
      }

      const ref = db.ref(`${RHB_PATH}/${id}`);
      const existing = (await ref.once("value")).val();

      if (!existing) {
        return fail(res, 404, "Bank not found");
      }

      if (!rhbEditable(existing, req.admin.profile)) {
        return fail(res, 403, "Bank delete access denied");
      }

      await ref.remove();
      return res.json({ ok: true });
    } catch (error) {
      console.error("RHB delete:", error);
      return fail(res, 500, "Cannot delete bank");
    }
  }
);

/* END RHB BANK API */

/* =====================================================
   END MAYBANK2U BANK API
   ===================================================== */
/* =====================================================
   BANK ISLAM - BANK CATALOG API
   ===================================================== */

const BI_MODULE = "bankislam.html";
const BI_PATH = "bank_catalog/bankislam";

const biIdOK = id =>
  /^[A-Za-z0-9_-]{1,128}$/.test(id);

function biAssigned(profile) {
  return Array.isArray(profile.siteIds)
    ? profile.siteIds
    : [];
}

function biVisible(bank, profile) {
  if (profile.role === "superadmin") return true;
  if (bank?.active === false) return false;

  const assigned = biAssigned(profile);
  if (!assigned.length) return false;

  if (bank?.visibleToAllSites === true) return true;

  return assigned.some(id =>
    bank?.siteVisibility?.[id] === true
  );
}

function biEditable(bank, profile) {
  if (profile.role === "superadmin") return true;
  if (profile.role !== "siteadmin") return false;

  if (!biVisible(bank, profile)) return false;

  // Global records hanya boleh diubah Super Admin.
  if (bank?.visibleToAllSites === true) return false;

  const selected = Object.keys(bank?.siteVisibility || {})
    .filter(id => bank.siteVisibility[id] === true);

  return selected.length > 0 &&
    selected.every(id => biAssigned(profile).includes(id));
}

function biValidate(body) {
  if (!body || typeof body !== "object" ||
      Array.isArray(body)) {
    throw Error("Invalid bank data");
  }

  const name = String(body.name || "").trim();
  const len = Number(body.len);
  const rule = body.rule;
  const digits = String(body.digits ?? "");

  if (!name || name.length > 100) {
    throw Error("Invalid bank name");
  }

  if (!Number.isInteger(len) || len < 1 || len > 30) {
    throw Error("Invalid account length");
  }

  if (!["prefix", "start"].includes(rule)) {
    throw Error("Invalid number rule");
  }

  if (!/^\d*$/.test(digits) || digits.length > len) {
    throw Error("Invalid digits");
  }

  if (
    typeof body.active !== "boolean" ||
    typeof body.visibleToAllSites !== "boolean"
  ) {
    throw Error("Invalid status");
  }

  const siteVisibility = body.siteVisibility;

  if (
    !siteVisibility ||
    typeof siteVisibility !== "object" ||
    Array.isArray(siteVisibility) ||
    Object.keys(siteVisibility).length > 100 ||
    !Object.entries(siteVisibility).every(([id, enabled]) =>
      /^[a-z0-9_-]{1,48}$/.test(id) &&
      enabled === true
    )
  ) {
    throw Error("Invalid site visibility");
  }

  return {
    name,
    len,
    rule,
    digits,
    active: body.active,
    visibleToAllSites: body.visibleToAllSites,
    siteVisibility
  };
}

async function biCheckScope(data, profile) {
  const allSites = (
    await db.ref("sites").once("value")
  ).val() || {};

  const selected = Object.keys(data.siteVisibility)
    .filter(id => data.siteVisibility[id] === true);

  if (!selected.every(id => allSites[id]?.active === true)) {
    throw Error("Site missing or inactive");
  }

  if (profile.role === "siteadmin") {
    if (data.visibleToAllSites) {
      throw Error("Only Super Admin can enable Global Active");
    }

    if (
      selected.length === 0 ||
      !selected.every(id => biAssigned(profile).includes(id))
    ) {
      throw Error("Site selection is not assigned to you");
    }
  }

  if (!data.visibleToAllSites && selected.length === 0) {
    throw Error("Select at least one site");
  }
}

// GET ASSIGNED SITES
app.get(
  "/api/bankislam/sites",
  requireAdmin,
  requirePermission(BI_MODULE, "view"),
  async (req, res) => {
    try {
      const all = (
        await db.ref("sites").once("value")
      ).val() || {};

      const profile = req.admin.profile;
      const assigned = new Set(biAssigned(profile));

      const sites = Object.entries(all)
        .filter(([id, site]) =>
          site?.active === true &&
          (
            profile.role === "superadmin" ||
            assigned.has(id)
          )
        )
        .map(([id, site]) => ({
          id,
          name: site.name || id
        }));

      return res.json({ ok: true, sites });
    } catch (error) {
      console.error("Bank Islam sites:", error);
      return fail(res, 500, "Cannot load sites");
    }
  }
);

// GET PERMISSIONS
app.get(
  "/api/bankislam/access",
  requireAdmin,
  requirePermission(BI_MODULE, "view"),
  (req, res) => {
    const profile = req.admin.profile;
    const isSuper = profile.role === "superadmin";
    const key = BI_MODULE.replace(/\.html$/, "_html");

    return res.json({
      ok: true,
      role: profile.role,
      actions: isSuper
        ? ["show", "view", "create", "edit", "delete"]
        : (profile.permissions?.[key] || [])
    });
  }
);

// GET BANKS
app.get(
  "/api/bankislam/banks",
  requireAdmin,
  requirePermission(BI_MODULE, "view"),
  async (req, res) => {
    try {
      const data = (
        await db.ref(BI_PATH).once("value")
      ).val() || {};

      const profile = req.admin.profile;

      const banks = Object.entries(data)
        .filter(([, bank]) => biVisible(bank, profile))
        .map(([id, bank]) => ({
          id,
          ...bank,
          canManage: biEditable(bank, profile),
          canDelete: biEditable(bank, profile)
        }));

      return res.json({ ok: true, banks });
    } catch (error) {
      console.error("Bank Islam banks:", error);
      return fail(res, 500, "Cannot load banks");
    }
  }
);

// CREATE BANK
app.post(
  "/api/bankislam/banks",
  requireAdmin,
  requirePermission(BI_MODULE, "create"),
  async (req, res) => {
    try {
      const data = biValidate(req.body);
      await biCheckScope(data, req.admin.profile);

      const ref = db.ref(BI_PATH);
      const existing = (await ref.once("value")).val() || {};

      if (Object.values(existing).some(bank =>
        String(bank?.name || "").toLowerCase() ===
        data.name.toLowerCase()
      )) {
        return fail(res, 409, "Bank name already exists");
      }

      const newRef = ref.push();

      await newRef.set({
        ...data,
        createdAt: now(),
        updatedAt: now(),
        createdBy: req.admin.uid
      });

      return res.status(201).json({
        ok: true,
        id: newRef.key
      });
    } catch (error) {
      console.error("Bank Islam create:", error);
      return fail(res, 400, error.message);
    }
  }
);

// EDIT BANK
app.patch(
  "/api/bankislam/banks/:id",
  requireAdmin,
  requirePermission(BI_MODULE, "edit"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!biIdOK(id)) {
        return fail(res, 400, "Invalid bank ID");
      }

      const ref = db.ref(`${BI_PATH}/${id}`);
      const snapshot = await ref.once("value");

      if (!snapshot.exists()) {
        return fail(res, 404, "Bank not found");
      }

      if (!biEditable(snapshot.val(), req.admin.profile)) {
        return fail(res, 403, "Bank access denied");
      }

      const data = biValidate(req.body);
      await biCheckScope(data, req.admin.profile);

      const all = (
        await db.ref(BI_PATH).once("value")
      ).val() || {};

      if (Object.entries(all).some(([otherId, bank]) =>
        otherId !== id &&
        String(bank?.name || "").toLowerCase() ===
        data.name.toLowerCase()
      )) {
        return fail(res, 409, "Bank name already exists");
      }

      await ref.update({
        ...data,
        updatedAt: now(),
        updatedBy: req.admin.uid
      });

      return res.json({ ok: true });
    } catch (error) {
      console.error("Bank Islam edit:", error);
      return fail(res, 400, error.message);
    }
  }
);

// DELETE BANK
app.delete(
  "/api/bankislam/banks/:id",
  requireAdmin,
  requirePermission(BI_MODULE, "delete"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!biIdOK(id)) {
        return fail(res, 400, "Invalid bank ID");
      }

      const ref = db.ref(`${BI_PATH}/${id}`);
      const snapshot = await ref.once("value");

      if (!snapshot.exists()) {
        return fail(res, 404, "Bank not found");
      }

      if (!biEditable(snapshot.val(), req.admin.profile)) {
        return fail(res, 403, "Bank access denied");
      }

      await ref.remove();

      return res.json({ ok: true });
    } catch (error) {
      console.error("Bank Islam delete:", error);
      return fail(res, 500, "Cannot delete bank");
    }
  }
);

/* =====================================================
   STICKY NOTES — SECURE BACKEND API
   ===================================================== */

const STICKY_MODULE = "stickynotes.html";
const STICKY_PATH = "stickyNotes";

/* Site assignments untuk filter Sticky Notes Super Admin */
app.get(
  "/api/sticky-notes/owner-sites",
  requireAdmin,
  superOnly,
  async (req, res) => {
    try {
      const snapshot = await db.ref("adminUsers").once("value");
      const profiles = snapshot.val() || {};
      const owners = {};

      for (const [uid, profile] of Object.entries(profiles)) {
        if (!["siteadmin", "superadmin"].includes(profile?.role)) {
          continue;
        }

        owners[uid] = {
          siteIds: Array.isArray(profile.siteIds)
            ? profile.siteIds.filter(id => typeof id === "string")
            : []
        };
      }

      return res.json({ ok: true, owners });
    } catch (error) {
      console.error("Sticky owner sites:", error);
      return fail(res, 500, "Cannot load note owner sites");
    }
  }
);

const stickyIdOK = id =>
  typeof id === "string" &&
  /^note_[a-zA-Z0-9_-]{1,100}$/.test(id);

const stickyUidOK = uid =>
  typeof uid === "string" &&
  /^[a-zA-Z0-9_-]{1,128}$/.test(uid);

const stickyColors = new Set([
  "#006873", "#0b0b0b", "#6d00ff",
  "#1668dc", "#16dccb", "#16dc8b",
  "#f513d8", "#f51365", "#13f5ec",
  "#13aaf5", "#dce83c", "#e86d3c",
  "#e83c3c", "#3ce843"
]);

function stickyOwner(req, requestedUid) {
  const uid = requestedUid || req.admin.uid;

  if (!stickyUidOK(uid)) return null;

  if (
    req.admin.profile.role !== "superadmin" &&
    uid !== req.admin.uid
  ) {
    return null;
  }

  return uid;
}

function validateStickyInput(body) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) return null;

  const title = body.title;
  const text = body.body;
  const color = body.color;

  if (
    typeof title !== "string" ||
    title.length > 150 ||
    typeof text !== "string" ||
    text.length > 20000 ||
    !stickyColors.has(color)
  ) {
    return null;
  }

  return { title, body: text, color };
}

// CREATE
app.post(
  "/api/sticky-notes",
  requireAdmin,
  requirePermission(STICKY_MODULE, "create"),
  async (req, res) => {
    try {
      const data = validateStickyInput(req.body);
      const id = req.body?.id;

      if (!data || !stickyIdOK(id)) {
        return fail(res, 400, "Invalid note data");
      }

      // Create sentiasa di bawah UID pengguna sendiri.
      const uid = req.admin.uid;
      const ref = db.ref(`${STICKY_PATH}/${uid}/${id}`);

      const profile = req.admin.profile;
      const timestamp = now();

      const note = {
        id,
        ...data,
        pinned: false,
        archived: false,
        userUid: uid,
        userName: profile.role === "superadmin"
          ? "Super Admin"
          : profile.username,
        userEmail: profile.email || "",
        createdAt: timestamp,
        updatedAt: timestamp
      };

      const result = await ref.transaction(
        current => current === null ? note : undefined,
        undefined,
        false
      );

      if (!result.committed) {
        return fail(res, 409, "Note already exists");
      }

      return res.status(201).json({
        ok: true,
        note
      });
    } catch (error) {
      console.error("Sticky create:", error);
      return fail(res, 500, "Cannot create note");
    }
  }
);

// EDIT / PIN / ARCHIVE
app.patch(
  "/api/sticky-notes/:ownerUid/:id",
  requireAdmin,
  requirePermission(STICKY_MODULE, "edit"),
  async (req, res) => {
    try {
      const uid = stickyOwner(req, req.params.ownerUid);
      const id = req.params.id;

      if (!uid) {
        return fail(res, 403, "Note access denied");
      }

      if (!stickyIdOK(id)) {
        return fail(res, 400, "Invalid note ID");
      }

      const body = req.body || {};
      const allowed = new Set([
        "title", "body", "color",
        "pinned", "archived"
      ]);

      const keys = Object.keys(body);

      if (
        !keys.length ||
        keys.some(key => !allowed.has(key))
      ) {
        return fail(res, 400, "Invalid update fields");
      }

      const updates = {};

      if (
        keys.some(key =>
          ["title", "body", "color"].includes(key)
        )
      ) {
        // Validate the fields actually supplied.
        if (Object.hasOwn(body, "title")) {
          if (
            typeof body.title !== "string" ||
            body.title.length > 150
          ) return fail(res, 400, "Invalid title");

          updates.title = body.title;
        }

        if (Object.hasOwn(body, "body")) {
          if (
            typeof body.body !== "string" ||
            body.body.length > 20000
          ) return fail(res, 400, "Invalid body");

          updates.body = body.body;
        }

        if (Object.hasOwn(body, "color")) {
          if (!stickyColors.has(body.color)) {
            return fail(res, 400, "Invalid color");
          }

          updates.color = body.color;
        }
      }

      for (const field of ["pinned", "archived"]) {
        if (Object.hasOwn(body, field)) {
          if (typeof body[field] !== "boolean") {
            return fail(res, 400, `Invalid ${field}`);
          }
          updates[field] = body[field];
        }
      }

      const ref = db.ref(`${STICKY_PATH}/${uid}/${id}`);
      const snapshot = await ref.once("value");

      if (!snapshot.exists()) {
        return fail(res, 404, "Note not found");
      }

      const existing = snapshot.val();

      if (existing.userUid && existing.userUid !== uid) {
        return fail(res, 403, "Note owner mismatch");
      }

const updatedNote = {
  ...existing,
  ...updates,
  updatedAt: now()
};

await ref.update({
  ...updates,
  updatedAt: updatedNote.updatedAt
});

return res.json({
  ok: true,
  note: updatedNote
});
    } catch (error) {
      console.error("Sticky edit:", error);
      return fail(res, 500, "Cannot edit note");
    }
  }
);

// DELETE
app.delete(
  "/api/sticky-notes/:ownerUid/:id",
  requireAdmin,
  requirePermission(STICKY_MODULE, "delete"),
  async (req, res) => {
    try {
      const uid = stickyOwner(req, req.params.ownerUid);
      const id = req.params.id;

      if (!uid) {
        return fail(res, 403, "Note access denied");
      }

      if (!stickyIdOK(id)) {
        return fail(res, 400, "Invalid note ID");
      }

      const ref = db.ref(`${STICKY_PATH}/${uid}/${id}`);
      const snapshot = await ref.once("value");

      if (!snapshot.exists()) {
        return fail(res, 404, "Note not found");
      }

      const note = snapshot.val();

      if (note.userUid && note.userUid !== uid) {
        return fail(res, 403, "Note owner mismatch");
      }

await ref.remove();

return res.json({ ok: true });
    } catch (error) {
      console.error("Sticky delete:", error);
      return fail(res, 500, "Cannot delete note");
    }
  }
);

/* =====================================================
   END STICKY NOTES API
   ===================================================== */

/* =====================================================
   LIVECHAT IDENTITY MIGRATION - DRY RUN V1
   READ ONLY - NO DATABASE MODIFICATION
   ===================================================== */

app.get(
  "/api/admin/livechat-migration/preview",
  requireAdmin,
  superOnly,
  async (req, res) => {

    // Primary Super Admin sahaja.
    if (!isPrimarySuperAdmin(req.admin)) {
      return fail(res, 403, "Primary Super Admin only");
    }

    try {
      const adminSnap = await db
        .ref("adminUsers")
        .once("value");

      const admins = adminSnap.val() || {};

      const results = [];

      for (const [uid, profile] of Object.entries(admins)) {

        const username = String(
          profile.username || ""
        ).trim().toLowerCase();

        if (!usernameOK(username)) {
          results.push({
            uid,
            username,
            status: "INVALID_USERNAME"
          });
          continue;
        }

        const oldAdminId = `admin_${uid}`;

        const oldEmailId = String(profile.email || "")
          .trim()
          .toLowerCase()
          .replace(/[.#$\[\]\/\s]/g, "_");

        const targetId = profile.livechatId
          ? resolveLiveChatId(uid, profile)
          : buildLiveChatId(username, uid);

        const sourceIds = [...new Set([
          oldAdminId,
          oldEmailId,
          targetId
        ].filter(Boolean))];

        const paths = [];

        for (const sid of sourceIds) {

          const [
            userSnap,
            chatSnap,
            notificationSnap
          ] = await Promise.all([
            db.ref(`users/${sid}`).once("value"),
            db.ref(`chats/${sid}`).once("value"),
            db.ref(`notifications/${sid}`).once("value")
          ]);

          paths.push({
            sid,
            isTarget: sid === targetId,
            hasProfile: userSnap.exists(),
            hasChat: chatSnap.exists(),
            messageCount: chatSnap.numChildren(),
            hasNotification: notificationSnap.exists()
          });
        }

        const legacyPaths = paths.filter(item =>
          !item.isTarget &&
          (
            item.hasProfile ||
            item.hasChat ||
            item.hasNotification
          )
        );

        const target = paths.find(
          item => item.isTarget
        );

        let status = "READY";

        if (
          profile.livechatId === targetId &&
          legacyPaths.length === 0
        ) {
          status = "IDENTITY_ASSIGNED";
        } else if (legacyPaths.length > 0) {
          status = "MIGRATION_REQUIRED";
        } else {
          status = "NO_LEGACY_DATA";
        }

        results.push({
          uid,
          username,
          role: profile.role,
          active: profile.active === true,
          currentLivechatId: profile.livechatId || null,
          targetLivechatId: targetId,
          legacyPathCount: legacyPaths.length,
          targetExists: !!(
            target?.hasProfile ||
            target?.hasChat ||
            target?.hasNotification
          ),
          status,
          paths
        });
      }

      return res.json({
        ok: true,
        mode: "DRY_RUN",
        databaseModified: false,
        generatedAt: Date.now(),

        summary: {
          totalAccounts: results.length,

          migrationRequired: results.filter(
            item => item.status === "MIGRATION_REQUIRED"
          ).length,

          identityAssigned: results.filter(
            item => item.status === "IDENTITY_ASSIGNED"
          ).length,

          noLegacyData: results.filter(
            item => item.status === "NO_LEGACY_DATA"
          ).length,

          invalidAccounts: results.filter(
            item => item.status === "INVALID_USERNAME"
          ).length
        },

        accounts: results
      });

    } catch (error) {
      console.error(
        "[LiveChat Migration Preview]",
        error.message
      );

      return fail(
        res,
        500,
        "Unable to preview LiveChat migration"
      );
    }
  }
);

/* =====================================================
   END LIVECHAT IDENTITY MIGRATION - DRY RUN V1
   ===================================================== */

/* =====================================================
   LIVECHAT - VERIFIED ADMIN IDENTITY API
   ===================================================== */

app.get(
  "/api/admin/livechat-identities",
  requireAdmin,
  superOnly,
  async (req, res) => {

    try {
      const snapshot = await db
        .ref("adminUsers")
        .once("value");

      const profiles = snapshot.val() || {};
      const identities = [];
      const owners = new Map();

const authAccounts = new Map();

let pageToken;

do {

  const page = await auth.listUsers(
    1000,
    pageToken
  );

  for (const account of page.users) {
    authAccounts.set(account.uid, account);
  }

  pageToken = page.pageToken;

} while (pageToken);

      for (const [uid, profile] of Object.entries(profiles)) {

        if (
          !profile ||
          !["superadmin", "siteadmin"].includes(profile.role)
        ) {
          continue;
        }

        const username = String(
          profile.username || ""
        ).trim().toLowerCase();

        if (!usernameOK(username)) {
          return fail(
            res,
            409,
            "Invalid admin identity"
          );
        }

        const email = String(
          profile.email || ""
        ).trim().toLowerCase();

const authAccount = authAccounts.get(uid);

if (!authAccount) {
  continue;
}

const authEmail = String(
  authAccount.email || ""
).trim().toLowerCase();

if (!authEmail || authEmail !== email) {
  console.warn(
    "[LiveChat Security] Account identity mismatch"
  );

  continue;
}

        // Gunakan identity yang sedang aktif.
        // Akaun lama masih menggunakan admin_UID
        // sehingga migration selesai.
        const livechatId = resolveLiveChatId(
          uid,
          profile
        );


const legacyAdminId = `admin_${uid}`;

// SECURITY:
// Jangan gunakan legacy email sebagai bukti
// pemilikan akaun Firebase Auth semasa.

const memberIds = [...new Set([
  livechatId,
  legacyAdminId
].filter(Boolean))];

const identityPolicy = "UID_ONLY";


        // Jangan benarkan satu LiveChat ID
        // dimiliki oleh dua akaun berlainan.
        for (const sid of memberIds) {

          if (
            owners.has(sid) &&
            owners.get(sid) !== uid
          ) {
            return fail(
              res,
              409,
              "Conflicting LiveChat identities"
            );
          }

          owners.set(sid, uid);
        }


identities.push({
  uid,
  username,
  email,
  role: profile.role,

  active:
    profile.active === true &&
    profile.secondPasswordEnabled === true &&
    authAccount.disabled !== true,

  livechatId,
  memberIds,
  identityPolicy
});

      }

      res.setHeader(
        "Cache-Control",
        "no-store"
      );


return res.json({
  ok: true,
  version: 2,
  identityPolicy: "UID_ONLY",
  generatedAt: Date.now(),
  identities
});


    } catch (error) {

      console.error(
        "[LiveChat Verified Identities]",
        error.message
      );

      return fail(
        res,
        500,
        "Unable to load LiveChat identities"
      );
    }
  }
);

/* =====================================================
   END LIVECHAT - VERIFIED ADMIN IDENTITY API
   ===================================================== */

/* =====================================================
   LIVECHAT IDENTITY MIGRATION - DRY RUN V2
   ADVANCED SAFETY VERIFICATION
   READ ONLY - NO DATABASE MODIFICATION
   ===================================================== */

const { isDeepStrictEqual } = require("node:util");

app.get(
  "/api/admin/livechat-migration/preview-v2",
  requireAdmin,
  superOnly,
  async (req, res) => {

    res.setHeader("Cache-Control", "no-store");

    if (!isPrimarySuperAdmin(req.admin)) {
      return fail(res, 403, "Primary Super Admin only");
    }

    try {

      const startedAt = Date.now();

      const [
        adminSnap,
        usersSnap,
        chatsSnap,
        notificationsSnap
      ] = await Promise.all([
        db.ref("adminUsers").once("value"),
        db.ref("users").once("value"),
        db.ref("chats").once("value"),
        db.ref("notifications").once("value")
      ]);

      const admins = adminSnap.val() || {};
      const users = usersSnap.val() || {};
      const chats = chatsSnap.val() || {};
      const notifications = notificationsSnap.val() || {};

      const authUsers = new Map();
      const identityOwners = new Map();
      const accounts = [];

      let pageToken;

      /* LOAD FIREBASE AUTH ACCOUNTS */

      do {

        const page = await auth.listUsers(
          1000,
          pageToken
        );

        for (const user of page.users) {
          authUsers.set(user.uid, user);
        }

        pageToken = page.pageToken;

      } while (pageToken);

      const normalizeEmail = value =>
        String(value || "").trim().toLowerCase();

      const validKey = value =>
        typeof value === "string" &&
        value.length > 0 &&
        Buffer.byteLength(value, "utf8") <= 768 &&
        !/[.#$\[\]\/\u0000-\u001F\u007F]/.test(value);

      const hasRecord = (data, key) =>
        Object.hasOwn(data, key);

      /* BUILD ACCOUNT IDENTITIES */

      for (const [uid, profile] of Object.entries(admins)) {

        const issues = [];
        const warnings = [];

        const username = String(
          profile?.username || ""
        ).trim().toLowerCase();

        const authUser = authUsers.get(uid);

        const profileEmail = normalizeEmail(
          profile?.email
        );

        const authEmail = normalizeEmail(
          authUser?.email
        );

        if (!usernameOK(username)) {
          issues.push("INVALID_USERNAME");
        }

        if (!validKey(uid)) {
          issues.push("INVALID_UID");
        }

        if (!authUser) {
          issues.push("AUTH_ACCOUNT_NOT_FOUND");
        }

        if (!profileEmail || !authEmail ||
            profileEmail !== authEmail) {
          issues.push("AUTH_EMAIL_MISMATCH");
        }

        if (
          !["superadmin", "siteadmin"].includes(
            profile?.role
          )
        ) {
          issues.push("INVALID_ADMIN_ROLE");
        }

        if (authUser?.disabled === true) {
          warnings.push("AUTH_ACCOUNT_DISABLED");
        }

        if (profile?.active !== true) {
          warnings.push("ADMIN_ACCOUNT_INACTIVE");
        }

        let targetId = null;

        try {

          if (usernameOK(username) && validKey(uid)) {

            targetId = profile?.livechatId
              ? resolveLiveChatId(uid, profile)
              : buildLiveChatId(username, uid);

            if (!validKey(targetId)) {
              throw new Error("Invalid target ID");
            }

          }

        } catch (error) {

          targetId = null;
          issues.push("INVALID_TARGET_ID");

        }

        const oldAdminId = `admin_${uid}`;

        const oldEmailId = authEmail
          ? authEmail.replace(/[.#$\[\]\/\s]/g, "_")
          : "";

        const sourceIds = [...new Set([
          oldAdminId,
          oldEmailId,
          targetId
        ].filter(validKey))];

        for (const sid of sourceIds) {

          if (!identityOwners.has(sid)) {
            identityOwners.set(sid, new Set());
          }

          identityOwners.get(sid).add(uid);

        }

        accounts.push({
          uid,
          username,
          role: profile?.role || null,
          active: profile?.active === true,
          currentLivechatId: profile?.livechatId || null,
          targetLivechatId: targetId,
          oldEmailId,
          authEmail,
          sourceIds,
          issues,
          warnings
        });

      }

      /* CHECK DUPLICATE OWNERSHIP */

      const identityConflicts = [];

      for (const [sid, owners] of identityOwners) {

        if (owners.size > 1) {

          identityConflicts.push({
            sid,
            ownerUids: [...owners]
          });

        }

      }

      /* CHECK CHAT DATA AND MESSAGE CONFLICTS */

      const results = [];

      for (const account of accounts) {

        const issues = [...account.issues];
        const warnings = [...account.warnings];

        const messages = new Map();
        const messageConflicts = [];
        const paths = [];

        let duplicateMessages = 0;

        for (const sid of account.sourceIds) {

          const owners = identityOwners.get(sid);

          if (owners?.size > 1) {
            issues.push("IDENTITY_OWNERSHIP_CONFLICT");
          }

          const userData = users[sid];
          const chatData = chats[sid];
          const notificationData = notifications[sid];

          const hasProfile = hasRecord(users, sid);
          const hasChat = hasRecord(chats, sid);
          const hasNotification = hasRecord(
            notifications,
            sid
          );

          const hasData =
            hasProfile || hasChat || hasNotification;

          /* CHECK PROFILE EMAIL */

          const recordedEmail = normalizeEmail(
            userData?.email
          );

          if (
            recordedEmail &&
            recordedEmail !== account.authEmail
          ) {
            issues.push("LEGACY_PROFILE_EMAIL_MISMATCH");
          }

          if (
            sid === account.oldEmailId &&
            sid !== account.targetLivechatId &&
            hasData
          ) {

            // Email key alone cannot prove historical
            // ownership, especially after account recreation.

            issues.push("LEGACY_EMAIL_REVIEW_REQUIRED");

          }

          if (
            chatData != null &&
            (
              typeof chatData !== "object" ||
              Array.isArray(chatData)
            )
          ) {
            issues.push("INVALID_CHAT_DATA");
          }

          const entries =
            chatData &&
            typeof chatData === "object" &&
            !Array.isArray(chatData)
              ? Object.entries(chatData)
              : [];

          for (const [messageId, message] of entries) {

            if (
              !message ||
              typeof message !== "object" ||
              Array.isArray(message)
            ) {
              issues.push("INVALID_MESSAGE_DATA");
              continue;
            }

            if (!["user", "admin"].includes(message.from)) {
              issues.push("UNKNOWN_MESSAGE_SENDER");
            }

            if (messages.has(messageId)) {

              const previous = messages.get(messageId);

              if (
                isDeepStrictEqual(
                  previous.message,
                  message
                )
              ) {

                duplicateMessages++;

              } else {

                messageConflicts.push({
                  messageId,
                  firstSource: previous.sid,
                  secondSource: sid
                });

              }

            } else {

              messages.set(messageId, {
                sid,
                message
              });

            }

          }

          paths.push({
            sid,
            isTarget: sid === account.targetLivechatId,
            hasProfile,
            hasChat,
            hasNotification,
            messageCount: entries.length
          });

        }

        if (messageConflicts.length > 0) {
          issues.push("MESSAGE_ID_CONFLICT");
        }

        const legacyPaths = paths.filter(item =>
          !item.isTarget &&
          (
            item.hasProfile ||
            item.hasChat ||
            item.hasNotification
          )
        );

        const target = paths.find(
          item => item.isTarget
        );

        if (
          legacyPaths.some(item => item.hasNotification) ||
          (
            legacyPaths.length > 0 &&
            target?.hasNotification
          )
        ) {
          warnings.push("NOTIFICATION_MERGE_REVIEW");
        }

        /* ESTIMATED UNREAD COUNTS */

        let unreadForAdmin = 0;
        let unreadForUser = 0;

        for (const { message } of messages.values()) {

          if (
            message.from === "user" &&
            message.readByAdmin !== true
          ) {
            unreadForAdmin++;
          }

          if (
            message.from === "admin" &&
            message.readByUser !== true
          ) {
            unreadForUser++;
          }

        }

        const uniqueIssues = [...new Set(issues)];
        const uniqueWarnings = [...new Set(warnings)];

        let status;

        if (uniqueIssues.length > 0) {

          status = "BLOCKED";

        } else if (legacyPaths.length > 0) {

          status = "MIGRATION_CANDIDATE";

        } else if (
          account.currentLivechatId ===
          account.targetLivechatId
        ) {

          status = "IDENTITY_ASSIGNED";

        } else {

          status = "IDENTITY_ASSIGNMENT_REQUIRED";

        }

        results.push({
          uid: account.uid,
          username: account.username,
          role: account.role,
          active: account.active,
          currentLivechatId: account.currentLivechatId,
          targetLivechatId: account.targetLivechatId,
          status,
          issues: uniqueIssues,
          warnings: uniqueWarnings,
          legacyPathCount: legacyPaths.length,
          targetExists: Boolean(
            target?.hasProfile ||
            target?.hasChat ||
            target?.hasNotification
          ),
          uniqueMessageCount: messages.size,
          duplicateMessages,
          messageConflictCount: messageConflicts.length,
          messageConflicts,
          estimatedUnread: {
            forAdmin: unreadForAdmin,
            forUser: unreadForUser,
            reliable: uniqueIssues.length === 0
          },
          paths
        });

      }

      /* DETECT UNMAPPED RECORDS */

      const allLivechatIds = new Set([
        ...Object.keys(users),
        ...Object.keys(chats),
        ...Object.keys(notifications)
      ]);

      const orphanRecords = [];
      const guestRecords = [];

      for (const sid of allLivechatIds) {

        if (identityOwners.has(sid)) {
          continue;
        }

        const record = {
          sid,
          hasProfile: hasRecord(users, sid),
          hasChat: hasRecord(chats, sid),
          hasNotification: hasRecord(notifications, sid)
        };

        if (sid.startsWith("g_")) {
          guestRecords.push(record);
        } else {
          orphanRecords.push(record);
        }

      }

      const blockedAccounts = results.filter(
        item => item.status === "BLOCKED"
      ).length;

      const warningAccounts = results.filter(
        item => item.warnings.length > 0
      ).length;

      /* RETURN READ-ONLY REPORT */

      return res.json({
        ok: true,
        version: 2,
        mode: "DRY_RUN",
        databaseModified: false,
        executionAuthorized: false,
        generatedAt: Date.now(),
        durationMs: Date.now() - startedAt,

        summary: {
          totalAccounts: results.length,

          migrationCandidates: results.filter(
            item => item.status === "MIGRATION_CANDIDATE"
          ).length,

          identityAssigned: results.filter(
            item => item.status === "IDENTITY_ASSIGNED"
          ).length,

          identityAssignmentRequired: results.filter(
            item =>
              item.status === "IDENTITY_ASSIGNMENT_REQUIRED"
          ).length,

          blockedAccounts,
          warningAccounts,

          identityConflictCount: identityConflicts.length,

          messageConflictCount: results.reduce(
            (total, item) =>
              total + item.messageConflictCount,
            0
          ),

          duplicateMessageCount: results.reduce(
            (total, item) =>
              total + item.duplicateMessages,
            0
          ),

          orphanRecordCount: orphanRecords.length,
          guestRecordCount: guestRecords.length,

          requiresManualReview:
            blockedAccounts > 0 ||
            warningAccounts > 0 ||
            identityConflicts.length > 0 ||
            orphanRecords.length > 0
        },

        identityConflicts,
        orphanRecords,
        guestRecords,
        accounts: results
      });

    } catch (error) {

      console.error(
        "[LiveChat Migration Preview V2]",
        error.message
      );

      return fail(
        res,
        500,
        "Unable to preview LiveChat migration V2"
      );

    }
  }
);

/* =====================================================
   END LIVECHAT IDENTITY MIGRATION - DRY RUN V2
   ===================================================== */

/* =====================================================
   LIVECHAT LEGACY OWNERSHIP VERIFICATION V3
   READ ONLY - NO DATABASE MODIFICATION
   ===================================================== */

app.get(
  "/api/admin/livechat-migration/ownership-v3",
  requireAdmin,
  superOnly,
  async (req, res) => {

    res.setHeader("Cache-Control", "no-store");

    if (!isPrimarySuperAdmin(req.admin)) {
      return fail(res, 403, "Primary Super Admin only");
    }

    try {

      const [
        adminSnap,
        usersSnap,
        chatsSnap,
        notificationsSnap,
        indexSnap
      ] = await Promise.all([
        db.ref("adminUsers").once("value"),
        db.ref("users").once("value"),
        db.ref("chats").once("value"),
        db.ref("notifications").once("value"),
        db.ref("adminUsernameIndex").once("value")
      ]);

      const admins = adminSnap.val() || {};
      const users = usersSnap.val() || {};
      const chats = chatsSnap.val() || {};
      const notifications = notificationsSnap.val() || {};
      const usernameIndex = indexSnap.val() || {};

      const authUsers = new Map();
      const knownIds = new Set();
      const reviews = [];
      const orphanRecords = [];

      let pageToken;

      /* LOAD FIREBASE AUTH USERS */

      do {

        const page = await auth.listUsers(
          1000,
          pageToken
        );

        for (const user of page.users) {
          authUsers.set(user.uid, user);
        }

        pageToken = page.pageToken;

      } while (pageToken);

      /* NORMALIZE EMAIL */

      const normalizeEmail = value =>
        String(value || "").trim().toLowerCase();

      const emailToKey = email =>
        normalizeEmail(email)
          .replace(/[.#$\[\]\/\s]/g, "_");

      const hasRecord = (data, key) =>
        Object.hasOwn(data, key);

      const validTimestamp = value =>
        typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value > 0 &&
        value <= Date.now();

      const toISO = value =>
        validTimestamp(value)
          ? new Date(value).toISOString()
          : null;

      /* ANALYZE CHAT TIMESTAMPS */

      function inspectChatTimeline(sid, createdAt) {

        const data = chats[sid];

        const messages =
          data &&
          typeof data === "object"
            ? Object.values(data)
            : [];

        let earliest = null;
        let latest = null;
        let beforeAccountCreation = 0;
        let invalidTimestamps = 0;

        for (const message of messages) {

          const time = message?.time;

          if (!validTimestamp(time)) {
            invalidTimestamps++;
            continue;
          }

          if (earliest === null || time < earliest) {
            earliest = time;
          }

          if (latest === null || time > latest) {
            latest = time;
          }

          if (
            validTimestamp(createdAt) &&
            time < createdAt
          ) {
            beforeAccountCreation++;
          }

        }

        return {
          messageCount: messages.length,
          earliestMessageAt: toISO(earliest),
          latestMessageAt: toISO(latest),
          beforeAccountCreation,
          invalidTimestamps
        };

      }

      /* VERIFY EXISTING ADMIN ACCOUNTS */

      for (const [uid, profile] of Object.entries(admins)) {

        const username = String(
          profile?.username || ""
        ).trim().toLowerCase();

        const authUser = authUsers.get(uid);

        const authEmail = normalizeEmail(
          authUser?.email
        );

        const profileEmail = normalizeEmail(
          profile?.email
        );

        const legacyAdminId = `admin_${uid}`;
        const legacyEmailId = emailToKey(authEmail);

        let targetId = null;

        const issues = [];

        try {

          targetId = profile?.livechatId
            ? resolveLiveChatId(uid, profile)
            : buildLiveChatId(username, uid);

        } catch (error) {

          issues.push("INVALID_TARGET_ID");

        }

        for (const sid of [
          legacyAdminId,
          legacyEmailId,
          targetId
        ]) {
          if (sid) knownIds.add(sid);
        }

        const authCreatedAt = Date.parse(
          authUser?.metadata?.creationTime || ""
        );

        const profileCreatedAt =
          profile?.createdAt;

        const authExists = Boolean(authUser);

        const emailMatches =
          Boolean(authEmail) &&
          authEmail === profileEmail;

        const usernameIndexMatches =
          usernameIndex[username]?.uid === uid;

        if (!authExists) {
          issues.push("AUTH_ACCOUNT_NOT_FOUND");
        }

        if (!emailMatches) {
          issues.push("AUTH_EMAIL_MISMATCH");
        }

        if (!usernameIndexMatches) {
          issues.push("USERNAME_INDEX_MISMATCH");
        }

        if (!usernameOK(username)) {
          issues.push("INVALID_USERNAME");
        }

        if (
          !["superadmin", "siteadmin"]
            .includes(profile?.role)
        ) {
          issues.push("INVALID_ADMIN_ROLE");
        }

        if (!validTimestamp(authCreatedAt)) {
          issues.push("AUTH_CREATION_TIME_UNKNOWN");
        }

        const legacyEmailExists =
          Boolean(legacyEmailId) &&
          (
            hasRecord(users, legacyEmailId) ||
            hasRecord(chats, legacyEmailId) ||
            hasRecord(notifications, legacyEmailId)
          );

        const legacyProfile =
          users[legacyEmailId] || {};

        const legacyProfileEmail = normalizeEmail(
          legacyProfile.email
        );

        const legacyProfileEmailMatches =
          Boolean(legacyProfileEmail) &&
          legacyProfileEmail === authEmail;

        const legacyTimeline = inspectChatTimeline(
          legacyEmailId,
          authCreatedAt
        );

        const adminTimeline = inspectChatTimeline(
          legacyAdminId,
          authCreatedAt
        );

        if (
          legacyEmailExists &&
          legacyProfileEmail &&
          !legacyProfileEmailMatches
        ) {
          issues.push(
            "LEGACY_PROFILE_EMAIL_MISMATCH"
          );
        }

        if (
          legacyTimeline.beforeAccountCreation > 0
        ) {
          issues.push(
            "LEGACY_CHAT_PREDATES_AUTH_ACCOUNT"
          );
        }

        if (
          adminTimeline.beforeAccountCreation > 0
        ) {
          issues.push(
            "UID_CHAT_PREDATES_AUTH_ACCOUNT"
          );
        }

        if (
          legacyTimeline.invalidTimestamps > 0 ||
          adminTimeline.invalidTimestamps > 0
        ) {
          issues.push(
            "INVALID_MESSAGE_TIMESTAMPS"
          );
        }

        if (
          legacyEmailExists &&
          !legacyProfileEmailMatches
        ) {
          issues.push(
            "LEGACY_PROFILE_EVIDENCE_MISSING"
          );
        }

        let status;

        if (issues.length > 0) {

          status = "REVIEW_BLOCKED";

        } else if (legacyEmailExists) {

          status = "MANUAL_OWNERSHIP_REVIEW";

        } else {

          status = "NO_LEGACY_EMAIL_DATA";

        }

        reviews.push({
          uid,
          username,
          role: profile?.role || null,

          status,
          issues: [...new Set(issues)],

          evidence: {
            authExists,
            emailMatches,
            usernameIndexMatches,
            legacyProfileEmailMatches,
            legacyEmailExists,

            authCreatedAt:
              toISO(authCreatedAt),

            profileCreatedAt:
              toISO(profileCreatedAt),

            legacyEmailTimeline:
              legacyTimeline,

            legacyAdminTimeline:
              adminTimeline
          },

          ownershipApproved: false,
          executionAuthorized: false
        });

      }

      /* CLASSIFY ORPHAN RECORDS */

      const allIds = new Set([
        ...Object.keys(users),
        ...Object.keys(chats),
        ...Object.keys(notifications)
      ]);

      let guestRecordCount = 0;

      for (const sid of allIds) {

        if (knownIds.has(sid)) {
          continue;
        }

        if (sid.startsWith("g_")) {
          guestRecordCount++;
          continue;
        }

        let type = "UNKNOWN_IDENTITY";
        let classification = "MANUAL_REVIEW";
        let authAccountExists = null;
        let adminProfileExists = null;

        if (sid.startsWith("admin_")) {

          type = "LEGACY_ADMIN_ID";

          const oldUid = sid.slice(6);

          authAccountExists =
            authUsers.has(oldUid);

          adminProfileExists =
            hasRecord(admins, oldUid);

          if (
            !authAccountExists &&
            !adminProfileExists
          ) {

            classification =
              "POSSIBLE_DELETED_ACCOUNT";

          } else {

            classification =
              "UNMAPPED_EXISTING_ACCOUNT";

          }

        } else if (sid.includes("@")) {

          type = "LEGACY_EMAIL_ID";

          const matches = [...authUsers.values()]
            .filter(user =>
              emailToKey(user.email) === sid
            );

          authAccountExists = matches.length > 0;

          if (matches.length === 0) {

            classification =
              "NO_CURRENT_AUTH_EMAIL_MATCH";

          } else {

            classification =
              "UNMAPPED_EMAIL_ACCOUNT";

          }

        }

        orphanRecords.push({
          sid,
          type,
          classification,

          authAccountExists,
          adminProfileExists,

          hasProfile: hasRecord(users, sid),
          hasChat: hasRecord(chats, sid),
          hasNotification:
            hasRecord(notifications, sid),

          timeline: inspectChatTimeline(sid, null),

          deletionAuthorized: false,
          migrationAuthorized: false
        });

      }

      /* GENERATE SUMMARY */

      const countStatus = status =>
        reviews.filter(
          account => account.status === status
        ).length;

      const issueCounts = {};

      for (const account of reviews) {

        for (const issue of account.issues) {

          issueCounts[issue] =
            (issueCounts[issue] || 0) + 1;

        }

      }

      return res.json({
        ok: true,
        version: 3,
        mode: "OWNERSHIP_REVIEW",

        databaseModified: false,
        executionAuthorized: false,

        generatedAt: Date.now(),

        summary: {

          totalAccounts: reviews.length,

          reviewBlocked:
            countStatus("REVIEW_BLOCKED"),

          manualOwnershipReview:
            countStatus("MANUAL_OWNERSHIP_REVIEW"),

          noLegacyEmailData:
            countStatus("NO_LEGACY_EMAIL_DATA"),

          orphanRecordCount:
            orphanRecords.length,

          possibleDeletedAccounts:
            orphanRecords.filter(record =>
              record.classification ===
              "POSSIBLE_DELETED_ACCOUNT"
            ).length,

          guestRecordCount,

          ownershipApproved: 0

        },

        issueCounts,
        accounts: reviews,
        orphanRecords

      });

    } catch (error) {

      console.error(
        "[LiveChat Ownership Verification V3]",
        error.message
      );

      return fail(
        res,
        500,
        "Unable to verify legacy ownership"
      );

    }

  }
);

/* =====================================================
   END LIVECHAT LEGACY OWNERSHIP VERIFICATION V3
   ===================================================== */

/* =====================================================
   LIVECHAT MIGRATION V4 - MANUAL REVIEW & ARCHIVE PLAN
   READ ONLY - NO DATABASE MODIFICATION
   ===================================================== */

app.get(
  "/api/admin/livechat-migration/plan-v4",
  requireAdmin,
  superOnly,
  async (req, res) => {

    res.setHeader("Cache-Control", "no-store");

    if (!isPrimarySuperAdmin(req.admin)) {
      return fail(res, 403, "Primary Super Admin only");
    }

    try {

const [
  adminSnap,
  usersSnap,
  chatsSnap,
  notificationsSnap,
  indexSnap,
  approvalsSnap
] = await Promise.all([
  db.ref("adminUsers").once("value"),
  db.ref("users").once("value"),
  db.ref("chats").once("value"),
  db.ref("notifications").once("value"),
  db.ref("adminUsernameIndex").once("value"),
  db.ref(LIVECHAT_REVIEW_PATH).once("value")
]);

      const admins = adminSnap.val() || {};
      const users = usersSnap.val() || {};
      const chats = chatsSnap.val() || {};
      const notifications = notificationsSnap.val() || {};
      const usernameIndex = indexSnap.val() || {};
const ownershipApprovals =
  approvalsSnap.val() || {};
      
      const authUsers = new Map();
      const owners = new Map();
      const accounts = [];
      const archivePlan = [];
      const guestRecords = [];

      let pageToken;

      /* LOAD FIREBASE AUTH ACCOUNTS */

      do {

        const page = await auth.listUsers(
          1000,
          pageToken
        );

        for (const user of page.users) {
          authUsers.set(user.uid, user);
        }

        pageToken = page.pageToken;

      } while (pageToken);

      /* IDENTITY HELPERS */

      const normalizeEmail = value =>
        String(value || "").trim().toLowerCase();

      const emailToKey = value =>
        normalizeEmail(value)
          .replace(/[.#$\[\]\/\s]/g, "_");

      const validKey = value =>
        typeof value === "string" &&
        value.length > 0 &&
        Buffer.byteLength(value, "utf8") <= 768 &&
        !/[.#$\[\]\/\u0000-\u001F\u007F]/.test(value);

      const hasRecord = (data, sid) =>
        Boolean(sid) && Object.hasOwn(data, sid);

      function inspectRecord(sid) {

        const messages = hasRecord(chats, sid)
          ? Object.values(chats[sid] || {})
          : [];

        return {
          sid,
          hasProfile: hasRecord(users, sid),
          hasChat: hasRecord(chats, sid),
          hasNotification:
            hasRecord(notifications, sid),
          messageCount: messages.length
        };

      }

      function recordExists(record) {

        return (
          record.hasProfile ||
          record.hasChat ||
          record.hasNotification
        );

      }

      function registerOwner(sid, uid) {

        if (!validKey(sid)) return;

        if (!owners.has(sid)) {
          owners.set(sid, new Set());
        }

        owners.get(sid).add(uid);

      }

      /* BUILD ACCOUNT IDENTITY PLAN */

      for (const [uid, profile] of Object.entries(admins)) {

        const username = String(
          profile?.username || ""
        ).trim().toLowerCase();

        const authUser = authUsers.get(uid);

        const authEmail = normalizeEmail(
          authUser?.email
        );

        const profileEmail = normalizeEmail(
          profile?.email
        );

        const legacyAdminId = `admin_${uid}`;

        const legacyEmailId =
          emailToKey(authEmail);

        const profileEmailId =
          emailToKey(profileEmail);

        const issues = [];

        let targetId = null;

        try {

          targetId = profile?.livechatId
            ? resolveLiveChatId(uid, profile)
            : buildLiveChatId(username, uid);

          if (!validKey(targetId)) {
            throw new Error("Invalid target");
          }

        } catch (error) {

          targetId = null;
          issues.push("INVALID_TARGET_ID");

        }

        if (!authUser) {
          issues.push("AUTH_ACCOUNT_NOT_FOUND");
        }
if (
  profile?.active !== true ||
  authUser?.disabled === true
) {
  issues.push("ACCOUNT_INACTIVE");
}
        if (!authEmail || authEmail !== profileEmail) {
          issues.push("AUTH_EMAIL_MISMATCH");
        }

        if (!usernameOK(username)) {
          issues.push("INVALID_USERNAME");
        }

        if (usernameIndex[username]?.uid !== uid) {
          issues.push("USERNAME_INDEX_MISMATCH");
        }

        if (
          !["superadmin", "siteadmin"]
            .includes(profile?.role)
        ) {
          issues.push("INVALID_ADMIN_ROLE");
        }

        const authCreatedAt = Date.parse(
          authUser?.metadata?.creationTime || ""
        );

        if (
          !Number.isFinite(authCreatedAt) ||
          authCreatedAt <= 0 ||
          authCreatedAt > Date.now()
        ) {
          issues.push("INVALID_AUTH_CREATION_TIME");
        }

        const sourceIds = [...new Set([
          legacyAdminId,
          legacyEmailId,
          profileEmailId,
          targetId
        ].filter(validKey))];

        for (const sid of sourceIds) {
          registerOwner(sid, uid);
        }

        const records = sourceIds
          .map(inspectRecord)
          .filter(recordExists);

        const emailRecord =
          inspectRecord(legacyEmailId);

        const legacyEmailExists =
          recordExists(emailRecord);

        if (legacyEmailExists) {

          const oldEmail = normalizeEmail(
            users[legacyEmailId]?.email
          );

          if (!oldEmail) {
            issues.push(
              "LEGACY_PROFILE_EVIDENCE_MISSING"
            );
          } else if (oldEmail !== authEmail) {
            issues.push(
              "LEGACY_PROFILE_EMAIL_MISMATCH"
            );
          }

        }

        let messagesBeforeAccount = 0;

        /* CHECK ALL SOURCE TIMESTAMPS */

        for (const record of records) {

          const messages = Object.values(
            chats[record.sid] || {}
          );

          for (const message of messages) {

            const time = message?.time;

            if (
              !Number.isSafeInteger(time) ||
              time <= 0 ||
              time > Date.now()
            ) {

              issues.push(
                "INVALID_MESSAGE_TIMESTAMP"
              );

              continue;

            }

            if (
              Number.isFinite(authCreatedAt) &&
              time < authCreatedAt
            ) {

              messagesBeforeAccount++;

              issues.push(
                "CHAT_PREDATES_AUTH_ACCOUNT"
              );

            }

          }

        }

        accounts.push({

          uid,
          username,

          active: profile?.active === true,
          authDisabled: authUser?.disabled === true,

          currentId: profile?.livechatId || legacyAdminId,

targetId,
sourceIds,
records,

legacyEmailId,
legacyEmailExists,
messagesBeforeAccount,

          issues: [...new Set(issues)],

          ownershipApproved: false,
          migrationAuthorized: false

        });

      }

      /* DETECT IDENTITY OWNERSHIP CONFLICTS */

      for (const account of accounts) {

        for (const sid of account.sourceIds) {

          if ((owners.get(sid)?.size || 0) > 1) {

            account.issues.push(
              "IDENTITY_OWNERSHIP_CONFLICT"
            );

          }

        }

        account.issues = [
          ...new Set(account.issues)
        ];

/* ==========================================
   OWNERSHIP APPROVAL INTEGRATION
   READ ONLY - NO MIGRATION EXECUTION
   ========================================== */

const approval =
  ownershipApprovals[account.uid] || null;

account.ownershipApproved = false;
account.migrationAuthorized = false;
account.approvalStatus = "NOT_REVIEWED";
account.approvalFingerprintMatched = false;
account.reviewedAt = null;

if (account.issues.length > 0) {

  account.status = "HOLD_FOR_REVIEW";

  account.approvalStatus =
    "BLOCKED_BY_ACCOUNT_ISSUES";

  account.recommendedAction =
    "KEEP_ALL_SOURCE_DATA_UNCHANGED";

} else if (!account.legacyEmailExists) {

  account.status = "IDENTITY_PLAN_REVIEW";

  account.approvalStatus = "NOT_REQUIRED";

  account.recommendedAction =
    "REVIEW_UID_AND_TARGET_BEFORE_ASSIGNMENT";

} else {

  account.status = "MANUAL_APPROVAL_REQUIRED";

  account.recommendedAction =
    "VERIFY_LEGACY_EMAIL_OWNERSHIP";

  if (approval) {

    try {

      const evidence =
        await getLivechatOwnershipEvidence(
          account.uid
        );

      const expectedReviewer = String(
        process.env.PRIMARY_SUPERADMIN_UID || ""
      ).trim();

      const validDecision = [
        "APPROVED",
        "REJECTED",
        "HOLD"
      ].includes(approval.decision);

      const identityMatched =
        approval.uid === account.uid &&
        approval.username === account.username &&
        approval.legacyEmailId ===
          account.legacyEmailId &&
        approval.targetId === account.targetId &&
        evidence.legacyEmailId ===
          account.legacyEmailId &&
        evidence.targetId === account.targetId;

      const reviewerMatched =
        Boolean(expectedReviewer) &&
        approval.reviewedBy === expectedReviewer;

      const fingerprintMatched =
        typeof approval.fingerprint === "string" &&
        approval.fingerprint === evidence.fingerprint;

      account.approvalFingerprintMatched =
        fingerprintMatched;

      account.reviewedAt =
        approval.reviewedAt || null;

      if (
        !validDecision ||
        !identityMatched ||
        !reviewerMatched ||
        !fingerprintMatched ||
        !evidence.legacyExists ||
        evidence.issues.length > 0
      ) {

        account.status = "HOLD_FOR_REVIEW";

        account.approvalStatus =
          "STALE_OR_INVALID";

        account.recommendedAction =
          "REVIEW_OWNERSHIP_EVIDENCE_AGAIN";

      } else if (
        approval.decision === "APPROVED"
      ) {

        account.ownershipApproved = true;

        account.approvalStatus =
          "VERIFIED_APPROVAL";

        account.status =
          "OWNERSHIP_APPROVED";

        account.recommendedAction =
          "REVIEW_SAFE_MIGRATION_PLAN";

      } else if (
        approval.decision === "REJECTED"
      ) {

        account.approvalStatus = "REJECTED";

        account.status =
          "OWNERSHIP_REJECTED";

        account.recommendedAction =
          "KEEP_LEGACY_DATA_UNCHANGED";

      } else {

        account.approvalStatus = "HOLD";

        account.status = "HOLD_FOR_REVIEW";

        account.recommendedAction =
          "KEEP_ALL_SOURCE_DATA_UNCHANGED";

      }

    } catch (error) {

      account.ownershipApproved = false;

      account.status = "HOLD_FOR_REVIEW";

      account.approvalStatus =
        "VERIFICATION_FAILED";

      account.recommendedAction =
        "REVIEW_OWNERSHIP_EVIDENCE_AGAIN";

      console.error(
        "[Migration Approval Verification]",
        error.message
      );

    }

  }

}

/* EXECUTION MUST REMAIN DISABLED */

account.migrationAuthorized = false;  

      }

      /* BUILD ORPHAN ARCHIVE PLAN */

      const allIds = new Set([
        ...Object.keys(users),
        ...Object.keys(chats),
        ...Object.keys(notifications)
      ]);

      for (const sid of allIds) {

        if (owners.has(sid)) continue;

        const record = inspectRecord(sid);

        if (sid.startsWith("g_")) {

          guestRecords.push({
            ...record,
            recommendedAction: "KEEP_UNCHANGED"
          });

          continue;

        }

        let classification = "UNKNOWN_IDENTITY";

        if (sid.startsWith("admin_")) {

          const oldUid = sid.slice(6);

          classification =
            !authUsers.has(oldUid) &&
            !Object.hasOwn(admins, oldUid)
              ? "POSSIBLE_DELETED_ACCOUNT"
              : "UNMAPPED_EXISTING_ACCOUNT";

        } else if (sid.includes("@")) {

          const matches = [...authUsers.values()]
            .filter(user =>
              emailToKey(user.email) === sid
            );

          classification = matches.length === 0
            ? "NO_CURRENT_AUTH_EMAIL_MATCH"
            : "UNMAPPED_EMAIL_ACCOUNT";

        }

        archivePlan.push({

          ...record,

          classification,

          recommendedAction:
            "RETAIN_PENDING_PRIVATE_ARCHIVE_REVIEW",

          archiveAuthorized: false,
          deletionAuthorized: false

        });

      }

      /* GENERATE FINAL PLAN SUMMARY */

      const countStatus = status =>
        accounts.filter(
          account => account.status === status
        ).length;

      const issueCounts = {};

      for (const account of accounts) {

        for (const issue of account.issues) {

          issueCounts[issue] =
            (issueCounts[issue] || 0) + 1;

        }

      }

      return res.json({

        ok: true,
        version: 4,
        mode: "MIGRATION_PLAN_ONLY",

        generatedAt: Date.now(),

        databaseModified: false,
        executionAuthorized: false,
        archiveAuthorized: false,
        deletionAuthorized: false,

        summary: {

          totalAccounts: accounts.length,

          manualApprovalRequired:
            countStatus("MANUAL_APPROVAL_REQUIRED"),

          identityPlanReview:
            countStatus("IDENTITY_PLAN_REVIEW"),

          holdForReview:
            countStatus("HOLD_FOR_REVIEW"),

          orphanRecords: archivePlan.length,

          orphanMessages: archivePlan.reduce(
            (total, record) =>
              total + record.messageCount,
            0
          ),

          guestRecords: guestRecords.length,

ownershipApproved: accounts.filter(
  account =>
    account.ownershipApproved === true
).length,

ownershipRejected:
  countStatus("OWNERSHIP_REJECTED"),

staleApprovals: accounts.filter(
  account =>
    account.approvalStatus === "STALE_OR_INVALID"
).length,

approvalVerificationFailed: accounts.filter(
  account =>
    account.approvalStatus === "VERIFICATION_FAILED"
).length,

migrationAuthorized: 0

        },

        issueCounts,
        accounts,
        archivePlan,
        guestRecords

      });

    } catch (error) {

      console.error(
        "[LiveChat Migration Plan V4]",
        error.message
      );

      return fail(
        res,
        500,
        "Unable to generate migration plan"
      );

    }

  }
);

/* =====================================================
   END LIVECHAT MIGRATION V4 - MANUAL REVIEW & ARCHIVE PLAN
   ===================================================== */

/* =====================================================
   LIVECHAT MIGRATION - MANUAL OWNERSHIP REVIEW
   ===================================================== */

const LIVECHAT_REVIEW_PATH =
  "livechatMigrationApprovals";

const LIVECHAT_REVIEW_AUDIT_PATH =
  "livechatMigrationAudit";

function validMigrationUid(uid) {

  return (
    typeof uid === "string" &&
    uid.length > 0 &&
    uid.length <= 128 &&
    !/[.#$\[\]\/\s\u0000-\u001F\u007F]/.test(uid)
  );

}

function requirePrimaryMigrationAdmin(req, res, next) {

  if (!isPrimarySuperAdmin(req.admin)) {
    return fail(
      res,
      403,
      "Primary Super Admin only"
    );
  }

  res.setHeader("Cache-Control", "no-store");

  return next();

}

function stableMigrationValue(value) {

  if (Array.isArray(value)) {
    return value.map(stableMigrationValue);
  }

  if (value !== null && typeof value === "object") {

    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [
          key,
          stableMigrationValue(value[key])
        ])
    );

  }

  return value;

}

function migrationFingerprint(value) {

  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify(
        stableMigrationValue(value)
      )
    )
    .digest("hex");

}

async function getLivechatOwnershipEvidence(uid) {

  const profile = await adminProfile(uid);

  if (!profile) {
    throw new Error("Admin profile not found");
  }

  const authUser = await auth.getUser(uid);

  const username = String(
    profile.username || ""
  ).trim().toLowerCase();

  const email = String(
    authUser.email || ""
  ).trim().toLowerCase();

  const profileEmail = String(
    profile.email || ""
  ).trim().toLowerCase();

  if (
    !usernameOK(username) ||
    !email ||
    email !== profileEmail ||
    !["superadmin", "siteadmin"].includes(profile.role)
  ) {
    throw new Error("Account identity mismatch");
  }

  const indexSnapshot = await db
    .ref(`adminUsernameIndex/${username}`)
    .once("value");

  if (indexSnapshot.val()?.uid !== uid) {
    throw new Error("Username index mismatch");
  }

  const legacyEmailId = email.replace(
    /[.#$\[\]\/\s]/g,
    "_"
  );

  const targetId = profile.livechatId
    ? resolveLiveChatId(uid, profile)
    : buildLiveChatId(username, uid);

  const validKey = key =>
    typeof key === "string" &&
    key.length > 0 &&
    Buffer.byteLength(key, "utf8") <= 768 &&
    !/[.#$\[\]\/\u0000-\u001F\u007F]/.test(key);

  if (
    !validKey(legacyEmailId) ||
    !validKey(targetId)
  ) {
    throw new Error("Invalid migration identity");
  }

  const createdAt = Date.parse(
    authUser.metadata.creationTime
  );

  if (
    !Number.isFinite(createdAt) ||
    createdAt <= 0 ||
    createdAt > Date.now()
  ) {
    throw new Error("Invalid account creation time");
  }

  const [
    userSnapshot,
    chatSnapshot,
    notificationSnapshot
  ] = await Promise.all([

    db.ref(`users/${legacyEmailId}`)
      .once("value"),

    db.ref(`chats/${legacyEmailId}`)
      .once("value"),

    db.ref(`notifications/${legacyEmailId}`)
      .once("value")

  ]);

  const legacyProfile = userSnapshot.val();
  const legacyChat = chatSnapshot.val();
  const legacyNotifications = notificationSnapshot.val();

  const messages = Object.values(
    legacyChat || {}
  );

  const issues = [];

  const legacyExists =
    userSnapshot.exists() ||
    chatSnapshot.exists() ||
    notificationSnapshot.exists();

  const legacyProfileEmail = String(
    legacyProfile?.email || ""
  ).trim().toLowerCase();

  if (
    legacyExists &&
    legacyProfileEmail !== email
  ) {
    issues.push("LEGACY_PROFILE_EMAIL_MISMATCH");
  }

  let messagesBeforeAccount = 0;

  for (const message of messages) {

    const time = message?.time;

    if (
      !Number.isSafeInteger(time) ||
      time <= 0 ||
      time > Date.now()
    ) {

      issues.push("INVALID_MESSAGE_TIMESTAMP");

      continue;

    }

    if (time < createdAt) {
      messagesBeforeAccount++;
    }

  }

  if (messagesBeforeAccount > 0) {
    issues.push("CHAT_PREDATES_AUTH_ACCOUNT");
  }

  if (
    authUser.disabled === true ||
    profile.active !== true
  ) {
    issues.push("ACCOUNT_INACTIVE");
  }

  const fingerprint = migrationFingerprint({

    uid,
    username,
    email,
    createdAt,
    targetId,

    legacyProfile,
    legacyChat,
    legacyNotifications

  });

  return {

    uid,
    username,
    legacyEmailId,
    targetId,
    createdAt,

    legacyExists,

    messageCount: messages.length,

    messagesBeforeAccount,

    issues: [...new Set(issues)],

    fingerprint

  };

}


/* GET OWNERSHIP EVIDENCE */

app.get(
  "/api/admin/livechat-migration/ownership-evidence/:uid",

  requireAdmin,
  superOnly,
  requirePrimaryMigrationAdmin,

  async (req, res) => {

    const uid = req.params.uid;

    if (!validMigrationUid(uid)) {
      return fail(res, 400, "Invalid UID");
    }

    try {

      const evidence =
        await getLivechatOwnershipEvidence(uid);

      return res.json({

        ok: true,

        evidence,

        databaseModified: false,

        executionAuthorized: false

      });

    } catch (error) {

      console.error(
        "[LiveChat Ownership Evidence]",
        error.message
      );

      return fail(
        res,
        409,
        "Unable to verify ownership evidence"
      );

    }

  }

);

/* SAVE MANUAL OWNERSHIP DECISION */

app.post(
  "/api/admin/livechat-migration/ownership-decision",

  requireAdmin,
  superOnly,
  requirePrimaryMigrationAdmin,

  async (req, res) => {

    try {

      const uid = req.body?.uid;

      const decision = req.body?.decision;

      const fingerprint = req.body?.fingerprint;

      const reason = typeof req.body?.reason === "string"
        ? req.body.reason.trim()
        : "";

      if (!validMigrationUid(uid)) {
        return fail(res, 400, "Invalid UID");
      }

      if (![
        "APPROVED",
        "REJECTED",
        "HOLD"
      ].includes(decision)) {
        return fail(res, 400, "Invalid decision");
      }

      if (
        reason.length < 20 ||
        reason.length > 1000
      ) {
        return fail(
          res,
          400,
          "Review reason must contain 20-1000 characters"
        );
      }

      if (
        typeof fingerprint !== "string" ||
        !/^[a-f0-9]{64}$/.test(fingerprint)
      ) {
        return fail(
          res,
          400,
          "Invalid evidence fingerprint"
        );
      }

      const evidence =
        await getLivechatOwnershipEvidence(uid);

      if (evidence.fingerprint !== fingerprint) {

        return fail(
          res,
          409,
          "Evidence changed. Review again."
        );

      }

      if (decision === "APPROVED") {

        if (!evidence.legacyExists) {

          return fail(
            res,
            409,
            "No legacy record to approve"
          );

        }

        if (evidence.issues.length > 0) {

          return fail(
            res,
            409,
            "Account has unresolved ownership issues"
          );

        }

        if (req.body?.ownershipConfirmed !== true) {

          return fail(
            res,
            400,
            "Manual ownership confirmation required"
          );

        }

      }

      const timestamp = Date.now();

      const auditId = db
        .ref(LIVECHAT_REVIEW_AUDIT_PATH)
        .push().key;

      const record = {

        uid,

        username: evidence.username,

        legacyEmailId: evidence.legacyEmailId,

        targetId: evidence.targetId,

        fingerprint: evidence.fingerprint,

        decision,

        reason,

        messageCount: evidence.messageCount,

        messagesBeforeAccount:
          evidence.messagesBeforeAccount,

        issues: evidence.issues,

        reviewedBy: req.admin.uid,

        reviewedAt: timestamp,

        auditId,

        migrationAuthorized: false,

        deletionAuthorized: false

      };

      const updates = {};

      updates[
        `${LIVECHAT_REVIEW_PATH}/${uid}`
      ] = record;

      updates[
        `${LIVECHAT_REVIEW_AUDIT_PATH}/${auditId}`
      ] = record;

      await db.ref().update(updates);

      return res.json({

        ok: true,

        decision,

        approvalRecorded: true,

        reviewDatabaseModified: true,

        livechatDataModified: false,

        executionAuthorized: false,

        deletionAuthorized: false

      });

    } catch (error) {

      console.error(
        "[LiveChat Ownership Decision]",
        error.message
      );

      return fail(
        res,
        500,
        "Unable to save ownership decision"
      );

    }

  }

);

/* GET OWNERSHIP REVIEW STATUS */

app.get(
  "/api/admin/livechat-migration/ownership-status",

  requireAdmin,
  superOnly,
  requirePrimaryMigrationAdmin,

  async (req, res) => {

    try {

      const snapshot = await db
        .ref(LIVECHAT_REVIEW_PATH)
        .once("value");

      const reviews = Object.values(
        snapshot.val() || {}
      );

      return res.json({

        ok: true,

        version: 1,

        mode: "MANUAL_OWNERSHIP_REVIEW",

        summary: {

          totalReviewed: reviews.length,

          approved: reviews.filter(
            item => item.decision === "APPROVED"
          ).length,

          rejected: reviews.filter(
            item => item.decision === "REJECTED"
          ).length,

          hold: reviews.filter(
            item => item.decision === "HOLD"
          ).length

        },

        reviews,

        databaseModified: false,

        executionAuthorized: false,

        archiveAuthorized: false,

        deletionAuthorized: false

      });

    } catch (error) {

      console.error(
        "[LiveChat Ownership Status]",
        error.message
      );

      return fail(
        res,
        500,
        "Unable to load ownership review status"
      );

    }

  }

);

/* =====================================================
   END LIVECHAT MIGRATION - MANUAL OWNERSHIP REVIEW
   ===================================================== */

/* =====================================================
   LIVECHAT - SAFE MIGRATION EXECUTION PREVIEW V1
   READ ONLY - NO DATABASE MODIFICATION
   ===================================================== */

app.get(
  "/api/admin/livechat-migration/execution-preview/:uid",

  requireAdmin,
  superOnly,
  requirePrimaryMigrationAdmin,

  async (req, res) => {

    try {

      const uid = req.params.uid;

      if (!validMigrationUid(uid)) {
        return fail(res, 400, "Invalid UID");
      }

      const evidence =
        await getLivechatOwnershipEvidence(uid);

      const legacyAdminId = `admin_${uid}`;

      const targetId = evidence.targetId;

      const issues = [...evidence.issues];

      const [
        approvalSnapshot,
        usersSnapshot,
        chatsSnapshot,
        notificationsSnapshot
      ] = await Promise.all([

        db.ref(`${LIVECHAT_REVIEW_PATH}/${uid}`)
          .once("value"),

        db.ref("users").once("value"),

        db.ref("chats").once("value"),

        db.ref("notifications").once("value")

      ]);

      const approval = approvalSnapshot.val();

      const users = usersSnapshot.val() || {};
      const chats = chatsSnapshot.val() || {};
      const notifications =
        notificationsSnapshot.val() || {};

      const currentEvidence =
        await getLivechatOwnershipEvidence(uid);

      if (
        currentEvidence.fingerprint !==
        evidence.fingerprint
      ) {
        issues.push("EVIDENCE_CHANGED");
      }

      /* VERIFY MANUAL OWNERSHIP APPROVAL */

      const approvalVerified = Boolean(

        approval &&
        approval.decision === "APPROVED" &&
        approval.uid === uid &&
        approval.username === evidence.username &&
        approval.legacyEmailId ===
          evidence.legacyEmailId &&
        approval.targetId === targetId &&
        approval.reviewedBy === req.admin.uid &&
        approval.fingerprint ===
          currentEvidence.fingerprint

      );

      if (
        evidence.legacyExists &&
        !approvalVerified
      ) {
        issues.push("OWNERSHIP_APPROVAL_REQUIRED");
      }

      /* BUILD SOURCE PLAN */

      const sourceIds = [...new Set([

        legacyAdminId,
        targetId,

        ...(evidence.legacyExists
          ? [evidence.legacyEmailId]
          : [])

      ])];

      const sources = [];

      const messageMap = new Map();

      const conflicts = [];

      let duplicateMessages = 0;

      let totalSourceMessages = 0;

      /* INSPECT MESSAGE COLLISIONS */

      for (const sid of sourceIds) {

        const chat = Object.hasOwn(chats, sid)
          ? chats[sid]
          : {};

        const entries = Object.entries(chat || {});

        totalSourceMessages += entries.length;

        sources.push({

          sid,

          hasProfile:
            Object.hasOwn(users, sid),

          hasChat:
            Object.hasOwn(chats, sid),

          hasNotification:
            Object.hasOwn(notifications, sid),

          messageCount: entries.length

        });

        for (const [messageId, message] of entries) {

          if (
            !message ||
            typeof message !== "object" ||
            !Number.isSafeInteger(message.time) ||
            message.time <= 0 ||
            message.time > Date.now()
          ) {

            issues.push("INVALID_MESSAGE_DATA");

            continue;

          }

          if (message.time < evidence.createdAt) {
            issues.push("CHAT_PREDATES_AUTH_ACCOUNT");
          }

          const fingerprint =
            migrationFingerprint(message);

          const existing =
            messageMap.get(messageId);

          if (existing) {

            if (
              existing.fingerprint === fingerprint
            ) {

              duplicateMessages++;

            } else {

              conflicts.push({

                messageId,

                firstSource: existing.sid,

                secondSource: sid

              });

            }

            continue;

          }

          messageMap.set(messageId, {

            sid,
            fingerprint,
            message

          });

        }

      }

      if (conflicts.length > 0) {
        issues.push("MESSAGE_ID_CONFLICT");
      }

      /* PREVIEW UNREAD COUNTERS */

      let unreadForAdmin = 0;
      let unreadForUser = 0;

      for (const item of messageMap.values()) {

        const message = item.message;

        if (
          message.from === "user" &&
          message.readByAdmin !== true
        ) {
          unreadForAdmin++;
        }

        if (
          message.from === "admin" &&
          message.readByUser !== true
        ) {
          unreadForUser++;
        }

      }

      const uniqueIssues = [...new Set(issues)];

      const previewPassed =
        uniqueIssues.length === 0;

      return res.json({

        ok: true,

        version: 1,

        mode: "EXECUTION_PREVIEW_ONLY",

        uid,

        username: evidence.username,

        targetId,

        approvalVerified,

        previewPassed,

        status: previewPassed
          ? "PREVIEW_PASSED"
          : "PREVIEW_BLOCKED",

        summary: {

          totalSources: sources.length,

          totalSourceMessages,

          uniqueMessages: messageMap.size,

          duplicateMessages,

          conflictingMessages: conflicts.length,

          unreadForAdmin,

          unreadForUser,

          issueCount: uniqueIssues.length

        },

        sources,

        conflicts,

        issues: uniqueIssues,

        databaseModified: false,

        migrationAuthorized: false,

        executionAuthorized: false,

        archiveAuthorized: false,

        deletionAuthorized: false

      });

    } catch (error) {

      console.error(
        "[LiveChat Execution Preview]",
        error.message
      );

      return fail(
        res,
        500,
        "Unable to generate execution preview"
      );

    }

  }

);

/* =====================================================
   END LIVECHAT - SAFE MIGRATION EXECUTION PREVIEW V1
   ===================================================== */

app.use((err,req,res,next)=>{console.error(err.message);return fail(res,500,'Request failed');});
app.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('5G88 backend listening'));
