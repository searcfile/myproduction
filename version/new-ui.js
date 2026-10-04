/* =========================================================
   SHARED UI
   Reusable for all admin pages
========================================================= */

(function () {

  "use strict";
   /* =======================================================
   ADMIN GLOBAL THEME
======================================================= */
const ADMIN_THEME_KEY =
  "adminGlobalTheme";


function getAdminTheme() {

  const savedTheme =
    localStorage.getItem(
      ADMIN_THEME_KEY
    );

  return savedTheme === "light"
    ? "light"
    : "dark";

}


function applyAdminTheme(
  theme,
  save = true
) {

  const finalTheme =
    theme === "light"
      ? "light"
      : "dark";


  document.documentElement
    .setAttribute(
      "data-admin-theme",
      finalTheme
    );


  if (save) {

    localStorage.setItem(
      ADMIN_THEME_KEY,
      finalTheme
    );

  }


  /*
    Sync every theme switch
    that currently exists.
  */

  document
    .querySelectorAll(
      "[data-admin-theme-switch]"
    )
    .forEach(
      themeSwitch => {

        const isDark =
          finalTheme === "dark";


        themeSwitch.classList.toggle(
          "checked",
          isDark
        );


        themeSwitch.setAttribute(
          "aria-checked",
          String(isDark)
        );


        const text =
          themeSwitch.querySelector(
            ".admin-theme-switch-text"
          );


        if (text) {

          text.textContent =
            isDark
              ? "Dark Mode"
              : "Light Mode";

        }

      }
    );

}


/*
  Apply saved theme immediately.
*/

applyAdminTheme(
  getAdminTheme(),
  false
);


/*
  Make available globally if another
  admin script needs it later.
*/

window.applyAdminTheme =
  applyAdminTheme;

window.getAdminTheme =
  getAdminTheme;
/* =======================================================
   ADMIN WORKSPACE FRAME MODE
======================================================= */

const ADMIN_IS_WORKSPACE_FRAME =
  new URLSearchParams(
    window.location.search
  ).get("workspace") === "1";


if (ADMIN_IS_WORKSPACE_FRAME) {

  document.documentElement.classList.add(
    "admin-workspace-frame-page"
  );

}

  /* =======================================================
     ESCAPE TEXT
  ======================================================= */

  function escapeSharedText(
    value
  ) {

    return String(
      value ?? ""
    )
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );

  }


  /* =======================================================
     SIZE CLASS
  ======================================================= */

  function getSharedSizeClass(
    size
  ) {

    return (
      size === "small" ||
      size === "large"
    )
      ? size
      : "";

  }


  /* =======================================================
     EMPTY STATE
  ======================================================= */

function createEmptyState(
  text = "No data",
  size = "",
  align = ""
) {

    const safeText =
      escapeSharedText(
        text
      );


    const sizeClass =
      getSharedSizeClass(
        size
      );

const alignClass =
  align === "center"
    ? "shared-center"
    : align === "left"
      ? "shared-left"
      : "";
    return `
      <div
        class="shared-empty ${sizeClass} ${alignClass}"
      >

        <div
          class="shared-empty-image"
        >

          <svg
            width="64"
            height="41"
            viewBox="0 0 64 41"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >

            <title>
              No data
            </title>


            <g
              transform="translate(0 1)"
              fill="none"
              fill-rule="evenodd"
            >

              <ellipse
                fill="#272727"
                cx="32"
                cy="33"
                rx="32"
                ry="7"
              />


              <g
                fill-rule="nonzero"
                stroke="#3e3e3e"
              >

                <path
                  d="M55 12.76L44.854 1.258C44.367.474 43.656 0 42.907 0H21.093c-.749 0-1.46.474-1.947 1.257L9 12.761V22h46v-9.24z"
                />


                <path
                  d="M41.613 15.931c0-1.605.994-2.93 2.227-2.931H55v18.137C55 33.26 53.68 35 52.05 35h-40.1C10.32 35 9 33.259 9 31.137V13h11.16c1.233 0 2.227 1.323 2.227 2.928v.022c0 1.605 1.005 2.901 2.237 2.901h14.752c1.232 0 2.237-1.308 2.237-2.913v-.007z"
                  fill="#1d1d1d"
                />

              </g>

            </g>

          </svg>

        </div>


        <div
          class="shared-empty-text"
        >
          ${safeText}
        </div>

      </div>
    `;

  }


  /* =======================================================
     LOADING STATE
  ======================================================= */

  function createLoadingState(
    text = "Loading...",
    size = ""
  ) {

    const safeText =
      escapeSharedText(
        text
      );


    const sizeClass =
      getSharedSizeClass(
        size
      );


    return `
      <div
        class="shared-loading ${sizeClass}"
        role="status"
        aria-live="polite"
      >

<div
  class="shared-loading-dots"
  aria-hidden="true"
>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
</div>


${
  safeText
    ? `
        <div
          class="shared-loading-text"
        >
          ${safeText}
        </div>
      `
    : ""
}

      </div>
    `;

  }


  /* =======================================================
     SET EMPTY DIRECTLY
  ======================================================= */

function showEmptyState(
  target,
  text = "No data",
  size = "",
  align = ""
) {

    const element =
      typeof target === "string"
        ? document.querySelector(
            target
          )
        : target;


    if (
      !element
    ) {
      return;
    }


element.innerHTML =
  createEmptyState(
    text,
    size,
    align
  );

  }


  /* =======================================================
     SET LOADING DIRECTLY
  ======================================================= */

  function showLoadingState(
    target,
    text = "Loading...",
    size = ""
  ) {

    const element =
      typeof target === "string"
        ? document.querySelector(
            target
          )
        : target;


    if (
      !element
    ) {
      return;
    }


    element.innerHTML =
      createLoadingState(
        text,
        size
      );

  }


  /* =======================================================
     CLEAR CONTENT
  ======================================================= */

  function clearSharedState(
    target
  ) {

    const element =
      typeof target === "string"
        ? document.querySelector(
            target
          )
        : target;


    if (
      !element
    ) {
      return;
    }


    element.innerHTML = "";

  }


  /* =======================================================
     SHARED SEARCHABLE DROPDOWN
  ======================================================= */

  function createSharedDropdown(
    target,
    options = {}
  ) {

    const select =
      typeof target === "string"
        ? document.querySelector(target)
        : target;


    if (
      !select ||
      select.tagName !== "SELECT"
    ) {
      return null;
    }


    /* PREVENT DOUBLE INIT */

    if (
      select.dataset.sharedDropdown ===
      "true"
    ) {

      return (
        select._sharedDropdown ||
        null
      );

    }


    const config = {

      placeholder:
        options.placeholder ||
        select.dataset.placeholder ||
        "Select option",

      emptyText:
        options.emptyText ||
        "No data"

    };


    /* =====================================================
       ICONS
    ===================================================== */

    const arrowIcon = `
      <svg
        viewBox="0 0 1024 1024"
        aria-hidden="true"
      >
        <path
          d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"
          fill="currentColor"
        />
      </svg>
    `;


    const searchIcon = `
      <svg
        viewBox="0 0 1024 1024"
        aria-hidden="true"
      >
        <path
          d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"
          fill="currentColor"
        />
      </svg>
    `;

const clearIcon = `
  <svg
    viewBox="0 0 1024 1024"
    aria-hidden="true"
  >
    <path
      d="M512 64c247.4 0 448 200.6 448 448S759.4 960 512 960 64 759.4 64 512 264.6 64 512 64zm127.98 274.82h-.04l-.08.06L512 466.75 384.14 338.88c-.04-.05-.06-.06-.08-.06a.12.12 0 00-.07 0c-.03 0-.05.01-.09.05l-45.02 45.02a.2.2 0 00-.05.09.12.12 0 000 .07v.02a.27.27 0 00.06.06L466.75 512 338.88 639.86c-.05.04-.06.06-.06.08a.12.12 0 000 .07c0 .03.01.05.05.09l45.02 45.02a.2.2 0 00.09.05.12.12 0 00.07 0c.02 0 .04-.01.08-.05L512 557.25l127.86 127.87c.04.04.06.05.08.05a.12.12 0 00.07 0c.03 0 .05-.01.09-.05l45.02-45.02a.2.2 0 00.05-.09.12.12 0 000-.07v-.02a.27.27 0 00-.05-.06L557.25 512l127.87-127.86c.04-.04.05-.06.05-.08a.12.12 0 000-.07c0-.03-.01-.05-.05-.09l-45.02-45.02a.2.2 0 00-.09-.05.12.12 0 00-.07 0z"
      fill="currentColor"
    />
  </svg>
`;
    /* =====================================================
       WRAPPER
    ===================================================== */

    const wrapper =
      document.createElement("div");


    wrapper.className =
      "shared-dropdown";


    /* =====================================================
       TRIGGER
    ===================================================== */

    const trigger =
      document.createElement("div");


    trigger.className =
      "shared-dropdown-trigger";


    /* INPUT */

    const input =
      document.createElement("input");


    input.type =
      "text";


    input.className =
      "shared-dropdown-input";


    input.placeholder =
      config.placeholder;


    input.autocomplete =
      "off";


    input.spellcheck =
      false;


    input.setAttribute(
      "aria-haspopup",
      "listbox"
    );


    input.setAttribute(
      "aria-expanded",
      "false"
    );


    /* ICON */

    const icon =
      document.createElement("span");


    icon.className =
      "shared-dropdown-icon";


    icon.innerHTML =
      arrowIcon;
     
let isHovering =
  false;

    trigger.appendChild(
      input
    );


    trigger.appendChild(
      icon
    );


    /* =====================================================
       PANEL
    ===================================================== */

    const panel =
      document.createElement("div");


    panel.className =
      "shared-dropdown-panel";


    const optionList =
      document.createElement("div");


    optionList.className =
      "shared-dropdown-options";


    optionList.setAttribute(
      "role",
      "listbox"
    );


    panel.appendChild(
      optionList
    );


    /* =====================================================
       INSERT
    ===================================================== */

    select.parentNode.insertBefore(
      wrapper,
      select
    );


    wrapper.appendChild(
      select
    );


    wrapper.appendChild(
      trigger
    );


    wrapper.appendChild(
      panel
    );


    select.classList.add(
      "shared-dropdown-native"
    );


    select.dataset.sharedDropdown =
      "true";

/* =====================================================
   UPDATE RIGHT ICON
===================================================== */

function updateIcon() {

  const isOpen =
    wrapper.classList.contains(
      "open"
    );


  const hasSearchText =
    input.value.trim() !== "";


  const hasSelectedValue =
    select.value !== "";


  /*
    OPEN + USER TYPING
    = ALWAYS CLEAR
  */

  if (
    isOpen &&
    hasSearchText
  ) {

    icon.innerHTML =
      clearIcon;

    icon.dataset.icon =
      "clear";

    return;

  }


  /*
    OPEN + SELECTED VALUE + HOVER INPUT
    = CLEAR
  */

  if (
    isOpen &&
    hasSelectedValue &&
    isHovering
  ) {

    icon.innerHTML =
      clearIcon;

    icon.dataset.icon =
      "clear";

    return;

  }


  /*
    OPEN + NOT HOVERING
    = SEARCH
  */

  if (
    isOpen
  ) {

    icon.innerHTML =
      searchIcon;

    icon.dataset.icon =
      "search";

    return;

  }


  /*
    CLOSED + VALUE + HOVER
    = CLEAR
  */

  if (
    !isOpen &&
    hasSelectedValue &&
    isHovering
  ) {

    icon.innerHTML =
      clearIcon;

    icon.dataset.icon =
      "clear";

    return;

  }


  /*
    DEFAULT CLOSED
    = ARROW
  */

  icon.innerHTML =
    arrowIcon;

  icon.dataset.icon =
    "arrow";

}
    /* =====================================================
       UPDATE DISPLAY VALUE
    ===================================================== */

    function updateValue() {

      const selectedOption =
        select.options[
          select.selectedIndex
        ];


      const hasValue =
        selectedOption &&
        selectedOption.value !== "";


      input.value =
        hasValue
          ? (
              selectedOption
                .textContent ||
              ""
            ).trim()
          : "";

    }


    /* =====================================================
       RENDER OPTIONS
    ===================================================== */

    function renderOptions(
      search = ""
    ) {

      optionList.innerHTML =
        "";


      const keyword =
        String(
          search
        )
          .trim()
          .toLowerCase();


      let count = 0;


      Array
        .from(
          select.options
        )
        .forEach(
          option => {

            if (
              option.value === ""
            ) {
              return;
            }


            const text =
              (
                option.textContent ||
                ""
              ).trim();


            if (
              keyword &&
              !text
                .toLowerCase()
                .includes(
                  keyword
                )
            ) {
              return;
            }


            const item =
              document.createElement(
                "button"
              );


            item.type =
              "button";


            item.className =
              "shared-dropdown-option";


            item.textContent =
              text;


            item.setAttribute(
              "role",
              "option"
            );


            item.setAttribute(
              "aria-selected",
              option.value ===
              select.value
                ? "true"
                : "false"
            );


            if (
              option.value ===
              select.value
            ) {

              item.classList.add(
                "active"
              );

            }


            if (
              option.disabled
            ) {

              item.disabled =
                true;

            }


            item.addEventListener(
              "mousedown",
              event => {

                /*
                  Prevent input blur before
                  option selection.
                */

                event.preventDefault();

              }
            );


            item.addEventListener(
              "click",
              event => {

                event.stopPropagation();


                if (
                  option.disabled
                ) {
                  return;
                }


                select.value =
                  option.value;


                select.dispatchEvent(
                  new Event(
                    "change",
                    {
                      bubbles:true
                    }
                  )
                );


                close();

              }
            );


            optionList.appendChild(
              item
            );


            count++;

          }
        );


      if (
        count === 0
      ) {

        const empty =
          document.createElement(
            "div"
          );


        empty.className =
          "shared-dropdown-empty";


        empty.textContent =
          config.emptyText;


        optionList.appendChild(
          empty
        );

      }

    }


    /* =====================================================
       OPEN
    ===================================================== */

    function open() {

      if (
        select.disabled
      ) {
        return;
      }


document
  .querySelectorAll(
    "select[data-shared-dropdown]"
  )
  .forEach(
    otherSelect => {

      if (
        otherSelect !== select &&
        otherSelect._sharedDropdown
      ) {

        otherSelect
          ._sharedDropdown
          .close();

      }

    }
  );


wrapper.classList.add(
  "open"
);


input.setAttribute(
  "aria-expanded",
  "true"
);


/*
  Get current selected option.
*/

const selectedOption =
  select.options[
    select.selectedIndex
  ];


const selectedText =
  selectedOption &&
  selectedOption.value !== ""
    ? (
        selectedOption.textContent ||
        ""
      ).trim()
    : "";


/*
  Selected value becomes temporary
  placeholder while searching.
*/

input.placeholder =
  selectedText ||
  config.placeholder;


/*
  Actual input becomes empty.
  This allows real blinking caret.
*/

input.value =
  "";


renderOptions(
  ""
);


updateIcon();


requestAnimationFrame(
  () => {

    input.focus();

    input.setSelectionRange(
      0,
      0
    );

  }
);

    }

    /* =====================================================
       CLOSE
    ===================================================== */

    function close() {

      wrapper.classList.remove(
        "open"
      );


      input.setAttribute(
        "aria-expanded",
        "false"
      );

/*
  Restore normal placeholder.
*/

input.placeholder =
  config.placeholder;


/*
  Restore actual selected option.
  Example:
  Facebook returns if user cancels.
*/

updateValue();


updateIcon();

    }


    /* =====================================================
       INPUT CLICK
    ===================================================== */

    input.addEventListener(
      "click",
      event => {

        event.stopPropagation();


        if (
          !wrapper
            .classList
            .contains("open")
        ) {

          open();

        }

      }
    );


    /* =====================================================
       INPUT FOCUS
    ===================================================== */

    input.addEventListener(
      "focus",
      () => {

        if (
          !wrapper
            .classList
            .contains("open")
        ) {

          open();

        }

      }
    );


    /* =====================================================
       SEARCH AS USER TYPES
    ===================================================== */

input.addEventListener(
  "input",
  () => {

    if (
      !wrapper
        .classList
        .contains("open")
    ) {

      open();

    }


    renderOptions(
      input.value
    );


    updateIcon();

  }
);
trigger.addEventListener(
  "mouseenter",
  () => {

    isHovering =
      true;

    updateIcon();

  }
);


trigger.addEventListener(
  "mouseleave",
  () => {

    isHovering =
      false;

    updateIcon();

  }
);


/*
  Input already contains selected text.
  Do not automatically open dropdown
  just because hover state changed.
*/

input.addEventListener(
  "mousemove",
  () => {

    if (
      !wrapper.classList.contains("open") &&
      select.value !== ""
    ) {

      isHovering =
        true;

      updateIcon();

    }

  }
);

    /* =====================================================
       ICON CLICK
    ===================================================== */

icon.addEventListener(
  "mousedown",
  event => {

    event.preventDefault();

    event.stopPropagation();


    const iconType =
      icon.dataset.icon;


    /* ==============================
       CLEAR
    ============================== */

    if (
      iconType === "clear"
    ) {

      /*
        If dropdown is open,
        clear only search text.
      */

if (
  wrapper
    .classList
    .contains("open")
) {

  /*
    Clear selected dropdown value.
  */

  select.value =
    "";


  select.dispatchEvent(
    new Event(
      "change",
      {
        bubbles:true
      }
    )
  );


  /*
    Clear search text.
  */

  input.value =
    "";


  /*
    Restore normal placeholder.
  */

  input.placeholder =
    config.placeholder;


  renderOptions(
    ""
  );


  updateIcon();


  input.focus();


  input.setSelectionRange(
    0,
    0
  );


  return;
}


      /*
        Dropdown closed:
        clear selected value.
      */

      select.value =
        "";


      select.dispatchEvent(
        new Event(
          "change",
          {
            bubbles:true
          }
        )
      );


      input.value =
        "";


      updateIcon();


      return;

    }


    /* ==============================
       SEARCH ICON
    ============================== */

    if (
      iconType === "search"
    ) {

      input.focus();

      return;

    }


    /* ==============================
       ARROW
    ============================== */

    if (
      wrapper
        .classList
        .contains("open")
    ) {

      close();

    } else {

      open();

    }

  }
);


    /* =====================================================
       SELECT CHANGE
    ===================================================== */

select.addEventListener(
  "change",
  () => {

    updateValue();

    renderOptions();

    updateIcon();

  }
);

    /* =====================================================
       DISABLED
    ===================================================== */

    function updateDisabled() {

      const disabled =
        select.disabled;


      input.disabled =
        disabled;


      wrapper
        .classList
        .toggle(
          "disabled",
          disabled
        );


      if (
        disabled
      ) {

        close();

      }

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    const api = {

      open,

      close,

      refresh() {

        updateValue();

        updateDisabled();

        renderOptions();

      },


      setValue(
        value,
        dispatchChange = true
      ) {

        select.value =
          String(
            value
          );


        updateValue();

        renderOptions();


        if (
          dispatchChange
        ) {

          select.dispatchEvent(
            new Event(
              "change",
              {
                bubbles:true
              }
            )
          );

        }

      },


      getValue() {

        return select.value;

      }

    };


    select._sharedDropdown =
      api;


updateValue();

updateDisabled();

renderOptions();

updateIcon();


    return api;

  }

/* =======================================================
   SHARED CHIP DROPDOWN
   Reusable multi-select dropdown
======================================================= */

function createSharedChipDropdown(
  target,
  options = {}
) {

  const container =
    typeof target === "string"
      ? document.querySelector(
          target
        )
      : target;


  if (!container) {
    return null;
  }


  /* PREVENT DOUBLE INIT */

  if (
    container._sharedChipDropdown
  ) {

    return (
      container._sharedChipDropdown
    );

  }


  const config = {

    placeholder:
      options.placeholder ||
      "Select option",

    options:
      Array.isArray(
        options.options
      )
        ? options.options
        : [],

    value:
      Array.isArray(
        options.value
      )
        ? options.value
        : [],

    onChange:
      typeof options.onChange ===
      "function"
        ? options.onChange
        : null

  };


  const selectedValues =
    new Set(
      config.value.map(
        value =>
          String(value)
      )
    );


  /* =====================================================
     ICONS
  ===================================================== */

  const arrowIcon = `
    <svg
      class="shared-chip-dropdown-icon shared-chip-dropdown-icon-arrow"
      viewBox="0 0 1024 1024"
      aria-hidden="true"
    >
      <path
        d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"
      />
    </svg>
  `;


  const searchIcon = `
    <svg
      class="shared-chip-dropdown-icon shared-chip-dropdown-icon-search"
      viewBox="0 0 1024 1024"
      aria-hidden="true"
    >
      <path
        d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"
      />
    </svg>
  `;


  const clearIcon = `
    <svg
      class="shared-chip-dropdown-icon shared-chip-dropdown-icon-clear"
      viewBox="0 0 1024 1024"
      aria-hidden="true"
    >
      <path
        d="M512 64c247.4 0 448 200.6 448 448S759.4 960 512 960 64 759.4 64 512 264.6 64 512 64zm127.98 274.82h-.04l-.08.06L512 466.75 384.14 338.88c-.04-.05-.06-.06-.08-.06a.12.12 0 00-.07 0c-.03 0-.05.01-.09.05l-45.02 45.02a.2.2 0 00-.05.09.12.12 0 000 .07v.02a.27.27 0 00.06.06L466.75 512 338.88 639.86c-.05.04-.06.06-.06.08a.12.12 0 000 .07c0 .03.01.05.05.09l45.02 45.02a.2.2 0 00.09.05.12.12 0 00.07 0c.02 0 .04-.01.08-.05L512 557.25l127.86 127.87c.04.04.06.05.08.05a.12.12 0 00.07 0c.03 0 .05-.01.09-.05l45.02-45.02a.2.2 0 00.05-.09.12.12 0 000-.07v-.02a.27.27 0 00-.05-.06L557.25 512l127.87-127.86c.04-.04.05-.06.05-.08a.12.12 0 000-.07c0-.03-.01-.05-.05-.09l-45.02-45.02a.2.2 0 00-.09-.05.12.12 0 00-.07 0z"
      />
    </svg>
  `;


  const removeIcon = `
    <svg
      viewBox="0 0 1024 1024"
      aria-hidden="true"
    >
      <path
        d="M799.86 166.31c.02 0 .04.02.08.06l57.69 57.7c.04.03.05.05.06.08a.12.12 0 010 .06c0 .03-.02.05-.06.09L569.93 512l287.7 287.7c.04.04.05.06.06.09a.12.12 0 010 .07c0 .02-.02.04-.06.08l-57.7 57.69c-.03.04-.05.05-.07.06a.12.12 0 01-.07 0c-.03 0-.05-.02-.09-.06L512 569.93l-287.7 287.7c-.04.04-.06.05-.09.06a.12.12 0 01-.07 0c-.02 0-.04-.02-.08-.06l-57.69-57.7c-.04-.03-.05-.05-.06-.07a.12.12 0 010-.07c0-.03.02-.05.06-.09L454.07 512l-287.7-287.7c-.04-.04-.05-.06-.06-.09a.12.12 0 010-.07c0-.02.02-.04.06-.08l57.7-57.69c.03-.04.05-.05.07-.06a.12.12 0 01.07 0c.03 0 .05.02.09.06L512 454.07l287.7-287.7c.04-.04.06-.05.09-.06a.12.12 0 01.07 0z"
      />
    </svg>
  `;


  /* =====================================================
     BUILD UI
  ===================================================== */

  container.classList.add(
    "shared-chip-dropdown"
  );


  container.innerHTML = `
    <div
      class="shared-chip-dropdown-trigger"
      tabindex="0"
    >

      <div
        class="shared-chip-dropdown-values"
      ></div>

      <span
        class="shared-chip-dropdown-placeholder"
      >
        ${escapeSharedText(
          config.placeholder
        )}
      </span>

      <button
        class="shared-chip-dropdown-icon-btn"
        type="button"
        aria-label="Toggle options"
      >
        ${arrowIcon}
        ${searchIcon}
        ${clearIcon}
      </button>

    </div>

    <div
      class="shared-chip-dropdown-panel"
    ></div>
  `;


  const trigger =
    container.querySelector(
      ".shared-chip-dropdown-trigger"
    );


  const valuesBox =
    container.querySelector(
      ".shared-chip-dropdown-values"
    );


  const panel =
    container.querySelector(
      ".shared-chip-dropdown-panel"
    );
const overflowPopup =
  document.createElement("div");

overflowPopup.className =
  "shared-chip-dropdown-overflow-popup";

overflowPopup.hidden = true;

container.appendChild(
  overflowPopup
);

  const iconButton =
    container.querySelector(
      ".shared-chip-dropdown-icon-btn"
    );


  /* =====================================================
     GET OPTION
  ===================================================== */

  function getOption(
    value
  ) {

    return (
      config.options.find(
        option =>
          String(option.value) ===
          String(value)
      ) ||
      null
    );

  }


  /* =====================================================
     NOTIFY CHANGE
  ===================================================== */

  function notifyChange() {

    if (
      config.onChange
    ) {

      config.onChange(
        Array.from(
          selectedValues
        )
      );

    }

  }


  /* =====================================================
     RENDER
  ===================================================== */

function render() {

  const selected =
    Array.from(selectedValues)
      .map(value => {

        const option =
          getOption(value);

        if (!option) {
          return null;
        }

        return {
          value,
          label:
            String(
              option.label || value
            )
        };

      })
      .filter(Boolean);


const isAdminSiteSelector =
  !!container.closest(
    ".admin-site-selector"
  );


const visibleItems =
  isAdminSiteSelector
    ? selected.slice(0, 1)
    : selected;


const hiddenItems =
  isAdminSiteSelector
    ? selected.slice(1)
    : [];


  valuesBox.innerHTML =
    visibleItems
      .map(item => `
        <span
          class="shared-chip-dropdown-chip"
          data-chip-value="${escapeSharedText(
            item.value
          )}"
        >

          <span
            class="shared-chip-dropdown-chip-content"
          >
            ${escapeSharedText(
              item.label
            )}
          </span>

          <button
            class="shared-chip-dropdown-chip-remove"
            type="button"
            data-remove-value="${escapeSharedText(
              item.value
            )}"
            aria-label="Remove ${escapeSharedText(
              item.label
            )}"
          >
            ${removeIcon}
          </button>

        </span>
      `)
      .join("");


  /*
    +N CHIP
  */

if (
  hiddenItems.length > 0
) {

  valuesBox.insertAdjacentHTML(
    "beforeend",
    `
      <span
        class="shared-chip-dropdown-overflow"
        tabindex="0"
      >

        <span
          class="shared-chip-dropdown-overflow-inner"
        >
          +${hiddenItems.length}
        </span>

      </span>
    `
  );

}


  /*
    Popup untuk chip tersembunyi.
  */

  overflowPopup.innerHTML =
    hiddenItems
      .map(item => `
        <div
          class="shared-chip-dropdown-overflow-item"
        >
          ${escapeSharedText(
            item.label
          )}
        </div>
      `)
      .join("");


  overflowPopup.hidden =
    hiddenItems.length === 0;


  container.classList.toggle(
    "has-value",
    selectedValues.size > 0
  );


  /*
    Dropdown options asal.
  */

  panel.innerHTML =
    config.options
      .map(option => {

        const value =
          String(
            option.value
          );


        const active =
          selectedValues.has(
            value
          );


        return `
          <button
            class="shared-chip-dropdown-option ${
              active
                ? "active"
                : ""
            }"
            type="button"
            data-value="${escapeSharedText(
              value
            )}"
            aria-selected="${
              active
                ? "true"
                : "false"
            }"
          >

            <span>
              ${escapeSharedText(
                option.label
              )}
            </span>

            <span
              class="shared-chip-dropdown-option-check"
            >
              ✓
            </span>

          </button>
        `;

      })
      .join("");

}


  /* =====================================================
     OPEN / CLOSE
  ===================================================== */

  function open() {

    container.classList.add(
      "open"
    );

  }


  function close() {

    container.classList.remove(
      "open"
    );

  }


  function toggle() {

    if (
      container.classList.contains(
        "open"
      )
    ) {

      close();

    }
    else {

      open();

    }

  }


  /* =====================================================
     TRIGGER CLICK
  ===================================================== */

  trigger.addEventListener(
    "click",
    event => {

      if (
        event.target.closest(
          ".shared-chip-dropdown-chip-remove"
        )
      ) {

        return;

      }


      if (
        event.target.closest(
          ".shared-chip-dropdown-icon-btn"
        )
      ) {

        return;

      }


      toggle();

    }
  );


  /* =====================================================
     OPTION CLICK
  ===================================================== */

  panel.addEventListener(
    "click",
    event => {

      const optionButton =
        event.target.closest(
          "[data-value]"
        );


      if (!optionButton) {
        return;
      }


      event.stopPropagation();


      const value =
        String(
          optionButton.dataset.value ||
          ""
        );


      if (!value) {
        return;
      }


      if (
        selectedValues.has(
          value
        )
      ) {

        selectedValues.delete(
          value
        );

      }
      else {

        selectedValues.add(
          value
        );

      }


      render();

      notifyChange();

    }
  );


  /* =====================================================
     REMOVE ONE CHIP
  ===================================================== */

  valuesBox.addEventListener(
    "click",
    event => {

      const removeButton =
        event.target.closest(
          "[data-remove-value]"
        );


      if (!removeButton) {
        return;
      }


      event.stopPropagation();


      selectedValues.delete(
        String(
          removeButton.dataset
            .removeValue
        )
      );


      render();

      notifyChange();

    }
  );

/* =====================================================
   OVERFLOW +N HOVER
===================================================== */

valuesBox.addEventListener(
  "mouseover",
  event => {

    const moreChip =
      event.target.closest(
        ".shared-chip-dropdown-overflow"
      );

    if (!moreChip) {
      return;
    }

    overflowPopup.classList.add(
      "show"
    );

  }
);


valuesBox.addEventListener(
  "mouseout",
  event => {

    const moreChip =
      event.target.closest(
        ".shared-chip-dropdown-overflow"
      );

    if (!moreChip) {
      return;
    }


    const next =
      event.relatedTarget;


    if (
      next &&
      (
        moreChip.contains(next) ||
        overflowPopup.contains(next)
      )
    ) {
      return;
    }


    overflowPopup.classList.remove(
      "show"
    );

  }
);


overflowPopup.addEventListener(
  "mouseenter",
  () => {

    overflowPopup.classList.add(
      "show"
    );

  }
);


overflowPopup.addEventListener(
  "mouseleave",
  () => {

    overflowPopup.classList.remove(
      "show"
    );

  }
);
  /* =====================================================
     RIGHT ICON
  ===================================================== */

  iconButton.addEventListener(
    "click",
    event => {

      event.stopPropagation();


      /*
        Closed + has chip + hover
        = clear all.
      */

      if (
        selectedValues.size &&
        !container.classList.contains(
          "open"
        )
      ) {

        selectedValues.clear();

        render();

        notifyChange();

        return;

      }


      toggle();

    }
  );


  /* =====================================================
     OUTSIDE CLICK
  ===================================================== */

  document.addEventListener(
    "click",
    event => {

      if (
        container.contains(
          event.target
        )
      ) {

        return;

      }


      close();

    }
  );


  /* =====================================================
     PUBLIC API
  ===================================================== */

  const api = {

    open,

    close,

    getValue() {

      return Array.from(
        selectedValues
      );

    },

    setValue(
      values = [],
      dispatchChange = true
    ) {

      selectedValues.clear();


      (
        Array.isArray(values)
          ? values
          : []
      )
        .forEach(
          value => {

            const stringValue =
              String(value);


            if (
              getOption(
                stringValue
              )
            ) {

              selectedValues.add(
                stringValue
              );

            }

          }
        );


      render();


      if (
        dispatchChange
      ) {

        notifyChange();

      }

    },

    clear(
      dispatchChange = true
    ) {

      selectedValues.clear();

      render();


      if (
        dispatchChange
      ) {

        notifyChange();

      }

    },

setOptions(
  newOptions = []
) {

  config.options =
    Array.isArray(
      newOptions
    )
      ? newOptions
      : [];


  Array
    .from(
      selectedValues
    )
    .forEach(
      value => {

        if (
          !getOption(
            value
          )
        ) {

          selectedValues.delete(
            value
          );

        }

      }
    );


  render();

},

destroy() {

  close();

  if (
    container._sharedChipDropdown ===
    api
  ) {

    delete container._sharedChipDropdown;

  }


  /*
    Buang UI dropdown lama.
  */
  container.innerHTML = "";

  container.classList.remove(
    "shared-chip-dropdown",
    "has-value",
    "open"
  );

}

};


  container._sharedChipDropdown =
    api;


  render();


  return api;

}
  /* =======================================================
     INIT ALL SHARED DROPDOWNS
  ======================================================= */

function initSharedDropdowns(
  root = document
) {

  root
    .querySelectorAll(
      "select[data-shared-dropdown]"
    )
    .forEach(
      select => {

        createSharedDropdown(
          select,
          {
            placeholder:
              select.dataset.placeholder ||
              "Select option"
          }
        );

      }
    );

}


    /* =======================================================
     CLOSE WHEN CLICK OUTSIDE
  ======================================================= */

  document.addEventListener(
    "click",
    event => {

      document
        .querySelectorAll(
          ".shared-dropdown.open"
        )
        .forEach(
          dropdown => {

            if (
              dropdown.contains(
                event.target
              )
            ) {
              return;
            }


            const select =
              dropdown.querySelector(
                "select[data-shared-dropdown]"
              );


            select
              ?._sharedDropdown
              ?.close();

          }
        );

    }
  );


  /* =======================================================
     CLOSE WITH ESC
  ======================================================= */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !== "Escape"
      ) {
        return;
      }


      document
        .querySelectorAll(
          ".shared-dropdown.open"
        )
        .forEach(
          dropdown => {

            const select =
              dropdown.querySelector(
                "select[data-shared-dropdown]"
              );


            select
              ?._sharedDropdown
              ?.close();



          }
        );

    }
  );

/* =========================================================
   NEW UI - GENERIC HELPERS
========================================================= */
function initNewUITabs(root = document) {
  root.querySelectorAll("[data-new-ui-tabs]").forEach(group => {
    if (group.dataset.newUiReady === "1") return;
    group.dataset.newUiReady = "1";
    group.addEventListener("click", event => {
      const tab = event.target.closest("[data-tab-target]");
      if (!tab || !group.contains(tab)) return;
      const target = tab.dataset.tabTarget;
      group.querySelectorAll("[data-tab-target]").forEach(item => item.classList.toggle("active", item === tab));
      const scope = group.dataset.tabScope ? document.querySelector(group.dataset.tabScope) : document;
      scope?.querySelectorAll("[data-tab-panel]").forEach(panel => {
        panel.hidden = panel.dataset.tabPanel !== target;
      });
      group.dispatchEvent(new CustomEvent("newui:tabchange", { bubbles:true, detail:{ target, tab } }));
    });
  });
}

function initNewUINav(root = document) {
  root.querySelectorAll("[data-new-ui-nav]").forEach(nav => {
    if (nav.dataset.newUiReady === "1") return;
    nav.dataset.newUiReady = "1";
    nav.addEventListener("click", event => {
      const link = event.target.closest(".new-ui-nav-link");
      if (!link || !nav.contains(link)) return;
      nav.querySelectorAll(".new-ui-nav-link").forEach(item => item.classList.toggle("active", item === link));
      nav.dispatchEvent(new CustomEvent("newui:navchange", { bubbles:true, detail:{ link, page:link.dataset.page || "" } }));
    });
  });
}

function createNewUIModal(options = {}) {
  const backdrop = document.createElement("div");
  backdrop.className = "new-ui-modal-backdrop";
  const modal = document.createElement("div");
  modal.className = "new-ui-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  const title = String(options.title ?? "");
  const body = String(options.body ?? "");
  modal.innerHTML = `<div class="new-ui-modal-header"><strong></strong><button type="button" class="new-ui-btn" data-close>Close</button></div><div class="new-ui-modal-body"></div><div class="new-ui-modal-footer"></div>`;
  modal.querySelector("strong").textContent = title;
  modal.querySelector(".new-ui-modal-body").textContent = body;
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  const api = {
    element: backdrop,
    open(){ backdrop.classList.add("show"); },
    close(){ backdrop.classList.remove("show"); },
    destroy(){ backdrop.remove(); }
  };
  backdrop.addEventListener("click", e => { if (e.target === backdrop || e.target.closest("[data-close]")) api.close(); });
  return api;
}

window.NewUI = Object.assign(window.NewUI || {}, {
  createEmptyState,
  createLoadingState,
  showEmptyState,
  showLoadingState,
  clearState: clearSharedState,
  dropdown: createSharedDropdown,
  chipDropdown: createSharedChipDropdown,
  initDropdowns: initSharedDropdowns,
  initTabs: initNewUITabs,
  initNav: initNewUINav,
  modal: createNewUIModal,
  theme: { get:getAdminTheme, apply:applyAdminTheme }
});

window.createEmptyState = createEmptyState;
window.createLoadingState = createLoadingState;
window.showEmptyState = showEmptyState;
window.showLoadingState = showLoadingState;
window.clearSharedState = clearSharedState;
window.createSharedDropdown = createSharedDropdown;
window.createSharedChipDropdown = createSharedChipDropdown;
window.initSharedDropdowns = initSharedDropdowns;
function getToastContainer() {

  let container =
    document.getElementById(
      "globalToastContainer"
    );


  if (!container) {

    container =
      document.createElement(
        "div"
      );


    container.id =
      "globalToastContainer";


    document.body.appendChild(
      container
    );

  }


  return container;

}


/* =========================================================
   TOAST ICONS
========================================================= */

const toastIcons = {

  success: `
    <svg
      viewBox="0 0 1024 1024"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292a31.8 31.8 0 01-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z"
      />
    </svg>
  `,

  error: `
    <svg
      viewBox="0 0 1024 1024"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm127 576.8L576.8 703 512 638.2 447.2 703 385 640.8l64.8-64.8-64.8-64.8 62.2-62.2 64.8 64.8 64.8-64.8 62.2 62.2-64.8 64.8 64.8 64.8z"
      />
    </svg>
  `,

  warning: `
    <svg
      viewBox="0 0 1024 1024"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm-40 240h80v288h-80V304zm40 432a48 48 0 110-96 48 48 0 010 96z"
      />
    </svg>
  `,

  info: `
    <svg
      viewBox="0 0 1024 1024"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm40 672h-80V448h80v288zm-40-368a48 48 0 110-96 48 48 0 010 96z"
      />
    </svg>
  `

};


/* =========================================================
   REMOVE TOAST
========================================================= */

function removeToast(
  toast
) {

  if (
    !toast ||
    toast.dataset.removing ===
      "true"
  ) {

    return;

  }


  toast.dataset.removing =
    "true";


  toast.classList.remove(
    "show"
  );


  toast.classList.add(
    "hide"
  );


  setTimeout(
    () => {

      toast.remove();

    },
    300
  );

}


/* =========================================================
   SHOW TOAST
========================================================= */

function showToast(
  message,
  type = "success",
  duration = 3500
) {

  const allowedTypes = [
    "success",
    "error",
    "warning",
    "info"
  ];


  if (
    !allowedTypes.includes(
      type
    )
  ) {

    type =
      "success";

  }


  const container =
    getToastContainer();


  const toast =
    document.createElement(
      "div"
    );


  toast.className =
    `custom-toast ${type}`;


  /* ICON */

  const icon =
    document.createElement(
      "span"
    );


  icon.className =
    "custom-toast-icon";


  icon.innerHTML =
    toastIcons[type];


  /* MESSAGE */

  const messageElement =
    document.createElement(
      "div"
    );


  messageElement.className =
    "custom-toast-message";


  /*
    textContent digunakan supaya
    message tidak inject HTML.
  */

  messageElement.textContent =
    String(message ?? "");


  /* CLOSE */

  const closeButton =
    document.createElement(
      "button"
    );


  closeButton.type =
    "button";


  closeButton.className =
    "custom-toast-close";


  closeButton.setAttribute(
    "aria-label",
    "Close notification"
  );


  closeButton.innerHTML = `
    <svg
      viewBox="0 0 1024 1024"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M799.86 166.31c.02 0 .04.02.08.06l57.69 57.7c.04.03.05.05.06.08a.12.12 0 010 .06c0 .03-.02.05-.06.09L569.93 512l287.7 287.7c.04.04.05.06.06.09a.12.12 0 010 .07c0 .02-.02.04-.06.08l-57.7 57.69c-.03.04-.05.05-.07.06a.12.12 0 01-.07 0c-.03 0-.05-.02-.09-.06L512 569.93l-287.7 287.7c-.04.04-.06.05-.09.06a.12.12 0 01-.07 0c-.02 0-.04-.02-.08-.06l-57.69-57.7c-.04-.03-.05-.05-.06-.07a.12.12 0 010-.07c0-.03.02-.05.06-.09L454.07 512l-287.7-287.7c-.04-.04-.05-.06-.06-.09a.12.12 0 010-.07c0-.02.02-.04.06-.08l57.7-57.69c.03-.04.05-.05.07-.06a.12.12 0 01.07 0c.03 0 .05.02.09.06L512 454.07l287.7-287.7c.04-.04.06-.05.09-.06a.12.12 0 01.07 0z"
      />
    </svg>
  `;


  closeButton.addEventListener(
    "click",
    () => {

      removeToast(
        toast
      );

    }
  );


  toast.appendChild(
    icon
  );


  toast.appendChild(
    messageElement
  );


  toast.appendChild(
    closeButton
  );


  container.appendChild(
    toast
  );


  /*
    Trigger enter animation.
  */

  requestAnimationFrame(
    () => {

      requestAnimationFrame(
        () => {

          toast.classList.add(
            "show"
          );

        }
      );

    }
  );


  /*
    AUTO CLOSE
  */

  if (
    duration > 0
  ) {

    setTimeout(
      () => {

        removeToast(
          toast
        );

      },
      duration
    );

  }


  return toast;

}


/* =========================================================
   GLOBAL ACCESS
========================================================= */

window.showToast =
  showToast;

window.NewUI.toast = showToast;

document.addEventListener("DOMContentLoaded", () => {
  initSharedDropdowns(document);
  initNewUITabs(document);
  initNewUINav(document);
});

})();
