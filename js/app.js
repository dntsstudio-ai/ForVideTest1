// Импорт конфига (пока просто для проверки связи)
import { auth, db } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", () => {
    const videoGrid = document.getElementById("video-grid");

    // Тестовые данные для заполнения главной страницы
    // Используем photo_5460840021544867928_w.jpg как дефолтную аватарку канала (Идея №3)
    const dummyVideos = [
        {
            title: "Как создать свой видеохостинг с нуля? | Часть 1",
            author: "DevChannel",
            views: "12 тыс. просмотров",
            time: "2 дня назад",
            thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80",
            duration: "14:20"
        },
        {
            title: "Лучшие киберпанк фильмы десятилетия",
            author: "KinoReview",
            views: "450 тыс. просмотров",
            time: "1 неделю назад",
            thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            duration: "25:11"
        },
        {
            title: "Геймплей нового шутера - ОБТ",
            author: "GameStream",
            views: "89 тыс. просмотров",
            time: "3 часа назад",
            thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
            duration: "4:05:10"
        },
        {
            title: "Красивые анимации на CSS и JS",
            author: "WebDesign Pro",
            views: "5 тыс. просмотров",
            time: "1 месяц назад",
            thumbnail: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&w=600&q=80",
            duration: "08:15"
        }
    ];

    // Функция отрисовки видео (дублируем несколько раз для заполнения сетки)
    function renderVideos() {
        videoGrid.innerHTML = "";
        // Отрисуем 12 карточек для наглядности (3 раза повторяем массив)
        for(let i=0; i<3; i++) {
            dummyVideos.forEach(video => {
                const card = document.createElement("div");
                card.className = "video-card";
                card.innerHTML = `
                    <div class="thumbnail">
                        <img src="${video.thumbnail}" alt="Превью">
                        <span class="duration">${video.duration}</span>
                    </div>
                    <div class="video-info">
                        <img src="photo_5460840021544867928_w.jpg" alt="Avatar" class="channel-avatar">
                        <div class="video-texts">
                            <h3 class="video-title">${video.title}</h3>
                            <p class="channel-name">${video.author}</p>
                            <p class="video-stats">${video.views} • ${video.time}</p>
                        </div>
                    </div>
                `;
                videoGrid.appendChild(card);
            });
        }
    }

    renderVideos();
});
