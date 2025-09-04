document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-btn");
  const landing = document.getElementById("landing");
  const profile = document.getElementById("profile");
  const terminal = document.getElementById("terminal");

  // 🔹 Boot-up messages (edit these easily!)
  const bootMessages = [
    "[BOOT] Initializing profile system...",
    "[OK] Loading character stats...",
    "[OK] Accessing achievements...",
    "[OK] Preparing display...",
    "[READY] Welcome, Raymond."
  ];

  // Create line elements dynamically
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
      lines.forEach((line) => {
        setTimeout(() => {
          line.style.opacity = "1";
          line.style.animation = `typing 1.5s steps(30, end) forwards, blink .8s step-end infinite alternate`;

          // Remove cursor after typing finishes
          setTimeout(() => {
            line.classList.add("done");
          }, 1500);
        }, delay);
        delay += 1800;
      });
    }, 1000);
  }

  // Trigger by button
  startBtn.addEventListener("click", startProfile);

  // Trigger by Enter key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") startProfile();
  });
});
