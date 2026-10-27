
/* ==========================================
   5G88 - AUTO SAVE PAGE STATE
   Per Firebase UID + Per HTML Page
   ========================================== */

(() => {
  "use strict";

  if (window.__5G88_TAB_STATE__) return;
  window.__5G88_TAB_STATE__ = true;

  // Jangan aktifkan pada halaman authentication.
  const page = location.pathname.split("/").pop().toLowerCase();

  if (
    !page ||
    ["login.html", "index.html", "users.html"].includes(page)
  ) return;

  const PREFIX = "5g88.tabState.v1";

  function getUid() {
    const uid = sessionStorage.getItem("5g88.adminSession");
    const user = window.firebase?.auth?.().currentUser;

    if (
      !uid ||
      !user ||
      user.isAnonymous ||
      user.uid !== uid
    ) return null;

    const expiry = Number(
      localStorage.getItem("autoLogout.expireAt")
    );

    if (!Number.isFinite(expiry) || expiry <= Date.now()) {
      return null;
    }

    return uid;
  }

  function storageKey() {
    const uid = getUid();
    return uid ? `${PREFIX}:${uid}:${page}` : null;
  }

  function eligible(el) {
    if (!(el instanceof HTMLElement)) return false;

    if (!el.matches("input, textarea, select")) return false;

    if (el.closest(
      '[data-no-tab-save], [data-sensitive], ' +
      '.password-wrap, .pin-inputs'
    )) return false;

    if (el.matches(
      '[type="password"], [type="hidden"], ' +
      '[type="file"], [type="submit"], ' +
      '[type="button"], [type="reset"]'
    )) return false;

    const name = [
      el.name,
      el.id,
      el.autocomplete,
      el.getAttribute("aria-label")
    ].join(" ").toLowerCase();

    if (
      /password|passwd|pin|token|secret|otp|2fa|auth|csrf|session|cvv|cardnumber|accountnumber/i.test(name)
    ) return false;

    return true;
  }

  function fieldId(el) {
    if (el.id) return "id:" + el.id;
    if (el.name) {
      const group = Array.from(
        document.querySelectorAll("[name]")
      ).filter(x => x.name === el.name);

      return "name:" + el.name + ":" + group.indexOf(el);
    }

    // Fallback untuk input tanpa ID/name.
    const fields = Array.from(
      document.querySelectorAll("input,textarea,select")
    ).filter(eligible);

    return "index:" + fields.indexOf(el);
  }

  function collect() {
    const fields = {};

    document.querySelectorAll(
      "input,textarea,select"
    ).forEach(el => {
      if (!eligible(el)) return;

      const key = fieldId(el);

      if (el.type === "checkbox" || el.type === "radio") {
        fields[key] = {
          type: "checked",
          value: el.checked
        };
      } else if (el.tagName === "SELECT" && el.multiple) {
        fields[key] = {
          type: "multiple",
          value: Array.from(el.selectedOptions)
            .map(option => option.value)
        };
      } else {
        fields[key] = {
          type: "value",
          value: el.value
        };
      }
    });

    return {
      fields,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      updatedAt: Date.now()
    };
  }

  let restoring = false;
  let saveTimer = null;
  let initialized = false;

  function save() {
    if (restoring) return;

    const key = storageKey();
    if (!key) return;

    try {
      localStorage.setItem(key, JSON.stringify(collect()));
    } catch (err) {
      console.warn("[Tab State] Save failed:", err);
    }
  }

  function scheduleSave() {
    if (restoring) return;

    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 250);
  }

  function restore() {
    const key = storageKey();
    if (!key) return;

    let state;

    try {
      state = JSON.parse(localStorage.getItem(key) || "null");
    } catch (_) {
      return;
    }

    if (!state?.fields) return;

    restoring = true;

    try {
      document.querySelectorAll(
        "input,textarea,select"
      ).forEach(el => {
        if (!eligible(el)) return;

        const saved = state.fields[fieldId(el)];
        if (!saved) return;

        if (saved.type === "checked") {
          el.checked = Boolean(saved.value);
        } else if (saved.type === "multiple") {
          const values = new Set(saved.value || []);

          Array.from(el.options).forEach(option => {
            option.selected = values.has(option.value);
          });
        } else if (saved.type === "value") {
          el.value = saved.value ?? "";
        }

        // Maklumkan filter/search tentang nilai dipulihkan.
        el.dispatchEvent(new Event("input", {
          bubbles: true
        }));

        el.dispatchEvent(new Event("change", {
          bubbles: true
        }));
      });

      window.scrollTo(
        Number(state.scrollX) || 0,
        Number(state.scrollY) || 0
      );
    } finally {
      restoring = false;
    }
  }

  function start() {
    if (initialized || !getUid()) return;
    initialized = true;

    // Pulihkan selepas kebanyakan komponen siap.
    requestAnimationFrame(() => {
      setTimeout(restore, 500);
    });

    document.addEventListener("input", scheduleSave, true);
    document.addEventListener("change", scheduleSave, true);

    window.addEventListener("pagehide", () => {
      clearTimeout(saveTimer);
      save();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) save();
    });

    // API untuk komponen custom.
    window.save5G88TabState = save;
    window.restore5G88TabState = restore;
  }

  if (window.firebase?.auth) {
    firebase.auth().onAuthStateChanged(user => {
      if (user && !user.isAnonymous) start();
    });
  }
})();
