// js/ui-controller.js

// ============================================
// TOAST СИСТЕМА
// ============================================
function createToastContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toast-container';
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    return c;
}

window.showToast = function(message, type = 'info', duration = 3500) {
    const container = createToastContainer();
    const icons = { success: 'ph-check-circle', error: 'ph-x-circle', info: 'ph-info' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="ph-fill ${icons[type] || icons.info}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

// ============================================
// ОСНОВНОЙ UI CONTROLLER
// ============================================
document.addEventListener('DOMContentLoaded', () => {

    // --- БОКОВОЕ МЕНЮ (КАПЛЯ) ---
    const openMenuBtn = document.getElementById('openMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const sideMenu = document.getElementById('sideMenu');

    let overlay = document.getElementById('dropOverlay');
    if (!overlay && sideMenu) {
        overlay = document.createElement('div');
        overlay.id = 'dropOverlay';
        overlay.className = 'drop-overlay';
        document.body.appendChild(overlay);
    }

    window.toggleMenu = function(forceState) {
        if (!sideMenu) return;
        const isOpen = sideMenu.classList.contains('open');
        const shouldOpen = forceState !== undefined ? forceState : !isOpen;

        if (shouldOpen) {
            sideMenu.classList.add('open');
            if (overlay) {
                overlay.style.display = 'block';
                requestAnimationFrame(() => overlay.style.opacity = '1');
            }
            document.body.style.overflow = 'hidden';
        } else {
            sideMenu.classList.remove('open');
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => { overlay.style.display = 'none'; }, 350);
            }
            document.body.style.overflow = '';
        }
    };

    if (openMenuBtn) openMenuBtn.addEventListener('click', () => window.toggleMenu(true));
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', () => window.toggleMenu(false));
    if (overlay) overlay.addEventListener('click', () => window.toggleMenu(false));

    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.toggleMenu(false);
            const authModal = document.getElementById('authModal');
            if (authModal) authModal.style.display = 'none';
        }
    });

    // --- МОДАЛЬНОЕ ОКНО АВТОРИЗАЦИИ ---
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:2000; display:none; justify-content:center; align-items:center; padding:20px; backdrop-filter:blur(8px);';

        window.openAuthModal = () => {
            authModal.style.display = 'flex';
            window.toggleMenu(false);
        };

        const closeAuthBtn = authModal.querySelector('.close-modal');
        if (closeAuthBtn) {
            closeAuthBtn.addEventListener('click', () => {
                authModal.style.display = 'none';
            });
        }

        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) authModal.style.display = 'none';
        });
    }

    // --- ПОИСК С ДЕБАУНСОМ ---
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                const q = searchInput.value.trim();
                if (q.length > 2) {
                    console.log('🔍 Поиск:', q);
                    // Здесь будет реальный поиск по Firestore
                }
            }, 400);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const q = searchInput.value.trim();
                if (q) window.location.href = `index.html?search=${encodeURIComponent(q)}`;
            }
        });
    }

    // --- АНИМАЦИЯ ПОЯВЛЕНИЯ ЭЛЕМЕНТОВ ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                entry.target.style.animationDelay = `${i * 0.05}s`;
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.video-card, .feed-section').forEach(el => observer.observe(el));

    // --- ПЛАВНЫЙ СКРОЛЛ ДЛЯ НАВИГАЦИИ ---
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
});
