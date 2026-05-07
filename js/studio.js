// js/studio.js
import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
    doc, getDoc, updateDoc, collection, addDoc, getDocs, query, where, orderBy, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import { saveUserProfile, getUserProfile } from './local-db.js';

let currentUser = null;
let currentUserData = null;

function showToast(msg, type='info') {
    if (window.showToast) { window.showToast(msg, type); return; }
    const c = document.getElementById('toast-container') || (() => { const el = document.createElement('div'); el.id='toast-container'; el.className='toast-container'; document.body.appendChild(el); return el; })();
    const t = document.createElement('div'); t.className=`toast ${type}`; t.textContent=msg; c.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

function formatNum(n) {
    if (n >= 1000000) return (n/1000000).toFixed(1)+'M';
    if (n >= 1000) return (n/1000).toFixed(1)+'K';
    return String(n||0);
}

// ============================================
// ШАПКА
// ============================================
function updateHeader(userData) {
    const el = document.getElementById('studioUserHeader');
    if (!el) return;
    el.innerHTML = `
        <img src="${userData.photoURL}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid var(--fv-gray-200);">
        <div style="display:flex;flex-direction:column;">
            <span style="font-weight:900;font-size:14px;">${userData.displayName}</span>
            <span style="font-size:11px;color:var(--fv-gray-400);font-weight:700;">${userData.role==='author'?'АВТОР':'ЗРИТЕЛЬ'}</span>
        </div>
        <a href="index.html" style="margin-left:16px;font-size:12px;font-weight:800;color:var(--fv-gray-400);text-decoration:none;text-transform:uppercase;letter-spacing:0.5px;">← Назад</a>
    `;
}

// ============================================
// СТАТИСТИКА
// ============================================
function loadStats(userData) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = formatNum(val||0); };
    set('statSubs', userData.subscribers);
    set('statViews', userData.totalViews);
    set('statLikes', userData.totalLikes);
}

// ============================================
// МОИ ВИДЕО
// ============================================
async function loadMyVideos(uid) {
    const section = document.getElementById('myVideosSection');
    const list = document.getElementById('videoManagementList');
    if (!section || !list) return;

    list.innerHTML = '<p style="color:var(--fv-gray-400);font-weight:600;font-size:14px;padding:20px 0;">Загрузка...</p>';

    try {
        const q = query(collection(db, 'videos'), where('authorId','==',uid), orderBy('createdAt','desc'));
        const snap = await getDocs(q);
        if (snap.empty) { list.innerHTML = '<p style="color:var(--fv-gray-400);font-weight:600;font-size:14px;">Вы ещё не загрузили ни одного видео. Самое время начать! 🚀</p>'; return; }
        list.innerHTML = '';
        snap.forEach(d => {
            const v = { id: d.id, ...d.data() };
            const item = document.createElement('div');
            item.className = 'video-manage-item';
            item.innerHTML = `
                <div class="manage-thumb"><img src="${v.thumbnailUrl||'https://picsum.photos/200/112'}" alt="${v.title}"></div>
                <div class="manage-info">
                    <div class="manage-title">${v.title}</div>
                    <div class="manage-stats">${formatNum(v.views||0)} просмотров · ${formatNum(v.likes||0)} лайков · ${v.category||''}</div>
                </div>
                <div class="manage-actions">
                    <a href="player.html?id=${v.id}" class="manage-btn" title="Смотреть" style="text-decoration:none;display:flex;align-items:center;justify-content:center;"><i class="ph ph-play"></i></a>
                    <button class="manage-btn delete" data-id="${v.id}" data-video="${v.videoUrl||''}" data-thumb="${v.thumbnailUrl||''}" title="Удалить"><i class="ph ph-trash"></i></button>
                </div>`;
            list.appendChild(item);
        });
        list.querySelectorAll('.manage-btn.delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Удалить это видео? Это действие необратимо.')) return;
                try {
                    await deleteDoc(doc(db, 'videos', btn.dataset.id));
                    if (btn.dataset.video) await deleteObject(ref(storage, btn.dataset.video)).catch(()=>{});
                    if (btn.dataset.thumb) await deleteObject(ref(storage, btn.dataset.thumb)).catch(()=>{});
                    btn.closest('.video-manage-item').remove();
                    showToast('Видео удалено', 'info');
                } catch (err) { showToast('Ошибка: '+err.message, 'error'); }
            });
        });
    } catch (err) {
        console.error(err);
        list.innerHTML = '<p style="color:var(--fv-gray-400);font-weight:600;font-size:14px;">Не удалось загрузить видео</p>';
    }
}

// ============================================
// AUTH STATE
// ============================================
onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = 'index.html'; return; }
    currentUser = user;

    // Пробуем Firestore, иначе LocalDB
    try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) { currentUserData = snap.data(); saveUserProfile(user.uid, currentUserData); }
        else { window.location.href = 'index.html'; return; }
    } catch {
        currentUserData = getUserProfile(user.uid);
        if (!currentUserData) { window.location.href = 'index.html'; return; }
    }

    updateHeader(currentUserData);

    const createSection = document.getElementById('createChannelSection');
    const dashSection = document.getElementById('authorDashboardSection');
    const myVidSection = document.getElementById('myVideosSection');

    if (currentUserData.role === 'author') {
        if (createSection) createSection.style.display = 'none';
        if (dashSection) dashSection.style.display = 'grid';
        if (myVidSection) myVidSection.style.display = 'block';
        loadStats(currentUserData);
        await loadMyVideos(user.uid);
    } else {
        if (createSection) createSection.style.display = 'block';
        if (dashSection) dashSection.style.display = 'none';
    }
});

// ============================================
// СОЗДАНИЕ КАНАЛА
// ============================================
document.getElementById('submitCreateChannel')?.addEventListener('click', async () => {
    const name = document.getElementById('newChannelName')?.value.trim();
    const handle = document.getElementById('newChannelHandle')?.value.trim();
    const desc = document.getElementById('newChannelDesc')?.value.trim();
    if (!name || !handle) { showToast('Заполните название и никнейм!', 'error'); return; }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(handle)) { showToast('Никнейм: только буквы, цифры и _ (3-30 символов)', 'error'); return; }
    const btn = document.getElementById('submitCreateChannel');
    btn.disabled = true; btn.textContent = 'СОЗДАНИЕ...';
    const updates = {
        displayName: name, handle: '@'+handle, description: desc||'',
        role: 'author', subscribers: 0, totalViews: 0, totalLikes: 0,
        channelCreatedAt: new Date()
    };
    try {
        await updateDoc(doc(db, 'users', currentUser.uid), updates);
    } catch { /* offline — сохраняем локально */ }
    saveUserProfile(currentUser.uid, { ...(getUserProfile(currentUser.uid)||{}), ...updates });
    showToast(`Канал "${name}" создан! 🎉`, 'success');
    setTimeout(() => window.location.reload(), 1500);
});

// ============================================
// ЗАГРУЗКА ВИДЕО
// ============================================
const videoFileInput = document.getElementById('videoFile');
const thumbFileInput = document.getElementById('thumbFile');

function fileChangeHandler(input) {
    input?.addEventListener('change', () => {
        const wrapper = input.closest('.file-input-wrapper');
        const label = wrapper?.querySelector('.file-label');
        if (input.files[0] && label) {
            wrapper.classList.add('has-file');
            let fn = label.querySelector('.file-name');
            if (!fn) { fn = document.createElement('span'); fn.className = 'file-name'; label.appendChild(fn); }
            fn.textContent = input.files[0].name;
        }
    });
}
fileChangeHandler(videoFileInput);
fileChangeHandler(thumbFileInput);

document.getElementById('startUploadBtn')?.addEventListener('click', async () => {
    const title = document.getElementById('videoTitle')?.value.trim();
    const desc = document.getElementById('videoDesc')?.value.trim();
    const category = document.getElementById('videoCategory')?.value;
    const vFile = videoFileInput?.files[0];
    const tFile = thumbFileInput?.files[0];

    if (!title) { showToast('Введите название!', 'error'); return; }
    if (!vFile) { showToast('Выберите видеофайл!', 'error'); return; }
    if (!tFile) { showToast('Выберите обложку!', 'error'); return; }
    if (!vFile.type.startsWith('video/')) { showToast('Файл должен быть видео!', 'error'); return; }
    if (!tFile.type.startsWith('image/')) { showToast('Обложка — изображение!', 'error'); return; }

    const btn = document.getElementById('startUploadBtn');
    const progressContainer = document.getElementById('uploadProgressContainer');
    const progressBar = document.getElementById('uploadProgressBar');
    const progressText = document.getElementById('progressText');

    btn.disabled = true; btn.textContent = 'ПУБЛИКАЦИЯ...';
    if (progressContainer) progressContainer.style.display = 'block';

    const setProgress = (pct, text) => {
        if (progressBar) progressBar.style.width = pct+'%';
        if (progressText) progressText.textContent = text;
    };

    try {
        // 1. Видео
        const videoRef = ref(storage, `videos/${currentUser.uid}/${Date.now()}_${vFile.name}`);
        const videoTask = uploadBytesResumable(videoRef, vFile);
        await new Promise((res, rej) => videoTask.on('state_changed',
            s => setProgress(Math.round(s.bytesTransferred/s.totalBytes*80), `Загрузка видео: ${Math.round(s.bytesTransferred/s.totalBytes*80)}%`),
            rej, res
        ));
        const videoUrl = await getDownloadURL(videoTask.snapshot.ref);

        // 2. Обложка
        setProgress(85, 'Загрузка обложки...');
        const thumbRef = ref(storage, `thumbs/${currentUser.uid}/${Date.now()}_${tFile.name}`);
        const thumbTask = uploadBytesResumable(thumbRef, tFile);
        await new Promise((res, rej) => thumbTask.on('state_changed', null, rej, res));
        const thumbUrl = await getDownloadURL(thumbTask.snapshot.ref);

        // 3. Firestore
        setProgress(95, 'Публикация...');
        await addDoc(collection(db, 'videos'), {
            title, description: desc||'', category, videoUrl, thumbnailUrl: thumbUrl,
            authorId: currentUser.uid, authorName: currentUserData.displayName,
            authorAvatar: currentUserData.photoURL, authorHandle: currentUserData.handle||'',
            createdAt: new Date(), views: 0, likes: 0, duration: '00:00'
        });

        setProgress(100, 'Опубликовано! 🎉');
        showToast('Видео опубликовано на ForVide! 🎉', 'success', 4000);
        setTimeout(() => window.location.href = 'index.html', 1500);
    } catch (err) {
        console.error(err);
        showToast('Ошибка при загрузке: '+err.message, 'error');
        btn.disabled = false; btn.textContent = 'ОПУБЛИКОВАТЬ НА FORVIDE';
        if (progressContainer) progressContainer.style.display = 'none';
    }
});
