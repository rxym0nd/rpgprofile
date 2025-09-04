// ---------- ELEMENTS ----------
const enterBtn = document.getElementById("enterBtn");
const landing = document.getElementById("landing");
const terminal = document.getElementById("terminal");
const dashboard = document.getElementById("dashboard");
const terminalOutput = document.getElementById("terminalOutput");
const achievementContainer = document.getElementById("achievementPopupContainer");

// ---------- BOOT MESSAGES ----------
const bootMessages = [
  "[BOOT] Initializing profile system...",
  "[OK] Loading character stats...",
  "[OK] Accessing achievements...",
  "[OK] Preparing display...",
  `[READY] Welcome, Raymond. System boot at ${new Date().toLocaleString()}`
];

function startGame() {
  landing.classList.add("hidden");
  terminal.classList.remove("hidden");
  typeBootMessages();
}

enterBtn.addEventListener("click", startGame);
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") startGame();
});

function typeBootMessages() {
  let i = 0;
  function typeLine() {
    if (i < bootMessages.length) {
      terminalOutput.textContent += bootMessages[i] + "\n";
      i++;
      setTimeout(typeLine, 800);
    } else {
      setTimeout(() => {
        terminal.classList.add("hidden");
        dashboard.classList.remove("hidden");
        loadQuests();
      }, 1000);
    }
  }
  typeLine();
}

// ---------- LEVEL SYSTEM ----------
let currentXP = 0;
let currentLevel = 1;

// Load saved data
if (localStorage.getItem("lifeQuests")) {
  const saved = JSON.parse(localStorage.getItem("lifeQuests"));
  lifeQuests.forEach((q, i) => q.completed = saved[i].completed);
  currentXP = parseInt(localStorage.getItem("currentXP")) || lifeQuests.filter(q => q.completed).reduce((a,b)=>a+b.xp,0);
} else {
  currentXP = lifeQuests.filter(q => q.completed).reduce((a,b)=>a+b.xp,0);
}
updateLevelAndBar();

// ---------- PANEL MODALS ----------
function setupModal(panelName, modalId, closeId) {
  const panel = document.querySelector(`[data-panel='${panelName}']`);
  const modal = document.getElementById(modalId);
  const closeBtn = document.getElementById(closeId);

  panel.addEventListener("click", () => modal.classList.remove("hidden"));
  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
}

setupModal("traits", "traitsModal", "closeTraitsModal");
setupModal("skills", "skillsModal", "closeSkillsModal");
setupModal("achievements", "achievementsModal", "closeAchievementsModal");
setupModal("questsLife", "questsLifeModal", "closeQuestsLifeModal");

// ---------- XP FUNCTIONS ----------
function grantXP(xp, questTitle){
  currentXP += xp;
  showAchievementPopup(questTitle, xp);
  updateLevelAndBar();
  saveQuestData();
}

function updateLevelAndBar(){
  const thresholds = [0, 100, 250, 500, 900, 1500, 2500];
  let newLevel = thresholds.length;
  for(let i=thresholds.length-1; i>=0; i--){
    if(currentXP >= thresholds[i]){
      newLevel = i+1;
      break;
    }
  }
  currentLevel = newLevel;

  const nextLevelXP = thresholds[newLevel] || thresholds[thresholds.length-1];
  document.getElementById("levelVal").textContent = currentLevel;
  document.getElementById("currentXP").textContent = currentXP;
  document.getElementById("nextLevelXP").textContent = nextLevelXP;

  const bar = document.getElementById("globalXPBar");
  const newWidth = Math.min((currentXP / nextLevelXP) * 100, 100);
  bar.style.width = newWidth + "%";
}

// ---------- ACHIEVEMENT POPUP ----------
function showAchievementPopup(title, xp){
  const popup = document.createElement("div");
  popup.classList.add("achievement-popup");
  popup.textContent = `🏆 Achievement Unlocked! ${title} +${xp} XP`;
  achievementContainer.appendChild(popup);

  requestAnimationFrame(() => {
    popup.style.opacity = "1";
    popup.style.transform = "translateY(0)";
  });

  setTimeout(() => {
    popup.style.opacity = "0";
    popup.style.transform = "translateY(-20px)";
    setTimeout(() => popup.remove(), 500);
  }, 3000);
}

// ---------- QUESTS ----------
const questsLifeList = document.getElementById("questsLifeList");

function loadQuests(){
  questsLifeList.innerHTML = "";
  lifeQuests.forEach((quest, idx) => {
    const li = document.createElement("li");
    li.textContent = `${quest.completed ? "✅" : "⬜"} ${quest.title} (+${quest.xp} XP)`;
    li.style.cursor = "pointer";
    li.style.opacity = quest.completed ? "1" : "0.7";

    li.addEventListener("click", () => {
      quest.completed = !quest.completed;
      li.textContent = `${quest.completed ? "✅" : "⬜"} ${quest.title} (+${quest.xp} XP)`;
      li.style.opacity = quest.completed ? "1" : "0.7";

      currentXP += quest.completed ? quest.xp : -quest.xp;
      updateLevelAndBar();

      if(quest.completed) showAchievementPopup(quest.title, quest.xp);

      saveQuestData();
    });

    questsLifeList.appendChild(li);
  });
}

// ---------- SAVE TO LOCAL STORAGE ----------
function saveQuestData(){
  localStorage.setItem("lifeQuests", JSON.stringify(lifeQuests));
  localStorage.setItem("currentXP", currentXP);
}

// ---------- LANDING PARTICLES ----------
const canvas = document.getElementById("landingParticles");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
for (let i = 0; i < 60; i++) {
  particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*2+1, d: Math.random()*1 });
}

function drawParticles() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#ff6600";
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fill();
  });
  updateParticles();
}

function updateParticles(){
  particles.forEach(p => {
    p.y -= p.d;
    if(p.y < 0) p.y = canvas.height;
  });
}

setInterval(drawParticles, 40);
