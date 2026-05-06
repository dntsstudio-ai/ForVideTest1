document.addEventListener("DOMContentLoaded", () => {
    const videoGrid = document.getElementById("video-grid");

    // Функция для генерации случайного времени
    function getRandomDuration() {
        const min = Math.floor(Math.random() * 59);
        const sec = Math.floor(Math.random() * 59);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    function createCard(title, author, views) {
        const randomId = Math.floor(Math.random() * 1000);
        const imgUrl = `https://picsum.photos/seed/${randomId}/600/337`; 
        
        // В качестве аватарки пока используем заглушку из твоих картинок
        const avatarUrl = "photo_5460840021544867928_w.jpg"; 
        const duration = getRandomDuration();

        return `
            <div class="video-card">
                <div class="thumbnail-box">
                    <img src="${imgUrl}" alt="Превью">
                    <span class="video-duration">${duration}</span>
                </div>
                <div class="video-info">
                    <img src="${avatarUrl}" alt="Аватар" class="author-avatar">
                    <div class="video-text-content">
                        <div class="video-title">${title}</div>
                        <div class="video-meta">${author}</div>
                        <div class="video-meta">${views} • 2 дня назад</div>
                    </div>
                </div>
            </div>
        `;
    }

    let html = "";
    for (let i = 1; i <= 16; i++) {
        html += createCard(
            `Очень интересное видео с длинным названием, которое должно занимать ровно две строки #${i}`, 
            "ForVide Creator", 
            `${Math.floor(Math.random() * 500) + 10} тыс. просмотров`
        );
    }

    videoGrid.innerHTML = html;
});
