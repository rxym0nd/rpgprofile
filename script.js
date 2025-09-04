/* script.js
  Core interactivity: loads quests from window.questsData, handles localStorage, XP/level, modals, animations.
*/

(function(){
  // ---------- Config ----------
  const STORAGE_KEY = 'life-rpg-v1';
  const XP_PER_LEVEL = 1000; // simple leveling: every 1000 XP = 1 level
  const MAX_RECENT = 6;

  // ---------- Initial default state ----------
  const defaultState = {
    xp: 0,
    quests: window.questsData.map(q => ({ ...q })), // copy
    achievements: [
      { id:'graduated', title:'Graduated', xp:200, date: Date.now() - 1000*60*60*24*400 },
      { id:'started-business', title:'Started Nexus Creations', xp:300, date: Date.now() - 1000*60*60*24*300 },
      { id:'short-film', title:'Made a short film', xp:400, date: Date.now() - 1000*60*60*24*150 }
    ]
  };

  // seed state: if quests contain completed ones, award xp accordingly
  function seedXPFromCompleted(state){
    const completedXP = state.quests.filter(q=>q.completed).reduce((s,q)=>s+q.xp,0);
    state.xp = Math.max(state.xp, completedXP + state.achievements.reduce((s,a)=>s+a.xp,0));
    return state;
  }

  // ---------- Storage ----------
  function loadState(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) {
        const s = seedXPFromCompleted(JSON.parse(JSON.stringify(defaultState)));
        saveState(s);
        return s;
      }
      const parsed = JSON.parse(raw);
      // migrate if quests missing
      if(!parsed.quests || !Array.isArray(parsed.quests)){
        parsed.quests = window.questsData.map(q => ({ ...q }));
      }
      return parsed;
    } catch(e){
      console.error("load error", e);
      const s = seedXPFromCompleted(JSON.parse(JSON.stringify(defaultState)));
      saveState(s);
      return s;
    }
  }
  function saveState(s){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }
  let state = loadState();

  // ---------- Utils ----------
  function xpToLevel(xp){ return Math.floor(xp / XP_PER_LEVEL) + 1 }
  function xpForLevel(level){ return (level-1) * XP_PER_LEVEL }
  function xpToNextLevel(xp){ return ((xpToLevel(xp))*XP_PER_LEVEL) - xp }

  function formatDate(ts){
    const d = new Date(ts);
    return d.toLocaleDateString();
  }

  // ---------- DOM elements ----------
  const landing = document.getElementById('landing');
  const dashboard = document.getElementById('dashboard');
  const xpFill = document.getElementById('xp-fill');
  const xpLabel = document.getElementById('xp-label');
  const levelEl = document.getElementById('level');
  const totalXPEl = document.getElementById('total-xp');
  const completedQuestsEl = document.getElementById('completed-quests');
  const levelDisplayEl = document.getElementById('level-display');
  const recentAchievements = document.getElementById('recent-achievements');
  const topQuests = document.getElementById('top-quests');
  const questsGrid = document.getElementById('quests-grid');
  const achievementPopup = document.getElementById('achievement-popup');
  const apText = document.getElementById('ap-text');

  // ---------- Landing canvas animation ----------
  const canvas = document.getElementById('landing-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  // create particles
  for(let i=0;i<60;i++){
    particles.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      vx: (Math.random()-0.5)*0.4,
      vy: (Math.random()-0.5)*0.8,
      r: 1 + Math.random()*3,
      hue: Math.random()>0.5 ? 200 : 20
    });
  }
  function drawLanding(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = 'rgba(2,4,8,0.6)';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // faint grid
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    for(let x=0;x<canvas.width;x+=80){
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke();
    }
    for(let y=0;y<canvas.height;y+=80){
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke();
    }

    // particles
    particles.forEach(p=>{
      p.x += p.vx;
      p.y += p.vy;
      if(p.x<0) p.x=canvas.width;
      if(p.x>canvas.width) p.x=0;
      if(p.y<0) p.y=canvas.height;
      if(p.y>canvas.height) p.y=0;
      ctx.beginPath();
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r*8);
      gradient.addColorStop(0, `rgba(${p.hue===200?0:255}, ${p.hue===200?170:155}, ${p.hue===200?255:60}, 0.9)`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fill();
    });

    requestAnimationFrame(drawLanding);
  }
  drawLanding();

  // ---------- UI render ----------
  function renderAll(){
    // XP & level
    const xp = state.xp;
    const level = xpToLevel(xp);
    const levelBase = xpForLevel(level);
    const progress = Math.min(100, Math.round(((xp - levelBase) / XP_PER_LEVEL) * 100));
    xpFill.style.width = progress + '%';
    xpLabel.textContent = `${xp} / ${level*XP_PER_LEVEL} XP`;
    levelEl.textContent = `Level ${level}`;
    totalXPEl.textContent = xp;
    levelDisplayEl.textContent = level;

    // completed quests
    const completedCount = state.quests.filter(q=>q.completed).length;
    completedQuestsEl.textContent = completedCount;

    // recent achievements
    const achs = state.achievements.slice().sort((a,b)=>b.date-a.date).slice(0,MAX_RECENT);
    recentAchievements.innerHTML = '';
    achs.forEach(a=>{
      const li = document.createElement('li');
      li.textContent = `${a.title} (+${a.xp} XP) — ${formatDate(a.date)}`;
      recentAchievements.appendChild(li);
    });

    // top 5 active quests (small)
    const top = state.quests.slice(0).sort((a,b)=> (a.completed - b.completed) || b.xp - a.xp).slice(0,5);
    topQuests.innerHTML = '';
    top.forEach(q=>{
      const li = document.createElement('li');
      li.className = 'quest-item';
      li.innerHTML = `<strong>${q.title}</strong> <div class="quest-meta">${q.category} • ${q.xp} XP • ${q.completed ? 'Done' : 'Open'}</div>`;
      topQuests.appendChild(li);
    });

    // quests grid
    questsGrid.innerHTML = '';
    state.quests.forEach(q=>{
      const card = document.createElement('div');
      card.className = 'quest-card' + (q.completed ? ' completed' : '');
      card.dataset.id = q.id;
      card.innerHTML = `<div><strong>${q.title}</strong></div>
        <div class="quest-meta">${q.category} • ${q.xp} XP</div>
        <div style="margin-top:8px;font-size:12px;color:var(--muted)">${q.completed ? 'Completed' : 'Click to toggle'}</div>`;
      card.addEventListener('click', ()=>toggleQuest(q.id));
      questsGrid.appendChild(card);
    });

    // achievements list in modal
    const achievementsList = document.getElementById('achievements-list');
    achievementsList.innerHTML = '';
    state.achievements.slice().sort((a,b)=>b.date-a.date).forEach(a=>{
      const li = document.createElement('li');
      li.textContent = `${a.title} — +${a.xp} XP (${formatDate(a.date)})`;
      achievementsList.appendChild(li);
    });

    // traits & skills (static)
    const traitList = document.getElementById('traits-list');
    traitList.innerHTML = '';
    const traits = ['Creative','Resilient','Adaptive','Leader'];
    traits.forEach(t=>{
      const li = document.createElement('li');
      li.textContent = t;
      traitList.appendChild(li);
    });

    const skillsList = document.getElementById('skills-list');
    skillsList.innerHTML = '';
    const skills = [
      {name:'Coding', level:'Advanced'},
      {name:'Filmmaking', level:'Intermediate'},
      {name:'Networking', level:'Intermediate'},
      {name:'Football', level:'Active'}
    ];
    skills.forEach(s=>{
      const li = document.createElement('li');
      li.textContent = `${s.name} — ${s.level}`;
      skillsList.appendChild(li);
    });
  }

  // ---------- Quest toggling ----------
  function toggleQuest(id){
    const q = state.quests.find(x=>x.id==id);
    if(!q) return;
    q.completed = !q.completed;
    // add or subtract XP
    if(q.completed){
      state.xp += q.xp;
      // record achievement pop
      pushAchievement({ id:'quest-'+q.id, title:`Quest Completed: ${q.title}`, xp:q.xp, date: Date.now() });
      showAchievementPopup(q.title, q.xp);
    } else {
      // un-completing subtracts xp (but not below 0)
      state.xp = Math.max(0, state.xp - q.xp);
      // remove auto achievement entry for this quest
      state.achievements = state.achievements.filter(a=>a.id !== 'quest-'+q.id);
    }
    saveState(state);
    renderAll();
  }

  // ---------- Achievements ----------
  function pushAchievement(a){
    state.achievements.push(a);
    saveState(state);
  }

  function showAchievementPopup(title,xp){
    apText.textContent = `${title} • +${xp} XP`;
    achievementPopup.classList.remove('hidden');
    achievementPopup.animate([{ transform:'translateX(-50%) translateY(-10px)', opacity:0 }, {transform:'translateX(-50%) translateY(0)', opacity:1}], { duration: 400, easing: 'cubic-bezier(.2,.8,.2,1)'});
    clearTimeout(window._achTimeout);
    window._achTimeout = setTimeout(()=>{
      achievementPopup.classList.add('hidden');
    }, 2400);
  }

  // ---------- Modal handling ----------
  document.querySelectorAll('[data-open]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const id = btn.dataset.open;
      openModal(id);
    });
  });
  document.querySelectorAll('[data-close]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const mod = btn.closest('.modal');
      closeModal(mod && mod.id);
    });
  });
  function openModal(id){
    const m = document.getElementById(id);
    if(!m) return;
    m.classList.remove('hidden');
    m.setAttribute('aria-hidden','false');
  }
  function closeModal(id){
    if(!id) return;
    const m = document.getElementById(id);
    if(!m) return;
    m.classList.add('hidden');
    m.setAttribute('aria-hidden','true');
  }

  // close on overlay click
  document.getElementById('modals').addEventListener('click', (e)=>{
    if(e.target.classList.contains('modal')) {
      e.target.classList.add('hidden');
      e.target.setAttribute('aria-hidden','true');
    }
  });

  // ---------- Controls ----------
  document.addEventListener('keydown', (e)=>{
    // Enter -> start
    if(e.key === 'Enter' && !dashboard.classList.contains('visible')){
      startDashboard();
    }
    // also allow Escape to close modals
    if(e.key === 'Escape') {
      document.querySelectorAll('.modal:not(.hidden)').forEach(m=>m.classList.add('hidden'));
    }
  });

  document.getElementById('add-sample-xp').addEventListener('click', ()=>{
    state.xp += 250;
    pushAchievement({ id:'bonus-'+Date.now(), title:'Test XP Bonus', xp:250, date: Date.now() });
    saveState(state);
    renderAll();
    showAchievementPopup('Test XP Bonus', 250);
  });

  document.getElementById('reset-progress').addEventListener('click', ()=>{
    if(!confirm('Reset all progress? This will clear local progress.')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = loadState();
    renderAll();
  });

  // ---------- Landing to dashboard ----------
  function startDashboard(){
    landing.classList.add('hidden');
    dashboard.classList.remove('hidden');
    dashboard.classList.add('visible');
    renderAll();
    flashHUD();
  }

  // small HUD flash effect to feel responsive
  function flashHUD(){
    const hud = document.querySelector('.hud');
    hud.animate([{ boxShadow:'0 0 0 rgba(0,0,0,0)' }, { boxShadow:'0 6px 40px rgba(0,170,255,0.06)' }], { duration:800 });
  }

  // ---------- On load ----------
  // Attach initial quest completed xp if not set (seed earlier)
  window.addEventListener('load', ()=>{
    // If user already completed some quests in default dataset and state.xp is lower, set it
    saveState(state);
    // Pre-render landing info (we will render dashboard after start)
    document.querySelector('.landing-content .small').textContent = 'Raymond — Age 23 — Kenya';
    // If user refreshed and dashboard visible (rare), render
    if(!landing.classList.contains('hidden')){
      // fine
    } else {
      renderAll();
    }
  });

  // ---------- Extras: small animated achievement when leveling up ----------
  // Watch XP and show level up animation if level increased
  let lastLevel = xpToLevel(state.xp);
  const xpObserver = new MutationObserver(()=>{ // fallback trigger; we will also check when saving
    const level = xpToLevel(state.xp);
    if(level > lastLevel){
      showAchievementPopup('Level Up!', 0);
      lastLevel = level;
    }
  });
  xpObserver.observe(xpLabel, { childList:true, subtree:true });

  // Ensure we check on save
  const oldSave = saveState;
  saveState = function(s){
    const prevLevel = xpToLevel(state.xp);
    oldSave(s);
    const newLevel = xpToLevel(s.xp);
    if(newLevel > prevLevel){
      showAchievementPopup('Level Up!', 0);
    }
  };

  // expose for debugging (optional)
  window.LifeRPG = {
    state,
    saveState,
    renderAll,
    toggleQuest
  };

  // render initially if user has dashboard visible
  if(!landing.classList.contains('hidden')){
    // nothing
  } else {
    renderAll();
  }

})();
