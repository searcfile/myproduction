/* 5G88 New UI — reusable components extracted from supplied legacy shared-ui.js.
   No Firebase, authentication, sidebar, navigation or permissions are changed. */
(function () {
  "use strict";

   
/* =========================================================
   5G88 GLOBAL CUSTOM OVERLAY LOADING
   ========================================================= */

let globalLoadingTimer = null;

function getGlobalLoadingElement() {
  let overlay = document.getElementById(
    "globalPageLoading"
  );

  if (!overlay) {
    overlay = document.createElement("div");

    overlay.id = "globalPageLoading";
    overlay.className = "login-loading";
    overlay.hidden = true;

    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");
    overlay.setAttribute("aria-label", "Loading");

    overlay.innerHTML = `
      <div class="loading-box">
        <div class="loading-dots" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div class="loading-text">
          Please wait while fetching...
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  return overlay;
}

/* SHOW LOADING */

function showGlobalLoading(
  text = "Please wait while fetching...",
  delay = 150
) {
  clearTimeout(globalLoadingTimer);

  const show = () => {
    const overlay = getGlobalLoadingElement();

    const label = overlay.querySelector(
      ".loading-text"
    );

    if (label) {
      label.textContent = String(text);
    }

    overlay.hidden = false;
  };

  if (delay > 0) {
    globalLoadingTimer = setTimeout(show, delay);
  } else {
    show();
  }
}

/* HIDE LOADING */

function hideGlobalLoading() {
  clearTimeout(globalLoadingTimer);
  globalLoadingTimer = null;

  const overlay = document.getElementById(
    "globalPageLoading"
  );

  if (overlay) {
    overlay.hidden = true;
  }
}

/* GLOBAL FUNCTIONS */

window.showGlobalLoading = showGlobalLoading;
window.hideGlobalLoading = hideGlobalLoading;

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
                fill="var(--empty-icon)"
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
                  fill="var(--empty-icon-set)"
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
  align = "",
  card = false
) {
  const element =
    typeof target === "string"
      ? document.querySelector(target)
      : target;

  if (!element) return;

  const emptyHTML = createEmptyState(
    text,
    size,
    align
  );

  element.innerHTML = card
    ? `<div class="shared-empty-card">
         ${emptyHTML}
       </div>`
    : emptyHTML;
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


/* HEADER SITE - SEARCH DIRECTLY IN TRIGGER */

const isHeaderSite =
  container.id === "headerSiteCustom";

let headerSiteSearch = null;

if (isHeaderSite) {
  headerSiteSearch = document.createElement("input");


headerSiteSearch.type = "text";
headerSiteSearch.className = "header-site-search-input";
headerSiteSearch.placeholder = config.placeholder;

// Kurangkan autofill dan suggestion browser.
headerSiteSearch.name = "site_filter_" + Math.random().toString(36).slice(2);
headerSiteSearch.autocomplete = "off";
headerSiteSearch.setAttribute("autocorrect", "off");
headerSiteSearch.setAttribute("autocapitalize", "off");
headerSiteSearch.setAttribute("spellcheck", "false");
headerSiteSearch.setAttribute("data-lpignore", "true");
headerSiteSearch.setAttribute("data-1p-ignore", "true");
headerSiteSearch.setAttribute("aria-label", "Search sites");

// Jangan aktifkan input secara automatik.
headerSiteSearch.readOnly = true;

trigger.insertBefore(headerSiteSearch, iconButton);

// Hanya aktif apabila pengguna mahu menaip.
headerSiteSearch.addEventListener("pointerdown", () => {
  headerSiteSearch.readOnly = false;
});

headerSiteSearch.addEventListener("keydown", () => {
  headerSiteSearch.readOnly = false;
});

headerSiteSearch.addEventListener("blur", () => {
  headerSiteSearch.readOnly = true;
});

  const filterHeaderSites = () => {
    const keyword = headerSiteSearch.value
      .trim()
      .toLowerCase();

    panel.querySelectorAll(
      ".shared-chip-dropdown-option"
    ).forEach(option => {
      const label = option.textContent
        .trim()
        .toLowerCase();

      option.hidden = !label.includes(keyword);
    });
  };


headerSiteSearch.addEventListener("focus", () => {
  // Focus sahaja, jangan buka dropdown automatik.
});

headerSiteSearch.addEventListener("click", event => {
  event.stopPropagation();

  // Klik pertama buka, klik kedua tutup.
  toggle();

  if (container.classList.contains("open")) {
    filterHeaderSites();
  }
});

headerSiteSearch.addEventListener("input", () => {
  open();
  filterHeaderSites();
});


  headerSiteSearch.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      close();
      headerSiteSearch.blur();
    }
  });
}

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


trigger.addEventListener("click", event => {
  const target = event.target;

  if (
    target.closest(".shared-chip-dropdown-chip-remove") ||
    target.closest(".shared-chip-dropdown-icon-btn") ||
    target.closest(".shared-chip-dropdown-overflow")
  ) {
    return;
  }

  // Input search mempunyai handler toggle sendiri.
  if (target.closest(".header-site-search-input")) {
    return;
  }

  event.stopPropagation();


if (isHeaderSite && headerSiteSearch) {
  headerSiteSearch.readOnly = false;
  headerSiteSearch.focus();
}


  toggle();

  if (
    isHeaderSite &&
    container.classList.contains("open")
  ) {
    const keyword = headerSiteSearch.value
      .trim()
      .toLowerCase();

    panel.querySelectorAll(
      ".shared-chip-dropdown-option"
    ).forEach(option => {
      option.hidden = !option.textContent
        .trim()
        .toLowerCase()
        .includes(keyword);
    });
  }
});


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



iconButton.addEventListener("click", event => {
  event.preventDefault();
  event.stopPropagation();

  const shouldClear =
    selectedValues.size > 0 &&
    container.matches(":hover");

  if (shouldClear) {
    selectedValues.clear();

    if (headerSiteSearch) {
      headerSiteSearch.value = "";
    }

    render();
    notifyChange();
    close();
    return;
  }

  toggle();


if (
  headerSiteSearch &&
  container.classList.contains("open")
) {
  headerSiteSearch.readOnly = false;
  headerSiteSearch.focus();
}

});



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


/* Custom input: automatic search/clear icons and password eye toggles. */
const NEW_UI_ICONS = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m16 16 5 5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  
clear: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path fill="currentColor" d="M512 64c247.4 0 448 200.6 448 448S759.4 960 512 960 64 759.4 64 512 264.6 64 512 64zm127.98 274.82h-.04l-.08.06L512 466.75 384.14 338.88c-.04-.05-.06-.06-.08-.06a.12.12 0 00-.07 0c-.03 0-.05.01-.09.05l-45.02 45.02a.2.2 0 00-.05.09.12.12 0 000 .07v.02a.27.27 0 00.06.06L466.75 512 338.88 639.86c-.05.04-.06.06-.06.08a.12.12 0 000 .07c0 .03.01.05.05.09l45.02 45.02a.2.2 0 00.09.05.12.12 0 00.07 0c.02 0 .04-.01.08-.05L512 557.25l127.86 127.87c.04.04.06.05.08.05a.12.12 0 00.07 0c.03 0 .05-.01.09-.05l45.02-45.02a.2.2 0 00.05-.09.12.12 0 000-.07v-.02a.27.27 0 00-.05-.06L557.25 512l127.87-127.86c.04-.04.05-.06.05-.08a.12.12 0 000-.07c0-.03-.01-.05-.09-.05l-45.02-45.02a.2.2 0 00-.09-.05.12.12 0 000-.07z"/></svg>',

  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3 21 21M9.9 6.3A11.7 11.7 0 0 1 12 6c6.4 0 10 6 10 6a16 16 0 0 1-3 3.4M6.3 8C3.6 9.7 2 12 2 12s3.6 6 10 6c1.3 0 2.5-.2 3.5-.6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>'
};
function createNewInput(target, options={}) {
  const input = typeof target === 'string' ? document.querySelector(target) : target;
  if (!input || input.tagName !== 'INPUT') return null;
  if (input._newUIInput) return input._newUIInput;
  const isPassword = input.type === 'password' || options.password === true;
  const searchable = input.type === 'search' || options.search === true;
  input.classList.add('shared-input','new-ui-input');
  const parent = document.createElement('span'); parent.className='new-ui-input-wrap';
  input.parentNode.insertBefore(parent,input); parent.append(input);
  const icon = document.createElement('button'); icon.type='button'; icon.className='new-ui-input-icon';
  icon.setAttribute('aria-label',isPassword?'Show password':'Clear input');
  parent.append(icon);
  let visible=false;
  function refresh() {
    const hasValue=!!input.value;
    if(isPassword){icon.innerHTML=visible?NEW_UI_ICONS.eyeOff:NEW_UI_ICONS.eye; icon.style.display='flex';icon.setAttribute('aria-label',visible?'Hide password':'Show password');}
   else if(hasValue){icon.innerHTML=NEW_UI_ICONS.clear;icon.style.display='flex';icon.setAttribute('aria-label','Clear input');}
    else if(searchable){icon.innerHTML=NEW_UI_ICONS.search;icon.style.display='flex';icon.setAttribute('aria-label','Search');}
    else icon.style.display='none';
    icon.disabled=input.disabled;
  }
  icon.addEventListener('click',()=>{
    if(isPassword){visible=!visible;input.type=visible?'text':'password';}
    else if(input.value){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}
    input.focus();refresh();
  });
  input.addEventListener('input',refresh);input.addEventListener('change',refresh);
  const observer=new MutationObserver(refresh);observer.observe(input,{attributes:true,attributeFilter:['disabled','type']});
  const api={refresh,destroy(){observer.disconnect();icon.remove();parent.parentNode.insertBefore(input,parent);parent.remove();input.classList.remove('new-ui-input');delete input._newUIInput;}};
  input._newUIInput=api;refresh();return api;
}
function initNewUI(root=document) {
  initSharedDropdowns(root);
  root.querySelectorAll('input[data-new-ui-input], input[data-ui="input"], input[data-ui="search"], input[data-ui="password"]').forEach(input=>createNewInput(input,{search:input.dataset.ui==='search',password:input.dataset.ui==='password'}));
  root.querySelectorAll('[data-new-ui-chips]').forEach(el=>{
    if(el._sharedChipDropdown)return;
    let choices=[];try{choices=JSON.parse(el.dataset.options||'[]');}catch(_){choices=(el.dataset.options||'').split(',').filter(Boolean).map(x=>({value:x.trim(),label:x.trim()}));}
    createSharedChipDropdown(el,{placeholder:el.dataset.placeholder||'Select options',options:choices});
  });
}

/* Reusable Visitor-style search + rotating sync SVG. */
function createSyncSearch(target, options = {}) {
  const input = typeof target === 'string' ? document.querySelector(target) : target;
  if (!input || input.tagName !== 'INPUT') return null;
  if (input._syncSearch) return input._syncSearch;
  // Avoid nesting the old search/clear wrapper if this input was auto-initialized.
  input._newUIInput?.destroy?.();
  const wrapper = document.createElement('div');
  wrapper.className = 'shared-sync-search';
  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);
  input.classList.add('shared-sync-search-input');
  input.setAttribute('autocomplete', input.getAttribute('autocomplete') || 'off');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'shared-sync-search-button';
  button.setAttribute('aria-label', 'Search');
  button.innerHTML = `
    <svg class="shared-sync-search-icon" viewBox="64 64 896 896" aria-hidden="true"><path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"/></svg>
    <svg class="shared-sync-spinner" viewBox="0 0 50 50" aria-hidden="true"><circle class="shared-sync-track" cx="25" cy="25" r="19"/><circle class="shared-sync-spinner-path" cx="25" cy="25" r="19"/></svg>`;
  wrapper.appendChild(button);
  let busy = false;
  const setLoading = (value) => {
    busy = !!value;
    wrapper.classList.toggle('is-syncing', busy);
    button.disabled = busy;
    button.setAttribute('aria-label', busy ? 'Searching' : 'Search');
    wrapper.setAttribute('aria-busy', String(busy));
  };
  const click = async () => {
    if (busy) return;
    if (typeof options.onSearch === 'function') {
      try { setLoading(true); await options.onSearch(input.value.trim(), input); }
      catch (error) { console.error('Shared search failed:', error); }
      finally { setLoading(false); }
    } else input.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const enter = (event) => { if (event.key === 'Enter') { event.preventDefault(); click(); } };
  button.addEventListener('click', click);
  input.addEventListener('keydown', enter);
  const api = { input, button, wrapper, setLoading, refresh: () => {}, destroy() {
    input.removeEventListener('keydown', enter);
    button.removeEventListener('click', click);
    wrapper.parentNode.insertBefore(input, wrapper);
    wrapper.remove(); input.classList.remove('shared-sync-search-input');
    delete input._syncSearch;
  }};
  input._syncSearch = api;
  return api;
}


/* =========================================================
   SHARED MODAL — extracted from Admin Users popup
   API: NewUI.modal.open({title,content,width,onClose})
        NewUI.modal.close(), NewUI.modal.create(options)
   ========================================================= */
const sharedModalCloseSVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6L18 18"></path><path d="M18 6L6 18"></path></svg>';
let sharedModalCounter = 0;
function createSharedModal(options = {}) {
  const backdrop = document.createElement('div');
  backdrop.className = 'shared-modal-backdrop';
  backdrop.setAttribute('aria-hidden','true');
  const dialog = document.createElement('div');
  dialog.className = 'shared-modal';
  dialog.setAttribute('role','dialog');
  dialog.setAttribute('aria-modal','true');
  const titleId = 'shared-modal-title-' + (++sharedModalCounter);
  dialog.setAttribute('aria-labelledby',titleId);
  if (options.width) dialog.style.maxWidth = typeof options.width === 'number' ? options.width + 'px' : options.width;
  const closeButton = document.createElement('button');
  closeButton.type='button'; closeButton.className='shared-modal-close';
  closeButton.setAttribute('aria-label','Close');
  closeButton.innerHTML = sharedModalCloseSVG;
  const heading = document.createElement('h2');
  heading.id=titleId; heading.className='shared-modal-title';
  heading.textContent=options.title || '';
  const body = document.createElement('div');body.className='shared-modal-body';
  const footer = document.createElement('div');footer.className='shared-modal-actions';
  dialog.append(closeButton,heading,body,footer);
  backdrop.append(dialog);
  document.body.append(backdrop);
  let previousFocus=null, destroyed=false;
  function setContent(value,target) {
    target.replaceChildren();
    if (value instanceof Node) target.append(value);
    else if (typeof value === 'string') target.innerHTML=value; // Trusted HTML only
  }
  if(options.content!=null)setContent(options.content,body);
  if(options.footer!=null)setContent(options.footer,footer);
  if(options.footer==null)footer.hidden=true;
  function keydown(event) {
    if(event.key==='Escape' && options.closeOnEscape!==false){event.preventDefault();close();}
    if(event.key==='Tab') {
      const focusables=Array.from(dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')).filter(e=>e.getClientRects().length);
      if(!focusables.length){event.preventDefault();dialog.focus();return;}
      const first=focusables[0],last=focusables[focusables.length-1];
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
    }
  }
  function open() {
    if(destroyed)return;
    document.querySelectorAll('.shared-modal-backdrop.open').forEach(e=>{if(e!==backdrop)e._sharedModalAPI?.close();});
    previousFocus=document.activeElement;
    backdrop.classList.add('open');backdrop.setAttribute('aria-hidden','false');
    document.documentElement.classList.add('new-ui-modal-open');
    document.addEventListener('keydown',keydown);
    closeButton.focus();
    options.onOpen?.(api);
    return api;
  }
  function close() {
    if(!backdrop.classList.contains('open'))return;
    backdrop.classList.remove('open');backdrop.setAttribute('aria-hidden','true');
    document.documentElement.classList.remove('new-ui-modal-open');
    document.removeEventListener('keydown',keydown);
    if(previousFocus?.isConnected)previousFocus.focus();
    options.onClose?.(api);
    if(options.destroyOnClose!==false)destroy();
  }
  function destroy() {
    if(destroyed)return;
    destroyed=true;
    document.removeEventListener('keydown',keydown);
    backdrop.remove();
  }

closeButton.addEventListener('click', close);

/* ==========================================
   MODAL - PREVENT SCROLLBAR AUTO CLOSE
   ========================================== */


/* ==========================================
   MODAL - OUTSIDE CLICK & SCROLLBAR FIX
   ========================================== */

let backdropPress = null;

function isBackdropScrollbar(event) {
  const rect = backdrop.getBoundingClientRect();

  // Lebar scrollbar sebenar, jika ada.
  const scrollbarWidth =
    backdrop.offsetWidth - backdrop.clientWidth;

  if (scrollbarWidth <= 0) return false;

  return event.clientX >=
    rect.right - scrollbarWidth;
}

backdrop.addEventListener('pointerdown', event => {
  backdropPress = null;

  if (event.target !== backdrop) return;
  if (event.button !== 0) return;
  if (options.closeOnBackdrop === false) return;

  // Klik scrollbar bukan klik luar modal.
  if (isBackdropScrollbar(event)) return;

  backdropPress = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY
  };
});

backdrop.addEventListener('pointerup', event => {
  const press = backdropPress;
  backdropPress = null;

  if (!press) return;
  if (event.pointerId !== press.pointerId) return;
  if (event.target !== backdrop) return;
  if (options.closeOnBackdrop === false) return;
  if (isBackdropScrollbar(event)) return;

  // Jangan tutup modal selepas drag.
  const moved =
    Math.abs(event.clientX - press.x) > 5 ||
    Math.abs(event.clientY - press.y) > 5;

  if (moved) return;

  close();
});

backdrop.addEventListener('pointercancel', () => {
  backdropPress = null;
});


  const api={element:backdrop,dialog,body,footer,open,close,destroy,
    setTitle(value){heading.textContent=String(value);},
    setContent(value){setContent(value,body);},
    setFooter(value){footer.hidden=value==null;if(value!=null)setContent(value,footer);}
  };
  backdrop._sharedModalAPI=api;
  if(options.autoOpen!==false)open();
  return api;
}
const sharedModalAPI = {
  create:createSharedModal,
  open(options={}){return createSharedModal({...options,autoOpen:true});},
  close(){document.querySelectorAll('.shared-modal-backdrop.open').forEach(e=>e._sharedModalAPI?.close());}
};

window.NewUI={syncSearch:createSyncSearch,init:initNewUI,input:createNewInput,dropdown:createSharedDropdown,chips:createSharedChipDropdown,icon:name=>NEW_UI_ICONS[name]||'',getValues:el=>{const e=typeof el==='string'?document.querySelector(el):el;return e?._sharedChipDropdown?.getValue?.()??e?.value??null;}};
window.NewUI.modal=sharedModalAPI;

/* =========================================================
   SHARED IMAGE UPLOAD + PREVIEW
   UI only; uploading to Cloudinary remains caller's responsibility.
========================================================= */
function createSharedImageUpload(target, options = {}) {
  const host = typeof target === 'string' ? document.querySelector(target) : target;
  if (!host) return null;
  if (host._sharedImageUpload) return host._sharedImageUpload;
  const accept = options.accept || 'image/png,image/jpeg,image/webp,image/gif';
  const maxSizeMB = Number(options.maxSizeMB || 10);
  const uploadSVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5M5 15v4h14v-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  
const deleteSVG = `
  <svg
    width="14"
    height="14"
    viewBox="0 0 1024 1024"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z"/>
  </svg>
`;

  const section = document.createElement('div'); section.className = 'shared-image-upload';
  const fileInput = document.createElement('input'); fileInput.type='file'; fileInput.accept=accept; fileInput.hidden=true;
  const pick = document.createElement('button'); pick.type='button'; pick.className='shared-image-upload-btn';
  pick.innerHTML=uploadSVG; pick.append(document.createTextNode(' '+(options.buttonText || 'Upload Image')));
  const preview=document.createElement('div'); preview.className='shared-image-upload-preview'; preview.hidden=true;
  
const imageWrap = document.createElement("div");
imageWrap.className = "shared-image-upload-thumb";

const img = document.createElement("img");
img.alt = "Image preview";

const hoverText = document.createElement("span");
hoverText.className = "shared-image-upload-hover-text";
hoverText.textContent = "Preview";
hoverText.setAttribute("aria-hidden", "true");

imageWrap.append(img, hoverText);

  const info=document.createElement('div'); info.className='shared-image-upload-file-info';
  const filename=document.createElement('strong'); const status=document.createElement('span'); status.textContent='Ready'; info.append(filename,status);
  const remove=document.createElement('button');remove.type='button';remove.className='shared-image-upload-remove';remove.setAttribute('aria-label','Remove image');remove.innerHTML=deleteSVG;
  preview.append(imageWrap,info,remove);section.append(fileInput,pick,preview);host.append(section);
  let file=null, url='', objectURL='', destroyed=false;
  function revoke(){if(objectURL){URL.revokeObjectURL(objectURL);objectURL='';}}
  function clear(notify=true){revoke();file=null;url='';fileInput.value='';img.removeAttribute('src');filename.textContent='';preview.hidden=true;status.textContent='Ready';if(notify)options.onChange?.({file:null,url:''});}
  function setUrl(nextUrl, name='Existing image'){
    clear(false);if(!nextUrl){options.onChange?.({file:null,url:''});return;}
    const parsed=new URL(nextUrl,location.href);
    if(!['https:','http:'].includes(parsed.protocol))throw new Error('Invalid image URL');
    url=parsed.href;img.src=url;filename.textContent=name;preview.hidden=false;options.onChange?.({file:null,url});
  }
  function showFile(nextFile){
    if(!nextFile)return;
    const allowed=['image/png','image/jpeg','image/webp','image/gif'];
    if(!allowed.includes(nextFile.type)){const e=new Error('Please select PNG, JPG, WEBP or GIF.');options.onError?.(e);fileInput.value='';return;}
    if(nextFile.size>maxSizeMB*1024*1024){const e=new Error('Image exceeds '+maxSizeMB+' MB.');options.onError?.(e);fileInput.value='';return;}
    clear(false);file=nextFile;objectURL=URL.createObjectURL(file);img.src=objectURL;filename.textContent=file.name;preview.hidden=false;options.onChange?.({file,url:''});
  }

/* ==========================================
   SHARED UPLOAD - CLICK IMAGE TO PREVIEW
   ========================================== */

function openUploadImagePreview() {
  if (destroyed || preview.hidden) return;

  const src = img.currentSrc || img.src;

  if (!src) return;

  if (typeof window.NewUI?.imagePreview !== "function") {
    console.warn("NewUI.imagePreview belum tersedia.");
    return;
  }

  window.NewUI.imagePreview({
    src,
    title: filename.textContent || "Image Preview",
    alt: filename.textContent || "Uploaded Image"
  });
}

img.setAttribute("tabindex", "0");
img.setAttribute("role", "button");
img.setAttribute("aria-label", "Preview uploaded image");

img.addEventListener("click", openUploadImagePreview);

img.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openUploadImagePreview();
  }
});

  pick.addEventListener('click',()=>fileInput.click());
  fileInput.addEventListener('change',()=>showFile(fileInput.files?.[0]));
  remove.addEventListener('click',()=>clear());
  const api={element:section,input:fileInput,preview,image:img,button:pick,
    getFile:()=>file,getUrl:()=>url,clear,setUrl,setStatus(value){status.textContent=String(value);},
    setDisabled(value){pick.disabled=!!value;remove.disabled=!!value;fileInput.disabled=!!value;},
    destroy(){if(destroyed)return;destroyed=true;clear(false);section.remove();delete host._sharedImageUpload;}
  };
  host._sharedImageUpload=api;
  if(options.initialUrl)setUrl(options.initialUrl,options.initialName||'Existing image');
  return api;
}

/* =========================================================
   GLOBAL CUSTOM TOAST
========================================================= */

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



/* MAXIMUM 3 STACKED TOAST */

/* =========================================================
   NEW UI - SMART TOAST STACK
   Normal: max 5 rows
   Rapid clicks: temporary stacked effect
========================================================= */

const TOAST_MAX_VISIBLE = 5;
const TOAST_STACK_TRIGGER = 4;
const TOAST_STACK_DELAY = 800;
const TOAST_GAP = 10;

let toastBurstCount = 0;
let toastStackTimer = null;
let toastStackActive = false;

function updateToastStack() {
  const container = document.getElementById(
    "globalToastContainer"
  );

  if (!container) return;

  let toasts = Array.from(
    container.querySelectorAll(
      ".custom-toast:not(.hide)"
    )
  );

  // Keep only 5 newest toasts
  while (toasts.length > TOAST_MAX_VISIBLE) {
    const oldest = toasts.shift();

    clearTimeout(oldest._toastTimer);
    oldest.remove();
  }

  const total = toasts.length;

  // Stack only during a rapid-click burst
  const stacked =
    toastStackActive &&
    total >= TOAST_STACK_TRIGGER;

  container.classList.toggle(
    "toast-stacked",
    stacked
  );

  let normalOffset = 0;

  // Calculate from newest to oldest
  [...toasts].reverse().forEach((toast, depth) => {
    toast.style.setProperty(
      "--toast-depth",
      depth
    );

    toast.style.setProperty(
      "--toast-offset",
      `${normalOffset}px`
    );

    // Newest toast always in front
    toast.style.zIndex = String(total - depth);

    toast.style.pointerEvents =
      stacked && depth > 0
        ? "none"
        : "auto";

    // Measure each toast to avoid overlapping
    // messages with different heights
    normalOffset +=
      toast.offsetHeight + TOAST_GAP;
  });
}

function registerToastBurst() {
  toastBurstCount++;

  clearTimeout(toastStackTimer);

  if (toastBurstCount >= TOAST_STACK_TRIGGER) {
    toastStackActive = true;
  }

  updateToastStack();

  // When user stops clicking, expand to normal rows
  toastStackTimer = setTimeout(() => {
    toastBurstCount = 0;
    toastStackActive = false;

    updateToastStack();
  }, TOAST_STACK_DELAY);
}

function removeToast(toast) {
  if (!toast || toast.dataset.removing === "true") {
    return;
  }

  toast.dataset.removing = "true";

  clearTimeout(toast._toastTimer);

  toast.classList.remove("show");
  toast.classList.add("hide");

  toast.style.pointerEvents = "none";

  updateToastStack();

  setTimeout(() => {
    toast.remove();
    updateToastStack();
  }, 300);
}

// Recalculate positions when viewport changes
window.addEventListener("resize", updateToastStack);


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

  const messageElement =
    document.createElement(
      "div"
    );

  messageElement.className =
    "custom-toast-message";

  messageElement.textContent =
    String(message ?? "");

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

// Detect rapid consecutive toast calls
registerToastBurst();
  /*
    Trigger enter animation.
  */

  requestAnimationFrame(
    () => {

      requestAnimationFrame(
        () => {

if (toast.isConnected && toast.dataset.removing !== "true") {
  toast.classList.add("show");
}

        }
      );

    }
  );


  /*
    AUTO CLOSE
  */

if (duration > 0) {
  toast._toastTimer = setTimeout(() => {
    removeToast(toast);
  }, duration);
}


  return toast;

}


/* =========================================================
   GLOBAL ACCESS
========================================================= */

window.showToast =
  showToast;
window.NewUI.showToast=showToast;
window.NewUI.removeToast=removeToast;

/* ==========================================
   NEW UI - SHARED BUTTON LOADING
   ========================================== */


/* SHARED BUTTON LOADING - SMOOTH */

const sharedButtonStates = new WeakMap();

async function setButtonLoading(target, loading, options = {}) {
  const btn = typeof target === 'string'
    ? document.querySelector(target)
    : target;

  if (!(btn instanceof HTMLButtonElement)) return;

  if (loading) {
    if (sharedButtonStates.has(btn)) return;

    const state = {
      html: btn.innerHTML,
      disabled: btn.disabled,
      ariaBusy: btn.getAttribute('aria-busy'),
      startedAt: performance.now(),
      stopping: null
    };

    sharedButtonStates.set(btn, state);

    const spinner = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    );

    spinner.setAttribute('class', 'shared-btn-spinner');
    spinner.setAttribute('viewBox', '0 0 24 24');
    spinner.setAttribute('fill', 'none');
    spinner.setAttribute('aria-hidden', 'true');

    spinner.innerHTML = `
      <circle cx="12" cy="12" r="9"
        stroke="currentColor"
        stroke-width="3"
        opacity=".25"/>
      <path d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"/>
    `;

    const label = document.createElement('span');
    label.textContent = options.text || 'Saving...';

    btn.replaceChildren(spinner, label);
    btn.classList.add('shared-btn-loading');
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');

    return;
  }

  const state = sharedButtonStates.get(btn);
  if (!state) return;

  // Elakkan dua panggilan stop berjalan serentak.
  if (state.stopping) return state.stopping;

  state.stopping = (async () => {
    const minDuration = Math.max(
      0,
      Number(options.minDuration ?? 700) || 0
    );

    const elapsed = performance.now() - state.startedAt;
    const remaining = Math.max(0, minDuration - elapsed);

    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }

    if (sharedButtonStates.get(btn) !== state) return;

    btn.innerHTML = state.html;
    btn.disabled = state.disabled;
    btn.classList.remove('shared-btn-loading');

    if (state.ariaBusy === null) {
      btn.removeAttribute('aria-busy');
    } else {
      btn.setAttribute('aria-busy', state.ariaBusy);
    }

    sharedButtonStates.delete(btn);
  })();

  return state.stopping;
}

window.NewUI.setButtonLoading = setButtonLoading;


/* ==========================================
   NEW UI - SHARED REFRESH BUTTON
   ========================================== */

(function () {
  const refreshStates = new WeakMap();

  const refreshIcon = `
    <svg class="newui-refresh-btn-icon"
      viewBox="0 0 1024 1024"
      aria-hidden="true">
      <path fill="currentColor"
        d="M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5a8 8 0 00-10.1 4.8c-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 01655.9 829c-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27A341.5 341.5 0 01279 755.2a342.16 342.16 0 01-73.7-109.4c-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27a341.5 341.5 0 01109.3 73.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-10.3-13-6.2z"/>
    </svg>
  `;

  function getButton(target) {
    const btn = typeof target === "string"
      ? document.querySelector(target)
      : target;

    if (!(btn instanceof HTMLButtonElement)) {
      throw new Error("Refresh button not found");
    }

    return btn;
  }

  function init(target, text = "Refresh") {
    const btn = getButton(target);

    if (refreshStates.has(btn)) return btn;

    const state = {
      text,
      busy: false,
      originalDisabled: btn.disabled
    };

    refreshStates.set(btn, state);

    btn.classList.add("newui-refresh-btn");
    btn.replaceChildren();

    const template = document.createElement("template");
    template.innerHTML = refreshIcon.trim();

    btn.appendChild(template.content.cloneNode(true));
    btn.appendChild(document.createTextNode(text));

    return btn;
  }

  async function run(target, task, options = {}) {
    const btn = init(target, options.text || "Refresh");
    const state = refreshStates.get(btn);

    if (state.busy || btn.disabled) return;

    if (typeof task !== "function") {
      throw new TypeError("Refresh task must be a function");
    }

    state.busy = true;
    state.originalDisabled = btn.disabled;

    btn.classList.add("is-refreshing");

    try {
      // Guna spinner yang sama dengan tombol Save.
      await window.NewUI.setButtonLoading(btn, true, {
        text: options.loadingText || "Refreshing..."
      });

      return await task();
    } finally {
      await window.NewUI.setButtonLoading(btn, false, {
        minDuration: options.minDuration ?? 450
      });

      btn.classList.remove("is-refreshing");
      btn.disabled = state.originalDisabled;
      state.busy = false;
    }
  }

  window.NewUI = window.NewUI || {};

  window.NewUI.refreshButton = {
    init,
    run
  };
})();

/* ================================================
   NEW UI - SHARED CONFIRM POPOVER
   ================================================ */

let activeSharedConfirm = null;

function sharedConfirm(options = {}) {
  // Hanya satu confirm box boleh dibuka pada satu masa.
  activeSharedConfirm?.close();

  const anchor = typeof options.target === 'string'
    ? document.querySelector(options.target)
    : options.target;

  if (!(anchor instanceof Element)) {
    return Promise.resolve(false);
  }

  return new Promise(resolve => {
    let finished = false;
    let busy = false;

    const previousFocus = document.activeElement;

    const pop = document.createElement('div');
    pop.className = 'shared-confirm-popover';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'true');
    pop.setAttribute('aria-label', options.title || 'Confirm action');
    pop.tabIndex = -1;

    pop.innerHTML = `
      <div class="shared-confirm-header">
        <span class="shared-confirm-icon">
          <svg viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 7v5"/>
            <path d="M12 16h.01"/>
          </svg>
        </span>

        <strong class="shared-confirm-title"></strong>

        <button type="button"
                class="shared-confirm-close"
                aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="shared-confirm-message"></div>

      <div class="shared-confirm-actions">
        <button type="button"
                class="shared-confirm-cancel">
          Cancel
        </button>

        <button type="button"
                class="shared-confirm-accept">
          Delete
        </button>
      </div>
    `;

    pop.querySelector('.shared-confirm-title').textContent =
      options.title || 'Are you sure?';

    pop.querySelector('.shared-confirm-message').textContent =
      options.message || 'This action cannot be undone.';

    const cancel = pop.querySelector('.shared-confirm-cancel');
    const accept = pop.querySelector('.shared-confirm-accept');
    const closeBtn = pop.querySelector('.shared-confirm-close');

    cancel.textContent = options.cancelText || 'Cancel';
    accept.textContent = options.confirmText || 'Delete';

    if (options.danger === false) {
      accept.classList.add('is-primary');
    }

    function position() {
      const rect = anchor.getBoundingClientRect();
      const width = pop.offsetWidth;
      const height = pop.offsetHeight;
      const gap = 10;
      const margin = 10;

      // Default: sebelah kiri tombol.
      let left = rect.left - width - gap;
      let side = 'left';

      // Jika kiri tidak cukup, cuba kanan.
      if (left < margin) {
        left = rect.right + gap;
        side = 'right';
      }

      // Jika kanan pun tidak cukup, letak di atas.
      if (left + width > window.innerWidth - margin) {
        left = rect.right - width;
        side = 'top';
      }

      left = Math.max(
        margin,
        Math.min(left, window.innerWidth - width - margin)
      );

      let top;

      if (side === 'top') {
        top = rect.top - height - gap;

        if (top < margin) {
          top = rect.bottom + gap;
        }
      } else {
        top = rect.top + rect.height / 2 - height / 2;
      }

      top = Math.max(
        margin,
        Math.min(top, window.innerHeight - height - margin)
      );

      pop.style.left = `${Math.round(left)}px`;
      pop.style.top = `${Math.round(top)}px`;
    }

    function cleanup(result) {
      if (finished) return;
      finished = true;

      document.removeEventListener('pointerdown', onOutside, true);
      document.removeEventListener('keydown', onKeydown, true);
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);

      pop.remove();

      if (activeSharedConfirm?.element === pop) {
        activeSharedConfirm = null;
      }

      if (previousFocus?.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }

      resolve(result);
    }

    function onOutside(e) {
      if (busy) return;

      if (!pop.contains(e.target)) {
        cleanup(false);
      }
    }

    function onKeydown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();

        if (!busy) cleanup(false);
        return;
      }

      // Kekalkan keyboard focus di dalam confirm box.
      if (e.key === 'Tab') {
        const buttons = [closeBtn, cancel, accept];
        const index = buttons.indexOf(document.activeElement);

        if (e.shiftKey && index <= 0) {
          e.preventDefault();
          accept.focus();
        } else if (!e.shiftKey && index === buttons.length - 1) {
          e.preventDefault();
          closeBtn.focus();
        }
      }
    }

    cancel.addEventListener('click', () => cleanup(false));
    closeBtn.addEventListener('click', () => cleanup(false));

    accept.addEventListener('click', async () => {
      if (busy) return;

      // Mode callback: boleh tunggu Firebase delete selesai.
      if (typeof options.onConfirm === 'function') {
        busy = true;
        cancel.disabled = true;
        closeBtn.disabled = true;

        try {
          if (window.NewUI?.setButtonLoading) {
            NewUI.setButtonLoading(accept, true, {
              text: options.loadingText || 'Deleting...'
            });
          } else {
            accept.disabled = true;
          }

          await options.onConfirm();

          if (window.NewUI?.setButtonLoading) {
            await NewUI.setButtonLoading(accept, false);
          }

          cleanup(true);
        } catch (err) {
          console.error('Confirm action failed:', err);

          if (window.NewUI?.setButtonLoading) {
            await NewUI.setButtonLoading(accept, false);
          }

          accept.disabled = false;
          cancel.disabled = false;
          closeBtn.disabled = false;
          busy = false;

          window.NewUI?.showToast?.(
            err.message || 'Action failed',
            'error'
          );
        }

        return;
      }

      cleanup(true);
    });

    document.body.appendChild(pop);
    position();

    activeSharedConfirm = {
      element: pop,
      close: () => {
        if (!busy) cleanup(false);
      }
    };

    document.addEventListener('pointerdown', onOutside, true);
    document.addEventListener('keydown', onKeydown, true);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);

    requestAnimationFrame(() => {
      if (!finished) {
        pop.classList.add('is-visible');
        cancel.focus({ preventScroll: true });
      }
    });
  });
}

window.NewUI.confirm = sharedConfirm;

window.NewUI.imageUpload=createSharedImageUpload;
window.createSharedDropdown=createSharedDropdown;
window.createSharedChipDropdown=createSharedChipDropdown;
window.initSharedDropdowns=initSharedDropdowns;
window.createEmptyState=createEmptyState;
window.createLoadingState=createLoadingState;
window.showEmptyState=showEmptyState;
window.showLoadingState=showLoadingState;
window.clearSharedState=clearSharedState;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>initNewUI(),{once:true});
else initNewUI();

/* =========================================================
   SHARED ACTIVE / INACTIVE SWITCH
   Reusable across all admin tabs. No Firebase dependency.
   HTML: <label class="shared-active-switch"><input type="checkbox"
         data-active-label="Active Notice" data-inactive-label="Inactive Notice" checked>
         <span class="shared-active-track"><span class="shared-active-text"></span>
         <span class="shared-active-knob" aria-hidden="true"></span></span></label>
   Read .checked and listen for "change" to persist using each page's logic.
   ========================================================= */
function syncSharedActiveSwitch(input) {
  if (!input || !input.matches('.shared-active-switch input[type="checkbox"]')) return;
  const label = input.nextElementSibling?.querySelector('.shared-active-text');
  const activeText = input.dataset.activeLabel || 'Active';
  const inactiveText = input.dataset.inactiveLabel || 'Inactive';
  const text = input.checked ? activeText : inactiveText;
  if (label) label.textContent = text;
  input.setAttribute('aria-label', text);
}
function initSharedActiveSwitches(root = document) {
  if (root.matches?.('.shared-active-switch input[type="checkbox"]')) syncSharedActiveSwitch(root);
  root.querySelectorAll?.('.shared-active-switch input[type="checkbox"]').forEach(syncSharedActiveSwitch);
}
document.addEventListener('change', event => {
  if (event.target.matches?.('.shared-active-switch input[type="checkbox"]')) {
    syncSharedActiveSwitch(event.target);
  }
});
window.SharedActiveSwitch = { init: initSharedActiveSwitches, sync: syncSharedActiveSwitch };
window.NewUI.activeSwitch = window.SharedActiveSwitch;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initSharedActiveSwitches(), { once: true });
} else {
  initSharedActiveSwitches();
}
})();
/* 5G88 reusable pagination. Load after new-ui.js */
(() => {
  'use strict';
  window.NewUI = window.NewUI || {};
  const SVG = {
    prev: '<svg viewBox="64 64 896 896" aria-hidden="true"><path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"/></svg>',
    next: '<svg viewBox="64 64 896 896" aria-hidden="true"><path d="M765.7 486.8L314.9 134.7A7.97 7.97 0 00302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 000-50.4z"/></svg>',
    back5: '<svg viewBox="64 64 896 896" aria-hidden="true"><path d="M272.9 512l265.4-339.1c4.1-5.2.4-12.9-6.3-12.9h-77.3c-4.9 0-9.6 2.3-12.6 6.1L186.8 492.3a31.99 31.99 0 000 39.5l255.3 326.1c3 3.9 7.7 6.1 12.6 6.1H532c6.7 0 10.4-7.7 6.3-12.9L272.9 512zm304 0l265.4-339.1c4.1-5.2.4-12.9-6.3-12.9h-77.3c-4.9 0-9.6 2.3-12.6 6.1L490.8 492.3a31.99 31.99 0 000 39.5l255.3 326.1c3 3.9 7.7 6.1 12.6 6.1H836c6.7 0 10.4-7.7 6.3-12.9L576.9 512z"/></svg>',
    forward5: '<svg viewBox="64 64 896 896" aria-hidden="true"><path d="M533.2 492.3L277.9 166.1c-3-3.9-7.7-6.1-12.6-6.1H188c-6.7 0-10.4 7.7-6.3 12.9L447.1 512 181.7 851.1A7.98 7.98 0 00188 864h77.3c4.9 0 9.6-2.3 12.6-6.1l255.3-326.1c9.1-11.7 9.1-27.9 0-39.5zm304 0L581.9 166.1c-3-3.9-7.7-6.1-12.6-6.1H492c-6.7 0-10.4 7.7-6.3 12.9L751.1 512 485.7 851.1A7.98 7.98 0 00492 864h77.3c4.9 0 9.6-2.3 12.6-6.1l255.3-326.1c9.1-11.7 9.1-27.9 0-39.5z"/></svg>'
  };
  const down = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 9 7 7 7-7"/></svg>';
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  window.NewUI.pagination = function(target, config = {}) {
    const root = typeof target === 'string' ? document.querySelector(target) : target;
    if (!(root instanceof HTMLElement)) throw new Error('NewUI.pagination: target not found');
    if (root.__newUIPagination) return root.__newUIPagination;
    let total = Math.max(0, Number(config.total) || 0);
    let pageSize = Math.max(1, Number(config.pageSize) || 10);
    let page = Math.max(1, Number(config.page) || 1);
    const sizes = Array.isArray(config.pageSizes) && config.pageSizes.length ? config.pageSizes.filter(n => Number.isInteger(n) && n > 0) : [10,20,50,100];
    const onChange = typeof config.onChange === 'function' ? config.onChange : () => {};
    root.classList.add('new-ui-pagination');
    root.innerHTML = '<span class="new-ui-pagination-info"></span><div class="new-ui-pagination-numbers"></div><div class="new-ui-pagination-size"><button class="new-ui-pagination-size-trigger" type="button" aria-haspopup="listbox" aria-expanded="false"><span></span>'+down+'</button><div class="new-ui-pagination-size-panel" role="listbox" hidden></div></div><div class="new-ui-pagination-goto"><span>Go to</span><input class="new-ui-pagination-jump" type="number" min="1" aria-label="Go to page"><span>Page</span></div>';
    const info = root.querySelector('.new-ui-pagination-info');
    const nums = root.querySelector('.new-ui-pagination-numbers');
    const trigger = root.querySelector('.new-ui-pagination-size-trigger');
    const sizeText = trigger.querySelector('span');
    const panel = root.querySelector('.new-ui-pagination-size-panel');
    const jump = root.querySelector('.new-ui-pagination-jump');
    const pages = () => Math.max(1, Math.ceil(total / pageSize));
    function closeMenu(){panel.hidden = true; trigger.setAttribute('aria-expanded','false');}
    function notify(){onChange({page,pageSize,total,totalPages:pages(),start:total?(page-1)*pageSize:0,end:Math.min(total,page*pageSize)});}
    function go(p){const next=clamp(Math.floor(Number(p)||1),1,pages()); if(next===page)return;page=next;render();notify();}
    function btn(label,p,disabled=false,active=false,kind=''){
      const b=document.createElement('button');b.type='button';b.className='new-ui-pagination-btn'+(kind?' '+kind:'')+(active?' active':'');b.disabled=disabled;
      if(kind==='new-ui-pagination-arrow'){b.innerHTML=SVG[label];b.setAttribute('aria-label',label==='prev'?'Previous page':'Next page');}
      else b.textContent=String(label);
      if(active)b.setAttribute('aria-current','page');b.addEventListener('click',()=>go(p));nums.append(b);
    }
    function dots(dir){const b=document.createElement('button');b.type='button';b.className='new-ui-pagination-dots';b.title=dir==='prev'?'Jump back 5 pages':'Jump forward 5 pages';b.setAttribute('aria-label',b.title);b.innerHTML='<span class="new-ui-pagination-dots-text" aria-hidden="true">•••</span><span class="new-ui-pagination-dots-icon" aria-hidden="true">'+SVG[dir==='prev'?'back5':'forward5']+'</span>';b.addEventListener('click',()=>go(page+(dir==='prev'?-5:5)));nums.append(b);}
    function render(){
      page=clamp(page,1,pages());root.hidden=total===0;if(!total){closeMenu();return;}
      info.textContent=`${(page-1)*pageSize+1}-${Math.min(total,page*pageSize)} of ${total} items`;
      sizeText.textContent=pageSize+' / page';jump.max=String(pages());jump.value='';nums.replaceChildren();
      btn('prev',page-1,page===1,false,'new-ui-pagination-arrow');
      const visible=new Set([1,pages()]);for(let p=Math.max(1,page-2);p<=Math.min(pages(),page+2);p++)visible.add(p);
      let previous=0;[...visible].sort((a,b)=>a-b).forEach(p=>{if(p-previous>1)dots(p<=page?'prev':'next');btn(p,p,false,p===page);previous=p;});
      btn('next',page+1,page===pages(),false,'new-ui-pagination-arrow');
      panel.replaceChildren();sizes.forEach(n=>{const b=document.createElement('button');b.type='button';b.className='new-ui-pagination-size-option'+(n===pageSize?' active':'');b.textContent=n+' / page';b.setAttribute('role','option');b.setAttribute('aria-selected',String(n===pageSize));b.addEventListener('click',()=>{closeMenu();if(n===pageSize)return;pageSize=n;page=1;render();notify();});panel.append(b);});
    }
    trigger.addEventListener('click',()=>{const open=panel.hidden;panel.hidden=!open;trigger.setAttribute('aria-expanded',String(open));});
    function outside(e){if(!root.contains(e.target))closeMenu();}
    function escape(e){if(e.key==='Escape')closeMenu();}
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    function jumpNow(){if(jump.value.trim()==='')return;go(jump.value);jump.value='';}
    jump.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();jumpNow();}});
    jump.addEventListener('change',jumpNow);
    const api={setTotal(n){total=Math.max(0,Number(n)||0);render();},setPage(p){go(p);},setPageSize(n){const v=Math.floor(Number(n));if(v<1||!Number.isFinite(v))return;pageSize=v;page=1;render();notify();},update(opts={}){if(opts.total!==undefined)total=Math.max(0,Number(opts.total)||0);if(opts.pageSize!==undefined)pageSize=Math.max(1,Number(opts.pageSize)||10);if(opts.page!==undefined)page=Math.max(1,Number(opts.page)||1);render();},getState(){return{page,pageSize,total,totalPages:pages()};},destroy(){document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);root.replaceChildren();root.classList.remove('new-ui-pagination');delete root.__newUIPagination;}};
    root.__newUIPagination=api;render();return api;
  };
})();

/* ==========================================
   NEW UI - REUSABLE REFRESH LOADING
   ========================================== */

(function () {
  "use strict";

  const loaders = new WeakMap();

  function getTarget(target) {
    if (!target) return document.body;

    if (typeof target === "string") {
      const element = document.querySelector(target);

      if (!element) {
        throw new Error(
          "NewUI.refreshLoading: Target not found: " + target
        );
      }

      return element;
    }

    if (!(target instanceof HTMLElement)) {
      throw new Error("NewUI.refreshLoading: Invalid target");
    }

    return target;
  }

  function show(options = {}) {
    const target = getTarget(options.target);
    const message =
      options.message ?? "Please wait while fetching...";

    let state = loaders.get(target);

    if (state) {
      state.count++;

const label = state.overlay.querySelector(
  ".smart-loading-text"
);

      if (label) label.textContent = String(message);

      return target;
    }

    const overlay = document.createElement("div");
    overlay.className = "newui-refresh-overlay";

    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");
    overlay.setAttribute("aria-label", "Loading");


overlay.innerHTML = `
  <div class="smart-loading-box">
    <div class="smart-loading-dots" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
    <div class="smart-loading-text"></div>
  </div>
`;


overlay.querySelector(
  ".smart-loading-text"
).textContent = String(message);

    let previousPosition = null;

    if (target !== document.body) {
      overlay.classList.add("is-container");

      if (getComputedStyle(target).position === "static") {
        previousPosition = target.style.position;
        target.style.position = "relative";
      }
    }

    target.appendChild(overlay);

    loaders.set(target, {
      overlay,
      count: 1,
      previousPosition
    });

    return target;
  }

  function hide(target = document.body) {
    const element = getTarget(target);
    const state = loaders.get(element);

    if (!state) return;

    state.count--;

    if (state.count > 0) return;

    state.overlay.remove();

    if (state.previousPosition !== null) {
      element.style.position = state.previousPosition;
    }

    loaders.delete(element);
  }

  async function run(task, options = {}) {
    if (typeof task !== "function") {
      throw new TypeError(
        "NewUI.refreshLoading.run requires a function"
      );
    }

    const target = show(options);

    try {
      return await task();
    } finally {
      hide(target);
    }
  }

  window.NewUI = window.NewUI || {};

  window.NewUI.refreshLoading = {
    show,
    hide,
    run
  };

})();

/* =========================================================
   NEW UI - SHARED IMAGE PREVIEW
   ========================================================= */
(function () {
  "use strict";

  const UI = window.NewUI = window.NewUI || {};
  if (UI.imagePreview) return;

  const icons = {
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    left: '<path d="M3 11a9 9 0 1 1 2.7 6.4M3 4v7h7"/>',
    right: '<path d="M21 11a9 9 0 1 0-2.7 6.4M21 4v7h-7"/>',
    flipH: '<path d="M12 3v18" stroke-dasharray="2 3"/><path d="m9 7-5 5 5 5V7Zm6 0 5 5-5 5V7Z"/>',
    flipV: '<path d="M3 12h18" stroke-dasharray="2 3"/><path d="m7 9 5-5 5 5H7Zm0 6 5 5 5-5H7Z"/>'
  };

  const svg = name =>
    `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;

  let active = null;

  function open(opts) {
    if (typeof opts === "string") opts = { src: opts };
    opts = opts || {};
    if (!opts.src) return null;

    if (active) active.close();

    const priorFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const root = document.createElement("div");

    root.className = "newui-image-preview is-open";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", opts.title || "Image preview");

    root.innerHTML = `
      <div class="newui-image-preview-stage">
        <img class="newui-image-preview-image"
             draggable="false" alt="">
      </div>

      <button type="button" class="newui-image-preview-close"
              data-action="close" aria-label="Close preview"
              title="Close">
        ${svg("close")}
      </button>

      <div class="newui-image-preview-toolbar"
           role="toolbar" aria-label="Image controls">

        <button type="button" data-action="out"
                aria-label="Zoom out" title="Zoom Out">−</button>

        <span class="newui-image-preview-value">100%</span>

        <button type="button" data-action="in"
                aria-label="Zoom in" title="Zoom In">+</button>

        <span class="newui-image-preview-divider"></span>

        <button type="button" data-action="left"
                aria-label="Rotate left" title="Rotate Left">
          ${svg("left")}
        </button>

        <button type="button" data-action="right"
                aria-label="Rotate right" title="Rotate Right">
          ${svg("right")}
        </button>

        <span class="newui-image-preview-divider"></span>

        <button type="button" data-action="flipH"
                aria-label="Flip horizontal" title="Flip Horizontal">
          ${svg("flipH")}
        </button>

        <button type="button" data-action="flipV"
                aria-label="Flip vertical" title="Flip Vertical">
          ${svg("flipV")}
        </button>

        <span class="newui-image-preview-divider"></span>

        <button type="button" class="newui-image-preview-reset"
                data-action="reset" title="Reset image">
          Reset
        </button>
      </div>
    `;

    const stage = root.querySelector(".newui-image-preview-stage");
    const img = root.querySelector("img");
    const value = root.querySelector(".newui-image-preview-value");

    img.src = opts.src;
    img.alt = opts.alt || opts.title || "Preview image";

    let zoom = 1;
    let x = 0;
    let y = 0;
    let rotation = 0;
    let flipX = 1;
    let flipY = 1;
    let drag = null;
    let moved = false;

    function update() {
      zoom = Math.max(1, Math.min(5, zoom));

      if (zoom === 1) {
        x = 0;
        y = 0;
      }

      img.style.transform =
        `translate(${x}px,${y}px) rotate(${rotation}deg) ` +
        `scale(${zoom * flipX},${zoom * flipY})`;

      value.textContent = Math.round(zoom * 100) + "%";
      stage.classList.toggle("is-zoomed", zoom > 1);
    }

    function reset() {
      zoom = 1;
      x = 0;
      y = 0;
      rotation = 0;
      flipX = 1;
      flipY = 1;
      update();
    }

    function close() {
      if (active !== api) return;

      active = null;
      document.removeEventListener("keydown", onKey, true);
      root.remove();
      document.body.style.overflow = previousOverflow;

      if (priorFocus && priorFocus.isConnected && priorFocus.focus) {
        priorFocus.focus();
      }

      if (typeof opts.onClose === "function") opts.onClose();
    }

    const api = { close, reset, element: root };

    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }

      if (e.key !== "Tab") return;

      const buttons = Array.from(root.querySelectorAll("button"));
      const first = buttons[0];
      const last = buttons[buttons.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    root.addEventListener("click", e => {
      const button = e.target.closest("button[data-action]");

      if (!button) {
        if ((e.target === stage || e.target === root) && !moved) {
          close();
        }
        moved = false;
        return;
      }

      switch (button.dataset.action) {
        case "close":
          close();
          return;
        case "in":
          zoom += 0.25;
          break;
        case "out":
          zoom -= 0.25;
          break;
        case "left":
          rotation -= 90;
          break;
        case "right":
          rotation += 90;
          break;
        case "flipH":
          flipX *= -1;
          break;
        case "flipV":
          flipY *= -1;
          break;
        case "reset":
          reset();
          return;
      }

      update();
    });

    stage.addEventListener("wheel", e => {
      e.preventDefault();
      zoom += e.deltaY < 0 ? 0.2 : -0.2;
      update();
    }, { passive: false });

    stage.addEventListener("pointerdown", e => {
      if (zoom <= 1 || (e.pointerType === "mouse" && e.button !== 0)) {
        return;
      }

      e.preventDefault();
      moved = false;

      drag = {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - x,
        offsetY: e.clientY - y
      };

      stage.classList.add("is-dragging");
      stage.setPointerCapture(e.pointerId);
    });

    stage.addEventListener("pointermove", e => {
      if (!drag || e.pointerId !== drag.id) return;

      if (
        Math.abs(e.clientX - drag.startX) > 3 ||
        Math.abs(e.clientY - drag.startY) > 3
      ) {
        moved = true;
      }

      x = e.clientX - drag.offsetX;
      y = e.clientY - drag.offsetY;
      update();
    });

    function stop(e) {
      if (!drag || e.pointerId !== drag.id) return;

      drag = null;
      stage.classList.remove("is-dragging");

      if (stage.hasPointerCapture(e.pointerId)) {
        stage.releasePointerCapture(e.pointerId);
      }
    }

    stage.addEventListener("pointerup", stop);
    stage.addEventListener("pointercancel", stop);

    stage.addEventListener("lostpointercapture", () => {
      drag = null;
      stage.classList.remove("is-dragging");
    });

    document.body.appendChild(root);
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey, true);

    active = api;
    root.querySelector('[data-action="close"]').focus();

    return api;
  }

  UI.imagePreview = function (opts) {
    return open(opts);
  };

  UI.imagePreview.bind = function (selector) {
    const handler = e => {
      const trigger = e.target.closest(selector);
      if (!trigger) return;

      if (
        e.type === "keydown" &&
        e.key !== "Enter" &&
        e.key !== " "
      ) return;

      if (e.type === "keydown") e.preventDefault();

      const image = trigger.matches("img")
        ? trigger
        : trigger.querySelector("img");

      const src =
        trigger.dataset.previewSrc ||
        image?.currentSrc ||
        image?.src;

      if (src) {
        open({
          src,
          title:
            trigger.dataset.previewTitle ||
            image?.alt ||
            "Image Preview"
        });
      }
    };

    document.addEventListener("click", handler);
    document.addEventListener("keydown", handler);

    return () => {
      document.removeEventListener("click", handler);
      document.removeEventListener("keydown", handler);
    };
  };
})();
