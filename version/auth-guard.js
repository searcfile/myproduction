// version/auth-guard.js
// Shared authentication + authorization guard for every protected admin page.

import {
  auth,
  db,
  ref,
  get,
  onAuthStateChanged,
  signOut
} from "./firebase.js";

const LOGIN_URL = "./login.html";
const PROFILE_ROOT = "admins";
const AUTH_READY_EVENT = "admin-auth-ready";
const AUTH_FAILED_EVENT = "admin-auth-failed";

let guardPromise = null;
let cachedSession = null;

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeProfile(uid, user, raw = {}) {
  const role = clean(raw.role).toLowerCase();

  return {
    uid,
    email: clean(user?.email || raw.email),
    displayName: clean(raw.displayName || user?.displayName || user?.email || "Admin"),
    photoURL: clean(raw.photoURL || user?.photoURL),
    role,
    active: normalizeBoolean(raw.active, false),
    disabled: normalizeBoolean(raw.disabled, false),
    sites: raw.sites && typeof raw.sites === "object" ? raw.sites : {},
    permissions: raw.permissions && typeof raw.permissions === "object" ? raw.permissions : {},
    raw
  };
}

function redirectToLogin(reason = "") {
  try {
    sessionStorage.setItem("admin.auth.reason", clean(reason));
  } catch {}

  const current = window.location.pathname.split("/").pop() || "dashboard.html";
  const target = new URL(LOGIN_URL, window.location.href);

  if (current !== "login.html") {
    target.searchParams.set("next", current);
  }

  window.location.replace(target.href);
}

async function waitForFirebaseUser() {
  if (auth.currentUser) return auth.currentUser;

  return new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe();
      resolve(user || null);
    });
  });
}

async function loadAdminProfile(user) {
  if (!user?.uid) return null;

  const snapshot = await get(ref(db, `${PROFILE_ROOT}/${user.uid}`));
  if (!snapshot.exists()) return null;

  return normalizeProfile(user.uid, user, snapshot.val() || {});
}

function exposeSession(session) {
  cachedSession = session;

  window.AdminAuth = Object.freeze({
    user: session.user,
    profile: session.profile,
    uid: session.profile.uid,
    role: session.profile.role,
    isSuperAdmin: session.profile.role === "superadmin",
    getSession: () => cachedSession,
    getProfile: () => cachedSession?.profile || null,
    signOut: logoutAdmin
  });

  // Compatibility for shared new-ui.js.
  window.getCurrentAdminProfile = () => cachedSession?.profile || null;

  window.dispatchEvent(
    new CustomEvent(AUTH_READY_EVENT, {
      detail: {
        uid: session.profile.uid,
        role: session.profile.role,
        profile: session.profile
      }
    })
  );

  // Existing shared UI listens for this event.
  window.dispatchEvent(
    new CustomEvent("admin-profile-ready", {
      detail: {
        uid: session.profile.uid,
        role: session.profile.role,
        profile: session.profile
      }
    })
  );

  document.documentElement.classList.add("admin-auth-ready");
  document.documentElement.classList.remove("admin-auth-checking");
}

async function failGuard(reason, shouldSignOut = true) {
  document.documentElement.classList.remove("admin-auth-checking");

  window.dispatchEvent(
    new CustomEvent(AUTH_FAILED_EVENT, {
      detail: { reason }
    })
  );

  if (shouldSignOut) {
    try {
      await signOut(auth);
    } catch {}
  }

  redirectToLogin(reason);
  throw new Error(reason);
}

export async function requireAdmin() {
  if (cachedSession) return cachedSession;
  if (guardPromise) return guardPromise;

  document.documentElement.classList.add("admin-auth-checking");

  guardPromise = (async () => {
    const user = await waitForFirebaseUser();

    if (!user) {
      return failGuard("AUTH_REQUIRED", false);
    }

    let profile;

    try {
      profile = await loadAdminProfile(user);
    } catch (error) {
      console.error("Failed to load admin profile:", error);
      return failGuard("PROFILE_READ_FAILED", false);
    }

    if (!profile) {
      return failGuard("ADMIN_PROFILE_MISSING");
    }

    if (!profile.active || profile.disabled) {
      return failGuard("ADMIN_DISABLED");
    }

    if (!profile.role) {
      return failGuard("ADMIN_ROLE_MISSING");
    }

    const session = { user, profile };
    exposeSession(session);
    return session;
  })();

  try {
    return await guardPromise;
  } finally {
    guardPromise = null;
  }
}

export async function logoutAdmin() {
  try {
    sessionStorage.removeItem("admin.login.ready");
    localStorage.removeItem("admin.uid");
    localStorage.removeItem("admin.email");
    localStorage.removeItem("admin.displayName");
    localStorage.removeItem("admin.role");
    await signOut(auth);
  } finally {
    window.location.replace(LOGIN_URL);
  }
}

export function getAdminSession() {
  return cachedSession;
}

export function getAdminProfile() {
  return cachedSession?.profile || null;
}

export function isSuperAdmin() {
  return cachedSession?.profile?.role === "superadmin";
}

export function canAccessSite(siteId) {
  const profile = getAdminProfile();
  if (!profile) return false;
  if (profile.role === "superadmin") return true;
  return profile.sites?.[clean(siteId)] === true;
}

export function hasPermission(permission) {
  const profile = getAdminProfile();
  if (!profile) return false;
  if (profile.role === "superadmin") return true;

  const key = clean(permission);
  if (!key) return false;

  return profile.permissions?.[key] === true;
}

// Calling requireAdmin() on import protects every page that imports this file.
export const adminSession = await requireAdmin();
