/* =========================================================
   MYPRODUCTION V2
   SHARED FIREBASE
   ========================================================= */

(function () {

  /* =========================
     FIREBASE CONFIG
     ========================= */

  const firebaseConfig = {
    apiKey: "AIzaSyAIBLekZVkIAyOFbh3btoFNu3vKQPTgaKg",
    authDomain: "myproduction-v2.firebaseapp.com",
    databaseURL:
      "https://myproduction-v2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "myproduction-v2",
    storageBucket: "myproduction-v2.firebasestorage.app",
    messagingSenderId: "464224532129",
    appId: "1:464224532129:web:9f63edf8bca7cdd5f822e0"
  };


  /* =========================
     CHECK FIREBASE SDK
     ========================= */

  if (typeof firebase === "undefined") {
    console.error(
      "Firebase SDK belum dimuatkan. Load firebase-app-compat.js dahulu."
    );
    return;
  }


  /* =========================
     INITIALIZE APP
     ========================= */

  const app = firebase.apps.length
    ? firebase.app()
    : firebase.initializeApp(firebaseConfig);


  /* =========================
     SHARED SERVICES
     ========================= */

  const db = firebase.database();

  const auth =
    typeof firebase.auth === "function"
      ? firebase.auth()
      : null;


  /* =========================
     GLOBAL ACCESS
     ========================= */

  window.firebaseApp = app;
  window.db = db;
  window.auth = auth;

  /*
   * Compatibility aliases.
   *
   * Code lama masih banyak menggunakan:
   *
   * blurphpDb
   * loginDb
   * loginAuth
   *
   * Untuk sementara semuanya diarahkan
   * ke myproduction-v2.
   */

  window.blurphpDb = db;
  window.loginDb = db;
  window.loginAuth = auth;


  console.log(
    "%cFirebase Connected: myproduction-v2",
    "color:#22c55e;font-weight:bold;"
  );

})();
