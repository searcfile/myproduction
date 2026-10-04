// contact-center/admin.js
// Clean admin shell: one Firebase project, no iframe, no old external domains.

import {
  auth,
  db,
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
  onValue,
  onDisconnect,
  serverTimestamp
} from "./firebase.js";

/* =========================================================
   CONFIG
========================================================= */
const LOGIN_URL = "./login.html";
const THEME_KEY = "adminGlobalTheme";
const SITE_KEY = "admin.selectedSite";
const TAB_KEY_PREFIX = "admin.tabs";
const ACTIVE_TAB_PREFIX = "admin.activeTab";
const AUTO_LOGOUT_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TITLE = "Back Office";

// Add/remove pages here. No iframe and no external domain URLs.
const PAGE_REGISTRY = {
  dashboard: { title: "Dashboard", page: "./dashboard.html" },
  "918kiss": { title: "918Kiss", page: "./918kiss.html" },
  mega888: { title: "Mega888", page: "./mega888.html" },
  pussy888: { title: "Pussy888", page: "./pussy888.html" },
  livechat: { title: "LiveChat", page: "./livechat.html" },
  notice: { title: "Notice", page: "./notice.html" },

  // Old main-control pages are now local files in this same folder.
  // They are prepared here so Super Admin permissions can be applied later.
  "detail-login": { title: "Detail Login", page: "./detail-login.html", superAdminFuture: true },
  "tab-settings": { title: "Tab Settings", page: "./tab-settings.html", superAdminFuture: true },
  "user-history": { title: "User History", page: "./user-history.html", superAdminFuture: true }
};

const state = {
  user: null,
  profile: null,
  siteId: localStorage.getItem(SITE_KEY) || "",
  sites: [],
  tabs: [],
  activeTabId: "",
  pageLoadToken: 0,
  unsubscribers: []
};

/* =========================================================
   SMALL HELPERS
========================================================= */
const $ = (id) => document.getElementById(id);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function safeKey(value = "") {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
}

function userStorageSuffix() {
  return state.user?.uid || "guest";
}

function tabsStorageKey() {
  return `${TAB_KEY_PREFIX}.${userStorageSuffix()}`;
}

function activeTabStorageKey() {
  return `${ACTIVE_TAB_PREFIX}.${userStorageSuffix()}`;
}

function setLoading(show, text = "Loading...") {
  const el = $("adminPageLoading");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("hidden", !show);
}

function showEmpty(show) {
  $("adminEmptyState")?.classList.toggle("hidden", !show);
}

function dispatch(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function formatName(user, profile) {
  return profile?.name || profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "Admin";
}

/* =========================================================
   THEME
========================================================= */
function getTheme() {
  return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
}

function applyTheme(theme) {
  const next = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  document.documentElement.setAttribute("data-admin-theme", next);
  document.body?.classList.toggle("dark-theme", next === "dark");
  document.body?.classList.toggle("light-theme", next === "light");
  localStorage.setItem(THEME_KEY, next);

  const btn = $("themeToggleBtn");
  if (btn) btn.textContent = next === "dark" ? "Light Mode" : "Dark Mode";
  dispatch("themechange", { theme: next });
}

function toggleTheme() {
  applyTheme(getTheme() === "dark" ? "light" : "dark");
}

/* =========================================================
   CLOCK
========================================================= */
let clockTimer = null;
function startClock() {
  const render = () => {
    const el = $("adminDateTime");
    if (!el) return;
    const now = new Date();
    el.textContent = new Intl.DateTimeFormat("en-MY", {
      timeZone: "Asia/Kuala_Lumpur",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(now);
  };
  render();
  clearInterval(clockTimer);
  clockTimer = setInterval(render, 1000);
}

/* =========================================================
   SIDEBAR / USER MENU
========================================================= */
function openSidebar() {
  $("adminSidebar")?.classList.add("active");
  $("sidebarOverlay")?.classList.add("active");
  $("adminMenuBtn")?.setAttribute("aria-expanded", "true");
}

function closeSidebar() {
  $("adminSidebar")?.classList.remove("active");
  $("sidebarOverlay")?.classList.remove("active");
  $("adminMenuBtn")?.setAttribute("aria-expanded", "false");
}

function toggleSidebar() {
  $("adminSidebar")?.classList.contains("active") ? closeSidebar() : openSidebar();
}

function closeUserMenu() {
  $("adminUserMenu")?.classList.remove("open");
  $("adminUserBtn")?.setAttribute("aria-expanded", "false");
}

function toggleUserMenu() {
  const menu = $("adminUserMenu");
  if (!menu) return;
  const open = !menu.classList.contains("open");
  menu.classList.toggle("open", open);
  $("adminUserBtn")?.setAttribute("aria-expanded", String(open));
}

function initSidebarSearch() {
  $("sidebarSearchInput")?.addEventListener("input", (event) => {
    const q = event.target.value.trim().toLowerCase();
    $$(".admin-sidebar-link").forEach((el) => {
      el.hidden = q && !el.textContent.toLowerCase().includes(q);
    });
  });
}

/* =========================================================
   SITE SELECTOR
   Reads /sites and filters by /admins/{uid}/sites when present.
========================================================= */
async function loadSites() {
  if (!state.user) return;

  let allSites = [];
  try {
    const snap = await get(ref(db, "sites"));
    const raw = snap.val() || {};
    allSites = Object.entries(raw)
      .map(([id, value]) => ({ id, ...(value || {}) }))
      .filter((site) => site.active !== false);
  } catch (err) {
    console.warn("[sites] Cannot read /sites:", err);
  }

  const allowed = state.profile?.sites;
  if (allowed && typeof allowed === "object") {
    allSites = allSites.filter((site) => allowed[site.id] === true);
  }

  state.sites = allSites;

  if (state.siteId && !allSites.some((s) => s.id === state.siteId)) {
    state.siteId = "";
    localStorage.removeItem(SITE_KEY);
  }

  if (!state.siteId && allSites.length === 1) {
    selectSite(allSites[0].id, false);
  }

  renderSiteSelector();
}

function renderSiteSelector() {
  const wrap = $("siteSelectorDropdown");
  const text = $("selectedSiteText");
  if (!wrap || !text) return;

  const current = state.sites.find((s) => s.id === state.siteId);
  text.textContent = current?.name || current?.label || current?.id || "Select Site";
  wrap.innerHTML = "";

  if (!state.sites.length) {
    const empty = document.createElement("div");
    empty.className = "admin-site-selector-empty";
    empty.textContent = "No site available";
    wrap.appendChild(empty);
    return;
  }

  state.sites.forEach((site) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "admin-site-selector-option";
    btn.dataset.siteId = site.id;
    btn.textContent = site.name || site.label || site.id;
    btn.classList.toggle("active", site.id === state.siteId);
    btn.addEventListener("click", () => selectSite(site.id));
    wrap.appendChild(btn);
  });
}

function toggleSiteSelector() {
  const dd = $("siteSelectorDropdown");
  const btn = $("siteSelectorBtn");
  if (!dd || !btn) return;
  const open = !dd.classList.contains("open");
  dd.classList.toggle("open", open);
  btn.setAttribute("aria-expanded", String(open));
}

function closeSiteSelector() {
  $("siteSelectorDropdown")?.classList.remove("open");
  $("siteSelectorBtn")?.setAttribute("aria-expanded", "false");
}

function selectSite(siteId, reloadCurrent = true) {
  state.siteId = String(siteId || "");
  if (state.siteId) localStorage.setItem(SITE_KEY, state.siteId);
  else localStorage.removeItem(SITE_KEY);
  renderSiteSelector();
  closeSiteSelector();
  dispatch("sitechange", { siteId: state.siteId });
  if (reloadCurrent && state.activeTabId) loadTabContent(state.activeTabId, { force: true });
}

/* =========================================================
   TAB PERMISSIONS
   Optional profile shape:
   /admins/{uid}/tabs/{tabId}: true
   If tabs node does not exist, registry tabs remain visible for now.
========================================================= */
function isTabAllowed(tabId) {
  const permissions = state.profile?.tabs;
  if (!permissions || typeof permissions !== "object") return true;
  return permissions[tabId] === true;
}

function applyNavigationPermissions() {
  $$('[data-tab]').forEach((el) => {
    const tabId = el.dataset.tab;
    el.hidden = !PAGE_REGISTRY[tabId] || !isTabAllowed(tabId);
  });

  state.tabs = state.tabs.filter((tab) => isTabAllowed(tab.id));
  saveTabs();
  renderTabs();
}

/* =========================================================
   TAB STORAGE / TAB BAR
========================================================= */
function restoreTabs() {
  try {
    const raw = JSON.parse(localStorage.getItem(tabsStorageKey()) || "[]");
    state.tabs = Array.isArray(raw)
      ? raw.filter((tab) => PAGE_REGISTRY[tab.id] && isTabAllowed(tab.id))
      : [];
  } catch {
    state.tabs = [];
  }

  state.activeTabId = localStorage.getItem(activeTabStorageKey()) || "";
  if (!state.tabs.some((tab) => tab.id === state.activeTabId)) {
    state.activeTabId = state.tabs.at(-1)?.id || "";
  }
}

function saveTabs() {
  localStorage.setItem(tabsStorageKey(), JSON.stringify(state.tabs));
  if (state.activeTabId) localStorage.setItem(activeTabStorageKey(), state.activeTabId);
  else localStorage.removeItem(activeTabStorageKey());
}

function openTab(tabId, options = {}) {
  const def = PAGE_REGISTRY[tabId];
  if (!def || !isTabAllowed(tabId)) return;

  if (!state.tabs.some((tab) => tab.id === tabId)) {
    state.tabs.push({ id: tabId, title: def.title, page: def.page });
  }

  state.activeTabId = tabId;
  saveTabs();
  renderTabs();
  loadTabContent(tabId, options);
  closeSidebar();
}

function activateTab(tabId) {
  if (!state.tabs.some((tab) => tab.id === tabId)) return;
  state.activeTabId = tabId;
  saveTabs();
  renderTabs();
  loadTabContent(tabId);
}

function closeTab(tabId) {
  const index = state.tabs.findIndex((tab) => tab.id === tabId);
  if (index < 0) return;

  const wasActive = state.activeTabId === tabId;
  state.tabs.splice(index, 1);

  if (wasActive) {
    state.activeTabId = state.tabs[index - 1]?.id || state.tabs[index]?.id || "";
  }

  saveTabs();
  renderTabs();

  if (state.activeTabId) loadTabContent(state.activeTabId);
  else clearContent();
}

function renderTabs() {
  const list = $("adminTabList");
  if (!list) return;
  list.innerHTML = "";

  state.tabs.forEach((tab) => {
    const item = document.createElement("div");
    item.className = "admin-tab";
    item.classList.toggle("active", tab.id === state.activeTabId);
    item.dataset.tab = tab.id;

    const title = document.createElement("button");
    title.type = "button";
    title.className = "admin-tab-title";
    title.textContent = tab.title;
    title.addEventListener("click", () => activateTab(tab.id));

    const close = document.createElement("button");
    close.type = "button";
    close.className = "admin-tab-close";
    close.setAttribute("aria-label", `Close ${tab.title}`);
    close.textContent = "×";
    close.addEventListener("click", (event) => {
      event.stopPropagation();
      closeTab(tab.id);
    });

    item.append(title, close);
    list.appendChild(item);
  });

  showEmpty(state.tabs.length === 0);
  syncNavActiveState();
}

function syncNavActiveState() {
  $$('[data-tab]').forEach((el) => {
    el.classList.toggle("active", el.dataset.tab === state.activeTabId);
  });
}

/* =========================================================
   NO-IFRAME PAGE LOADER
   Supports HTML fragments and simple full HTML files.
   Existing feature pages should gradually be converted to fragments/modules.
========================================================= */
async function loadTabContent(tabId, { force = false } = {}) {
  const def = PAGE_REGISTRY[tabId];
  const host = $("adminTabContent");
  if (!def || !host) return;

  const token = ++state.pageLoadToken;
  setLoading(true, `Loading ${def.title}...`);
  showEmpty(false);

  try {
    const url = new URL(def.page, location.href);
    if (state.siteId) url.searchParams.set("siteId", state.siteId);
    if (force) url.searchParams.set("_", String(Date.now()));

    const response = await fetch(url, { cache: force ? "no-store" : "default" });
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    const html = await response.text();
    if (token !== state.pageLoadToken) return;

    await mountHtmlPage(host, html, url);
    document.title = `${def.title} • ${DEFAULT_TITLE}`;
    dispatch("adminpagechange", { tabId, siteId: state.siteId, page: def.page });
  } catch (err) {
    console.error(`[admin] Failed to load ${def.page}:`, err);
    host.innerHTML = `
      <div class="admin-load-error">
        <h3>Page cannot be loaded</h3>
        <p>${escapeHtml(def.title)}: ${escapeHtml(err.message || String(err))}</p>
      </div>`;
  } finally {
    if (token === state.pageLoadToken) setLoading(false);
  }
}

async function mountHtmlPage(host, html, pageUrl) {
  // Cleanup hook for previous feature module.
  try { await window.AdminCurrentPage?.destroy?.(); } catch (err) { console.warn(err); }
  window.AdminCurrentPage = null;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const sourceRoot = doc.body?.children.length ? doc.body : doc;

  host.replaceChildren(...Array.from(sourceRoot.childNodes).map((node) => document.importNode(node, true)));

  // Styles from a full HTML page are copied into the host area with absolute hrefs.
  $$("style[data-admin-page-style], link[data-admin-page-style]").forEach((el) => el.remove());
  $$('link[rel="stylesheet"]', doc).forEach((oldLink) => {
    const href = oldLink.getAttribute("href");
    if (!href) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = new URL(href, pageUrl).href;
    link.dataset.adminPageStyle = "1";
    document.head.appendChild(link);
  });
  $$("style", doc).forEach((oldStyle) => {
    const style = document.createElement("style");
    style.dataset.adminPageStyle = "1";
    style.textContent = oldStyle.textContent;
    document.head.appendChild(style);
  });

  // Recreate scripts because scripts inserted through innerHTML/importNode do not execute.
  const scripts = $$("script", host);
  for (const oldScript of scripts) {
    const script = document.createElement("script");
    for (const attr of oldScript.attributes) script.setAttribute(attr.name, attr.value);
    if (oldScript.src) script.src = new URL(oldScript.getAttribute("src"), pageUrl).href;
    else script.textContent = oldScript.textContent;
    oldScript.replaceWith(script);
  }
}

function clearContent() {
  state.pageLoadToken++;
  const host = $("adminTabContent");
  if (host) host.innerHTML = "";
  $$("style[data-admin-page-style], link[data-admin-page-style]").forEach((el) => el.remove());
  document.title = DEFAULT_TITLE;
  showEmpty(true);
  setLoading(false);
}

function refreshCurrentPage() {
  const btn = $("adminRefreshBtn");
  btn?.classList.remove("spin");
  void btn?.offsetWidth;
  btn?.classList.add("spin");
  if (state.activeTabId) loadTabContent(state.activeTabId, { force: true });
}

/* =========================================================
   AUTH / PROFILE / ONLINE STATUS
========================================================= */
async function loadAdminProfile(uid) {
  try {
    const snap = await get(ref(db, `admins/${uid}`));
    return snap.exists() ? snap.val() : null;
  } catch (err) {
    console.warn("[admin] Cannot read profile:", err);
    return null;
  }
}

function renderUser() {
  if (!state.user) return;
  const name = formatName(state.user, state.profile);
  if ($("adminUsername")) $("adminUsername").textContent = name;
  if ($("adminEmail")) $("adminEmail").textContent = state.user.email || "";
}

function startOnlinePresence() {
  if (!state.user) return;
  const uid = state.user.uid;
  const connectedRef = ref(db, ".info/connected");
  const onlineRef = ref(db, `presence/${uid}`);

  const unsubscribe = onValue(connectedRef, async (snap) => {
    if (snap.val() !== true) return;
    try {
      await onDisconnect(onlineRef).set({ online: false, lastSeen: serverTimestamp() });
      await set(onlineRef, {
        online: true,
        email: state.user.email || "",
        lastSeen: serverTimestamp()
      });
    } catch (err) {
      console.warn("[presence]", err);
    }
  });
  state.unsubscribers.push(unsubscribe);
}

async function logout() {
  try {
    if (state.user) {
      await set(ref(db, `presence/${state.user.uid}`), {
        online: false,
        email: state.user.email || "",
        lastSeen: serverTimestamp()
      });
    }
  } catch (_) {}

  try { await signOut(auth); } catch (err) { console.warn(err); }
  location.replace(LOGIN_URL);
}

/* =========================================================
   24 HOUR SESSION TIMER
========================================================= */
let logoutTimer = null;
function startAutoLogout() {
  const key = `admin.loginExpire.${userStorageSuffix()}`;
  let expireAt = Number(sessionStorage.getItem(key) || 0);
  if (!expireAt || expireAt <= Date.now()) {
    expireAt = Date.now() + AUTO_LOGOUT_MS;
    sessionStorage.setItem(key, String(expireAt));
  }

  clearInterval(logoutTimer);
  logoutTimer = setInterval(() => {
    if (Date.now() >= expireAt) logout();
  }, 30_000);
}

/* =========================================================
   CHANGE PASSWORD
========================================================= */
function openPasswordModal() {
  $("changePasswordModal")?.classList.remove("hidden");
}
function closePasswordModal() {
  $("changePasswordModal")?.classList.add("hidden");
  ["currentPassword", "newPassword", "confirmPassword"].forEach((id) => {
    if ($(id)) $(id).value = "";
  });
}

async function savePassword() {
  if (!state.user?.email) return;
  const current = $("currentPassword")?.value || "";
  const next = $("newPassword")?.value || "";
  const confirm = $("confirmPassword")?.value || "";

  if (!current || !next || !confirm) return alert("Please complete all password fields.");
  if (next.length < 6) return alert("New password must be at least 6 characters.");
  if (next !== confirm) return alert("New password confirmation does not match.");

  const btn = $("changePasswordSaveBtn");
  if (btn) btn.disabled = true;
  try {
    const credential = EmailAuthProvider.credential(state.user.email, current);
    await reauthenticateWithCredential(state.user, credential);
    await updatePassword(state.user, next);
    closePasswordModal();
    alert("Password updated.");
  } catch (err) {
    console.error(err);
    alert(err?.message || "Failed to update password.");
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* =========================================================
   DOM EVENTS
========================================================= */
function bindShellEvents() {
  $("adminMenuBtn")?.addEventListener("click", (e) => { e.stopPropagation(); toggleSidebar(); });
  $("sidebarOverlay")?.addEventListener("click", closeSidebar);
  $("adminRefreshBtn")?.addEventListener("click", refreshCurrentPage);

  $("adminUserBtn")?.addEventListener("click", (e) => { e.stopPropagation(); toggleUserMenu(); });
  $("logoutBtn")?.addEventListener("click", logout);
  $("themeToggleBtn")?.addEventListener("click", toggleTheme);

  $("siteSelectorBtn")?.addEventListener("click", (e) => { e.stopPropagation(); toggleSiteSelector(); });

  $("changePasswordBtn")?.addEventListener("click", () => { closeUserMenu(); openPasswordModal(); });
  $("changePasswordCloseBtn")?.addEventListener("click", closePasswordModal);
  $("changePasswordCancelBtn")?.addEventListener("click", closePasswordModal);
  $("changePasswordSaveBtn")?.addEventListener("click", savePassword);
  $("changePasswordModal")?.addEventListener("click", (e) => {
    if (e.target === $("changePasswordModal")) closePasswordModal();
  });

  $$('[data-tab]').forEach((el) => {
    el.addEventListener("click", () => openTab(el.dataset.tab));
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".admin-user-dropdown")) closeUserMenu();
    if (!e.target.closest(".admin-site-selector")) closeSiteSelector();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeSidebar();
      closeUserMenu();
      closeSiteSelector();
      closePasswordModal();
    }
  });

  initSidebarSearch();
}

/* =========================================================
   START
========================================================= */
async function boot() {
  applyTheme(getTheme());
  startClock();
  bindShellEvents();

  try { await setPersistence(auth, browserSessionPersistence); } catch (err) { console.warn(err); }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      location.replace(LOGIN_URL);
      return;
    }

    state.user = user;
    state.profile = await loadAdminProfile(user.uid);

    // If an admin profile exists and is explicitly disabled, deny access.
    if (state.profile?.active === false) {
      await signOut(auth);
      location.replace(`${LOGIN_URL}?blocked=1`);
      return;
    }

    renderUser();
    await loadSites();
    restoreTabs();
    applyNavigationPermissions();
    startOnlinePresence();
    startAutoLogout();

    if (state.activeTabId) {
      renderTabs();
      loadTabContent(state.activeTabId);
    } else if (isTabAllowed("dashboard")) {
      openTab("dashboard");
    } else {
      renderTabs();
      clearContent();
    }

    dispatch("adminready", {
      uid: user.uid,
      email: user.email || "",
      siteId: state.siteId
    });
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Small public API for feature modules / console debugging.
window.AdminShell = {
  openTab,
  closeTab,
  activateTab,
  refreshCurrentPage,
  selectSite,
  getSiteId: () => state.siteId,
  getUser: () => state.user,
  getProfile: () => state.profile,
  getTabs: () => [...state.tabs]
};

boot();