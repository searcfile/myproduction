// version/firebase.js
// Shared Firebase client for the 5G88 multi-site admin panel.
// Firebase Web SDK v12.2.1 (CDN ESM)

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  getDatabase,
  ref,
  get,
  set,
  update,
  remove,
  push,
  onValue,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  off,
  onDisconnect,
  serverTimestamp,
  query,
  orderByChild,
  orderByKey,
  equalTo,
  limitToFirst,
  limitToLast,
  startAt,
  endAt
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAIBLekZVkIAyOFbh3btoFNu3vKQPTgaKg",
  authDomain: "myproduction-v2.firebaseapp.com",
  databaseURL: "https://myproduction-v2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "myproduction-v2",
  storageBucket: "myproduction-v2.firebasestorage.app",
  messagingSenderId: "464224532129",
  appId: "1:464224532129:web:9f63edf8bca7cdd5f822e0"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export const ADMIN_SELECTED_SITE_KEY = "admin.selectedSite";

const clean = value => String(value ?? "").trim();

export function getSelectedSiteId() {
  if (typeof window === "undefined") return "";

  try {
    if (typeof window.getAdminActiveSite === "function") {
      const value = clean(window.getAdminActiveSite());
      if (value) return value;
    }
  } catch {}

  return (
    clean(window.AdminState?.siteId) ||
    clean(localStorage.getItem(ADMIN_SELECTED_SITE_KEY)) ||
    clean(localStorage.getItem("selectedSite"))
  );
}

export function setSelectedSiteId(siteId, { dispatch = true, persist = true } = {}) {
  if (typeof window === "undefined") return "";

  const value = clean(siteId);
  window.AdminState = window.AdminState || {};
  window.AdminState.siteId = value;

  if (persist) {
    if (value) localStorage.setItem(ADMIN_SELECTED_SITE_KEY, value);
    else localStorage.removeItem(ADMIN_SELECTED_SITE_KEY);
  }

  if (dispatch) {
    window.dispatchEvent(new CustomEvent("sitechange", {
      detail: { siteId: value, siteIds: value ? [value] : [], allSites: !value }
    }));
  }

  return value;
}

export function requireSelectedSiteId() {
  const siteId = getSelectedSiteId();
  if (!siteId) throw new Error("Please select a site from the admin header first.");
  return siteId;
}

export function sitePath(path = "", siteId = "") {
  const id = clean(siteId) || requireSelectedSiteId();
  const child = String(path || "").trim().replace(/^\/+|\/+$/g, "");
  return child ? `sites/${id}/${child}` : `sites/${id}`;
}

export function siteRef(path = "", siteId = "") {
  return ref(db, sitePath(path, siteId));
}

export function getCurrentAdminUser() {
  return auth.currentUser || null;
}

export function getCurrentAdminUid() {
  return auth.currentUser?.uid || "";
}

export function waitForAuthState() {
  return new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe();
      resolve(user || null);
    });
  });
}

// Canonical admin profile path for the new architecture.
export async function getAdminProfile(uid = "") {
  const adminUid = clean(uid || auth.currentUser?.uid);
  if (!adminUid) return null;

  const snap = await get(ref(db, `admins/${adminUid}`));
  return snap.exists() ? { uid: adminUid, ...snap.val() } : null;
}

if (typeof window !== "undefined") {
  window.AdminState = window.AdminState || {
    siteId:
      localStorage.getItem(ADMIN_SELECTED_SITE_KEY) ||
      localStorage.getItem("selectedSite") ||
      ""
  };

  window.addEventListener("admin-site-change", event => {
    const siteIds = Array.isArray(event.detail?.siteIds)
      ? event.detail.siteIds.map(clean).filter(Boolean)
      : [];
    setSelectedSiteId(siteIds[0] || "", { dispatch: false, persist: true });
  });

  window.addEventListener("storage", event => {
    if (event.key !== ADMIN_SELECTED_SITE_KEY) return;
    setSelectedSiteId(event.newValue || "", { dispatch: true, persist: false });
  });
}

export {
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  ref,
  get,
  set,
  update,
  remove,
  push,
  onValue,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  off,
  onDisconnect,
  serverTimestamp,
  query,
  orderByChild,
  orderByKey,
  equalTo,
  limitToFirst,
  limitToLast,
  startAt,
  endAt
};
