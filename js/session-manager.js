import { auth, db } from './firebase-init.js';

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.currentUser = null;
window.currentUserData = null;

onAuthStateChanged(auth, async (user) => {

    console.log('AUTH STATE:', user);

    if (!user) {

        window.currentUser = null;
        window.currentUserData = null;

        updateGuestUI();

        return;
    }

    window.currentUser = user;

    try {

        const ref = doc(db, 'users', user.uid);

        const snap = await getDoc(ref);

        if (snap.exists()) {

            window.currentUserData = snap.data();

        }

        updateUserUI();

    } catch (err) {

        console.error(err);

    }

});

function updateGuestUI() {

    const loginBtn =
        document.getElementById('loginBtn');

    if (loginBtn) {

        loginBtn.style.display = 'block';

    }

    const logoutBtn =
        document.getElementById('logoutBtn');

    if (logoutBtn) {

        logoutBtn.style.display = 'none';

    }

}

function updateUserUI() {

    const loginBtn =
        document.getElementById('loginBtn');

    if (loginBtn) {

        loginBtn.innerText = 'Сменить аккаунт';

    }

    const logoutBtn =
        document.getElementById('logoutBtn');

    if (logoutBtn) {

        logoutBtn.style.display = 'block';

    }

    const username =
        document.getElementById('menuUsername');

    if (username) {

        username.innerText =
            window.currentUserData?.displayName || 'User';

    }

}
