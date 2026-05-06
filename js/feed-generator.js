// js/feed-generator.js
import { db } from './firebase-config.js';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Моковые данные для фолбека (пока нет реального контента в БД)
const mockVideos = {
    trends: [
        { id: "m1", title: "ОБЗОР UNREAL ENGINE 6: ГРАФИКА НОВОГО ПОКОЛЕНИЯ", author: "TechGuru", avatar: "https://ui-avatars.com/api/?name=TG&background=111&color=facc15&bold=true", views: "1.2M", duration: "14:20", thumb: "https://picsum.photos/seed/ue6/800/450", category: "trends" },
        { id: "m2", title: "ПОДКАСТ: БУДУЩЕЕ ВЕБ-РАЗРАБОТКИ В 2025", author: "DevTalks", avatar: "https://ui-avatars.com/api/?name=DT&background=27272a&color=fff&bold=true", views: "450K", duration: "1:02:15", thumb: "https://picsum.photos/seed/web25/800/450", category: "trends" },
        { id: "m3", title: "СОБРАЛ СТУДИЮ ЗА 50 000₽ | ПОЛНЫЙ ОБЗОР", author: "StudioMaker", avatar: "https://ui-avatars.com/api/?name=SM&background=facc15&color=000&bold=true", views: "890K", duration: "08:45", thumb: "https://picsum.photos/seed/studio/800/450", category: "trends" },
        { id: "m4", title: "10 ДИЗАЙН ТРЕНДОВ КОТОРЫЕ УБЬЮТ СКУЧНЫЕ САЙТЫ", author: "DesignPro", avatar: "https://ui-avatars.com/api/?name=DP&background=111&color=fff&bold=true", views: "200K", duration: "12:10", thumb: "https://picsum.photos/seed/design24/800/450", category: "trends" }
    ],
    gaming: [
        { id: "m5", title: "СТРИМ! ФИНАЛ ЧЕМПИОНАТА — СМОТРИМ ВМЕСТЕ", author: "CyberPro", avatar: "https://ui-avatars.com/api/?name=CP&background=ef4444&color=fff&bold=true", views: "52K Зрителей", duration: "LIVE", thumb: "https://picsum.photos/seed/stream1/800/450", category: "gaming" },
        { id: "m6", title: "ПРОХОДИМ НОВУЮ RPG БЕЗ ЕДИНОГО УРОНА", author: "NoHitRunner", avatar: "https://ui-avatars.com/api/?name=NR&background=27272a&color=facc15&bold=true", views: "340K", duration: "45:00", thumb: "https://picsum.photos/seed/rpg1/800/450", category: "gaming" },
        { id: "m7", title: "ВСЕ МЕХАНИКИ НОВОГО ШУТЕРА ЗА 20 МИНУТ", author: "AimLab", avatar: "https://ui-avatars.com/api/?name=AL&background=111&color=fff&bold=true", views: "120K", duration: "18:30", thumb: "https://picsum.photos/seed/shooter1/800/450", category: "gaming" }
    ]
};

// ============================================
// СОЗДАНИЕ HTML КАРТОЧКИ
// ============================================
function createVideoCard(video, delay = 0) {
    const isLive = video.duration === 'LIVE';
    const viewsText = typeof video.views === 'number'
        ? formatViews(video.views)
        : video.views;

    return `
        <a href="player.html?id=${video.id}" class="video-card" style="animation-delay:${delay}s">
            <div class="thumb-wrapper">
                <img src="${video.thumbnailUrl || video.thumb}" alt="${video.title}" loading="lazy">
                <div class="thumb-overlay">
                    <div class="play-icon-overlay"><i class="ph-fill ph-play"></i></div>
                </div>
                ${isLive
                    ? `<span class="live-badge"><span class="live-dot"></span> LIVE</span>`
                    : `<span class="video-duration">${video.duration}</span>`
                }
            </div>
            <div class="video-details">
                <img src="${video.authorAvatar || video.avatar}" alt="${video.authorName || video.author}" class="author-avatar" loading="lazy">
                <div class="info-content">
                    <h3 class="video-title">${video.title}</h3>
                    <span class="author-name">${video.authorName || video.author}</span>
                    <span class="video-stats">${viewsText} просмотров • ${formatDate(video.createdAt)}</span>
                </div>
            </div>
        </a>
    `;
}

function createSkeletonCard() {
    return `
        <div class="card-skeleton">
            <div class="skel-thumb skeleton"></div>
            <div style="display:flex;gap:10px;padding:0 2px;">
                <div class="skeleton" style="width:40px;height:40px;border-radius:50%;flex-shrink:0;"></div>
                <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
                    <div class="skel-row skeleton w-80"></div>
                    <div class="skel-row skeleton w-60"></div>
                    <div class="skel-row skeleton w-40"></div>
                </div>
            </div>
        </div>
    `;
}

function formatViews(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return n.toString();
}

function formatDate(ts) {
    if (!ts) return 'недавно';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} дн. назад`;
    return date.toLocaleDateString('ru-RU');
}

// ============================================
// ЗАГРУЗКА ВИДЕО ИЗ FIRESTORE
// ============================================
async function loadVideosFromDB(category, gridId, mockFallback) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    // Показываем скелетоны
    grid.innerHTML = Array(4).fill(createSkeletonCard()).join('');

    try {
        const q = query(
            collection(db, 'videos'),
            where('category', '==', category),
            ,
            limit(8)
        );
        const snap = await getDocs(q);

        let videos = [];
        snap.forEach(doc => {
            videos.push({ id: doc.id, ...doc.data() });
        });

        // Если в БД пусто — используем моковые данные
        if (videos.length === 0) {
            videos = mockFallback;
        }

        grid.innerHTML = videos.map((v, i) => createVideoCard(v, i * 0.06)).join('');

    } catch (err) {
        console.warn('Firestore недоступен, используем демо-данные:', err.message);
        grid.innerHTML = mockFallback.map((v, i) => createVideoCard(v, i * 0.06)).join('');
    }
}

// ============================================
// ПОИСК
// ============================================
async function performSearch(query_str) {
    const trendingGrid = document.getElementById('trendingGrid');
    const gamingGrid = document.getElementById('gamingGrid');

    if (!query_str) {
        // Восстанавливаем нормальную ленту
        loadFeed();
        return;
    }

    const resultSection = document.querySelector('.feed-section');
    if (resultSection) {
        const header = resultSection.querySelector('.section-header h2');
        if (header) header.innerHTML = `<i class="ph-fill ph-magnifying-glass"></i> РЕЗУЛЬТАТЫ: "${query_str.toUpperCase()}"`;
    }

    if (trendingGrid) {
        const allMock = [...mockVideos.trends, ...mockVideos.gaming].filter(v =>
            v.title.toLowerCase().includes(query_str.toLowerCase()) ||
            (v.author || '').toLowerCase().includes(query_str.toLowerCase())
        );
        trendingGrid.innerHTML = allMock.length > 0
            ? allMock.map((v, i) => createVideoCard(v, i * 0.06)).join('')
            : '<p style="color:var(--fv-gray-400);font-weight:600;padding:20px;">Ничего не найдено 🤔</p>';
    }

    if (gamingGrid) {
        const gamingSection = gamingGrid.closest('.feed-section');
        if (gamingSection) gamingSection.style.display = 'none';
    }
}

function loadFeed() {
    loadVideosFromDB('trends', 'trendingGrid', mockVideos.trends);
    loadVideosFromDB('gaming', 'gamingGrid', mockVideos.gaming);
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем параметр поиска
    const params = new URLSearchParams(window.location.search);
    const searchQ = params.get('search');

    if (searchQ) {
        performSearch(searchQ);
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = searchQ;
    } else {
        loadFeed();
    }

    // Поиск из строки
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const q = searchInput.value.trim();
            if (q) performSearch(q);
        });
    }
});
