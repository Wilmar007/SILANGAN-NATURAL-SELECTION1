"use strict";

(() => {
  class PopulationGraph {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.history = [];
      this.zoom = 1;
      this.isInitialized = false;
      this.proportionNavRects = { prev: null, next: null };
    }

    init() {
      if (this.isInitialized) return;

      this.canvas = document.getElementById("populationGraph");
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext("2d");
      if (!this.ctx) return;

      this.bindZoomControls();
      this.bindGenerationSlider();
      this.bindCanvasInteractions();
      this.isInitialized = true;
      this.draw();
    }

    bindCanvasInteractions() {
      this.canvas?.addEventListener("click", (event) => {
        const mode = window.UIModule?.getViewMode?.() ?? "population";
        if (mode !== "proportions") return;

        const rect = this.canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * this.canvas.width;
        const y = ((event.clientY - rect.top) / rect.height) * this.canvas.height;

        const inside = (box) => box
          && x >= box.x
          && x <= box.x + box.w
          && y >= box.y
          && y <= box.y + box.h;

        if (inside(this.proportionNavRects.prev)) {
          this.stepGeneration(-1);
          return;
        }

        if (inside(this.proportionNavRects.next)) {
          this.stepGeneration(1);
        }
      });
    }

    stepGeneration(delta) {
      const slider = document.getElementById("generationSlider");
      if (!slider) return;

      const current = Number(slider.value);
      const next = Math.max(Number(slider.min || 0), Math.min(Number(slider.max || 0), current + delta));
      if (next === current) return;

      slider.value = String(next);
      this.draw();
    }

    bindGenerationSlider() {
      const slider = document.getElementById("generationSlider");
      slider?.addEventListener("input", () => {
        this.draw();
      });
    }

    bindZoomControls() {
      const zoomInBtn = document.getElementById("zoomInBtn");
      const zoomOutBtn = document.getElementById("zoomOutBtn");

      zoomInBtn?.addEventListener("click", () => {
        this.zoom = Math.min(4, this.zoom + 0.25);
        this.draw();
      });

      zoomOutBtn?.addEventListener("click", () => {
        this.zoom = Math.max(1, this.zoom - 0.25);
        this.draw();
      });
    }

    reset(initialPoint) {
      this.history = initialPoint ? [initialPoint] : [];
      const slider = document.getElementById("generationSlider");
      if (slider) {
        slider.max = String(Math.max(0, this.history.length - 1));
        slider.value = slider.max;
      }
      this.draw();
    }

    push(point) {
      this.history.push(point);
      const slider = document.getElementById("generationSlider");
      if (slider) {
        slider.max = String(Math.max(0, this.history.length - 1));
        slider.value = slider.max;
      }
      this.draw();
    }

    isToggleEnabled(id) {
      const node = document.getElementById(id);
      return !!node?.checked;
    }

    drawAxes(margin, width, height, maxY, yLabel) {
      const ctx = this.ctx;
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(margin.left, margin.top);
      ctx.lineTo(margin.left, height - margin.bottom);
      ctx.lineTo(width - margin.right, height - margin.bottom);
      ctx.stroke();

      ctx.fillStyle = "#6b7280";
      ctx.font = "12px Segoe UI";
      ctx.fillText("Generation", width / 2 - 26, height - 10);

      ctx.save();
      ctx.translate(14, height / 2 + 30);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();

      const yTicks = 4;
      for (let i = 0; i <= yTicks; i++) {
        const ratio = i / yTicks;
        const y = height - margin.bottom - ratio * (height - margin.top - margin.bottom);
        const value = Math.round(ratio * maxY);

        ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(width - margin.right, y);
        ctx.stroke();

        ctx.fillStyle = "#64748b";
        ctx.fillText(String(value), 22, y + 4);
      }
    }

    drawSeries(points, margin, width, height, key, color, maxY) {
      if (points.length === 0) return;

      const ctx = this.ctx;
      const plotWidth = width - margin.left - margin.right;
      const plotHeight = height - margin.top - margin.bottom;
      const xStep = points.length > 1 ? plotWidth / (points.length - 1) : 0;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      points.forEach((point, index) => {
        const x = margin.left + index * xStep;
        const value = point[key] ?? 0;
        const y = height - margin.bottom - (value / maxY) * plotHeight;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();
    }

    visiblePoints() {
      const slider = document.getElementById("generationSlider");
      if (!slider || this.history.length === 0) return this.history;
      const idx = Math.max(0, Math.min(this.history.length - 1, Number(slider.value)));
      return this.history.slice(0, idx + 1);
    }

    selectedIndex() {
      const slider = document.getElementById("generationSlider");
      if (!slider || this.history.length === 0) return this.history.length - 1;
      return Math.max(0, Math.min(this.history.length - 1, Number(slider.value)));
    }

    pct(value, total) {
      if (!total || total <= 0) return 0;
      return Math.round((value / total) * 100);
    }

    drawStripedRect(x, y, width, height, color, stripeColor = "rgba(255,255,255,0.75)") {
      const ctx = this.ctx;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, width, height);

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();
      ctx.strokeStyle = stripeColor;
      ctx.lineWidth = 1.4;
      for (let stripeX = x - height; stripeX < x + width + height; stripeX += 6) {
        ctx.beginPath();
        ctx.moveTo(stripeX, y + height);
        ctx.lineTo(stripeX + height, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawLegend(x, y) {
      const ctx = this.ctx;
      const box = { x, y, w: 180, h: 148 };

      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(box.x, box.y, box.w, box.h, 8);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(box.x, box.y, box.w, box.h);
        ctx.strokeRect(box.x, box.y, box.w, box.h);
      }

      const items = [
        { label: "White Fur", color: "#1f9d7a", striped: false },
        { label: "Brown Fur", color: "#1f9d7a", striped: true },
        { label: "Straight Ears", color: "#d97706", striped: false },
        { label: "Floppy Ears", color: "#d97706", striped: true },
        { label: "Short Teeth", color: "#756fb6", striped: false },
        { label: "Long Teeth", color: "#756fb6", striped: true }
      ];

      let yy = box.y + 12;
      for (const item of items) {
        if (item.striped) this.drawStripedRect(box.x + 14, yy, 24, 14, item.color);
        else {
          ctx.fillStyle = item.color;
          ctx.fillRect(box.x + 14, yy, 24, 14);
        }

        ctx.fillStyle = "#111827";
        ctx.font = "12px Segoe UI";
        ctx.textAlign = "left";
        ctx.fillText(item.label, box.x + 44, yy + 11);
        yy += 21;
      }
    }

    drawTraitRow(rowLabel, rabbitsCount, snapshot, y, traits) {
      const ctx = this.ctx;
      const barStartX = 320;
      const barWidth = 118;
      const barHeight = 28;
      const traitGap = 18;

      ctx.fillStyle = "#111827";
      ctx.font = "24px Segoe UI";
      ctx.textAlign = "left";
      ctx.fillText(`${rowLabel}`, 240, y + 14);
      ctx.fillText(`${rabbitsCount} bunnies`, 240, y + 42);

      traits.forEach((trait, index) => {
        const dominantValue = snapshot[trait.dominantKey] ?? 0;
        const recessiveValue = snapshot[trait.recessiveKey] ?? 0;
        const total = Math.max(1, dominantValue + recessiveValue);
        const dominantPct = this.pct(dominantValue, total);
        const recessivePct = Math.max(0, 100 - dominantPct);

        const x = barStartX + index * (barWidth + traitGap);

        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1;
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.strokeRect(x, y, barWidth, barHeight);

        const dominantWidth = Math.round((dominantPct / 100) * barWidth);
        const recessiveWidth = barWidth - dominantWidth;

        ctx.fillStyle = trait.color;
        ctx.fillRect(x, y, dominantWidth, barHeight);
        if (recessiveWidth > 0) {
          this.drawStripedRect(x + dominantWidth, y, recessiveWidth, barHeight, trait.color);
        }

        ctx.fillStyle = "#111827";
        ctx.font = "20px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText(`${dominantPct}%`, x + barWidth / 2, y - 8);
        if (recessivePct > 0 && recessivePct !== dominantPct) {
          ctx.font = "12px Segoe UI";
          ctx.fillText(`${recessivePct}%`, x + barWidth / 2, y + barHeight + 15);
        }
      });
    }

    drawProportionsMode(width, height) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#f8fbff";
      ctx.fillRect(0, 0, width, height);
      this.proportionNavRects = { prev: null, next: null };

      if (this.history.length === 0) {
        this.drawNoneMode(width, height);
        return;
      }

      const selectedIdx = this.selectedIndex();
      const current = this.history[selectedIdx];
      const start = this.history[Math.max(0, selectedIdx - 1)] || current;

      const traits = [
        { title: "Fur", dominantKey: "lightFur", recessiveKey: "darkFur", color: "#1f9d7a" },
        { title: "Ears", dominantKey: "straightEars", recessiveKey: "floppyEars", color: "#d97706" },
        { title: "Teeth", dominantKey: "shortTeeth", recessiveKey: "longTeeth", color: "#756fb6" }
      ];

      this.drawLegend(20, 16);

      const barStartX = 320;
      const barWidth = 118;
      const traitGap = 18;

      traits.forEach((trait, index) => {
        const x = barStartX + index * (barWidth + traitGap) + barWidth / 2;
        ctx.fillStyle = "#111827";
        ctx.font = "14px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText(`☑ ${trait.title}`, x, 28);
      });

      this.drawTraitRow("Start of Generation", start.total ?? 0, start, 58, traits);
      this.drawTraitRow("Currently", current.total ?? 0, current, 128, traits);

      const generationText = `Generation ${current.generation}`;
      ctx.font = "14px Segoe UI";
      ctx.textAlign = "center";
      const textWidth = ctx.measureText(generationText).width;
      const centerX = width / 2;
      const navY = height - 28;
      const buttonSize = 18;
      const spacing = 12;

      const prevRect = {
        x: centerX - textWidth / 2 - spacing - buttonSize,
        y: navY - 13,
        w: buttonSize,
        h: buttonSize
      };
      const nextRect = {
        x: centerX + textWidth / 2 + spacing,
        y: navY - 13,
        w: buttonSize,
        h: buttonSize
      };

      const canPrev = this.selectedIndex() > 0;
      const canNext = this.selectedIndex() < this.history.length - 1;

      ctx.fillStyle = canPrev ? "#ffffff" : "#f1f5f9";
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1;
      ctx.fillRect(prevRect.x, prevRect.y, prevRect.w, prevRect.h);
      ctx.strokeRect(prevRect.x, prevRect.y, prevRect.w, prevRect.h);
      ctx.fillStyle = canPrev ? "#0f172a" : "#94a3b8";
      ctx.fillText("◀", prevRect.x + prevRect.w / 2, prevRect.y + prevRect.h - 4);

      ctx.fillStyle = canNext ? "#ffffff" : "#f1f5f9";
      ctx.strokeStyle = "#94a3b8";
      ctx.fillRect(nextRect.x, nextRect.y, nextRect.w, nextRect.h);
      ctx.strokeRect(nextRect.x, nextRect.y, nextRect.w, nextRect.h);
      ctx.fillStyle = canNext ? "#0f172a" : "#94a3b8";
      ctx.fillText("▶", nextRect.x + nextRect.w / 2, nextRect.y + nextRect.h - 4);

      ctx.fillStyle = "#111827";
      ctx.font = "14px Segoe UI";
      ctx.textAlign = "center";
      ctx.fillText(generationText, width / 2, height - 14);

      this.proportionNavRects = {
        prev: canPrev ? prevRect : null,
        next: canNext ? nextRect : null
      };
    }

    drawNoneMode(width, height) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#f8fbff";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#64748b";
      ctx.font = "14px Segoe UI";
      ctx.fillText("None mode: graph hidden (Data Probe active).", 20, 34);
    }

    drawPedigreeMode(width, height) {
      if (!window.PedigreeModule) {
        this.drawNoneMode(width, height);
        return;
      }
      const selected = window.UIModule?.getSelectedRabbit?.() || null;
      window.PedigreeModule.draw(this.ctx, width, height, selected);
    }

    draw() {
      if (!this.ctx || !this.canvas) return;

      const ctx = this.ctx;
      const width = this.canvas.width;
      const height = this.canvas.height;

      const mode = window.UIModule?.getViewMode?.() ?? "population";
      if (mode === "none") {
        this.drawNoneMode(width, height);
        return;
      }
      if (mode === "pedigree") {
        this.drawPedigreeMode(width, height);
        return;
      }
      if (mode === "proportions") {
        this.drawProportionsMode(width, height);
        return;
      }

      const margin = { top: 20, right: 20, bottom: 30, left: 42 };
      const points = this.visiblePoints();
      const maxY = Math.max(20, Math.ceil(((Math.max(...points.map((p) => p.total), 20) / this.zoom) + 5) / 5) * 5);

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#f8fbff";
      ctx.fillRect(0, 0, width, height);

      this.drawAxes(margin, width, height, maxY, "Population");

      const mapped = points;

      if (this.isToggleEnabled("toggleTotal")) this.drawSeries(mapped, margin, width, height, "total", "#111827", maxY);
      if (this.isToggleEnabled("toggleLightFur")) this.drawSeries(mapped, margin, width, height, "lightFur", "#f59e0b", maxY);
      if (this.isToggleEnabled("toggleDarkFur")) this.drawSeries(mapped, margin, width, height, "darkFur", "#2563eb", maxY);
      if (this.isToggleEnabled("toggleStraightEars")) this.drawSeries(mapped, margin, width, height, "straightEars", "#16a34a", maxY);
      if (this.isToggleEnabled("toggleFloppyEars")) this.drawSeries(mapped, margin, width, height, "floppyEars", "#dc2626", maxY);
      if (this.isToggleEnabled("toggleShortTeeth")) this.drawSeries(mapped, margin, width, height, "shortTeeth", "#9333ea", maxY);
      if (this.isToggleEnabled("toggleLongTeeth")) this.drawSeries(mapped, margin, width, height, "longTeeth", "#0891b2", maxY);
    }
  }

  const graphInstance = new PopulationGraph();

  window.GraphModule = {
    init() {
      graphInstance.init();
    },
    reset(initialPoint) {
      graphInstance.reset(initialPoint);
    },
    push(point) {
      graphInstance.push(point);
    },
    redraw() {
      graphInstance.draw();
    }
  };

  window.addEventListener("DOMContentLoaded", () => {
    window.GraphModule.init();

    [
      "toggleTotal",
      "toggleLightFur",
      "toggleDarkFur",
      "toggleStraightEars",
      "toggleFloppyEars",
      "toggleShortTeeth",
      "toggleLongTeeth"
    ].forEach((id) => {
      document.getElementById(id)?.addEventListener("change", () => window.GraphModule.redraw());
    });
  });
})();
