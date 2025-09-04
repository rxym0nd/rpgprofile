
/* ===========================================================
   RPG Profile – Core Interactions & Effects
   - Landing → Terminal Typing → Dashboard
   - Particle Background (non-blocking canvas)
   - Character Modal with animated bars
   - Keyboard accessibility (Enter/ESC)
   ----------------------------------------------------------- */

/* Wrap in DOMContentLoaded to be robust even if script placement changes */
document.addEventListener("DOMContentLoaded", () => {

  /* ---------------- Helpers ---------------- */
  const $ = (sel, parent = document) => (parent || document).querySelector(sel);
  const $$ = (sel, parent = document) => Array.from((parent || document).querySelectorAll(sel));

  function wait(ms) { return new Promise(res => setTimeout(res, ms)); }

  function nowStamp() {
    // Format: YYYY-MM-DD HH:MM:SS using local time
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

  /* Guard early if critical elements missing */
  if (!landing || !terminal || !terminalOutput || !dashboard) {
    console.error("Essential UI elements missing from DOM.");
    return;
  }

  /* ---------------- Landing -> Terminal ---------------- */
  function goToTerminal() {
    // Fade out landing, then show terminal
    landing.classList.add("fade-out");
    // match CSS fade duration (700ms)
    setTimeout(() => {
      landing.classList.add("hidden");
      terminal.classList.remove("hidden");
      startBootSequence();
    }, 700);
  }

  if (enterBtn) {
    enterBtn.addEventListener("click", goToTerminal);
  }
  // Global Enter while landing visible
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !landing.classList.contains("hidden")) {
      e.preventDefault();
      goToTerminal();
    }
  });

  /* ---------------- Terminal Typing ---------------- */
  const bootLines = [
    "[BOOT] Initializing profile system...",
    "[OK] Loading character stats...",
    "[OK] Accessing achievements...",
    "[OK] Preparing display..."
    // last line will be dynamic
  ];

  async function startBootSequence() {
    terminalOutput.textContent = ""; // reset
    const lines = [...bootLines, `[READY] Welcome, Raymond. System boot at ${nowStamp()}`];

    // type lines one by one with controlled delays
    for (const line of lines) {
      await typeLine(line, terminalOutput, 18, 200); // charDelay 18ms, lineDelay 200ms
    }

    // brief pause, then fade out terminal and show dashboard
    await wait(600);
    terminal.classList.add("terminal-fade-out");
    setTimeout(() => {
      terminal.classList.add("hidden");
      showDashboard();
    }, 800);
  }

  /**
   * Types a line with a "console" feel.
   * Fixed duplication bug: we compute the previous content once,
   * then append incremental text and finally the entire line + newline.
   * @param {string} text
   * @param {HTMLElement} target
   * @param {number} charDelay milliseconds between characters
   * @param {number} lineDelay delay after the line finishes
   */
  async function typeLine(text, target, charDelay = 16, lineDelay = 150) {
    const cursor = "▋";
    // preserve previous content (so we don't duplicate)
    const previous = target.textContent;
    // type each character
    for (let i = 1; i <= text.length; i++) {
      target.textContent = previous + text.slice(0, i) + cursor;
      await wait(charDelay);
    }
    // finalize: replace cursor and append newline (no duplication)
    target.textContent = previous + text + "\n";
    await wait(lineDelay);
  }

  /* ---------------- Dashboard & Particles ---------------- */
  function showDashboard() {
    dashboard.classList.remove("hidden");
    initParticles(); // start particle background
    // set focus to first panel for keyboard nav
    const firstPanel = $(".panel", dashboard);
    if (firstPanel) firstPanel.focus();
  }

  /* Particle system state */
  let particleState = null;

  function initParticles() {
    const canvas = $("#particles");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const DPR = Math.max(1, window.devicePixelRatio || 1);
    let width = 0;
    let height = 0;
    let particles = [];
    let running = true;

    function spawnParticles() {
      const count = Math.max(4, Math.floor((width * height) / 18000)); // ensure a few particles
      particles = Array.from({ length: count }).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.6 + 0.6,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        a: Math.random() * 0.6 + 0.15
      }));
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
      // keep drawing in CSS pixels
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      spawnParticles();
    }

    function step() {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // wrap
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
      particleState.raf = requestAnimationFrame(step);
    }

    // teardown previous
    if (particleState?.raf) cancelAnimationFrame(particleState.raf);
    if (particleState?.ro) particleState.ro.disconnect();

    particleState = { raf: null, ro: null, canvas, running: true };

    // observe dashboard size changes
    const ro = new ResizeObserver(() => resize());
    ro.observe(dashboard);
    // also handle window resize as a fallback
    window.addEventListener("resize", resize);

    // initialize and start
    resize();
    step();

    // store for cleanup
    particleState.ro = ro;
    particleState.running = true;

    // cleanup on unload to avoid extra RAFs if page is closed
    window.addEventListener("beforeunload", () => {
      running = false;
      if (particleState?.raf) cancelAnimationFrame(particleState.raf);
      if (particleState?.ro) particleState.ro.disconnect();
    }, { once: true });
  }

  /* ---------------- Character Modal ---------------- */
  const characterPanel = $('.panel[data-panel="character"]');
  const modal = $("#characterModal");
  const closeModalBtn = $("#closeModal");
  const hpFill = $(".bar-fill.hp", modal);
  const mpFill = $(".bar-fill.mp", modal);
  const hpVal = $("#hpVal", modal) || { textContent: "" };
  const mpVal = $("#mpVal", modal) || { textContent: "" };

  // Demo targets
  const TARGET_HP = 82; // %
  const TARGET_MP = 64; // %

  function openModal() {
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    // allow a frame for browser to apply styles then add show
    requestAnimationFrame(() => {
      modal.classList.add("show");
      animateBars(TARGET_HP, TARGET_MP);
    });
    // focus close button for quick keyboard exit
    if (closeModalBtn) closeModalBtn.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    // wait for modal close transition before hiding
    setTimeout(() => {
      modal.classList.add("hidden");
      resetBars();
    }, 300);
  }

  function resetBars() {
    if (hpFill) hpFill.style.width = "0%";
    if (mpFill) mpFill.style.width = "0%";
    if (hpVal) hpVal.textContent = "0%";
    if (mpVal) mpVal.textContent = "0%";
  }

  function animateBars(hp, mp) {
    if (hpFill) hpFill.style.width = hp + "%";
    if (mpFill) mpFill.style.width = mp + "%";
    animateCounter(hpVal, hp, 900);
    animateCounter(mpVal, mp, 900);
  }

  function animateCounter(el, target, duration = 1000) {
    if (!el) return;
    const startTime = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - startTime) / duration);
      const val = Math.round(p * target);
      el.textContent = `${val}%`;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function isActivatingEvent(e) {
    // support Enter and Space (code/legacy keys)
    return e.type === "click" || (e.type === "keydown" && (e.key === "Enter" || e.key === " " || e.key === "Spacebar" || e.code === "Space"));
  }

  // wire panel → modal if element exists
  if (characterPanel) {
    characterPanel.addEventListener("click", openModal);
    characterPanel.addEventListener("keydown", (e) => {
      if (isActivatingEvent(e)) {
        e.preventDefault();
        openModal();
      }
    });
  }

  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (modal) {
    // close on ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) {
        closeModal();
      }
    });
    // click backdrop to close
    const backdrop = $(".modal-backdrop", modal);
    if (backdrop) backdrop.addEventListener("click", closeModal);
  }

  /* ---------------- Extra: safe defaults ---------------- */
  // Ensure bars are at 0 initially
  resetBars();

  // End of DOMContentLoaded wrapper
});
