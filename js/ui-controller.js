// js/ui-controller.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("UI Controller загружен");

    // --- УПРАВЛЕНИЕ ЖЕЛТОЙ КАПЛЕЙ (МЕНЮ) ---
    const openMenuBtn = document.getElementById('openMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const sideMenu = document.getElementById('sideMenu');
    // Создаем overlay для затемнения фона (если его нет в HTML, добавим динамически)
    let overlay = document.getElementById('dropOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'dropOverlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:999; display:none; opacity:0; transition:opacity 0.3s;';
        document.body.appendChild(overlay);
    }

    const toggleMenu = (forceState) => {
        const isOpen = sideMenu.classList.contains('open');
        const newState = forceState !== undefined ? forceState : !isOpen;
        
        if (newState) {
            sideMenu.classList.add('open');
            overlay.style.display = 'block';
            setTimeout(() => overlay.style.opacity = '1', 10);
            document.body.style.overflow = 'hidden'; // Блокируем скролл
        } else {
            sideMenu.classList.remove('open');
            overlay.style.opacity = '0';
            setTimeout(() => overlay.style.display = 'none', 300);
            document.body.style.overflow = '';
        }
    };

    if (openMenuBtn) openMenuBtn.addEventListener('click', () => toggleMenu(true));
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', () => toggleMenu(false));
    if (overlay) overlay.addEventListener('click', () => toggleMenu(false));

    // --- МОДАЛЬНОЕ ОКНО АВТОРИЗАЦИИ ---
    // (Пока просто UI, логику Firebase прикрутим позже)
    const authModal = document.getElementById('authModal');
    // Добавим скрытие/показ, если модалка есть в DOM
    if (authModal) {
        const closeAuthBtn = authModal.querySelector('.close-modal');
        authModal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:2000; display:none; justify-content:center; align-items:center;';
        
        window.openAuthModal = () => {
            authModal.style.display = 'flex';
            toggleMenu(false); // Закрываем каплю, если открыта
        };
        
        closeAuthBtn.addEventListener('click', () => authModal.style.display = 'none');
    }
});
