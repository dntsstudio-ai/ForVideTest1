document.addEventListener("DOMContentLoaded", () => {
    const videoGrid = document.getElementById("video-grid");

    // Функция для создания ровной карточки
    function createCard(title, author, views) {
        // Используем случайные серые картинки для превью, чтобы оценить сетку
        const randomId = Math.floor(Math.random() * 1000);
        const imgUrl = `https://picsum.photos/seed/${randomId}/600/337`; 

        return `
            <div class="video-card">
                <div class="thumbnail-box">
                    <img src="${imgUrl}" alt="Превью">
                </div>
                <div class="video-info">
                    <div class="video-title">${title}</div>
                    <div class="video-meta">${author} • ${views}</div>
                </div>
            </div>
        `;
    }

    // Генерируем 16 карточек для наглядности ровной сетки
    let html = "";
    for (let i = 1; i <= 16; i++) {
        html += createCard(
            `Тестовый видеоролик #${i} с длинным названием`, 
            "ForVide User", 
            `${Math.floor(Math.random() * 100)} тыс. просмотров`
        );
    }

    videoGrid.innerHTML = html;
});
