document.addEventListener("DOMContentLoaded", () => {
    const trailersShelf = document.getElementById("trailers-shelf");
    const moviesShelf = document.getElementById("movies-shelf");

    const mockData = [
        { title: "Грань Будущего: Режиссерская версия", author: "NeoStudio", img: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop" },
        { title: "Пустошь: Эпизод 1", author: "IndieFilmz", img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop" },
        { title: "Неоновый дождь - Официальный Трейлер", author: "ForVide Originals", img: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=600&auto=format&fit=crop" },
        { title: "Заброшенный город. Документалка", author: "UrbanExplorer", img: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=600&auto=format&fit=crop" },
        { title: "Космос внутри нас", author: "SciFi Channel", img: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=600&auto=format&fit=crop" }
    ];

    function createCinematicCard(video) {
        return `
            <div class="cinematic-card" onclick="alert('Переход к плееру видео: ${video.title}')">
                <img src="${video.img}" alt="${video.title}">
                <div class="cinematic-overlay">
                    <h3 class="cine-title">${video.title}</h3>
                    <p class="cine-author">@${video.author}</p>
                </div>
            </div>
        `;
    }

    // Заполняем ленты
    let htmlContent = "";
    mockData.forEach(video => htmlContent += createCinematicCard(video));
    
    // Дублируем для объема
    trailersShelf.innerHTML = htmlContent + htmlContent;
    moviesShelf.innerHTML = [...mockData].reverse().map(v => createCinematicCard(v)).join('') + htmlContent;
});
