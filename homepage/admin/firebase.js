/* =========================================================
   MYPRODUCTION V2 - SHARED FIREBASE
   Semua halaman menggunakan Firebase ini sahaja
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyAIBLekZVkIAyOFbh3btoFNu3vKQPTgaKg",
  authDomain: "myproduction-v2.firebaseapp.com",
  databaseURL: "https://myproduction-v2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "myproduction-v2",
  storageBucket: "myproduction-v2.firebasestorage.app",
  messagingSenderId: "464224532129",
  appId: "1:464224532129:web:9f63edf8bca7cdd5f822e0"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.database();

// Shared Firebase untuk semua halaman admin
window.sharedFirebase = {
  app: firebase.app(),
  auth,
  db
};

window.adminAuth = auth;
window.adminDb = db;

/* =========================================================
   5G88 - CENTRALIZED LIVECHAT IDENTITY
   ========================================================= */

window.G88LiveChatIdentity = Object.freeze({

  // Format LiveChat ID untuk akaun baru
  buildId(username, uid) {
    const safeUsername = String(username || "")
      .trim()
      .toLowerCase()
      .replace(/[.#$\[\]\/\s]/g, "_");

    const safeUid = String(uid || "").trim();

    if (
      !safeUsername ||
      !safeUid ||
      /[.#$\[\]\/\s]/.test(safeUid)
    ) {
      throw new Error("Invalid LiveChat identity");
    }

    return `${safeUsername}_${safeUid}`;
  },

  // Ambil permanent LiveChat ID daripada profile
  resolve(uid, profile) {
    if (!uid || !profile) {
      throw new Error("LiveChat profile not available");
    }

    const savedId = String(profile.livechatId || "").trim();

    if (savedId) {
      if (
        /[.#$\[\]\/\s]/.test(savedId) ||
        !savedId.endsWith(`_${uid}`)
      ) {
        throw new Error("Invalid saved LiveChat ID");
      }

      return savedId;
    }

    // Compatibility dengan sistem lama
    return `admin_${uid}`;
  },

  // Ambil LiveChat ID pengguna yang sedang login
  async getCurrentId() {
    const user = auth.currentUser;

    if (
      !user ||
      user.isAnonymous ||
      sessionStorage.getItem("5g88.adminSession") !== user.uid
    ) {
      throw new Error("Invalid admin session");
    }

    const token = await user.getIdTokenResult();

    const snapshot = await db
      .ref(`adminUsers/${user.uid}`)
      .once("value");

    const profile = snapshot.val();

    if (
      !profile ||
      profile.active !== true ||
      profile.secondPasswordEnabled !== true ||
      token.claims.secondVerified !== true ||
      token.claims.pinVersion !== profile.pinVersion ||
      !["superadmin", "siteadmin"].includes(profile.role)
    ) {
      throw new Error("LiveChat access denied");
    }

    return this.resolve(user.uid, profile);
  }

});
