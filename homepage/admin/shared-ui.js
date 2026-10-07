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

   NO FIREBASE DEPENDENCY
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
      name: "LIVE CHAT",
      group: "main"
    },
    {
      file: "linkdownload.html",
      name: "LINK DOWNLOAD",
      group: "main"
    },
    {
      file: "item.html",
      name: "ITEM",
      group: "main"
    },

    {
      file: "mega888.html",
      name: "MEGA888",
      group: "gamelog"
    },
    {
      file: "pussy888.html",
      name: "PUSSY888",
      group: "gamelog"
    },
    {
      file: "918kiss.html",
      name: "918KISS",
      group: "gamelog"
    },
    {
      file: "scr888h5.html",
      name: "SCR888H5",
      group: "gamelog"
    },
    {
      file: "evo888.html",
      name: "EVO888",
      group: "gamelog"
    },

    {
      file: "maybank.html",
      name: "MAYBANK",
      group: "bank"
    },
    {
      file: "cimbclick.html",
      name: "CIMB BANK",
      group: "bank"
    },
    {
      file: "bankislam.html",
      name: "BANK ISLAM",
      group: "bank"
    },
    {
      file: "rhbbank.html",
      name: "RHB BANK",
      group: "bank"
    },
    {
      file: "maybank2u.html",
      name: "MAYBANK2U",
      group: "bank"
    },

    {
      file: "findgame.html",
      name: "FIND GAME",
      group: "list"
    },
    {
      file: "tipsgame.html",
      name: "TIPS GAME",
      group: "list"
    },
    {
      file: "logogame.html",
      name: "LOGO GAME",
      group: "list"
    },

    {
      file: "stickynotes.html",
      name: "STICKY NOTES",
      group: "tools"
    },
    {
      file: "typingtest.html",
      name: "TYPING TEST",
      group: "tools"
    },
    {
      file: "whatsapp.html",
      name: "WHATSAPP",
      group: "tools"
    },
    {
      file: "history.html",
      name: "HISTORY",
      group: "tools"
    }
  ];


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

  const ICON_CLOSE = `
    <svg viewBox="64 64 896 896"
         width="1em"
         height="1em"
         fill="currentColor"
         aria-hidden="true">
      <path d="M563.8 512l262.5-312.9
        c4.4-5.2.7-13.1-6.1-13.1h-79.8
        c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8
        295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203
        c-6.8 0-10.5 7.9-6.1 13.1L459.4 512
        196.9 824.9c-4.4 5.2-.7 13.1 6.1 13.1h79.8
        c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1
        216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8
        c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"/>
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

      /*
       * Support format lama:
       * { label, url, group }
       *
       * dan format baru:
       * { name, file, group }
       */
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


  function saveTabs(tabs) {
    localStorage.setItem(
      getTabsStorageKey(),
      JSON.stringify(
        Array.isArray(tabs)
          ? tabs
          : []
      )
    );
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

    /*
     * Kalau sudah tiada tab,
     * kembali homepage admin.
     */
    if (!tabs.length) {

      localStorage.removeItem(
        getActiveTabStorageKey()
      );

      window.location.href =
        "./index.html";

      return;
    }

    /*
     * Pilih tab berdekatan.
     */
    const nextTab =
      tabs[
        Math.min(
          index,
          tabs.length - 1
        )
      ];

    navigateToTab(nextTab);
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

    /*
     * Kalau user buka URL page secara direct,
     * auto add ke workspace tab.
     */
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

    if (
      document.getElementById(
        "homepageSharedShell"
      )
    ) {
      return;
    }

    const shell =
      document.createElement("div");

    shell.id =
      "homepageSharedShell";

    shell.innerHTML = `

      <div
        id="overlay"
        class="sidebar-overlay">
      </div>


      <aside
        id="sidebar"
        class="sidebar">

        <div class="sidebar-inner">

          <div class="sidebar-top">

            <div
              id="sidebarAccountSlot"
              class="sidebar-account-slot">
            </div>

            <div class="sidebar-search-wrap">
              <form
                id="sidebarSearchForm"
                autocomplete="off">

                <input
                  id="sidebarSearchInput"
                  class="sidebar-search-input"
                  type="text"
                  placeholder="Search menu...">

              </form>
            </div>

          </div>


          <div
            id="customSidebarTabs">
          </div>

        </div>


        <div class="sidebar-version-box">

          <div class="sidebar-version-left">
            <span class="sidebar-version-label">
              Version
            </span>

            <span id="sidebarVersionText">
              V2
            </span>
          </div>

          <div
            id="sidebarNotifSlot"
            class="sidebar-notif-slot">
          </div>

        </div>

      </aside>


      <header
        id="adminHeader"
        class="header">

        <button
          id="menuIcon"
          class="menu-icon"
          type="button"
          aria-label="Menu">

          ${ICON_MENU}

          <span
            id="menuNotifDot"
            class="menu-notif-dot">
          </span>

        </button>


        <button
          id="headerRefreshBtn"
          class="header-refresh-btn"
          type="button"
          title="Refresh">

          ${ICON_REFRESH}

        </button>


        <div
          id="headerLinks"
          class="header-links">

          <button
            id="linkDownloadBtn"
            class="live-chat-button"
            type="button">
            <span class="btn-label">
              LINK DOWNLOAD
            </span>
          </button>


          <div class="dropdown-wrapper">

            <button
              id="gameLogBtn"
              class="live-chat-button"
              type="button">

              <span class="btn-label">
                GAME LOG
              </span>

            </button>

            <div
              id="gameLogDropdown"
              class="dropdown-links">
            </div>

          </div>


          <div class="dropdown-wrapper">

            <button
              id="bankResitBtn"
              class="live-chat-button"
              type="button">

              <span class="btn-label">
                BANK
              </span>

            </button>

            <div
              id="bankDropdown"
              class="dropdown-links">
            </div>

          </div>


          <div class="dropdown-wrapper">

            <button
              id="gameLinksBtn"
              class="live-chat-button"
              type="button">

              <span class="btn-label">
                LIST
              </span>

            </button>

            <div
              id="gameLinksDropdown"
              class="dropdown-links">
            </div>

          </div>


          <button
            id="itemBtn"
            class="live-chat-button"
            type="button">

            <span class="btn-label">
              ITEM
            </span>

          </button>


          <button
            id="liveChatBtn"
            class="live-chat-button"
            type="button">

            <span class="btn-label">
              LIVE CHAT
            </span>

            <span
              id="livechatDot"
              class="dot-icon">
            </span>

          </button>

        </div>


        <div
          class="header-right-meta">

          <div
            id="headerTabSearch"
            class="header-tab-search">

            <form
              id="headerTabSearchForm"
              autocomplete="off">

              <div
                class="header-tab-search-input-wrap">

                <input
                  id="headerTabSearchInput"
                  class="header-tab-search-input"
                  type="text"
                  placeholder="Search tab...">

                <svg
                  id="headerTabSearchArrow"
                  class="header-tab-search-arrow"
                  viewBox="0 0 24 24">

                  <path
                    d="M9 18l6-6-6-6">
                  </path>

                </svg>

              </div>

            </form>

            <div
              id="headerTabSearchList"
              class="header-tab-search-list">
            </div>

          </div>


          <div class="user-info">

            <div class="user-text">

              <div
                id="dateTime"
                class="date-time">
              </div>


              <div
                id="desktopNotifSlot">
              </div>


              <div class="user-dropdown">

                <button
                  id="userButton"
                  class="user-button"
                  type="button">

                  <span id="userNameText">
                    Admin
                  </span>

                </button>


                <div
                  id="dropdownContent"
                  class="dropdown-content">

                  <div class="dropdown-user-top">

                    <span id="userEmail">
                      -
                    </span>

                    <div
                      class="mobile-notif-slot">
                    </div>

                  </div>

                  <hr>


                  <div class="theme-toggle-wrap">

                    <button
                      id="themeToggleBtn"
                      class="theme-toggle-btn"
                      type="button">

                      <span
                        class="theme-toggle-label">
                        Light Theme
                      </span>

                      <span
                        class="theme-toggle-switch">

                        <span
                          class="theme-toggle-knob">
                        </span>

                      </span>

                    </button>

                  </div>


                  <button
                    id="logoutBtn"
                    type="button">
                    Logout
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      </header>


      <div
        id="tabBar"
        class="tab-bar">
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
      <span class="check-icon">✓</span>
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
     RENDER TABS
     ========================================================== */

  function renderTabs() {

    const tabBar =
      document.getElementById(
        "tabBar"
      );

    if (!tabBar) return;

    tabBar.innerHTML = "";

    const tabs =
      getTabs();

    const currentFile =
      getCurrentFile();


    tabs.forEach(tab => {

      const element =
        document.createElement(
          "div"
        );

      element.className =
        "tab";

      element.dataset.file =
        tab.file;


      if (
        tab.file.toLowerCase() ===
        currentFile
      ) {

        element.classList.add(
          "active-tab"
        );
      }


      const title =
        document.createElement(
          "span"
        );

      title.textContent =
        String(
          tab.name ||
          tab.file
        )
          .toLowerCase()
          .replace(
            /\b\w/g,
            char =>
              char.toUpperCase()
          );


      const close =
        document.createElement(
          "button"
        );

      close.type =
        "button";

      close.className =
        "close-tab";

      close.title =
        "Close";

      close.setAttribute(
        "aria-label",
        "Close tab"
      );

      close.innerHTML =
        ICON_CLOSE;


      close.addEventListener(
        "click",
        event => {

          event.preventDefault();
          event.stopPropagation();

          closeTab(
            tab.file
          );
        }
      );


      element.addEventListener(
        "click",
        event => {

          if (
            event.target.closest(
              ".close-tab"
            )
          ) {
            return;
          }

          navigateToTab(tab);
        }
      );


      element.appendChild(
        title
      );

      element.appendChild(
        close
      );

      tabBar.appendChild(
        element
      );

    });


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


  function setupDropdown(
    buttonId,
    dropdownId
  ) {

    const button =
      document.getElementById(
        buttonId
      );

    const dropdown =
      document.getElementById(
        dropdownId
      );

    if (
      !button ||
      !dropdown
    ) {
      return;
    }


    button.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        const willOpen =
          !dropdown.classList.contains(
            "open"
          );

        closeHeaderDropdowns();

        if (willOpen) {

          const rect =
            button.getBoundingClientRect();

          dropdown.style.left =
            `${rect.left}px`;

          dropdown.classList.add(
            "open"
          );
        }

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
     HEADER TAB SEARCH
     ========================================================== */

  function setupHeaderSearch() {

    const wrap =
      document.getElementById(
        "headerTabSearch"
      );

    const input =
      document.getElementById(
        "headerTabSearchInput"
      );

    const list =
      document.getElementById(
        "headerTabSearchList"
      );

    const form =
      document.getElementById(
        "headerTabSearchForm"
      );

    const arrow =
      document.getElementById(
        "headerTabSearchArrow"
      );


    if (
      !wrap ||
      !input ||
      !list
    ) {
      return;
    }


    form?.addEventListener(
      "submit",
      event => {
        event.preventDefault();
      }
    );


    function hideList() {

      list.style.display =
        "none";

      wrap.classList.remove(
        "search-mode"
      );
    }


    function renderResults() {

      const keyword =
        input.value
          .trim()
          .toLowerCase();

      list.innerHTML = "";


      if (!keyword) {

        hideList();

        return;
      }


      const results =
        ADMIN_PAGES.filter(
          page =>
            page.name
              .toLowerCase()
              .includes(keyword)
        );


      if (!results.length) {

        hideList();

        return;
      }


      results.forEach(page => {

        const link =
          document.createElement(
            "a"
          );

        link.href =
          `./${page.file}`;

        link.textContent =
          page.name;


        link.addEventListener(
          "click",
          event => {

            event.preventDefault();

            addTab(page);

          }
        );


        list.appendChild(
          link
        );

      });


      const rect =
        input.getBoundingClientRect();

      list.style.left =
        `${rect.left}px`;

      list.style.top =
        `${rect.bottom + 4}px`;

      list.style.display =
        "flex";

      wrap.classList.add(
        "search-mode"
      );
    }


    input.addEventListener(
      "input",
      renderResults
    );


    arrow?.addEventListener(
      "click",
      () => {

        input.value = "";

        hideList();

        input.focus();

      }
    );


    document.addEventListener(
      "click",
      event => {

        if (
          !event.target.closest(
            "#headerTabSearch"
          )
        ) {

          hideList();
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

    let login = {};

    try {

      login =
        JSON.parse(
          localStorage.getItem(
            "gmailLogin"
          ) || "{}"
        );

    } catch (_) {}


    const email =
      String(
        login.email || ""
      ).trim();


    const name =
      String(
        login.name ||
        login.displayName ||
        ""
      ).trim();


    const userName =
      document.getElementById(
        "userNameText"
      );

    const userEmail =
      document.getElementById(
        "userEmail"
      );


    if (userName) {

      userName.textContent =
        name ||
        (
          email
            ? email.split("@")[0]
            : "Admin"
        );
    }


    if (userEmail) {

      userEmail.textContent =
        email || "-";
    }
  }


  /* ==========================================================
     CLOCK
     ========================================================== */

  function updateClock() {

    const element =
      document.getElementById(
        "dateTime"
      );

    if (!element) return;


    const now =
      new Date();


    element.textContent =
      now.toLocaleString(
        undefined,
        {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        }
      );
  }


  /* ==========================================================
     LOGOUT
     ========================================================== */

  function handleLogout() {

    /*
     * Kalau admin.js mempunyai Firebase logout,
     * biar admin.js handle melalui custom event.
     */

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
      .getElementById(
        "headerRefreshBtn"
      )
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
     INITIALIZE
     ========================================================== */

  function init() {

    createShell();

    renderDropdown(
      "gameLogDropdown",
      "gamelog"
    );

    renderDropdown(
      "bankDropdown",
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
      "bankDropdown"
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

    syncCurrentPageTab();

    renderTabs();

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
    closeSidebar
  };


  /*
   * Compatibility.
   * Existing HTML/admin.js mungkin masih
   * memanggil addTab().
   */
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
