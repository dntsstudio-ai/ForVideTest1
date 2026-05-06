// js/player-logic.js
import { auth, db } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Получаем ID видео из URL
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('id');

    if (!videoId) {
        window.location.href = 'index.html'; // Если ID нет, кидаем на главную
        return;
    }

    // 2. Имитация запроса к БД (Firestore)
    // В будущем здесь будет: await getDoc(doc(db, "videos", videoId))
    const mockData = {
        title: "ОБЗОР НОВОГО ДВИЖКА UNREAL ENGINE 6",
        views: "1 240 500",
        author: "TechGuru",
        subs: "2.4 млн",
        description: "В этом видео мы разберем ключевые особенности нового движка и посмотрим на графику следующего поколения. Не забудьте подписаться на ForVide!",
        avatar: "https://ui-avatars.com/api/?name=Tech+Guru&background=111&color=facc15"
    };

    // 3. Заполняем страницу данными
    document.getElementById('videoTitle').innerText = mockData.title;
    document.getElementById('videoViews').innerText = `${mockData.views} просмотров`;
    document.getElementById('authorName').innerText = mockData.author;
    document.getElementById('subsCount').innerText = `${mockData.subs} подписчиков`;
    document.getElementById('authorAvatar').src = mockData.avatar;
    document.getElementById('descriptionText').innerText = mockData.description;

    // 4. Логика лайка
    const likeBtn = document.getElementById('likeBtn');
    likeBtn.addEventListener('click', () => {
        likeBtn.classList.toggle('active');
        const icon = likeBtn.querySelector('i');
        if (likeBtn.classList.contains('active')) {
            icon.className = 'ph-fill ph-heart text-danger';
        } else {
            icon.className = 'ph ph-heart';
        }
    });
});
