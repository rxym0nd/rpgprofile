document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-btn");
  const landing = document.getElementById("landing");
  const profile = document.getElementById("profile");
  const terminal = document.getElementById("terminal");
  const dashboard = document.getElementById("dashboard");

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

  function startProfile() {
    if (profile.classList.contains("active")) return;

    // Fade out landing
    landing.style.opacity = "0";
    setTimeout(() => {
      landing.remove();
      profile.classList.add("active");

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

          // Stop blinking after typing
          setTimeout(() => line.classList.add("done"), 1500);

          // On last line, fade terminal then show dashboard
          if (index === lines.length - 1) {
            setTimeout(() => {
              terminal.style.transition = "opacity 1s ease";
              terminal.style.opacity = "0";

              setTimeout(() => {
                terminal.remove();
                dashboard.style.display = "grid";

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
});
