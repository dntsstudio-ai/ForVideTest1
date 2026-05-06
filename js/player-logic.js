// js/player-logic.js
import { auth, db } from './firebase-config.js';
import {
    doc,
    getDoc,
    collection,
    addDoc,
    query,
    orderBy,
    getDocs,
    updateDoc,
    increment,
    serverTimestamp,
    limit,
    where
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ============================================
// МОКОВЫЕ ДАННЫЕ ДЛЯ ДЕМО
// ============================================
const mockVideoData = {
    "m1": {
        title: "ОБЗОР UNREAL ENGINE 6: ГРАФИКА НОВОГО ПОКОЛЕНИЯ",
        views: 1240500,
        authorName: "TechGuru",
        authorId: "mock_author_1",
        authorPhotoURL: "https://ui-avatars.com/api/?name=TG&background=111&color=facc15&bold=true",
        subscribers: "2.4 млн",
        description: "В этом видео мы детально разбираем все ключевые нововведения Unreal Engine 6 — нового стандарта для геймдева и кино. Lumen, Nanite, нейросетевые апскейлинг-технологии и многое другое. Смотрите до конца — в финале покажем сравнение с предыдущими версиями! Подписывайтесь на ForVide — здесь только качественный контент о технологиях.",
        videoUrl: null,
        thumbnailUrl: "https://picsum.photos/seed/ue6/800/450",
        likes: 48200,
        duration: "14:20",
        createdAt: new Date(Date.now() - 86400000 * 3)
    },
    "m5": {
        title: "СТРИМ! ФИНАЛ ЧЕМПИОНАТА — СМОТРИМ ВМЕСТЕ",
        views: 52000,
        authorName: "CyberPro",
        authorId: "mock_author_5",
        authorPhotoURL: "https://ui-avatars.com/api/?name=CP&background=ef4444&color=fff&bold=true",
        subscribers: "890K",
        description: "Финал главного турнира года! Комментируем, болеем, обсуждаем в чате. Это история — будь её частью!",
        videoUrl: null,
        thumbnailUrl: "https://picsum.photos/seed/stream1/800/450",
        likes: 8900,
        duration: "LIVE",
        createdAt: new Date()
    }
};

// Генерируем моковые данные для всех демо-видео
const allMockIds = ['m1','m2','m3','m4','m5','m6','m7'];
const genericTitles = [
    "ОБЗОР НОВОГО ДВИЖКА UNREAL ENGINE 6",
    "ПОДКАСТ: БУДУЩЕЕ ВЕБ-РАЗРАБОТКИ В 2025",
    "СОБРАЛ СТУДИЮ ЗА 50 000₽",
    "10 ДИЗАЙН ТРЕНДОВ ЭТОГО ГОДА",
    "СТРИМ! ФИНАЛ ЧЕМПИОНАТА",
    "ПРОХОДИМ НОВУЮ RPG БЕЗ УРОНА",
    "ВСЕ МЕХАНИКИ НОВОГО ШУТЕРА"
];

allMockIds.forEach((id, idx) => {
    if (!mockVideoData[id]) {
        mockVideoData[id] = {
            title: genericTitles[idx] || "ForVide Видео",
            views: Math.floor(Math.random() * 1000000),
            authorName: ["TechGuru","DevTalks","StudioMaker","DesignPro","CyberPro","NoHitRunner","AimLab"][idx],
            authorId: `mock_author_${idx}`,
            authorPhotoURL: `https://ui-avatars.com/api/?name=A${idx}&background=111&color=facc15&bold=true`,
            subscribers: Math.floor(Math.random() * 2000000).toLocaleString('ru') + " подписчиков",
            description: "Смотрите этот захватывающий ролик на ForVide — платформе для контент-мейкеров нового поколения. Подписывайтесь на канал чтобы не пропустить новые видео!",
            videoUrl: null,
            thumbnailUrl: `https://picsum.photos/seed/${id}/800/450`,
            likes: Math.floor(Math.random() * 50000),
            duration: ["14:20","1:02:15","08:45","12:10","LIVE","45:00","18:30"][idx],
            createdAt: new Date(Date.now() - 86400000 * (idx + 1))
        };
    }
});

// ============================================
// УТИЛИТЫ
// ============================================
function formatViews(n) {
    if (typeof n !== 'number') return n || '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}

function formatDate(ts) {
    if (!ts) return '';
    const date = ts instanceof Date ? ts : (ts.toDate ? ts.toDate() : new Date(ts));
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function timeAgo(ts) {
    if (!ts) return 'недавно';
    const date = ts instanceof Date ? ts : (ts.toDate ? ts.toDate() : new Date(ts));
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return 'только что';
    if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} дн. назад`;
    return date.toLocaleDateString('ru-RU');
}

// ============================================
// РЕКОМЕНДАЦИИ В САЙДБАРЕ
// ============================================
const sidebarMock = [
    { id: 'm2', title: "ПОДКАСТ: БУДУЩЕЕ ВЕБ-РАЗРАБОТКИ В 2025", author: "DevTalks", thumb: "https://picsum.photos/seed/web25/400/225", duration: "1:02:15", views: "450K" },
    { id: 'm3', title: "СОБРАЛ СТУДИЮ ЗА 50 000₽", author: "StudioMaker", thumb: "https://picsum.photos/seed/studio/400/225", duration: "08:45", views: "890K" },
    { id: 'm4', title: "10 ДИЗАЙН ТРЕНДОВ ЭТОГО ГОДА", author: "DesignPro", thumb: "https://picsum.photos/seed/design24/400/225", duration: "12:10", views: "200K" },
    { id: 'm6', title: "ПРОХОДИМ НОВУЮ RPG БЕЗ УРОНА", author: "NoHitRunner", thumb: "https://picsum.photos/seed/rpg1/400/225", duration: "45:00", views: "340K" },
    { id: 'm7', title: "ВСЕ МЕХАНИКИ НОВОГО ШУТЕРА", author: "AimLab", thumb: "https://picsum.photos/seed/shooter1/400/225", duration: "18:30", views: "120K" },
];

function renderSidebar(currentId) {
    const sidebar = document.getElementById('sidebarRecommendations');
    if (!sidebar) return;
    const filtered = sidebarMock.filter(v => v.id !== currentId);
    sidebar.innerHTML = filtered.map(v => `
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

    list.innerHTML = '<div style="color:var(--fv-gray-400);font-size:13px;font-weight:600;padding:10px 0;">Загрузка комментариев...</div>';

    // Моковые комментарии для демо
    const mockComments = [
        { author: "Xander_Plays", avatar: "https://ui-avatars.com/api/?name=XP&background=3b82f6&color=fff&bold=true", text: "Качество контента на уровне! ForVide — будущее видеохостинга 🔥", time: new Date(Date.now() - 3600000 * 2) },
        { author: "DesignQueen", avatar: "https://ui-avatars.com/api/?name=DQ&background=ec4899&color=fff&bold=true", text: "Очень информативно. Подписалась и поставила лайк 👍", time: new Date(Date.now() - 3600000 * 5) },
        { author: "TechNerd2077", avatar: "https://ui-avatars.com/api/?name=TN&background=8b5cf6&color=fff&bold=true", text: "Ждём продолжение! Хочется больше деталей про Nanite", time: new Date(Date.now() - 86400000) },
    ];

    try {
        const q = query(
            collection(db, 'comments'),
            where('videoId', '==', videoId),
            orderBy('createdAt', 'desc'),
            limit(50)
        );
        const snap = await getDocs(q);
        let comments = [];
        snap.forEach(d => comments.push({ id: d.id, ...d.data() }));

        if (comments.length === 0) comments = mockComments;

        if (counter) counter.textContent = `(${comments.length})`;
        list.innerHTML = comments.map(c => `
            <div class="comment-item">
                <img src="${c.avatar || c.authorPhotoURL || 'https://ui-avatars.com/api/?name=U&background=111&color=fff'}" alt="" class="comment-avatar">
                <div class="comment-body">
                    <div class="comment-header">
                        <span class="comment-author">${c.author || c.authorName || 'Аноним'}</span>
                        <span class="comment-time">${timeAgo(c.time || c.createdAt)}</span>
                    </div>
                    <p class="comment-text">${c.text}</p>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.warn('Комментарии из демо:', err.message);
        if (counter) counter.textContent = `(${mockComments.length})`;
        list.innerHTML = mockComments.map(c => `
            <div class="comment-item">
                <img src="${c.avatar}" alt="" class="comment-avatar">
                <div class="comment-body">
                    <div class="comment-header">
                        <span class="comment-author">${c.author}</span>
                        <span class="comment-time">${timeAgo(c.time)}</span>
                    </div>
                    <p class="comment-text">${c.text}</p>
                </div>
            </div>
        `).join('');
    }
}

// ============================================
// ОСНОВНАЯ ЛОГИКА ПЛЕЕРА
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('id');

    if (!videoId) {
        window.location.href = 'index.html';
        return;
    }

    // Загружаем данные видео
    let videoData = null;

    try {
        const docRef = doc(db, 'videos', videoId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            videoData = { id: snap.id, ...snap.data() };
            // Инкрементируем просмотры
            await updateDoc(docRef, { views: increment(1) });
        }
    } catch (err) {
        console.warn('Используем демо-данные для плеера:', err.message);
    }

    // Фолбек на моковые данные
    if (!videoData) {
        videoData = mockVideoData[videoId] || mockVideoData['m1'];
        videoData.id = videoId;
    }

    // Обновляем заголовок страницы
    document.title = `${videoData.title} | ForVide`;

    // Заполняем UI
    const titleEl = document.getElementById('videoTitle');
    const viewsEl = document.getElementById('videoViews');
    const dateEl = document.getElementById('videoDate');
    const authorNameEl = document.getElementById('authorName');
    const subsCountEl = document.getElementById('subsCount');
    const authorAvatarEl = document.getElementById('authorAvatar');
    const descTextEl = document.getElementById('descriptionText');
    const likeCountEl = document.getElementById('likeCount');

    if (titleEl) titleEl.textContent = videoData.title;
    if (viewsEl) viewsEl.textContent = `${formatViews(videoData.views)} просмотров`;
    if (dateEl) dateEl.textContent = `• ${formatDate(videoData.createdAt)}`;
    if (authorNameEl) authorNameEl.textContent = videoData.authorName;
    if (subsCountEl) subsCountEl.textContent = `${videoData.subscribers || '0'} подписчиков`;
    if (authorAvatarEl) {
        authorAvatarEl.src = videoData.authorPhotoURL || videoData.avatar || '';
        authorAvatarEl.alt = videoData.authorName;
    }
    if (descTextEl) descTextEl.textContent = videoData.description || '';
    if (likeCountEl) likeCountEl.textContent = formatViews(videoData.likes || 0);

    // Плеер: видео или заглушка
    const frameContainer = document.querySelector('.video-frame-container');
    if (frameContainer) {
        if (videoData.videoUrl) {
            frameContainer.innerHTML = `
                <video controls preload="metadata" poster="${videoData.thumbnailUrl || ''}">
                    <source src="${videoData.videoUrl}" type="video/mp4">
                    Ваш браузер не поддерживает видео.
                </video>
            `;
        } else {
            frameContainer.innerHTML = `
                <div class="video-placeholder" style="background-image:url('${videoData.thumbnailUrl}');background-size:cover;background-position:center;">
                    <div style="background:rgba(0,0,0,0.6);width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;">
                        <i class="ph-fill ph-play-circle" style="font-size:80px;color:var(--fv-mustard);"></i>
                        <span style="color:white;font-weight:800;font-size:13px;letter-spacing:1px;">ДЕМО-РЕЖИМ • ВИДЕОФАЙЛ НЕ ЗАГРУЖЕН</span>
                    </div>
                </div>
            `;
        }
    }

    // Лайк
    const likeBtn = document.getElementById('likeBtn');
    let liked = false;
    if (likeBtn) {
        likeBtn.addEventListener('click', () => {
            liked = !liked;
            likeBtn.classList.toggle('active', liked);
            const icon = likeBtn.querySelector('i');
            if (icon) icon.className = liked ? 'ph-fill ph-heart text-danger' : 'ph ph-heart';
            if (likeCountEl) {
                const base = videoData.likes || 0;
                likeCountEl.textContent = formatViews(liked ? base + 1 : base);
            }
            if (liked) window.showToast('Лайк поставлен! ❤️', 'success', 2000);
        });
    }

    // Поделиться
    const shareBtn = document.querySelector('.action-btn:has(.ph-share-network)') ||
                     [...document.querySelectorAll('.action-btn')].find(b => b.innerHTML.includes('ПОДЕЛИТЬСЯ'));
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            try {
                await navigator.share({ title: videoData.title, url: window.location.href });
            } catch {
                await navigator.clipboard.writeText(window.location.href);
                window.showToast('Ссылка скопирована! 📋', 'success', 2000);
            }
        });
    }

    // Кнопка "Ещё" в описании
    const showMoreBtn = document.querySelector('.show-more');
    const videoDesc = document.querySelector('.video-description');
    if (showMoreBtn && videoDesc) {
        showMoreBtn.addEventListener('click', () => {
            videoDesc.classList.toggle('expanded');
            showMoreBtn.textContent = videoDesc.classList.contains('expanded') ? 'СКРЫТЬ' : 'ЕЩЕ';
        });
    }

    // Комментарии
    window.submitComment = async function() {
        const textarea = document.getElementById('commentTextInput');
        if (!textarea) return;
        const text = textarea.value.trim();
        if (!text) return;

        if (!window.currentUser) {
            window.showToast('Войдите, чтобы оставить комментарий', 'error');
            return;
        }

        const userData = window.currentUserData;
        const commentData = {
            text,
            authorName: userData?.displayName || 'Аноним',
            authorPhotoURL: userData?.photoURL || '',
            authorId: window.currentUser.uid,
            createdAt: serverTimestamp()
        };

        try {
            await addDoc(collection(db, 'comments'), commentData);
            textarea.value = '';
            window.showToast('Комментарий опубликован! 💬', 'success', 2000);

            // Добавляем комментарий в список без перезагрузки
            const list = document.getElementById('commentsList');
            if (list) {
                const newComment = document.createElement('div');
                newComment.className = 'comment-item';
                newComment.innerHTML = `
                    <img src="${userData?.photoURL || ''}" alt="" class="comment-avatar">
                    <div class="comment-body">
                        <div class="comment-header">
                            <span class="comment-author">${userData?.displayName || 'Аноним'}</span>
                            <span class="comment-time">только что</span>
                        </div>
                        <p class="comment-text">${text}</p>
                    </div>
                `;
                list.insertBefore(newComment, list.firstChild);

                const counter = document.getElementById('commCount');
                if (counter) {
                    const current = parseInt(counter.textContent.replace(/\D/g, '') || '0');
                    counter.textContent = `(${current + 1})`;
                }
            }
        } catch (err) {
            console.error('Ошибка публикации комментария:', err);
            window.showToast('Ошибка при публикации', 'error');
        }
    };

    // Подписка
    const subscribeBtn = document.querySelector('.subscribe-btn');
    let subscribed = false;
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', () => {
            if (!window.currentUser) {
                window.showToast('Войдите для подписки', 'error');
                window.openAuthModal?.();
                return;
            }
            subscribed = !subscribed;
            subscribeBtn.textContent = subscribed ? 'ПОДПИСАН ✓' : 'ПОДПИСАТЬСЯ';
            subscribeBtn.classList.toggle('subscribed', subscribed);
            if (subscribed) window.showToast(`Вы подписались на ${videoData.authorName}! 🔔`, 'success');
        });
    }

    // Сайдбар с рекомендациями
    renderSidebar(videoId);

    // Загрузка комментариев
    await loadComments(videoId);
});
