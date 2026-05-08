// js/theme.js — Theme + Logo management
const LOGO_MAP = {
    light: 'main/icons/logo_light.jpg',
    dark:  'main/icons/logo_dark.jpg',
    custom:'main/icons/logo_inv.jpg'
};

export function applyTheme(theme, customVars = {}) {
    document.documentElement.setAttribute('data-theme', theme);
    // Обновляем логотип
    document.querySelectorAll('.main-logo').forEach(img => {
        img.src = LOGO_MAP[theme] || LOGO_MAP.light;
    });
    // Кастомные CSS переменные
    if (theme === 'custom') {
        const root = document.documentElement;
        if (customVars.bg)     root.style.setProperty('--custom-bg', customVars.bg);
        if (customVars.surface)root.style.setProperty('--custom-surface', customVars.surface);
        if (customVars.border) root.style.setProperty('--custom-border', customVars.border);
        if (customVars.text)   root.style.setProperty('--custom-text', customVars.text);
        if (customVars.muted)  root.style.setProperty('--custom-muted', customVars.muted);
        if (customVars.accent) root.style.setProperty('--custom-accent', customVars.accent);
        if (customVars.accentDark) root.style.setProperty('--custom-accent-dark', customVars.accentDark);
    }
    localStorage.setItem('fv_theme', theme);
    if (customVars && Object.keys(customVars).length) localStorage.setItem('fv_custom_vars', JSON.stringify(customVars));
}

export function loadSavedTheme() {
    const theme = localStorage.getItem('fv_theme') || 'light';
    const customVars = JSON.parse(localStorage.getItem('fv_custom_vars') || '{}');
    applyTheme(theme, customVars);
}

// Автоматически применяем при загрузке
document.addEventListener('DOMContentLoaded', loadSavedTheme);
