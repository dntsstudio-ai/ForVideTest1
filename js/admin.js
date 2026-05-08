// js/admin.js — Admin & Moderator system (LocalDB based with Firestore sync)
import { db } from './firebase-config.js';
import {
    doc, getDoc, updateDoc, collection, getDocs, query,
    where, addDoc, deleteDoc, orderBy, limit, setDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { saveUserProfile, getUserProfile } from './local-db.js';

// ============================================
// HELPERS
// ============================================
export async function getUser(uid) {
    try {
        const snap = await getDoc(doc(db,'users',uid));
        if (snap.exists()) return { id:snap.id, ...snap.data() };
    } catch {}
    return getUserProfile(uid);
}

export async function updateUser(uid, data) {
    try { await updateDoc(doc(db,'users',uid), data); } catch {}
    const existing = getUserProfile(uid) || {};
    saveUserProfile(uid, { ...existing, ...data });
}

export async function searchUsersByHandle(handleQuery) {
    const results = [];
    try {
        const snap = await getDocs(collection(db,'users'));
        snap.forEach(d => {
            const u = { id:d.id, ...d.data() };
            if (u.handle?.toLowerCase().includes(handleQuery.toLowerCase()) ||
                u.displayName?.toLowerCase().includes(handleQuery.toLowerCase())) {
                results.push(u);
            }
        });
    } catch {
        // LocalDB fallback — ищем по ключам
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('fv_user_')) {
                try {
                    const u = JSON.parse(localStorage.getItem(key));
                    if (u && (u.handle?.toLowerCase().includes(handleQuery.toLowerCase()) ||
                        u.displayName?.toLowerCase().includes(handleQuery.toLowerCase()))) {
                        results.push(u);
                    }
                } catch {}
            }
        }
    }
    return results.slice(0, 10);
}

// ============================================
// ROLES
// ============================================
export async function setRole(uid, role) {
    await updateUser(uid, { role });
    window.showToast?.(`Роль "${role}" выдана`, 'success');
}

export async function removeRole(uid) {
    await updateUser(uid, { role: 'viewer' });
    window.showToast?.('Роль снята', 'info');
}

// ============================================
// BANS
// ============================================
export async function banUser(uid, { duration, reason, deleteContent }) {
    const banData = {
        banned: true,
        banReason: reason || '',
        banUntil: duration === 'forever' ? null : new Date(Date.now() + duration * 3600000).toISOString(),
        bannedAt: new Date().toISOString()
    };
    await updateUser(uid, banData);

    if (deleteContent) {
        try {
            const q = query(collection(db,'videos'), where('authorId','==',uid));
            const snap = await getDocs(q);
            snap.forEach(async d => await deleteDoc(doc(db,'videos',d.id)));
        } catch {}
    }
    window.showToast?.('Пользователь забанен', 'info');
}

export async function unbanUser(uid) {
    await updateUser(uid, { banned: false, banReason: '', banUntil: null });
    window.showToast?.('Бан снят', 'success');
}

// ============================================
// MUTES
// ============================================
export async function muteUser(uid, { duration, reason }) {
    const muteData = {
        muted: true,
        muteReason: reason || '',
        muteUntil: duration === 'forever' ? null : new Date(Date.now() + duration * 3600000).toISOString()
    };
    await updateUser(uid, muteData);
    window.showToast?.('Пользователь замьючен', 'info');
}

export async function unmuteUser(uid) {
    await updateUser(uid, { muted: false, muteReason: '', muteUntil: null });
    window.showToast?.('Мут снят', 'success');
}

// ============================================
// REPORTS / COMPLAINTS
// ============================================
export async function submitReport({ reporterId, targetUid, targetVideoId, reason, type }) {
    const report = {
        reporterId, targetUid: targetUid||null, targetVideoId: targetVideoId||null,
        reason, type, status: 'pending', createdAt: new Date().toISOString()
    };
    try {
        await addDoc(collection(db,'reports'), report);
    } catch {}
    // LocalDB
    const reports = JSON.parse(localStorage.getItem('fv_reports')||'[]');
    reports.push({ ...report, id: Date.now().toString() });
    localStorage.setItem('fv_reports', JSON.stringify(reports));
    window.showToast?.('Жалоба отправлена', 'success');
}

export async function getReports(status = null) {
    let reports = [];
    try {
        const q = status
            ? query(collection(db,'reports'), where('status','==',status), orderBy('createdAt','desc'))
            : query(collection(db,'reports'), orderBy('createdAt','desc'));
        const snap = await getDocs(q);
        snap.forEach(d => reports.push({ id:d.id, ...d.data() }));
    } catch {}
    if (!reports.length) {
        reports = JSON.parse(localStorage.getItem('fv_reports')||'[]');
        if (status) reports = reports.filter(r => r.status === status);
    }
    return reports;
}

export async function updateReportStatus(reportId, status) {
    try { await updateDoc(doc(db,'reports',reportId), { status }); } catch {}
    const reports = JSON.parse(localStorage.getItem('fv_reports')||'[]');
    const idx = reports.findIndex(r => r.id === reportId);
    if (idx !== -1) { reports[idx].status = status; localStorage.setItem('fv_reports', JSON.stringify(reports)); }
}

// ============================================
// SITE STATS
// ============================================
export async function getSiteStats() {
    const stats = { totalUsers:0, totalVideos:0, totalAuthors:0, topVideos:[] };
    try {
        const usersSnap = await getDocs(collection(db,'users'));
        usersSnap.forEach(d => {
            stats.totalUsers++;
            if (d.data().role === 'author') stats.totalAuthors++;
        });
        const videosSnap = await getDocs(query(collection(db,'videos'), orderBy('views','desc'), limit(3)));
        videosSnap.forEach(d => { stats.totalVideos++; stats.topVideos.push({ id:d.id, ...d.data() }); });
    } catch {
        // LocalDB estimate
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k?.startsWith('fv_user_')) stats.totalUsers++;
        }
    }
    return stats;
}

// ============================================
// DELETE VIDEO
// ============================================
export async function deleteVideo(videoId) {
    try { await deleteDoc(doc(db,'videos',videoId)); } catch {}
    window.showToast?.('Видео удалено', 'info');
}

// ============================================
// WARNINGS
// ============================================
export async function warnUser(uid, reason) {
    const existing = await getUser(uid);
    const warnings = (existing?.warnings || []);
    warnings.push({ reason, date: new Date().toISOString() });
    await updateUser(uid, { warnings });
    window.showToast?.('Предупреждение выдано', 'info');
}
