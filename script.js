document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-btn");
  const landing = document.getElementById("landing");
  const profile = document.getElementById("profile");
  const terminal = document.getElementById("terminal");
  const dashboard = document.getElementById("dashboard");
  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d");

  const charPanel = document.getElementById("character-panel");
  const charModal = document.getElementById("character-modal");
  const closeChar = document.getElementById("close-character");

  /* Boot Messages */
  const messagePool = [
    "[BOOT] Initializing profile system...",
    "[OK] Loading character stats...",
    "[OK] Accessing achievements...",
    "[OK] Preparing display...",
    "[OK] Verifying save files...",
    "[OK] Running diagnostics...",
    "[OK] Establishing neural link...",
    "[WARN] Low mana detected, replenishing...",
    "[OK] Network sync complete."
  ];

  function getTimestamp() {
    const now = new Date();
    return `${now.toISOString().split("T")[0]} ${now.toTimeString().split(" ")[0]}`;
  }

  function getBootMessages() {
    const intro = "[BOOT] Initializing profile system...";
    const outro = `[READY] Welcome, Raymond. System boot at ${getTimestamp()}`;
    const shuffled = messagePool.filter(msg => msg !== intro).sort(() => Math.random() - 0.5);
    return [intro, ...shuffled.slice(0, 3), outro];
  }

  /* Start sequence */
  function startProfile() {
    if (profile.classList.contains("active")) return;

    // Fade out landing
    landing.style.opacity = "0";
    setTimeout(() => {
      landing.remove();
      profile.classList.add("active");

      // Add boot messages
      const bootMessages = getBootMessages();
      bootMessages.forEach(msg => {
        const p = document.createElement("p");
        p.classList.add("line");
        p.textContent = msg;
        terminal.appendChild(p);
      });

      const lines = document.querySelectorAll(".line");

      // Animate lines sequentially
      lines.forEach((line, index) => {
        setTimeout(() => {
          line.style.opacity = "1";
          line.style.animation = `typing 1.5s steps(30, end) forwards, blink .8s step-end infinite alternate`;

          setTimeout(() => line.classList.add("done"), 1500);

          // When last line finishes
          if (index === lines.length - 1) {
            setTimeout(() => {
              terminal.style.transition = "opacity 1s ease";
              terminal.style.opacity = "0";

              setTimeout(() => {
                terminal.remove();

                // Show dashboard before initializing canvas
                dashboard.style.display = "grid";

                initParticles(); // canvas now has proper size

                const panels = document.querySelectorAll(".panel");
                panels.forEach((panel, i) => {
                  setTimeout(() => panel.classList.add("flicker"), i * 300);
                });
              }, 1000);
            }, 2000);
          }
        }, index * 2000);
      });
    }, 1000);
  }

  startBtn.addEventListener("click", startProfile);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") startProfile();
  });

  /* Particle Background */
  function initParticles() {
    canvas.style.position = "absolute";
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2,
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ffcc";
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* Character Modal Logic */
  charPanel.addEventListener("click", () => {
    charModal.classList.add("active");

    // animate bars filling
    document.querySelectorAll(".bar .fill").forEach(bar => {
      const percent = bar.style.getPropertyValue("--percent");
      bar.style.width = percent;
    });
  });

  closeChar.addEventListener("click", () => {
    charModal.classList.remove("active");

    // reset bars
    document.querySelectorAll(".bar .fill").forEach(bar => {
      bar.style.width = "0";
    });
  });

  /* Handle window resize for canvas */
  window.addEventListener("resize", () => {
    if (dashboard.style.display === "grid") {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  });
});
