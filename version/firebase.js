// version/firebase.js
// Shared Firebase client for the 5G88 multi-site admin panel.
// Firebase Web SDK v12.2.1 (CDN ESM)

import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserSessionPersistence,
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

export const app =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);

/* =========================================================
   ADMIN / SITE SHARED STATE
========================================================= */

export const ADMIN_SELECTED_SITE_KEY = "admin.selectedSite";

function cleanSiteId(value) {
  return String(value ?? "").trim();
}

function readSelectedSitesFromNewUi() {
  try {
    if (typeof window === "undefined") return [];

    if (typeof window.getAdminSelectedSites === "function") {
      const values = window.getAdminSelectedSites();

      if (Array.isArray(values)) {
        return values
          .map(cleanSiteId)
          .filter(Boolean);
      }
    }

    if (typeof window.getAdminActiveSite === "function") {
      const siteId = cleanSiteId(window.getAdminActiveSite());
      return siteId ? [siteId] : [];
    }
  } catch (error) {
    console.warn("Unable to read site from new-ui.js:", error);
  }

  return [];
}

export function getSelectedSiteId() {
  if (typeof window === "undefined") {
    return "";
  }

  const sharedUiSites = readSelectedSitesFromNewUi();

  if (sharedUiSites.length > 0) {
    return sharedUiSites[0];
  }

  const stateSiteId = cleanSiteId(
    window.AdminState?.siteId
  );

  if (stateSiteId) {
    return stateSiteId;
  }

  return cleanSiteId(
    localStorage.getItem(ADMIN_SELECTED_SITE_KEY) ||
    localStorage.getItem("selectedSite")
  );
}

export function setSelectedSiteId(siteId, options = {}) {
  if (typeof window === "undefined") {
    return "";
  }

  const value = cleanSiteId(siteId);
  const {
    dispatch = true,
    persist = true
  } = options;

  window.AdminState =
    window.AdminState || {};

  window.AdminState.siteId = value;

  if (persist) {
    if (value) {
      localStorage.setItem(
        ADMIN_SELECTED_SITE_KEY,
        value
      );
    } else {
      localStorage.removeItem(
        ADMIN_SELECTED_SITE_KEY
      );
    }
  }

  if (dispatch) {
    window.dispatchEvent(
      new CustomEvent("sitechange", {
        detail: {
          siteId: value,
          siteIds: value ? [value] : [],
          allSites: !value
        }
      })
    );
  }

  return value;
}

export function requireSelectedSiteId() {
  const siteId = getSelectedSiteId();

  if (!siteId) {
    throw new Error(
      "Please select a site from the admin header first."
    );
  }

  return siteId;
}

export function sitePath(path = "", siteId = "") {
  const activeSiteId =
    cleanSiteId(siteId) ||
    requireSelectedSiteId();

  const childPath =
    String(path || "")
      .trim()
      .replace(/^\/+|\/+$/g, "");

  return childPath
    ? `sites/${activeSiteId}/${childPath}`
    : `sites/${activeSiteId}`;
}

export function siteRef(path = "", siteId = "") {
  return ref(
    db,
    sitePath(path, siteId)
  );
}

/* =========================================================
   CURRENT ADMIN HELPERS
========================================================= */

export function getCurrentAdminUser() {
  return auth.currentUser || null;
}

export function getCurrentAdminUid() {
  return auth.currentUser?.uid || "";
}

export function waitForAuthState() {
  return new Promise(resolve => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        user => {
          unsubscribe();
          resolve(user || null);
        }
      );
  });
}

/*
  Profile path convention:
  admins/{uid}

  This helper only reads the profile.
  Authorization must still be enforced by Firebase RTDB Rules.
*/
export async function getAdminProfile(uid = "") {
  const adminUid =
    String(
      uid ||
      auth.currentUser?.uid ||
      ""
    ).trim();

  if (!adminUid) {
    return null;
  }

  const snapshot =
    await get(
      ref(
        db,
        `admins/${adminUid}`
      )
    );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    uid: adminUid,
    ...snapshot.val()
  };
}

/* =========================================================
   SHARED SITE EVENTS
========================================================= */

if (typeof window !== "undefined") {
  window.AdminState =
    window.AdminState || {
      siteId:
        localStorage.getItem(
          ADMIN_SELECTED_SITE_KEY
        ) ||
        localStorage.getItem(
          "selectedSite"
        ) ||
        ""
    };

  /*
    new-ui.js uses "admin-site-change".
    Migrated pages may use "sitechange".
    Keep both compatible without creating an event loop.
  */
  window.addEventListener(
    "admin-site-change",
    event => {
      const siteIds =
        Array.isArray(
          event.detail?.siteIds
        )
          ? event.detail.siteIds
              .map(cleanSiteId)
              .filter(Boolean)
          : [];

      const siteId =
        siteIds[0] || "";

      window.AdminState.siteId =
        siteId;

      if (siteId) {
        localStorage.setItem(
          ADMIN_SELECTED_SITE_KEY,
          siteId
        );
      } else {
        localStorage.removeItem(
          ADMIN_SELECTED_SITE_KEY
        );
      }
    }
  );

  window.addEventListener(
    "storage",
    event => {
      if (
        event.key !==
        ADMIN_SELECTED_SITE_KEY
      ) {
        return;
      }

      const siteId =
        cleanSiteId(
          event.newValue
        );

      window.AdminState.siteId =
        siteId;

      window.dispatchEvent(
        new CustomEvent(
          "sitechange",
          {
            detail: {
              siteId,
              siteIds:
                siteId
                  ? [siteId]
                  : [],
              allSites:
                !siteId
            }
          }
        )
      );
    }
  );
}

/* =========================================================
   FIREBASE EXPORTS
========================================================= */

export {
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserSessionPersistence,
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
