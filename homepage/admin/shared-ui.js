/* ==========================================================
   HOMEPAGE ADMIN - SHARED UI
   File: homepage/admin/shared-ui.js

   Shared:
   - Header
   - Sidebar
   - Navigation
   - Workspace Tabs
   - Theme
   - Search
   - Responsive shell

   Firebase:
   - Uses global `db` from ../firebase.js when available
   - Still renders the shell if Firebase is unavailable
   ========================================================== */

(() => {
  "use strict";

  if (window.__HOMEPAGE_SHARED_UI__) return;
  window.__HOMEPAGE_SHARED_UI__ = true;


  /* ==========================================================
     PAGE DEFINITIONS
     ========================================================== */

  const ADMIN_PAGES = [
     {
  file: "users.html",
  name: "Auth Users",
  group: "main"
},

    {
      file: "livechat.html",
      name: "Live Chat",
      group: "main"
    },
    {
      file: "livechat-support.html",
      name: "Agent Support",
      group: "main"
    },
    {
      file: "notice.html",
      name: "Notice Blasting",
      group: "main"
    },
    {
      file: "users-history.html",
      name: "Users-History",
      group: "main"
    },
    {
      file: "linkdownload.html",
      name: "Link Download",
      group: "main"
    },
    {
      file: "item.html",
      name: "Item",
      group: "main"
    },

    {
      file: "mega888.html",
      name: "Mega888",
      group: "gamelog"
    },
    {
      file: "pussy888.html",
      name: "Pussy888",
      group: "gamelog"
    },
    {
      file: "918kiss.html",
      name: "918kiss",
      group: "gamelog"
    },
    {
      file: "scr888h5.html",
      name: "Scr888h5",
      group: "gamelog"
    },
    {
      file: "evo888.html",
      name: "Evo888",
      group: "gamelog"
    },
    {
      file: "jilislot.html",
      name: "Jilislot",
      group: "gamelog"
    },

    {
      file: "maybank.html",
      name: "Maybank",
      group: "bank"
    },
    {
      file: "cimbclick.html",
      name: "Cimb Bank",
      group: "bank"
    },
    {
      file: "bankislam.html",
      name: "Bank Islam",
      group: "bank"
    },
    {
      file: "rhbbank.html",
      name: "Rhb Bank",
      group: "bank"
    },
    {
      file: "maybank2u.html",
      name: "Maybank2u",
      group: "bank"
    },

    {
      file: "findgame.html",
      name: "Find Game",
      group: "list"
    },
    {
      file: "tipsgame.html",
      name: "Tips Game",
      group: "list"
    },
    {
      file: "logogame.html",
      name: "Logo Game",
      group: "list"
    },

    {
      file: "stickynotes.html",
      name: "Sticky Notes",
      group: "tools"
    },
    {
      file: "typingtest.html",
      name: "Typing Test",
      group: "tools"
    },
    {
      file: "history.html",
      name: "My History",
      group: "tools"
    }
  ];
  /* ==========================================================
     SHARED TAB REGISTRY
     Digunakan oleh Admin Users untuk membaca senarai tab
     ========================================================== */

  window.getAdminPages = function () {
    return ADMIN_PAGES.map(page => ({
      file: page.file,
      name: page.name,
      group: page.group
    }));
  };
  /* ==========================================================
     ADMIN TAB PERMISSIONS
     ========================================================== */

const SUPERADMIN_ONLY_PAGES = new Set([
  "users.html","livechat-support.html","notice.html"]);
  let currentAdminProfile = null;

  function canShowAdminPage(file) {
    const pageFile = String(file || "").trim().toLowerCase();

    if (!pageFile) return false;

    // Jangan benarkan halaman yang tidak didaftarkan.
    if (!ADMIN_PAGES.some(page => page.file === pageFile)) {
      return false;
    }

    // Tunggu profile sebenar dimuatkan.
    if (!currentAdminProfile) return false;

    // Superadmin boleh melihat semua halaman.
    if (currentAdminProfile.role === "superadmin") {
      return true;
    }

    if (currentAdminProfile.role !== "siteadmin") {
      return false;
    }

    // Halaman khas Superadmin.
    if (SUPERADMIN_ONLY_PAGES.has(pageFile)) {
      return false;
    }

    const actions =
     currentAdminProfile.permissions?.[pageFile.replace(/\.html$/, "_html")];

    return (
      Array.isArray(actions) &&
      actions.includes("show")
    );
  }

  function getVisibleAdminPages() {
    return ADMIN_PAGES.filter(page =>
      canShowAdminPage(page.file)
    );
  }

function canViewAdminPage(file) {
  const pageFile = String(file || "")
    .split(/[?#]/)[0]
    .split("/")
    .pop()
    .trim()
    .toLowerCase();

  if (!pageFile) return false;

  if (!ADMIN_PAGES.some(page => page.file === pageFile)) {
    return false;
  }

  if (!currentAdminProfile) return false;

  if (currentAdminProfile.role === "superadmin") {
    return true;
  }

  if (currentAdminProfile.role !== "siteadmin") {
    return false;
  }

  if (SUPERADMIN_ONLY_PAGES.has(pageFile)) {
    return false;
  }

  const actions =
    currentAdminProfile.permissions?.[pageFile.replace(/\.html$/, "_html")];

  return (
    Array.isArray(actions) &&
    actions.includes("view")
  );
}

  const DEFAULT_ADMIN_TAB = {
    file: "livechat.html",
    name: "Live Chat",
    group: "main"
  };

  const EMPTY_WORKSPACE_ONCE_KEY =
    "adminEmptyWorkspaceOnce";
  /* ==========================================================
     ICONS
     ========================================================== */

  const ICON_MENU = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/>
    </svg>
  `;

  const ICON_REFRESH = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.65 6.35A7.95 7.95 0 0 0 12 4
               a8 8 0 1 0 7.75 10h-2.1
               A6 6 0 1 1 12 6
               c1.66 0 3.14.69 4.22 1.78
               L13 11h7V4l-2.35 2.35z"/>
    </svg>
  `;
const ADMIN_TAB_REFRESH_ICON = `
  <svg viewBox="64 64 896 896"
       width="1em"
       height="1em"
       fill="currentColor"
       aria-hidden="true">
    <path d="M909.1 209.3l-58.6 58.6C790.9 153.3 671.7 80 540 80c-202.4 0-368 165.6-368 368s165.6 368 368 368c154.8 0 287.3-96.2 341.2-232h-91.9C741.8 671.8 648.9 728 540 728c-154.6 0-280-125.4-280-280s125.4-280 280-280c107.7 0 201.3 60.8 248.2 150H688v80h240V158h-80v93.1z"/>
  </svg>
`;

const ADMIN_TAB_MORE_ICON = `
  <svg viewBox="64 64 896 896"
       width="1em"
       height="1em"
       fill="currentColor"
       aria-hidden="true">
    <path d="M176 511a56 56 0 10112 0 56 56 0 10-112 0zm280 0a56 56 0 10112 0 56 56 0 10-112 0zm280 0a56 56 0 10112 0 56 56 0 10-112 0z"/>
  </svg>
`;
   const ICON_CHECK = `
  <svg
    class="check-icon"
    viewBox="64 64 896 896"
    focusable="false"
    data-icon="check"
    fill="currentColor"
    aria-hidden="true">
    <path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 00-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z"/>
  </svg>
`;
  const ICON_CLOSE = `
    <svg viewBox="64 64 896 896"
         width="1em"
         height="1em"
         fill="currentColor"
         aria-hidden="true">
      <path d="M799.86 166.31c.02 0 .04.02.08.06l57.69 57.7c.04.03.05.05.06.08a.12.12 0 010 .06c0 .03-.02.05-.06.09L569.93 512l287.7 287.7c.04.04.05.06.06.09a.12.12 0 010 .07c0 .02-.02.04-.06.08l-57.7 57.69c-.03.04-.05.05-.07.06a.12.12 0 01-.07 0c-.03 0-.05-.02-.09-.06L512 569.93l-287.7 287.7c-.04.04-.06.05-.09.06a.12.12 0 01-.07 0c-.02 0-.04-.02-.08-.06l-57.69-57.7c-.04-.03-.05-.05-.06-.07a.12.12 0 010-.07c0-.03.02-.05.06-.09L454.07 512l-287.7-287.7c-.04-.04-.05-.06-.06-.09a.12.12 0 010-.07c0-.02.02-.04.06-.08l57.7-57.69c.03-.04.05-.05.07-.06a.12.12 0 01.07 0c.03 0 .05.02.09.06L512 454.07l287.7-287.7c.04-.04.06-.05.09-.06a.12.12 0 01.07 0z"/>
    </svg>
  `;
const ICON_SEARCH = `
  <svg viewBox="64 64 896 896" aria-hidden="true">
    <path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"/>
  </svg>
`;
const ICON_CLEAR = `
  <svg viewBox="64 64 896 896" aria-hidden="true">
    <path d="M512 64c247.4 0 448 200.6 448 448S759.4 960 512 960 64 759.4 64 512 264.6 64 512 64zm127.98 274.82h-.04l-.08.06L512 466.75 384.14 338.88c-.04-.05-.06-.06-.08-.06a.12.12 0 00-.07 0c-.03 0-.05.01-.09.05l-45.02 45.02a.2.2 0 00-.05.09.12.12 0 000 .07v.02a.27.27 0 00.06.06L466.75 512 338.88 639.86c-.05.04-.06.06-.06.08a.12.12 0 000 .07c0 .03.01.05.05.09l45.02 45.02a.2.2 0 00.09.05.12.12 0 00.07 0c.02 0 .04-.01.08-.05L512 557.25l127.86 127.87c.04.04.06.05.08.05a.12.12 0 00.07 0c.03 0 .05-.01.09-.05l45.02-45.02a.2.2 0 00.05-.09.12.12 0 000-.07v-.02a.27.27 0 00-.05-.06L557.25 512l127.87-127.86c.04-.04.05-.06.05-.08a.12.12 0 000-.07c0-.03-.01-.05-.05-.09l-45.02-45.02a.2.2 0 00-.09-.05.12.12 0 00-.07 0z"/>
  </svg>
`;

const ICON_ARROW = `
  <svg class="sidebar-arrow-icon"
       viewBox="64 64 896 896"
       fill="currentColor"
       aria-hidden="true">
    <path d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"/>
  </svg>
`;



  /* ==========================================================
     USER STORAGE
     ========================================================== */


function getCurrentUserStorageSuffix() {
  try {
    const user = firebase.auth().currentUser;

    const sessionUid = sessionStorage.getItem(
      "5g88.adminSession"
    );

    // Pastikan UID milik login yang sah.
    if (
      !user ||
      user.isAnonymous ||
      !sessionUid ||
      user.uid !== sessionUid
    ) {
      return null;
    }

    return user.uid;
  } catch (error) {
    return null;
  }
}




function getTabsStorageKey() {
  const uid = getCurrentUserStorageSuffix();
  return uid ? `openTabs_uid_${uid}` : null;
}

function getActiveTabStorageKey() {
  const uid = getCurrentUserStorageSuffix();
  return uid ? `activeTabUrl_uid_${uid}` : null;
}


  /* ==========================================================
     URL HELPERS
     ========================================================== */

  function normalizeUrl(url) {
    try {
      const result = new URL(
        String(url || ""),
        window.location.href
      );

      result.hash = "";

      return result.href.replace(/\/+$/, "");

    } catch (_) {
      return String(url || "")
        .trim()
        .replace(/\/+$/, "");
    }
  }


  function getCurrentFile() {
    const file =
      window.location.pathname
        .split("/")
        .filter(Boolean)
        .pop() || "index.html";

    return file.toLowerCase();
  }

function isLivechatTabActive() {
  return getCurrentFile() === "livechat.html";
}

window.isLivechatTabActive = isLivechatTabActive;
  function findPageByFile(file) {
    const target = String(file || "")
      .trim()
      .toLowerCase();

    return ADMIN_PAGES.find(
      item =>
        item.file.toLowerCase() === target
    ) || null;
  }


  /* ==========================================================
     TAB STORAGE
     ========================================================== */

  function getTabs() {
   if (!getTabsStorageKey()) return [];
    try {
      const value =
        JSON.parse(
          localStorage.getItem(
            getTabsStorageKey()
          ) || "[]"
        );

      if (!Array.isArray(value)) {
        return [];
      }

      return value
        .map(tab => {

          if (tab.file) {
            const page =
              findPageByFile(tab.file);

            return {
              file: tab.file,
              name:
                tab.name ||
                tab.label ||
                page?.name ||
                tab.file,
              group:
                tab.group ||
                page?.group ||
                "none"
            };
          }

          if (tab.url) {
            try {
              const url =
                new URL(
                  tab.url,
                  location.href
                );

              const file =
                url.pathname
                  .split("/")
                  .filter(Boolean)
                  .pop();

              if (!file) return null;

              const page =
                findPageByFile(file);

              return {
                file,
                name:
                  tab.label ||
                  tab.name ||
                  page?.name ||
                  file,
                group:
                  tab.group ||
                  page?.group ||
                  "none"
              };

            } catch (_) {
              return null;
            }
          }

          return null;
        })
        .filter(Boolean);

    } catch (_) {
      return [];
    }
  }



function getUserTabsDbPath() {
  const uid = getCurrentUserStorageSuffix();

  if (!uid) return "";

  return `adminWorkspaceTabs/${uid}`;
}


function syncTabsToFirebase(tabs) {
  try {
    const sharedDb = getSharedDb();
    if (!sharedDb) return;

    const path = getUserTabsDbPath();
    if (!path) return;

    sharedDb.ref(path).set({
      tabs: Array.isArray(tabs) ? tabs : [],
      activeTabUrl: normalizeUrl(`./${getActiveFile()}`),
      updatedAt: Date.now()
    }).catch(err => {
      console.warn("[shared-ui] tab sync failed:", err);
    });

  } catch (err) {
    console.warn("[shared-ui] tab sync error:", err);
  }
}

  function saveTabs(tabs) {
   if (!getTabsStorageKey()) return;
    const finalTabs = Array.isArray(tabs) ? tabs : [];

    localStorage.setItem(
      getTabsStorageKey(),
      JSON.stringify(finalTabs)
    );

    syncTabsToFirebase(finalTabs);
  }


  function getActiveFile() {
     if (!getActiveTabStorageKey()) {
  return getCurrentFile();
}
    const stored =
      localStorage.getItem(
        getActiveTabStorageKey()
      );

    if (!stored) {
      return getCurrentFile();
    }

    /*
     * Support activeTabUrl lama
     * yang menyimpan full URL.
     */
    try {
      const url =
        new URL(
          stored,
          location.href
        );

      return (
        url.pathname
          .split("/")
          .filter(Boolean)
          .pop() ||
        getCurrentFile()
      ).toLowerCase();

    } catch (_) {
      return String(stored)
        .split("/")
        .pop()
        .toLowerCase();
    }
  }


  function setActiveFile(file) {
     if (!getActiveTabStorageKey()) return;
    const url =
      normalizeUrl(`./${file}`);

    localStorage.setItem(
      getActiveTabStorageKey(),
      url
    );
  }


  /* ==========================================================
     NAVIGATION
     ========================================================== */

  function navigateToTab(tab) {
    if (!tab?.file) return;
     const targetFile = String(tab.file)
  .split(/[?#]/)[0]
  .split("/")
  .pop()
  .toLowerCase();

if (
  !canShowAdminPage(targetFile) ||
  !canViewAdminPage(targetFile)
) {
  console.warn(
    "[Permission] Navigation blocked:",
    targetFile
  );
  return;
}

// Kalau tab yang sama sedang aktif, jangan reload.
if (getCurrentFile() === targetFile) {
  return;
}

setActiveFile(targetFile);

// Tandakan navigasi tab untuk Smart Content Loader.
sessionStorage.setItem(
  "5g88.smartTabNavigation",
  "1"
);

// Navigasi ke halaman tab yang dipilih.
window.location.assign(`./${targetFile}`);
  }


  function addTab(tabOrName, file, group = "none") {

    let tab;

    if (
      typeof tabOrName === "object" &&
      tabOrName
    ) {

      tab = {
        file: tabOrName.file,
        name:
          tabOrName.name ||
          tabOrName.label ||
          tabOrName.file,
        group:
          tabOrName.group ||
          "none"
      };

    } else {

      tab = {
        file,
        name: tabOrName,
        group
      };
    }

    if (!tab.file) return;

    const page =
      findPageByFile(tab.file);
     const targetFile = String(tab.file)
  .split(/[?#]/)[0]
  .split("/")
  .pop()
  .toLowerCase();

if (
  !canShowAdminPage(targetFile) ||
  !canViewAdminPage(targetFile)
) {
  console.warn(
    "[Permission] Add tab blocked:",
    targetFile
  );
  return;
}

    if (page) {
      tab = {
        ...page,
        ...tab
      };
    }

    const tabs = getTabs();

    const index =
      tabs.findIndex(
        item =>
          item.file.toLowerCase() ===
          tab.file.toLowerCase()
      );

    if (index === -1) {
      window.G88History?.log("Open Tab", {kind:"tab",target:targetFile});
      tabs.push(tab);
    } else {
      window.G88History?.log("Switch Tab", {kind:"tab",target:targetFile});
      tabs[index] = {
        ...tabs[index],
        ...tab
      };
    }

// Simpan pilihan tab secara lokal.
setActiveFile(tab.file);
saveTabs(tabs);

// Render tab asli sekarang, tanpa tunggu Firebase.
renderTabs();
renderSidebarTabs();
updateOpenIndicators();
updateHeaderActiveState();

// Biar browser paparkan tab dahulu.
requestAnimationFrame(() => {
  navigateToTab(tab);
});
  }


  function closeTab(file) {
    const target =
      String(file || "")
        .trim()
        .toLowerCase();

    const tabs = getTabs();

    const index =
      tabs.findIndex(
        item =>
          item.file.toLowerCase() ===
          target
      );

    if (index === -1) return;

    const currentFile =
      getCurrentFile();

    const wasActive =
      currentFile === target;

tabs.splice(index, 1);
window.G88History?.log("Close Tab", {kind:"tab",target});

// Jika tab aktif ditutup, tetapkan destinasi baharu
// sebelum menyimpan supaya Firebase menerima activeTabUrl betul.
if (wasActive) {
  const remainingAllowed = tabs.filter(tab =>
    canShowAdminPage(tab.file) &&
    canViewAdminPage(tab.file)
  );

  if (remainingAllowed.length) {
    const nextIndex = Math.min(
      index,
      remainingAllowed.length - 1
    );

    setActiveFile(remainingAllowed[nextIndex].file);
  } else {
    localStorage.removeItem(getActiveTabStorageKey());
  }
}

// Simpan perubahan tanpa tunggu Firebase.
saveTabs(tabs);

// Kemas kini tabbar terus.
renderTabs();
renderSidebarTabs();
updateOpenIndicators();
updateHeaderActiveState();

if (!wasActive) {
  return;
}

    if (!tabs.length) {

      localStorage.removeItem(
        getActiveTabStorageKey()
      );

      sessionStorage.setItem(
        EMPTY_WORKSPACE_ONCE_KEY,
        "1"
      );

      window.location.href =
        "./index.html";

      return;
    }

const allowedTabs = tabs.filter(tab =>
  canShowAdminPage(tab.file) &&
  canViewAdminPage(tab.file)
);

if (!allowedTabs.length) {
  localStorage.removeItem(getActiveTabStorageKey());

  sessionStorage.setItem(
    EMPTY_WORKSPACE_ONCE_KEY,
    "1"
  );

  window.location.replace("./index.html");
  return;
}

const nextTab =
  allowedTabs[
    Math.min(index, allowedTabs.length - 1)
  ];

setActiveFile(nextTab.file);

requestAnimationFrame(() => {
  navigateToTab(nextTab);
});
  }


function initDefaultWorkspace() {
  if (getCurrentFile() !== "index.html") {
    return false;
  }

  // Selepas tutup tab terakhir, kekalkan workspace kosong sekali.
  if (
    sessionStorage.getItem(EMPTY_WORKSPACE_ONCE_KEY) === "1"
  ) {
    sessionStorage.removeItem(EMPTY_WORKSPACE_ONCE_KEY);
    return false;
  }

const allowedTabs = getTabs().filter(tab =>
  canShowAdminPage(tab.file) &&
  canViewAdminPage(tab.file)
);

  const lastFile = getActiveFile();

  let targetTab = allowedTabs.find(tab =>
    tab.file.toLowerCase() === lastFile.toLowerCase()
  );

  if (!targetTab && allowedTabs.length) {
    targetTab = allowedTabs[allowedTabs.length - 1];
  }

if (
  !targetTab &&
  canShowAdminPage(DEFAULT_ADMIN_TAB.file) &&
  canViewAdminPage(DEFAULT_ADMIN_TAB.file)
) {
    targetTab = { ...DEFAULT_ADMIN_TAB };

    const tabs = getTabs();

    if (!tabs.some(tab => tab.file === targetTab.file)) {
      tabs.push(targetTab);
      saveTabs(tabs);
    }
  }

  // Jika Live Chat di-hide dan tiada tab lain,
  // kekalkan workspace kosong.
  if (!targetTab) {
    return false;
  }

  setActiveFile(targetTab.file);

  window.location.replace("./" + targetTab.file);
  return true;
}

  /* ==========================================================
     SYNC CURRENT PAGE
     ========================================================== */

  function syncCurrentPageTab() {
    const currentFile =
      getCurrentFile();
     
    // Jangan simpan halaman yang tidak dibenarkan.
    if (
currentFile !== "index.html" &&
(
  !canShowAdminPage(currentFile) ||
  !canViewAdminPage(currentFile)
)
    ) {
      console.warn(
        "[Permission] Current page not allowed:",
        currentFile
      );
      return;
    }


    if (
      !currentFile ||
      currentFile === "index.html"
    ) {
      return;
    }

    const page =
      findPageByFile(currentFile);

    if (!page) return;

    const tabs =
      getTabs();

    const exists =
      tabs.some(
        tab =>
          tab.file.toLowerCase() ===
          currentFile
      );

    if (!exists) {
      tabs.push(page);
      saveTabs(tabs);
    }

    setActiveFile(currentFile);
  }

/* ==========================================================
   SHARED SHELL HTML
   ========================================================== */

function createShell() {


  if (document.getElementById("homepageSharedShell")) {
    return;
  }

  const shell = document.createElement("div");
  shell.id = "homepageSharedShell";

  shell.innerHTML = `
<div class="sidebar-overlay" id="overlay"></div>

<div class="sidebar" id="sidebar">
  <div class="sidebar-inner">

    <div class="sidebar-top">

      <div class="sidebar-search-wrap">

        <form
          autocomplete="off"
          onsubmit="return false;">

          <input
            type="text"
            id="sidebarSearchInput"
            class="sidebar-search-input"
            placeholder="Search menu..."
            name="no_autofill_sidebar_8271"
            autocomplete="new-password"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            inputmode="search"
            readonly
            onfocus="this.removeAttribute('readonly');"
          >

        </form>

      </div>

    </div>

    <!-- HANYA SIDEBAR ITEMS YANG SCROLL -->
    <div class="sidebar-menu-scroll">
      <div id="customSidebarTabs"></div>
    </div>

  </div>


  <div
    id="sidebarVersionBox"
    class="sidebar-version-box">

    <div class="sidebar-version-left">
      <span class="sidebar-version-label">
        Version:
      </span>

      <span id="sidebarVersionText">-</span>
    </div>

    <div
      id="sidebarNotifSlot"
      class="sidebar-notif-slot">
    </div>

  </div>
</div>


<div class="header">

  <div class="header-links">

    <!-- HEADER TAB SEARCH -->
    <div
      class="header-tab-search"
      id="headerTabSearch">

<div
  id="headerSiteCustom"
  class="header-site-custom admin-site-selector"
  aria-label="Select Site">
</div>

<form
  id="headerTabSearchForm"
  autocomplete="off"
  onsubmit="return false;">
        <div class="header-tab-search-input-wrap">


<input
  id="headerTabSearchInput"
  class="header-tab-search-input"
  type="search"
  name="site_filter_query"
  placeholder="🏢 🔍 Search"
  autocomplete="off"
  autocorrect="off"
  autocapitalize="off"
  spellcheck="false"
  data-lpignore="true"
  data-1p-ignore="true"
  aria-label="Search sites"
>



<svg
  id="headerTabSearchArrow"
  class="header-tab-search-arrow"

            viewBox="64 64 896 896"
            aria-hidden="true">

            <path d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"></path>

          </svg>

        </div>
      </form>

<button
  type="button"
  id="headerTabSearchMobileBtn"
  class="header-tab-search-mobile-btn"
  aria-label="Select Tab"
  title="Select Tab"
  aria-expanded="false"
  aria-controls="headerTabSearchList">

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  width="19.2"
  height="19.2"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  aria-hidden="true">

    <path d="M14 22V8c0-2.828 0-4.243-.879-5.121C12.243 2 10.828 2 8 2s-4.243 0-5.121.879C2 3.757 2 5.172 2 8v8c0 2.828 0 4.243.879 5.121C3.757 22 5.172 22 8 22zM6.5 11h-1m5 0h-1m-3-4h-1m1 8h-1m5-8h-1m5 8h-1m1-4h-1m.5-3h-4v14h4c1.886 0 2.828 0 3.414-.586S22 19.886 22 18v-6c0-1.886 0-2.828-.586-3.414S19.886 8 18 8Z"/>
  </svg>

</button>

      <div
        id="headerTabSearchList"
        class="header-tab-search-list">
      </div>
     
<!-- MOBILE SELECT TAB PANEL -->
<div
  id="headerTabSearchMobilePanel"
  class="header-tab-search-mobile-panel"
  hidden>

  <div class="header-tab-search-mobile-input-wrap">
    <input
      id="headerTabSearchMobileInput"
      class="header-tab-search-mobile-input"
      type="search"
      placeholder="Search"
      name="mobile_tab_lookup_no_autofill"
autocomplete="off"
autocorrect="off"
autocapitalize="off"
spellcheck="false"
data-lpignore="true"
data-1p-ignore="true"
aria-label="Search tabs"
      aria-label="Search"
    >

  <!-- ARROW DOWN -->
  <svg class="header-tab-search-mobile-icon mobile-icon-arrow"
       viewBox="64 64 896 896"
       aria-hidden="true">
    <path d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"/>
  </svg>

  <!-- SEARCH -->

<!-- SEARCH - ORIGINAL ICON -->
<svg class="header-tab-search-mobile-icon mobile-icon-search"
     viewBox="64 64 896 896"
     aria-hidden="true">
  <path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"/>
</svg>

<!-- CLEAR - ORIGINAL ICON -->
<svg class="header-tab-search-mobile-icon mobile-icon-clear"
     viewBox="64 64 896 896"
     aria-hidden="true">
  <path d="M512 64c247.4 0 448 200.6 448 448S759.4 960 512 960 64 759.4 64 512 264.6 64 512 64zm127.98 274.82h-.04l-.08.06L512 466.75 384.14 338.88c-.04-.05-.06-.06-.08-.06a.12.12 0 00-.07 0c-.03 0-.05.01-.09.05l-45.02 45.02a.2.2 0 00-.05.09.12.12 0 000 .07v.02a.27.27 0 00.06.06L466.75 512 338.88 639.86c-.05.04-.06.06-.06.08a.12.12 0 000 .07c0 .03.01.05.05.09l45.02 45.02a.2.2 0 00.09.05.12.12 0 00.07 0c.02 0 .04-.01.08-.05L512 557.25l127.86 127.87c.04.04.06.05.08.05a.12.12 0 00.07 0c.03 0 .05-.01.09-.05l45.02-45.02a.2.2 0 00.05-.09.12.12 0 000-.07v-.02a.27.27 0 00-.05-.06L557.25 512l127.87-127.86c.04-.04.05-.06.05-.08a.12.12 0 000-.07c0-.03-.01-.05-.05-.09l-45.02-45.02a.2.2 0 00-.09-.05.12.12 0 00-.07 0z"/>
</svg>

  </div>

</div>

    </div>


    <!-- LINK DOWNLOAD -->
    <button
      id="linkDownloadBtn"
      class="live-chat-button"
      onclick="addTab('LINK DOWNLOAD','./linkdownload.html')"
      aria-label="Link Download"
      title="Link Download">

      <svg
        width="1.2rem"
        height="1.2rem"
        fill="white"
        viewBox="0 0 24 24">

        <path d="M9 2h6v1h-6v-1zm6-1v-1h-6v1h6zm-5.146 21l-1.854 2h8l-1.854-2h-4.292zm10.146-14h-5v-4h-6v4h-5l8 8 8-8zm-2 11h-12v-6.172l-2-2v10.172h16v-10.172l-2 2v6.172z"/>

      </svg>

      <span class="btn-label">
        Link Download
      </span>

    </button>


    <!-- GAME LOG -->
    <div class="dropdown-wrapper">

      <button
        id="gameLogBtn"
        class="live-chat-button"
        aria-label="Game Log"
        title="Game Log">

        <svg
          width="1.2rem"
          height="1.2rem"
          fill="white"
          viewBox="0 0 24 24">

          <path d="M17 4c.763 0 1.394.434 1.856.89c.481.473.922 1.109 1.314 1.81c.787 1.406 1.472 3.243 1.925 5.058c.45 1.801.699 3.682.54 5.161C22.475 18.404 21.71 20 20 20c-1.476 0-2.652-.76-3.614-1.531l-.351-.289l-.492-.415l-.444-.368C14.08 16.572 13.175 16 12 16s-2.08.572-3.099 1.397l-.444.368l-.492.415l-.35.289C6.651 19.24 5.475 20 4 20c-1.711 0-2.476-1.596-2.635-3.081c-.158-1.48.09-3.36.54-5.161c.453-1.815 1.138-3.652 1.925-5.059c.392-.7.833-1.336 1.314-1.81C5.606 4.434 6.237 4 7 4c.515 0 1.018.123 1.513.27l.592.181q.148.046.295.087c.865.248 1.75.462 2.6.462s1.735-.214 2.6-.462l.885-.267C15.983 4.124 16.49 4 17 4m0 2c-.383 0-.783.116-1.171.243l-.458.151l-.221.068c-.885.252-2 .538-3.15.538s-2.265-.286-3.15-.538l-.22-.068l-.459-.151C7.783 6.115 7.383 6 7 6c-.418.078-.793.585-1.076 1.055l-.158.275l-.19.346c-.682 1.218-1.31 2.88-1.73 4.567c-.395 1.576-.587 3.086-.514 4.21l.026.293l.02.176l.03.208c.069.401.218.87.592.87c.812 0 1.49-.404 2.333-1.074l.403-.328l.76-.636l.344-.28C8.904 14.839 10.235 14 12 14s3.096.84 4.16 1.682l.345.28l.76.636l.402.328C18.51 17.596 19.187 18 20 18c.34 0 .494-.387.571-.759l.038-.218l.037-.317c.123-1.146-.067-2.765-.491-4.463c-.386-1.546-.946-3.072-1.562-4.254l-.359-.66l-.158-.273C17.793 6.585 17.418 6.078 17 6M8.5 8a2.5 2.5 0 1 1 0 5a2.5 2.5 0 0 1 0-5m7 0a1 1 0 0 1 .993.883L16.5 9v.5h.5a1 1 0 0 1 .117 1.993L17 11.5h-.5v.5a1 1 0 0 1-1.993.117L14.5 12v-.5H14a1 1 0 0 1-.117-1.993L14 9.5h.5V9a1 1 0 0 1 1-1m-7 2a.5.5 0 1 0 0 1a.5.5 0 0 0 0-1"/>

        </svg>

        <span class="btn-label">
          Game Log
        </span>

      </button>

      <div
        id="gameLogDropdown"
        class="dropdown-links">
      </div>

    </div>


    <!-- BANK RECEIPT -->
    <div class="dropdown-wrapper">

      <button
        id="bankResitBtn"
        class="live-chat-button"
        aria-label="Bank Resit"
        title="Bank Resit">

        <svg
          width="1.2rem"
          height="1.2rem"
          fill="white"
          viewBox="0 0 24 24">

          <path d="M11.5 1L2 6v2h19V6m-5 4v7h3v-7M2 22h19v-3H2m8-9v7h3v-7m-9 0v7h3v-7z"/>

        </svg>

        <span class="btn-label">
          Bank Receipt
        </span>

      </button>

      <div
        id="bankResitDropdown"
        class="dropdown-links">
      </div>

    </div>


    <!-- LIST TYPE -->
    <div class="dropdown-wrapper">

      <button
        id="gameLinksBtn"
        class="live-chat-button"
        aria-label="Game Links"
        title="Game Links">

        <svg
          width="1.2rem"
          height="1.2rem"
          fill="white"
          viewBox="0 0 24 24">

          <path d="m10.5 17.25c0-.414.336-.75.75-.75h10c.414 0 .75.336.75.75s-.336.75-.75.75h-10c-.414 0-.75-.336-.75-.75zm-1.5-3.55c0-.53-.47-1-1-1h-5c-.53 0-1 .47-1 1v4.3c0 .53.47 1 1 1h5c.53 0 1-.47 1-1zm1.5-1.7c0-.414.336-.75.75-.75h10c.414 0 .75.336.75.75s-.336.75-.75.75h-10c-.414 0-.75-.336-.75-.75zm-1.5-6c0-.53-.47-1-1-1h-5c-.53 0-1 .47-1 1v4.3c0 .53.47 1 1 1h5c.53 0 1-.47 1-1zm1.5.75c0-.414.336-.75.75-.75h10c.414 0 .75.336.75.75s-.336.75-.75.75h-10c-.414 0-.75-.336-.75-.75z"/>

        </svg>

        <span class="btn-label">
          List Type
        </span>

      </button>

      <div
        id="gameLinksDropdown"
        class="dropdown-links">
      </div>

    </div>


    <!-- ITEM -->
    <button
      id="itemBtn"
      class="live-chat-button"
      onclick="addTab('ITEM COLLECTION','./item.html')"
      aria-label="Item"
      title="Item">

      <svg
        width="1.2rem"
        height="1.2rem"
        fill="white"
        viewBox="0 0 24 24">

        <path d="M7 16.462l1.526-.723c1.792-.81 2.851-.344 4.349.232 1.716.661 2.365.883 3.077 1.164 1.278.506.688 2.177-.592 1.838-.778-.206-2.812-.795-3.38-.931-.64-.154-.93.602-.323.818 1.106.393 2.663.79 3.494 1.007.831.218 1.295-.145 1.881-.611.906-.72 2.968-2.909 2.968-2.909.842-.799 1.991-.135 1.991.72 0 .23-.083.474-.276.707-2.328 2.793-3.06 3.642-4.568 5.226-.623.655-1.342.974-2.204.974-.442 0-.922-.084-1.443-.25-1.825-.581-4.172-1.313-6.5-1.6v-5.662zm-1 6.538h-4v-8h4v8zm15-11.497l-6.5 3.468v-7.215l6.5-3.345v7.092zm-7.5-3.771v7.216l-6.458-3.445v-7.133l6.458 3.362zm-3.408-5.589l6.526 3.398-2.596 1.336-6.451-3.359 2.521-1.375zm10.381 1.415l-2.766 1.423-6.558-3.415 2.872-1.566 6.452 3.558z"/>

      </svg>

      <span class="btn-label">
        Item
      </span>

    </button>


    <!-- LIVECHAT -->
    <button
      id="liveChatBtn"
      class="live-chat-button"
      onclick="addTab('LIVE CHAT','./livechat.html')"
      aria-label="LiveChat"
      title="LiveChat">

      <svg
        width="1.2rem"
        height="1.2rem"
        fill="white"
        viewBox="0 0 24 24">

        <path d="M2 22V4q0-.825.588-1.412T4 2h16q.825 0 1.413.588T22 4v12q0 .825-.587 1.413T20 18H6zm4-8h8v-2H6zm0-3h12V9H6zm0-3h12V6H6z"/>

      </svg>

      <span class="btn-label">
        Livechat
      </span>

      <span
        id="livechatDot"
        class="dot-icon">
      </span>

    </button>
<!-- RESPONSIVE HEADER MORE -->
<div id="headerMore" class="header-more" hidden>
  <button
    type="button"
    id="headerMoreBtn"
    class="header-more-btn"
    aria-label="More links"
    aria-haspopup="true"
    aria-expanded="false">
    <svg viewBox="64 64 896 896" aria-hidden="true">
      <path d="M176 511a56 56 0 10112 0 56 56 0 10-112 0zm280 0a56 56 0 10112 0 56 56 0 10-112 0zm280 0a56 56 0 10112 0 56 56 0 10-112 0z"/>
    </svg>
  </button>
  <div id="headerMoreMenu" class="header-more-menu" hidden></div>
</div>
  </div>


  <!-- hidden original logo -->
  <img
    src="https://i.imgur.com/voSG3KC.gif"
    class="floating-logo"
    alt="Logo 5G88"
    style="display:none !important;"
  >


  <!-- MUSIC -->
  <button
    id="musicToggle"
    style="
      position:fixed;
      bottom:20px;
      right:20px;
      z-index:999999;
      background:rgba(0,0,0,0.6);
      color:white;
      border:1px solid white;
      border-radius:50px;
      padding:8px 14px;
      cursor:pointer;
      font-size:13px;
      display:none !important;
    ">

    🎵 MUSIC OFF

  </button>


  <!-- USER AREA -->
  <div class="user-info">

    <div class="user-text">

      <div class="header-right-meta">

        <div
          id="notificationBell"
          style="
            width:18px;
            height:18px;
            background-color:red;
            border-radius:50%;
            display:none;
            justify-content:center;
            align-items:center;
            font-size:12px;
            color:white;
            font-weight:bold;
            cursor:pointer;
          "
          title="You have a new message">
          !
        </div>


        <div id="desktopNotifSlot">

          <div id="notifButton">

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1.2rem"
              height="1.2rem"
              viewBox="0 0 24 24"
              fill="rgba(255,255,255,0.85)">

              <path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-.001 5.75c.69 0 1.251.56 1.251 1.25s-.561 1.25-1.251 1.25-1.249-.56-1.249-1.25.559-1.25 1.249-1.25zm2.001 12.25h-4v-1c.484-.179 1-.201 1-.735v-4.467c0-.534-.516-.618-1-.797v-1h3v6.265c0 .535.517.558 1 .735v.999z"/>

            </svg>

            <span id="notifDot"></span>

          </div>
        </div>


        <div
          id="dateTime"
          class="date-time">
        </div>

      </div>


      <div class="user-dropdown">

        <button
          id="userName"
          class="user-button"
          aria-label="Account"
          title="Account">

          <svg
            width="1rem"
            height="1rem"
            fill="currentColor"
            viewBox="0 0 24 24">

            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8V22h19.2v-2.8c0-3.2-6.4-4.8-9.6-4.8z"/>

          </svg>

          <span id="userNameText"></span>

        </button>


        <div
          id="dropdownContent"
          class="dropdown-content">
<label
  id="themeToggleBtn"
  class="theme-full-switch">

  <input
    id="themeToggleInput"
    type="checkbox"
    aria-label="Toggle theme">

  <span class="theme-full-track">

    <span
      id="themeToggleLabel"
      class="theme-full-text">
      Dark Mode
    </span>

    <span class="theme-full-knob"></span>

  </span>

</label>

<div class="header-color-settings">

  <span class="header-color-title">
    Header Background
  </span>

  <div class="header-color-actions">

<button
  type="button"
  id="headerColor1"
  class="header-color-swatch-btn"
  data-header-color="color1"
  title="Header Color 1"
  aria-label="Header Color 1">

  <span class="header-color-swatch"></span>
</button>

<button
  type="button"
  id="headerColor2"
  class="header-color-swatch-btn"
  data-header-color="color2"
  title="Header Color 2"
  aria-label="Header Color 2">

  <span class="header-color-swatch"></span>
</button>


<button
  type="button"
  id="headerColorReset"
  class="header-color-reset"
  title="Reset Header Color"
  aria-label="Reset Header Color">

  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="currentColor"
    aria-hidden="true">

    <path d="m3.508 6.726c1.765-2.836 4.911-4.726 8.495-4.726 5.518 0 9.997 4.48 9.997 9.997 0 5.519-4.479 9.999-9.997 9.999-5.245 0-9.553-4.048-9.966-9.188-.024-.302.189-.811.749-.811.391 0 .715.3.747.69.351 4.369 4.012 7.809 8.47 7.809 4.69 0 8.497-3.808 8.497-8.499 0-4.689-3.807-8.497-8.497-8.497-3.037 0-5.704 1.597-7.206 3.995l1.991.005c.414 0 .75.336.75.75s-.336.75-.75.75h-4.033c-.414 0-.75-.336-.75-.75v-4.049c0-.414.336-.75.75-.75s.75.335.75.75zm8.492 2.272c1.656 0 3 1.344 3 3s-1.344 3-3 3-3-1.344-3-3 1.344-3 3-3z"/>
  </svg>

</button>


  </div>

</div>

          <button
            id="changePwBtn"
            class="btn-cpw">

            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor">

              <path d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48l1.3-.75l-.85-1.48H7v-1.5H5.3l.85-1.47L4.85 7L4 8.47L3.15 7l-1.3.75l.85 1.47H1v1.5h1.7l-.85 1.48zm6.7-.75l1.3.75l.85-1.48l.85 1.48l1.3-.75l-.85-1.48H15v-1.5h-1.7l.85-1.47l-1.3-.75L12 8.47L11.15 7l-1.3.75l.85 1.47H9v1.5h1.7zM23 9.22h-1.7l.85-1.47l-1.3-.75L20 8.47L19.15 7l-1.3.75l.85 1.47H17v1.5h1.7l-.85 1.48l1.3.75l.85-1.48l.85 1.48l1.3-.75l-.85-1.48H23z"/>

            </svg>

            <span>
              Change Password
            </span>

          </button>


          <button
            id="change2ndPwBtn"
            class="btn-cpw">

            <svg
              width="16"
              height="16"
              viewBox="64 64 896 896"
              fill="currentColor">

              <path d="M832 464h-68V240c0-70.7-57.3-128-128-128H388c-70.7 0-128 57.3-128 128v224h-68c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V496c0-17.7-14.3-32-32-32zM332 240c0-30.9 25.1-56 56-56h248c30.9 0 56 25.1 56 56v224H332V240zm460 600H232V536h560v304z"/>

            </svg>

            <span>
              Change 2nd Password
            </span>

          </button>


          <button id="logoutBtn">

            <svg
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 24 24">

              <path d="M3 21V3h9v2H5v14h7v2zm13-4l-1.375-1.45l2.55-2.55H9v-2h8.175l-2.55-2.55L16 7l5 5z"/>

            </svg>

            <span>Logout</span>

          </button>

        </div>
      </div>

    </div>
  </div>


  <!-- REFRESH -->
  <button
    id="refreshHeaderBtn"
    class="header-refresh-btn"
    aria-label="Refresh Page"
    title="Refresh Page">

    <svg
      id="refreshHeaderIcon"
      viewBox="64 64 896 896"
      width="1rem"
      height="1rem"
      fill="currentColor"
      aria-hidden="true">

      <path d="M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5a8 8 0 00-10.1 4.8c-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 01655.9 829c-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27A341.5 341.5 0 01279 755.2a342.16 342.16 0 01-73.7-109.4c-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27a341.5 341.5 0 01109.3 73.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-10.3-13-6.2z"/>

    </svg>

  </button>


  <!-- MENU -->
  <div
    class="menu-icon"
    id="menuIcon"
    aria-label="Menu"
    title="Menu">

    <svg
      viewBox="64 64 896 896"
      width="1rem"
      height="1rem"
      fill="currentColor"
      aria-hidden="true">

      <path d="M408 442h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8zm-8 204c0 4.4 3.6 8 8 8h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56zm504-486H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm0 632H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zM115.4 518.9L271.7 642c5.8 4.6 14.4.5 14.4-6.9V388.9c0-7.4-8.5-11.5-14.4-6.9L115.4 505.1a8.74 8.74 0 000 13.8z"/>

    </svg>

    <span
      id="menuNotifDot"
      class="menu-notif-dot">
    </span>

  </div>

</div>


<div
  id="tabBar"
  class="tab-bar">
</div>


<!-- CHANGE PASSWORD -->
<div
  id="cpModal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="cpTitle">

  <div id="cpDialog">

    <div id="cpHead">

      <div id="cpTitle">
        Change Password
      </div>

      <button
        id="cpClose"
        aria-label="Close">
        ×
      </button>

    </div>

    <div id="cpBody">

      <div class="cp-hint">
        Enter your old password & new password
        (min 6 characters).
      </div>

      <div
        id="cpErr"
        class="cp-error">
      </div>

      <div
        id="cpOk"
        class="cp-ok">
      </div>

      <div class="cp-group">

        <label
          class="label-required"
          for="cpOld">
          Current Password
        </label>

        <input
          id="cpOld"
          type="password"
          class="cp-input"
          autocomplete="off"
          placeholder="Enter current password">

      </div>

      <div class="cp-group">

        <label
          class="label-required"
          for="cpNew">
          New Password
        </label>

        <input
          id="cpNew"
          type="password"
          class="cp-input"
          autocomplete="off"
          placeholder="Enter new password">

      </div>

      <div class="cp-group">

        <label
          class="label-required"
          for="cpNew2">
          Confirm Password
        </label>

        <input
          id="cpNew2"
          type="password"
          class="cp-input"
          autocomplete="off"
          placeholder="Confirm new password">

      </div>

    </div>

    <div id="cpFoot">

      <button
        class="btn-cancel-new"
        id="cpCancel">
        Cancel
      </button>

      <button
        class="btn-primary-new"
        id="cpSubmit">
        Change
      </button>

    </div>

  </div>
</div>


<!-- CHANGE 2ND PASSWORD -->
<div
  id="cp2Modal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="cp2Title">

  <div id="cp2Dialog">

    <div id="cp2Head">

      <div id="cp2Title">
        Change 2nd Password
      </div>

      <button
        id="cp2Close"
        aria-label="Close">
        ×
      </button>

    </div>

    <div id="cp2Body">

      <div class="cp-hint">
        Enter your current 2nd password &
        new 6 digit 2nd password.
      </div>

      <div
        id="cp2Err"
        class="cp-error">
      </div>

      <div
        id="cp2Ok"
        class="cp-ok">
      </div>

      <div class="cp-group">

        <label
          class="label-required"
          for="cp2Old">
          Current 2nd Password
        </label>

        <input
          id="cp2Old"
          type="password"
          class="cp-input"
          inputmode="numeric"
          maxlength="6"
          autocomplete="off"
          placeholder="Enter current 2nd password">

      </div>

      <div class="cp-group">

        <label
          class="label-required"
          for="cp2New">
          New 2nd Password
        </label>

        <input
          id="cp2New"
          type="password"
          class="cp-input"
          inputmode="numeric"
          maxlength="6"
          autocomplete="off"
          placeholder="Enter new 6 digit 2nd password">

      </div>

      <div class="cp-group">

        <label
          class="label-required"
          for="cp2New2">
          Confirm 2nd Password
        </label>

        <input
          id="cp2New2"
          type="password"
          class="cp-input"
          inputmode="numeric"
          maxlength="6"
          autocomplete="off"
          placeholder="Confirm new 2nd password">

      </div>

    </div>

    <div id="cp2Foot">

      <button
        id="cp2Cancel"
        class="btn-cancel-new"
        type="button">
        Cancel
      </button>

      <button
        id="cp2Submit" 
        class="btn-primary-new"
        type="button">
        Save
      </button>

    </div>

  </div>
</div>

<div id="noticeModal" class="notice-modal" role="dialog" aria-modal="true" aria-labelledby="noticeTitle">
  <div id="noticeDialog" class="notice-dialog">
    <div class="notice-head">
      <div id="noticeTitle" class="notice-title">📢 Announcement!</div>
      <button id="noticeClose" class="notice-close-btn" aria-label="Close">
        <svg viewBox="64 64 896 896" aria-hidden="true">
  <path fill="currentColor" d="M799.86 166.31c.02 0 .04.02.08.06l57.69 57.7c.04.03.05.05.06.08a.12.12 0 010 .06c0 .03-.02.05-.06.09L569.93 512l287.7 287.7c.04.04.05.06.06.09a.12.12 0 010 .07c0 .02-.02.04-.06.08l-57.7 57.69c-.03.04-.05.05-.07.06a.12.12 0 01-.07 0c-.03 0-.05-.02-.09-.06L512 569.93l-287.7 287.7c-.04.04-.06.05-.09.06a.12.12 0 01-.07 0c-.02 0-.04-.02-.08-.06l-57.69-57.7c-.04-.03-.05-.05-.06-.07a.12.12 0 010-.07c0-.03.02-.05.06-.09L454.07 512l-287.7-287.7c-.04-.04-.05-.06-.06-.09a.12.12 0 010-.07c0-.02.02-.04.06-.08l57.7-57.69c.03-.04.05-.05.07-.06a.12.12 0 01.07 0c.03 0 .05.02.09.06L512 454.07l287.7-287.7c.04-.04.06-.05.09-.06a.12.12 0 01.07 0z"/>
</svg>
      </button>
    </div>

    <div class="notice-body">
      <div id="noticeMessageText" class="notice-message-text"></div>
      <div id="noticeMessageTime" class="notice-message-time"></div>
    </div>

    <div class="notice-foot">
      <button id="noticeOkBtn" class="notice-ok-btn">OK</button>
    </div>
  </div>
</div>
  
  <div id="appUpdateModal" class="app-update-modal" style="display:none;" aria-hidden="true">
  <div class="app-update-dialog">
    <div class="app-update-title" id="appUpdateTitle">Update Available</div>
    <div class="app-update-line"></div>

    <div class="app-update-message" id="appUpdateMessage">
      A new version is available. Would you like to update?
    </div>

    <button id="appUpdateBtn" class="app-update-btn" type="button">
      Yes, Update
    </button>
  </div>
</div>
  
<!-- FLOATING FAB -->
<div id="floatingFabWrap" class="floating-fab-wrap">
  <div id="floatingFabActions" class="floating-fab-actions">
    <button id="floatingNoticeBtn" class="floating-mini-btn" type="button" title="Notice">
      <span id="floatingNoticeDot" class="floating-mini-dot" style="display:none;"></span>
      <svg viewBox="0 0 24 24" class="floating-mini-icon" aria-hidden="true">
        <path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-.001 5.75c.69 0 1.251.56 1.251 1.25s-.561 1.25-1.251 1.25-1.249-.56-1.249-1.25.559-1.25 1.249-1.25zm2.001 12.25h-4v-1c.484-.179 1-.201 1-.735v-4.467c0-.534-.516-.618-1-.797v-1h3v6.265c0 .535.517.558 1 .735v.999z"/>
      </svg>
    </button>

    <button id="floatingLivechatBtn" class="floating-mini-btn" type="button" title="LiveChat">
      <span id="floatingLivechatDot" class="floating-mini-dot" style="display:none;"></span>
      <svg viewBox="0 0 24 24" class="floating-mini-icon" aria-hidden="true">
        <path d="M2 22V4q0-.825.588-1.412T4 2h16q.825 0 1.413.588T22 4v12q0 .825-.587 1.413T20 18H6zm4-8h8v-2H6zm0-3h12V9H6zm0-3h12V6H6z"/>
      </svg>
    </button>
  </div>

  <button id="floatingMainBtn" class="floating-main-btn" type="button" title="Quick Menu">
    <span id="floatingMainDot" class="floating-main-dot" style="display:none;"></span>

    <svg id="floatingMainInfoIcon" viewBox="0 0 24 24" class="floating-main-icon" aria-hidden="true">
      <path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-.001 5.75c.69 0 1.251.56 1.251 1.25s-.561 1.25-1.251 1.25-1.249-.56-1.249-1.25.559-1.25 1.249-1.25zm2.001 12.25h-4v-1c.484-.179 1-.201 1-.735v-4.467c0-.534-.516-.618-1-.797v-1h3v6.265c0 .535.517.558 1 .735v.999z"/>
    </svg>

    <svg id="floatingMainCloseIcon" viewBox="0 0 1024 1024" class="floating-main-icon" aria-hidden="true" style="display:none;">
      <path d="M799.86 166.31c.02 0 .04.02.08.06l57.69 57.7c.04.03.05.05.06.08a.12.12 0 010 .06c0 .03-.02.05-.06.09L569.93 512l287.7 287.7c.04.04.05.06.06.09a.12.12 0 010 .07c0 .02-.02.04-.06.08l-57.7 57.69c-.03.04-.05.05-.07.06a.12.12 0 01-.07 0c-.03 0-.05-.02-.09-.06L512 569.93l-287.7 287.7c-.04.04-.06.05-.09.06a.12.12 0 01-.07 0c-.02 0-.04-.02-.08-.06l-57.69-57.7c-.04-.03-.05-.05-.06-.07a.12.12 0 010-.07c0-.03.02-.05.06-.09L454.07 512l-287.7-287.7c-.04-.04-.05-.06-.06-.09a.12.12 0 010-.07c0-.02.02-.04.06-.08l57.7-57.69c.03-.04.05-.05.07-.06a.12.12 0 01.07 0c.03 0 .05.02.09.06L512 454.07l287.7-287.7c.04-.04.06-.05.09-.06a.12.12 0 01.07 0z"/>
    </svg>
  </button>
</div>
  `;

// Masukkan shell lengkap ke halaman.
document.body.prepend(shell);
}
  /* ==========================================================
     DROPDOWN MENU CONTENT
     ========================================================== */

  function makeMenuLink(page) {

    const link =
      document.createElement("a");

    link.href =
      `./${page.file}`;

    link.dataset.file =
      page.file;

link.innerHTML = `
  <span>${page.name}</span>
  ${ICON_CHECK}
`;

    link.addEventListener(
      "click",
      event => {

        event.preventDefault();

        addTab(page);
      }
    );

    return link;
  }


  function renderDropdown(
    id,
    group
  ) {

    const container =
      document.getElementById(id);

    if (!container) return;

    container.innerHTML = "";

getVisibleAdminPages()
  .filter(
    page =>
      page.group === group
  )
      .forEach(page => {

        container.appendChild(
          makeMenuLink(page)
        );

      });
  }


  /* ==========================================================
     SIDEBAR
     ========================================================== */


function renderSidebarTabs() {
  const container = document.getElementById("customSidebarTabs");
  if (!container) return;

  const oldOpenGroups = new Set(
    [...container.querySelectorAll(".sidebar-group.is-open")]
      .map(el => el.dataset.group)
  );

const groupNames = {
  main: "Main Menu",
  gamelog: "Game Log",
  bank: "Bank Receipt",
  list: "List Type",
  tools: "Tools"
};

  const groupOrder = ["main", "gamelog", "bank", "list", "tools"];
  const pages = getVisibleAdminPages();

  container.replaceChildren();

  /* STANDALONE SIDEBAR ITEMS */
  pages
    .filter(page => page.group === "standalone")
    .forEach(page => {
      const link = document.createElement("a");

      link.href = `./${page.file}`;
      link.className = "sidebar-standalone-link";
      link.dataset.file = page.file;
      link.textContent = page.name;

      link.addEventListener("click", event => {
        event.preventDefault();
        addTab(page);
      });

      container.appendChild(link);
    });

  const groups = [...new Set([
    ...groupOrder,
    ...pages
      .filter(page => page.group !== "standalone")
      .map(page => page.group || "main")
  ])];

  groups.forEach(groupId => {
    const groupPages = pages.filter(
      page => (page.group || "main") === groupId
    );

    if (!groupPages.length) return;

    const group = document.createElement("section");
    group.className = "sidebar-group";
    group.dataset.group = groupId;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "sidebar-group-toggle";
    button.setAttribute("aria-expanded", "false");

    const title = document.createElement("span");
    title.className = "sidebar-group-title";
    title.textContent = groupNames[groupId] || groupId;

    const arrow = document.createElement("span");
    arrow.className = "sidebar-group-arrow";
    arrow.innerHTML = ICON_ARROW;

    button.append(title, arrow);

    const panel = document.createElement("div");
    panel.className = "sidebar-group-panel";

    const inner = document.createElement("div");
    inner.className = "sidebar-group-inner";

    groupPages.forEach(page => {
      const link = document.createElement("a");

      link.href = `./${page.file}`;
      link.dataset.file = page.file;

      const left = document.createElement("span");
      left.className = "sidebar-link-left";

      const label = document.createElement("span");
      label.className = "sidebar-link-text";
      label.textContent = page.name;

      left.appendChild(label);
      link.append(left);

      link.addEventListener("click", event => {
        event.preventDefault();
        addTab(page);
      });

      inner.appendChild(link);
    });

    panel.appendChild(inner);
    group.append(button, panel);
    container.appendChild(group);

    const setOpen = open => {
      group.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", String(open));
    };

    button.addEventListener("click", () => {
      setOpen(!group.classList.contains("is-open"));
    });

    const hasActivePage = groupPages.some(
      page => page.file.toLowerCase() === getCurrentFile()
    );

    setOpen(oldOpenGroups.has(groupId) || hasActivePage);
  });

  updateOpenIndicators();

  const search = document.getElementById("sidebarSearchInput");
  if (search?.value.trim()) {
    filterSidebarGroups(search.value);
  }
}


  function openSidebar() {

    document
      .getElementById("sidebar")
      ?.classList.add("active");

    document
      .getElementById("overlay")
      ?.classList.add("active");
  }


  function closeSidebar() {

    document
      .getElementById("sidebar")
      ?.classList.remove("active");

    document
      .getElementById("overlay")
      ?.classList.remove("active");
  }


  function toggleSidebar() {

    const sidebar =
      document.getElementById(
        "sidebar"
      );

    if (!sidebar) return;

    if (
      sidebar.classList.contains(
        "active"
      )
    ) {

      closeSidebar();

    } else {

      openSidebar();
    }
  }


  /* ==========================================================
     OPEN TAB INDICATORS
     ========================================================== */

  function updateOpenIndicators() {

    const files =
      new Set(
        getTabs().map(
          tab =>
            tab.file.toLowerCase()
        )
      );

    document
      .querySelectorAll(
        "[data-file]"
      )
      .forEach(element => {

        const file =
          String(
            element.dataset.file || ""
          ).toLowerCase();

        element.classList.toggle(
          "tab-open",
          files.has(file)
        );
         
/* Tandakan halaman yang sedang aktif */
if (element.matches(".dropdown-links a")) {
  element.classList.toggle(
    "dropdown-page-active",
    file === getCurrentFile()
  );
}


      });
  }


  /* ==========================================================
     HEADER ACTIVE STATE
     ========================================================== */

  function updateHeaderActiveState() {

    const currentFile =
      getCurrentFile();

    const page =
      findPageByFile(
        currentFile
      );

    const live =
      document.getElementById(
        "liveChatBtn"
      );

    const download =
      document.getElementById(
        "linkDownloadBtn"
      );

    const item =
      document.getElementById(
        "itemBtn"
      );

    const game =
      document.getElementById(
        "gameLogBtn"
      );

    const bank =
      document.getElementById(
        "bankResitBtn"
      );

    const list =
      document.getElementById(
        "gameLinksBtn"
      );

    live?.classList.remove(
      "active-livechat"
    );

    download?.classList.remove(
      "active-linkdownload"
    );

    item?.classList.remove(
      "active-itemBtn"
    );

    game?.classList.remove(
      "active-gamelog"
    );

    bank?.classList.remove(
      "active-gamelog"
    );

    list?.classList.remove(
      "active-gamelog"
    );


    if (
      currentFile ===
      "livechat.html"
    ) {

      live?.classList.add(
        "active-livechat"
      );
    }


    if (
      currentFile ===
      "linkdownload.html"
    ) {

      download?.classList.add(
        "active-linkdownload"
      );
    }


    if (
      currentFile ===
      "item.html"
    ) {

      item?.classList.add(
        "active-itemBtn"
      );
    }


    if (!page) return;


    if (
      page.group ===
      "gamelog"
    ) {

      game?.classList.add(
        "active-gamelog"
      );
    }


    if (
      page.group ===
      "bank"
    ) {

      bank?.classList.add(
        "active-gamelog"
      );
    }


    if (
      page.group ===
      "list"
    ) {

      list?.classList.add(
        "active-gamelog"
      );
    }
  }

/* ==========================================================
   SHARED TAB MODULE SEARCH
   Reusable component
   ========================================================== */

function createSharedTabSearch(target, options = {}) {

  const tabBar =
    typeof target === "string"
      ? document.querySelector(target)
      : target;

  if (!tabBar) return null;


  /*
   * Buang instance lama.
   */
  const old =
    tabBar.querySelector(
      ":scope > .tab-module-search"
    );

  if (old) {
    old.remove();
  }


  const placeholder =
    options.placeholder ||
    "Select Module";


  const wrapper =
    document.createElement("div");

  wrapper.className =
    "tab-module-search";

  wrapper.innerHTML = `
    <div class="tab-search-control">

      <button
        type="button"
        class="tab-search-toggle"
        title="Search Module"
        aria-label="Search Module">
        ${ICON_SEARCH}
      </button>

      <input
        type="text"
        class="tab-search-input"
        placeholder="${placeholder}"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        inputmode="search"
      >

<button
  type="button"
  class="tab-search-action"
  title="Search"
  aria-label="Search Module">
  ${ICON_SEARCH}
</button>

    </div>

    <div class="tab-search-list"></div>
  `;


  /*
   * Search sentiasa paling kiri.
   */
  tabBar.prepend(wrapper);


  const toggle =
    wrapper.querySelector(
      ".tab-search-toggle"
    );

  const input =
    wrapper.querySelector(
      ".tab-search-input"
    );

  const action =
    wrapper.querySelector(
      ".tab-search-action"
    );

  const list =
    wrapper.querySelector(
      ".tab-search-list"
    );
let isDefaultActiveValue = false;
function getActiveModuleName() {

  const currentFile =
    getCurrentFile();

  const page =
    findPageByFile(
      currentFile
    );

  if (!page) {
    return "";
  }

  return String(
    page.name ||
    page.file ||
    ""
  )
    .toLowerCase()
    .replace(
      /\b\w/g,
      char =>
        char.toUpperCase()
    );
}


function updateActionIcon() {

  action.innerHTML =
    ICON_SEARCH;

  action.classList.toggle(
    "has-value",
    input.value.trim().length > 0
  );
}
function positionList() {

  const rect =
    wrapper.getBoundingClientRect();

  list.style.left =
    `${rect.left}px`;

  list.style.top =
    `${rect.bottom + 3}px`;

  list.style.width =
    "188px";
}


  function closeList() {

    wrapper.classList.remove(
      "list-open"
    );

    list.innerHTML = "";
  }


function closeSearch() {

  wrapper.classList.remove(
    "open"
  );

  closeList();
  isDefaultActiveValue = false;
  input.value = "";
  action.innerHTML =
    ICON_SEARCH;
  updateActionIcon();
}


  function renderResults() {

 const keyword =
  isDefaultActiveValue
    ? ""
    : input.value
        .trim()
        .toLowerCase();

    list.innerHTML = "";


const results =
  getVisibleAdminPages().filter(page => {

        if (!keyword) {
          return true;
        }

        return String(
          page.name || ""
        )
          .toLowerCase()
          .includes(keyword);
      });


    results.forEach(page => {

      const item =
        document.createElement(
          "button"
        );

      item.type =
        "button";

      const currentFile =
  getCurrentFile();

const isActive =
  String(page.file || "")
    .trim()
    .toLowerCase() ===
  String(currentFile || "")
    .trim()
    .toLowerCase();

item.className =
  isActive
    ? "tab-search-item active"
    : "tab-search-item";

      item.textContent =
        String(
          page.name ||
          page.file
        )
          .toLowerCase()
          .replace(
            /\b\w/g,
            char =>
              char.toUpperCase()
          );

      item.title =
        item.textContent;


      item.addEventListener(
        "click",
        event => {

          event.preventDefault();
          event.stopPropagation();

          closeSearch();

          addTab(page);
        }
      );


      list.appendChild(item);
    });


    positionList();


    wrapper.classList.toggle(
      "list-open",
      results.length > 0
    );
  }


  /*
   * Search button:
   * 32px -> expand.
   */
toggle.addEventListener(
  "click",
  event => {

    event.preventDefault();
    event.stopPropagation();

    wrapper.classList.add(
      "open"
    );

    /*
     * Paparkan nama module active,
     * tetapi BELUM dianggap keyword.
     */
    input.value =
      getActiveModuleName();

    isDefaultActiveValue = true;

    action.innerHTML =
      ICON_SEARCH;

    updateActionIcon();

    requestAnimationFrame(() => {

      input.focus();

      input.setSelectionRange(
        0,
        0
      );

      renderResults();
    });
  }
);

input.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    if (isDefaultActiveValue) {

      requestAnimationFrame(() => {

        input.setSelectionRange(
          0,
          0
        );
      });
    }

    renderResults();
  }
);


  input.addEventListener(
    "focus",
    () => {

      renderResults();
    }
  );

input.addEventListener(
  "beforeinput",
  event => {

    if (!isDefaultActiveValue) {
      return;
    }


    if (
      event.inputType ===
        "insertText" ||
      event.inputType ===
        "insertCompositionText"
    ) {

      isDefaultActiveValue = false;
      input.value = "";
    }

    if (
      event.inputType ===
        "deleteContentBackward" ||
      event.inputType ===
        "deleteContentForward"
    ) {

      isDefaultActiveValue = false;

      input.value = "";
    }
  }
);
input.addEventListener(
  "input",
  () => {

    isDefaultActiveValue = false;

    updateActionIcon();

    renderResults();
  }
);

action.addEventListener(
  "mouseenter",
  () => {

    if (
      input.value.trim()
    ) {

      action.innerHTML =
        ICON_CLEAR;
    }
  }
);


action.addEventListener(
  "mouseleave",
  () => {

    action.innerHTML =
      ICON_SEARCH;
  }
);

action.addEventListener(
  "click",
  event => {

    event.preventDefault();
    event.stopPropagation();

    if (
      input.value.trim()
    ) {

      input.value = "";
isDefaultActiveValue = false;
      action.innerHTML =
        ICON_SEARCH;

      updateActionIcon();

      input.focus();

      renderResults();
    }
  }
);


  input.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {

        event.preventDefault();

        closeSearch();
      }
    }
  );

document.addEventListener(
  "click",
  event => {

    if (
      !wrapper.contains(
        event.target
      )
    ) {

      closeSearch();
    }
  }
);


  window.addEventListener(
    "resize",
    () => {

      if (
        wrapper.classList.contains(
          "list-open"
        )
      ) {

        positionList();
      }
    }
  );


  return {

    element:
      wrapper,

    open() {

      wrapper.classList.add(
        "open"
      );

      requestAnimationFrame(() => {

        input.focus();

        renderResults();
      });
    },

    close:
      closeSearch,

    refresh:
      renderResults
  };
}
function initTabBarSearch() {

  return createSharedTabSearch(
    "#tabBar",
    {
      placeholder:
        "Select Module"
    }
  );
}

  /* ==========================================================
     RENDER TABS - SHARED WORKSPACE
     ========================================================== */


function initWorkspaceTabDrag(tabList) {
  if (!tabList) return;

  let drag = null;
  let suppressClickUntil = 0;

  tabList.addEventListener("click", event => {
    if (performance.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  tabList.addEventListener("pointerdown", event => {
    if (event.button !== 0 || drag) return;

    const tab = event.target.closest(".admin-workspace-tab");
    if (!tab || !tabList.contains(tab)) return;

    // Jangan drag melalui butang Refresh atau Close.
    if (event.target.closest("button")) return;

    const elements = [
      ...tabList.querySelectorAll(".admin-workspace-tab")
    ];

    if (elements.length < 2) return;

    const originIndex = elements.indexOf(tab);
    const rects = elements.map(el => el.getBoundingClientRect());

    drag = {
      tab,
      elements,
      rects,
      originIndex,
      targetIndex: originIndex,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      started: false,
      preview: null
    };

    window.addEventListener("pointermove", onMove, {
      passive: false
    });
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  });

  function onMove(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (!drag.started) {
      if (Math.hypot(dx, dy) < 6) return;

      drag.started = true;

      const rect = drag.rects[drag.originIndex];
      const preview = drag.tab.cloneNode(true);

      preview.classList.remove("dragging");
      preview.classList.add("workspace-drag-preview");
      preview.removeAttribute("id");

      Object.assign(preview.style, {
        position: "fixed",
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: "0",
        transform: "none",
        transition: "none",
        pointerEvents: "none",
        zIndex: "2147483647"
      });

      document.body.appendChild(preview);

      drag.preview = preview;
      drag.tab.classList.add("workspace-drag-source");
      tabList.classList.add("is-dragging");
    }

    event.preventDefault();

    const state = drag;
    const originRect = state.rects[state.originIndex];

    // Floating tab boleh bergerak ke semua arah.
    state.preview.style.transform =
      `translate3d(${dx}px, ${dy}px, 0)`;

    const listRect = tabList.getBoundingClientRect();

    // Kira susunan hanya apabila pointer berada
    // berhampiran tabbar.
    const nearTabbar =
      event.clientY >= listRect.top - 20 &&
      event.clientY <= listRect.bottom + 20;

    if (!nearTabbar) {
      state.targetIndex = state.originIndex;

      state.elements.forEach(element => {
        if (element !== state.tab) {
          element.style.transform = "";
        }
      });

      return;
    }

    const draggedCenter =
      originRect.left + originRect.width / 2 + dx;

    let targetIndex = 0;

    state.rects.forEach((rect, index) => {
      if (index === state.originIndex) return;

      const midpoint = rect.left + rect.width / 2;

      if (draggedCenter > midpoint) {
        targetIndex++;
      }
    });

    state.targetIndex = targetIndex;

    state.elements.forEach((element, index) => {
      if (element === state.tab) return;

      let shift = 0;

      if (
        targetIndex > state.originIndex &&
        index > state.originIndex &&
        index <= targetIndex
      ) {
        shift = -originRect.width;
      }

      if (
        targetIndex < state.originIndex &&
        index >= targetIndex &&
        index < state.originIndex
      ) {
        shift = originRect.width;
      }

      element.style.transform =
        `translate3d(${shift}px, 0, 0)`;
    });
  }

  function onEnd(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;

    const state = drag;
    drag = null;

    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onEnd);
    window.removeEventListener("pointercancel", onEnd);

    if (!state.started) return;

    suppressClickUntil = performance.now() + 350;

    state.preview?.remove();

    state.tab.classList.remove("workspace-drag-source");
    tabList.classList.remove("is-dragging");

    state.elements.forEach(element => {
      element.style.transform = "";
      element.style.zIndex = "";
      element.classList.remove("dragging");
    });

    const { originIndex, targetIndex } = state;

    const listRect = tabList.getBoundingClientRect();

    const droppedOnTabbar =
      event.clientY >= listRect.top - 20 &&
      event.clientY <= listRect.bottom + 20;

    // Lepas di luar tabbar: kembali ke asal.
    if (
      event.type === "pointercancel" ||
      !droppedOnTabbar ||
      originIndex === targetIndex
    ) return;

    const tabs = getTabs();

    if (tabs.length !== state.elements.length) return;

    const [moved] = tabs.splice(originIndex, 1);
    if (!moved) return;

    tabs.splice(targetIndex, 0, moved);

    saveTabs(tabs);
    renderTabs();
    renderSidebarTabs();
  }

  tabList.addEventListener("dragstart", event => {
    event.preventDefault();
  });
}
function saveVerifiedWorkspacePreview(tabs) {
  try {
    const user = typeof auth !== "undefined"
      ? auth.currentUser
      : null;

    if (!user || !currentAdminProfile) return;

    const marker = sessionStorage.getItem("5g88.adminSession");

    if (marker !== user.uid) return;

    const cacheKey =
      "5g88.workspacePreview." + user.uid;

    const safeTabs = tabs.map(tab => ({
      file: String(tab.file || ""),
      name: String(tab.name || tab.file || "")
    }));

    sessionStorage.setItem(
      cacheKey,
      JSON.stringify(safeTabs)
    );
    // Cache halaman yang sudah dibenarkan oleh Firebase.
    // Untuk mempercepat paparan tab sahaja.
    const verifiedPages = ADMIN_PAGES
      .filter(page =>
        canShowAdminPage(page.file) &&
        canViewAdminPage(page.file)
      )
      .map(page => page.file);

    sessionStorage.setItem(
      "5g88.verifiedPages." + user.uid,
      JSON.stringify(verifiedPages)
    );
  } catch (error) {
    console.warn("[5G88] Save workspace preview:", error);
  }
}
function renderTabs() {

const tabBar = document.getElementById("tabBar");
if (!tabBar) return;

const verifiedProfileReady = !!currentAdminProfile;
let tabs = [];

if (verifiedProfileReady) {
  // Selepas Firebase siap, guna permission sebenar.
  tabs = getTabs().filter(tab =>
    canShowAdminPage(tab.file)
  );

  saveVerifiedWorkspacePreview(tabs);

} else {
  // Sebelum Firebase siap, pulihkan tab daripada
  // cache yang disimpan selepas pengesahan terdahulu.
  try {
    const uid = sessionStorage.getItem(
      "5g88.adminSession"
    );

    const expiryRaw = localStorage.getItem(
      "autoLogout.expireAt"
    );

    const expireAt = Number(expiryRaw);

    if (
      uid &&
      expiryRaw &&
      Number.isFinite(expireAt) &&
      expireAt > Date.now()
    ) {
      const cacheKey =
        "5g88.workspacePreview." + uid;

      const cached = JSON.parse(
        sessionStorage.getItem(cacheKey) || "[]"
      );

      if (Array.isArray(cached)) {
        tabs = cached
          .filter(tab =>
            tab &&
            typeof tab.file === "string" &&
            ADMIN_PAGES.some(page =>
              page.file === tab.file.toLowerCase()
            )
          )
          .slice(0, 20)
          .map(tab => {
            const page = findPageByFile(
              tab.file.toLowerCase()
            );

            return {
              file: page.file,
              name: page.name,
              group: page.group
            };
          });
      }
    }
  } catch (error) {
    console.warn(
      "[5G88] Workspace restore failed:",
      error
    );
  }
}
// FAST RESTORE ACTIVE TAB
// Pulihkan tab halaman aktif daripada cache akses terdahulu.
// Tab belum boleh diklik sehingga Firebase selesai disahkan.
if (!verifiedProfileReady) {
  try {
    const uid = sessionStorage.getItem(
      "5g88.adminSession"
    );

    const expiryRaw = localStorage.getItem(
      "autoLogout.expireAt"
    );

    const expireAt = Number(expiryRaw);

    const sessionValid =
      !!uid &&
      !!expiryRaw &&
      Number.isFinite(expireAt) &&
      expireAt > Date.now();

    if (sessionValid) {
      const activeFile = getCurrentFile();

      const allowedPages = JSON.parse(
        sessionStorage.getItem(
          "5g88.verifiedPages." + uid
        ) || "[]"
      );

      const alreadyExists = tabs.some(tab =>
        tab.file.toLowerCase() === activeFile
      );

      if (
        Array.isArray(allowedPages) &&
        allowedPages.includes(activeFile) &&
        !alreadyExists
      ) {
        const page = findPageByFile(activeFile);

        if (page) {
          tabs.push({ ...page });
        }
      }
    }
  } catch (error) {
    console.warn(
      "[5G88] Fast tab restore failed:",
      error
    );
  }
}
    const currentFile = getCurrentFile();

    // Bahagian tengah yang boleh scroll.
    const tabList = document.createElement("div");
    tabList.className = "admin-workspace-tabs-list";

    // Butang More sentiasa berada di kanan.
    const moreWrap = document.createElement("div");
    moreWrap.className = "admin-workspace-more";

    const moreButton = document.createElement("button");
    moreButton.type = "button";
    moreButton.className = "admin-workspace-more-button";
    moreButton.title = "More Tabs";
    moreButton.setAttribute("aria-label", "More Tabs");
    moreButton.innerHTML = ADMIN_TAB_MORE_ICON;

    const moreDropdown = document.createElement("div");
    moreDropdown.className = "admin-workspace-more-dropdown";

    moreWrap.append(moreButton, moreDropdown);



function refreshTab(tab) {
  if (!verifiedProfileReady) return;
  if (!tab?.file) return;

  const targetFile = String(tab.file)
    .split(/[?#]/)[0]
    .split("/")
    .pop()
    .toLowerCase();

  if (!canViewAdminPage(targetFile)) return;

  const uid = getCurrentUserStorageSuffix();
  if (!uid) return;

  const stateKey =
    `5g88.pageState.v1:${uid}:${targetFile}`;

  const resetKey =
    `5g88.pageReset.v1:${uid}:${targetFile}`;

  // Tandakan reset untuk halaman sasaran.
  sessionStorage.setItem(resetKey, "1");

  // Padam state filter halaman sahaja.
  localStorage.removeItem(stateKey);

  if (getCurrentFile() === targetFile) {
    // Kekalkan loading overlay sedia ada.
    sessionStorage.setItem(
      "5g88.showRefreshLoading",
      "1"
    );

    // Navigasi ke URL baru supaya dokumen HTML
    // tidak diambil daripada cache URL sebelumnya.
    const url = new URL(
      `./${targetFile}`,
      window.location.href
    );

    url.searchParams.set(
      "_tabrefresh",
      String(Date.now())
    );

    window.location.replace(url.href);
  } else {
    navigateToTab(tab);
  }
}


    function createTabActions(tab) {
      const actions = document.createElement("span");
      actions.className = "admin-workspace-tab-actions";

      const refresh = document.createElement("button");
      refresh.type = "button";
      refresh.className = "admin-workspace-tab-refresh";
      refresh.title = "Refresh";
      refresh.setAttribute("aria-label", "Refresh tab");
      refresh.innerHTML = ADMIN_TAB_REFRESH_ICON;

      refresh.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        refreshTab(tab);
      });

      const close = document.createElement("button");
      close.type = "button";
      close.className = "close-tab admin-workspace-tab-close";
      close.title = "Close";
      close.setAttribute("aria-label", "Close tab");
      close.innerHTML = ICON_CLOSE;

      close.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
         if (!verifiedProfileReady) return;
        closeTab(tab.file);
      });

      actions.append(refresh, close);
      return actions;
    }

    tabs.forEach(tab => {
      const element = document.createElement("div");
      element.className = "tab admin-workspace-tab";
      element.dataset.file = tab.file;

      if (tab.file.toLowerCase() === currentFile) {
        element.classList.add("active-tab");
      }

      const title = document.createElement("span");
      title.className = "admin-workspace-tab-name";
      title.textContent = String(tab.name || tab.file)
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());

      element.append(title, createTabActions(tab));

      element.addEventListener("click", event => {
         if (!verifiedProfileReady) return;
        if (event.target.closest("button")) return;
        navigateToTab(tab);
      });

      tabList.appendChild(element);
    });

    
const oldPreview = tabBar.querySelector(
  ".admin-static-tab-preview"
);

if (oldPreview) {
  // Siapkan tab sebenar dahulu sebelum membuang preview.
  tabBar.replaceChildren(tabList, moreWrap);
} else {
  // Kemas kini tab biasa tanpa menggantikan container.
  const oldList = tabBar.querySelector(
    ".admin-workspace-tabs-list"
  );

  const oldMore = tabBar.querySelector(
    ".admin-workspace-more"
  );

  if (oldList && oldMore) {
    oldList.replaceWith(tabList);
    oldMore.replaceWith(moreWrap);
  } else {
    tabBar.replaceChildren(tabList, moreWrap);
  }
}


    // Search lama tetap digunakan, tetapi kekal di kiri.
    initTabBarSearch();

    const search = tabBar.querySelector(".tab-module-search");
    if (search) {
      search.classList.add("admin-workspace-search-fixed");
    }


    function updateMoreTabs() {
      const items = [
        ...tabList.querySelectorAll(".admin-workspace-tab")
      ];

      // Ukur overflow tanpa mengambil ruang butang More.
      const totalWidth = items.reduce(
        (width, element) => width + element.getBoundingClientRect().width,
        0
      );

      // Lebar yang tersedia jika More tidak dipaparkan.
      const availableWidth =
        tabList.clientWidth +
        (moreWrap.classList.contains("has-hidden-tabs")
          ? moreWrap.getBoundingClientRect().width
          : 0);

      const hasOverflow = totalWidth > availableWidth + 2;

      moreWrap.classList.toggle(
        "has-hidden-tabs",
        hasOverflow
      );

      if (!hasOverflow) {
        moreDropdown.classList.remove("open");
        moreDropdown.replaceChildren();
        return;
      }

      // Selepas More mengambil ruang, ukur tab yang kelihatan.
      const listRect = tabList.getBoundingClientRect();
      const fragment = document.createDocumentFragment();

      items.forEach((element, index) => {
        const rect = element.getBoundingClientRect();

        const isFullyVisible =
          rect.left >= listRect.left - 1 &&
          rect.right <= listRect.right + 1;

        if (isFullyVisible) return;

        const tab = tabs[index];
        if (!tab) return;

        const item = document.createElement("div");
        item.className = "admin-workspace-more-item";

        if (tab.file.toLowerCase() === currentFile) {
          item.classList.add("active");
        }

        const name = document.createElement("button");
        name.type = "button";
        name.className = "admin-workspace-more-name";
        name.textContent = String(tab.name || tab.file)
          .toLowerCase()
          .replace(/\b\w/g, char => char.toUpperCase());

        name.addEventListener("click", event => {
          event.stopPropagation();
          navigateToTab(tab);
        });

        item.append(name, createTabActions(tab));
        fragment.appendChild(item);
      });

      moreDropdown.replaceChildren(fragment);
    }


    moreButton.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      updateMoreTabs();

      if (moreWrap.classList.contains("has-hidden-tabs")) {
        moreDropdown.classList.toggle("open");
      }
    });

    // Buka dropdown apabila mouse hover pada More.
    moreWrap.addEventListener("mouseenter", () => {
      if (moreWrap.classList.contains("has-hidden-tabs")) {
        moreDropdown.classList.add("open");
      }
    });

    // Tutup dropdown apabila mouse keluar.
    moreWrap.addEventListener("mouseleave", () => {
      moreDropdown.classList.remove("open");
    });


    // Scroll horizontal lebih laju dan responsif.
    tabList.addEventListener("wheel", event => {
      if (tabList.scrollWidth <= tabList.clientWidth) return;

      const delta =
        Math.abs(event.deltaY) > Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;

      if (!delta) return;

      event.preventDefault();

      // Normalize mouse wheel (pixel / line / page).
      const normalizedDelta =
        event.deltaMode === 1
          ? delta * 16
          : event.deltaMode === 2
            ? delta * tabList.clientWidth
            : delta;

      tabList.scrollLeft += normalizedDelta * 3.5;
    }, { passive: false });



    // Elak banyak update serentak ketika wheel scroll.
    let moreUpdateFrame = null;

    function scheduleMoreUpdate() {
      if (moreUpdateFrame !== null) return;

      moreUpdateFrame = requestAnimationFrame(() => {
        moreUpdateFrame = null;
        updateMoreTabs();
      });
    }

    tabList.addEventListener("scroll", scheduleMoreUpdate, {
      passive: true
    });


    // Elak listener resize berganda setiap render.
    window.__homepageTabResizeObserver?.disconnect();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        requestAnimationFrame(updateMoreTabs);
      });
      observer.observe(tabList);
      window.__homepageTabResizeObserver = observer;
    }

    // Tutup dropdown apabila klik di luar.
    if (window.__homepageMoreOutsideHandler) {
      document.removeEventListener(
        "click",
        window.__homepageMoreOutsideHandler
      );
    }

    window.__homepageMoreOutsideHandler = event => {
      if (!moreWrap.contains(event.target)) {
        moreDropdown.classList.remove("open");
      }
    };

    document.addEventListener(
      "click",
      window.__homepageMoreOutsideHandler
    );


/* ==========================================
   AUTO SHOW ACTIVE TAB WHEN HIDDEN
   ========================================== */

function revealActiveTab(smooth = true) {
  const activeTab = Array.from(
    tabList.querySelectorAll(".admin-workspace-tab")
  ).find(tab =>
    String(tab.dataset.file || "").toLowerCase() ===
    String(getActiveFile() || currentFile).toLowerCase()
  ) || tabList.querySelector(".admin-workspace-tab.active-tab");

  if (!activeTab) return;

  const listRect = tabList.getBoundingClientRect();
  const activeRect = activeTab.getBoundingClientRect();

  if (!listRect.width || !activeRect.width) return;

  const padding = 12;
  let targetLeft = tabList.scrollLeft;

  // Tab tersembunyi di sebelah kiri
  if (activeRect.left < listRect.left + padding) {
    targetLeft -= listRect.left + padding - activeRect.left;
  }

  // Tab tersembunyi di sebelah kanan
  else if (activeRect.right > listRect.right - padding) {
    targetLeft += activeRect.right - listRect.right + padding;
  }

  if (Math.abs(targetLeft - tabList.scrollLeft) < 1) {
    return;
  }

  tabList.scrollTo({
    left: targetLeft,
    behavior: smooth ? "smooth" : "auto"
  });
}

// Tunggu tab bar selesai dirender
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    revealActiveTab(true);
    updateMoreTabs();
  });
});

// Kekalkan fungsi drag tab asal
initWorkspaceTabDrag(tabList);

// Kekalkan indicator asal
updateOpenIndicators();


  }



  /* ==========================================================
     DROPDOWN EVENTS
     ========================================================== */

  function closeHeaderDropdowns(
    except = null
  ) {

    document
      .querySelectorAll(
        ".dropdown-links.open"
      )
      .forEach(dropdown => {

        if (
          dropdown !== except
        ) {

          dropdown.classList.remove(
            "open"
          );
        }

      });
  }



function setupDropdown(buttonId, dropdownId) {
  const button = document.getElementById(buttonId);
  const dropdown = document.getElementById(dropdownId);
  if (!button || !dropdown) return;

  const wrapper = button.closest(".dropdown-wrapper");
  let closeTimer;

  const insideMore = () =>
    !!wrapper?.closest("#headerMoreMenu");

  function positionDropdown() {
    const rect = button.getBoundingClientRect();

    if (insideMore()) {
      const menu = document.getElementById("headerMoreMenu");
      const menuRect = menu.getBoundingClientRect();

      const width = dropdown.offsetWidth || 180;
      const height = dropdown.offsetHeight || 160;
      const gap = 2;

      const rightSpace = innerWidth - menuRect.right;
      const leftSpace = menuRect.left;

      let left = rightSpace >= width + gap ||
                 rightSpace >= leftSpace
        ? menuRect.right + gap
        : menuRect.left - width - gap;

      left = Math.max(
        8,
        Math.min(left, innerWidth - width - 8)
      );

      const top = Math.max(
        8,
        Math.min(rect.top, innerHeight - height - 8)
      );

      dropdown.style.left = `${left}px`;
      dropdown.style.top = `${top}px`;
} else {
  const dropdownWidth = dropdown.offsetWidth || 180;

  const left = Math.max(
    8,
    Math.min(
      rect.left,
      window.innerWidth - dropdownWidth - 8
    )
  );

  dropdown.style.left = `${left}px`;
  dropdown.style.top = `${rect.bottom}px`;
}
  }

  function openDropdown() {
    clearTimeout(closeTimer);
    closeHeaderDropdowns(dropdown);
    dropdown.classList.add("open");
    positionDropdown();
  }

  button.addEventListener("mouseenter", () => {
    if (insideMore()) openDropdown();
  });

  button.addEventListener("click", event => {
    event.stopPropagation();

    const wasOpen = dropdown.classList.contains("open");
    closeHeaderDropdowns();

    if (!wasOpen) openDropdown();
  });

  function scheduleClose() {
    clearTimeout(closeTimer);

    closeTimer = setTimeout(() => {
      if (!wrapper?.matches(":hover") &&
          !dropdown.matches(":hover")) {
        dropdown.classList.remove("open");
      }
    }, 250);
  }

  wrapper?.addEventListener("mouseleave", () => {
    if (insideMore()) scheduleClose();
  });

  dropdown.addEventListener("mouseenter", () => {
    clearTimeout(closeTimer);
  });

  dropdown.addEventListener("mouseleave", () => {
    if (insideMore()) scheduleClose();
  });
}


  /* ==========================================================
     SIDEBAR SEARCH
     ========================================================== */


function filterSidebarGroups(value) {
  const keyword = String(value || "").trim().toLowerCase();

  document.querySelectorAll("#customSidebarTabs .sidebar-group")
    .forEach(group => {
      const links = [...group.querySelectorAll(".sidebar-group-inner a")];

      const groupTitle = group
        .querySelector(".sidebar-group-title")
        ?.textContent.toLowerCase() || "";

      const groupMatches = groupTitle.includes(keyword);
      let matchCount = 0;

      links.forEach(link => {
        const name = link.textContent.trim().toLowerCase();
        const matches = !keyword || groupMatches || name.includes(keyword);

        link.hidden = !matches;
        if (matches) matchCount++;
      });

      group.hidden = !!keyword && matchCount === 0;

      if (keyword) {
        group.classList.toggle("is-open", matchCount > 0);
      } else {
        const active = links.some(link =>
          link.dataset.file?.toLowerCase() === getCurrentFile()
        );

        group.classList.toggle("is-open", active);
      }

      const toggle = group.querySelector(".sidebar-group-toggle");
      toggle?.setAttribute(
        "aria-expanded",
        String(group.classList.contains("is-open"))
      );
    });
   
  /* Search untuk standalone items */
  document.querySelectorAll(
    "#customSidebarTabs .sidebar-standalone-link"
  ).forEach(link => {
    link.hidden = !!keyword &&
      !link.textContent.toLowerCase().includes(keyword);
  });

}

function setupSidebarSearch() {
  const input = document.getElementById("sidebarSearchInput");
  const form = document.getElementById("sidebarSearchForm");

  if (!input) return;

  form?.addEventListener("submit", event => {
    event.preventDefault();
  });

  input.addEventListener("input", () => {
    filterSidebarGroups(input.value);
  });

  filterSidebarGroups(input.value);
}

/* ==========================================================
   RESPONSIVE HEADER MORE
   ========================================================== */

function setupHeaderMore() {
  const header = document.querySelector(".header");
  const links = document.querySelector(".header-links");
  const more = document.getElementById("headerMore");
  const btn = document.getElementById("headerMoreBtn");
  const menu = document.getElementById("headerMoreMenu");

  if (!header || !links || !more || !btn || !menu) return;

  const items = Array.from(links.children).filter(el =>
    el.matches(".live-chat-button, .dropdown-wrapper")
  );

  // Simpan posisi asal setiap button
  const positions = items.map(item => {
    const marker = document.createComment("header-more-position");
    item.before(marker);
    return { item, marker };
  });

function closeMore() {
  menu.hidden = true;
  btn.setAttribute("aria-expanded", "false");
  menu.querySelectorAll(".dropdown-links.open")
    .forEach(dropdown => {
      dropdown.classList.remove("open");
    });
}

  function positionMore() {
    const rect = btn.getBoundingClientRect();
    const width = menu.getBoundingClientRect().width || 180;

    const left = Math.max(
      8,
      Math.min(rect.right - width, window.innerWidth - width - 8)
    );

    menu.style.left = `${left}px`;
    menu.style.top = `${rect.bottom + 6}px`;
  }

  function openMore() {
    if (more.hidden || !menu.children.length) return;

    menu.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    positionMore();
  }

  function updateOverflow() {
    closeMore();

    // Pulangkan button ke kedudukan asal
    positions.forEach(({ item, marker }) => {
      marker.after(item);
    });

    more.hidden = true;

    const gap = parseFloat(getComputedStyle(links).columnGap) || 0;
    const available = links.clientWidth;

    const search = document.getElementById("headerTabSearch");
    const searchWidth = search?.getBoundingClientRect().width || 0;

    const visibleItems = positions.filter(
      ({ item }) => getComputedStyle(item).display !== "none"
    );

    function itemWidth(item) {
      const style = getComputedStyle(item);
      return item.getBoundingClientRect().width +
        (parseFloat(style.marginLeft) || 0) +
        (parseFloat(style.marginRight) || 0);
    }

    const totalWidth =
      searchWidth +
      visibleItems.reduce((sum, entry) =>
        sum + itemWidth(entry.item), 0
      ) +
      gap * visibleItems.length;

    if (totalWidth <= available + 1) return;

    more.hidden = false;

    const moreWidth = more.getBoundingClientRect().width;
    let usedWidth = totalWidth + moreWidth + gap;

    // Pindah item paling kanan dahulu
    for (let i = visibleItems.length - 1; i >= 0; i--) {
      if (usedWidth <= available + 1) break;

      const item = visibleItems[i].item;
      const width = itemWidth(item);

      menu.prepend(item);
      usedWidth -= width + gap;
    }

    more.hidden = menu.children.length === 0;
  }

  btn.addEventListener("click", event => {
    event.stopPropagation();

    if (menu.hidden) {
      openMore();
    } else {
      closeMore();
    }
  });

  // Desktop: hover More untuk buka
  more.addEventListener("mouseenter", openMore);
   
let moreCloseTimer;

function pointerOnSubmenu() {
  return Array.from(
    menu.querySelectorAll(".dropdown-links.open")
  ).some(dropdown => dropdown.matches(":hover"));
}

more.addEventListener("mouseenter", () => {
  clearTimeout(moreCloseTimer);
});

more.addEventListener("mouseleave", () => {
  clearTimeout(moreCloseTimer);

  moreCloseTimer = setTimeout(() => {
    const hoveringMore = more.matches(":hover");
    const hoveringMenu = menu.matches(":hover");
    const hoveringSubmenu = pointerOnSubmenu();

    if (
      !hoveringMore &&
      !hoveringMenu &&
      !hoveringSubmenu
    ) {
      closeMore();
    }
  }, 300);
});

menu.querySelectorAll(".dropdown-links").forEach(dropdown => {
  dropdown.addEventListener("mouseenter", () => {
    clearTimeout(moreCloseTimer);
  });

  dropdown.addEventListener("mouseleave", () => {
    moreCloseTimer = setTimeout(() => {
      if (!more.matches(":hover") && !pointerOnSubmenu()) {
        closeMore();
      }
    }, 300);
  });
});


document.addEventListener("pointerdown", event => {
  if (menu.hidden) return;

  const clickedSubmenu = event.target.closest(
    "#headerMoreMenu .dropdown-links"
  );

  if (
    !more.contains(event.target) &&
    !clickedSubmenu
  ) {
    closeMore();
  }

});

  // Escape untuk tutup
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMore();
  });
/* =====================================================
   FIX: HEADER MORE SUBMENU CLICK
   ===================================================== */

menu.addEventListener("click", event => {
  const link = event.target.closest(
    ".dropdown-links a[data-file]"
  );

  if (!link || !menu.contains(link)) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const file = link.dataset.file;
  const page = findPageByFile(file);

  if (!page) {
    console.warn("[Header More] Page not found:", file);
    return;
  }

  clearTimeout(moreCloseTimer);

  addTab(page);

}, true);
  // Klik button direct: tutup More
  // Dropdown bertingkat kekal boleh dibuka
  menu.addEventListener("click", event => {
    const button = event.target.closest(".live-chat-button");
    if (!button) return;

    if (!button.closest(".dropdown-wrapper")) {
      closeMore();
    }
  });

  let scheduled = false;

  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      updateOverflow();
    });
  }

  const observer = new ResizeObserver(scheduleUpdate);
  observer.observe(header);
  observer.observe(links);

  window.addEventListener("resize", scheduleUpdate);

  scheduleUpdate();
}
  /* ==========================================================
     HEADER TAB SEARCH
     ========================================================== */


function setupHeaderSearch() {
  const wrap = document.getElementById("headerTabSearch");
  const input = document.getElementById("headerTabSearchInput");
  const list = document.getElementById("headerTabSearchList");
  const form = document.getElementById("headerTabSearchForm");
  const arrow = document.getElementById("headerTabSearchArrow");
  const mobileBtn = document.getElementById("headerTabSearchMobileBtn");
  const panel = document.getElementById("headerTabSearchMobilePanel");
  const mobileInput = document.getElementById("headerTabSearchMobileInput");

  if (!wrap || !input || !list || !panel || !mobileInput) return;

  const BACKEND = "https://fiveg88-admin-backend-v2.onrender.com";
  const STORAGE_KEY = "adminSelectedSites";
  const isMobile = () => window.matchMedia("(max-width:815px)").matches;

  let availableSites = [];
  let selectedIds = [];
  let loading = false;
  let ready = false;

/* MOBILE SITE CHIPS - INPUT ASAL DIKEKALKAN */
const mobileInputWrap = mobileInput.parentElement;

const mobileChips = document.createElement("div");
mobileChips.id = "mobileSiteSelectedChips";
mobileInputWrap.appendChild(mobileChips);

let mobileHiddenSitesOpen = false;

function updateMobileChips() {
  const sites = selectedIds
    .map(id => availableSites.find(s => s.id === id))
    .filter(Boolean);

  mobileChips.replaceChildren();

  const searching =
    document.activeElement === mobileInput &&
    mobileInput.value.trim().length > 0;

  mobileInputWrap.classList.toggle(
    "mobile-site-has-chips",
    sites.length > 0 && !searching
  );

  // Aktifkan SVG clear apabila ada chips atau teks search.
  mobileInputWrap.classList.toggle(
    "has-value",
    sites.length > 0 || mobileInput.value.trim().length > 0
  );

  if (!sites.length || searching) {
    mobileChips.hidden = true;
    return;
  }

  mobileChips.hidden = false;

  const maxWidth = Math.max(
    60,
    mobileInputWrap.clientWidth - 48
  );

  let usedWidth = 0;
  let visibleCount = 0;

  // Simpan ruang untuk +N apabila perlu.
  const reserve = sites.length > 1 ? 45 : 0;

  for (const site of sites) {
    const chip = document.createElement("span");
    chip.className = "mobile-site-chip";

    const name = document.createElement("span");
    name.textContent = site.name;


const remove = document.createElement("button");
remove.type = "button";
remove.className = "mobile-site-chip-remove";
remove.innerHTML = ICON_CLOSE;
remove.setAttribute("aria-label", `Remove ${site.name}`);
remove.title = `Remove ${site.name}`;


    remove.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();

      selectedIds = selectedIds.filter(id => id !== site.id);
      saveSelection();
      updateInput();
      if (!panel.hidden) renderOptions(mobileInput.value);
    });

    chip.append(name, remove);
    mobileChips.appendChild(chip);

    const chipWidth = chip.getBoundingClientRect().width + 4;

    if (usedWidth + chipWidth + reserve > maxWidth) {
      chip.remove();
      break;
    }

    usedWidth += chipWidth;
    visibleCount++;
  }

  // Jika site pertama panjang, ringkaskan dengan +N.
  const hiddenCount = sites.length - visibleCount;

  if (hiddenCount > 0) {
    const more = document.createElement("button");
    more.type = "button";
    more.className = "mobile-site-more";
    more.textContent = `+${hiddenCount}`;
    more.title = sites
      .slice(visibleCount)
      .map(s => s.name)
      .join("\n");

    more.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();

      mobileHiddenSitesOpen = !mobileHiddenSitesOpen;

      const oldPopup =
        mobileInputWrap.querySelector(".mobile-site-more-popup");

      oldPopup?.remove();

      if (!mobileHiddenSitesOpen) return;

      const popup = document.createElement("div");
      popup.className = "mobile-site-more-popup";

      sites.slice(visibleCount).forEach(site => {
        const item = document.createElement("button");
        item.type = "button";
        item.textContent = `${site.name.toUpperCase()} ×`;

        item.addEventListener("click", event => {
          event.stopPropagation();
          selectedIds = selectedIds.filter(id => id !== site.id);
          mobileHiddenSitesOpen = false;
          saveSelection();
          updateInput();
          if (!panel.hidden) renderOptions(mobileInput.value);
        });

        popup.appendChild(item);
      });

      mobileInputWrap.appendChild(popup);
    });

    mobileChips.appendChild(more);
  }

  mobileInputWrap.querySelector(
    ".mobile-site-more-popup"
  )?.remove();

  mobileHiddenSitesOpen = false;
}

const customSiteEl = document.getElementById("headerSiteCustom");
let customSiteDropdown = null;

if (customSiteEl && window.NewUI?.chips) {
  customSiteDropdown = NewUI.chips(customSiteEl, {
    placeholder: "🏢 🔍 Search",
    options: [],
    value: [],
    onChange(values) {
      if (!ready) return;

      selectedIds = values.filter(id =>
        availableSites.some(site => site.id === id)
      );

      saveSelection();
      updateInput();
    }
  });
}

  form?.addEventListener("submit", e => e.preventDefault());

  // Tukar label sahaja, bukan struktur input.
input.placeholder = "🏢 🔍 Search";
mobileInput.placeholder = "🏢 🔍 Search";
mobileBtn?.setAttribute("aria-label", "Select Site");
mobileBtn?.setAttribute("title", "Select Site");

  function normalizeSites(data) {
    const raw = Array.isArray(data)
      ? data
      : data.sites || data.items || [];

    const arr = Array.isArray(raw)
      ? raw
      : Object.entries(raw).map(([id, site]) => ({ id, ...site }));

    return arr
      .filter(s => s && s.id && s.active !== false)
      .map(s => ({
        id: String(s.id),
        name: String(s.name || s.id)
      }));
  }

  function saveSelection() {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(selectedIds)
    );

    window.dispatchEvent(new CustomEvent("admin-sites-changed", {
      detail: { siteIds: [...selectedIds] }
    }));
  }

function updateInput() {
  const selected = selectedIds
    .map(id => availableSites.find(site => site.id === id))
    .filter(Boolean);

  // Sync pilihan ke custom NewUI.
  customSiteDropdown?.setValue(selectedIds, false);

  // Kekalkan status pilihan untuk fungsi asal.
  wrap.classList.toggle(
    "has-selected",
    selected.length > 0
  );

  // Input lama digunakan untuk mobile / fallback.
  input.value = selected.length
    ? selected[0].name
    : "";

  input.placeholder = selected.length
    ? ""
    : "🏢 🔍 Search";

  input.title = selected
    .map(site => site.name)
    .join(", ");

mobileInput.placeholder = "🏢 🔍 Search";
updateMobileChips();
}




function closeDropdown() {
  list.style.display = "none";
  wrap.classList.remove("search-mode", "site-is-searching");
  input.blur();
  updateInput();
}

  function closePanel() {
    closeDropdown();
    panel.hidden = true;
    mobileBtn?.setAttribute("aria-expanded", "false");
    mobileBtn?.classList.remove("is-open");
  }

  function positionDropdown() {
    const anchor = isMobile() ? mobileInput : input;
    const rect = anchor.getBoundingClientRect();
    const width = isMobile()
      ? Math.min(320, window.innerWidth - 16)
      : Math.max(180, rect.width);

    list.style.position = "fixed";
    list.style.width = `${width}px`;
    list.style.left = `${Math.max(
      8,
      Math.min(rect.left, window.innerWidth - width - 8)
    )}px`;
    list.style.top = `${rect.bottom + 5}px`;
    list.style.maxHeight = "260px";
    list.style.overflowY = "auto";
    list.style.zIndex = "999999";
  }

  function renderOptions(keyword = "") {
   
/* MOBILE: CUSTOM OPTIONS, BUKAN CHECKBOX LAMA */
if (isMobile()) {
  list.replaceChildren();

  const search = String(keyword).trim().toLowerCase();

  const filtered = availableSites.filter(site =>
    site.name.toLowerCase().includes(search) ||
    site.id.toLowerCase().includes(search)
  );

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "shared-dropdown-empty";
    empty.textContent = loading
      ? "Loading sites..."
      : "No available sites";
    list.appendChild(empty);
  }

  filtered.forEach(site => {
    const active = selectedIds.includes(site.id);

    const option = document.createElement("button");
    option.type = "button";
    option.className =
      "shared-chip-dropdown-option" +
      (active ? " active" : "");

    option.setAttribute("aria-selected", String(active));

    const name = document.createElement("span");
    name.textContent = site.name;

    const check = document.createElement("span");
    check.className = "shared-chip-dropdown-option-check";
    check.textContent = "✓";

    option.append(name, check);

    option.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();

      if (selectedIds.includes(site.id)) {
        selectedIds = selectedIds.filter(id => id !== site.id);
      } else {
        selectedIds.push(site.id);
      }

      saveSelection();
      updateInput();
      renderOptions(mobileInput.value);
    });

    list.appendChild(option);
  });

  positionDropdown();
  list.style.display = "block";
  wrap.classList.add("search-mode");
  return;
}

    list.replaceChildren();

    const filtered = availableSites.filter(site =>
      site.name.toLowerCase().includes(keyword.toLowerCase()) ||
      site.id.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.textContent = loading
        ? "Loading sites..."
        : "No available sites";
      empty.style.padding = "12px";
      list.appendChild(empty);
    }

    filtered.forEach(site => {
      const option = document.createElement("label");
      option.style.cssText = [
        "display:flex",
        "align-items:center",
        "gap:8px",
        "padding:9px 12px",
        "cursor:pointer"
      ].join(";");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = selectedIds.includes(site.id);
      checkbox.style.width = "14px";
      checkbox.style.height = "14px";

      const name = document.createElement("span");
      name.textContent = site.name;

      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          if (!selectedIds.includes(site.id)) {
            selectedIds.push(site.id);
          }
        } else {
          selectedIds = selectedIds.filter(id => id !== site.id);
        }

saveSelection();
updateInput();
renderOptions("");
      });

      option.append(checkbox, name);
      list.appendChild(option);
    });

    positionDropdown();
    list.style.display = "block";
    wrap.classList.add("search-mode");
  }

  async function loadSites() {
    if (loading) return;
    loading = true;

    try {
      if (typeof auth === "undefined") {
        throw Error("Firebase Auth is not ready.");
      }

      const user = await new Promise(resolve => {
        const unsubscribe = auth.onAuthStateChanged(u => {
          unsubscribe();
          resolve(u);
        });
      });

      if (!user) {
        throw Error("Please login again.");
      }

      const token = await user.getIdToken();

      // Endpoint ini mesti mengembalikan hanya site
      // yang dibenarkan untuk akaun semasa.
      const response = await fetch(BACKEND + "/api/sites", {
        headers: {
          Authorization: "Bearer " + token
        }
      });

      const data = await response.json();

      if (!response.ok || data.ok === false) {
        throw Error(data.message || data.error || "Cannot load sites.");
      }

      availableSites = normalizeSites(data);
       
customSiteDropdown?.setOptions(
  availableSites.map(site => ({
    value: site.id,
    label: site.name
  }))
);


      let stored = [];
      try {
        stored = JSON.parse(
          sessionStorage.getItem(STORAGE_KEY) || "[]"
        );
      } catch (_) {}

      selectedIds = Array.isArray(stored)
        ? stored.filter(id => availableSites.some(s => s.id === id))
        : [];

      ready = true;
      saveSelection();
      updateInput();
    } catch (error) {
      console.error("[Select Site]", error);
      availableSites = [];
      selectedIds = [];
      ready = false;
      updateInput();
    } finally {
      loading = false;
    }
  }

  // Desktop: klik input asal untuk buka dropdown.

input.addEventListener("focus", () => {
  wrap.classList.add("site-is-searching");
  input.placeholder = "Search sites...";
});

input.addEventListener("click", () => {
  input.value = "";

  if (!ready) {
    loadSites().then(() => renderOptions(""));
  } else {
    renderOptions("");
  }
});

input.addEventListener("blur", () => {
  setTimeout(() => {
    if (document.activeElement === input) return;

    wrap.classList.remove("site-is-searching");
    updateInput();
  }, 150);
});


input.addEventListener("input", () => {
  renderOptions(input.value);
});


  arrow?.addEventListener("click", e => {
    e.stopPropagation();
    if (list.style.display === "block") {
      closeDropdown();
    } else {
      renderOptions();
    }
  });


/* MOBILE SELECT SITE - OPEN INPUT FIRST */
mobileBtn?.addEventListener("click", e => {
  e.stopPropagation();

  // Kalau panel sudah terbuka, tutup semuanya.
  if (!panel.hidden) {
    closePanel();
    return;
  }

  // Buka panel mobile sahaja.
  panel.hidden = false;

  mobileBtn.setAttribute("aria-expanded", "true");
  mobileBtn.classList.add("is-open");

  const rect = mobileBtn.getBoundingClientRect();
  const width = Math.min(345, window.innerWidth - 16);

  panel.style.width = `${width}px`;

  panel.style.left = `${Math.max(
    8,
    Math.min(rect.left, window.innerWidth - width - 8)
  )}px`;

  panel.style.top = `${rect.bottom + 8}px`;

  // Reset search tanpa membuka dropdown.
  mobileInput.value = "";

  // Pastikan dropdown kekal tertutup.
  list.style.display = "none";
  wrap.classList.remove("search-mode");

  // Kemas kini chips yang sudah dipilih.
  updateMobileChips();

  // Jangan panggil renderOptions() di sini.
});


/* MOBILE SELECT SITE - CLEAR ALL */
const mobileClearIcon =
  mobileInputWrap.querySelector(".mobile-icon-clear");

mobileClearIcon?.addEventListener("click", e => {
  e.preventDefault();
  e.stopPropagation();

  // Kosongkan semua pilihan site.
  selectedIds = [];
  mobileInput.value = "";

  // Simpan perubahan dan kemas kini chips.
  saveSelection();
  updateInput();

  // Tutup senarai dropdown.
  list.style.display = "none";
  wrap.classList.remove("search-mode");

  // Pulangkan icon kepada arrow.
  mobileInputWrap.classList.remove("has-value");
});


/* MOBILE SELECT SITE - FOCUS & TOGGLE */

// Focus sahaja tidak membuka dropdown.
mobileInput.addEventListener("focus", () => {
  mobileInputWrap.classList.add("is-focused");
  updateMobileChips();
});

// Klik input atau kawasan chips:
// pertama buka, kedua tutup.
mobileInputWrap.addEventListener("click", e => {
  // Jangan ganggu tombol X, +N dan SVG clear.
  if (
    e.target.closest("button") ||
    e.target.closest(".mobile-icon-clear") ||
    e.target.closest(".mobile-site-more-popup")
  ) {
    return;
  }

  e.stopPropagation();

  const wasOpen = list.style.display === "block";

  if (wasOpen) {
    list.style.display = "none";
    wrap.classList.remove(
      "search-mode",
      "site-is-searching"
    );
  } else {
    renderOptions(mobileInput.value);
  }

  // Fokus input supaya boleh terus menaip.
  mobileInput.focus();
});

// Bila menaip, buka dropdown dan filter site.
mobileInput.addEventListener("input", () => {
  updateMobileChips();
  renderOptions(mobileInput.value);
});

// Bila keluar daripada input, kemas kini chips.
mobileInput.addEventListener("blur", () => {
  mobileInputWrap.classList.remove("is-focused");

  requestAnimationFrame(() => {
    updateMobileChips();
  });
});


  document.addEventListener("pointerdown", e => {
    if (
      wrap.contains(e.target) ||
      list.contains(e.target) ||
      panel.contains(e.target)
    ) return;

    closePanel();
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closePanel();
  });

  loadSites();
}


/* ==========================================================
   5G88 HEADER BACKGROUND COLOR
   ========================================================== */


/* ==========================================================
   5G88 CUSTOM HEADER COLOR PICKER
   ========================================================== */

const HEADER_COLOR_KEY = "5g88.headerColors.v1";

const DEFAULT_HEADER_COLORS = {
  color1: "#001529",
  color2: "#001529",
  alpha1: 100,
  alpha2: 100
};

function getHeaderColors() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(HEADER_COLOR_KEY) || "null"
    ) || {};

    const validHex = value =>
      typeof value === "string" &&
      /^#[0-9a-f]{6}$/i.test(value);

    const validAlpha = value =>
      Number.isFinite(Number(value)) &&
      Number(value) >= 0 &&
      Number(value) <= 100;

    return {
      color1: validHex(saved.color1)
        ? saved.color1
        : DEFAULT_HEADER_COLORS.color1,

      color2: validHex(saved.color2)
        ? saved.color2
        : DEFAULT_HEADER_COLORS.color2,

      alpha1: validAlpha(saved.alpha1)
        ? Number(saved.alpha1)
        : 100,

      alpha2: validAlpha(saved.alpha2)
        ? Number(saved.alpha2)
        : 100
    };
  } catch (_) {
    return { ...DEFAULT_HEADER_COLORS };
  }
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b]
    .map(value =>
      Math.round(Math.max(0, Math.min(255, value)))
        .toString(16)
        .padStart(2, "0")
    )
    .join("")
    .toUpperCase();
}

function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;

  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h *= 60;
    if (h < 0) h += 360;
  }

  return {
    h,
    s: max === 0 ? 0 : delta / max,
    v: max
  };
}

function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;

  let rgb;

  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];

  return rgb.map(value => Math.round((value + m) * 255));
}

function headerColorRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
}

function applyHeaderColors() {
  const colors = getHeaderColors();

  document.documentElement.style.setProperty(
    "--custom-header-color-1",
    headerColorRgba(colors.color1, colors.alpha1)
  );

  document.documentElement.style.setProperty(
    "--custom-header-color-2",
    headerColorRgba(colors.color2, colors.alpha2)
  );

  ["color1", "color2"].forEach(key => {
    const button = document.getElementById(
      key === "color1" ? "headerColor1" : "headerColor2"
    );

    const swatch = button?.querySelector(".header-color-swatch");

    if (swatch) {
      swatch.style.background = headerColorRgba(
        colors[key],
        colors[key === "color1" ? "alpha1" : "alpha2"]
      );
    }
  });
}

function initHeaderColors() {
  const buttons = [
    document.getElementById("headerColor1"),
    document.getElementById("headerColor2")
  ];

  const reset = document.getElementById("headerColorReset");

  applyHeaderColors();

  if (!buttons[0] || !buttons[1]) return;

  // Elak duplicate picker.
  document.getElementById("g88HeaderPicker")?.remove();

  const picker = document.createElement("div");
  picker.id = "g88HeaderPicker";
  picker.className = "g88-header-picker";
  picker.hidden = true;

  picker.innerHTML = `
    <div class="g88-picker-top">
      <span id="g88PickerTitle">Header Color 1</span>
      <button type="button" id="g88PickerClose" aria-label="Close">×</button>
    </div>

    <div class="g88-picker-square" id="g88PickerSquare">
      <div class="g88-picker-square-white"></div>
      <div class="g88-picker-square-black"></div>
      <span class="g88-picker-cursor" id="g88PickerCursor"></span>
    </div>

    <div class="g88-picker-sliders">
      <div class="g88-picker-preview" id="g88PickerPreview"></div>

      <div class="g88-picker-range-group">
        <input type="range" id="g88PickerHue"
               min="0" max="359" value="0"
               aria-label="Hue">

        <input type="range" id="g88PickerAlpha"
               min="0" max="100" value="100"
               aria-label="Opacity">
      </div>
    </div>


<div class="g88-picker-fields">

  <div class="g88-picker-format-wrap">

    <button type="button"
            class="g88-picker-format-btn"
            id="g88PickerFormatBtn"
            aria-expanded="false">

      <span id="g88PickerFormatText">HEX</span>

      <svg viewBox="64 64 896 896"
           width="12"
           height="12"
           fill="currentColor"
           aria-hidden="true">
        <path d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"/>
      </svg>
    </button>

    <div class="g88-picker-format-menu"
         id="g88PickerFormatMenu">

      <button type="button" data-format="HEX" class="active">HEX</button>
      <button type="button" data-format="HSB">HSB</button>
      <button type="button" data-format="RGB">RGB</button>

    </div>
  </div>

  <div class="g88-picker-values"
       id="g88PickerValues">

    <input id="g88PickerHex"
           maxlength="7"
           spellcheck="false"
           value="#001529">
  </div>

  <input id="g88PickerOpacity"
         class="g88-picker-opacity"
         type="text"
         inputmode="numeric"
         value="100%">
</div>

  `;

  document.body.appendChild(picker);

const square = picker.querySelector("#g88PickerSquare");
const cursor = picker.querySelector("#g88PickerCursor");
const hueInput = picker.querySelector("#g88PickerHue");
const alphaInput = picker.querySelector("#g88PickerAlpha");
const opacityInput = picker.querySelector("#g88PickerOpacity");
const preview = picker.querySelector("#g88PickerPreview");
const title = picker.querySelector("#g88PickerTitle");

const formatBtn = picker.querySelector("#g88PickerFormatBtn");
const formatText = picker.querySelector("#g88PickerFormatText");
const formatMenu = picker.querySelector("#g88PickerFormatMenu");
const formatWrap = picker.querySelector(".g88-picker-format-wrap");
const valueInputs = picker.querySelector("#g88PickerValues");

let currentFormat = "HEX";

  let activeKey = "color1";
  let hsv = { h: 0, s: 1, v: 1 };
  let alpha = 100;

  function currentHex() {
    return rgbToHex(...hsvToRgb(hsv.h, hsv.s, hsv.v));
  }

function clampPickerValue(value, min, max) {
  const number = Number(String(value).replace("%", ""));
  return Number.isFinite(number)
    ? Math.max(min, Math.min(max, number))
    : min;
}

function renderFormatInputs() {
  const hex = currentHex();

  if (currentFormat === "HEX") {
    valueInputs.innerHTML = `
      <input id="g88PickerHex"
             type="text"
             maxlength="7"
             spellcheck="false"
             value="${hex}">
    `;
    return;
  }

  if (currentFormat === "RGB") {
    const { r, g, b } = hexToRgb(hex);

    valueInputs.innerHTML = `
      <input data-rgb="r" aria-label="Red"
             type="number" min="0" max="255" value="${r}">
      <input data-rgb="g" aria-label="Green"
             type="number" min="0" max="255" value="${g}">
      <input data-rgb="b" aria-label="Blue"
             type="number" min="0" max="255" value="${b}">
    `;
    return;
  }

  valueInputs.innerHTML = `
    <input data-hsb="h" aria-label="Hue"
           type="number" min="0" max="360"
           value="${Math.round(hsv.h)}">

    <input data-hsb="s" aria-label="Saturation"
           type="number" min="0" max="100"
           value="${Math.round(hsv.s * 100)}">

    <input data-hsb="b" aria-label="Brightness"
           type="number" min="0" max="100"
           value="${Math.round(hsv.v * 100)}">
  `;
}

function commitFormatInputs() {
  if (currentFormat === "HEX") {
    let hex = valueInputs.querySelector("#g88PickerHex")
      ?.value.trim() || "";

    if (/^#[0-9a-f]{3}$/i.test(hex)) {
      hex = "#" + [...hex.slice(1)]
        .map(char => char + char).join("");
    }

    if (/^#[0-9a-f]{6}$/i.test(hex)) {
      const rgb = hexToRgb(hex);
      hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    }
  }

  if (currentFormat === "RGB") {
    const read = channel => clampPickerValue(
      valueInputs.querySelector(`[data-rgb="${channel}"]`)?.value,
      0, 255
    );

    const rgb = {
      r: read("r"),
      g: read("g"),
      b: read("b")
    };

    hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  }

  if (currentFormat === "HSB") {
    const read = (channel, max) => clampPickerValue(
      valueInputs.querySelector(`[data-hsb="${channel}"]`)?.value,
      0, max
    );

    hsv = {
      h: read("h", 360) % 360,
      s: read("s", 100) / 100,
      v: read("b", 100) / 100
    };
  }

  renderPicker();
  saveCurrentColor();
  renderFormatInputs();
}

  function saveCurrentColor() {
    const colors = getHeaderColors();

    colors[activeKey] = currentHex();
    colors[activeKey === "color1" ? "alpha1" : "alpha2"] = alpha;

    localStorage.setItem(
      HEADER_COLOR_KEY,
      JSON.stringify(colors)
    );

    applyHeaderColors();
  }

  function renderPicker() {
    const hex = currentHex();
    const rgb = hexToRgb(hex);

    square.style.backgroundColor =
      `hsl(${hsv.h}, 100%, 50%)`;

    cursor.style.left = `${hsv.s * 100}%`;
    cursor.style.top = `${(1 - hsv.v) * 100}%`;

    hueInput.value = Math.round(hsv.h);
    alphaInput.value = alpha;

if (!valueInputs.contains(document.activeElement)) {
  renderFormatInputs();
}

if (document.activeElement !== opacityInput) {
  opacityInput.value = `${alpha}%`;
}

    preview.style.background =
      headerColorRgba(hex, alpha);

    alphaInput.style.background = `
      linear-gradient(
        90deg,
        rgba(${rgb.r},${rgb.g},${rgb.b},0),
        rgb(${rgb.r},${rgb.g},${rgb.b})
      )
    `;
  }

  function openPicker(key, button) {
    activeKey = key;

    const colors = getHeaderColors();
    const rgb = hexToRgb(colors[key]);

    hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    alpha = colors[key === "color1" ? "alpha1" : "alpha2"];

    title.textContent =
      key === "color1" ? "Header Color 1" : "Header Color 2";

    picker.hidden = false;
    renderPicker();

    const rect = button.getBoundingClientRect();
    const width = picker.offsetWidth;
    const height = picker.offsetHeight;

    picker.style.left = `${Math.max(
      8,
      Math.min(rect.right - width, window.innerWidth - width - 8)
    )}px`;

    const below = rect.bottom + 8;
    const above = rect.top - height - 8;

    picker.style.top = `${
      below + height <= window.innerHeight
        ? below
        : Math.max(8, above)
    }px`;
  }

  function closePicker() {
    picker.hidden = true;
  }

  buttons.forEach((button, index) => {
    button.addEventListener("click", event => {
      event.stopPropagation();

      const key = index === 0 ? "color1" : "color2";

      if (!picker.hidden && activeKey === key) {
        closePicker();
      } else {
        openPicker(key, button);
      }
    });
  });

  function updateSquare(event) {
    const rect = square.getBoundingClientRect();

    hsv.s = Math.max(0, Math.min(
      1, (event.clientX - rect.left) / rect.width
    ));

    hsv.v = 1 - Math.max(0, Math.min(
      1, (event.clientY - rect.top) / rect.height
    ));

    renderPicker();
    saveCurrentColor();
  }


/* ==========================================
   HEADER COLOR PICKER - SMOOTH DRAG FIX
   ========================================== */

let squareDragging = false;
let squarePointerId = null;

square.addEventListener("pointerdown", event => {
  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  event.preventDefault();

  squareDragging = true;
  squarePointerId = event.pointerId;

  try {
    square.setPointerCapture(event.pointerId);
  } catch (_) {}

  updateSquare(event);
});

square.addEventListener("pointermove", event => {
  if (!squareDragging) return;
  if (event.pointerId !== squarePointerId) return;

  event.preventDefault();
  updateSquare(event);
});

function stopSquareDragging(event) {
  if (!squareDragging) return;
  if (event.pointerId !== squarePointerId) return;

  squareDragging = false;
  squarePointerId = null;

  try {
    if (square.hasPointerCapture(event.pointerId)) {
      square.releasePointerCapture(event.pointerId);
    }
  } catch (_) {}
}

square.addEventListener("pointerup", stopSquareDragging);
square.addEventListener("pointercancel", stopSquareDragging);

square.addEventListener("lostpointercapture", event => {
  if (event.pointerId === squarePointerId) {
    squareDragging = false;
    squarePointerId = null;
  }
});

  hueInput.addEventListener("input", () => {
    hsv.h = Number(hueInput.value);
    renderPicker();
    saveCurrentColor();
  });

  alphaInput.addEventListener("input", () => {
    alpha = Number(alphaInput.value);
    renderPicker();
    saveCurrentColor();
  });


/* ==========================================================
   HEX / HSB / RGB FORMAT DROPDOWN
   ========================================================== */

formatBtn.addEventListener("click", event => {
  event.stopPropagation();

  const isOpen = formatWrap.classList.toggle("open");

  formatBtn.setAttribute(
    "aria-expanded",
    String(isOpen)
  );
});

formatMenu.querySelectorAll("[data-format]")
  .forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();

      currentFormat = button.dataset.format;
      formatText.textContent = currentFormat;

      formatMenu.querySelectorAll("[data-format]")
        .forEach(item => {
          item.classList.toggle(
            "active",
            item === button
          );
        });

      formatWrap.classList.remove("open");
      formatBtn.setAttribute("aria-expanded", "false");

      renderFormatInputs();
    });
  });

valueInputs.addEventListener("change", commitFormatInputs);

valueInputs.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    event.target.blur();
  }
});

opacityInput.addEventListener("change", () => {
  alpha = clampPickerValue(
    opacityInput.value,
    0,
    100
  );

  renderPicker();
  saveCurrentColor();
});

document.addEventListener("pointerdown", event => {
  if (!formatWrap.contains(event.target)) {
    formatWrap.classList.remove("open");
    formatBtn.setAttribute("aria-expanded", "false");
  }
});


  picker.querySelector("#g88PickerClose")
    .addEventListener("click", closePicker);

  picker.addEventListener("pointerdown", event => {
    event.stopPropagation();
  });

  document.addEventListener("pointerdown", event => {
    if (
      !picker.hidden &&
      !picker.contains(event.target) &&
      !buttons.some(button => button.contains(event.target))
    ) {
      closePicker();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closePicker();
  });

  reset?.addEventListener("click", () => {
    localStorage.removeItem(HEADER_COLOR_KEY);
    applyHeaderColors();
    closePicker();
  });
}

  /* ==========================================================
     THEME
     ========================================================== */


function applyTheme() {
  const saved =
    localStorage.getItem("adminTheme") || "dark";

  const isLight = saved === "light";

  document.body.classList.toggle(
    "light-theme",
    isLight
  );

  document.body.classList.toggle(
    "dark-theme",
    !isLight
  );

  document.documentElement.setAttribute(
    "data-admin-theme",
    isLight ? "light" : "dark"
  );

  const label =
    document.getElementById("themeToggleLabel");

  if (label) {
    label.textContent = isLight
      ? "Light Mode"
      : "Dark Mode";
  }

  const toggle =
    document.getElementById("themeToggleInput");

  if (toggle) {
    toggle.checked = !isLight;
  }
}



function toggleTheme() {
  const currentTheme =
    localStorage.getItem("adminTheme") || "dark";

  const nextTheme =
    currentTheme === "dark" ? "light" : "dark";

  localStorage.setItem(
    "adminTheme",
    nextTheme
  );

  applyTheme();
}


  /* ==========================================================
     USER INFO
     ========================================================== */

function renderUserInfo() {
  const userNameText = document.getElementById("userNameText");
  const userEmail = document.getElementById("userEmail");
  const userButton = document.getElementById("userName");

  let login = {};

  try {
    login = JSON.parse(
      localStorage.getItem("gmailLogin") || "{}"
    );
  } catch (_) {
    login = {};
  }

  const email = String(login.email || "").trim();

let displayName = String(
  login.displayName ||
  login.name ||
  login.username ||
  ""
).trim();

  // Username login:
  // contoh admin@5g88.local -> admin
  if (
    !displayName &&
    email.toLowerCase().endsWith("@5g88.local")
  ) {
    displayName = email.split("@")[0];
  }

  // Google/email login fallback
  if (!displayName && email) {
    displayName = email.split("@")[0];
  }

if (!displayName) {
  displayName = "";
}
  if (userNameText) {
    userNameText.textContent = displayName;
  }

  if (userEmail) {
    userEmail.textContent = email || "-";
  }

  if (userButton) {
    userButton.title = email || displayName;
  }
}

async function updateHeaderUserFromFirebase() {
  try {
    if (typeof auth === "undefined" || typeof db === "undefined") return;

    const user = await new Promise(resolve => {
      const unsubscribe = auth.onAuthStateChanged(u => {
        unsubscribe();
        resolve(u);
      });
    });

    if (!user) return;

    const snap = await db.ref("adminUsers/" + user.uid).once("value");
    const profile = snap.val();

    // Simpan profile hanya jika account masih aktif.
if (!profile || profile.active !== true) {
  currentAdminProfile = null;
  return;
}

// Profile Firebase digunakan untuk semakan permission.
currentAdminProfile = {
  role: String(profile.role || "").trim().toLowerCase(),
  permissions: profile.permissions || {}
};
// Semak akses URL selepas profile Firebase dimuatkan.
const currentPage = getCurrentFile();

if (
  currentPage !== "index.html" &&
  (
    !canShowAdminPage(currentPage) ||
    !canViewAdminPage(currentPage)
  )
) {
  console.warn(
    "[Permission] Direct page access denied:",
    currentPage
  );

  window.location.replace("./index.html");
  return;
}
    const name = String(
      profile.displayName || profile.username || "Admin"
    ).trim();

    const nameEl = document.getElementById("userNameText");
    const infoEl = document.getElementById("userEmail");
    const button = document.getElementById("userName");

    if (nameEl) nameEl.textContent = name;
    if (infoEl) infoEl.textContent = profile.username || "";
    if (button) button.title = name;
     // Refresh menu selepas profile Firebase berjaya dimuatkan.
renderSidebarTabs();

renderDropdown("gameLogDropdown", "gamelog");
renderDropdown("bankResitDropdown", "bank");
renderDropdown("gameLinksDropdown", "list");


syncCurrentPageTab();
renderTabs();

if (getCurrentFile() === "index.html") {
  initDefaultWorkspace();
}

// Firebase profile sudah siap dan permission sudah disemak.
window.dispatchEvent(
  new Event("5g88-admin-profile-ready")
);

  } catch (error) {
    console.warn("[Header User]", error);
  }
}
  /* ==========================================================
     CLOCK
     ========================================================== */


  function updateClock() {
    const element = document.getElementById("dateTime");
    if (!element) return;

    const now = new Date();

    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kuala_Lumpur",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      day: "2-digit",
      month: "short"
    }).formatToParts(now);

    const getPart = type =>
      parts.find(part => part.type === type)?.value || "";

    const time = `${getPart("hour")}:${getPart("minute")}`;
    const date = `${getPart("month")} ${getPart("day")}`;

    element.innerHTML = `
      <div class="admin-clock">
        <span class="admin-clock-city">Kuala Lumpur</span>
        <div class="admin-clock-bottom">
          <span class="admin-clock-time">${time}</span>
          <span class="admin-clock-date">${date}</span>
        </div>
      </div>
    `;
  }



function handleLogout() {
  if (window.__adminLoggingOut) return;
  window.__adminLoggingOut = true;

  (async () => {
    try {
      // Hentikan single-session listener dahulu
      if (typeof window.stopSingleSession === "function") {
        await window.stopSingleSession();
      }
    } catch (error) {
      console.warn("Stop session failed:", error);
    }

    // Padam penanda sesi sebelum signOut
    try {
      sessionStorage.removeItem("5g88.adminSession");
      sessionStorage.removeItem("justLoggedIn");
      sessionStorage.removeItem("forceLogout");
      sessionStorage.removeItem("autoOpenTab");

      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith("5g88.singleSession.")) {
          sessionStorage.removeItem(key);
        }
      });

      localStorage.removeItem("autoLogout.expireAt");
      localStorage.removeItem("gmailLogin");
      localStorage.removeItem("useremail");
    } catch (error) {
      console.warn("Clear session failed:", error);
    }

    // Logout Firebase sebenar
    try {
      if (window.firebase && firebase.apps.length) {
        await firebase.auth().signOut();
      }
    } catch (error) {
      console.error("Firebase logout failed:", error);
    }

    // Kembali ke halaman login
    window.location.replace("./login.html");
  })();
}

  /* ==========================================================
     DIRECT HEADER BUTTONS
     ========================================================== */

  function setupDirectButtons() {

    document
      .getElementById(
        "linkDownloadBtn"
      )
      ?.addEventListener(
        "click",
        () => {

          addTab(
            findPageByFile(
              "linkdownload.html"
            )
          );

        }
      );


    document
      .getElementById(
        "itemBtn"
      )
      ?.addEventListener(
        "click",
        () => {

          addTab(
            findPageByFile(
              "item.html"
            )
          );

        }
      );


    document
      .getElementById(
        "liveChatBtn"
      )
      ?.addEventListener(
        "click",
        () => {

          addTab(
            findPageByFile(
              "livechat.html"
            )
          );

        }
      );
  }


  /* ==========================================================
     COMMON EVENTS
     ========================================================== */

  function setupEvents() {

    document
      .getElementById(
        "menuIcon"
      )
      ?.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          toggleSidebar();

        }
      );


    document
      .getElementById(
        "overlay"
      )
      ?.addEventListener(
        "click",
        closeSidebar
      );


document
  .getElementById("refreshHeaderBtn")
      ?.addEventListener(
        "click",
        event => {

          const button =
            event.currentTarget;

          button.classList.add(
            "spin"
          );

sessionStorage.setItem(
  "5g88.showRefreshLoading",
  "1"
);

sessionStorage.removeItem(
  "5g88.smartTabNavigation"
);
          setTimeout(
            () => {
              window.location.reload();
            },
            180
          );

        }
      );


document
  .getElementById("themeToggleInput")
  ?.addEventListener("change", toggleTheme);
     

/* ==========================================
   USERNAME DROPDOWN - HOVER WITH CLOSE DELAY
   ========================================== */

const accountDropdown = document.querySelector(".user-dropdown");
const accountButton = document.getElementById("userName");
const accountPanel = document.getElementById("dropdownContent");

if (accountDropdown && accountButton && accountPanel) {

  let accountCloseTimer = null;
  const ACCOUNT_CLOSE_DELAY = 300;

  const cancelAccountClose = () => {
    if (accountCloseTimer !== null) {
      clearTimeout(accountCloseTimer);
      accountCloseTimer = null;
    }
  };

  const openAccountDropdown = () => {
    cancelAccountClose();

    accountDropdown.classList.add("account-dropdown-open");
    accountButton.setAttribute("aria-expanded", "true");
  };

  const closeAccountDropdown = () => {
    cancelAccountClose();

    accountDropdown.classList.remove("account-dropdown-open");
    accountButton.setAttribute("aria-expanded", "false");
  };

  const scheduleAccountClose = () => {
    cancelAccountClose();

    accountCloseTimer = setTimeout(() => {
      closeAccountDropdown();
    }, ACCOUNT_CLOSE_DELAY);
  };

  // Buka hanya bila hover tombol username
  accountButton.addEventListener("mouseenter", openAccountDropdown);

  // Bila mouse turun dari tombol, jangan tutup terus
  accountButton.addEventListener("mouseleave", scheduleAccountClose);

  // Masuk panel: batalkan timer supaya boleh klik
  accountPanel.addEventListener("mouseenter", openAccountDropdown);

  // Keluar panel: tunggu sebentar sebelum tutup
  accountPanel.addEventListener("mouseleave", scheduleAccountClose);

  // Sokongan klik untuk mobile / touch
  accountButton.addEventListener("click", event => {
    event.stopPropagation();

    if (accountDropdown.classList.contains("account-dropdown-open")) {
      closeAccountDropdown();
    } else {
      openAccountDropdown();
    }
  });

  // Klik luar: tutup terus
  document.addEventListener("click", event => {
    if (!accountDropdown.contains(event.target)) {
      closeAccountDropdown();
    }
  });

  // Escape: tutup terus
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeAccountDropdown();
    }
  });
}

// Initialize custom header colors
initHeaderColors();

    document
      .getElementById(
        "logoutBtn"
      )
      ?.addEventListener(
        "click",
        handleLogout
      );


    document.addEventListener(
      "click",
      event => {

        if (
          !event.target.closest(
            "#sidebar"
          ) &&
          !event.target.closest(
            "#menuIcon"
          )
        ) {

          closeSidebar();
        }


        if (
          !event.target.closest(
            ".dropdown-wrapper"
          )
        ) {

          closeHeaderDropdowns();
        }

      }
    );


    window.addEventListener(
      "resize",
      () => {
        closeHeaderDropdowns();
        updateChangePwVisibility();
      }
    );


    window.addEventListener(
      "storage",
      event => {

        if (
          event.key ===
          "adminTheme"
        ) {

          applyTheme();
        }

      }
    );
  }



  /* ==========================================================
     SHARED FIREBASE / VISIBILITY / NOTIFICATION / PASSWORD
     ========================================================== */

  let uiVisibility = {};

function getSharedDb() {
  try {
    if (
      typeof db !== "undefined" &&
      db &&
      typeof db.ref === "function"
    ) {
      return db;
    }
  } catch (_) {}

  try {
    if (
      window.db &&
      typeof window.db.ref === "function"
    ) {
      return window.db;
    }
  } catch (_) {}

  return null;
}

  function isFeatureHidden(label) {
    return !!uiVisibility[String(label || "").trim().toUpperCase()];
  }

  const HEADER_FEATURE_MAP = {
    "LIVE CHAT": "liveChatBtn",
    "LINK DOWNLOAD": "linkDownloadBtn",
    "GAMELOG": "gameLogBtn",
    "BANK RECEIPT": "bankResitBtn",
    "LIST TYPE": "gameLinksBtn",
    "ITEM COLLECTION": "itemBtn"
  };

  function applySharedVisibility() {
    Object.entries(HEADER_FEATURE_MAP).forEach(([label, id]) => {
      const el = document.getElementById(id);
      if (el) el.style.display = isFeatureHidden(label) ? "none" : "";
    });

    document.querySelectorAll("#sidebar a, #gameLogDropdown a, #bankResitDropdown a, #gameLinksDropdown a")
      .forEach(link => {
        const label = String(
          link.getAttribute("data-feature") ||
          link.getAttribute("data-label") ||
          link.textContent ||
          ""
        ).trim().toUpperCase();

        link.style.display = isFeatureHidden(label) ? "none" : "";
      });

    const tabs = getTabs();
    const filtered = tabs.filter(tab => {
      const label = String(tab.name || tab.label || "").trim().toUpperCase();
      return !isFeatureHidden(label);
    });

    if (filtered.length !== tabs.length) {
      saveTabs(filtered);
      renderTabs();
      renderSidebarTabs();
      updateHeaderActiveState();
    }
  }

  function initUiVisibility() {
    const sharedDb = getSharedDb();
    if (!sharedDb) return;

    sharedDb.ref("settings/uiVisibility").on("value", snap => {
      const raw = snap.val() || {};
      uiVisibility = {};

      Object.entries(raw).forEach(([key, value]) => {
        uiVisibility[String(key).trim().toUpperCase()] = !!value;
      });

      applySharedVisibility();
    });
  }

  function syncMenuNotifDot() {
    const notifDot = document.getElementById("notifDot");
    const menuDot = document.getElementById("menuNotifDot");
    if (!notifDot || !menuDot) return;

    const hasNotice = getComputedStyle(notifDot).display !== "none";

    if (window.innerWidth <= 815 && hasNotice) {
      menuDot.style.display = "flex";
      menuDot.textContent = (notifDot.textContent || "1").trim() || "1";
    } else {
      menuDot.style.display = "none";
      menuDot.textContent = "";
    }
  }

  function moveNotifButtonResponsive() {
    const button = document.getElementById("notifButton");
    const sidebarSlot = document.getElementById("sidebarNotifSlot");
    const desktopSlot = document.getElementById("desktopNotifSlot");

    if (!button || !sidebarSlot || !desktopSlot) return;

    const target = window.innerWidth <= 600
      ? sidebarSlot
      : desktopSlot;

    if (button.parentElement !== target) {
      target.appendChild(button);
    }
  }

  function closeNoticeModal() {
    const modal = document.getElementById("noticeModal");
    if (modal) modal.style.display = "none";
  }

function openNoticeModal(message, timestamp) {
  const modal = document.getElementById("noticeModal");
  const text = document.getElementById("noticeMessageText");
  const time = document.getElementById("noticeMessageTime");

  if (!modal || !text || !time) return false;

  text.textContent = message || "";

  if (timestamp) {

    const dateObj = new Date(Number(timestamp));

    time.textContent =
      !Number.isNaN(dateObj.getTime())
        ? `${String(dateObj.getDate()).padStart(2,"0")}/${String(dateObj.getMonth()+1).padStart(2,"0")}/${dateObj.getFullYear()} ${String(dateObj.getHours()).padStart(2,"0")}:${String(dateObj.getMinutes()).padStart(2,"0")}:${String(dateObj.getSeconds()).padStart(2,"0")}`
        : "";

  } else {

    time.textContent = "";

  }

  modal.style.display = "flex";
  return true;
}

  function markNoticeSeen(timestamp) {
    const login = JSON.parse(localStorage.getItem("gmailLogin") || "{}");
    const email = String(login.email || "guest").toLowerCase();
    localStorage.setItem(`seenNotif_${timestamp}_${email}`, "1");

    const dot = document.getElementById("notifDot");
    if (dot) {
      dot.style.display = "none";
      dot.textContent = "";
    }

    syncMenuNotifDot();

    if (window.updateFloatingFabNoticeDot) {
      window.updateFloatingFabNoticeDot(0);
    }
  }

  function showNotification(message, timestamp) {
    const button = document.getElementById("notifButton");
    const dot = document.getElementById("notifDot");
    if (!button) return;

    const login = JSON.parse(localStorage.getItem("gmailLogin") || "{}");
    const email = String(login.email || "guest").toLowerCase();
    const seenKey = `seenNotif_${timestamp}_${email}`;

    button.dataset.message = message;
    button.dataset.timestamp = String(timestamp);

    localStorage.setItem("latestNotifMessage", message);
    localStorage.setItem("latestNotifTimestamp", String(timestamp));

    if (!localStorage.getItem(seenKey) && dot) {
      dot.style.display = "flex";
      dot.textContent = "1";
      syncMenuNotifDot();

      if (window.updateFloatingFabNoticeDot) {
        window.updateFloatingFabNoticeDot(1);
      }
    }
  }

  function initNotifications() {
    const button = document.getElementById("notifButton");
    const dot = document.getElementById("notifDot");

    moveNotifButtonResponsive();
    syncMenuNotifDot();

    const savedMessage = localStorage.getItem("latestNotifMessage");
    const savedTimestamp = localStorage.getItem("latestNotifTimestamp");

    if (button && savedMessage && savedTimestamp) {
      showNotification(savedMessage, savedTimestamp);
    }

button?.addEventListener("click", event => {

  event.stopPropagation();

  const message =
    button.dataset.message ||
    localStorage.getItem(
      "latestNotifMessage"
    ) ||
    "";

  const timestamp =
    Number(
      button.dataset.timestamp ||
      localStorage.getItem(
        "latestNotifTimestamp"
      ) ||
      0
    );


  /* ADA NOTICE */
  if (message) {

    if (
      openNoticeModal(
        message,
        timestamp || Date.now()
      )
    ) {

      if (timestamp) {
        markNoticeSeen(timestamp);
      }
    }

    return;
  }


  /* TIADA NOTICE */
  openNoticeModal(
    "No Data",
    0
  );

});

    document.getElementById("noticeClose")
      ?.addEventListener("click", closeNoticeModal);

    document.getElementById("noticeOkBtn")
      ?.addEventListener("click", closeNoticeModal);

    document.getElementById("noticeModal")
      ?.addEventListener("click", event => {
        if (event.target.id === "noticeModal") {
          closeNoticeModal();
        }
      });

    if (dot) {
      new MutationObserver(syncMenuNotifDot).observe(dot, {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true,
        attributeFilter: ["style", "class"]
      });
    }

    window.addEventListener("resize", () => {
      moveNotifButtonResponsive();
      syncMenuNotifDot();
    });

    const sharedDb = getSharedDb();
    if (sharedDb) {
      sharedDb.ref("notifikasi/pesanTerbaru").on("value", snapshot => {
        const data = snapshot.val();
        if (!data || !data.message || !data.timestamp) return;
        showNotification(data.message, data.timestamp);
      });
    }
  }
/* ==========================================================
   FLOATING FAB
   ========================================================== */

function initFloatingFab() {

  const fabWrap = document.getElementById("floatingFabWrap");
  const mainBtn = document.getElementById("floatingMainBtn");
  const noticeBtn = document.getElementById("floatingNoticeBtn");
  const liveBtn = document.getElementById("floatingLivechatBtn");

  const infoIcon = document.getElementById("floatingMainInfoIcon");
  const closeIcon = document.getElementById("floatingMainCloseIcon");

  if (!fabWrap || !mainBtn) return;


  /* ==========================================================
     HIDE FLOATING HANYA DI WHATSAPP
     ========================================================== */

  const currentFile = getCurrentFile();

  if (currentFile === "whatsapp.html") {
    fabWrap.style.display = "none";
    return;
  }

  fabWrap.style.display = "";


  /* ==========================================================
     OPEN / CLOSE
     ========================================================== */

  let isOpen = false;

  function setOpen(open) {

    isOpen = !!open;

    fabWrap.classList.toggle(
      "open",
      isOpen
    );

    if (infoIcon) {
      infoIcon.style.display =
        isOpen ? "none" : "";
    }

    if (closeIcon) {
      closeIcon.style.display =
        isOpen ? "" : "none";
    }
  }


  /* ==========================================================
     DESKTOP - HOVER
     ========================================================== */

  fabWrap.addEventListener(
    "mouseenter",
    () => {
      setOpen(true);
    }
  );

  fabWrap.addEventListener(
    "mouseleave",
    () => {
      setOpen(false);
    }
  );


  /* ==========================================================
     MOBILE / TOUCH - CLICK MAIN BUTTON
     ========================================================== */

  mainBtn.addEventListener(
    "click",
    event => {

      event.stopPropagation();

      if (
        window.matchMedia(
          "(hover: none)"
        ).matches
      ) {
        setOpen(!isOpen);
      }
    }
  );


  /* ==========================================================
     NOTICE BUTTON
     ========================================================== */

  noticeBtn?.addEventListener(
    "click",
    event => {

      event.stopPropagation();

      const notifButton =
        document.getElementById(
          "notifButton"
        );

      const message =
        notifButton?.dataset.message ||
        localStorage.getItem(
          "latestNotifMessage"
        ) ||
        "";

      const timestamp =
        Number(
          notifButton?.dataset.timestamp ||
          localStorage.getItem(
            "latestNotifTimestamp"
          ) ||
          0
        );

      if (message) {

        if (
          openNoticeModal(
            message,
            timestamp || Date.now()
          )
        ) {
          if (timestamp) {
            markNoticeSeen(timestamp);
          }
        }

      } else {

        openNoticeModal(
          "No Data",
          0
        );
      }

      setOpen(false);
    }
  );


  /* ==========================================================
     LIVECHAT BUTTON
     ========================================================== */

  liveBtn?.addEventListener(
    "click",
    event => {

      event.stopPropagation();

      addTab(
        "LIVE CHAT",
        "livechat.html",
        "main"
      );

      setOpen(false);
    }
  );


  /* ==========================================================
     MOBILE - CLICK LUAR UNTUK CLOSE
     ========================================================== */

  document.addEventListener(
    "click",
    event => {

      if (
        isOpen &&
        !fabWrap.contains(event.target)
      ) {
        setOpen(false);
      }
    }
  );
}
  function isUsernameLoginNow() {
    try {
      const login = JSON.parse(localStorage.getItem("gmailLogin") || "{}");
      return String(login.email || "").toLowerCase().endsWith("@5g88.local");
    } catch (_) {
      return false;
    }
  }

async function setBtnLoading(button, loading, label) {
  if (!button) return;

  if (loading) {
    await window.NewUI.setButtonLoading(button, true, {
      text: label || "Saving..."
    });
  } else {
    await window.NewUI.setButtonLoading(button, false, {
      minDuration: 500
    });
  }
}

function updateChangePwVisibility() {
  const pw = document.getElementById("changePwBtn");
  const pw2 = document.getElementById("change2ndPwBtn");

  if (pw) pw.style.display = "";
  if (pw2) pw2.style.display = "";
}

  async function sha256Hex(text) {
    const enc = new TextEncoder().encode(String(text || ""));
    const buf = await crypto.subtle.digest("SHA-256", enc);

    return [...new Uint8Array(buf)]
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function initPasswordModals() {
    updateChangePwVisibility();

    const sharedDb = getSharedDb();

    const btn = document.getElementById("changePwBtn");
    const modal = document.getElementById("cpModal");
    const closeX = document.getElementById("cpClose");
    const cancel = document.getElementById("cpCancel");
    const submit = document.getElementById("cpSubmit");
    const oldInput = document.getElementById("cpOld");
    const newInput = document.getElementById("cpNew");
    const confirmInput = document.getElementById("cpNew2");
    const errBox = document.getElementById("cpErr");
    const okBox = document.getElementById("cpOk");

const showErr = message => {
  window.NewUI.showToast(message, "error", 3500);
};

const showOk = message => {
  window.NewUI.showToast(message, "success", 3500);
};
let passwordModalUI = null;

const closePw = () => {
  passwordModalUI?.close();
};

const openPw = () => {
  if (passwordModalUI) return;

  if (!window.NewUI?.modal?.open) {
    console.error("NewUI modal is not available.");
    return;
  }

  if (errBox) {
    errBox.style.display = "none";
    errBox.textContent = "";
  }

  if (okBox) {
    okBox.style.display = "none";
    okBox.textContent = "";
  }

  if (oldInput) oldInput.value = "";
  if (newInput) newInput.value = "";
  if (confirmInput) confirmInput.value = "";

  setBtnLoading(submit, false, "Change");
  if (cancel) cancel.disabled = false;

  const body = document.getElementById("cpBody");
  const footer = document.getElementById("cpFoot");
  const oldDialog = document.getElementById("cpDialog");

  if (!body || !footer || !oldDialog) return;

  passwordModalUI = window.NewUI.modal.open({
    title: "Change Password",
    content: body,
    footer: footer,
    width: 550,
    closeOnBackdrop: true,

    onClose: () => {
      oldDialog.append(body, footer);
      passwordModalUI = null;
    }
  });

  setTimeout(() => oldInput?.focus(), 0);
};

const changePw = async () => {
   if (submit?.disabled) return;
  const oldPw = oldInput?.value || "";
  const newPw = newInput?.value || "";
  const newPw2 = confirmInput?.value || "";

  if (!oldPw || !newPw || !newPw2) {
    return showErr("All fields are required.");
  }

  if (newPw.length < 6) {
    return showErr("New password must be at least 6 characters.");
  }

  if (newPw !== newPw2) {
    return showErr("Confirm password does not match.");
  }

  if (newPw === oldPw) {
    return showErr("New password must be different.");
  }

  setBtnLoading(submit, true, "Changing...");
  if (cancel) cancel.disabled = true;

  try {
    const user = firebase.auth().currentUser;

    if (!user) {
      throw new Error("Session expired. Please log in again.");
    }

    const token = await user.getIdToken();

    const response = await fetch(
      "https://fiveg88-admin-backend-v2.onrender.com/api/account/change-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: oldPw,
          newPassword: newPw
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Failed to change password.");
    }

    showOk(result.message);

    await new Promise(resolve => setTimeout(resolve, 1000));

    await firebase.auth().signOut();
    sessionStorage.removeItem("5g88.adminSession");
    localStorage.removeItem("autoLogout.expireAt");

    window.location.replace("./login.html?pw_changed=1");

  } catch (error) {
    showErr(error.message || "Failed to change password.");
} finally {
  await setBtnLoading(submit, false, "Change");
  if (cancel) cancel.disabled = false;
}
};

    btn?.addEventListener("click", openPw);
    cancel?.addEventListener("click", closePw);
    submit?.addEventListener("click", changePw);

    [oldInput, newInput, confirmInput].filter(Boolean).forEach(input => {
      input.addEventListener("keydown", event => {
        if (event.key === "Enter") changePw();
      });
    });

    const btn2 = document.getElementById("change2ndPwBtn");
    const modal2 = document.getElementById("cp2Modal");
    const close2 = document.getElementById("cp2Close");
    const cancel2 = document.getElementById("cp2Cancel");
    const submit2 = document.getElementById("cp2Submit");
    const old2 = document.getElementById("cp2Old");
    const new2 = document.getElementById("cp2New");
    const confirm2 = document.getElementById("cp2New2");
    const err2 = document.getElementById("cp2Err");
    const ok2 = document.getElementById("cp2Ok");

const showErr2 = message => {
  window.NewUI.showToast(message, "error", 3500);
};

const showOk2 = message => {
  window.NewUI.showToast(message, "success", 3500);
};

let secondPasswordModalUI = null;

const closePw2 = () => {
  secondPasswordModalUI?.close();
};

const openPw2 = () => {
  if (secondPasswordModalUI) return;

  if (!window.NewUI?.modal?.open) {
    console.error("NewUI modal is not available.");
    return;
  }

  if (err2) {
    err2.style.display = "none";
    err2.textContent = "";
  }

  if (ok2) {
    ok2.style.display = "none";
    ok2.textContent = "";
  }

  [old2, new2, confirm2].filter(Boolean).forEach(input => {
    input.value = "";
  });

  setBtnLoading(submit2, false, "Save");
  if (cancel2) cancel2.disabled = false;

  const body = document.getElementById("cp2Body");
  const footer = document.getElementById("cp2Foot");
  const oldDialog = document.getElementById("cp2Dialog");

  if (!body || !footer || !oldDialog) return;

  secondPasswordModalUI = window.NewUI.modal.open({
    title: "Change 2nd Password",
    content: body,
    footer: footer,
    width: 550,
    closeOnBackdrop: true,

    onClose: () => {
      oldDialog.append(body, footer);
      secondPasswordModalUI = null;
    }
  });

  setTimeout(() => old2?.focus(), 0);
};
const changePw2 = async () => {
     if (submit2?.disabled) return;
  const oldPin = old2?.value || "";
  const newPin = new2?.value || "";
  const confirmPin = confirm2?.value || "";

  if (!/^\d{6}$/.test(oldPin)) {
    return showErr2("Current 2nd password must be 6 digits.");
  }

  if (!/^\d{6}$/.test(newPin)) {
    return showErr2("New 2nd password must be 6 digits.");
  }

  if (newPin !== confirmPin) {
    return showErr2("Confirm 2nd password does not match.");
  }

  if (newPin === oldPin) {
    return showErr2("New 2nd password must be different.");
  }

  setBtnLoading(submit2, true, "Saving...");
  if (cancel2) cancel2.disabled = true;

  try {
    const user = firebase.auth().currentUser;

    if (!user) {
      throw new Error("Session expired. Please log in again.");
    }

    const token = await user.getIdToken();

    const response = await fetch(
      "https://fiveg88-admin-backend-v2.onrender.com/api/account/change-pin",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPin,
          newPin
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Failed to change 2nd password.");
    }

   showOk2(result.message);

    await new Promise(resolve => setTimeout(resolve, 1000));

    await firebase.auth().signOut();
    sessionStorage.removeItem("5g88.adminSession");
    localStorage.removeItem("autoLogout.expireAt");

    window.location.replace("./login.html?pin_changed=1");

  } catch (error) {
    showErr2(error.message || "Failed to change 2nd password.");
} finally {
  await setBtnLoading(submit2, false, "Save");
  if (cancel2) cancel2.disabled = false;
}
};

    [old2, new2, confirm2].filter(Boolean).forEach(input => {
      input.addEventListener("input", () => {
        input.value = String(input.value || "").replace(/\D/g, "").slice(0, 6);
      });

      input.addEventListener("keydown", event => {
        if (event.key === "Enter") changePw2();
      });
    });

    btn2?.addEventListener("click", openPw2);
    cancel2?.addEventListener("click", closePw2);
    submit2?.addEventListener("click", changePw2);

    window.addEventListener("click", event => {
      if (event.target === modal) closePw();
      if (event.target === modal2) closePw2();
    });
  }

/* ==========================================================
   5G88 REFRESH OVERLAY CONTROLLER
   ========================================================== */

function initAdminRefreshOverlay() {
  const key = "5g88.showRefreshLoading";

  if (
    document.documentElement.classList.contains(
      "fiveg88-hard-reload"
    )
  ) {
    sessionStorage.removeItem(key);
    return;
  }

  const navigation =
    performance.getEntriesByType("navigation")[0];

  const isBrowserRefresh =
    navigation?.type === "reload";

  const isTabRefresh =
    sessionStorage.getItem(key) === "1";

  sessionStorage.removeItem(key);

  if (!isBrowserRefresh && !isTabRefresh) {
    return;
  }

  if (typeof window.showGlobalLoading !== "function") {
    return;
  }

  window.showGlobalLoading(
    "Please wait while fetching...",
    0
  );

  let pageReady =
    document.readyState === "complete";

  let firebaseReady =
    !!currentAdminProfile;

  let finished = false;

  function finish() {
    if (finished || !pageReady || !firebaseReady) {
      return;
    }

    finished = true;

    window.removeEventListener(
      "5g88-admin-profile-ready",
      onProfileReady
    );

    window.hideGlobalLoading?.();
  }

  function onProfileReady() {
    firebaseReady = !!currentAdminProfile;
    finish();
  }

  window.addEventListener(
    "5g88-admin-profile-ready",
    onProfileReady
  );

  if (!pageReady) {
    window.addEventListener(
      "load",
      () => {
        pageReady = true;
        finish();
      },
      { once: true }
    );
  }

  finish();
}
/* ==========================================================
   5G88 SHARED GLOBAL LOADING
   Menggunakan spinner daripada new-ui.js
   ========================================================== */

async function withAdminLoading(
  task,
  message = "Please wait while fetching..."
) {
  if (typeof task !== "function") {
    throw new TypeError("Task must be a function");
  }

  if (typeof window.showGlobalLoading === "function") {
    window.showGlobalLoading(message, 150);
  }

  try {
    return await task();
  } finally {
    if (typeof window.hideGlobalLoading === "function") {
      window.hideGlobalLoading();
    }
  }
}

// Boleh dipanggil dari semua halaman admin.
window.withAdminLoading = withAdminLoading;

/* ==========================================
   5G88 SMART CONTENT LOADING V2
   ========================================== */


/* ==========================================================
   5G88 REFRESH LOADING - WAIT FOR FIREBASE
   ========================================================== */

function initSmartContentLoading() {
  const navigation =
    performance.getEntriesByType("navigation")[0];

  const isReload = navigation?.type === "reload";

  const refreshKey = "5g88.showRefreshLoading";
  const tabKey = "5g88.smartTabNavigation";

  const isTabRefresh =
    sessionStorage.getItem(refreshKey) === "1";

  const isTabNavigation =
    sessionStorage.getItem(tabKey) === "1";

  // Refresh menggunakan Global Overlay, bukan Smart Loader.
  if (isReload || isTabRefresh) {
    sessionStorage.removeItem(tabKey);
    return;
  }

  // Smart Loader hanya untuk navigation tab.
  if (!isTabNavigation) return;

  sessionStorage.removeItem(tabKey);

  const loader = document.createElement("div");
  loader.id = "smartContentLoader";

  Object.assign(loader.style, {
    position: "fixed",
    left: "0",
    right: "0",
    bottom: "0",
    top: "0",
    zIndex: "2147483646",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#000",
    pointerEvents: "auto"
  });

  loader.setAttribute("role", "status");
  loader.setAttribute("aria-live", "polite");

  // Kekalkan design 4 dots asal.
  loader.innerHTML = `
    <div class="smart-loading-box">
      <div class="smart-loading-dots">
        <span></span><span></span>
        <span></span><span></span>
      </div>
      <div class="smart-loading-text">
        Please wait while fetching...
      </div>
    </div>
  `;

  document.body.appendChild(loader);

  // Letakkan loader di bawah header dan tabbar.
  function updateContentPosition() {
    const tabBar = document.getElementById("tabBar");

    if (!tabBar) return;

    const rect = tabBar.getBoundingClientRect();

    loader.style.top =
      Math.max(0, rect.bottom) + "px";
  }

  updateContentPosition();

  window.addEventListener(
    "resize",
    updateContentPosition
  );

  let pageReady =
    document.readyState === "complete";

  let firebaseReady =
    !!currentAdminProfile;

  let finished = false;

  const errorTimer = setTimeout(() => {
    if (finished) return;

    const label = loader.querySelector(
      ".smart-loading-text"
    );

    if (label) {
      label.textContent =
        "Still loading. Please check your connection.";
    }
  }, 15000);

  function finishLoading() {
    if (finished || !pageReady || !firebaseReady) {
      return;
    }

    finished = true;

    clearTimeout(errorTimer);

    window.removeEventListener(
      "resize",
      updateContentPosition
    );

    window.removeEventListener(
      "5g88-admin-profile-ready",
      onProfileReady
    );

    loader.remove();
  }

  function onProfileReady() {
    firebaseReady = !!currentAdminProfile;
    finishLoading();
  }

  window.addEventListener(
    "5g88-admin-profile-ready",
    onProfileReady
  );

  if (!pageReady) {
    window.addEventListener(
      "load",
      () => {
        pageReady = true;
        finishLoading();
      },
      { once: true }
    );
  }

  finishLoading();
}

  /* ==========================================================
     INITIALIZE
     ========================================================== */
/* ==========================================================
   5G88 WHITE RELOAD SHIELD
   Tunggu header + tabbar + Firebase profile siap
   ========================================================== */

function initHardReloadReveal() {
  const root = document.documentElement;

  if (!root.classList.contains("fiveg88-hard-reload")) {
    return;
  }

  let pageLoaded = document.readyState === "complete";
  let profileLoaded = !!currentAdminProfile;
  let revealed = false;

  function tryReveal() {
    if (revealed || !pageLoaded || !profileLoaded) {
      return;
    }

    const shell = document.getElementById(
      "homepageSharedShell"
    );

    const header = shell?.querySelector(".header");

    const tabbar = document.getElementById("tabBar");

    if (!shell || !header || !tabbar) {
      return;
    }

    if (!header.isConnected || !tabbar.isConnected) {
      return;
    }

    revealed = true;

    window.removeEventListener(
      "5g88-admin-profile-ready",
      onProfileReady
    );

    // Tunggu layout header dan tabbar selesai.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove("fiveg88-hard-reload");
      });
    });
  }

  function onProfileReady() {
    profileLoaded = !!currentAdminProfile;
    tryReveal();
  }

  window.addEventListener(
    "5g88-admin-profile-ready",
    onProfileReady
  );

  if (!pageLoaded) {
    window.addEventListener(
      "load",
      () => {
        pageLoaded = true;
        tryReveal();
      },
      { once: true }
    );
  }

  tryReveal();

  setTimeout(() => {
    if (!revealed) {
      console.warn(
        "[5G88] White Reload Shield: waiting for shell or Firebase profile."
      );
    }
  }, 15000);
}
function init() {
  createShell();

  renderTabs();

  // White Shield untuk refresh browser.
  initHardReloadReveal();

  // Refresh halaman menggunakan Global Overlay.
  initAdminRefreshOverlay();

  // Pindah atau buka tab menggunakan Smart Content Loader.
  initSmartContentLoading();


  initFloatingFab();
  setupHeaderMore();
   
  renderDropdown(
      "gameLogDropdown",
      "gamelog"
    );

    renderDropdown(
      "bankResitDropdown",
      "bank"
    );

    renderDropdown(
      "gameLinksDropdown",
      "list"
    );

    renderSidebarTabs();

    setupDropdown(
      "gameLogBtn",
      "gameLogDropdown"
    );

setupDropdown(
  "bankResitBtn",
  "bankResitDropdown"
);

    setupDropdown(
      "gameLinksBtn",
      "gameLinksDropdown"
    );

    setupDirectButtons();

    setupSidebarSearch();

    setupHeaderSearch();

    setupEvents();

    applyTheme();

    renderUserInfo();
    updateHeaderUserFromFirebase(); 
    initUiVisibility();

    initNotifications();

initPasswordModals();
updateOpenIndicators();

updateHeaderActiveState();

    updateClock();

    setInterval(
      updateClock,
      30000
    );


    /*
     * Beritahu page JS bahawa
     * shared shell sudah siap.
     */
    document.dispatchEvent(
      new CustomEvent(
        "homepage-shared-ui-ready"
      )
    );
  }


  /* ==========================================================
     PUBLIC API
     ========================================================== */

window.HomepageSharedUI = {
  addTab,
  closeTab,
  navigateToTab,
  renderTabs,
  renderSidebarTabs,
  syncCurrentPageTab,
  getTabs,
  getCurrentFile,
  findPageByFile,
  closeSidebar,
  createSharedTabSearch,
  initTabBarSearch
};
window.createSharedTabSearch =
  createSharedTabSearch;

window.initTabBarSearch =
  initTabBarSearch;

  window.addTab = function(
    label,
    url,
    options = {}
  ) {

    if (
      typeof label === "object"
    ) {

      addTab(label);

      return;
    }


    let file = "";

    try {

      file =
        new URL(
          url,
          location.href
        )
          .pathname
          .split("/")
          .filter(Boolean)
          .pop() || "";

    } catch (_) {

      file =
        String(url || "")
          .split("/")
          .pop();
    }


    const page =
      findPageByFile(file);


    addTab(
      page || {
        file,
        name: label,
        group:
          options.group ||
          "none"
      }
    );
  };


  /* ==========================================================
     START
     ========================================================== */

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    init,
    { once: true }
  );
} else {
  init();
}

})();
