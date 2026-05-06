// js/studio.js
import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// DOM элементы экранов
const createChannelSection = document.getElementById('createChannelSection');
const authorDashboardSection = document.getElementById('authorDashboardSection');
const studioUserHeader = document.getElementById('studioUserHeader');

// Поля создания канала
const newChannelName = document.getElementById('newChannelName');
const newChannelHandle = document.getElementById('newChannelHandle');
const newChannelDesc = document.getElementById('newChannelDesc');
const submitCreateChannel = document.getElementById('submitCreateChannel');

// Поля загрузки видео
const videoTitle = document.getElementById('videoTitle');
const videoDesc = document.getElementById('videoDesc');
const videoCategory = document.getElementById('videoCategory');
const videoFile = document.getElementById('videoFile');
const thumbFile = document.getElementById('thumbFile');
const startUploadBtn = document.getElementById('startUploadBtn');
const uploadProgressContainer = document.getElementById('uploadProgressContainer');
const uploadProgressBar = document.getElementById('uploadProgressBar');
const progressText = document.getElementById('progressText');

let currentUser = null;

// --- СЛУШАТЕЛЬ СТАТУСА ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            const userData = docSnap.data();
            updateHeader(userData);

            if (userData.role === 'author') {
                // Если автор, открываем Студию загрузки
                createChannelSection.style.display = 'none';
                authorDashboardSection.style.display = 'grid';
                loadAuthorStats(userData);
            } else {
                // Если простой зритель, требуем сначала создать канал
                createChannelSection.style.display = 'block';
                authorDashboardSection.style.display = 'none';
            }
        }
    } else {
        // Если гость пытается зайти в студию, кидаем его на главную
        window.location.href = 'index.html';
    }
});

// Обновление аватарки в шапке студии
function updateHeader(userData) {
    studioUserHeader.innerHTML = `
        <img src="${userData.photoURL}" alt="Avatar" class="author-avatar" style="width: 40px; height: 40px; border-radius: 50%;">
        <span style="font-weight: 800; font-size: 14px;">${userData.displayName}</span>
    `;
}

// Загрузка статистики
function loadAuthorStats(userData) {
    document.getElementById('statSubs').innerText = userData.subscribers || 0;
    document.getElementById('statViews').innerText = userData.totalViews || 0;
    document.getElementById('statLikes').innerText = userData.totalLikes || 0;
}

// --- СОЗДАНИЕ КАНАЛА (ПЕРЕХОД ИЗ VIEWERS В AUTHORS) ---
if (submitCreateChannel) {
    submitCreateChannel.addEventListener('click', async () => {
        const name = newChannelName.value.trim();
        const handle = newChannelHandle.value.trim();
        const desc = newChannelDesc.value.trim();

        if (!name || !handle) return alert("Заполните обязательные поля!");

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                displayName: name,
                handle: handle,
                description: desc,
                role: 'author', // Изменяем роль на Автора!
                subscribers: 0,
                totalViews: 0,
                totalLikes: 0
            });

            alert("Поздравляем! Ваш канал на ForVide успешно активирован!");
            window.location.reload(); // Перезагружаем, чтобы применились роли
        } catch (error) {
            console.error("Ошибка при создании канала:", error);
            alert("Что-то пошло не так: " + error.message);
        }
    });
}

// --- ЛОГИКА ЗАГРУЗКИ ВИДЕО В STORAGE И FIRESTORE ---
if (startUploadBtn) {
    startUploadBtn.addEventListener('click', async () => {
        const title = videoTitle.value.trim();
        const desc = videoDesc.value.trim();
        const category = videoCategory.value;
        const vFile = videoFile.files[0];
        const tFile = thumbFile.files[0];

        if (!title || !vFile || !tFile) {
            return alert("Заполните название и выберите оба файла (Видео и Обложку)!");
        }

        startUploadBtn.disabled = true;
        uploadProgressContainer.style.display = 'block';

        try {
            // 1. Загрузка Видеофайла в Storage
            const videoStorageRef = ref(storage, `videos/${currentUser.uid}/${Date.now()}_${vFile.name}`);
            const uploadVideoTask = uploadBytesResumable(videoStorageRef, vFile);

            uploadVideoTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    uploadProgressBar.style.width = `${progress}%`;
                    progressText.innerText = `Загрузка видеофайла: ${Math.round(progress)}%`;
                }, 
                (error) => {
                    console.error("Ошибка загрузки видео:", error);
                    alert("Ошибка при заливке видеофайла.");
                    resetUploadState();
                }, 
                async () => {
                    const videoUrl = await getDownloadURL(uploadVideoTask.snapshot.ref);

                    // 2. Загрузка Обложки (Превью) в Storage
                    progressText.innerText = "Инициализация загрузки превью...";
                    const thumbStorageRef = ref(storage, `thumbs/${currentUser.uid}/${Date.now()}_${tFile.name}`);
                    const uploadThumbTask = uploadBytesResumable(thumbStorageRef, tFile);

                    uploadThumbTask.on('state_changed', 
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            progressText.innerText = `Загрузка обложки: ${Math.round(progress)}%`;
                        },
                        (error) => {
                            console.error("Ошибка загрузки обложки:", error);
                            alert("Ошибка при заливке обложки.");
                            resetUploadState();
                        },
                        async () => {
                            const thumbUrl = await getDownloadURL(uploadThumbTask.snapshot.ref);

                            // 3. Запись метаданных в БД Firestore
                            progressText.innerText = "Финальная публикация видео в системе...";
                            await addDoc(collection(db, "videos"), {
                                title: title,
                                description: desc,
                                category: category,
                                videoUrl: videoUrl,
                                thumbnailUrl: thumbUrl,
                                authorId: currentUser.uid,
                                authorName: currentUser.displayName,
                                createdAt: new Date(),
                                views: 0,
                                likes: 0,
                                duration: "05:00" // В продакшене вычисляется динамически
                            });

                            alert("Видео успешно опубликовано на ForVide!");
                            window.location.href = 'index.html';
                        }
                    );
                }
            );

        } catch (err) {
            console.error(err);
            alert("Критическая ошибка публикации.");
            resetUploadState();
        }
    });
}

function resetUploadState() {
    startUploadBtn.disabled = false;
    uploadProgressContainer.style.display = 'none';
    uploadProgressBar.style.width = '0%';
}
