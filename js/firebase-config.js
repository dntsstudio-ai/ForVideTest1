// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBuzCSHGT93nxZYiUkFlZaRto8chwthVXU",
    authDomain: "forvide---site1.firebaseapp.com",
    projectId: "forvide---site1",
    storageBucket: "forvide---site1.firebasestorage.app",
    messagingSenderId: "341565628556",
    appId: "1:341565628556:web:8619235ba052ef142d5ba9",
    measurementId: "G-RV9TQSVR7S"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log("🔥 Firebase ForVide инициализирован!");
