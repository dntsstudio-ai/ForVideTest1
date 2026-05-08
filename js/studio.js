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

const toast = (msg, type='info') => window.showToast?.(msg,type) || console.log(msg);
const formatNum = n => n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n||0);
const $ = id => document.getElementById(id);

function updateHeader(u) {
    const el = $('studioUserHeader');
    if (!el) return;
    el.innerHTML = `
        <img src="${u.photoURL}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid var(--fv-border);">
        <div style="display:flex;flex-direction:column;">
            <span style="font-weight:900;font-size:14px;color:var(--fv-text);">${u.displayName}</span>
            <span style="font-size:11px;color:var(--fv-text-muted);font-weight:700;">${u.role==='author'?'АВТОР':u.role==='moderator'?'МОДЕРАТОР':u.role==='admin'?'АДМИНИСТРАТОР':'ЗРИТЕЛЬ'}</span>
        </div>
        <a href="index.html" style="margin-left:16px;font-size:12px;font-weight:800;color:var(--fv-text-muted);text-decoration:none;text-transform:uppercase;">← Назад</a>
    `;
}

function loadStats(u) {
    ['statSubs','statViews','statLikes'].forEach((id,i) => {
        const el = $(id);
        if (el) el.textContent = formatNum([u.subscribers, u.totalViews, u.totalLikes][i]||0);
    });
}

async function loadMyVideos(uid) {
    const list = $('videoManagementList');
    if (!list) return;
    list.innerHTML = '<p style="color:var(--fv-text-muted);font-weight:600;font-size:14px;padding:20px 0;">Загрузка...</p>';
    try {
        const q = query(collection(db,'videos'), where('authorId','==',uid), orderBy('createdAt','desc'));
        const snap = await getDocs(q);
        if (snap.empty) { list.innerHTML = '<p style="color:var(--fv-text-muted);font-weight:600;font-size:14px;">Видео ещё нет — самое время загрузить первое! 🚀</p>'; return; }
        list.innerHTML = '';
        snap.forEach(d => {
            const v = { id:d.id, ...d.data() };
            const item = document.createElement('div');
            item.className = 'video-manage-item';
            item.innerHTML = `
                <div class="manage-thumb"><img src="${v.thumbnailUrl||'https://picsum.photos/200/112'}" alt="${v.title}" style="width:100%;height:100%;object-fit:cover;"></div>
                <div class="manage-info">
                    <div class="manage-title">${v.title}</div>
                    <div class="manage-stats">${formatNum(v.views||0)} просмотров · ${formatNum(v.likes||0)} лайков</div>
                </div>
                <div class="manage-actions">
                    <a href="player.html?id=${v.id}" class="manage-btn" style="text-decoration:none;display:flex;align-items:center;justify-content:center;"><i class="ph ph-play"></i></a>
                    <button class="manage-btn delete" data-id="${v.id}" data-video="${v.videoUrl||''}" data-thumb="${v.thumbnailUrl||''}"><i class="ph ph-trash"></i></button>
                </div>`;
            list.appendChild(item);
        });
        list.querySelectorAll('.manage-btn.delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Удалить это видео?')) return;
                try {
                    await deleteDoc(doc(db,'videos',btn.dataset.id));
                    if (btn.dataset.video) await deleteObject(ref(storage,btn.dataset.video)).catch(()=>{});
                    if (btn.dataset.thumb) await deleteObject(ref(storage,btn.dataset.thumb)).catch(()=>{});
                    btn.closest('.video-manage-item').remove();
                    toast('Видео удалено','info');
                } catch(e){ toast('Ошибка: '+e.message,'error'); }
            });
        });
    } catch(e) {
        list.innerHTML = '<p style="color:var(--fv-text-muted);font-weight:600;font-size:14px;">Не удалось загрузить видео</p>';
    }
}

// ============================================
// AUTH
// ============================================
onAuthStateChanged(auth, async user => {
    const loading = $('studioLoading');
    if (!user) { window.location.href='index.html'; return; }
    currentUser = user;

    try {
        const snap = await getDoc(doc(db,'users',user.uid));
        if (snap.exists()) { currentUserData = snap.data(); saveUserProfile(user.uid, currentUserData); }
        else { window.location.href='index.html'; return; }
    } catch {
        currentUserData = getUserProfile(user.uid);
        if (!currentUserData) { window.location.href='index.html'; return; }
    }

    if (loading) loading.style.display = 'none';
    updateHeader(currentUserData);

    const createSection = $('createChannelSection');
    const dashSection = $('authorDashboardSection');
    const myVidSection = $('myVideosSection');
    const adminSection = $('adminSection');

    const role = currentUserData.role;
    const isCreator = role === 'author' || role === 'moderator' || role === 'admin';

    if (isCreator) {
        if (createSection) createSection.style.display = 'none';
        if (dashSection) dashSection.style.display = 'grid';
        if (myVidSection) myVidSection.style.display = 'block';
        loadStats(currentUserData);
        await loadMyVideos(user.uid);
    } else {
        if (createSection) createSection.style.display = 'block';
        if (dashSection) dashSection.style.display = 'none';
    }

    if ((role === 'admin' || role === 'moderator') && adminSection) {
        adminSection.style.display = 'block';
        initAdminPanel(role);
    }
});

// ============================================
// СОЗДАНИЕ КАНАЛА
// ============================================
$('submitCreateChannel')?.addEventListener('click', async () => {
    const name = $('newChannelName')?.value.trim();
    const handle = $('newChannelHandle')?.value.trim();
    const desc = $('newChannelDesc')?.value.trim();
    if (!name||!handle) { toast('Заполните название и никнейм!','error'); return; }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(handle)) { toast('Никнейм: буквы, цифры, _ (3-30 символов)','error'); return; }
    const btn = $('submitCreateChannel');
    btn.disabled=true; btn.textContent='СОЗДАНИЕ...';
    const updates = { displayName:name, handle:'@'+handle, description:desc||'', role:'author', subscribers:0, totalViews:0, totalLikes:0, channelCreatedAt:new Date() };
    try { await updateDoc(doc(db,'users',currentUser.uid), updates); } catch {}
    saveUserProfile(currentUser.uid, { ...(getUserProfile(currentUser.uid)||{}), ...updates });
    toast(`Канал "${name}" создан! 🎉`,'success');
    setTimeout(()=>window.location.reload(), 1500);
});

// ============================================
// FILE INPUTS
// ============================================
['videoFile','thumbFile'].forEach(id => {
    $(id)?.addEventListener('change', function() {
        const wrapper = this.closest('.file-input-wrapper');
        if (this.files[0] && wrapper) {
            wrapper.classList.add('has-file');
            let fn = wrapper.querySelector('.file-name');
            if (!fn) { fn=document.createElement('span'); fn.className='file-name'; wrapper.querySelector('.file-label')?.appendChild(fn); }
            fn.textContent = this.files[0].name;
        }
    });
});

// ============================================
// ЗАГРУЗКА ВИДЕО — с CORS fix через Storage SDK
// ============================================
$('startUploadBtn')?.addEventListener('click', async () => {
    const title = $('videoTitle')?.value.trim();
    const desc  = $('videoDesc')?.value.trim();
    const cat   = $('videoCategory')?.value;
    const vFile = $('videoFile')?.files[0];
    const tFile = $('thumbFile')?.files[0];

    if (!title) { toast('Введите название!','error'); return; }
    if (!vFile)  { toast('Выберите видеофайл!','error'); return; }
    if (!tFile)  { toast('Выберите обложку!','error'); return; }
    if (!vFile.type.startsWith('video/')) { toast('Файл должен быть видео!','error'); return; }
    if (!tFile.type.startsWith('image/')) { toast('Обложка — изображение!','error'); return; }

    const btn = $('startUploadBtn');
    const progContainer = $('uploadProgressContainer');
    const progBar = $('uploadProgressBar');
    const progText = $('progressText');

    btn.disabled=true; btn.innerHTML='<i class="ph ph-spinner" style="animation:spin 0.8s linear infinite"></i> ПУБЛИКАЦИЯ...';
    if (progContainer) progContainer.style.display='block';

    const setProgress = (pct, text) => {
        if (progBar) progBar.style.width = pct+'%';
        if (progText) progText.textContent = text;
    };

    const resetBtn = () => {
        btn.disabled=false; btn.innerHTML='<i class="ph ph-upload-simple"></i> ОПУБЛИКОВАТЬ НА FORVIDE';
        if (progContainer) progContainer.style.display='none';
    };

    try {
        // --- VIDEO UPLOAD ---
        setProgress(5,'Подготовка видео...');
        const vPath = `videos/${currentUser.uid}/${Date.now()}_${vFile.name.replace(/[^a-z0-9._-]/gi,'_')}`;
        const vRef = ref(storage, vPath);
        const vTask = uploadBytesResumable(vRef, vFile, { contentType: vFile.type });

        const videoUrl = await new Promise((resolve, reject) => {
            vTask.on('state_changed',
                snap => setProgress(5 + Math.round(snap.bytesTransferred/snap.totalBytes*70), `Видео: ${Math.round(snap.bytesTransferred/snap.totalBytes*100)}%`),
                err => reject(err),
                async () => resolve(await getDownloadURL(vTask.snapshot.ref))
            );
        });

        // --- THUMB UPLOAD ---
        setProgress(78,'Загрузка обложки...');
        const tPath = `thumbs/${currentUser.uid}/${Date.now()}_${tFile.name.replace(/[^a-z0-9._-]/gi,'_')}`;
        const tRef = ref(storage, tPath);
        const tTask = uploadBytesResumable(tRef, tFile, { contentType: tFile.type });

        const thumbUrl = await new Promise((resolve, reject) => {
            tTask.on('state_changed',
                snap => setProgress(78 + Math.round(snap.bytesTransferred/snap.totalBytes*15), `Обложка: ${Math.round(snap.bytesTransferred/snap.totalBytes*100)}%`),
                err => reject(err),
                async () => resolve(await getDownloadURL(tTask.snapshot.ref))
            );
        });

        // --- FIRESTORE ---
        setProgress(95,'Публикация...');
        await addDoc(collection(db,'videos'), {
            title, description:desc||'', category:cat,
            videoUrl, thumbnailUrl:thumbUrl,
            authorId:currentUser.uid, authorName:currentUserData.displayName,
            authorAvatar:currentUserData.photoURL, authorHandle:currentUserData.handle||'',
            createdAt:new Date(), views:0, likes:0, duration:'00:00'
        });

        setProgress(100,'Опубликовано! 🎉');
        toast('Видео опубликовано на ForVide! 🎉','success',4000);
        // Сбрасываем форму
        $('videoTitle').value=''; $('videoDesc').value='';
        $('videoFile').value=''; $('thumbFile').value='';
        document.querySelectorAll('.file-input-wrapper').forEach(w=>w.classList.remove('has-file'));
        document.querySelectorAll('.file-name').forEach(f=>f.remove());
        await loadMyVideos(currentUser.uid);
        resetBtn();

    } catch(err) {
        console.error('Upload error:', err);
        if (err.code === 'storage/unauthorized') {
            toast('Ошибка доступа к Storage — проверь правила Firebase','error');
        } else if (err.message?.includes('CORS')) {
            toast('CORS ошибка — нужно настроить Firebase Storage (см. инструкцию)','error');
        } else {
            toast('Ошибка загрузки: '+err.message,'error');
        }
        resetBtn();
    }
});

// ============================================
// ADMIN PANEL
// ============================================
async function initAdminPanel(role) {
    // Подтягиваем статистику
    try {
        const { getSiteStats, getReports } = await import('./admin.js');
        const stats = await getSiteStats();
        const statsEl = $('adminStats');
        if (statsEl) statsEl.innerHTML = `
            <div class="stat-box"><div class="stat-left"><span class="stat-num">${stats.totalUsers}</span><span class="stat-label">Пользователей</span></div><i class="ph-fill ph-users stat-icon"></i></div>
            <div class="stat-box"><div class="stat-left"><span class="stat-num">${stats.totalAuthors}</span><span class="stat-label">Авторов</span></div><i class="ph-fill ph-video-camera stat-icon"></i></div>
            <div class="stat-box"><div class="stat-left"><span class="stat-num">${stats.totalVideos}</span><span class="stat-label">Видео</span></div><i class="ph-fill ph-film-strip stat-icon"></i></div>
        `;
        // Топ видео
        const topEl = $('adminTopVideos');
        if (topEl && stats.topVideos.length) {
            topEl.innerHTML = stats.topVideos.map((v,i)=>`
                <a href="player.html?id=${v.id}" style="display:flex;align-items:center;gap:12px;padding:10px;border-radius:var(--radius-sm);text-decoration:none;color:var(--fv-text);background:var(--fv-gray-50);border:1.5px solid var(--fv-border);margin-bottom:8px;">
                    <span style="font-size:22px;font-weight:900;color:var(--fv-mustard);width:28px;">#${i+1}</span>
                    <img src="${v.thumbnailUrl||''}" style="width:60px;height:34px;object-fit:cover;border-radius:6px;">
                    <div style="flex:1;min-width:0;"><div style="font-weight:800;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${v.title}</div><div style="font-size:11px;color:var(--fv-text-muted);font-weight:600;">${formatNum(v.views||0)} просмотров</div></div>
                </a>`).join('');
        }

        // Жалобы
        const reports = await getReports('pending');
        const reportsEl = $('adminReportsList');
        if (reportsEl) {
            if (!reports.length) { reportsEl.innerHTML='<p style="color:var(--fv-text-muted);font-weight:600;font-size:13px;">Нет жалоб</p>'; }
            else reportsEl.innerHTML = reports.map(r=>`
                <div class="admin-report-item" style="background:var(--fv-gray-50);border:1.5px solid var(--fv-border);border-radius:var(--radius-sm);padding:14px;margin-bottom:10px;">
                    <div style="font-weight:700;font-size:13px;margin-bottom:6px;">${r.reason}</div>
                    <div style="font-size:11px;color:var(--fv-text-muted);margin-bottom:10px;">${r.type} · ${new Date(r.createdAt).toLocaleDateString('ru-RU')}</div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        ${role==='admin'?`
                            <button onclick="window.adminAction('ban','${r.targetUid||''}','${r.id}')" style="background:var(--fv-danger);color:white;border:none;padding:6px 14px;border-radius:6px;font-weight:800;font-size:12px;cursor:pointer;">БАН</button>
                            <button onclick="window.adminAction('mute','${r.targetUid||''}','${r.id}')" style="background:var(--fv-mustard);color:#111;border:none;padding:6px 14px;border-radius:6px;font-weight:800;font-size:12px;cursor:pointer;">МЮТ</button>
                            <button onclick="window.adminAction('warn','${r.targetUid||''}','${r.id}')" style="background:var(--fv-gray-200);color:var(--fv-text);border:none;padding:6px 14px;border-radius:6px;font-weight:800;font-size:12px;cursor:pointer;">ПРЕДУПРЕЖДЕНИЕ</button>
                            <button onclick="window.adminAction('dismiss','','${r.id}')" style="background:transparent;color:var(--fv-text-muted);border:1.5px solid var(--fv-border);padding:6px 14px;border-radius:6px;font-weight:800;font-size:12px;cursor:pointer;">ОТКЛОНИТЬ</button>
                        `:`
                            <button onclick="window.modEscalate('${r.id}')" style="background:var(--fv-danger);color:white;border:none;padding:6px 14px;border-radius:6px;font-weight:800;font-size:12px;cursor:pointer;">⚑ На рассмотрение</button>
                            <button onclick="window.adminAction('dismiss','','${r.id}')" style="background:transparent;color:var(--fv-text-muted);border:1.5px solid var(--fv-border);padding:6px 14px;border-radius:6px;font-weight:800;font-size:12px;cursor:pointer;">ОТКЛОНИТЬ</button>
                        `}
                    </div>
                </div>`).join('');
        }
    } catch(e) { console.error('Admin init:', e); }
}

// Global admin actions
window.adminAction = async (action, uid, reportId) => {
    const { banUser, muteUser, warnUser, updateReportStatus } = await import('./admin.js');
    if (action==='ban' && uid) {
        const hrs = prompt('Срок бана (часов, или "forever"):','48');
        const reason = prompt('Причина:','');
        await banUser(uid, { duration:hrs==='forever'?'forever':parseInt(hrs)||48, reason });
    } else if (action==='mute' && uid) {
        const hrs = prompt('Срок мьюта (часов, или "forever"):','24');
        const reason = prompt('Причина:','');
        await muteUser(uid, { duration:hrs==='forever'?'forever':parseInt(hrs)||24, reason });
    } else if (action==='warn' && uid) {
        const reason = prompt('Причина предупреждения:','');
        await warnUser(uid, reason);
    }
    if (reportId) await updateReportStatus(reportId, action==='dismiss'?'dismissed':'resolved');
    document.querySelector(`[data-report="${reportId}"]`)?.closest('.admin-report-item')?.remove();
};

window.modEscalate = async (reportId) => {
    const { updateReportStatus } = await import('./admin.js');
    await updateReportStatus(reportId, 'escalated');
    window.showToast?.('Жалоба отправлена на рассмотрение администратору','success');
    document.querySelector(`[data-report="${reportId}"]`)?.closest('.admin-report-item')?.remove();
};
