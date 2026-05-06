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
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// DOM Элементы
const authModal = document.getElementById('authModal');
const googleBtn = document.querySelector('.google-btn');
const emailInput = document.querySelector('input[type="email"]');
const passwordInput = document.querySelector('input[type="password"]');
const submitBtn = document.querySelector('.primary-btn');
const logoutBtn = document.getElementById('logoutBtn');
const menuUserProfile = document.getElementById('menuUserProfile');
const createChannelTrigger = document.getElementById('createChannelTrigger');

// Провайдер Google
const googleProvider = new GoogleAuthProvider();

// --- ЛОГИКА ВХОДА / РЕГИСТРАЦИИ ---

// 1. Вход через Google
if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            await checkAndCreateUserProfile(result.user);
            authModal.style.display = 'none';
        } catch (error) {
            console.error("Ошибка входа через Google:", error);
            alert("Ошибка авторизации: " + error.message);
        }
    });
}

// 2. Вход / Регистрация через Email (Простая логика: если нет аккаунта - создаем, если есть - входим)
if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        if (!email || !password) return alert("Введите Email и пароль");

        try {
            // Пытаемся войти
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await checkAndCreateUserProfile(userCredential.user);
            authModal.style.display = 'none';
        } catch (error) {
            // Если пользователя нет, регистрируем
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                try {
                    const newUser = await createUserWithEmailAndPassword(auth, email, password);
                    await checkAndCreateUserProfile(newUser.user);
                    authModal.style.display = 'none';
                } catch (regError) {
                    alert("Ошибка регистрации: " + regError.message);
                }
            } else {
                alert("Ошибка: " + error.message);
            }
        }
    });
}

// 3. Выход из аккаунта
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            console.log("Пользователь вышел");
        }).catch((error) => console.error("Ошибка при выходе", error));
    });
}

// --- РАБОТА С БАЗОЙ ДАННЫХ (FIRESTORE) ---

// Проверка и создание профиля в Firestore
async function checkAndCreateUserProfile(user) {
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
        // Создаем профиль зрителя по умолчанию
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.email[0]}&background=121212&color=facc15`,
            role: 'viewer', // Роль: Зритель. Автором станет при создании канала.
            createdAt: new Date()
        });
        console.log("Создан новый профиль зрителя");
    }
}

// --- ОТСЛЕЖИВАНИЕ СТАТУСА АВТОРИЗАЦИИ И ОБНОВЛЕНИЕ UI ---
onAuthStateChanged(auth, async (user) => {
    const authorLinks = document.querySelectorAll('.author-only');
    const createChannelBtn = document.getElementById('createChannelTrigger');
    
    if (user) {
        // Пользователь вошел. Получаем его данные из БД для проверки роли
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
            const userData = docSnap.data();
            
            // Обновляем аватарку и ник в меню
            menuUserProfile.innerHTML = `
                <img src="${userData.photoURL}" alt="Avatar" class="avatar-sm" style="border-radius: 50%; width: 40px; height: 40px;">
                <div class="user-mini-info" style="display: flex; flex-direction: column;">
                    <span class="user-nickname" style="font-weight: 800;">${userData.displayName}</span>
                    <span class="user-role" style="font-size: 12px; color: #555;">${userData.role === 'author' ? 'Автор' : 'Зритель'}</span>
                </div>
            `;
            
            // Логика ролей
            if (userData.role === 'author') {
                authorLinks.forEach(link => link.style.display = 'flex');
                if (createChannelBtn) createChannelBtn.style.display = 'none';
            } else {
                authorLinks.forEach(link => link.style.display = 'none');
                if (createChannelBtn) createChannelBtn.style.display = 'block';
            }
            
            if (logoutBtn) logoutBtn.style.display = 'flex';
        }
    } else {
        // Гость
        menuUserProfile.innerHTML = `
            <img src="https://ui-avatars.com/api/?name=Guest&background=121212&color=fff" alt="Avatar" class="avatar-sm" style="border-radius: 50%; width: 40px; height: 40px;">
            <div class="user-mini-info" style="display: flex; flex-direction: column;">
                <span class="user-nickname" style="font-weight: 800;">Гость</span>
            </div>
            <button onclick="window.openAuthModal()" style="margin-left: 10px; background: var(--fv-black); color: white; border: none; padding: 5px 10px; cursor: pointer; font-weight: bold;">Войти</button>
        `;
        
        authorLinks.forEach(link => link.style.display = 'none');
        if (createChannelBtn) createChannelBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
});
