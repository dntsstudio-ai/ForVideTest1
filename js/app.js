document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('bento-container');
    
    // Данные. Первое видео - главное.
    const videos = [
        { id: 41, title: "FUTURE IS NOW", meta: "PREMIERE", isHero: true },
        { id: 42, title: "CYBER CITY", meta: "TRENDING", isHero: false },
        { id: 43, title: "NEON GLOW", meta: "4K 60FPS", isHero: false },
        { id: 44, title: "UI DESIGN", meta: "TUTORIAL", isHero: false },
        { id: 45, title: "GEOMETRY", meta: "ART", isHero: false }
    ];

    grid.innerHTML = videos.map(video => `
        <div class="video-tile ${video.isHero ? 'hero-tile' : ''}">
            <!-- Картинки меняются на лету -->
            <img src="https://picsum.photos/seed/${video.id}/${video.isHero ? '1200/800' : '600/400'}" alt="Thumb">
            <div class="tile-info">
                <h2>${video.title}</h2>
                <p>${video.meta}</p>
            </div>
        </div>
    `).join('');
});
