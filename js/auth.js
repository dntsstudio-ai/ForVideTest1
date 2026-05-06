// ================================
// ForVide Auth FULL FIXED
// ================================

console.log('AUTH JS STARTED');

import {

    auth,
    db

} from './firebase-config.js';

import {

    GoogleAuthProvider,

    signInWithPopup,

    signInWithRedirect,

    createUserWithEmailAndPassword,

    signInWithEmailAndPassword,

    signOut,

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {

    doc,

    setDoc,

    getDoc,

    serverTimestamp

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =====================================
// PROVIDER
// =====================================

const provider = new GoogleAuthProvider();

// =====================================
// GLOBALS
// =====================================

window.currentUser = null;
window.currentUserData = null;

// =====================================
// SAVE ACCOUNTS
// =====================================

function saveAccount(userData) {

    const existing = JSON.parse(
        localStorage.getItem('forvide_accounts') || '[]'
    );

    const filtered = existing.filter(
        a => a.uid !== userData.uid
    );

    filtered.push(userData);

    localStorage.setItem(
        'forvide_accounts',
        JSON.stringify(filtered)
    );
}

// =====================================
// CREATE PROFILE
// =====================================

async function createUserProfile(user) {

    try {

        const ref = doc(db, 'users', user.uid);

        const snap = await getDoc(ref);

        if (!snap.exists()) {

            await setDoc(ref, {

                uid: user.uid,

                email: user.email || '',

                displayName:
                    user.displayName || 'User',

                photoURL:
                    user.photoURL || '',

                bannerURL: '',

                description: '',

                role: 'viewer',

                subscribers: 0,

                likedVideos: [],

                history: [],

                createdAt: serverTimestamp()

            });

        }

        const updatedSnap = await getDoc(ref);

        if (updatedSnap.exists()) {

            window.currentUserData =
                updatedSnap.data();

        }

        saveAccount({

            uid: user.uid,

            email: user.email,

            displayName:
                user.displayName || 'User',

            photoURL:
                user.photoURL || ''

        });

    } catch (err) {

        console.error(err);

    }

}

// =====================================
// REGISTER
// =====================================

async function register() {

    console.log('REGISTER CLICKED');

    try {

        const email =
            document.getElementById('loginEmail')?.value;

        const password =
            document.getElementById('loginPassword')?.value;

        if (!email || !password) {

            alert('Введите email и пароль');

            return;
        }

        const result =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        await createUserProfile(result.user);

        window.showToast?.(
            'Аккаунт создан!',
            'success'
        );

        location.reload();

    } catch (err) {

        console.error(err);

        alert(err.message);

    }

}

// =====================================
// LOGIN
// =====================================

async function login() {

    console.log('EMAIL LOGIN CLICKED');

    try {

        const email =
            document.getElementById('loginEmail')?.value;

        const password =
            document.getElementById('loginPassword')?.value;

        if (!email || !password) {

            alert('Введите email и пароль');

            return;
        }

        const result =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        await createUserProfile(result.user);

        window.showToast?.(
            'Вход выполнен!',
            'success'
        );

        location.reload();

    } catch (err) {

        console.error(err);

        alert(err.message);

    }

}

// =====================================
// GOOGLE LOGIN
// =====================================

async function googleLogin() {

    console.log('GOOGLE BUTTON CLICKED');

    try {

        try {

            const result =
                await signInWithPopup(
                    auth,
                    provider
                );

            await createUserProfile(result.user);

        } catch (popupErr) {

            console.warn(
                'Popup blocked. Redirect login...'
            );

            await signInWithRedirect(
                auth,
                provider
            );

            return;

        }

        window.showToast?.(
            'Google вход выполнен!',
            'success'
        );

        location.reload();

    } catch (err) {

        console.error(err);

        alert(err.message);

    }

}

// =====================================
// LOGOUT
// =====================================

async function logoutUser() {

    try {

        await signOut(auth);

        location.reload();

    } catch (err) {

        console.error(err);

    }

}

// =====================================
// ACCOUNT SWITCHER
// =====================================

window.showAccountSwitcher = function () {

    const accounts = JSON.parse(
        localStorage.getItem('forvide_accounts') || '[]'
    );

    let text = 'Аккаунты:\\n\\n';

    accounts.forEach(acc => {

        text +=
            `• ${acc.displayName} (${acc.email})\\n`;

    });

    text +=
        '\\nДля добавления нового аккаунта войдите снова.';

    alert(text);

};

// =====================================
// AUTH STATE
// =====================================

onAuthStateChanged(auth, async (user) => {

    console.log('AUTH STATE:', user);

    const loginBtn =
        document.getElementById('loginBtn');

    const logoutBtn =
        document.getElementById('logoutBtn');

    if (!user) {

        window.currentUser = null;

        if (loginBtn) {

            loginBtn.innerHTML =
                '<i class=\"ph ph-sign-in\"></i> Войти';

        }

        if (logoutBtn) {

            logoutBtn.style.display = 'none';

        }

        return;
    }

    window.currentUser = user;

    await createUserProfile(user);

    if (loginBtn) {

        loginBtn.innerHTML =
            '<i class=\"ph ph-user-switch\"></i> Сменить аккаунт';

        loginBtn.onclick = () => {

            window.showAccountSwitcher();

        };

    }

    if (logoutBtn) {

        logoutBtn.style.display = 'block';

        logoutBtn.onclick = logoutUser;

    }

    const username =
        document.getElementById('menuUsername');

    const avatar =
        document.getElementById('menuAvatar');

    if (username) {

        username.innerText =
            window.currentUserData?.displayName || 'User';

    }

    if (avatar) {

        avatar.src =
            window.currentUserData?.photoURL ||
            'https://ui-avatars.com/api/?name=U';

    }

    console.log('✅ USER AUTHORIZED');

});

// =====================================
// BIND BUTTONS
// =====================================

window.addEventListener('DOMContentLoaded', () => {

    console.log('DOM LOADED');

    const googleBtn =
        document.getElementById('googleLoginBtn');

    const emailBtn =
        document.getElementById('emailLoginBtn');

    const registerBtn =
        document.getElementById('registerBtn');

    if (googleBtn) {

        googleBtn.addEventListener(
            'click',
            googleLogin
        );

    }

    if (emailBtn) {

        emailBtn.addEventListener(
            'click',
            login
        );

    }

    if (registerBtn) {

        registerBtn.addEventListener(
            'click',
            register
        );

    }

    console.log('✅ AUTH BUTTONS BINDED');

});

console.log('🔥 Firebase Auth FIXED loaded');
