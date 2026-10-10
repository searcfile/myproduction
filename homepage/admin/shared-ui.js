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
      file: "livechat.html",
      name: "Live Chat",
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
         viewBox="0 0 24 24"
         fill="currentColor"
         aria-hidden="true">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  `;


  /* ==========================================================
     USER STORAGE
     ========================================================== */

  function getCurrentUserStorageSuffix() {
    try {
      const login = JSON.parse(
        localStorage.getItem("gmailLogin") || "{}"
      );

      const email = String(login.email || "")
        .trim()
        .toLowerCase();

      if (!email) return "guest";

      return email.replace(/[^a-z0-9]/g, "_");

    } catch (_) {
      return "guest";
    }
  }


  function getTabsStorageKey() {
    return `openTabs_${getCurrentUserStorageSuffix()}`;
  }


  function getActiveTabStorageKey() {
    return `activeTabUrl_${getCurrentUserStorageSuffix()}`;
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
    try {
      const login = JSON.parse(localStorage.getItem("gmailLogin") || "{}");
      const email = String(login.email || "").trim().toLowerCase();
      if (!email) return "";
      return `users/${email.replace(/\./g, "_")}/mainOpenTabs`;
    } catch (_) {
      return "";
    }
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
    const finalTabs = Array.isArray(tabs) ? tabs : [];

    localStorage.setItem(
      getTabsStorageKey(),
      JSON.stringify(finalTabs)
    );

    syncTabsToFirebase(finalTabs);
  }


  function getActiveFile() {
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

    setActiveFile(tab.file);

    sessionStorage.setItem(
      "adminShowContentLoading",
      "1"
    );

    window.location.href =
      `./${tab.file}`;
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
      tabs.push(tab);
    } else {
      tabs[index] = {
        ...tabs[index],
        ...tab
      };
    }

setActiveFile(tab.file);

saveTabs(tabs);

navigateToTab(tab);
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

    saveTabs(tabs);

    /*
     * Kalau close tab yang BUKAN active,
     * jangan pindah page.
     */
    if (!wasActive) {
      renderTabs();
      renderSidebarTabs();
      updateHeaderActiveState();
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

const nextTab =
  tabs[
    Math.min(
      index,
      tabs.length - 1
    )
  ];

setActiveFile(nextTab.file);

syncTabsToFirebase(tabs);

navigateToTab(nextTab);
  }

function initDefaultWorkspace() {

  // Hanya jalankan restore dari index.html
  if (getCurrentFile() !== "index.html") {
    return false;
  }

  // Selepas close tab terakhir, paparkan
  // workspace kosong sekali dahulu.
  if (
    sessionStorage.getItem(
      EMPTY_WORKSPACE_ONCE_KEY
    ) === "1"
  ) {
    sessionStorage.removeItem(
      EMPTY_WORKSPACE_ONCE_KEY
    );

    return false;
  }

  const tabs = getTabs();

  // Kalau semua tab kosong, buka Live Chat.
  if (!tabs.length) {

    saveTabs([{ ...DEFAULT_ADMIN_TAB }]);

    setActiveFile(DEFAULT_ADMIN_TAB.file);

    window.location.replace(
      "./livechat.html"
    );

    return true;
  }

  // Kalau ada tab tersimpan, cari tab aktif terakhir.
  const lastFile = getActiveFile();

  const lastTab = tabs.find(
    tab =>
      tab.file.toLowerCase() ===
      lastFile.toLowerCase()
  );

  // Kalau tab aktif terakhir sudah ditutup,
  // gunakan tab terbuka yang terakhir.
  const targetTab =
    lastTab || tabs[tabs.length - 1];

  if (!targetTab?.file) {
    return false;
  }

  setActiveFile(targetTab.file);

  window.location.replace(
    `./${targetTab.file}`
  );

  return true;
}
  /* ==========================================================
     SYNC CURRENT PAGE
     ========================================================== */

  function syncCurrentPageTab() {
    const currentFile =
      getCurrentFile();

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

  // Elak duplicate kalau shell sudah dibuat
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

      <div
        id="sidebarAccountSlot"
        class="sidebar-account-slot">
      </div>

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

    <div id="customSidebarTabs"></div>

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

<form
  id="headerTabSearchForm"
  autocomplete="off"
  onsubmit="return false;">
        <div class="header-tab-search-input-wrap">

          <input
            id="headerTabSearchInput"
            class="header-tab-search-input"
            type="text"
            name="header_tab_search_no_autofill_923"
            placeholder="Select Tab"
            autocomplete="new-password"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            inputmode="search"
            readonly
            onfocus="this.removeAttribute('readonly');"
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
      type="text"
      placeholder="Select Tab"
      autocomplete="off"
      aria-label="Search tabs"
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

          <div class="dropdown-user-top">
            <div id="userEmail"></div>
          </div>

          <hr style="
            border:0;
            border-top:1px solid #424242;
            margin:8px 0;
          ">


          <button
            id="themeToggleBtn"
            type="button"
            class="theme-toggle-btn"
            aria-label="Toggle theme"
            title="Toggle theme">

            <span
              id="themeToggleLabel"
              class="theme-toggle-label">
              Light Mode
            </span>

            <span
              id="themeToggleSwitch"
              class="theme-toggle-switch">

              <span
                id="themeToggleKnob"
                class="theme-toggle-knob">
              </span>

            </span>

          </button>


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
        class="cp-btn"
        id="cpCancel">
        Cancel
      </button>

      <button
        class="cp-btn primary"
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
        type="button">
        Cancel
      </button>

      <button
        id="cp2Submit"
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

    ADMIN_PAGES
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

    const container =
      document.getElementById(
        "customSidebarTabs"
      );

    if (!container) return;

    container.innerHTML = "";

    ADMIN_PAGES.forEach(page => {

      const link =
        document.createElement("a");

      link.href =
        `./${page.file}`;

      link.dataset.file =
        page.file;

      link.innerHTML = `
        <span class="sidebar-link-left">
          <span class="sidebar-link-text">
            ${page.name}
          </span>
        </span>

        ${ICON_ARROW}
      `;

      link.addEventListener(
        "click",
        event => {

          event.preventDefault();

          addTab(page);

        }
      );

      container.appendChild(link);

    });

    updateOpenIndicators();
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
      ADMIN_PAGES.filter(page => {

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

  function renderTabs() {
    const tabBar = document.getElementById("tabBar");
    if (!tabBar) return;

    tabBar.innerHTML = "";

    const tabs = getTabs();
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
      if (getCurrentFile() === tab.file.toLowerCase()) {
        window.location.reload();
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
        if (event.target.closest("button")) return;
        navigateToTab(tab);
      });

      tabList.appendChild(element);
    });

    tabBar.append(tabList, moreWrap);

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

requestAnimationFrame(updateMoreTabs);

initWorkspaceTabDrag(tabList);

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

  function setupSidebarSearch() {

    const input =
      document.getElementById(
        "sidebarSearchInput"
      );

    const form =
      document.getElementById(
        "sidebarSearchForm"
      );

    if (!input) return;


    form?.addEventListener(
      "submit",
      event => {
        event.preventDefault();
      }
    );


    input.addEventListener(
      "input",
      () => {

        const keyword =
          input.value
            .trim()
            .toLowerCase();


        document
          .querySelectorAll(
            "#customSidebarTabs a"
          )
          .forEach(link => {

            const text =
              link.textContent
                .trim()
                .toLowerCase();

            link.style.display =
              text.includes(keyword)
                ? ""
                : "none";
          });

      });
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
const mobileInputWrap = mobileInput?.closest(
  ".header-tab-search-mobile-input-wrap"
);

const mobileClearIcon = mobileInputWrap?.querySelector(
  ".mobile-icon-clear"
);
  if (!wrap || !input || !list || !panel || !mobileInput) return;

  const mobileQuery = window.matchMedia("(max-width:815px)");

  const isMobile = () => mobileQuery.matches;
  const isListOpen = () => list.style.display === "block";

  form?.addEventListener("submit", e => e.preventDefault());

function updateMobileInputIcon() {
  if (!mobileInputWrap) return;

  mobileInputWrap.classList.toggle(
    "has-value",
    mobileInput.value.length > 0
  );

  mobileInputWrap.classList.toggle(
    "is-focused",
    document.activeElement === mobileInput
  );
}

mobileInput.addEventListener("focus", updateMobileInputIcon);
mobileInput.addEventListener("blur", updateMobileInputIcon);
mobileClearIcon?.addEventListener("mousedown", event => {
  event.preventDefault();
});


  function hideList() {
    list.style.display = "none";
    list.innerHTML = "";
    wrap.classList.remove("search-mode");
  }

function closePanel() {
  hideList();
  panel.hidden = true;
  mobileBtn?.setAttribute("aria-expanded", "false");
  mobileBtn?.classList.remove("is-open");
}


function positionPanel() {
  if (!mobileBtn) return;

  const rect = mobileBtn.getBoundingClientRect();

  const viewportWidth = window.innerWidth;
  const width = Math.max(
    0,
    Math.min(345, viewportWidth - 16)
  );

  // Responsive panel width
  panel.style.width = "100%";
  panel.style.minWidth = "min(150px, calc(100vw - 16px))";
  panel.style.maxWidth = `${width}px`;

  // Pastikan panel tidak keluar viewport
  const left = Math.max(
    8,
    Math.min(rect.left, viewportWidth - width - 8)
  );

  panel.style.left = `${left}px`;
  panel.style.top = `${rect.bottom + 8}px`;
}


  function positionList() {
    const anchor = isMobile() ? mobileInput : input;
    const rect = anchor.getBoundingClientRect();

    const width = isMobile()
      ? Math.min(panel.getBoundingClientRect().width - 24, window.innerWidth - 16)
      : Math.max(150, rect.width);

    list.style.width = `${width}px`;
    list.style.left = `${Math.max(
      8,
      Math.min(rect.left, window.innerWidth - width - 8)
    )}px`;

    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const availableHeight = Math.max(100, spaceBelow);

    list.style.maxHeight = `${Math.min(260, availableHeight)}px`;
    list.style.top = `${rect.bottom + 5}px`;
  }

  function renderResults(showAll = false) {
    const searchInput = isMobile() ? mobileInput : input;
    const keyword = searchInput.value.trim().toLowerCase();

    list.innerHTML = "";

    if (!showAll && !keyword) {
      hideList();
      return;
    }

    const results = ADMIN_PAGES.filter(page =>
      page.name.toLowerCase().includes(keyword)
    );

    if (!results.length) {
      hideList();
      return;
    }

    results.forEach(page => {
      const link = document.createElement("a");

      link.href = `./${page.file}`;
      link.textContent = page.name;

      link.addEventListener("click", e => {
        e.preventDefault();
        closePanel();
        addTab(page);
      });

      list.appendChild(link);
    });

    positionList();
    list.style.display = "block";
    wrap.classList.add("search-mode");
  }

  // DESKTOP
  input.addEventListener("input", () => renderResults(false));

  arrow?.addEventListener("click", () => {
    input.value = "";
    hideList();
    input.focus();
  });

  // MOBILE: klik icon, buka panel input sahaja
  mobileBtn?.addEventListener("click", e => {
    e.stopPropagation();

    if (!panel.hidden) {
      closePanel();
      return;
    }

hideList();
mobileInput.value = "";
updateMobileInputIcon();
positionPanel();
panel.hidden = false;
    mobileBtn.setAttribute("aria-expanded", "true");
     mobileBtn.classList.add("is-open");
  });

  // MOBILE: klik input, baru paparkan senarai
  mobileInput.addEventListener("focus", () => {
    renderResults(true);
  });

  mobileInput.addEventListener("click", () => {
    renderResults(true);
  });

mobileInput.addEventListener("input", () => {
  updateMobileInputIcon();
  renderResults(true);
});

   

/* TUTUP SELECT TAB BILA KLIK LUAR */

document.addEventListener("pointerdown", event => {
  const target = event.target;

  if (panel.hidden && !isListOpen()) return;

  if (
    mobileBtn?.contains(target) ||
    panel.contains(target) ||
    list.contains(target)
  ) {
    return;
  }

  closePanel();
});

/* TUTUP BILA TEKAN ESCAPE */

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closePanel();
  }
});

function clearMobileSearch(event) {
  event.preventDefault();
  event.stopPropagation();

  mobileInput.value = "";
  mobileInput.focus();

  updateMobileInputIcon();
  renderResults(true);
}

mobileClearIcon?.addEventListener(
  "click",
  clearMobileSearch
);

mobileClearIcon?.addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === " ") {
    clearMobileSearch(event);
  }
});
}


  /* ==========================================================
     THEME
     ========================================================== */

  function applyTheme() {

    const saved =
      localStorage.getItem(
        "adminTheme"
      ) || "dark";

    document.body.classList.toggle(
      "light-theme",
      saved === "light"
    );


    const label =
      document.querySelector(
        ".theme-toggle-label"
      );

    if (label) {

      label.textContent =
        saved === "light"
          ? "Dark Theme"
          : "Light Theme";
    }
  }


  function toggleTheme() {

    const isLight =
      document.body.classList.contains(
        "light-theme"
      );

    localStorage.setItem(
      "adminTheme",
      isLight
        ? "dark"
        : "light"
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
    displayName = "Admin";
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


  /* ==========================================================
     CLOCK
     ========================================================== */

  function updateClock() {
    const element = document.getElementById("dateTime");
    if (!element) return;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    element.textContent =
      `Kuala_Lumpur: ${hours}:${minutes} ${monthNames[now.getMonth()]} ${day}`;
  }


  /* ==========================================================
     LOGOUT
     ========================================================== */

  function handleLogout() {
    const event =
      new CustomEvent(
        "homepage-admin-logout",
        {
          cancelable: true
        }
      );


    const allowed =
      document.dispatchEvent(
        event
      );


    if (!allowed) {
      return;
    }


    /*
     * Fallback jika page tidak load admin.js.
     */
    localStorage.removeItem(
      "gmailLogin"
    );

    window.location.href =
      "./login.html";
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
            "adminShowContentLoading",
            "1"
          );
sessionStorage.setItem(
  "smartForceLoading",
  "1"
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
      .getElementById(
        "themeToggleBtn"
      )
      ?.addEventListener(
        "click",
        toggleTheme
      );


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

  function setBtnLoading(button, loading, label) {
    if (!button) return;
    button.disabled = !!loading;
    button.textContent = label;
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
      if (!errBox || !okBox) return;
      errBox.textContent = message;
      errBox.style.display = "block";
      okBox.style.display = "none";
    };

    const showOk = message => {
      if (!errBox || !okBox) return;
      okBox.textContent = message;
      okBox.style.display = "block";
      errBox.style.display = "none";
    };

    const closePw = () => {
      if (modal) modal.style.display = "none";
      setBtnLoading(submit, false, "Change");
      if (cancel) cancel.disabled = false;
    };

    const openPw = () => {
      if (!modal) return;

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

      modal.style.display = "flex";
      setTimeout(() => oldInput?.focus(), 0);
    };

    const changePw = async () => {
      if (!sharedDb) {
        showErr("Firebase database is not ready.");
        return;
      }

      const oldPw = oldInput?.value.trim() || "";
      const newPw = newInput?.value.trim() || "";
      const newPw2 = confirmInput?.value.trim() || "";

      if (!oldPw || !newPw || !newPw2) return showErr("All fields are required to be filled in.");
      if (newPw.length < 6) return showErr("New password must be at least 6 characters.");
      if (newPw !== newPw2) return showErr("Confirm password does not match.");
      if (newPw === oldPw) return showErr("New password cannot be the same as current.");

      setBtnLoading(submit, true, "Change...");
      if (cancel) cancel.disabled = true;

      try {
        const login = JSON.parse(localStorage.getItem("gmailLogin") || "{}");
        const email = String(login.email || "").toLowerCase();

        if (!email.endsWith("@5g88.local")) {
          return showErr("This account type cannot change password here.");
        }

        const uname = email.split("@")[0];
        const ref = sharedDb.ref(`logins/user_accounts/${uname}`);
        const snap = await ref.get();

        if (!snap.exists()) return showErr("Username does not exist.");

        const user = snap.val();
        if (user.active === false) return showErr("This account is deactivated.");

        if (await sha256Hex(oldPw) !== user.passwordHash) {
          return showErr("Wrong current password.");
        }

        await ref.update({
          passwordHash: await sha256Hex(newPw),
          updatedAt: Date.now(),
          passwordVersion: (user.passwordVersion || 0) + 1
        });

        showOk("Password changed successfully.");
        await new Promise(resolve => setTimeout(resolve, 1200));

        localStorage.removeItem("gmailLogin");
        window.location.href = "./login.html?pw_changed=1";

      } catch (err) {
        showErr("Failed to change password. " + (err?.message || ""));
      } finally {
        if (modal?.style.display !== "none" && okBox?.style.display !== "block") {
          setBtnLoading(submit, false, "Change");
          if (cancel) cancel.disabled = false;
        }
      }
    };

    btn?.addEventListener("click", openPw);
    closeX?.addEventListener("click", closePw);
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
      if (!err2 || !ok2) return;
      err2.textContent = message;
      err2.style.display = "block";
      ok2.style.display = "none";
    };

    const closePw2 = () => {
      if (modal2) modal2.style.display = "none";
      setBtnLoading(submit2, false, "Save");
      if (cancel2) cancel2.disabled = false;
    };

    const openPw2 = () => {
      if (!modal2) return;

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

      modal2.style.display = "flex";
      setTimeout(() => old2?.focus(), 0);
    };

    const changePw2 = async () => {
      if (!sharedDb) {
        showErr2("Firebase database is not ready.");
        return;
      }

      const oldPw = old2?.value.trim() || "";
      const newPw = new2?.value.trim() || "";
      const newPw2 = confirm2?.value.trim() || "";

      if (!/^\d{6}$/.test(oldPw)) return showErr2("Current 2nd password must be 6 digits.");
      if (!/^\d{6}$/.test(newPw)) return showErr2("New 2nd password must be 6 digits.");
      if (newPw !== newPw2) return showErr2("Confirm 2nd password does not match.");
      if (newPw === oldPw) return showErr2("New 2nd password cannot be the same as current.");

      setBtnLoading(submit2, true, "Save...");
      if (cancel2) cancel2.disabled = true;

      try {
        const login = JSON.parse(localStorage.getItem("gmailLogin") || "{}");
        const email = String(login.email || "").toLowerCase();

        if (!email.endsWith("@5g88.local")) {
          return showErr2("This account type cannot change 2nd password here.");
        }

        const uname = email.split("@")[0];
        const ref = sharedDb.ref(`logins/user_accounts/${uname}`);
        const snap = await ref.get();

        if (!snap.exists()) return showErr2("Username does not exist.");

        const user = snap.val();
        if (user.active === false) return showErr2("This account is deactivated.");
        if (!user.secondPasswordHash) return showErr2("2nd password is not set. Please contact admin.");

        if (await sha256Hex(oldPw) !== user.secondPasswordHash) {
          return showErr2("Wrong current 2nd password.");
        }

        await ref.update({
          secondPasswordHash: await sha256Hex(newPw),
          secondPasswordUpdatedAt: Date.now(),
          secondPasswordVersion: (user.secondPasswordVersion || 0) + 1
        });

        if (ok2 && err2) {
          ok2.textContent = "2nd password changed successfully.";
          ok2.style.display = "block";
          err2.style.display = "none";
        }

        await new Promise(resolve => setTimeout(resolve, 1200));
        closePw2();

      } catch (err) {
        showErr2("Failed to change 2nd password. " + (err?.message || ""));
      } finally {
        if (modal2?.style.display !== "none" && ok2?.style.display !== "block") {
          setBtnLoading(submit2, false, "Save");
          if (cancel2) cancel2.disabled = false;
        }
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
    close2?.addEventListener("click", closePw2);
    cancel2?.addEventListener("click", closePw2);
    submit2?.addEventListener("click", changePw2);

    window.addEventListener("click", event => {
      if (event.target === modal) closePw();
      if (event.target === modal2) closePw2();
    });
  }
/* ==========================================
   5G88 SMART CONTENT LOADING
   ========================================== */

/* ==========================================
   5G88 SMART CONTENT LOADING V2
   ========================================== */

function initSmartContentLoading() {
  const file = getCurrentFile();
  const cacheKey = `smartLoaded:${file}`;
  const cacheDuration = 60 * 1000;

  const navigation =
    performance.getEntriesByType("navigation")[0];

  const isReload = navigation?.type === "reload";

  const forceLoading =
    sessionStorage.getItem("smartForceLoading") === "1";

  sessionStorage.removeItem("smartForceLoading");

  const lastLoaded = Number(
    sessionStorage.getItem(cacheKey) || 0
  );

  const recentlyLoaded =
    lastLoaded > 0 &&
    Date.now() - lastLoaded < cacheDuration;

  const shouldLoad =
    isReload || forceLoading || !recentlyLoaded;

  if (!shouldLoad) return;

  // Letak loader terus pada body supaya
  // semua halaman boleh menggunakannya.
  let loader = document.getElementById(
    "smartContentLoader"
  );

  if (!loader) {
    loader = document.createElement("div");
    loader.id = "smartContentLoader";
    loader.className = "smart-content-loader";

    loader.setAttribute("role", "status");
    loader.setAttribute("aria-live", "polite");

    loader.innerHTML = `
      <div class="smart-loading-box">
        <div class="smart-loading-dots">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div class="smart-loading-text">
          Please wait while fetching...
        </div>
      </div>
    `;

    document.body.appendChild(loader);
  }

  // Kira kedudukan bawah tab bar sebenar.
  function updatePosition() {
    const tabBar = document.getElementById("tabBar");
    const header = document.querySelector(
      "#homepageSharedShell .header"
    );

    const anchor = tabBar || header;

    const top = anchor
      ? anchor.getBoundingClientRect().bottom
      : 110;

    loader.style.top = `${Math.max(0, top)}px`;
  }

  updatePosition();

  window.addEventListener("resize", updatePosition);

  let finished = false;
  const started = performance.now();

  function finishLoading() {
    if (finished) return;
    finished = true;

    // Minimum masa untuk nampak animasi.
    const remaining = Math.max(
      0,
      650 - (performance.now() - started)
    );

    setTimeout(() => {
      loader.remove();

      window.removeEventListener(
        "resize",
        updatePosition
      );

      sessionStorage.setItem(
        cacheKey,
        String(Date.now())
      );
    }, remaining);
  }

  if (document.readyState === "complete") {
    finishLoading();
  } else {
    window.addEventListener(
      "load",
      finishLoading,
      { once: true }
    );
  }

  // Elakkan loader tersekat selamanya.
  setTimeout(finishLoading, 5000);
}
  /* ==========================================================
     INITIALIZE
     ========================================================== */

function init() {

  if (initDefaultWorkspace()) {
    return;
  }

  createShell();
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

    initUiVisibility();

    initNotifications();

    initPasswordModals();

    syncCurrentPageTab();

renderTabs();

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

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once: true
      }
    );

  } else {

    init();
  }

})();
