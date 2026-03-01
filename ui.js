"use strict";

(() => {
  class UIManager {
    constructor() {
      this.selectedRabbitId = null;
      this.mode = "population";
      this.pieCanvas = null;
      this.pieCtx = null;
      this.isReady = false;
      this.dataMetricConfig = [
        { id: "toggleTotal", key: "total", label: "Total" },
        { id: "toggleLightFur", key: "lightFur", label: "Light Fur" },
        { id: "toggleDarkFur", key: "darkFur", label: "Dark Fur" },
        { id: "toggleStraightEars", key: "straightEars", label: "Straight Ears" },
        { id: "toggleFloppyEars", key: "floppyEars", label: "Floppy Ears" },
        { id: "toggleShortTeeth", key: "shortTeeth", label: "Short Teeth" },
        { id: "toggleLongTeeth", key: "longTeeth", label: "Long Teeth" }
      ];
      this.previousMetricSnapshot = null;
    }

    init() {
      if (this.isReady) return;

      this.injectGeneticControls();
      this.injectPieChartCanvas();
      this.bindModeControls();
      this.bindDataPanelLiveMetrics();
      this.isReady = true;
    }

    bindDataPanelLiveMetrics() {
      this.dataMetricConfig.forEach((item) => {
        const input = document.getElementById(item.id);
        const label = input?.parentElement;
        if (!label) return;

        let valueNode = label.querySelector(".data-metric-value");
        if (!valueNode) {
          valueNode = document.createElement("span");
          valueNode.className = "data-metric-value";
          valueNode.textContent = " (0)";
          label.appendChild(valueNode);
        }
      });

      const update = () => this.updateDataPanelLiveMetrics();
      window.addEventListener("simulation:population-changed", update);
      this.dataMetricConfig.forEach((item) => {
        document.getElementById(item.id)?.addEventListener("change", update);
      });

      this.updateDataPanelLiveMetrics();
    }

    updateDataPanelLiveMetrics() {
      const snapshot = window.SimulationModule?.getPopulationSnapshot?.();
      if (!snapshot) return;

      const total = Math.max(1, snapshot.total || 0);

      this.dataMetricConfig.forEach((item) => {
        const input = document.getElementById(item.id);
        const label = input?.parentElement;
        const valueNode = label?.querySelector(".data-metric-value");
        if (!valueNode) return;

        const rawValue = snapshot[item.key] ?? 0;
        const previousValue = this.previousMetricSnapshot ? (this.previousMetricSnapshot[item.key] ?? 0) : null;

        valueNode.classList.remove("trend-up", "trend-down", "trend-same");
        let trendText = "";
        if (previousValue != null) {
          if (rawValue > previousValue) {
            valueNode.classList.add("trend-up");
            trendText = " ↑";
          } else if (rawValue < previousValue) {
            valueNode.classList.add("trend-down");
            trendText = " ↓";
          } else {
            valueNode.classList.add("trend-same");
            trendText = " →";
          }
        } else {
          valueNode.classList.add("trend-same");
        }

        if (item.key === "total") {
          valueNode.textContent = ` (${rawValue})${trendText}`;
        } else {
          const pct = Math.round((rawValue / total) * 100);
          valueNode.textContent = ` (${rawValue}, ${pct}%)${trendText}`;
        }
      });

      const probeInput = document.getElementById("toggleDataProbe");
      const probeLabel = probeInput?.parentElement;
      if (probeLabel) {
        let probeNode = probeLabel.querySelector(".data-metric-value");
        if (!probeNode) {
          probeNode = document.createElement("span");
          probeNode.className = "data-metric-value";
          probeLabel.appendChild(probeNode);
        }
        probeNode.textContent = probeInput.checked ? " (ON)" : " (OFF)";
      }

      this.previousMetricSnapshot = {
        total: snapshot.total,
        lightFur: snapshot.lightFur,
        darkFur: snapshot.darkFur,
        straightEars: snapshot.straightEars,
        floppyEars: snapshot.floppyEars,
        shortTeeth: snapshot.shortTeeth,
        longTeeth: snapshot.longTeeth
      };
    }

    injectGeneticControls() {
      const rightPanel = document.querySelector(".right-panel");
      if (!rightPanel) return;

      const block = document.createElement("section");
      block.className = "sub-panel";
      block.innerHTML = `
        <h3>Genetics Options</h3>
        <div class="toggle-list">
          <label><input type="checkbox" id="dominantModeToggle" checked /> Dominant/Recessive Mode</label>
          <label><input type="checkbox" id="mutationToggle" /> Mutation Mode (1%)</label>
        </div>
      `;
      rightPanel.appendChild(block);
    }

    injectPieChartCanvas() {
      const probeInput = document.getElementById("toggleDataProbe");
      const dataToggleList = document.querySelector(".left-panel .toggle-list");
      if (!probeInput || !dataToggleList) return;

      const wrap = document.createElement("div");
      wrap.className = "trait-pie-row";

      const label = document.createElement("span");
      label.textContent = "Trait Pie";
      label.className = "trait-pie-label";

      this.pieCanvas = document.createElement("canvas");
      this.pieCanvas.width = 90;
      this.pieCanvas.height = 90;
      this.pieCanvas.setAttribute("aria-label", "Trait frequency pie chart");
      this.pieCanvas.className = "trait-pie-canvas";
      this.pieCtx = this.pieCanvas.getContext("2d");

      wrap.appendChild(label);
      wrap.appendChild(this.pieCanvas);

      const probeLabel = probeInput.parentElement;
      if (probeLabel && probeLabel.parentElement === dataToggleList) {
        probeLabel.insertAdjacentElement("afterend", wrap);
      } else {
        dataToggleList.appendChild(wrap);
      }
    }

    bindModeControls() {
      const modeRadios = document.querySelectorAll("input[name='graphView']");
      modeRadios.forEach((radio) => {
        radio.addEventListener("change", () => {
          if (radio.checked) {
            this.mode = radio.value;
            window.GraphModule?.redraw();
          }
        });
      });

      const probe = document.getElementById("toggleDataProbe");
      probe?.addEventListener("change", () => {
        window.GraphModule?.redraw();
      });
    }

    getViewMode() {
      const probe = document.getElementById("toggleDataProbe");
      if (probe?.checked) return "none";
      return this.mode;
    }

    isDominantMode() {
      return !!document.getElementById("dominantModeToggle")?.checked;
    }

    isMutationMode() {
      return !!document.getElementById("mutationToggle")?.checked;
    }

    setSelectedRabbit(id) {
      this.selectedRabbitId = id || null;
      window.GraphModule?.redraw();
    }

    getSelectedRabbit() {
      return this.selectedRabbitId;
    }

    drawTraitPie(snapshot) {
      if (!this.pieCtx || !snapshot) return;

      const ctx = this.pieCtx;
      const values = [snapshot.lightFur, snapshot.darkFur, snapshot.shortTeeth, snapshot.longTeeth];
      const total = Math.max(1, values.reduce((a, b) => a + b, 0));
      const colors = ["#f59e0b", "#2563eb", "#9333ea", "#0891b2"];

      ctx.clearRect(0, 0, this.pieCanvas.width, this.pieCanvas.height);

      let start = -Math.PI / 2;
      for (let i = 0; i < values.length; i++) {
        const angle = (values[i] / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(45, 45);
        ctx.arc(45, 45, 40, start, start + angle);
        ctx.closePath();
        ctx.fillStyle = colors[i];
        ctx.fill();
        start += angle;
      }

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(45, 45, 16, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const manager = new UIManager();

  window.UIModule = {
    init() {
      manager.init();
    },
    getViewMode() {
      return manager.getViewMode();
    },
    isDominantMode() {
      return manager.isDominantMode();
    },
    isMutationMode() {
      return manager.isMutationMode();
    },
    setSelectedRabbit(id) {
      manager.setSelectedRabbit(id);
    },
    getSelectedRabbit() {
      return manager.getSelectedRabbit();
    },
    drawTraitPie(snapshot) {
      manager.drawTraitPie(snapshot);
    }
  };

  window.addEventListener("DOMContentLoaded", () => {
    window.UIModule.init();
  });
})();
