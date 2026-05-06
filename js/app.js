import { db } from './firebase-config.js';
import { collection, getDocs, orderBy, query } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

function formatViews(n=0){
 if(n>=1000000)return (n/1000000).toFixed(1)+'M';
 if(n>=1000)return (n/1000).toFixed(1)+'K';
 return n;
}

async function loadVideos(){
 const grid=document.getElementById('bento-container');
 if(!grid)return;
 grid.innerHTML='<p style="padding:20px">Загрузка видео...</p>';
 try{
   const q=query(collection(db,'videos'), orderBy('createdAt','desc'));
   const snap=await getDocs(q);
   let html='';
   snap.forEach((doc,index)=>{
      const v={id:doc.id,...doc.data()};
      html+=`<a href="player.html?id=${v.id}" class="video-tile ${index===0?'hero-tile':''}">
      <img src="${v.thumbnailUrl||'https://picsum.photos/seed/'+v.id+'/600/400'}" alt="${v.title}">
      <div class="tile-info">
      <h2>${v.title}</h2>
      <p>${v.authorName||'Автор'} • ${formatViews(v.views||0)} просмотров</p>
      </div></a>`;
   });
   if(!html) html='<p style="padding:20px">Видео пока нет.</p>';
   grid.innerHTML=html;
 }catch(e){
   grid.innerHTML='<p style="padding:20px">Ошибка загрузки видео.</p>';
   console.error(e);
 }
}

document.addEventListener('DOMContentLoaded', loadVideos);
