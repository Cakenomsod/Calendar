// Import core
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-analytics.js";

// Firestore & Storage
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";

// Auth
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

// Config
const firebaseConfig = {
  apiKey: "AIzaSyCmIfvAGrk-rRCtYxCp3XmnUM61mKUtgsY",
  authDomain: "calendarproject-f570e.firebaseapp.com",
  projectId: "calendarproject-f570e",
  storageBucket: "calendarproject-f570e.firebasestorage.app",
  messagingSenderId: "872792637757",
  appId: "1:872792637757:web:bb20876a0fb1cfc1fc8554",
  measurementId: "G-NTQYQJVBVN"
};

// Initialize
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export all Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);