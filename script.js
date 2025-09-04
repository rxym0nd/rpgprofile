/* ===========================================================
   RPG Profile — Interactive Script
   - Landing → Terminal Typing → Dashboard
   - Particle Background
   - Modals: About, Skills, Achievements, Goals
   - Accessibility (Enter/ESC/Back)
   ----------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  /* ---------------- Helpers ---------------- */
  const $ = (sel, parent = document) => parent.querySelector(sel);
  const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  function nowStamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  /* ---------------- Elements ---------------- */
  const landing = $("#landing");
  const enterBtn = $("#enterBtn");
  const terminal = $("#terminal");
  const terminalOutput = $("#terminalOutput");
  const dashboard = $("#dashboard");

  /* ---------------- Data (placeholders) ---------------- */
  const profileData = {
    name: "Raymond Ochieng",
    subtitle: "Software Developer • Creative Builder",
    avatar: "https://via.placeholder.com/400",
    profileCompletion: 75,
    traits: ["Curious", "Resilient", "Problem-Solver", "Team Player"],
    skills: [
      { name: "JavaScript", level: 85 },
      { name: "Python", level: 80 },
      { name: "UI/UX Design", level: 70 },
      { name: "Public Speaking", level: 65 },
    ],
    achievements: [
      "Graduated with Honors — 2023",
      "Completed Web Dev Bootcamp",
      "Built RPG Profile Project",
    ],
    goals: [
      "Launch a personal portfolio website",
      "Contribute to open-source projects",
      "Learn 3D graphics programming",
    ],
  };

  /* ---------------- Landing → Terminal ---------------- */
  function goToTerminal() {
    landing.classList.add("fade-out");
    setTimeout(() => {
      landing.classList.add("hidden");
      terminal.classList.remove("hidden");
      startBootSequence();
    }, 700);
  }

  enterBtn?.addEventListener("click", goToTerminal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !landing.classList.contains("hidden")) {
      e.preventDefault();
      goToTerminal();
    }
  });

  const bootLines = [
    "[BOOT] Initializing profile system...",
    "[OK] Loading skills...",
    "[OK] Accessing achievements...",
    "[OK] Preparing dashboard...",
  ];

  async function startBootSequence() {
    terminalOutput.textContent = "";
    const lines = [...bootLines, `[READY] Welcome, ${profileData.name}. Boot at ${nowStamp()}`];

    for (const line of lines) {
      await typeLine(line, terminalOutput, 20, 200);
    }

    await wait(600);
    terminal.classList.add("terminal-fade-out");
    setTimeout(() => {
      terminal.classList.add("hidden");
      showDashboard();
    }, 800);
  }

  async function typeLine(text, target, charDelay = 16, lineDelay = 150) {
    const cursor = "▋";
    const previous = target.textContent;
    for (let i = 1; i <= text.length; i++) {
      target.textContent = previous + text.slice(0, i) + cursor;
      await wait(charDelay);
    }
    target.textContent = previous + text + "\n";
    await wait(lineDelay);
  }

  /* ---------------- Dashboard & Particles ---------------- */
  function showDashboard() {
    dashboard.classList.remove("hidden");
    initParticles();
    const firstPanel = $(".panel", dashboard);
    if (firstPanel) firstPanel.focus();
  }

  function initParticles() {
    const canvas = $("#particles");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const DPR = window.devicePixelRatio || 1;
    let width, height, particles;

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * DPR;
      canvas.height = height * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      particles = Array.from({ length: Math.floor((width * height) / 18000) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.6 + 0.6,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        a: Math.random() * 0.6 + 0.15,
      }));
    }

    function step() {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;
        ctx.globalAlpha = p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "#aee9ff";
        ctx.fill();
      }
      requestAnimationFrame(step);
    }

    resize();
    step();
    window.addEventListener("resize", resize);
  }

  /* ---------------- Modal System ---------------- */
  function openModal(modal) {
    modal.classList.remove("hidden");
  }

  function closeModal(modal) {
    modal.classList.add("hidden");
  }

  function bindModal(panelSel, modalSel, closeSel, onOpen) {
    const panel = $(panelSel);
    const modal = $(modalSel);
    const closeBtn = $(closeSel, modal);

    if (!panel || !modal) return;

    panel.addEventListener("click", () => {
      openModal(modal);
      if (onOpen) onOpen(modal);
    });

    closeBtn?.addEventListener("click", () => closeModal(modal));

    $(".modal-backdrop", modal)?.addEventListener("click", () => closeModal(modal));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) {
        closeModal(modal);
      }
    });
  }

  /* ---------------- Populate Modals ---------------- */
  // About
  bindModal('[data-panel="character"]', "#characterModal", "#closeModal", (modal) => {
    $("#avatarImg").src = profileData.avatar;
    $("#charTitle").textContent = profileData.name;
    $("#charSubtitle").textContent = profileData.subtitle;

    const pct = profileData.profileCompletion;
    $("#profileBar").style.width = pct + "%";
    animateCounter($("#profilePct"), pct, 1000);

    const traitsGrid = $("#traitsGrid");
    traitsGrid.innerHTML = "";
    profileData.traits.forEach((t) => {
      const div = document.createElement("div");
      div.textContent = t;
      traitsGrid.appendChild(div);
    });
  });

  // Skills
  bindModal('[data-panel="stats"]', "#statsModal", "#closeStatsModal", (modal) => {
    const statsGrid = $("#statsGrid");
    statsGrid.innerHTML = "";
    profileData.skills.forEach((s) => {
      const div = document.createElement("div");
      div.textContent = `${s.name} — ${s.level}%`;
      statsGrid.appendChild(div);
    });

    const xp = Math.round(
      profileData.skills.reduce((acc, s) => acc + s.level, 0) / profileData.skills.length
    );
    $("#xpFill").style.width = xp + "%";
    animateCounter($("#xpVal"), xp, 1000);
  });

  // Achievements
  bindModal('[data-panel="achievements"]', "#achievementsModal", "#closeAchievementsModal", (modal) => {
    const list = $("#achievementsList");
    list.innerHTML = "";
    profileData.achievements.forEach((a) => {
      const li = document.createElement("li");
      li.textContent = a;
      list.appendChild(li);
    });
  });

  // Goals
  bindModal('[data-panel="quests"]', "#questsModal", "#closeQuestsModal", (modal) => {
    const list = $("#questsList");
    list.innerHTML = "";
    profileData.goals.forEach((g) => {
      const li = document.createElement("li");
      li.textContent = g;
      list.appendChild(li);
    });
  });

  /* ---------------- Counter Animation ---------------- */
  function animateCounter(el, target, duration = 1000) {
    if (!el) return;
    const startTime = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - startTime) / duration);
      el.textContent = Math.round(p * target) + "%";
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
});