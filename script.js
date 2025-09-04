document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-btn");
  const landing = document.getElementById("landing");
  const profile = document.getElementById("profile");
  const terminal = document.getElementById("terminal");
  const dashboard = document.getElementById("dashboard");

  // 🔹 Boot-up messages
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
    const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const time = now.toTimeString().split(" ")[0]; // HH:MM:SS
    return `${date} ${time}`;
  }

  function getBootMessages() {
    const intro = "[BOOT] Initializing profile system...";
    const outro = `[READY] Welcome, Raymond. System boot at ${getTimestamp()}`;
    const shuffled = messagePool
      .filter(msg => msg !== intro)
      .sort(() => Math.random() - 0.5);
    const middle = shuffled.slice(0, 3);
    return [intro, ...middle, outro];
  }

  // Create boot-up lines dynamically
  const bootMessages = getBootMessages();
  bootMessages.forEach(msg => {
    const p = document.createElement("p");
    p.classList.add("line");
    p.textContent = msg;
    terminal.appendChild(p);
  });

  const lines = document.querySelectorAll(".line");

  function startProfile() {
    if (profile.classList.contains("active")) return;

    // Fade out landing
    landing.style.opacity = "0";
    landing.style.transition = "opacity 1s ease";

    setTimeout(() => {
      landing.remove();
      profile.classList.add("active");

      // Animate lines one by one
      let delay = 500;
      lines.forEach((line, index) => {
        setTimeout(() => {
          line.style.opacity = "1";
          line.style.animation = `typing 1.5s steps(30, end) forwards, blink .8s step-end infinite alternate`;

          // Stop blinking cursor after typing finishes
          setTimeout(() => {
            line.classList.add("done");
          }, 1500);

          // When last line finishes -> fade out terminal, flicker in dashboard
          if (index === lines.length - 1) {
            setTimeout(() => {
              terminal.style.transition = "opacity 1s ease";
              terminal.style.opacity = "0";

              setTimeout(() => {
                terminal.remove();
                dashboard.style.display = "grid"; // show grid

                // Animate each panel with flicker
                const panels = document.querySelectorAll(".panel");
                panels.forEach((panel, i) => {
                  setTimeout(() => {
                    panel.classList.add("flicker");
                  }, i * 300); // stagger for cooler effect
                });
              }, 1000);
            }, 1800);
          }
        }, delay);
        delay += 1800;
      });
    }, 1000);
  }

  // Button + Enter trigger
  startBtn.addEventListener("click", startProfile);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") startProfile();
  });
});
