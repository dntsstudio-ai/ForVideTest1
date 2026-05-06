document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("video-grid");
    
    // Данные
    const data = [
        { id: 1, title: "Первое крутое видео на ForVide" },
        { id: 2, title: "Трейлер нового проекта" },
        { id: 3, title: "Как пользоваться сайтом: гайд" },
        { id: 4, title: "Обзор функционала" },
        { id: 5, title: "Тестовый контент для проверки сетки" },
        { id: 6, title: "Еще одно видео" }
    ];

    grid.innerHTML = data.map(item => `
        <div class="video-card">
            <img src="https://picsum.photos/seed/${item.id}/800/450" alt="Preview">
            <div class="video-info">
                <div class="avatar"></div>
                <div>
                    <div class="title">${item.title}</div>
                    <div class="meta">ForVide User • 10 тыс. просмотров</div>
                </div>
            </div>
        </div>
    `).join('');
});
