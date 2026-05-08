// js/local-db.js — Обходняк для Firestore через localStorage
// Хранит профили, историю, лайки, комментарии локально

const PREFIX = 'fv_';

function lsGet(key) {
    try { return JSON.parse(localStorage.getItem(PREFIX + key)); } catch { return null; }
}

function lsSet(key, val) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); return true; } catch { return false; }
}

function lsDel(key) {
    try { localStorage.removeItem(PREFIX + key); } catch {}
}

// ============================================
// ПРОФИЛИ ПОЛЬЗОВАТЕЛЕЙ
// ============================================
export function saveUserProfile(uid, data) {
    const existing = lsGet(`user_${uid}`) || {};
    lsSet(`user_${uid}`, { ...existing, ...data, uid, updatedAt: Date.now() });
}

export function getUserProfile(uid) {
    return lsGet(`user_${uid}`);
}

// ============================================
// МУЛЬТИ-АККАУНТЫ
// ============================================
export function getLinkedAccounts() {
    return lsGet('linked_accounts') || [];
}

export function addLinkedAccount(uid, displayName, photoURL, email) {
    const accounts = getLinkedAccounts();
    const exists = accounts.find(a => a.uid === uid);
    if (!exists) {
        accounts.push({ uid, displayName, photoURL, email, addedAt: Date.now() });
        lsSet('linked_accounts', accounts);
    }
    return accounts;
}

export function removeLinkedAccount(uid) {
    const accounts = getLinkedAccounts().filter(a => a.uid !== uid);
    lsSet('linked_accounts', accounts);
}

export function setActiveAccount(uid) {
    lsSet('active_account', uid);
}

export function getActiveAccount() {
    return lsGet('active_account');
}

// ============================================
// ИСТОРИЯ ПРОСМОТРОВ
// ============================================
export function addToHistory(videoData) {
    const uid = lsGet('active_account');
    if (!uid) return;
    const key = `history_${uid}`;
    const history = lsGet(key) || [];
    // Удаляем дубликаты
    const filtered = history.filter(v => v.id !== videoData.id);
    filtered.unshift({ ...videoData, watchedAt: Date.now() });
    // Максимум 100 записей
    lsSet(key, filtered.slice(0, 100));
}

export function getHistory(uid) {
    return lsGet(`history_${uid}`) || [];
}

export function clearHistory(uid) {
    lsDel(`history_${uid}`);
}

// ============================================
// ПОНРАВИВШЕЕСЯ
// ============================================
export function addToLiked(uid, videoData) {
    const key = `liked_${uid}`;
    const liked = lsGet(key) || [];
    const exists = liked.find(v => v.id === videoData.id);
    if (!exists) {
        liked.unshift({ ...videoData, likedAt: Date.now() });
        lsSet(key, liked);
        return true;
    }
    return false;
}

export function removeFromLiked(uid, videoId) {
    const key = `liked_${uid}`;
    const liked = (lsGet(key) || []).filter(v => v.id !== videoId);
    lsSet(key, liked);
}

export function isLiked(uid, videoId) {
    return !!(lsGet(`liked_${uid}`) || []).find(v => v.id === videoId);
}

export function getLiked(uid) {
    return lsGet(`liked_${uid}`) || [];
}

// ============================================
// КОММЕНТАРИИ (локальное хранилище)
// ============================================
export function addComment(videoId, comment) {
    const key = `comments_${videoId}`;
    const comments = lsGet(key) || [];
    const newComment = {
        id: Date.now().toString(),
        ...comment,
        createdAt: Date.now()
    };
    comments.unshift(newComment);
    lsSet(key, comments);
    return newComment;
}

export function getComments(videoId) {
    return lsGet(`comments_${videoId}`) || [];
}

// ============================================
// НАСТРОЙКИ ПОЛЬЗОВАТЕЛЯ
// ============================================
export function getSettings(uid) {
    return lsGet(`settings_${uid}`) || {
        theme: 'light',
        notifications: true,
        autoplay: true,
        quality: 'auto',
        language: 'ru'
    };
}

export function saveSettings(uid, settings) {
    lsSet(`settings_${uid}`, settings);
}

// ============================================
// ПОДПИСКИ
// ============================================
export function subscribe(uid, channelId) {
    const key = `subs_${uid}`;
    const subs = lsGet(key) || [];
    if (!subs.includes(channelId)) {
        subs.push(channelId);
        lsSet(key, subs);
        return true;
    }
    return false;
}

export function unsubscribe(uid, channelId) {
    const key = `subs_${uid}`;
    lsSet(key, (lsGet(key) || []).filter(id => id !== channelId));
}

export function isSubscribed(uid, channelId) {
    return (lsGet(`subs_${uid}`) || []).includes(channelId);
}

export function getSubscriptions(uid) {
    return lsGet(`subs_${uid}`) || [];
}
