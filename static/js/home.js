/* ═══════════════════════════════════════════════════════════════════════════
   EmoBot — Home page interactions
   Animations: dark mode, scroll reveal, hero emotion pills
   ═══════════════════════════════════════════════════════════════════════════ */
(() => {
  "use strict";

  // ─── Dark Mode ──────────────────────────────────────────────
  function initTheme() {
    const saved = localStorage.getItem("emobot-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("emobot-theme", theme);
    const btn = document.getElementById("darkModeBtn");
    if (!btn) return;
    const icon = btn.querySelector("i");
    if (icon) {
      icon.setAttribute("data-lucide", theme === "dark" ? "sun" : "moon");
      lucide.createIcons();
    }
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme");
    applyTheme(cur === "dark" ? "light" : "dark");
  }

  // ─── Scroll Reveal ──────────────────────────────────────────
  function initScrollReveal() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    document.querySelectorAll(".anim").forEach((el) => observer.observe(el));
  }

  // ─── Hero Emotion Pills ────────────────────────────────────
  const EMOTIONS = [
    "joy",
    "love",
    "admiration",
    "excitement",
    "gratitude",
    "curiosity",
    "surprise",
    "optimism",
    "amusement",
    "pride",
    "relief",
    "caring",
    "desire",
    "anger",
    "sadness",
    "fear",
    "confusion",
    "disappointment",
    "nervousness",
    "grief",
  ];

  const EMOJIS = {
    joy: "\u{1F60A}",
    love: "\u{2764}\u{FE0F}",
    admiration: "\u{1F929}",
    excitement: "\u{1F389}",
    gratitude: "\u{1F64F}",
    curiosity: "\u{1F914}",
    surprise: "\u{1F632}",
    optimism: "\u{1F60C}",
    amusement: "\u{1F604}",
    pride: "\u{1F4AA}",
    relief: "\u{1F605}",
    caring: "\u{1F917}",
    desire: "\u{1F60D}",
    anger: "\u{1F620}",
    sadness: "\u{1F622}",
    fear: "\u{1F628}",
    confusion: "\u{1F937}",
    disappointment: "\u{1F61E}",
    nervousness: "\u{1F630}",
    grief: "\u{1F62D}",
  };

  function initEmotionPills() {
    const container = document.getElementById("heroEmotions");
    if (!container) return;

    // Pick 10 random emotions to display
    const shuffled = [...EMOTIONS].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 10);

    selected.forEach((emotion, i) => {
      const pill = document.createElement("span");
      pill.className = "emotion-pill";
      pill.textContent = `${EMOJIS[emotion] || ""} ${emotion}`;
      pill.style.animationDelay = `${0.8 + i * 0.1}s`;
      pill.style.transform = "translateY(8px)";
      container.appendChild(pill);
    });
  }

  // ─── Init ───────────────────────────────────────────────────
  function init() {
    initTheme();
    initScrollReveal();
    initEmotionPills();

    const darkBtn = document.getElementById("darkModeBtn");
    if (darkBtn) darkBtn.addEventListener("click", toggleTheme);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
