// Dark mode state management
const THEME_KEY = "theme";
const DARK_THEME = "dark";
const LIGHT_THEME = "light";

function getInitialTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;
  return savedTheme || (systemPrefersDark ? DARK_THEME : LIGHT_THEME);
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

function updateToggleButton(theme) {
  const toggle = document.getElementById("darkModeToggle");
  if (!toggle) return;

  const icon = toggle.querySelector("i");
  if (!icon) return;

  icon.setAttribute("data-lucide", theme === DARK_THEME ? "sun" : "moon");
  lucide.createIcons();
}

function initDarkMode() {
  const initialTheme = getInitialTheme();
  setTheme(initialTheme);
  updateToggleButton(initialTheme);

  const toggle = document.getElementById("darkModeToggle");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;

    setTheme(newTheme);
    updateToggleButton(newTheme);
  });
}

// Wait for DOM to be fully loaded before initializing
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDarkMode);
} else {
  initDarkMode();
}

document.addEventListener("DOMContentLoaded", () => {
  const darkModeToggle = document.getElementById("darkModeToggle");
  const body = document.body;

  // Check for saved user preference, if any, on load of the website
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    body.classList.add(savedTheme);
  }

  darkModeToggle.addEventListener("click", () => {
    if (body.classList.contains("dark-mode")) {
      body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light-mode");
    } else {
      body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark-mode");
    }
  });
});
