// ================================
// ForVide Firebase Config FIXED
// ================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// =====================================
// FIREBASE CONFIG
// =====================================

const firebaseConfig = {

    apiKey: "AIzaSyBuzCSHGT93nxZYiUkFlZaRto8chwthVXU",

    authDomain: "forvide---site1.firebaseapp.com",

    projectId: "forvide---site1",

    // ВАЖНО:
    // было firebasestorage.app
    // это ломало upload

    storageBucket: "forvide---site1.appspot.com",

    messagingSenderId: "341565628556",

    appId: "1:341565628556:web:8619235ba052ef142d5ba9"
};

// =====================================
// INIT
// =====================================

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

const storage = getStorage(app);

// =====================================
// EXPORTS
// =====================================

export {
    app,
    db,
    auth,
    storage
};

console.log("🔥 Firebase ForVide initialized!");
