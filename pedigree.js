"use strict";

(() => {
  const rabbitSpriteCache = new Map();

  function createSvgImage(svg) {
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    return img;
  }

  function buildRabbitSvg({ fur = "light", ears = "straight", teeth = "short", blink = false }) {
    const furFill = fur === "dark" ? "#a97b4a" : "#f3f0ea";
    const furShade = fur === "dark" ? "#8b643d" : "#d8d5cf";
    const furHighlight = fur === "dark" ? "#c79a67" : "#ffffff";
    const bellyFill = fur === "dark" ? "#f0dfc4" : "#fbf8f1";
    const earInner = fur === "dark" ? "#efa6a6" : "#efb3b3";
    const eyeIris = fur === "dark" ? "#5a381f" : "#5a4a2a";
    const earHeight = ears === "floppy" ? 22 : 36;

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100">
        <defs>
          <linearGradient id="pFurGrad" x1="0" x2="1" y1="0.2" y2="0.9">
            <stop offset="0" stop-color="${furHighlight}"/>
            <stop offset="0.58" stop-color="${furFill}"/>
            <stop offset="1" stop-color="${furShade}"/>
          </linearGradient>
          <radialGradient id="pEye" cx="0.35" cy="0.2" r="0.9">
            <stop offset="0" stop-color="#ffffff"/>
            <stop offset="1" stop-color="${eyeIris}"/>
          </radialGradient>
        </defs>

        <ellipse cx="68" cy="84" rx="46" ry="8" fill="rgba(15,23,42,0.16)"/>
        <ellipse cx="52" cy="64" rx="10" ry="13" fill="${furShade}"/>
        <ellipse cx="80" cy="63" rx="10" ry="11" fill="${furShade}"/>

        <ellipse cx="70" cy="56" rx="40" ry="27" fill="url(#pFurGrad)"/>
        <ellipse cx="58" cy="65" rx="20" ry="12" fill="${bellyFill}" opacity="0.95"/>
        <ellipse cx="45" cy="58" rx="17" ry="12" fill="url(#pFurGrad)"/>
        <ellipse cx="102" cy="51" rx="20" ry="16" fill="url(#pFurGrad)"/>
        <ellipse cx="118" cy="49" rx="10" ry="8" fill="url(#pFurGrad)"/>

        <ellipse cx="92" cy="20" rx="6" ry="${earHeight}" fill="url(#pFurGrad)" transform="rotate(7 92 20)"/>
        <ellipse cx="111" cy="18" rx="5.5" ry="${Math.max(17, earHeight - 2)}" fill="url(#pFurGrad)" transform="rotate(-7 111 18)"/>
        <ellipse cx="92" cy="21" rx="2.6" ry="${Math.max(10, Math.round(earHeight * 0.58))}" fill="${earInner}" transform="rotate(7 92 21)"/>
        <ellipse cx="111" cy="19" rx="2.4" ry="${Math.max(9, Math.round(earHeight * 0.54))}" fill="${earInner}" transform="rotate(-7 111 19)"/>

        ${!blink
          ? `
            <ellipse cx="103" cy="50" rx="7.5" ry="8" fill="white"/>
            <ellipse cx="115" cy="51" rx="7.5" ry="8" fill="white"/>
            <circle cx="103" cy="51" r="4.2" fill="url(#pEye)"/>
            <circle cx="115" cy="52" r="4.2" fill="url(#pEye)"/>
            <circle cx="103" cy="51" r="1.5" fill="#111827"/>
            <circle cx="115" cy="52" r="1.5" fill="#111827"/>
          `
          : `
            <path d="M95 52 Q103 47 111 52" stroke="#2a211a" stroke-width="1.8" fill="none"/>
            <path d="M107 53 Q115 48 123 53" stroke="#2a211a" stroke-width="1.8" fill="none"/>
          `}

        <ellipse cx="122" cy="58" rx="5" ry="3.6" fill="#e79ba1"/>
        <path d="M114 58 Q122 56 129 58" stroke="#6d4127" stroke-width="1.3" fill="none"/>
        <path d="M113 61 q-8 3 -14 1" stroke="#6d4127" stroke-width="1.2" fill="none"/>
        <path d="M121 62 q8 3 14 1" stroke="#6d4127" stroke-width="1.2" fill="none"/>
        ${teeth === "long" ? "<path d='M120 61 v6 M124 61 v6' stroke='#ffffff' stroke-width='1.4'/>" : ""}
      </svg>
    `;
  }

  function getRabbitSprite(fur, ears, teeth, blink = false) {
    const key = `${fur}|${ears}|${teeth}|${blink ? 1 : 0}`;
    if (!rabbitSpriteCache.has(key)) {
      rabbitSpriteCache.set(key, createSvgImage(buildRabbitSvg({ fur, ears, teeth, blink })));
    }
    return rabbitSpriteCache.get(key);
  }

  class PedigreeStore {
    constructor() {
      this.nodes = new Map();
      this.currentGenerationIds = [];
    }

    reset(initialPopulation, generation) {
      this.nodes.clear();
      this.currentGenerationIds = [];
      for (const organism of initialPopulation) {
        this.registerNode(organism, [], generation);
      }
      this.currentGenerationIds = initialPopulation.map((o) => o.id);
    }

    registerNode(organism, parentIds, generation) {
      this.nodes.set(organism.id, {
        id: organism.id,
        parentIds: parentIds || [],
        generation,
        phenotype: organism.phenotype,
        genotypeLabel: organism.genotypeLabel
      });
    }

    registerGeneration(population, generation) {
      this.currentGenerationIds = population.map((o) => o.id);
      for (const organism of population) {
        if (!this.nodes.has(organism.id)) {
          this.registerNode(organism, organism.parentIds || [], generation);
        }
      }
    }

    getLineage(rootId, depth = 3) {
      if (!rootId || !this.nodes.has(rootId)) return [];

      const visited = new Set();
      const queue = [{ id: rootId, level: 0 }];
      const lineage = [];

      while (queue.length > 0) {
        const current = queue.shift();
        if (!current || visited.has(current.id) || current.level > depth) continue;
        visited.add(current.id);

        const node = this.nodes.get(current.id);
        if (!node) continue;
        lineage.push({ ...node, level: current.level });

        for (const parentId of node.parentIds) {
          queue.push({ id: parentId, level: current.level + 1 });
        }
      }

      return lineage;
    }

    draw(ctx, width, height, selectedId) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#f8fbff";
      ctx.fillRect(0, 0, width, height);

      if (!selectedId) {
        ctx.fillStyle = "#64748b";
        ctx.font = "14px Segoe UI";
        ctx.fillText("Select a rabbit in the ecosystem to view lineage.", 20, 30);
        return;
      }

      const lineage = this.getLineage(selectedId, 4);
      if (lineage.length === 0) {
        ctx.fillStyle = "#64748b";
        ctx.font = "14px Segoe UI";
        ctx.fillText("No pedigree data available for selection.", 20, 30);
        return;
      }

      const levels = Math.max(...lineage.map((n) => n.level));
      const levelMap = new Map();
      for (let i = 0; i <= levels; i++) levelMap.set(i, []);
      for (const node of lineage) levelMap.get(node.level).push(node);

      const layout = {
        left: 36,
        right: 30,
        top: 28,
        bottom: 26
      };

      const xGap = levels > 0
        ? Math.max(110, (width - layout.left - layout.right) / levels)
        : 0;

      for (let level = 0; level <= levels; level++) {
        const row = levelMap.get(level);
        const availableHeight = height - layout.top - layout.bottom;
        const rowCount = row.length;
        if (rowCount === 0) continue;

        let yPositions = [];
        if (rowCount === 1) {
          yPositions = [layout.top + availableHeight / 2];
        } else {
          const spacing = Math.max(52, Math.min(92, availableHeight / (rowCount - 1)));
          const used = spacing * (rowCount - 1);
          const startY = layout.top + (availableHeight - used) / 2;
          yPositions = Array.from({ length: rowCount }, (_, idx) => startY + idx * spacing);
        }

        row.forEach((node, idx) => {
          node._x = levels > 0
            ? layout.left + level * xGap
            : width / 2;
          node._y = yPositions[idx];
          node._rowCount = rowCount;
          node._rowIndex = idx;
        });
      }

      const nodeById = new Map(lineage.map((n) => [n.id, n]));
      ctx.strokeStyle = "rgba(100,116,139,0.5)";
      ctx.lineWidth = 1;
      for (const node of lineage) {
        for (const parentId of node.parentIds) {
          const parent = nodeById.get(parentId);
          if (!parent) continue;
          ctx.beginPath();
          ctx.moveTo(node._x, node._y);
          ctx.lineTo(parent._x, parent._y);
          ctx.stroke();
        }
      }

      for (const node of lineage) {
        const isSelected = node.id === selectedId;
        const fur = node.phenotype?.fur || "light";
        const ears = node.phenotype?.ears || "straight";
        const teeth = node.phenotype?.teeth || "short";
        const blink = (Date.now() / 1000 + node._x * 0.01) % 3.2 < 0.16;
        const sprite = getRabbitSprite(fur, ears, teeth, blink);
        const crowded = (node._rowCount || 1) >= 4;
        const spriteW = isSelected ? 52 : (crowded ? 32 : 40);
        const spriteH = isSelected ? 37 : (crowded ? 24 : 29);

        if (sprite?.complete && sprite.naturalWidth > 0) {
          ctx.drawImage(sprite, node._x - spriteW / 2, node._y - spriteH / 2 - 6, spriteW, spriteH);
        } else {
          ctx.fillStyle = isSelected ? "#2563eb" : "#0f766e";
          ctx.beginPath();
          ctx.arc(node._x, node._y, isSelected ? 10 : 8, 0, Math.PI * 2);
          ctx.fill();
        }

        if (isSelected) {
          ctx.strokeStyle = "#1d4ed8";
          ctx.lineWidth = 2;
          const boxW = 58;
          const boxH = 50;
          if (typeof ctx.roundRect === "function") {
            ctx.beginPath();
            ctx.roundRect(node._x - boxW / 2, node._y - boxH / 2, boxW, boxH, 8);
            ctx.stroke();
          } else {
            ctx.strokeRect(node._x - boxW / 2, node._y - boxH / 2, boxW, boxH);
          }
        }

        ctx.fillStyle = "#0f172a";
        ctx.font = "600 11px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText(`G${node.generation}`, node._x, node._y - spriteH / 2 - 10);

        const genotypeText = node.genotypeLabel
          ? `${node.genotypeLabel.fur || ""}${node.genotypeLabel.ears || ""}${node.genotypeLabel.teeth || ""}`
          : "";
        if (genotypeText && (!crowded || isSelected)) {
          ctx.font = crowded ? "11px Segoe UI" : "12px Segoe UI";
          ctx.fillText(genotypeText, node._x, node._y + spriteH / 2 + 14);
        }
      }
    }
  }

  const store = new PedigreeStore();

  window.PedigreeModule = {
    reset(population, generation) {
      store.reset(population, generation);
    },
    registerGeneration(population, generation) {
      store.registerGeneration(population, generation);
    },
    draw(ctx, width, height, selectedId) {
      store.draw(ctx, width, height, selectedId);
    },
    getLineage(selectedId, depth) {
      return store.getLineage(selectedId, depth);
    }
  };
})();
