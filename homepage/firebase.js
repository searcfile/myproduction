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
