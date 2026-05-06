document.addEventListener("DOMContentLoaded", () => {
    const videoGrid = document.getElementById("video-grid");

    const videos = [
        { id: 1, title: "Новый трейлер: ForVide Originals", views: "1.2M", date: "1 час назад" },
        { id: 2, title: "Как загрузить свое первое видео через OBS", views: "45K", date: "3 часа назад" },
        { id: 3, title: "Топ 10 аниме этого весеннего сезона", views: "890K", date: "Вчера" },
        { id: 4, title: "Прямой эфир: Разбираем код ForVide", views: "12K", date: "Сейчас" },
        { id: 5, title: "Лучшие моменты из популярных сериалов", views: "2.5M", date: "2 дня назад" },
        { id: 6, title: "Интервью с создателями платформы", views: "300K", date: "Неделя назад" },
    ];

    function renderContent() {
        videoGrid.innerHTML = videos.map(video => `
            <div class="video-card">
                <div class="thumb-container">
                    <img src="https://picsum.photos/seed/${video.id + 50}/800/450" alt="Preview">
                    <span class="duration-tag">12:45</span>
                </div>
                <div class="video-details">
                    <img src="photo_5460840021544867928_w.jpg" class="creator-avatar" alt="User">
                    <div class="text-info">
                        <h3 class="video-title">${video.title}</h3>
                        <p class="video-meta-info">ForVide User • ${video.views} • ${video.date}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderContent();
});
