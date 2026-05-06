// ================================
// ForVide Auth System FIXED
// ================================

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

const provider = new GoogleAuthProvider();

window.currentUser = null;
window.currentUserData = null;

// =====================================
// SAVE MULTI ACCOUNTS
// =====================================

function saveAccount(userData) {
    const accounts = JSON.parse(
        localStorage.getItem('forvide_accounts') || '[]'
    );

    const filtered = accounts.filter(
        a => a.uid !== userData.uid
    );

    filtered.push({
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL
    });

    localStorage.setItem(
        'forvide_accounts',
        JSON.stringify(filtered)
    );
}

// =====================================
// CREATE USER PROFILE
// =====================================

async function createUserProfile(user) {

    const ref = doc(db, 'users', user.uid);

    const snap = await getDoc(ref);

    if (!snap.exists()) {

        await setDoc(ref, {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'User',
            photoURL: user.photoURL || '',
            bannerURL: '',
            description: '',
            role: 'viewer',
            subscribers: 0,
            likedVideos: [],
            history: [],
            createdAt: serverTimestamp()
        });

    }

    const newSnap = await getDoc(ref);

    window.currentUserData = newSnap.data();

    saveAccount({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'User',
        photoURL: user.photoURL || ''
    });
}

// =====================================
// REGISTER
// =====================================

window.register = async function () {

    try {

        const email =
            document.getElementById('registerEmail')?.value;

        const password =
            document.getElementById('registerPassword')?.value;

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

        alert('Аккаунт создан!');

        location.reload();

    } catch (err) {

        console.error(err);

        alert(err.message);
    }
};

// =====================================
// LOGIN
// =====================================

window.login = async function () {

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

        alert('Вход выполнен!');

        location.reload();

    } catch (err) {

        console.error(err);

        alert(err.message);
    }
};

// =====================================
// GOOGLE LOGIN
// =====================================

window.googleLogin = async function () {

    try {

        const result =
            await signInWithPopup(auth, provider);

        await createUserProfile(result.user);

        alert('Google вход выполнен!');

        location.reload();

    } catch (err) {

        console.error(err);

        alert(err.message);
    }
};

// =====================================
// LOGOUT
// =====================================

window.logout = async function () {

    try {

        await signOut(auth);

        location.reload();

    } catch (err) {

        console.error(err);

        alert(err.message);
    }
};

// =====================================
// ACCOUNT SWITCHER
// =====================================

window.showAccountSwitcher = function () {

    const accounts = JSON.parse(
        localStorage.getItem('forvide_accounts') || '[]'
    );

    const message = [
        'Аккаунты:',
        '',
        ...accounts.map(
            a => `• ${a.displayName} (${a.email})`
        ),
        '',
        'Для добавления нового аккаунта просто войдите через Google снова.'
    ].join('\\n');

    alert(message);
};

// =====================================
// AUTH STATE
// =====================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.currentUser = null;

        const authBtn =
            document.getElementById('authButton');

        if (authBtn) {
            authBtn.innerText = 'Войти';
        }

        return;
    }

    window.currentUser = user;

    await createUserProfile(user);

    const authBtn =
        document.getElementById('authButton');

    if (authBtn) {

        authBtn.innerText = 'Сменить аккаунт';

        authBtn.onclick = () => {
            showAccountSwitcher();
        };
    }

    console.log('✅ Авторизация активна');
});

console.log('🔥 Firebase Auth FIXED loaded');
