// js/studio.js
import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
    doc, getDoc, updateDoc, collection, addDoc, getDocs, query, where, orderBy, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// DOM
const createChannelSection = document.getElementById('createChannelSection');
const authorDashboardSection = document.getElementById('authorDashboardSection');
const studioUserHeader = document.getElementById('studioUserHeader');

let currentUser = null;
let currentUserData = null;

// ============================================
// TOAST (локальный, т.к. ui-controller может не быть подключен)
// ============================================
function showToast(msg, type = 'info') {
    if (window.showToast) { window.showToast(msg, type); return; }
    let c = document.getElementById('toast-container');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toast-container';
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

// ============================================
// ШАПКА СТУДИИ
// ============================================
function updateHeader(userData) {
    if (!studioUserHeader) return;
    studioUserHeader.innerHTML = `
        <img src="${userData.photoURL}" alt="Avatar" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid var(--fv-gray-200);">
        <div style="display:flex;flex-direction:column;">
            <span style="font-weight:900;font-size:14px;">${userData.displayName}</span>
            <span style="font-size:11px;color:var(--fv-gray-400);font-weight:700;">${userData.role === 'author' ? 'АВТОР' : 'ЗРИТЕЛЬ'}</span>
        </div>
        <a href="index.html" style="margin-left:16px;font-size:12px;font-weight:800;color:var(--fv-gray-400);text-decoration:none;text-transform:uppercase;letter-spacing:0.5px;">← Назад</a>
    `;
}

// ============================================
// СТАТИСТИКА КАНАЛА
// ============================================
function loadAuthorStats(userData) {
    const statSubs = document.getElementById('statSubs');
    const statViews = document.getElementById('statViews');
    const statLikes = document.getElementById('statLikes');
    if (statSubs) statSubs.textContent = formatNum(userData.subscribers || 0);
    if (statViews) statViews.textContent = formatNum(userData.totalViews || 0);
    if (statLikes) statLikes.textContent = formatNum(userData.totalLikes || 0);
}

function formatNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}

// ============================================
// МОИ ВИДЕО
// ============================================
async function loadMyVideos(uid) {
    const section = document.getElementById('myVideosSection');
    if (!section) return;

    try {
        const q = query(
            collection(db, 'videos'),
            where('authorId', '==', uid),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);

        const list = document.getElementById('videoManagementList');
        if (!list) return;

        if (snap.empty) {
            list.innerHTML = '<p style="color:var(--fv-gray-400);font-weight:600;font-size:14px;">Вы ещё не загрузили ни одного видео. Самое время начать! 🚀</p>';
            return;
        }

        list.innerHTML = '';
        snap.forEach(d => {
            const v = { id: d.id, ...d.data() };
            const item = document.createElement('div');
            item.className = 'video-manage-item';
            item.innerHTML = `
                <div class="manage-thumb">
                    <img src="${v.thumbnailUrl || 'https://picsum.photos/200/112'}" alt="${v.title}">
                </div>
                <div class="manage-info">
                    <div class="manage-title">${v.title}</div>
                    <div class="manage-stats">${formatNum(v.views || 0)} просмотров • ${formatNum(v.likes || 0)} лайков</div>
                </div>
                <div class="manage-actions">
                    <button class="manage-btn delete" data-id="${v.id}" data-video="${v.videoUrl || ''}" data-thumb="${v.thumbnailUrl || ''}" title="Удалить">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            `;
            list.appendChild(item);
        });

        // Удаление видео
        list.querySelectorAll('.manage-btn.delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Удалить это видео? Это действие необратимо.')) return;
                const id = btn.dataset.id;
                const videoUrl = btn.dataset.video;
                const thumbUrl = btn.dataset.thumb;

                try {
                    await deleteDoc(doc(db, 'videos', id));
                    if (videoUrl) await deleteObject(ref(storage, videoUrl)).catch(() => {});
                    if (thumbUrl) await deleteObject(ref(storage, thumbUrl)).catch(() => {});
                    btn.closest('.video-manage-item').remove();
                    showToast('Видео удалено', 'info');
                } catch (err) {
                    showToast('Ошибка удаления: ' + err.message, 'error');
                }
            });
        });

    } catch (err) {
        console.error('Ошибка загрузки видео:', err);
    }
}

// ============================================
// СТАТУС АВТОРИЗАЦИИ
// ============================================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = user;
    const userRef = doc(db, 'users', user.uid);

    try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
            window.location.href = 'index.html';
            return;
        }
        currentUserData = snap.data();
        updateHeader(currentUserData);

        if (currentUserData.role === 'author') {
            if (createChannelSection) createChannelSection.style.display = 'none';
            if (authorDashboardSection) authorDashboardSection.style.display = 'grid';
            loadAuthorStats(currentUserData);
            await loadMyVideos(user.uid);
        } else {
            if (createChannelSection) createChannelSection.style.display = 'block';
            if (authorDashboardSection) authorDashboardSection.style.display = 'none';
        }
    } catch (err) {
        console.error('Ошибка загрузки студии:', err);
        showToast('Ошибка подключения к базе данных', 'error');
    }
});

// ============================================
// СОЗДАНИЕ КАНАЛА
// ============================================
const submitCreateChannel = document.getElementById('submitCreateChannel');
if (submitCreateChannel) {
    submitCreateChannel.addEventListener('click', async () => {
        const name = document.getElementById('newChannelName')?.value.trim();
        const handle = document.getElementById('newChannelHandle')?.value.trim();
        const desc = document.getElementById('newChannelDesc')?.value.trim();

        if (!name || !handle) {
            showToast('Заполните название канала и никнейм!', 'error');
            return;
        }

        if (!/^[a-zA-Z0-9_]{3,30}$/.test(handle)) {
            showToast('Никнейм: только буквы, цифры и _ (3-30 символов)', 'error');
            return;
        }

        submitCreateChannel.disabled = true;
        submitCreateChannel.textContent = 'СОЗДАНИЕ...';

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                displayName: name,
                handle: '@' + handle,
                description: desc || '',
                role: 'author',
                subscribers: 0,
                totalViews: 0,
                totalLikes: 0,
                channelCreatedAt: new Date()
            });
            showToast(`Канал "${name}" успешно создан! 🎉`, 'success');
            setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
            console.error('Ошибка создания канала:', err);
            showToast('Ошибка: ' + err.message, 'error');
            submitCreateChannel.disabled = false;
            submitCreateChannel.textContent = 'АКТИВИРОВАТЬ КАНАЛ';
        }
    });
}

// ============================================
// ЗАГРУЗКА ВИДЕО
// ============================================
const videoFileInput = document.getElementById('videoFile');
const thumbFileInput = document.getElementById('thumbFile');

// Превью названий файлов
if (videoFileInput) {
    videoFileInput.addEventListener('change', () => {
        const wrapper = videoFileInput.closest('.file-input-wrapper');
        const label = wrapper?.querySelector('.file-label');
        if (videoFileInput.files[0] && label) {
            wrapper.classList.add('has-file');
            const fn = label.querySelector('.file-name') || document.createElement('span');
            fn.className = 'file-name';
            fn.textContent = videoFileInput.files[0].name;
            label.appendChild(fn);
        }
    });
}

if (thumbFileInput) {
    thumbFileInput.addEventListener('change', () => {
        const wrapper = thumbFileInput.closest('.file-input-wrapper');
        const label = wrapper?.querySelector('.file-label');
        if (thumbFileInput.files[0] && label) {
            wrapper.classList.add('has-file');
            const fn = label.querySelector('.file-name') || document.createElement('span');
            fn.className = 'file-name';
            fn.textContent = thumbFileInput.files[0].name;
            label.appendChild(fn);
        }
    });
}

const startUploadBtn = document.getElementById('startUploadBtn');
const uploadProgressContainer = document.getElementById('uploadProgressContainer');
const uploadProgressBar = document.getElementById('uploadProgressBar');
const progressText = document.getElementById('progressText');

function resetUpload() {
    if (startUploadBtn) { startUploadBtn.disabled = false; startUploadBtn.textContent = 'ОПУБЛИКОВАТЬ НА FORVIDE'; }
    if (uploadProgressContainer) uploadProgressContainer.style.display = 'none';
    if (uploadProgressBar) uploadProgressBar.style.width = '0%';
}

if (startUploadBtn) {
    startUploadBtn.addEventListener('click', async () => {
        const title = document.getElementById('videoTitle')?.value.trim();
        const desc = document.getElementById('videoDesc')?.value.trim();
        const category = document.getElementById('videoCategory')?.value;
        const vFile = videoFileInput?.files[0];
        const tFile = thumbFileInput?.files[0];

        if (!title) { showToast('Введите название видео!', 'error'); return; }
        if (!vFile) { showToast('Выберите видеофайл!', 'error'); return; }
        if (!tFile) { showToast('Выберите обложку!', 'error'); return; }

        // Проверка форматов
        if (!vFile.type.startsWith('video/')) { showToast('Файл должен быть видео!', 'error'); return; }
        if (!tFile.type.startsWith('image/')) { showToast('Обложка должна быть изображением!', 'error'); return; }

        startUploadBtn.disabled = true;
        startUploadBtn.textContent = 'ПУБЛИКАЦИЯ...';
        if (uploadProgressContainer) uploadProgressContainer.style.display = 'block';

        try {
            // 1. Загрузка видео
            const videoRef = ref(storage, `videos/${currentUser.uid}/${Date.now()}_${vFile.name}`);
            const videoTask = uploadBytesResumable(videoRef, vFile);

            await new Promise((resolve, reject) => {
                videoTask.on('state_changed',
                    (snap) => {
                        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                        if (uploadProgressBar) uploadProgressBar.style.width = `${pct}%`;
                        if (progressText) progressText.textContent = `Загрузка видео: ${pct}%`;
                    },
                    reject,
                    resolve
                );
            });

            const videoUrl = await getDownloadURL(videoTask.snapshot.ref);

            // 2. Загрузка обложки
            const thumbRef = ref(storage, `thumbs/${currentUser.uid}/${Date.now()}_${tFile.name}`);
            const thumbTask = uploadBytesResumable(thumbRef, tFile);

            await new Promise((resolve, reject) => {
                thumbTask.on('state_changed',
                    (snap) => {
                        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                        if (uploadProgressBar) uploadProgressBar.style.width = `${pct}%`;
                        if (progressText) progressText.textContent = `Загрузка обложки: ${pct}%`;
                    },
                    reject,
                    resolve
                );
            });

            const thumbUrl = await getDownloadURL(thumbTask.snapshot.ref);

            // 3. Запись в Firestore
            if (progressText) progressText.textContent = 'Публикация...';
            if (uploadProgressBar) uploadProgressBar.style.width = '100%';

            await addDoc(collection(db, 'videos'), {
                title,
                description: desc || '',
                category,
                videoUrl,
                thumbnailUrl: thumbUrl,
                authorId: currentUser.uid,
                authorName: currentUserData.displayName,
                authorAvatar: currentUserData.photoURL,
                authorHandle: currentUserData.handle || '',
                createdAt: new Date(),
                views: 0,
                likes: 0,
                duration: '00:00'
            });

            showToast('🎉 Видео опубликовано на ForVide!', 'success', 4000);
            setTimeout(() => window.location.href = 'index.html', 1500);

        } catch (err) {
            console.error('Ошибка загрузки:', err);
            showToast('Ошибка при загрузке: ' + err.message, 'error');
            resetUpload();
        }
    });
}
