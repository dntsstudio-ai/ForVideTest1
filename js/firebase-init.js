import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {

    apiKey: "ТВОЙ_API_KEY",

    authDomain: "ТВОЙ_AUTH_DOMAIN",

    projectId: "ТВОЙ_PROJECT_ID",

    storageBucket: "ТВОЙ_STORAGE_BUCKET",

    messagingSenderId: "ТВОЙ_SENDER_ID",

    appId: "ТВОЙ_APP_ID"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

export { app, db, auth };

console.log('🔥 Firebase ForVide инициализирован!');
