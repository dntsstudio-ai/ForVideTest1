// js/feed-generator.js
import { db } from './firebase-config.js';
import {
    collection, query, where, orderBy, limit, getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const mockVideos = {
    trends: [
        { id:"m1", title:"ОБЗОР UNREAL ENGINE 6: ГРАФИКА НОВОГО ПОКОЛЕНИЯ", author:"TechGuru", authorAvatar:"https://ui-avatars.com/api/?name=TG&background=111&color=facc15&bold=true", views:"1.2M", duration:"14:20", thumbnailUrl:"https://picsum.photos/seed/ue6/800/450" },
        { id:"m2", title:"ПОДКАСТ: БУДУЩЕЕ ВЕБ-РАЗРАБОТКИ В 2025", author:"DevTalks", authorAvatar:"https://ui-avatars.com/api/?name=DT&background=27272a&color=fff&bold=true", views:"450K", duration:"1:02:15", thumbnailUrl:"https://picsum.photos/seed/web25/800/450" },
        { id:"m3", title:"СОБРАЛ СТУДИЮ ЗА 50 000₽ | ПОЛНЫЙ ОБЗОР", author:"StudioMaker", authorAvatar:"https://ui-avatars.com/api/?name=SM&background=facc15&color=000&bold=true", views:"890K", duration:"08:45", thumbnailUrl:"https://picsum.photos/seed/studio/800/450" },
        { id:"m4", title:"10 ДИЗАЙН ТРЕНДОВ КОТОРЫЕ УБЬЮТ СКУЧНЫЕ САЙТЫ", author:"DesignPro", authorAvatar:"https://ui-avatars.com/api/?name=DP&background=111&color=fff&bold=true", views:"200K", duration:"12:10", thumbnailUrl:"https://picsum.photos/seed/design24/800/450" },
    ],
    gaming: [
        { id:"m5", title:"СТРИМ! ФИНАЛ ЧЕМПИОНАТА — СМОТРИМ ВМЕСТЕ", author:"CyberPro", authorAvatar:"https://ui-avatars.com/api/?name=CP&background=ef4444&color=fff&bold=true", views:"52K", duration:"LIVE", thumbnailUrl:"https://picsum.photos/seed/stream1/800/450" },
        { id:"m6", title:"ПРОХОДИМ НОВУЮ RPG БЕЗ ЕДИНОГО УРОНА", author:"NoHitRunner", authorAvatar:"https://ui-avatars.com/api/?name=NR&background=27272a&color=facc15&bold=true", views:"340K", duration:"45:00", thumbnailUrl:"https://picsum.photos/seed/rpg1/800/450" },
        { id:"m7", title:"ВСЕ МЕХАНИКИ НОВОГО ШУТЕРА ЗА 20 МИНУТ", author:"AimLab", authorAvatar:"https://ui-avatars.com/api/?name=AL&background=111&color=fff&bold=true", views:"120K", duration:"18:30", thumbnailUrl:"https://picsum.photos/seed/shooter1/800/450" },
    ]
};

function formatViews(n) {
    if (typeof n === 'string') return n;
    if (n >= 1000000) return (n/1000000).toFixed(1)+'M';
    if (n >= 1000) return (n/1000).toFixed(0)+'K';
    return String(n);
}

function formatDate(ts) {
    if (!ts) return 'недавно';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(diff/60)} мин. назад`;
    if (diff < 86400) return `${Math.floor(diff/3600)} ч. назад`;
    if (diff < 604800) return `${Math.floor(diff/86400)} дн. назад`;
    return date.toLocaleDateString('ru-RU');
}

function createVideoCard(v, delay=0) {
    const isLive = v.duration === 'LIVE';
    return `
        <a href="player.html?id=${v.id}" class="video-card" style="animation-delay:${delay}s">
            <div class="thumb-wrapper">
                <img src="${v.thumbnailUrl||v.thumb}" alt="${v.title}" loading="lazy">
                <div class="thumb-overlay"><div class="play-icon-overlay"><i class="ph-fill ph-play"></i></div></div>
                ${isLive
                    ? `<span class="live-badge"><span class="live-dot"></span> LIVE</span>`
                    : `<span class="video-duration">${v.duration||''}</span>`}
            </div>
            <div class="video-details">
                <img src="${v.authorAvatar||v.avatar||'https://ui-avatars.com/api/?name=A&background=111&color=fff'}" alt="" class="author-avatar" loading="lazy">
                <div class="info-content">
                    <h3 class="video-title">${v.title}</h3>
                    <span class="author-name">${v.authorName||v.author||''}</span>
                    <span class="video-stats">${formatViews(v.views)} просмотров · ${formatDate(v.createdAt)}</span>
                </div>
            </div>
        </a>`;
}

function createSkeleton() {
    return `<div class="card-skeleton">
        <div class="skel-thumb skeleton"></div>
        <div style="display:flex;gap:10px;padding:0 2px;">
            <div class="skeleton" style="width:40px;height:40px;border-radius:50%;flex-shrink:0;"></div>
            <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
                <div class="skel-row skeleton w-80"></div>
                <div class="skel-row skeleton w-60"></div>
                <div class="skel-row skeleton w-40"></div>
            </div>
        </div>
    </div>`;
}

async function loadVideosFromDB(category, gridId, fallback) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = Array(4).fill(createSkeleton()).join('');
    try {
        const q = query(collection(db,'videos'), where('category','==',category), orderBy('createdAt','desc'), limit(8));
        const snap = await getDocs(q);
        let videos = [];
        snap.forEach(d => videos.push({ id:d.id, ...d.data() }));
        if (videos.length === 0) videos = fallback;
        grid.innerHTML = videos.map((v,i) => createVideoCard(v, i*0.06)).join('');
    } catch {
        grid.innerHTML = fallback.map((v,i) => createVideoCard(v, i*0.06)).join('');
    }
}

async function performSearch(searchQ) {
    const trendingGrid = document.getElementById('trendingGrid');
    const gamingGrid = document.getElementById('gamingGrid');
    const gamingSection = gamingGrid?.closest('.feed-section');

    if (!searchQ) { loadFeed(); return; }

    const header = document.querySelector('.feed-section .section-header h2');
    if (header) header.innerHTML = `<i class="ph-fill ph-magnifying-glass"></i> ПОИСК: "${searchQ.toUpperCase()}"`;
    if (gamingSection) gamingSection.style.display = 'none';

    if (trendingGrid) {
        // Поиск по локальным мокам
        const allMock = [...mockVideos.trends, ...mockVideos.gaming];
        const localResults = allMock.filter(v =>
            v.title.toLowerCase().includes(searchQ.toLowerCase()) ||
            (v.author||'').toLowerCase().includes(searchQ.toLowerCase())
        );

        // Пробуем Firestore
        let dbResults = [];
        try {
            const snap = await getDocs(collection(db,'videos'));
            snap.forEach(d => {
                const v = { id:d.id, ...d.data() };
                if (v.title?.toLowerCase().includes(searchQ.toLowerCase()) ||
                    v.authorName?.toLowerCase().includes(searchQ.toLowerCase())) {
                    dbResults.push(v);
                }
            });
        } catch {}

        const results = dbResults.length > 0 ? [...dbResults, ...localResults] : localResults;
        trendingGrid.innerHTML = results.length > 0
            ? results.map((v,i) => createVideoCard(v, i*0.06)).join('')
            : `<div style="padding:40px;text-align:center;color:var(--fv-gray-400);font-weight:700;grid-column:1/-1;">
                <i class="ph ph-magnifying-glass" style="font-size:48px;display:block;margin-bottom:16px;opacity:0.4;"></i>
                Ничего не найдено по запросу «${searchQ}»
               </div>`;
    }
}

function loadFeed() {
    loadVideosFromDB('trends', 'trendingGrid', mockVideos.trends);
    loadVideosFromDB('gaming', 'gamingGrid', mockVideos.gaming);
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const searchQ = params.get('search');
    if (searchQ) {
        const input = document.getElementById('searchInput');
        if (input) input.value = searchQ;
        performSearch(searchQ);
    } else {
        loadFeed();
    }

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const q = searchInput.value.trim();
            if (q) window.location.href = `index.html?search=${encodeURIComponent(q)}`;
        });
        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const q = searchInput.value.trim();
                if (q) window.location.href = `index.html?search=${encodeURIComponent(q)}`;
            }
        });
    }
});
