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
const origins = process.env.ALLOWED_ORIGINS.split(',').map(s=>s.trim());
app.use(cors({origin(origin,cb){ if(!origin || origins.includes(origin)) return cb(null,true); cb(new Error('Origin not allowed')); }, methods:['GET','POST','PATCH','DELETE'], allowedHeaders:['Content-Type','Authorization']}));
app.use(express.json({limit:'1mb'}));
app.use('/api',rateLimit({windowMs:60_000,limit:45,standardHeaders:'draft-8',legacyHeaders:false}));
app.get('/health',(req,res)=>res.json({ok:true,service:'5g88-admin-backend'}));
const usernameOK = s => /^[a-z0-9._-]{3,40}$/.test(s);
const pinOK = s => /^\d{6}$/.test(s);
const passwordOK = s =>
  typeof s === "string" &&
  s.length >= 6 &&
  s.length <= 128;
const now = () => Date.now();
const fail=(res,code,message)=>res.status(code).json({ok:false,message});
function pinHash(uid,pin,salt){return crypto.scryptSync(`${uid}:${pin}:${process.env.PIN_PEPPER}`,Buffer.from(salt,'hex'),64).toString('hex');}
async function setPin(uid,pin){
 const salt=crypto.randomBytes(16).toString('hex');
 await db.ref(`privateSecondFactors/${uid}`).set({salt,hash:pinHash(uid,pin,salt),updatedAt:now(),failedAttempts:0,lockedUntil:0});
 await db.ref(`adminUsers/${uid}`).update({secondPasswordEnabled:true,pinVersion:now()});
}
async function adminProfile(uid){const s=await db.ref(`adminUsers/${uid}`).once('value');return s.val();}
async function requireAdmin(req,res,next){
 try{
  const m=/^Bearer (\S+)$/.exec(req.headers.authorization||''); if(!m) return fail(res,401,'Authentication required');
  const token=await auth.verifyIdToken(m[1],true);
  if(token.firebase?.sign_in_provider==='anonymous' || token.secondVerified!==true) return fail(res,403,'Second password verification required');
  const p=await adminProfile(token.uid);
  if(!p || p.active!==true || !['superadmin','siteadmin'].includes(p.role) || p.secondPasswordEnabled!==true || token.pinVersion!==p.pinVersion) return fail(res,403,'Admin access denied');
  req.admin={uid:token.uid,profile:p};next();
 }catch(e){return fail(res,401,'Invalid or expired session');}
}
function superOnly(req,res,next){if(req.admin.profile.role!=='superadmin')return fail(res,403,'Superadmin only');next();}

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
    createdAt: p.createdAt || null,
    updatedAt: p.updatedAt || null
  };
}

// Login: username+password checked server-side with Firebase Identity Toolkit.
// Browser receives only a short-lived opaque challenge, never the Firebase first-factor token.
app.post('/api/login/start',rateLimit({windowMs:15*60_000,limit:12}),async(req,res)=>{
 const username=String(req.body?.username||'').trim().toLowerCase(), password=req.body?.password;
 if(!usernameOK(username)||typeof password!=='string')return fail(res,401,'Invalid credentials');
 try{
  const idx=(await db.ref(`adminUsernameIndex/${username}`).once('value')).val();
  if(!idx?.uid) return fail(res,401,'Invalid credentials');
  const profile=await adminProfile(idx.uid);
  if(!profile||profile.active!==true||profile.secondPasswordEnabled!==true||!['superadmin','siteadmin'].includes(profile.role))return fail(res,401,'Invalid credentials');
  const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(process.env.FIREBASE_WEB_API_KEY)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:profile.email,password,returnSecureToken:true})});
  const data=await r.json();
  if(!r.ok||data.localId!==idx.uid)return fail(res,401,'Invalid credentials');
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
   if(!countResult.committed)return fail(res,429,'PIN changed or temporarily locked');
   if(!correct)return fail(res,401,'Invalid verification');
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
   const customToken=await auth.createCustomToken(uid,{secondVerified:true,pinVersion:current.pinVersion});
  return res.json({ok:true,customToken});
 }catch(e){console.error('Login finish error',e.message);return fail(res,503,'Verification unavailable');}
});

app.get('/api/admin-users',requireAdmin,superOnly,async(req,res)=>{
 try{
  const profiles=(await db.ref('adminUsers').once('value')).val()||{};
  const users=[];let pageToken;
  do{const page=await auth.listUsers(1000,pageToken);for(const u of page.users){if(profiles[u.uid])users.push(publicUser(u,profiles[u.uid]));}pageToken=page.pageToken;}while(pageToken);
  return res.json({ok:true,users});
 }catch(e){console.error(e.message);return fail(res,500,'Cannot list users');}
});
app.post('/api/admin-users',requireAdmin,superOnly,async(req,res)=>{
 const username=String(req.body?.username||'').trim().toLowerCase(),password=req.body?.password,pin=String(req.body?.secondPassword||''),enabled=req.body?.enabled!==false;
 const email=`${username}@accounts.myproduction-v2.example`;
const siteIds = req.body?.siteIds;

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
 await db.ref(`adminUsers/${created.uid}`).set({
  username,
  email,
  displayName: username,
  role: "siteadmin",
  siteIds,
  active: enabled,
  secondPasswordEnabled: false,
  createdAt: t,
  updatedAt: t,
  createdBy: req.admin.uid
});
   await setPin(created.uid,pin);
   await indexRef.set({uid:created.uid});
   return res.status(201).json({ok:true,user:{uid:created.uid,username,email,enabled}});
  }catch(e){if(created){await auth.deleteUser(created.uid).catch(()=>{});await db.ref(`adminUsers/${created.uid}`).remove().catch(()=>{});await db.ref(`privateSecondFactors/${created.uid}`).remove().catch(()=>{});}await indexRef.remove().catch(()=>{});throw e;}
 }catch(e){console.error('Create user',e.message);return fail(res,500,'Cannot create user; check email uniqueness and backend logs');}
});
app.patch('/api/admin-users/:uid',requireAdmin,superOnly,async(req,res)=>{
 const uid=req.params.uid;
 try{
  const p=await adminProfile(uid);
  if(!p||p.role!=='siteadmin')return fail(res,403,'Only Site Admin accounts may be modified here');
  const updates={updatedAt:now()},authUpdates={};
  if(Object.hasOwn(req.body,'enabled')){
   if(typeof req.body.enabled!=='boolean')return fail(res,400,'enabled must be boolean');
   updates.active=req.body.enabled;authUpdates.disabled=!req.body.enabled;
  }
  if(Object.hasOwn(req.body,'password')){
if (!passwordOK(req.body.password)) {
  return fail(res, 400, "Password must have at least 6 characters");
}
   authUpdates.password=req.body.password;
  }
  if(Object.hasOwn(req.body,'secondPassword')){
   if(!pinOK(String(req.body.secondPassword)))return fail(res,400,'PIN must be exactly 6 digits');
  }
  if(Object.keys(authUpdates).length)await auth.updateUser(uid,authUpdates);
  await db.ref(`adminUsers/${uid}`).update(updates);
  if(Object.hasOwn(req.body,'secondPassword'))await setPin(uid,String(req.body.secondPassword));
  return res.json({ok:true,message:'Site Admin updated'});
 }catch(e){console.error('Update user',e.message);return fail(res,500,'Cannot update user');}
});
app.delete('/api/admin-users/:uid',requireAdmin,superOnly,async(req,res)=>{
 const uid=req.params.uid;
 try{
  const p=await adminProfile(uid);
  if(!p||p.role!=='siteadmin')return fail(res,403,'Only Site Admin accounts may be deleted');
  await auth.deleteUser(uid);
  await db.ref(`adminUsers/${uid}`).remove();
  await db.ref(`privateSecondFactors/${uid}`).remove();
  await db.ref(`adminUsernameIndex/${p.username}`).remove();
  return res.json({ok:true});
 }catch(e){console.error('Delete user',e.message);return fail(res,500,'Cannot delete user');}
});
/* =====================================================
   ADMIN PROFILE PERMISSIONS — SUPERADMIN ONLY
   ===================================================== */

/* =====================================================
   ADMIN MODULE VALIDATION
   ===================================================== */

const SUPERADMIN_ONLY_PAGES = new Set([
  "users.html",
  "site-management.html",
  "admin-users.html"
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
          !actions.every(action => ALLOWED_ACTIONS.has(action))
        ) {
          return fail(res, 400, "Invalid module permissions");
        }

        const uniqueActions = [...new Set(actions)];

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
    siteVisibility
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

      await ref.update({
        ...data,
        updatedAt: now(),
        updatedBy: req.admin.uid
      });

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
      payline < 1 || payline > 1000) {
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
        const values = pecahan[String(bet)];
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
        const values = pecahan[String(bet)];
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

// GET — List all sites
app.get("/api/sites", requireAdmin, superOnly, async (req, res) => {
  try {
    const snap = await db.ref("sites").once("value");
    const data = snap.val() || {};

    const sites = Object.entries(data).map(([id, site]) => ({
      id,
      ...site
    }));

    return res.json({ ok: true, sites });
  } catch (error) {
    console.error("List sites:", error.message);
    return fail(res, 500, "Cannot load sites");
  }
});

// POST — Create site
app.post("/api/sites", requireAdmin, superOnly, async (req, res) => {
  try {
    const id = String(req.body?.id || "").trim().toLowerCase();

    if (!siteIdOK(id)) {
      return fail(res, 400, "Invalid Site ID");
    }

    const data = validateSite(req.body);
    const siteRef = db.ref(`sites/${id}`);

    const result = await siteRef.transaction(
      current => current === null
        ? {
            ...data,
            createdAt: now(),
            createdBy: req.admin.uid,
            updatedAt: now()
          }
        : undefined,
      undefined,
      false
    );

    if (!result.committed) {
      return fail(res, 409, "Site ID already exists");
    }

    return res.status(201).json({
      ok: true,
      id,
      message: "Site created"
    });
  } catch (error) {
    if (
      error.message.startsWith("Site name") ||
      error.message.startsWith("Invalid wallet") ||
      error.message.startsWith("Site status")
    ) {
      return fail(res, 400, error.message);
    }

    console.error("Create site:", error.message);
    return fail(res, 500, "Cannot create site");
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


app.use((err,req,res,next)=>{console.error(err.message);return fail(res,500,'Request failed');});
app.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('5G88 backend listening'));
