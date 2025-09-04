/* ===========================================================
   RPG Profile – Core Interactions & Effects
   - Landing → Terminal Typing → Dashboard
   - Particle Background (non-blocking canvas)
   - Character Modal with animated bars
   - Keyboard accessibility (Enter/ESC)
   =========================================================== */

/* --------------- Helpers ---------------- */
const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];

function nowStamp() {
  // Format: YYYY-MM-DD HH:MM:SS using local time
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/* --------------- Landing ---------------- */
const landing = $("#landing");
const enterBtn = $("#enterBtn");
const terminal = $("#terminal");
const terminalOutput = $("#terminalOutput");
const dashboard = $("#dashboard");

function goToTerminal() {
  // Fade out landing, then show terminal
  landing.classList.add("fade-out");
  setTimeout(() => {
    landing.classList.add("hidden");
    terminal.classList.remove("hidden");
    startBootSequence();
  }, 700);
}

enterBtn.addEventListener("click", goToTerminal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !landing.classList.contains("hidden")) {
    goToTerminal();
  }
});

/* --------------- Terminal Typing ---------------- */
const bootLines = [
  "[BOOT] Initializing profile system...",
  "[OK] Loading character stats...",
  "[OK] Accessing achievements...",
  "[OK] Preparing display...",
  // Last line is dynamic with timestamp and player name
];

async function startBootSequence() {
  terminalOutput.textContent = ""; // reset
  const lines = [...bootLines, `[READY] Welcome, Raymond. System boot at ${nowStamp()}`];

  // type lines one by one
  for (const line of lines) {
    await typeLine(line, terminalOutput, 12, 10); // text, target, charDelay, lineDelay
  }

  // brief pause, then fade out terminal and show dashboard
  await wait(600);
  terminal.classList.add("terminal-fade-out");
  setTimeout(() => {
    terminal.classList.add("hidden");
    showDashboard();
  }, 800);
}

function wait(ms) { return new Promise(res => setTimeout(res, ms)); }

/**
 * Types a line with a "console" feel.
 * @param {string} text
 * @param {HTMLElement} target
 * @param {number} charDelay milliseconds between characters
 * @param {number} lineDelay delay after each line
 */
async function typeLine(text, target, charDelay = 16, lineDelay = 0) {
  return new Promise(async (resolve) => {
    let i = 0;
    const cursor = "▋";
    while (i <= text.length) {
      target.textContent = target.textContent.replace(/▋?$/, "") + text.slice(0, i) + cursor;
      i++;
      await wait(charDelay);
    }
    // finalize line (replace cursor with newline)
    target.textContent = target.textContent.replace(/▋$/, "") + text + "\n";
    await wait(lineDelay);
    resolve();
  });
}

/* --------------- Dashboard + Particles ---------------- */
function showDashboard() {
  dashboard.classList.remove("hidden");
  initParticles(); // start particle background
  // Flicker-in handled by CSS animation on .grid
}

/**
 * Lightweight particle system (moving dots) behind panels.
 * - Uses devicePixelRatio for crispness
 * - pointer-events: none on canvas (set in CSS) so it never blocks clicks
 */
let particleState = null;

function initParticles() {
  const canvas = $("#particles");
  const ctx = canvas.getContext("2d");

  const DPR = Math.max(1, window.devicePixelRatio || 1);
  let width, height, particles;

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    spawnParticles();
  }

  function spawnParticles() {
    const count = Math.floor((width * height) / 18000); // density
    particles = Array.from({ length: count }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.6 + 0.6,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      a: Math.random() * 0.6 + 0.2
    }));
  }

  function step() {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;

      // wrap around edges
      if (p.x < -5) p.x = width + 5;
      if (p.x > width + 5) p.x = -5;
      if (p.y < -5) p.y = height + 5;
      if (p.y > height + 5) p.y = -5;

      ctx.globalAlpha = p.a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "#aee9ff";
      ctx.fill();
    }
    particleState.raf = requestAnimationFrame(step);
  }

  // clean up if re-initializing
  if (particleState?.raf) cancelAnimationFrame(particleState.raf);
  particleState = { raf: null, canvas };

  // Ensure canvas fills dashboard
  const ro = new ResizeObserver(resize);
  ro.observe(dashboard);
  resize();
  step();

  // Keep observer reference for potential teardown (not strictly needed here)
  particleState.ro = ro;
}

/* --------------- Character Modal ---------------- */
const characterPanel = $('.panel[data-panel="character"]');
const modal = $("#characterModal");
const modalContent = $(".modal-content", modal);
const backdrop = $(".modal-backdrop", modal);
const closeModalBtn = $("#closeModal");
const hpFill = $(".bar-fill.hp");
const mpFill = $(".bar-fill.mp");
const hpVal = $("#hpVal");
const mpVal = $("#mpVal");

// Target percentages for demo
const TARGET_HP = 82; // %
const TARGET_MP = 64; // %

function openModal() {
  modal.classList.remove("hidden");
  requestAnimationFrame(() => {
    modal.classList.add("show");
    animateBars(TARGET_HP, TARGET_MP);
  });

  // trap focus to back button for simplicity
  closeModalBtn.focus();
}

function closeModal() {
  modal.classList.remove("show");
  // reset progress bars after animation ends
  setTimeout(() => {
    modal.classList.add("hidden");
    resetBars();
  }, 280);
}

function resetBars() {
  hpFill.style.width = "0%";
  mpFill.style.width = "0%";
  hpVal.textContent = "0%";
  mpVal.textContent = "0%";
}

function animateBars(hp, mp) {
  // Animate width via CSS transition (already set in CSS)
  hpFill.style.width = hp + "%";
  mpFill.style.width = mp + "%";

  // Also animate the numeric labels for a satisfying fill
  animateCounter(hpVal, hp, 900);
  animateCounter(mpVal, mp, 900);
}

/**
 * Animates numbers from 0 → target over duration.
 */
function animateCounter(el, target, duration = 1000) {
  const start = performance.now();
  function frame(t) {
    const p = Math.min(1, (t - start) / duration);
    const val = Math.round(p * target);
    el.textContent = `${val}%`;
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* Open/Close interactions */
function isActivatingClick(e){ return e.type === "click" || (e.type === "keydown" && (e.key === "Enter" || e.key === " ")); }

characterPanel.addEventListener("click", openModal);
characterPanel.addEventListener("keydown", (e) => { if (isActivatingClick(e)) openModal(); });

closeModalBtn.addEventListener("click", closeModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
});
backdrop.addEventListener("click", closeModal);

/* --------------- Optional: demo handlers for other panels ---------------- */
// You can hook up additional modals or pages here if needed.
// For now we just show focus/hover effects and leave them static.