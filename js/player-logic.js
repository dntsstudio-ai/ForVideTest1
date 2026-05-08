// js/player-logic.js
import { auth, db } from './firebase-config.js';
import {
    doc, getDoc, collection, addDoc, query, orderBy,
    getDocs, updateDoc, increment, serverTimestamp, limit, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { addToHistory, addToLiked, removeFromLiked, isLiked, addComment, getComments } from './local-db.js';

// ============================================
// MOCK DATA
// ============================================
const MOCKS = {
    "m1":{ title:"ОБЗОР UNREAL ENGINE 6: ГРАФИКА НОВОГО ПОКОЛЕНИЯ", views:1240500, authorName:"TechGuru", authorId:"mock_1", authorPhotoURL:"https://ui-avatars.com/api/?name=TG&background=111&color=facc15&bold=true", subscribers:"2.4 млн", description:"В этом видео мы детально разбираем все нововведения Unreal Engine 6 — нового стандарта геймдева и кино.", videoUrl:null, thumbnailUrl:"https://picsum.photos/seed/ue6/800/450", likes:48200, duration:"14:20", createdAt:new Date(Date.now()-86400000*3) },
    "m2":{ title:"ПОДКАСТ: БУДУЩЕЕ ВЕБ-РАЗРАБОТКИ В 2025", views:450000, authorName:"DevTalks", authorId:"mock_2", authorPhotoURL:"https://ui-avatars.com/api/?name=DT&background=27272a&color=fff&bold=true", subscribers:"890K", description:"Обсуждаем тренды веб-разработки, новые фреймворки и что ждёт индустрию.", videoUrl:null, thumbnailUrl:"https://picsum.photos/seed/web25/800/450", likes:12400, duration:"1:02:15", createdAt:new Date(Date.now()-86400000*2) },
    "m3":{ title:"СОБРАЛ СТУДИЮ ЗА 50 000₽ | ПОЛНЫЙ ОБЗОР", views:890000, authorName:"StudioMaker", authorId:"mock_3", authorPhotoURL:"https://ui-avatars.com/api/?name=SM&background=facc15&color=000&bold=true", subscribers:"450K", description:"Полный гайд по бюджетной домашней студии.", videoUrl:null, thumbnailUrl:"https://picsum.photos/seed/studio/800/450", likes:33000, duration:"08:45", createdAt:new Date(Date.now()-86400000*5) },
    "m4":{ title:"10 ДИЗАЙН ТРЕНДОВ КОТОРЫЕ УБЬЮТ СКУЧНЫЕ САЙТЫ", views:200000, authorName:"DesignPro", authorId:"mock_4", authorPhotoURL:"https://ui-avatars.com/api/?name=DP&background=111&color=fff&bold=true", subscribers:"320K", description:"Разбираем дизайн-тренды, которые делают интерфейсы живыми.", videoUrl:null, thumbnailUrl:"https://picsum.photos/seed/design24/800/450", likes:9800, duration:"12:10", createdAt:new Date(Date.now()-86400000) },
    "m5":{ title:"СТРИМ! ФИНАЛ ЧЕМПИОНАТА — СМОТРИМ ВМЕСТЕ", views:52000, authorName:"CyberPro", authorId:"mock_5", authorPhotoURL:"https://ui-avatars.com/api/?name=CP&background=ef4444&color=fff&bold=true", subscribers:"1.2M", description:"Финал главного турнира года!", videoUrl:null, thumbnailUrl:"https://picsum.photos/seed/stream1/800/450", likes:8900, duration:"LIVE", createdAt:new Date() },
    "m6":{ title:"ПРОХОДИМ НОВУЮ RPG БЕЗ ЕДИНОГО УРОНА", views:340000, authorName:"NoHitRunner", authorId:"mock_6", authorPhotoURL:"https://ui-avatars.com/api/?name=NR&background=27272a&color=facc15&bold=true", subscribers:"780K", description:"Хардкорное прохождение новой RPG без урона.", videoUrl:null, thumbnailUrl:"https://picsum.photos/seed/rpg1/800/450", likes:21000, duration:"45:00", createdAt:new Date(Date.now()-86400000*4) },
    "m7":{ title:"ВСЕ МЕХАНИКИ НОВОГО ШУТЕРА ЗА 20 МИНУТ", views:120000, authorName:"AimLab", authorId:"mock_7", authorPhotoURL:"https://ui-avatars.com/api/?name=AL&background=111&color=fff&bold=true", subscribers:"560K", description:"Полный разбор механик нового шутера.", videoUrl:null, thumbnailUrl:"https://picsum.photos/seed/shooter1/800/450", likes:7600, duration:"18:30", createdAt:new Date(Date.now()-86400000*6) },
};

const SIDEBAR = [
    { id:'m2', title:"ПОДКАСТ: БУДУЩЕЕ ВЕБ-РАЗРАБОТКИ", author:"DevTalks", thumb:"https://picsum.photos/seed/web25/400/225", duration:"1:02:15", views:"450K" },
    { id:'m3', title:"СОБРАЛ СТУДИЮ ЗА 50 000₽", author:"StudioMaker", thumb:"https://picsum.photos/seed/studio/400/225", duration:"08:45", views:"890K" },
    { id:'m4', title:"10 ДИЗАЙН ТРЕНДОВ", author:"DesignPro", thumb:"https://picsum.photos/seed/design24/400/225", duration:"12:10", views:"200K" },
    { id:'m5', title:"СТРИМ! ФИНАЛ ЧЕМПИОНАТА", author:"CyberPro", thumb:"https://picsum.photos/seed/stream1/400/225", duration:"LIVE", views:"52K" },
    { id:'m6', title:"RPG БЕЗ УРОНА", author:"NoHitRunner", thumb:"https://picsum.photos/seed/rpg1/400/225", duration:"45:00", views:"340K" },
    { id:'m1', title:"ОБЗОР UNREAL ENGINE 6", author:"TechGuru", thumb:"https://picsum.photos/seed/ue6/400/225", duration:"14:20", views:"1.2M" },
    { id:'m7', title:"ВСЕ МЕХАНИКИ ШУТЕРА", author:"AimLab", thumb:"https://picsum.photos/seed/shooter1/400/225", duration:"18:30", views:"120K" },
];

// ============================================
// UTILS
// ============================================
const fv = n => typeof n!=='number'?n||'0':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);
const fd = ts => { if(!ts) return ''; const d=ts instanceof Date?ts:(ts.toDate?ts.toDate():new Date(ts)); return d.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}); };
const ago = ts => { if(!ts) return 'недавно'; const d=ts instanceof Date?ts:(ts.toDate?ts.toDate():new Date(ts)); const s=(Date.now()-d.getTime())/1000; if(s<60) return 'только что'; if(s<3600) return `${Math.floor(s/60)} мин. назад`; if(s<86400) return `${Math.floor(s/3600)} ч. назад`; if(s<604800) return `${Math.floor(s/86400)} дн. назад`; return d.toLocaleDateString('ru-RU'); };

// ============================================
// SIDEBAR
// ============================================
function renderSidebar(currentId) {
    const el = document.getElementById('sidebarRecommendations');
    if(!el) return;
    el.innerHTML = SIDEBAR.filter(v=>v.id!==currentId).map(v=>`
        <a href="player.html?id=${v.id}" class="sidebar-card">
            <div class="sidebar-thumb">
                <img src="${v.thumb}" loading="lazy">
                <span class="sidebar-duration">${v.duration}</span>
            </div>
            <div class="sidebar-info">
                <div class="sidebar-title">${v.title}</div>
                <div class="sidebar-author">${v.author}</div>
                <div class="sidebar-author">${v.views} просмотров</div>
            </div>
        </a>`).join('');
}

// ============================================
// COMMENTS — with likes, edit, delete
// ============================================
let currentVideoId = null;
let currentUserGlobal = null;

function renderComment(c, currentUser) {
    const isOwn = currentUser && currentUser.uid === c.authorId;
    const likes = c.likes || 0;
    const likedBy = c.likedBy || [];
    const hasLiked = currentUser && likedBy.includes(currentUser.uid);

    return `
        <div class="comment-item" data-cid="${c.id}" data-vid="${c.videoId||''}">
            <img src="${c.authorPhotoURL||'https://ui-avatars.com/api/?name=U&background=111&color=fff'}"
                 alt="" class="comment-avatar"
                 style="cursor:${c.authorId&&!c.authorId.startsWith('mock_')?'pointer':'default'}"
                 onclick="${c.authorId&&!c.authorId.startsWith('mock_')?`window.location.href='profile.html?uid=${c.authorId}'`:''}"
                 title="${c.authorId&&!c.authorId.startsWith('mock_')?'Перейти к профилю':''}">
            <div class="comment-body" style="flex:1;">
                <div class="comment-header">
                    <span class="comment-author"
                          style="cursor:${c.authorId&&!c.authorId.startsWith('mock_')?'pointer':'default'}"
                          onclick="${c.authorId&&!c.authorId.startsWith('mock_')?`window.location.href='profile.html?uid=${c.authorId}'`:''}"
                    >${c.authorName||'Аноним'}</span>
                    <span class="comment-time">${ago(c.createdAt)}</span>
                </div>
                <div id="comment-text-${c.id}">
                    <p class="comment-text">${c.text}</p>
                </div>
                <div class="comment-actions" style="display:flex;align-items:center;gap:12px;margin-top:8px;">
                    <button class="cmt-like-btn" data-cid="${c.id}" data-liked="${hasLiked?'1':'0'}"
                        style="background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:4px;font-size:12px;font-weight:800;color:${hasLiked?'var(--fv-danger)':'var(--fv-text-muted)'};font-family:inherit;padding:0;transition:color 0.2s;">
                        <i class="${hasLiked?'ph-fill':'ph'} ph-heart" style="font-size:14px;"></i>
                        <span class="cmt-like-count">${likes||''}</span>
                    </button>
                    ${isOwn?`
                        <button class="cmt-edit-btn" data-cid="${c.id}" data-text="${encodeURIComponent(c.text)}"
                            style="background:none;border:none;cursor:pointer;font-size:12px;font-weight:800;color:var(--fv-text-muted);font-family:inherit;padding:0;">
                            Изменить
                        </button>
                        <button class="cmt-del-btn" data-cid="${c.id}"
                            style="background:none;border:none;cursor:pointer;font-size:12px;font-weight:800;color:var(--fv-danger);font-family:inherit;padding:0;">
                            Удалить
                        </button>
                    `:''}
                </div>
            </div>
        </div>`;
}

async function loadComments(videoId) {
    const list = document.getElementById('commentsList');
    const counter = document.getElementById('commCount');
    if(!list) return;

    const mockComments = [
        { id:'mc1', authorName:"Xander_Plays", authorPhotoURL:"https://ui-avatars.com/api/?name=XP&background=3b82f6&color=fff&bold=true", text:"Качество контента на уровне! ForVide 🔥", createdAt:new Date(Date.now()-3600000*2), likes:12, likedBy:[] },
        { id:'mc2', authorName:"DesignQueen", authorPhotoURL:"https://ui-avatars.com/api/?name=DQ&background=ec4899&color=fff&bold=true", text:"Очень информативно. Подписалась 👍", createdAt:new Date(Date.now()-3600000*5), likes:7, likedBy:[] },
        { id:'mc3', authorName:"TechNerd2077", authorPhotoURL:"https://ui-avatars.com/api/?name=TN&background=8b5cf6&color=fff&bold=true", text:"Ждём продолжение! 🔬", createdAt:new Date(Date.now()-86400000), likes:3, likedBy:[] },
    ];

    const localComments = getComments(videoId);
    let allComments = [...localComments];

    try {
        const q = query(collection(db,'videos',videoId,'comments'), orderBy('createdAt','desc'), limit(50));
        const snap = await getDocs(q);
        const dbComments = [];
        snap.forEach(d => dbComments.push({ id:d.id, videoId, ...d.data() }));
        if(dbComments.length > 0) allComments = [...localComments, ...dbComments];
    } catch {}

    if(allComments.length === 0) allComments = mockComments;
    if(counter) counter.textContent = `(${allComments.length})`;

    list.innerHTML = allComments.map(c => renderComment(c, currentUserGlobal)).join('');
    bindCommentActions(videoId);
}

function bindCommentActions(videoId) {
    const list = document.getElementById('commentsList');
    if(!list) return;

    // LIKE comment
    list.querySelectorAll('.cmt-like-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if(!currentUserGlobal){ window.openAuthModal?.(); return; }
            const cid = btn.dataset.cid;
            const liked = btn.dataset.liked === '1';
            const icon = btn.querySelector('i');
            const countEl = btn.querySelector('.cmt-like-count');
            let count = parseInt(countEl?.textContent || '0') || 0;

            if(liked) {
                btn.dataset.liked = '0';
                count = Math.max(0, count-1);
                icon.className = 'ph ph-heart';
                btn.style.color = 'var(--fv-text-muted)';
            } else {
                btn.dataset.liked = '1';
                count++;
                icon.className = 'ph-fill ph-heart';
                btn.style.color = 'var(--fv-danger)';
            }
            if(countEl) countEl.textContent = count || '';

            // Try Firestore
            try {
                const cRef = doc(db,'videos',videoId,'comments',cid);
                await updateDoc(cRef, {
                    likes: increment(liked ? -1 : 1),
                    likedBy: liked
                        ? (await getDoc(cRef)).data()?.likedBy?.filter(u=>u!==currentUserGlobal.uid) || []
                        : [...((await getDoc(cRef)).data()?.likedBy||[]), currentUserGlobal.uid]
                });
            } catch {}
        });
    });

    // EDIT comment
    list.querySelectorAll('.cmt-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if(!currentUserGlobal) return;
            const cid = btn.dataset.cid;
            const originalText = decodeURIComponent(btn.dataset.text);
            const textContainer = document.getElementById(`comment-text-${cid}`);
            if(!textContainer) return;

            textContainer.innerHTML = `
                <textarea id="edit-ta-${cid}" style="width:100%;border:2px solid var(--fv-border);border-radius:var(--radius-sm);padding:10px 14px;font-size:14px;font-weight:600;font-family:inherit;resize:none;height:72px;outline:none;background:var(--fv-gray-50);color:var(--fv-text);">${originalText}</textarea>
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button id="save-edit-${cid}" style="background:var(--fv-text);color:var(--fv-bg);border:none;padding:6px 16px;border-radius:6px;font-weight:900;font-size:12px;cursor:pointer;font-family:inherit;">Сохранить</button>
                    <button id="cancel-edit-${cid}" style="background:none;border:1.5px solid var(--fv-border);padding:6px 14px;border-radius:6px;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit;color:var(--fv-text);">Отмена</button>
                </div>`;

            document.getElementById(`save-edit-${cid}`)?.addEventListener('click', async () => {
                const newText = document.getElementById(`edit-ta-${cid}`)?.value.trim();
                if(!newText) return;
                try { await updateDoc(doc(db,'videos',videoId,'comments',cid), { text: newText }); } catch {}
                // Update local
                const comments = getComments(videoId);
                const idx = comments.findIndex(c=>c.id===cid);
                if(idx!==-1){ comments[idx].text=newText; localStorage.setItem(`fv_comments_${videoId}`, JSON.stringify(comments)); }
                textContainer.innerHTML = `<p class="comment-text">${newText}</p>`;
                window.showToast?.('Комментарий обновлён','success');
            });

            document.getElementById(`cancel-edit-${cid}`)?.addEventListener('click', () => {
                textContainer.innerHTML = `<p class="comment-text">${originalText}</p>`;
            });
        });
    });

    // DELETE comment
    list.querySelectorAll('.cmt-del-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if(!confirm('Удалить комментарий?')) return;
            const cid = btn.dataset.cid;
            try { await deleteDoc(doc(db,'videos',videoId,'comments',cid)); } catch {}
            // Local
            const comments = getComments(videoId).filter(c=>c.id!==cid);
            localStorage.setItem(`fv_comments_${videoId}`, JSON.stringify(comments));
            btn.closest('.comment-item')?.remove();
            const counter = document.getElementById('commCount');
            if(counter){ const n=parseInt(counter.textContent.replace(/\D/g,'')||'0'); counter.textContent=`(${Math.max(0,n-1)})`; }
            window.showToast?.('Комментарий удалён','info');
        });
    });
}

// ============================================
// MAIN
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('id');
    if(!videoId){ window.location.href='index.html'; return; }
    currentVideoId = videoId;

    // Track current user
    onAuthStateChanged(auth, user => {
        currentUserGlobal = user;
        if(user && window.currentUserData) {
            // Update like UI
            const likeBtn = document.getElementById('likeBtn');
            if(likeBtn) {
                const liked = isLiked(user.uid, videoId);
                likeBtn.classList.toggle('active', liked);
                const icon = likeBtn.querySelector('i');
                if(icon){ icon.className = liked?'ph-fill ph-heart':'ph ph-heart'; icon.style.color=liked?'var(--fv-danger)':''; }
            }
        }
    });

    let videoData = null;
    try {
        const snap = await getDoc(doc(db,'videos',videoId));
        if(snap.exists()){ videoData={id:snap.id,...snap.data()}; await updateDoc(doc(db,'videos',videoId),{views:increment(1)}); }
    } catch {}

    if(!videoData) videoData = MOCKS[videoId] ? {...MOCKS[videoId],id:videoId} : {...MOCKS['m1'],id:videoId};

    document.title = `${videoData.title} | ForVide`;

    const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
    set('videoTitle', videoData.title);
    set('videoViews', `${fv(videoData.views)} просмотров`);
    set('videoDate', `• ${fd(videoData.createdAt)}`);
    set('authorName', videoData.authorName);
    set('subsCount', `${videoData.subscribers||'0'} подписчиков`);
    set('descriptionText', videoData.description||'');
    set('likeCount', fv(videoData.likes||0));

    const avatarEl = document.getElementById('authorAvatar');
    if(avatarEl){ avatarEl.src=videoData.authorPhotoURL||''; avatarEl.alt=videoData.authorName; }

    // Author link
    const authorInfo = document.querySelector('.author-info');
    if(authorInfo && videoData.authorId && !videoData.authorId.startsWith('mock_')){
        authorInfo.style.cursor='pointer';
        authorInfo.onclick = () => window.location.href=`profile.html?uid=${videoData.authorId}`;
        authorInfo.title = 'Перейти к каналу автора';
    }

    // Player
    const frame = document.querySelector('.video-frame-container');
    if(frame){
        if(videoData.videoUrl){
            frame.innerHTML=`<video controls preload="metadata" poster="${videoData.thumbnailUrl||''}" style="width:100%;height:100%;"><source src="${videoData.videoUrl}" type="video/mp4">Ваш браузер не поддерживает видео.</video>`;
        } else {
            frame.innerHTML=`
                <div style="width:100%;height:100%;position:relative;background:#000;">
                    <img src="${videoData.thumbnailUrl||''}" style="width:100%;height:100%;object-fit:cover;opacity:0.4;position:absolute;inset:0;">
                    <div style="position:relative;z-index:1;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;">
                        <i class="ph-fill ph-play-circle" style="font-size:90px;color:var(--fv-mustard);filter:drop-shadow(0 4px 20px rgba(250,204,21,0.4));"></i>
                        <span style="color:rgba(255,255,255,0.7);font-weight:800;font-size:11px;letter-spacing:2px;background:rgba(0,0,0,0.5);padding:5px 14px;border-radius:20px;">ДЕМО · ВИДЕОФАЙЛ НЕ ЗАГРУЖЕН</span>
                    </div>
                </div>`;
        }
    }

    // History (after 3s)
    setTimeout(() => {
        if(window.currentUser){
            addToHistory({ id:videoId, title:videoData.title, thumbnailUrl:videoData.thumbnailUrl, authorName:videoData.authorName, authorPhotoURL:videoData.authorPhotoURL, duration:videoData.duration, views:videoData.views });
        }
    }, 3000);

    // LIKE
    const likeBtn = document.getElementById('likeBtn');
    const likeCountEl = document.getElementById('likeCount');
    if(likeBtn){
        likeBtn.addEventListener('click', () => {
            if(!window.currentUser){ window.showToast?.('Войдите чтобы поставить лайк','info'); window.openAuthModal?.(); return; }
            const uid=window.currentUser.uid;
            const liked=isLiked(uid,videoId);
            if(liked){
                removeFromLiked(uid,videoId);
                likeBtn.classList.remove('active');
                const icon=likeBtn.querySelector('i'); if(icon){icon.className='ph ph-heart';icon.style.color='';}
                if(likeCountEl) likeCountEl.textContent=fv(Math.max(0,(videoData.likes||0)-1));
                window.showToast?.('Убрано из понравившихся','info',2000);
            } else {
                addToLiked(uid,{id:videoId,title:videoData.title,thumbnailUrl:videoData.thumbnailUrl,thumb:videoData.thumbnailUrl,authorName:videoData.authorName,authorPhotoURL:videoData.authorPhotoURL,duration:videoData.duration,views:videoData.views});
                likeBtn.classList.add('active');
                const icon=likeBtn.querySelector('i'); if(icon){icon.className='ph-fill ph-heart';icon.style.color='var(--fv-danger)';}
                if(likeCountEl) likeCountEl.textContent=fv((videoData.likes||0)+1);
                window.showToast?.('Добавлено в понравившееся ❤️','success',2000);
            }
        });
    }

    // SHARE
    document.getElementById('shareBtn')?.addEventListener('click', async () => {
        try{ await navigator.share({title:videoData.title,url:window.location.href}); }
        catch{ await navigator.clipboard.writeText(window.location.href).catch(()=>{}); window.showToast?.('Ссылка скопирована 📋','success',2000); }
    });

    // SAVE
    document.getElementById('saveBtn')?.addEventListener('click', () => {
        if(!window.currentUser){window.openAuthModal?.();return;}
        window.showToast?.('Видео сохранено в закладки 🔖','success',2000);
    });

    // SHOW MORE
    const showMoreBtn = document.querySelector('.show-more');
    const descBlock = document.querySelector('.video-description');
    if(showMoreBtn && descBlock){
        showMoreBtn.addEventListener('click', () => {
            descBlock.classList.toggle('expanded');
            showMoreBtn.textContent = descBlock.classList.contains('expanded')?'СКРЫТЬ':'ЕЩЕ';
        });
    }

    // SUBSCRIBE
    const subBtn = document.querySelector('.subscribe-btn');
    let subscribed=false;
    if(subBtn){
        subBtn.addEventListener('click', () => {
            if(!window.currentUser){window.openAuthModal?.();return;}
            subscribed=!subscribed;
            subBtn.textContent=subscribed?'✓ ПОДПИСАН':'ПОДПИСАТЬСЯ';
            subBtn.classList.toggle('subscribed',subscribed);
            if(subscribed) window.showToast?.(`Подписались на ${videoData.authorName}! 🔔`,'success');
        });
    }

    // SUBMIT COMMENT
    window.submitComment = async function(){
        const ta=document.getElementById('commentTextInput');
        if(!ta) return;
        const text=ta.value.trim();
        if(!text){window.showToast?.('Напишите комментарий','info');return;}
        if(!window.currentUser){window.openAuthModal?.();return;}

        // Check mute
        if(window.currentUserData?.muted){
            window.showToast?.('Вам запрещено оставлять комментарии','error');
            return;
        }

        const ud=window.currentUserData;
        const postBtn=document.getElementById('postCommentBtn');
        if(postBtn){postBtn.disabled=true;postBtn.textContent='...';}

        // Save local
        const newComment = addComment(videoId,{
            text, authorName:ud?.displayName||'Аноним', authorPhotoURL:ud?.photoURL||'',
            authorId:window.currentUser.uid, likes:0, likedBy:[], videoId
        });

        // Try Firestore
        try {
            await addDoc(collection(db,'videos',videoId,'comments'),{
                text, authorName:ud?.displayName||'Аноним', authorPhotoURL:ud?.photoURL||'',
                authorId:window.currentUser.uid, createdAt:serverTimestamp(), likes:0, likedBy:[]
            });
        } catch {}

        ta.value='';
        if(postBtn){postBtn.disabled=false;postBtn.textContent='ОТПРАВИТЬ';}
        window.showToast?.('Комментарий опубликован! 💬','success',2000);

        const list=document.getElementById('commentsList');
        if(list){
            const div=document.createElement('div');
            div.innerHTML=renderComment({...newComment, authorPhotoURL:ud?.photoURL||''}, window.currentUser);
            list.insertBefore(div.firstElementChild, list.firstChild);
            bindCommentActions(videoId);
            const counter=document.getElementById('commCount');
            if(counter){const n=parseInt(counter.textContent.replace(/\D/g,'')||'0');counter.textContent=`(${n+1})`;}
        }
    };

    renderSidebar(videoId);
    await loadComments(videoId);

    // Show active banner if exists
    try {
        const banner = JSON.parse(localStorage.getItem('fv_active_banner')||'null');
        if(banner && banner.active && banner.type==='top'){
            const bannerEl=document.createElement('div');
            bannerEl.style.cssText=`background:${banner.bg||'#facc15'};color:${banner.color||'#111'};padding:12px 20px;text-align:center;font-weight:900;font-size:14px;cursor:pointer;position:relative;`;
            bannerEl.innerHTML=`<a href="${banner.url||'#'}" style="color:inherit;text-decoration:none;">${banner.title} <span style="opacity:0.7;font-size:12px;font-weight:600;">${banner.subtitle||''}</span></a><button onclick="this.parentElement.remove();localStorage.removeItem('fv_active_banner')" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:18px;color:inherit;opacity:0.6;">×</button>`;
            document.querySelector('main')?.prepend(bannerEl);
        }
    } catch {}
});
