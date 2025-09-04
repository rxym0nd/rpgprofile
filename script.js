/* script.js
   Phase 1 functional prototype for Life RPG Dashboard.
   - Loads window.defaultQuests from quests.js
   - Uses localStorage for state
   - Supports Private Mode via PIN (lightweight)
   - Adds quest editor modal to create quests (public/private)
   - Toggle quests to gain/revoke XP
*/

(function(){
  // ---------- Config ----------
  const STORAGE_KEY = 'life-rpg-v2';
  const PIN_KEY = 'life-rpg-pin';
  const XP_PER_LEVEL = 1000;
  const DEFAULT_PIN = '1234';

  // ---------- Defaults & State ----------
  const defaultState = {
    xp: 0,
    quests: Array.isArray(window.defaultQuests) ? window.defaultQuests.map(q => ({ ...q })) : [],
    achievements: [
      { id:'graduated', title:'Graduated', xp:200, date: Date.now() - 1000*60*60*24*400 },
      { id:'started-business', title:'Started Nexus Creations', xp:300, date: Date.now() - 1000*60*60*24*300 },
      { id:'short-film', title:'Made a short film', xp:400, date: Date.now() - 1000*60*60*24*150 }
    ],
    privateMode: false
  };

  // seed XP from completed quests + achievements
  function seedXPFromCompleted(state){
    const completedQP = state.quests.filter(q=>q.completed).reduce((s,q)=>s+ (q.xp||0),0);
    const achXP = state.achievements.reduce((s,a)=>s+(a.xp||0),0);
    state.xp = Math.max(state.xp, completedQP + achXP);
    return state;
  }

  // ---------- Storage ----------
  function loadState(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw){
        const s = seedXPFromCompleted(JSON.parse(JSON.stringify(defaultState)));
        saveState(s);
        return s;
      }
      const parsed = JSON.parse(raw);
      // migrate check: if quests missing, use defaults
      if(!parsed.quests || !Array.isArray(parsed.quests)) parsed.quests = (window.defaultQuests||[]).map(q=>({...q}));
      parsed.privateMode = !!parsed.privateMode;
      return parsed;
    } catch(e){
      console.error('load error', e);
      const s = seedXPFromCompleted(JSON.parse(JSON.stringify(defaultState)));
      saveState(s);
      return s;
    }
  }

  function getPin(){
    return localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
  }

  function saveState(s){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }

  let state = loadState();

  // ---------- Helpers ----------
  function xpToLevel(xp){ return Math.floor(xp / XP_PER_LEVEL) + 1 }
  function xpForLevel(n){ return (n-1) * XP_PER_LEVEL }
  function uid(){ return Date.now() + '-' + Math.random().toString(36).slice(2,9) }
  function formatDate(ts){ return new Date(ts).toLocaleDateString() }

  // ---------- DOM refs ----------
  const landing = document.getElementById('landing');
  const dashboard = document.getElementById('dashboard');
  const xpFill = document.getElementById('xp-fill');
  const xpLabel = document.getElementById('xp-label');
  const levelEl = document.getElementById('level');
  const totalXPEl = document.getElementById('total-xp');
  const completedQuestsEl = document.getElementById('completed-quests');
  const levelDisplayEl = document.getElementById('level-display');
  const recentAchievements = document.getElementById('recent-achievements');
  const topQuestsEl = document.getElementById('top-quests');
  const questsGrid = document.getElementById('quests-grid');
  const modalQuestsGrid = document.getElementById('modal-quests-grid');
  const achievementPopup = document.getElementById('achievement-popup');
  const apText = document.getElementById('ap-text');

  // forms & modals
  const modalsRoot = document.getElementById('modals');
  const questEditorModal = document.getElementById('quest-editor-modal');
  const questForm = document.getElementById('quest-form');
  const addQuestBtn = document.getElementById('add-quest-btn');
  const addSampleXPBtn = document.getElementById('add-sample-xp');
  const resetBtn = document.getElementById('reset-progress');
  const privateToggleBtn = document.getElementById('private-toggle');
  const pinModal = document.getElementById('pin-modal');
  const pinForm = document.getElementById('pin-form');
  const pinInput = document.getElementById('pin-input');
  const pinSettingsModal = document.getElementById('pin-settings-modal');
  const pinSettingsForm = document.getElementById('pin-settings-form');
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const importFile = document.getElementById('import-file');

  // avatar placeholder
  document.getElementById('avatar-img').src = `data:image/svg+xml;utf8,
    <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
      <rect rx='20' width='100%' height='100%' fill='%23020b12'/>
      <g transform='translate(20,20)'>
        <circle cx='60' cy='50' r='30' fill='%2300aaff'/>
        <rect x='20' y='100' width='80' height='20' rx='10' fill='%23ff9b3c'/>
      </g>
    </svg>`;

  // ---------- Rendering ----------
  function renderAll(){
    // XP & level
    const xp = state.xp || 0;
    const level = xpToLevel(xp);
    const levelBase = xpForLevel(level);
    const progressPct = Math.min(100, Math.round(((xp - levelBase) / XP_PER_LEVEL) * 100));
    xpFill.style.width = progressPct + '%';
    xpLabel.textContent = `${xp} / ${level * XP_PER_LEVEL} XP`;
    levelEl.textContent = `Level ${level}`;
    totalXPEl.textContent = xp;
    levelDisplayEl.textContent = level;

    // completed count
    const completedCount = state.quests.filter(q=>q.completed).length;
    completedQuestsEl.textContent = completedCount;

    // achievements
    recentAchievements.innerHTML = '';
    state.achievements.slice().sort((a,b)=>b.date-a.date).slice(0,6).forEach(a=>{
      const li = document.createElement('li');
      li.textContent = `${a.title} (+${a.xp} XP) — ${formatDate(a.date)}`;
      recentAchievements.appendChild(li);
    });

    // top quests (public or private if in private mode)
    const visibleQuests = state.quests.filter(q => !q.private || state.privateMode);
    const top = visibleQuests.slice().sort((a,b)=> (a.completed - b.completed) || b.xp - a.xp).slice(0,6);
    topQuestsEl.innerHTML = '';
    top.forEach(q=>{
      const li = document.createElement('li');
      li.innerHTML = `<strong>${q.title}</strong> <div class="quest-meta">${q.category} • ${q.xp} XP • ${q.completed ? 'Done' : 'Open'}</div>`;
      topQuestsEl.appendChild(li);
    });

    // full quests grid (dashboard)
    renderQuestsGrid(questsGrid, visibleQuests);
    // modal quests grid (for the modal view - same data)
    renderQuestsGrid(modalQuestsGrid, visibleQuests, true);

    // achievements list in modal
    const achievementsList = document.getElementById('achievements-list');
    achievementsList.innerHTML = '';
    state.achievements.slice().sort((a,b)=>b.date-a.date).forEach(a=>{
      const li = document.createElement('li');
      li.textContent = `${a.title} — +${a.xp} XP (${formatDate(a.date)})`;
      achievementsList.appendChild(li);
    });

    // traits
    const traitList = document.getElementById('traits-list');
    traitList.innerHTML = '';
    ['Creative','Resilient','Adaptive','Leader'].forEach(t=>{
      const li = document.createElement('li'); li.textContent = t; traitList.appendChild(li);
    });

    // skills
    const skillsList = document.getElementById('skills-list');
    skillsList.innerHTML = '';
    [
      {name:'Coding', level:'Advanced'},
      {name:'Filmmaking', level:'Intermediate'},
      {name:'Networking', level:'Intermediate'},
      {name:'Football', level:'Active'}
    ].forEach(s=>{
      const li = document.createElement('li'); li.textContent = `${s.name} — ${s.level}`; skillsList.appendChild(li);
    });

    // update private toggle text
    privateToggleBtn.textContent = state.privateMode ? 'Exit Private' : 'Enter Private';
  }

  function renderQuestsGrid(container, list, inModal=false){
    container.innerHTML = '';
    if(list.length === 0){
      const p = document.createElement('div'); p.textContent = 'No quests here.';
      container.appendChild(p);
      return;
    }
    list.forEach(q=>{
      const card = document.createElement('div');
      card.className = 'quest-card' + (q.completed ? ' completed' : '');
      card.dataset.id = q.id;
      const privateBadge = q.private ? `<span class="quest-badge">private</span>` : '';
      card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
                          <div>
                            <strong>${q.title}</strong>
                            <div class="quest-meta">${q.category} • ${q.xp} XP ${privateBadge}</div>
                          </div>
                          <div style="text-align:right">
                            <button class="action small toggle-btn">${q.completed ? 'Undo' : 'Complete'}</button>
                            <div style="height:6px"></div>
                            <button class="action small edit-btn">Edit</button>
                          </div>
                        </div>`;
      // toggle handler
      card.querySelector('.toggle-btn').addEventListener('click', (e)=>{
        e.stopPropagation();
        toggleQuest(q.id);
      });
      // edit handler
      card.querySelector('.edit-btn').addEventListener('click', (e)=>{
        e.stopPropagation();
        openQuestEditor(q.id);
      });
      // clicking card opens details (small)
      card.addEventListener('click', ()=>{
        openQuestDetails(q);
      });
      container.appendChild(card);
    });
  }

  // ---------- Quest toggle & editor ----------
  function toggleQuest(id){
    const q = state.quests.find(x=>x.id == id);
    if(!q) return;
    q.completed = !q.completed;
    if(q.completed){
      state.xp = (state.xp || 0) + (q.xp || 0);
      pushAchievement({ id:'quest-'+q.id, title:`Quest Completed: ${q.title}`, xp:q.xp || 0, date: Date.now() });
      showAchievementPopup(q.title, q.xp || 0);
    } else {
      // subtract xp but not below 0
      state.xp = Math.max(0, (state.xp || 0) - (q.xp || 0));
      state.achievements = state.achievements.filter(a => a.id !== 'quest-'+q.id);
    }
    saveState(state);
    renderAll();
  }

  function openQuestDetails(q){
    // simple quick modal showing details (reuses quest-editor modal for edit)
    openModal('quest-editor-modal');
    // populate form with q for editing mode
    document.getElementById('quest-editor-title').textContent = 'Edit Quest';
    (document.getElementById('quest-title')).value = q.title;
    (document.getElementById('quest-category')).value = q.category;
    (document.getElementById('quest-xp')).value = q.xp;
    (document.getElementById('quest-completed')).checked = !!q.completed;
    (document.getElementById('quest-private')).checked = !!q.private;
    // mark form dataset for editing
    questForm.dataset.editId = q.id;
  }

  function openQuestEditor(editId){
    openModal('quest-editor-modal');
    document.getElementById('quest-editor-title').textContent = editId ? 'Edit Quest' : 'Add Quest';
    if(editId){
      const q = state.quests.find(x=>x.id==editId);
      if(q){
        (document.getElementById('quest-title')).value = q.title;
        (document.getElementById('quest-category')).value = q.category;
        (document.getElementById('quest-xp')).value = q.xp;
        (document.getElementById('quest-completed')).checked = !!q.completed;
        (document.getElementById('quest-private')).checked = !!q.private;
        questForm.dataset.editId = editId;
      }
    } else {
      questForm.reset();
      delete questForm.dataset.editId;
    }
  }

  questForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const title = document.getElementById('quest-title').value.trim();
    const category = document.getElementById('quest-category').value.trim() || 'General';
    const xp = Math.max(0, Number(document.getElementById('quest-xp').value) || 0);
    const completed = document.getElementById('quest-completed').checked;
    const isPrivate = document.getElementById('quest-private').checked;

    const editingId = questForm.dataset.editId;
    if(editingId){
      const q = state.quests.find(x=>x.id == editingId);
      if(!q) return;
      // if toggled from incomplete -> complete, award xp; if reversed, subtract
      const wasCompleted = q.completed;
      q.title = title; q.category = category; q.xp = xp; q.private = !!isPrivate; q.completed = !!completed;
      if(!wasCompleted && q.completed){
        state.xp = (state.xp || 0) + q.xp;
        pushAchievement({ id:'quest-'+q.id, title:`Quest Completed: ${q.title}`, xp:q.xp || 0, date: Date.now() });
        showAchievementPopup(q.title, q.xp || 0);
      } else if(wasCompleted && !q.completed){
        state.xp = Math.max(0, (state.xp||0) - q.xp);
        state.achievements = state.achievements.filter(a=>a.id !== 'quest-'+q.id);
      }
    } else {
      const newQuest = {
        id: uid(),
        title, category, xp, completed: !!completed, private: !!isPrivate
      };
      state.quests.push(newQuest);
      if(newQuest.completed){
        state.xp = (state.xp || 0) + newQuest.xp;
        pushAchievement({ id:'quest-'+newQuest.id, title:`Quest Completed: ${newQuest.title}`, xp:newQuest.xp || 0, date: Date.now() });
        showAchievementPopup(newQuest.title, newQuest.xp || 0);
      }
    }
    saveState(state);
    closeModal('quest-editor-modal');
    renderAll();
  });

  // Cancel quest editor
  document.getElementById('cancel-quest-btn').addEventListener('click', ()=>{
    closeModal('quest-editor-modal');
  });

  // Add Quest main button
  addQuestBtn.addEventListener('click', ()=> openQuestEditor());

  // ---------- Achievements ----------
  function pushAchievement(a){
    // avoid duplicates
    if(!a.id) a.id = uid();
    const exists = state.achievements.find(x=>x.id === a.id);
    if(!exists) state.achievements.push(a);
    saveState(state);
  }

  function showAchievementPopup(title, xp){
    apText.textContent = `${title} • +${xp} XP`;
    achievementPopup.classList.remove('hidden');
    achievementPopup.animate([{ transform:'translateX(-50%) translateY(-10px)', opacity:0 }, {transform:'translateX(-50%) translateY(0)', opacity:1}], { duration: 400, easing: 'cubic-bezier(.2,.8,.2,1)'});
    clearTimeout(window._achTimeout);
    window._achTimeout = setTimeout(()=>{
      achievementPopup.classList.add('hidden');
    }, 2200);
  }

  // ---------- Modal helpers ----------
  function openModal(id){
    const m = document.getElementById(id);
    if(!m) return;
    m.classList.remove('hidden');
    m.setAttribute('aria-hidden','false');
  }
  function closeModal(id){
    const m = document.getElementById(id);
    if(!m) return;
    m.classList.add('hidden');
    m.setAttribute('aria-hidden','true');
  }
  // data-open buttons
  document.querySelectorAll('[data-open]').forEach(btn=>{
    btn.addEventListener('click', ()=> openModal(btn.dataset.open));
  });
  // close buttons
  document.querySelectorAll('[data-close]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const m = btn.closest('.modal');
      if(m) closeModal(m.id);
    });
  });
  // overlay click
  modalsRoot.addEventListener('click', (e)=>{
    if(e.target.classList.contains('modal')){
      e.target.classList.add('hidden'); e.target.setAttribute('aria-hidden','true');
    }
  });

  // ---------- Private Mode (PIN) ----------
  privateToggleBtn.addEventListener('click', ()=>{
    if(state.privateMode){
      // just turn off
      state.privateMode = false;
      saveState(state);
      renderAll();
      return;
    }
    // open PIN entry modal
    pinInput.value = '';
    openModal('pin-modal');
  });

  pinForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const entered = pinInput.value.trim();
    const pin = getPin();
    if(entered === pin){
      state.privateMode = true;
      saveState(state);
      closeModal('pin-modal');
      renderAll();
      showAchievementPopup('Private Mode', 0);
    } else {
      // shake animation
      const modal = document.getElementById('pin-modal').querySelector('.modal-body');
      modal.animate([{ transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' }], { duration: 300 });
      pinInput.value = '';
      pinInput.focus();
    }
  });

  // Open pin settings
  document.getElementById('open-pin-settings').addEventListener('click', ()=>{
    closeModal('pin-modal');
    openModal('pin-settings-modal');
  });

  // Pin settings: change or disable
  pinSettingsForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const current = document.getElementById('current-pin').value || '';
    const newPin = document.getElementById('new-pin').value || '';
    const newPinConfirm = document.getElementById('new-pin-confirm').value || '';
    const existing = getPin();
    if(current !== existing){
      alert('Current PIN mismatch.');
      return;
    }
    if(!newPin || newPin !== newPinConfirm){
      alert('New PIN missing or does not match.');
      return;
    }
    localStorage.setItem(PIN_KEY, newPin);
    alert('PIN changed.');
    closeModal('pin-settings-modal');
  });

  document.getElementById('disable-pin-btn').addEventListener('click', ()=>{
    if(!confirm('Disable private mode and remove PIN?')) return;
    localStorage.removeItem(PIN_KEY);
    state.privateMode = false;
    saveState(state);
    alert('Private mode disabled (PIN removed).');
    closeModal('pin-settings-modal');
    renderAll();
  });

  // ---------- Export / Import ----------
  exportBtn.addEventListener('click', ()=>{
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'life-rpg-export.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener('click', ()=> importFile.click());
  importFile.addEventListener('change', (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(ev){
      try {
        const parsed = JSON.parse(ev.target.result);
        if(parsed && parsed.quests){
          state = parsed;
          saveState(state);
          renderAll();
          alert('Import successful.');
        } else {
          alert('Invalid file format.');
        }
      } catch(err){
        alert('Import failed: ' + err.message);
      }
    };
    reader.readAsText(file);
    importFile.value = '';
  });

  // ---------- Controls ----------
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' && !dashboard.classList.contains('visible')){
      startDashboard();
    }
    if(e.key === 'Escape'){
      document.querySelectorAll('.modal:not(.hidden)').forEach(m=>m.classList.add('hidden'));
    }
  });

  addSampleXPBtn.addEventListener('click', ()=>{
    state.xp = (state.xp || 0) + 250;
    pushAchievement({ id:'bonus-'+uid(), title:'Test XP Bonus', xp:250, date: Date.now() });
    saveState(state);
    renderAll();
    showAchievementPopup('Test XP Bonus', 250);
  });

  resetBtn.addEventListener('click', ()=>{
    if(!confirm('Reset all progress? This will clear local progress.')) return;
    localStorage.removeItem(STORAGE_KEY);
    // keep PIN
    state = loadState();
    renderAll();
  });

  // ---------- Landing canvas animation (simple) ----------
  const canvas = document.getElementById('landing-canvas');
  const ctx = canvas.getContext && canvas.getContext('2d');
  function resizeCanvas(){
    if(!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  // simple animated grid
  let offset = 0;
  function drawLanding(){
    if(!ctx) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = 'rgba(2,4,8,0.6)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    for(let x = offset % 60; x < canvas.width; x += 60){
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke();
    }
    for(let y = offset % 60; y < canvas.height; y += 60){
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke();
    }
    offset += 0.5;
    requestAnimationFrame(drawLanding);
  }
  drawLanding();

  // ---------- Landing -> Dashboard ----------
  function startDashboard(){
    landing.classList.add('hidden');
    dashboard.classList.remove('hidden');
    dashboard.classList.add('visible');
    renderAll();
  }

  // ---------- Init ----------
  window.addEventListener('load', ()=>{
    // seed xp if needed
    state = seedXPFromCompleted(state);
    saveState(state);
    // pre-render nothing else
  });

  // expose small API for console debugging
  window.LifeRPG = {
    state, saveState, renderAll, toggleQuest, openQuestEditor
  };

  // initial render (if user pressed start before load)
  if(!landing.classList.contains('hidden')) {
    // nothing yet
  } else {
    renderAll();
  }

})();
