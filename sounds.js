"use strict";

(() => {
  const STORAGE_KEY = "evolution.main.soundEnabled";

  let enabled = localStorage.getItem(STORAGE_KEY) !== "false";
  let audioContext = null;

  const frequencies = {
    click: 520,
    play: 660,
    pause: 300,
    reset: 240,
    addMate: 740,
    generation: 420,
    wolf: 180,
    food: 250,
    extinction: 140
  };

  function getContext() {
    if (!audioContext) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioContext = new Ctx();
    }
    return audioContext;
  }

  async function resumeContext() {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
      }
    }
  }

  function playTone({ freq, duration = 0.08, type = "sine", volume = 0.035, when = 0 }) {
    if (!enabled) return;
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state !== "running") return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    const start = ctx.currentTime + when;
    const end = start + duration;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(end + 0.01);
  }

  function playPattern(name) {
    switch (name) {
      case "click":
        playTone({ freq: frequencies.click, duration: 0.045, type: "triangle", volume: 0.02 });
        break;
      case "play":
        playTone({ freq: frequencies.play, duration: 0.07, type: "triangle", volume: 0.03 });
        playTone({ freq: frequencies.play * 1.25, duration: 0.08, type: "triangle", volume: 0.025, when: 0.06 });
        break;
      case "pause":
        playTone({ freq: frequencies.pause, duration: 0.09, type: "square", volume: 0.03 });
        break;
      case "reset":
        playTone({ freq: frequencies.reset * 1.3, duration: 0.07, type: "sine", volume: 0.03 });
        playTone({ freq: frequencies.reset, duration: 0.08, type: "sine", volume: 0.03, when: 0.06 });
        break;
      case "add-mate":
        playTone({ freq: frequencies.addMate, duration: 0.06, type: "triangle", volume: 0.03 });
        playTone({ freq: frequencies.addMate * 1.2, duration: 0.07, type: "triangle", volume: 0.03, when: 0.06 });
        break;
      case "generation-step":
        playTone({ freq: frequencies.generation, duration: 0.045, type: "sine", volume: 0.02 });
        break;
      case "wolf-predation":
        playTone({ freq: frequencies.wolf, duration: 0.08, type: "sawtooth", volume: 0.028 });
        break;
      case "food-starvation":
        playTone({ freq: frequencies.food, duration: 0.075, type: "square", volume: 0.022 });
        break;
      case "extinction":
        playTone({ freq: frequencies.extinction * 1.5, duration: 0.09, type: "sine", volume: 0.03 });
        playTone({ freq: frequencies.extinction, duration: 0.13, type: "sine", volume: 0.03, when: 0.08 });
        break;
      default:
        break;
    }
  }

  function setEnabled(nextValue) {
    enabled = !!nextValue;
    localStorage.setItem(STORAGE_KEY, String(enabled));
    updateToggleLabel();
  }

  function updateToggleLabel() {
    const btn = document.getElementById("soundToggleBtn");
    if (!btn) return;
    btn.textContent = enabled ? "Sound: On" : "Sound: Off";
  }

  function bindControls() {
    const soundToggleBtn = document.getElementById("soundToggleBtn");
    soundToggleBtn?.addEventListener("click", async () => {
      await resumeContext();
      setEnabled(!enabled);
      playPattern("click");
    });

    document.getElementById("playBtn")?.addEventListener("click", async () => {
      await resumeContext();
      playPattern("play");
    });

    document.getElementById("pauseBtn")?.addEventListener("click", async () => {
      await resumeContext();
      playPattern("pause");
    });

    document.getElementById("resetBtn")?.addEventListener("click", async () => {
      await resumeContext();
      playPattern("reset");
    });

    document.getElementById("addMateBtn")?.addEventListener("click", async () => {
      await resumeContext();
      playPattern("add-mate");
    });

    ["wolvesToggle", "toughFoodToggle", "limitedFoodToggle", "labelsToggle"].forEach((id) => {
      document.getElementById(id)?.addEventListener("change", async () => {
        await resumeContext();
        playPattern("click");
      });
    });
  }

  function bindSimulationEvents() {
    window.addEventListener("simulation:population-changed", async (event) => {
      await resumeContext();
      const reason = event?.detail?.reason || "update";
      if (
        reason === "add-mate" ||
        reason === "generation-step" ||
        reason === "wolf-predation" ||
        reason === "food-starvation" ||
        reason === "extinction"
      ) {
        playPattern(reason);
      }
    });
  }

  function bindUnlock() {
    const unlock = async () => {
      await resumeContext();
    };

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
  }

  window.SoundModule = {
    isEnabled() {
      return enabled;
    },
    setEnabled(nextValue) {
      setEnabled(nextValue);
    },
    play(name) {
      playPattern(name);
    }
  };

  window.addEventListener("DOMContentLoaded", () => {
    bindUnlock();
    bindControls();
    bindSimulationEvents();
    updateToggleLabel();
  });
})();
