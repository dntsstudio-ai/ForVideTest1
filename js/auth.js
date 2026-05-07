// js/auth.js
import { auth, db } from './firebase-config.js';
import {
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
    doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import {
    saveUserProfile, getUserProfile, addLinkedAccount,
    getLinkedAccounts, setActiveAccount, getActiveAccount
} from './local-db.js';

const googleProvider = new GoogleAuthProvider();

// ============================================
// ПРОФИЛЬ — Firestore + LocalDB fallback
// ============================================
export async function checkAndCreateUserProfile(user) {
    const displayName = user.displayName || user.email?.split('@')[0] || 'Пользователь';
    const photoURL = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=111111&color=facc15&bold=true`;

    // Сначала пробуем Firestore
    try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
            const profileData = {
                uid: user.uid, email: user.email, displayName, photoURL,
                role: 'viewer', subscribers: 0, totalViews: 0, totalLikes: 0,
                bio: '', createdAt: new Date()
            };
            await setDoc(userRef, profileData);
            saveUserProfile(user.uid, profileData);
            return profileData;
        }
        const data = snap.data();
        saveUserProfile(user.uid, data);
        return data;
    } catch (e) {
        console.warn('Firestore недоступен, LocalDB:', e.message);
        let profile = getUserProfile(user.uid);
        if (!profile) {
            profile = {
                uid: user.uid, email: user.email, displayName, photoURL,
                role: 'viewer', subscribers: 0, totalViews: 0, totalLikes: 0,
                bio: '', createdAt: new Date().toISOString()
            };
            saveUserProfile(user.uid, profile);
        }
        return profile;
    }
}

// ============================================
// ОБНОВЛЕНИЕ UI
// ============================================
function updateMenuUI(userData, user) {
    const menuUserProfile = document.getElementById('menuUserProfile');
    const authorLinks = document.querySelectorAll('.author-only');
    const createChannelBtn = document.getElementById('createChannelTrigger');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginBtn = document.getElementById('loginBtn');
    const switchAccountBtn = document.getElementById('switchAccountBtn');

    if (menuUserProfile) {
        menuUserProfile.style.cursor = 'pointer';
        menuUserProfile.onclick = () => {
            window.toggleMenu(false);
            window.location.href = `profile.html?uid=${user.uid}`;
        };
        menuUserProfile.innerHTML = `
            <img src="${userData.photoURL}" alt="Avatar" class="avatar-sm">
            <div class="user-mini-info">
                <span class="user-nickname">${userData.displayName}</span>
                <span class="user-role">${userData.role === 'author' ? 'Автор' : 'Зритель'}</span>
            </div>
        `;
    }

    if (userData.role === 'author') {
        authorLinks.forEach(l => l.style.display = 'flex');
        if (createChannelBtn) createChannelBtn.style.display = 'none';
    } else {
        authorLinks.forEach(l => l.style.display = 'none');
        if (createChannelBtn) createChannelBtn.style.display = 'block';
    }

    if (logoutBtn) logoutBtn.style.display = 'flex';
    if (loginBtn) loginBtn.style.display = 'none';
    if (switchAccountBtn) switchAccountBtn.style.display = 'flex';

    const commentAuthCheck = document.getElementById('commentAuthCheck');
    if (commentAuthCheck) {
        commentAuthCheck.innerHTML = `
            <div class="comment-form">
                <img src="${userData.photoURL}" alt="avatar" class="comment-avatar">
                <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
                    <textarea id="commentTextInput" placeholder="Напишите комментарий..." rows="3" style="width:100%;border:2px solid var(--fv-gray-200);border-radius:var(--radius-sm);padding:12px 16px;font-size:14px;font-weight:600;resize:none;outline:none;background:var(--fv-gray-50);font-family:inherit;"></textarea>
                    <button class="comment-submit" id="postCommentBtn">ОТПРАВИТЬ</button>
                </div>
            </div>
        `;
        window.currentUserData = userData;
        window.currentUser = user;
        document.getElementById('postCommentBtn')?.addEventListener('click', () => window.submitComment?.());
    }
}

function updateMenuUIGuest() {
    const menuUserProfile = document.getElementById('menuUserProfile');
    const authorLinks = document.querySelectorAll('.author-only');
    const createChannelBtn = document.getElementById('createChannelTrigger');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginBtn = document.getElementById('loginBtn');
    const switchAccountBtn = document.getElementById('switchAccountBtn');

    if (menuUserProfile) {
        menuUserProfile.style.cursor = 'default';
        menuUserProfile.onclick = null;
        menuUserProfile.innerHTML = `
            <img src="https://ui-avatars.com/api/?name=G&background=111111&color=fff" alt="Avatar" class="avatar-sm">
            <div class="user-mini-info">
                <span class="user-nickname">Гость</span>
                <span class="user-role">Не авторизован</span>
            </div>
        `;
    }
    authorLinks.forEach(l => l.style.display = 'none');
    if (createChannelBtn) createChannelBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'flex';
    if (switchAccountBtn) switchAccountBtn.style.display = 'none';

    const commentAuthCheck = document.getElementById('commentAuthCheck');
    if (commentAuthCheck) {
        commentAuthCheck.innerHTML = `
            <div style="background:var(--fv-gray-50);border:2px solid var(--fv-gray-200);border-radius:var(--radius-md);padding:24px;text-align:center;">
                <i class="ph ph-user-circle" style="font-size:40px;color:var(--fv-gray-400);display:block;margin-bottom:12px;"></i>
                <p style="color:var(--fv-gray-600);font-weight:700;margin-bottom:16px;font-size:14px;">Войди, чтобы оставить комментарий</p>
                <button onclick="window.openAuthModal()" style="background:var(--fv-black);color:white;border:none;padding:11px 28px;border-radius:var(--radius-sm);font-weight:900;font-size:13px;cursor:pointer;letter-spacing:0.5px;transition:all 0.2s;">ВОЙТИ / ЗАРЕГИСТРИРОВАТЬСЯ</button>
            </div>
        `;
    }
    window.currentUser = null;
    window.currentUserData = null;
}

// ============================================
// МУЛЬТИ-АККАУНТ
// ============================================
export function renderAccountSwitcher() {
    const panel = document.getElementById('accountSwitcherPanel');
    if (!panel) return;
    const accounts = getLinkedAccounts();
    const activeUid = auth.currentUser?.uid;

    panel.innerHTML = `
        <div style="padding:12px 36px 8px;font-size:11px;font-weight:800;color:rgba(0,0,0,0.45);text-transform:uppercase;letter-spacing:1px;">Аккаунты</div>
        ${accounts.map(acc => `
            <div class="account-switch-item ${acc.uid === activeUid ? 'is-active' : ''}" data-uid="${acc.uid}" style="display:flex;align-items:center;gap:12px;padding:10px 36px;cursor:pointer;transition:background 0.2s;">
                <img src="${acc.photoURL}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid ${acc.uid === activeUid ? 'var(--fv-black)' : 'rgba(0,0,0,0.15)'};">
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:800;font-size:13px;">${acc.displayName}</div>
                    <div style="font-size:11px;color:rgba(0,0,0,0.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${acc.email || ''}</div>
                </div>
                ${acc.uid === activeUid ? '<i class="ph-fill ph-check" style="color:green;font-size:18px;"></i>' : ''}
            </div>
        `).join('')}
        <div style="padding:8px 36px 12px;">
            <button onclick="window.openAuthModal();document.getElementById('accountSwitcherPanel').style.display='none';" 
                style="width:100%;background:var(--fv-black);color:var(--fv-mustard);border:none;padding:11px;border-radius:var(--radius-sm);font-weight:900;font-size:13px;cursor:pointer;text-align:center;">
                <i class="ph ph-plus"></i> Добавить аккаунт
            </button>
        </div>
    `;

    panel.querySelectorAll('.account-switch-item').forEach(item => {
        item.addEventListener('mouseenter', () => item.style.background = 'rgba(0,0,0,0.06)');
        item.addEventListener('mouseleave', () => item.style.background = '');
        item.addEventListener('click', async () => {
            const uid = item.dataset.uid;
            if (uid === activeUid) { panel.style.display = 'none'; return; }
            window.showToast('Для переключения войдите в этот аккаунт заново', 'info');
            await signOut(auth);
            panel.style.display = 'none';
            window.openAuthModal();
        });
    });
}

// ============================================
// ОБРАБОТЧИКИ
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const authModal = document.getElementById('authModal');
    const googleBtn = document.querySelector('.google-btn');
    const emailInput = document.querySelector('input[type="email"].modal-input');
    const passwordInput = document.querySelector('input[type="password"].modal-input');
    const submitBtn = document.querySelector('.auth-buttons .primary-btn');
    const logoutBtn = document.getElementById('logoutBtn');
    const switchAccountBtn = document.getElementById('switchAccountBtn');

    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            try {
                googleBtn.disabled = true;
                googleBtn.innerHTML = '<i class="ph ph-spinner" style="animation:spin 0.8s linear infinite"></i> Подключение...';
                const result = await signInWithPopup(auth, googleProvider);
                const userData = await checkAndCreateUserProfile(result.user);
                addLinkedAccount(result.user.uid, userData.displayName, userData.photoURL, result.user.email);
                setActiveAccount(result.user.uid);
                if (authModal) authModal.style.display = 'none';
                window.showToast('Добро пожаловать! 🎉', 'success');
            } catch (error) {
                window.showToast('Ошибка входа: ' + error.message, 'error');
            } finally {
                if (googleBtn) { googleBtn.disabled = false; googleBtn.innerHTML = '<i class="ph-fill ph-google-logo"></i> Войти через Google'; }
            }
        });
    }

    if (submitBtn && emailInput && passwordInput) {
        const doAuth = async () => {
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            if (!email || !password) { window.showToast('Введите Email и пароль', 'error'); return; }
            if (password.length < 6) { window.showToast('Пароль: минимум 6 символов', 'error'); return; }
            submitBtn.disabled = true; submitBtn.textContent = 'Входим...';
            try {
                let cred;
                try { cred = await signInWithEmailAndPassword(auth, email, password); window.showToast('С возвращением! 👋', 'success'); }
                catch (err) {
                    if (['auth/user-not-found','auth/invalid-credential','auth/wrong-password'].includes(err.code)) {
                        cred = await createUserWithEmailAndPassword(auth, email, password);
                        window.showToast('Аккаунт создан! 🚀', 'success');
                    } else throw err;
                }
                const userData = await checkAndCreateUserProfile(cred.user);
                addLinkedAccount(cred.user.uid, userData.displayName, userData.photoURL, cred.user.email);
                setActiveAccount(cred.user.uid);
                if (authModal) authModal.style.display = 'none';
            } catch (err) { window.showToast('Ошибка: ' + err.message, 'error'); }
            finally { submitBtn.disabled = false; submitBtn.textContent = 'Продолжить'; }
        };
        submitBtn.addEventListener('click', doAuth);
        [emailInput, passwordInput].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') doAuth(); }));
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await signOut(auth);
            window.showToast('До свидания! 👋', 'info');
            window.toggleMenu(false);
            setTimeout(() => window.location.reload(), 500);
        });
    }

    if (switchAccountBtn) {
        switchAccountBtn.addEventListener('click', () => {
            const panel = document.getElementById('accountSwitcherPanel');
            if (!panel) return;
            const isOpen = panel.style.display !== 'none';
            panel.style.display = isOpen ? 'none' : 'block';
            if (!isOpen) renderAccountSwitcher();
        });
    }

    document.getElementById('loginBtn')?.addEventListener('click', e => { e.preventDefault(); window.openAuthModal?.(); });
    document.getElementById('createChannelTrigger')?.addEventListener('click', () => window.location.href = 'studio.html');

    // Закрытие панели аккаунтов при клике вне
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('accountSwitcherPanel');
        const btn = document.getElementById('switchAccountBtn');
        if (panel && panel.style.display !== 'none' && !panel.contains(e.target) && !btn?.contains(e.target)) {
            panel.style.display = 'none';
        }
    });

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            setActiveAccount(user.uid);
            const userData = await checkAndCreateUserProfile(user);
            addLinkedAccount(user.uid, userData.displayName, userData.photoURL, user.email);
            window.currentUser = user;
            window.currentUserData = userData;
            updateMenuUI(userData, user);
        } else {
            updateMenuUIGuest();
        }
    });
});
