// js/player-logic.js
import { auth, db } from './firebase-config.js';
import {
    doc, getDoc, collection, addDoc, query, orderBy, getDocs,
    updateDoc, increment, serverTimestamp, limit
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import {
    addToHistory, addToLiked, removeFromLiked, isLiked, addComment, getComments
} from './local-db.js';

// ============================================
// МОКОВЫЕ ДАННЫЕ
// ============================================
const mockVideos = {
    "m1": { title:"ОБЗОР UNREAL ENGINE 6: ГРАФИКА НОВОГО ПОКОЛЕНИЯ", views:1240500, authorName:"TechGuru", authorId:"mock_1", authorPhotoURL:"https://ui-avatars.com/api/?name=TG&background=111&color=facc15&bold=true", subscribers:"2.4 млн", description:"В этом видео мы детально разбираем нововведения Unreal Engine 6. Lumen, Nanite, нейросетевые апскейлинг-технологии и многое другое!", videoUrl:null, thumbnailUrl:"https://picsum.photos/seed/ue6/800/450", likes:48200, duration:"14:20", createdAt:new Date(Date.now()-86400000*3) },
    "m2": { title:"ПОДКАСТ: БУДУЩЕЕ ВЕБ-РАЗРАБОТКИ В 2025", views:450000, authorName:"DevTalks", authorId:"mock_2", authorPhotoURL:"https://ui-avatars.com/api/?name=DT&background=27272a&color=fff&bold=true", subscribers:"890K", description:"Обсуждаем тренды веб-разработки, новые фреймворки и что ждёт индустрию.", videoUrl:null, thumbnailUrl:"https://picsum.photos/seed/web25/800/450", likes:12400, duration:"1:02:15", createdAt:new Date(Date.now()-86400000*2) },
    "m3": { title:"СОБРАЛ СТУДИЮ ЗА 50 000₽ | ПОЛНЫЙ ОБЗОР", views:890000, authorName:"StudioMaker", authorId:"mock_3", authorPhotoURL:"https://ui-avatars.com/api/?name=SM&background=facc15&color=000&bold=true", subscribers:"450K", description:"Полный гайд по бюджетной домашней студии для съёмки видео.", videoUrl:null, thumbnailUrl:"https://picsum.photos/seed/studio/800/450", likes:33000, duration:"08:45", createdAt:new Date(Date.now()-86400000*5) },
    "m4": { title:"10 ДИЗАЙН ТРЕНДОВ КОТОРЫЕ УБЬЮТ СКУЧНЫЕ САЙТЫ", views:200000, authorName:"DesignPro", authorId:"mock_4", authorPhotoURL:"https://ui-avatars.com/api/?name=DP&background=111&color=fff&bold=true", subscribers:"320K", description:"Разбираем дизайн-тренды, которые делают интерфейсы живыми и запоминающимися.", videoUrl:null, thumbnailUrl:"https://picsum.photos/seed/design24/800/450", likes:9800, duration:"12:10", createdAt:new Date(Date.now()-86400000*1) },
    "m5": { title:"СТРИМ! ФИНАЛ ЧЕМПИОНАТА — СМОТРИМ ВМЕСТЕ", views:52000, authorName:"CyberPro", authorId:"mock_5", authorPhotoURL:"https://ui-avatars.com/api/?name=CP&background=ef4444&color=fff&bold=true", subscribers:"1.2M", description:"Финал главного турнира года! Болеем вместе!", videoUrl:null, thumbnailUrl:"https://picsum.photos/seed/stream1/800/450", likes:8900, duration:"LIVE", createdAt:new Date() },
    "m6": { title:"ПРОХОДИМ НОВУЮ RPG БЕЗ ЕДИНОГО УРОНА", views:340000, authorName:"NoHitRunner", authorId:"mock_6", authorPhotoURL:"https://ui-avatars.com/api/?name=NR&background=27272a&color=facc15&bold=true", subscribers:"780K", description:"Хардкорное прохождение новой RPG без получения урона. Каждый бой — искусство.", videoUrl:null, thumbnailUrl:"https://picsum.photos/seed/rpg1/800/450", likes:21000, duration:"45:00", createdAt:new Date(Date.now()-86400000*4) },
    "m7": { title:"ВСЕ МЕХАНИКИ НОВОГО ШУТЕРА ЗА 20 МИНУТ", views:120000, authorName:"AimLab", authorId:"mock_7", authorPhotoURL:"https://ui-avatars.com/api/?name=AL&background=111&color=fff&bold=true", subscribers:"560K", description:"Полный разбор механик нового шутера — от базовых до продвинутых.", videoUrl:null, thumbnailUrl:"https://picsum.photos/seed/shooter1/800/450", likes:7600, duration:"18:30", createdAt:new Date(Date.now()-86400000*6) },
};

const sidebarMock = [
    { id:'m2', title:"ПОДКАСТ: БУДУЩЕЕ ВЕБ-РАЗРАБОТКИ", author:"DevTalks", thumb:"https://picsum.photos/seed/web25/400/225", duration:"1:02:15", views:"450K" },
    { id:'m3', title:"СОБРАЛ СТУДИЮ ЗА 50 000₽", author:"StudioMaker", thumb:"https://picsum.photos/seed/studio/400/225", duration:"08:45", views:"890K" },
    { id:'m4', title:"10 ДИЗАЙН ТРЕНДОВ ЭТОГО ГОДА", author:"DesignPro", thumb:"https://picsum.photos/seed/design24/400/225", duration:"12:10", views:"200K" },
    { id:'m5', title:"СТРИМ! ФИНАЛ ЧЕМПИОНАТА", author:"CyberPro", thumb:"https://picsum.photos/seed/stream1/400/225", duration:"LIVE", views:"52K" },
    { id:'m6', title:"ПРОХОДИМ RPG БЕЗ УРОНА", author:"NoHitRunner", thumb:"https://picsum.photos/seed/rpg1/400/225", duration:"45:00", views:"340K" },
    { id:'m7', title:"ВСЕ МЕХАНИКИ НОВОГО ШУТЕРА", author:"AimLab", thumb:"https://picsum.photos/seed/shooter1/400/225", duration:"18:30", views:"120K" },
    { id:'m1', title:"ОБЗОР UNREAL ENGINE 6", author:"TechGuru", thumb:"https://picsum.photos/seed/ue6/400/225", duration:"14:20", views:"1.2M" },
];

// ============================================
// УТИЛИТЫ
// ============================================
function formatViews(n) {
    if (typeof n !== 'number') return n || '0';
    if (n >= 1000000) return (n/1000000).toFixed(1)+'M';
    if (n >= 1000) return (n/1000).toFixed(1)+'K';
    return n.toString();
}
function formatDate(ts) {
    if (!ts) return '';
    const d = ts instanceof Date ? ts : (ts.toDate ? ts.toDate() : new Date(ts));
    return d.toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' });
}
function timeAgo(ts) {
    if (!ts) return 'недавно';
    const d = ts instanceof Date ? ts : (ts.toDate ? ts.toDate() : new Date(ts));
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'только что';
    if (diff < 3600) return `${Math.floor(diff/60)} мин. назад`;
    if (diff < 86400) return `${Math.floor(diff/3600)} ч. назад`;
    if (diff < 604800) return `${Math.floor(diff/86400)} дн. назад`;
    return d.toLocaleDateString('ru-RU');
}

// ============================================
// САЙДБАР
// ============================================
function renderSidebar(currentId) {
    const sidebar = document.getElementById('sidebarRecommendations');
    if (!sidebar) return;
    sidebar.innerHTML = sidebarMock.filter(v => v.id !== currentId).map(v => `
        <a href="player.html?id=${v.id}" class="sidebar-card">
            <div class="sidebar-thumb">
                <img src="${v.thumb}" alt="${v.title}" loading="lazy">
                <span class="sidebar-duration">${v.duration}</span>
            </div>
            <div class="sidebar-info">
                <div class="sidebar-title">${v.title}</div>
                <div class="sidebar-author">${v.author}</div>
                <div class="sidebar-author">${v.views} просмотров</div>
            </div>
        </a>
    `).join('');
}

// ============================================
// КОММЕНТАРИИ
// ============================================
async function loadComments(videoId) {
    const list = document.getElementById('commentsList');
    const counter = document.getElementById('commCount');
    if (!list) return;

    // Моковые комментарии
    const mockComments = [
        { authorName:"Xander_Plays", authorPhotoURL:"https://ui-avatars.com/api/?name=XP&background=3b82f6&color=fff&bold=true", text:"Качество контента на уровне! ForVide — будущее видеохостинга 🔥", createdAt:new Date(Date.now()-3600000*2) },
        { authorName:"DesignQueen", authorPhotoURL:"https://ui-avatars.com/api/?name=DQ&background=ec4899&color=fff&bold=true", text:"Очень информативно. Подписалась и поставила лайк 👍", createdAt:new Date(Date.now()-3600000*5) },
        { authorName:"TechNerd2077", authorPhotoURL:"https://ui-avatars.com/api/?name=TN&background=8b5cf6&color=fff&bold=true", text:"Ждём продолжение! Хочется больше деталей 🔬", createdAt:new Date(Date.now()-86400000) },
    ];

    // Сначала показываем локальные комментарии
    const localComments = getComments(videoId);
    let allComments = [...localComments];

    // Пробуем Firestore
    try {
        const q = query(collection(db, 'videos', videoId, 'comments'), orderBy('createdAt','desc'), limit(50));
        const snap = await getDocs(q);
        const dbComments = [];
        snap.forEach(d => dbComments.push({ id:d.id, ...d.data() }));
        if (dbComments.length > 0) allComments = [...localComments, ...dbComments];
    } catch {}

    if (allComments.length === 0) allComments = mockComments;

    if (counter) counter.textContent = `(${allComments.length})`;
    list.innerHTML = allComments.map(c => `
        <div class="comment-item">
            <img src="${c.authorPhotoURL || c.avatar || 'https://ui-avatars.com/api/?name=U&background=111&color=fff'}" alt="" class="comment-avatar">
            <div class="comment-body">
                <div class="comment-header">
                    <span class="comment-author">${c.authorName || c.author || 'Аноним'}</span>
                    <span class="comment-time">${timeAgo(c.createdAt)}</span>
                </div>
                <p class="comment-text">${c.text}</p>
            </div>
        </div>
    `).join('');
}

// ============================================
// ГЛАВНАЯ ЛОГИКА ПЛЕЕРА
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('id');
    if (!videoId) { window.location.href = 'index.html'; return; }

    let videoData = null;

    // Пробуем Firestore
    try {
        const snap = await getDoc(doc(db, 'videos', videoId));
        if (snap.exists()) {
            videoData = { id: snap.id, ...snap.data() };
            await updateDoc(doc(db, 'videos', videoId), { views: increment(1) });
        }
    } catch {}

    // Fallback на моки
    if (!videoData) {
        videoData = mockVideos[videoId] ? { ...mockVideos[videoId], id: videoId } : { ...mockVideos['m1'], id: videoId };
    }

    document.title = `${videoData.title} | ForVide`;

    // Заполняем UI
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('videoTitle', videoData.title);
    set('videoViews', `${formatViews(videoData.views)} просмотров`);
    set('videoDate', `• ${formatDate(videoData.createdAt)}`);
    set('authorName', videoData.authorName);
    set('subsCount', `${videoData.subscribers || '0'} подписчиков`);
    set('descriptionText', videoData.description || '');
    set('likeCount', formatViews(videoData.likes || 0));

    const authorAvatarEl = document.getElementById('authorAvatar');
    if (authorAvatarEl) { authorAvatarEl.src = videoData.authorPhotoURL || ''; authorAvatarEl.alt = videoData.authorName; }

    // Ссылка на канал автора
    const authorBlock = document.querySelector('.author-block .author-info');
    if (authorBlock && videoData.authorId && !videoData.authorId.startsWith('mock_')) {
        authorBlock.style.cursor = 'pointer';
        authorBlock.onclick = () => window.location.href = `profile.html?uid=${videoData.authorId}`;
    }

    // Плеер
    const frameContainer = document.querySelector('.video-frame-container');
    if (frameContainer) {
        if (videoData.videoUrl) {
            frameContainer.innerHTML = `
                <video controls preload="metadata" poster="${videoData.thumbnailUrl || ''}" style="width:100%;height:100%;">
                    <source src="${videoData.videoUrl}" type="video/mp4">
                </video>`;
        } else {
            frameContainer.innerHTML = `
                <div style="width:100%;height:100%;background-image:url('${videoData.thumbnailUrl}');background-size:cover;background-position:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;">
                    <div style="position:absolute;inset:0;background:rgba(0,0,0,0.55);"></div>
                    <i class="ph-fill ph-play-circle" style="font-size:90px;color:var(--fv-mustard);position:relative;z-index:1;filter:drop-shadow(0 4px 16px rgba(0,0,0,0.4));"></i>
                    <span style="color:white;font-weight:800;font-size:12px;letter-spacing:2px;position:relative;z-index:1;background:rgba(0,0,0,0.5);padding:6px 16px;border-radius:20px;">ДЕМО • ФАЙЛ НЕ ЗАГРУЖЕН</span>
                </div>`;
        }
    }

    // Добавляем в историю (когда пользователь авторизован)
    const addHistory = () => {
        if (window.currentUser) {
            addToHistory({
                id: videoId,
                title: videoData.title,
                thumbnailUrl: videoData.thumbnailUrl,
                authorName: videoData.authorName,
                authorPhotoURL: videoData.authorPhotoURL,
                duration: videoData.duration,
                views: videoData.views,
            });
        }
    };
    setTimeout(addHistory, 3000); // добавляем через 3 секунды просмотра

    // ЛАЙК
    const likeBtn = document.getElementById('likeBtn');
    const likeCountEl = document.getElementById('likeCount');

    const updateLikeUI = (liked) => {
        likeBtn?.classList.toggle('active', liked);
        const icon = likeBtn?.querySelector('i');
        if (icon) icon.className = liked ? 'ph-fill ph-heart' : 'ph ph-heart';
        if (icon) icon.style.color = liked ? 'var(--fv-danger)' : '';
    };

    // Проверяем начальное состояние лайка
    if (window.currentUser) {
        updateLikeUI(isLiked(window.currentUser.uid, videoId));
    }

    // Слушаем изменение авторизации для обновления лайка
    import('./firebase-config.js').then(({ auth }) => {
        import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js").then(({ onAuthStateChanged }) => {
            onAuthStateChanged(auth, user => {
                if (user) updateLikeUI(isLiked(user.uid, videoId));
                else updateLikeUI(false);
            });
        });
    });

    if (likeBtn) {
        likeBtn.addEventListener('click', () => {
            if (!window.currentUser) {
                window.showToast('Войдите чтобы поставить лайк', 'info');
                window.openAuthModal?.();
                return;
            }
            const uid = window.currentUser.uid;
            const currentlyLiked = isLiked(uid, videoId);
            if (currentlyLiked) {
                removeFromLiked(uid, videoId);
                updateLikeUI(false);
                if (likeCountEl) likeCountEl.textContent = formatViews(Math.max(0, (videoData.likes||0) - 1));
                window.showToast('Лайк убран', 'info', 2000);
            } else {
                addToLiked(uid, {
                    id: videoId, title: videoData.title,
                    thumbnailUrl: videoData.thumbnailUrl, thumb: videoData.thumbnailUrl,
                    authorName: videoData.authorName, authorPhotoURL: videoData.authorPhotoURL,
                    duration: videoData.duration,
                });
                updateLikeUI(true);
                if (likeCountEl) likeCountEl.textContent = formatViews((videoData.likes||0) + 1);
                window.showToast('Добавлено в понравившееся ❤️', 'success', 2000);
            }
        });
    }

    // ПОДЕЛИТЬСЯ
    const shareBtn = [...document.querySelectorAll('.action-btn')].find(b => b.id === 'shareBtn' || b.innerHTML.includes('ПОДЕЛИТЬСЯ'));
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            try { await navigator.share({ title: videoData.title, url: window.location.href }); }
            catch { await navigator.clipboard.writeText(window.location.href); window.showToast('Ссылка скопирована 📋', 'success', 2000); }
        });
    }

    // СОХРАНИТЬ
    document.getElementById('saveBtn')?.addEventListener('click', () => {
        if (!window.currentUser) { window.openAuthModal?.(); return; }
        window.showToast('Видео сохранено в закладки 🔖', 'success', 2000);
    });

    // ЕЩЁ (описание)
    const showMoreBtn = document.querySelector('.show-more');
    const videoDesc = document.querySelector('.video-description');
    if (showMoreBtn && videoDesc) {
        showMoreBtn.addEventListener('click', () => {
            videoDesc.classList.toggle('expanded');
            showMoreBtn.textContent = videoDesc.classList.contains('expanded') ? 'СКРЫТЬ' : 'ЕЩЕ';
        });
    }

    // ПОДПИСКА
    const subscribeBtn = document.querySelector('.subscribe-btn');
    let subscribed = false;
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', () => {
            if (!window.currentUser) { window.openAuthModal?.(); return; }
            subscribed = !subscribed;
            subscribeBtn.textContent = subscribed ? '✓ ПОДПИСАН' : 'ПОДПИСАТЬСЯ';
            subscribeBtn.classList.toggle('subscribed', subscribed);
            if (subscribed) window.showToast(`Подписались на ${videoData.authorName}! 🔔`, 'success');
        });
    }

    // ОТПРАВКА КОММЕНТАРИЯ
    window.submitComment = async function() {
        const textarea = document.getElementById('commentTextInput');
        if (!textarea) return;
        const text = textarea.value.trim();
        if (!text) { window.showToast('Напишите комментарий', 'info'); return; }

        if (!window.currentUser) {
            window.showToast('Войдите чтобы комментировать', 'error');
            window.openAuthModal?.();
            return;
        }

        const userData = window.currentUserData;
        const postBtn = document.getElementById('postCommentBtn');
        if (postBtn) { postBtn.disabled = true; postBtn.textContent = '...'; }

        // Сохраняем локально
        const newComment = addComment(videoId, {
            text,
            authorName: userData?.displayName || 'Аноним',
            authorPhotoURL: userData?.photoURL || '',
            authorId: window.currentUser.uid,
        });

        // Пробуем Firestore
        try {
            await addDoc(collection(db, 'videos', videoId, 'comments'), {
                text,
                authorName: userData?.displayName || 'Аноним',
                authorPhotoURL: userData?.photoURL || '',
                authorId: window.currentUser.uid,
                createdAt: serverTimestamp()
            });
        } catch {}

        textarea.value = '';
        if (postBtn) { postBtn.disabled = false; postBtn.textContent = 'ОТПРАВИТЬ'; }
        window.showToast('Комментарий опубликован! 💬', 'success', 2000);

        // Вставляем в список без перезагрузки
        const list = document.getElementById('commentsList');
        if (list) {
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.style.animation = 'fadeInUp 0.3s ease';
            div.innerHTML = `
                <img src="${userData?.photoURL || 'https://ui-avatars.com/api/?name=U&background=111&color=fff'}" alt="" class="comment-avatar">
                <div class="comment-body">
                    <div class="comment-header">
                        <span class="comment-author">${userData?.displayName || 'Аноним'}</span>
                        <span class="comment-time">только что</span>
                    </div>
                    <p class="comment-text">${text}</p>
                </div>`;
            list.insertBefore(div, list.firstChild);
            const counter = document.getElementById('commCount');
            if (counter) {
                const n = parseInt(counter.textContent.replace(/\D/g,'') || '0');
                counter.textContent = `(${n+1})`;
            }
        }
    };

    renderSidebar(videoId);
    await loadComments(videoId);
});
