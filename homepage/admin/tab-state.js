
/* ==========================================
   5G88 SELECTIVE TAB STATE V2
   UID + HTML PAGE
   ========================================== */
(() => {
  "use strict";

  if (window.__5G88_TAB_STATE__) return;
  window.__5G88_TAB_STATE__ = true;

  const page = location.pathname
    .split("/").pop().toLowerCase();

  if (!page || [
    "login.html",
    "index.html",
    "users.html"
  ].includes(page)) return;

  const PREFIX = "5g88.tabState.v1";
  const RESET_PREFIX = "5g88.tabReset.v2:";
  const MODAL_SELECTOR = [
    '[role="dialog"]',
    '[aria-modal="true"]',
    'dialog',
    '.modal',
    '.modal-overlay',
    '.modal-backdrop',
    '.shared-modal',
    '.newui-modal',
    '.mg-modal',
    '[data-modal]',
    '[class*="modal-content"]',
    '[class*="modal-body"]'
  ].join(",");

  let initialized = false;
  let restoring = false;
  let timer = null;
  let resetThisPage = false;

  function getUid() {
    try {
      const user = firebase.auth().currentUser;
      const marker = sessionStorage.getItem(
        "5g88.adminSession"
      );
      const expiry = Number(
        localStorage.getItem("autoLogout.expireAt")
      );

      if (
        !user ||
        user.isAnonymous ||
        user.uid !== marker ||
        !Number.isFinite(expiry) ||
        expiry <= Date.now()
      ) return null;

      return user.uid;
    } catch (_) {
      return null;
    }
  }

  function key() {
    const uid = getUid();
    return uid ? `${PREFIX}:${uid}:${page}` : null;
  }

  function resetKey() {
    const uid = getUid();
    return uid
      ? `${RESET_PREFIX}${uid}:${page}`
      : null;
  }

  function eligible(el) {
    if (!(el instanceof HTMLElement)) return false;

    if (!el.matches("input,textarea,select")) {
      return false;
    }

    if (el.closest(
      MODAL_SELECTOR +
      ',[data-no-tab-save],[data-sensitive],' +
      '.password-wrap,.pin-inputs'
    )) return false;

    if (el.matches(
      '[type="password"],[type="hidden"],' +
      '[type="file"],[type="submit"],' +
      '[type="button"],[type="reset"],' +
      '[type="number"][data-sensitive]'
    )) return false;

    if (el.disabled) return false;

    // Input carian DALAM panel dropdown tidak disimpan.
    if (el.closest(
      '.shared-dropdown-panel,' +
      '.cs-options,.cs-menu,' +
      '[role="listbox"]'
    )) return false;

    const identity = [
      el.id,
      el.name,
      el.autocomplete,
      el.getAttribute("aria-label"),
      el.getAttribute("placeholder")
    ].join(" ").toLowerCase();

    if (
      /password|passwd|pin|token|secret|otp|2fa|auth|csrf|session|cvv|card.?number|account.?number|email|phone|mobile|amount|deposit|withdraw|balance|wallet|transaction|recipient/i.test(identity)
    ) return false;

    // Hanya input yang mempunyai identiti stabil.
    if (!el.id && !el.name) return false;

    return true;
  }

  function fieldKey(el) {
    if (el.id) return "id:" + el.id;

    const matches = Array.from(
      document.querySelectorAll("[name]")
    ).filter(x =>
      x.name === el.name &&
      eligible(x)
    );

    return "name:" + el.name + ":" +
      matches.indexOf(el);
  }

  function collect() {
    const fields = {};

    document.querySelectorAll(
      "input,textarea,select"
    ).forEach(el => {
      if (!eligible(el)) return;

      const id = fieldKey(el);

      if (
        el.type === "checkbox" ||
        el.type === "radio"
      ) {
        fields[id] = {
          type: "checked",
          value: el.checked
        };
      } else if (
        el.tagName === "SELECT" &&
        el.multiple
      ) {
        fields[id] = {
          type: "multiple",
          value: Array.from(el.selectedOptions)
            .map(option => option.value)
        };
      } else {
        fields[id] = {
          type: "value",
          value: el.value
        };
      }
    });

    return {
      fields,
      updatedAt: Date.now()
    };
  }

  function save() {
    if (restoring || resetThisPage) return;

    const storage = key();
    if (!storage) return;

    try {
      localStorage.setItem(
        storage,
        JSON.stringify(collect())
      );
    } catch (error) {
      console.warn("[Tab State] Save:", error);
    }
  }

  function scheduleSave() {
    if (restoring || resetThisPage) return;

    clearTimeout(timer);
    timer = setTimeout(save, 250);
  }

  function restore() {
    if (resetThisPage) return;

    const storage = key();
    if (!storage) return;

    let saved;

    try {
      saved = JSON.parse(
        localStorage.getItem(storage) || "null"
      );
    } catch (_) {
      return;
    }

    if (!saved?.fields) return;

    restoring = true;

    try {
      document.querySelectorAll(
        "input,textarea,select"
      ).forEach(el => {
        if (!eligible(el)) return;

        const item = saved.fields[fieldKey(el)];
        if (!item) return;

        if (item.type === "checked") {
          el.checked = Boolean(item.value);
        } else if (item.type === "multiple") {
          const selected = new Set(
            item.value || []
          );

          Array.from(el.options).forEach(
            option => {
              option.selected = selected.has(
                option.value
              );
            }
          );
        } else if (item.type === "value") {
          // Jangan paksa nilai yang tidak ada
          // dalam pilihan dropdown semasa.
          if (el.tagName === "SELECT") {
            const exists = Array.from(el.options)
              .some(option =>
                option.value === item.value
              );

            if (!exists) return;
          }

          el.value = item.value ?? "";
        }

        el.dispatchEvent(new Event("input", {
          bubbles: true
        }));

        el.dispatchEvent(new Event("change", {
          bubbles: true
        }));
      });
    } finally {
      restoring = false;
    }
  }

  function clearCurrentPage() {
    clearTimeout(timer);

    resetThisPage = true;

    const storage = key();
    if (storage) {
      localStorage.removeItem(storage);
    }
  }

  function start() {
    if (initialized || !getUid()) return;
    initialized = true;

    const pendingReset = resetKey();

    if (
      pendingReset &&
      sessionStorage.getItem(pendingReset) === "1"
    ) {
      sessionStorage.removeItem(pendingReset);
      clearCurrentPage();
    } else {
      // Pulihkan selepas komponen awal siap.
      setTimeout(restore, 700);
    }

    document.addEventListener(
      "input", scheduleSave, true
    );

    document.addEventListener(
      "change", scheduleSave, true
    );

    window.addEventListener("pagehide", () => {
      clearTimeout(timer);
      save();
    });

    document.addEventListener(
      "visibilitychange", () => {
        if (document.hidden) save();
      }
    );

    window.save5G88TabState = save;
    window.restore5G88TabState = restore;
    window.clear5G88TabState = clearCurrentPage;
  }

  if (window.firebase?.auth) {
    firebase.auth().onAuthStateChanged(user => {
      if (user && !user.isAnonymous) {
        start();
      }
    });
  }
})();
