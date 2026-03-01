"use strict";

(() => {
  const STORAGE_KEY = "evolution.main.visualPreset";
  const PRESET_RICH = "rich";
  const PRESET_CLEAN = "clean";

  function readPreset() {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === PRESET_CLEAN) return PRESET_CLEAN;
    return PRESET_RICH;
  }

  function applyPreset(preset) {
    const body = document.body;
    if (!body) return;

    const isClean = preset === PRESET_CLEAN;
    body.classList.toggle("preset-clean", isClean);
    body.classList.toggle("preset-rich", !isClean);

    const button = document.getElementById("visualPresetBtn");
    if (button) {
      button.textContent = isClean ? "Style: Classroom Clean" : "Style: Nature Rich";
      button.title = isClean
        ? "Switch to Nature Rich style"
        : "Switch to Classroom Clean style";
    }
  }

  function savePreset(preset) {
    localStorage.setItem(STORAGE_KEY, preset);
  }

  function togglePreset() {
    const current = readPreset();
    const next = current === PRESET_CLEAN ? PRESET_RICH : PRESET_CLEAN;
    savePreset(next);
    applyPreset(next);
  }

  window.VisualPresetModule = {
    getCurrent() {
      return readPreset();
    },
    setPreset(preset) {
      const next = preset === PRESET_CLEAN ? PRESET_CLEAN : PRESET_RICH;
      savePreset(next);
      applyPreset(next);
    },
    toggle() {
      togglePreset();
    }
  };

  window.addEventListener("DOMContentLoaded", () => {
    applyPreset(readPreset());
    document.getElementById("visualPresetBtn")?.addEventListener("click", togglePreset);
  });
})();
