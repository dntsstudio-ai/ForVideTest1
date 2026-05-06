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
    doc,
    setDoc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const googleProvider = new GoogleAuthProvider();

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

async function checkAndCreateUserProfile(user) {
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
        const displayName = user.displayName || user.email.split('@')[0];
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: displayName,
            photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=111111&color=facc15&bold=true`,
            role: 'viewer',
            subscribers: 0,
            totalViews: 0,
            totalLikes: 0,
            createdAt: new Date()
        });
        console.log("✅ Создан новый профиль:", displayName);
    }
    return docSnap.exists() ? docSnap.data() : null;
}

// ============================================

function saveAccount(userData){
 const accounts=JSON.parse(localStorage.getItem('forvide_accounts')||'[]');
 const filtered=accounts.filter(a=>a.uid!==userData.uid);
 filtered.push({uid:userData.uid,email:userData.email,displayName:userData.displayName,photoURL:userData.photoURL});
 localStorage.setItem('forvide_accounts',JSON.stringify(filtered));
}

// ОБРАБОТЧИКИ АВТОРИЗАЦИИ
// ============================================
document.addEventListener('DOMContentLoaded', () => {

    const googleBtn = document.querySelector('.google-btn');
    const emailInput = document.querySelector('input[type="email"].modal-input');
    const passwordInput = document.querySelector('input[type="password"].modal-input');
    const submitBtn = document.querySelector('.auth-buttons .primary-btn');
    const logoutBtn = document.getElementById('logoutBtn');
    const authModal = document.getElementById('authModal');

    // Вход через Google
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            try {
                googleBtn.disabled = true;
                googleBtn.innerHTML = '<i class="ph ph-spinner" style="animation:spin 0.8s linear infinite"></i> Подключение...';
                const result = await signInWithPopup(auth, googleProvider);
                await checkAndCreateUserProfile(result.user); saveAccount(result.user);
                if (authModal) authModal.style.display = 'none';
                window.showToast('Добро пожаловать в ForVide! 🎉', 'success');
            } catch (error) {
                console.error("Ошибка Google Auth:", error);
                window.showToast('Ошибка входа через Google', 'error');
            } finally {
                if (googleBtn) {
                    googleBtn.disabled = false;
                    googleBtn.innerHTML = '<i class="ph-fill ph-google-logo"></i> Войти через Google';
                }
            }
        });
    }

    // Email / Пароль
    if (submitBtn && emailInput && passwordInput) {
        submitBtn.addEventListener('click', async () => {
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            if (!email || !password) {
                window.showToast('Введите Email и пароль', 'error');
                return;
            }
            if (password.length < 6) {
                window.showToast('Пароль должен быть минимум 6 символов', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Проверка...';

            try {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                await checkAndCreateUserProfile(cred.user); saveAccount(cred.user);
                if (authModal) authModal.style.display = 'none';
                window.showToast('С возвращением! 👋', 'success');
            } catch (err) {
                if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                    try {
                        const newCred = await createUserWithEmailAndPassword(auth, email, password);
                        await checkAndCreateUserProfile(newCred.user); saveAccount(newCred.user);
                        if (authModal) authModal.style.display = 'none';
                        window.showToast('Аккаунт создан! Добро пожаловать! 🚀', 'success');
                    } catch (regErr) {
                        window.showToast('Ошибка: ' + regErr.message, 'error');
                    }
                } else {
                    window.showToast('Неверный пароль или email', 'error');
                }
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Продолжить';
                }
            }
        });

        // Enter в полях
        [emailInput, passwordInput].forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') submitBtn.click();
            });
        });
    }

    // Выход
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                window.showToast('До свидания! 👋', 'info');
                window.toggleMenu(false);
                setTimeout(() => window.location.reload(), 500);
            });
        });
    }

    // ============================================
    // ОТСЛЕЖИВАНИЕ СТАТУСА АВТОРИЗАЦИИ
    // ============================================
    onAuthStateChanged(auth, async (user) => {
        const menuUserProfile = document.getElementById('menuUserProfile');
        const authorLinks = document.querySelectorAll('.author-only');
        const createChannelBtn = document.getElementById('createChannelTrigger');
        const commentAuthCheck = document.getElementById('commentAuthCheck');

        if (user) {
            const userRef = doc(db, 'users', user.uid);
            let userData;

            try {
                const snap = await getDoc(userRef);
                if (snap.exists()) {
                    userData = snap.data();
                } else {
                    await checkAndCreateUserProfile(user);
                    const snap2 = await getDoc(userRef);
                    userData = snap2.data();
                }
            } catch (e) {
                console.error('Ошибка получения данных пользователя:', e);
                return;
            }

            // Обновляем мини-профиль в меню
            if (menuUserProfile) {
                menuUserProfile.innerHTML = `
                    <img src="${userData.photoURL}" alt="Avatar" class="avatar-sm">
                    <div class="user-mini-info">
                        <span class="user-nickname">${userData.displayName}</span>
                        <span class="user-role">${userData.role === 'author' ? 'Автор' : 'Зритель'}</span><button onclick="window.showAccountSwitcher()" class="primary-btn" style="margin-top:8px;font-size:12px">Сменить аккаунт</button>
                    </div>
                `;
            }

            // Управление ролями
            if (userData.role === 'author') {
                authorLinks.forEach(l => l.style.display = 'flex');
                if (createChannelBtn) createChannelBtn.style.display = 'none';
            } else {
                authorLinks.forEach(l => l.style.display = 'none');
                if (createChannelBtn) createChannelBtn.style.display = 'block';
            }

            if (logoutBtn) logoutBtn.style.display = 'flex';

            // Форма комментариев
            if (commentAuthCheck) {
                commentAuthCheck.innerHTML = `
                    <div class="comment-form">
                        <img src="${userData.photoURL}" alt="avatar" class="comment-avatar">
                        <div style="flex:1; display:flex; flex-direction:column; gap:8px;">
                            <textarea id="commentTextInput" placeholder="Напишите комментарий..." rows="3"></textarea>
                            <button class="comment-submit" id="postCommentBtn">ОТПРАВИТЬ</button>
                        </div>
                    </div>
                `;
                // Глобально сохраняем userData для player-logic
                window.currentUserData = userData;
                window.currentUser = user;

                // Вешаем обработчик отправки комментария
                const postBtn = document.getElementById('postCommentBtn');
                if (postBtn) {
                    postBtn.addEventListener('click', () => {
                        if (window.submitComment) window.submitComment();
                    });
                }
            }

        } else {
            // Гость
            if (menuUserProfile) {
                menuUserProfile.innerHTML = `
                    <img src="https://ui-avatars.com/api/?name=Guest&background=111111&color=fff" alt="Avatar" class="avatar-sm">
                    <div class="user-mini-info">
                        <span class="user-nickname">Гость</span>
                        <span class="user-role">Не авторизован</span>
                    </div>
                `;
            }

            authorLinks.forEach(l => l.style.display = 'none');
            if (createChannelBtn) createChannelBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';

            if (commentAuthCheck) {
                commentAuthCheck.innerHTML = `<p>Чтобы оставить комментарий, <a href="#" onclick="window.openAuthModal(); return false;">войдите</a> в аккаунт.</p>`;
            }

            window.currentUser = null;
            window.currentUserData = null;
        }
    });

    // Кнопка создания канала из меню
    const createChannelTrigger = document.getElementById('createChannelTrigger');
    if (createChannelTrigger) {
        createChannelTrigger.addEventListener('click', () => {
            window.location.href = 'studio.html';
        });
    }
});


window.showAccountSwitcher=function(){
 const accounts=JSON.parse(localStorage.getItem('forvide_accounts')||'[]');
 alert('Аккаунты:

'+accounts.map(a=>'• '+a.displayName+' ('+a.email+')').join('
')+'

Для добавления нового аккаунта просто войдите через Google снова.');
}
