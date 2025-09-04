// Boot messages
const bootMessages = [
  "[BOOT] Initializing profile system...",
  "[OK] Loading character stats...",
  "[OK] Accessing achievements...",
  "[OK] Preparing display...",
  `[READY] Welcome, Raymond. System boot at ${new Date().toLocaleString()}`
];

const enterBtn = document.getElementById("enterBtn");
const landing = document.getElementById("landing");
const terminal = document.getElementById("terminal");
const dashboard = document.getElementById("dashboard");
const terminalOutput = document.getElementById("terminalOutput");

// Handle enter game
function startGame() {
  landing.classList.add("hidden");
  terminal.classList.remove("hidden");
  typeBootMessages();
}
enterBtn.addEventListener("click", startGame);
document.addEventListener("keydown", (e) => { if (e.key === "Enter") startGame(); });

// Typing boot messages
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
      }, 1000);
    }
  }
  typeLine();
}

// Traits and Skills
const traits = ["Creative thinker", "Team player", "Adaptable", "Social", "Determined", "Loyal"];
const skills = [
  { name: "JavaScript", level: "Advanced" },
  { name: "Python", level: "Intermediate" },
  { name: "React", level: "Intermediate" },
  { name: "Problem-Solving", level: "Advanced" },
  { name: "Collaboration", level: "Advanced" }
];
const achievements = [
  "Graduated with BSc in Computer Science",
  "Completed Full-Stack Developer Bootcamp",
  "Built multiple real-world projects",
  "Contributor to open-source software"
];
const quests = [
  "Improve cloud computing skills (AWS, GCP)",
  "Launch personal portfolio website",
  "Contribute more to open-source",
  "Advance towards Senior Engineer role"
];

// Fill Traits
const traitsGrid = document.getElementById("traitsGrid");
traits.forEach(trait => {
  const div = document.createElement("div");
  div.textContent = trait;
  traitsGrid.appendChild(div);
});

// Fill Skills
const skillsPreview = document.getElementById("skillsPreview");
const statsGrid = document.getElementById("statsGrid");
skills.forEach(skill => {
  const li = document.createElement("li");
  li.textContent = skill.name;
  skillsPreview.appendChild(li);
  const div = document.createElement("div");
  div.textContent = `${skill.name} — ${skill.level}`;
  statsGrid.appendChild(div);
});

// Fill Achievements
const achievementsList = document.getElementById("achievementsList");
achievements.forEach(item => {
  const li = document.createElement("li");
  li.textContent = item;
  achievementsList.appendChild(li);
});

// Fill Quests
const questsList = document.getElementById("questsList");
quests.forEach(q => {
  const li = document.createElement("li");
  li.textContent = q;
  questsList.appendChild(li);
});

// Modals
function setupModal(panelName, modalId, closeId) {
  const panel = document.querySelector(`[data-panel='${panelName}']`);
  const modal = document.getElementById(modalId);
  const closeBtn = document.getElementById(closeId);

  panel.addEventListener("click", () => modal.classList.remove("hidden"));
  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
}
setupModal("character", "characterModal", "closeModal");
setupModal("stats", "statsModal", "closeStatsModal");
setupModal("achievements", "achievementsModal", "closeAchievementsModal");
setupModal("quests", "questsModal", "closeQuestsModal");

// Animate profile bar and XP
document.querySelector("[data-panel='character']").addEventListener("click", () => {
  document.getElementById("profileBar").style.width = "100%";
});
document.querySelector("[data-panel='stats']").addEventListener("click", () => {
  document.getElementById("xpFill").style.width = "80%";
  document.getElementById("xpVal").textContent = "80%";
});

// Landing Page Particles
const canvas = document.getElementById("landingParticles");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let particles = [];
for (let i = 0; i < 60; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 1,
    d: Math.random() * 1
  });
}
function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ff6600";
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fill();
  });
  updateParticles();
}
function updateParticles() {
  particles.forEach(p => {
    p.y -= p.d;
    if (p.y < 0) p.y = canvas.height;
  });
}
setInterval(drawParticles, 40);