'use strict';
// Run locally once with FIREBASE_SERVICE_ACCOUNT, FIREBASE_DATABASE_URL,
// PIN_PEPPER, SUPERADMIN_UID and INITIAL_PIN set as environment variables.
require('dotenv').config();
const crypto=require('node:crypto');
const {initializeApp,cert}=require('firebase-admin/app');
const {getDatabase}=require('firebase-admin/database');
const {getAuth}=require('firebase-admin/auth');
(async()=>{
 const {FIREBASE_SERVICE_ACCOUNT,FIREBASE_DATABASE_URL,PIN_PEPPER,SUPERADMIN_UID,INITIAL_PIN}=process.env;
 if(!FIREBASE_SERVICE_ACCOUNT||!FIREBASE_DATABASE_URL||!PIN_PEPPER||!SUPERADMIN_UID||!/^\d{6}$/.test(INITIAL_PIN||''))throw Error('Missing configuration or invalid 6-digit PIN');
 const sa=JSON.parse(FIREBASE_SERVICE_ACCOUNT);
 if(sa.project_id!=='myproduction-v2')throw Error('Wrong Firebase project');
 initializeApp({credential:cert(sa),databaseURL:FIREBASE_DATABASE_URL});
 const db=getDatabase();const auth=getAuth();
 const user=await auth.getUser(SUPERADMIN_UID);
 const ref=db.ref(`adminUsers/${SUPERADMIN_UID}`);
 const profile=(await ref.once('value')).val();
 if(!profile||profile.role!=='superadmin'||profile.active!==true||profile.email!==user.email||profile.username!=='admin33')throw Error('Superadmin profile mismatch; abort');
 const salt=crypto.randomBytes(16).toString('hex');
 const hash=crypto.scryptSync(`${SUPERADMIN_UID}:${INITIAL_PIN}:${PIN_PEPPER}`,Buffer.from(salt,'hex'),64).toString('hex');
 await db.ref(`privateSecondFactors/${SUPERADMIN_UID}`).set({salt,hash,updatedAt:Date.now(),failedAttempts:0,lockedUntil:0});
 await ref.update({secondPasswordEnabled:true,pinVersion:Date.now()});
 await db.ref('adminUsernameIndex/admin33').set({uid:SUPERADMIN_UID});
 console.log('Superadmin PIN initialized. Remove INITIAL_PIN from shell history/environment now.');
})().catch(e=>{console.error(e.message);process.exitCode=1});
