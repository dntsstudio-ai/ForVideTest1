// js/feed-generator.js

// Имитация "Агента", который собирает тренды
const mockAgentDB = {
    trending: [
        { id: "v1", title: "ОБЗОР НОВОГО ДВИЖКА UNREAL ENGINE 6", author: "TechGuru", avatar: "https://ui-avatars.com/api/?name=Tech+Guru&background=111&color=facc15", views: "1.2M", duration: "14:20", thumb: "https://picsum.photos/seed/v1/800/450" },
        { id: "v2", title: "ПОДКАСТ: БУДУЩЕЕ WEB 3.0", author: "CryptoTalks", avatar: "https://ui-avatars.com/api/?name=C+T&background=27272a&color=fff", views: "450K", duration: "1:02:15", thumb: "https://picsum.photos/seed/v2/800/450" },
        { id: "v3", title: "СОБРАЛ СТУДИЮ ЗА 1000$ | FORVIDE", author: "StudioMaker", avatar: "https://ui-avatars.com/api/?name=S+M&background=facc15&color=000", views: "890K", duration: "08:45", thumb: "https://picsum.photos/seed/v3/800/450" },
        { id: "v4", title: "10 ДИЗАЙН ТРЕНДОВ ЭТОГО ГОДА", author: "DesignPro", avatar: "https://ui-avatars.com/api/?name=D+P&background=111&color=fff", views: "200K", duration: "12:10", thumb: "https://picsum.photos/seed/v4/800/450" }
    ],
    gaming: [
        { id: "v5", title: "СТРИМ ИДЕТ! ФИНАЛ ТУРНИРА", author: "CyberPro", avatar: "https://ui-avatars.com/api/?name=C+P&background=ef4444&color=fff", views: "50K Зрителей", duration: "LIVE", thumb: "https://picsum.photos/seed/v5/800/450" },
        { id: "v6", title: "ПРОХОДИМ НОВУЮ RPG БЕЗ УРОНА", author: "NoHitRunner", avatar: "https://ui-avatars.com/api/?name=N+H&background=27272a&color=facc15", views: "340K", duration: "45:00", thumb: "https://picsum.photos/seed/v6/800/450" },
        { id: "v7", title: "ОБЗОР МЕХАНИК В ШУТЕРЕ", author: "AimBot", avatar: "https://ui-avatars.com/api/?name=A+B&background=111&color=fff", views: "120K", duration: "18:30", thumb: "https://picsum.photos/seed/v7/800/450" }
    ]
};

// Функция создания HTML-разметки для одной карточки
function createVideoCard(video) {
    return `
        <a href="player.html?id=${video.id}" class="video-card">
            <div class="thumb-wrapper">
                <img src="${video.thumb}" alt="Thumbnail">
                <span class="video-duration ${video.duration === 'LIVE' ? 'text-danger' : ''}">${video.duration}</span>
            </div>
            <div class="video-details">
                <img src="${video.avatar}" alt="${video.author}" class="author-avatar">
                <div class="info-content">
                    <h3 class="video-title">${video.title}</h3>
                    <span class="author-name">${video.author}</span>
                    <span class="video-stats">${video.views} просмотров • 2 часа назад</span>
                </div>
            </div>
        </a>
    `;
}

// Рендерим сетки при загрузке
document.addEventListener('DOMContentLoaded', () => {
    const trendingGrid = document.getElementById('trendingGrid');
    const gamingGrid = document.getElementById('gamingGrid');

    if (trendingGrid) {
        trendingGrid.innerHTML = mockAgentDB.trending.map(createVideoCard).join('');
    }
    
    if (gamingGrid) {
        gamingGrid.innerHTML = mockAgentDB.gaming.map(createVideoCard).join('');
    }
});
