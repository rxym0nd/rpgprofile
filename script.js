document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-btn");
  const landing = document.getElementById("landing");
  const profile = document.getElementById("profile");

  function startProfile() {
    landing.style.opacity = "0";
    landing.style.transition = "opacity 1s ease";
    setTimeout(() => {
      landing.remove(); // remove landing completely
      profile.classList.add("active");
    }, 1000);
  }

  // Button click
  startBtn.addEventListener("click", startProfile);

  // Enter key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      startProfile();
    }
  });
});