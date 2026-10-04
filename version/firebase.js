// contact-center/firebase.js
// Shared Firebase client for the new admin panel.
// Firebase Web SDK v12.2.1 (CDN ESM)

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut, setPersistence, browserSessionPersistence,
  updatePassword, reauthenticateWithCredential, EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getDatabase, ref, get, set, update, remove, push, onValue, onChildAdded, off,
  onDisconnect, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAIBLekZVkIAyOFbh3btoFNu3vKQPTgaKg",
  authDomain: "myproduction-v2.firebaseapp.com",
  databaseURL: "https://myproduction-v2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "myproduction-v2",
  storageBucket: "myproduction-v2.firebasestorage.app",
  messagingSenderId: "464224532129",
  appId: "1:464224532129:web:9f63edf8bca7cdd5f822e0"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export {
  onAuthStateChanged, signOut, setPersistence, browserSessionPersistence, updatePassword,
  reauthenticateWithCredential, EmailAuthProvider, ref, get, set, update, remove, push,
  onValue, onChildAdded, off, onDisconnect, serverTimestamp
};
