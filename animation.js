"use strict";

(() => {
  const INITIAL_POPULATION = 20;
  const BASE_HUNGER_LIMIT_MS = 10000;

  const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const rand = (min, max) => min + Math.random() * (max - min);

  function hexToRgb(hex) {
    const normalized = hex.replace("#", "");
    const value = normalized.length === 3
      ? normalized.split("").map((char) => char + char).join("")
      : normalized;
    const num = Number.parseInt(value, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function blendHex(hexA, hexB, ratio) {
    const t = Math.max(0, Math.min(1, ratio));
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const bCh = Math.round(a.b + (b.b - a.b) * t);
    return `rgb(${r}, ${g}, ${bCh})`;
  }

  const rabbitSpriteCache = new Map();
  const wolfSpriteCache = new Map();

  function createSvgImage(svg) {
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    return img;
  }

  function buildRabbitSvg({ fur = "light", ears = "straight", teeth = "short", blink = false, earFlip = false }) {
    const furFill = fur === "dark" ? "#a97b4a" : "#f1efe9";
    const furShade = fur === "dark" ? "#8b643d" : "#d6d4ce";
    const furHighlight = fur === "dark" ? "#c89a66" : "#ffffff";
    const bellyFill = fur === "dark" ? "#f0dfc4" : "#fbf7ef";
    const earInner = fur === "dark" ? "#f0a7a7" : "#efb3b3";
    const eyeIris = fur === "dark" ? "#5b381f" : "#5a4a2a";
    const earHeight = ears === "floppy" ? 26 : 48;
    const earLeftTilt = earFlip ? 3 : 8;
    const earRightTilt = earFlip ? -13 : -7;
    const eyeOpen = !blink;

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="130" viewBox="0 0 200 130">
        <defs>
          <linearGradient id="furGrad" x1="0" x2="1" y1="0.15" y2="0.95">
            <stop offset="0" stop-color="${furHighlight}"/>
            <stop offset="0.55" stop-color="${furFill}"/>
            <stop offset="1" stop-color="${furShade}"/>
          </linearGradient>
          <radialGradient id="eyeShine" cx="0.35" cy="0.2" r="0.9">
            <stop offset="0" stop-color="#ffffff"/>
            <stop offset="1" stop-color="${eyeIris}"/>
          </radialGradient>
        </defs>

        <ellipse cx="90" cy="109" rx="66" ry="11" fill="rgba(15,23,42,0.2)"/>

        <ellipse cx="74" cy="81" rx="15" ry="17" fill="${furShade}"/>
        <ellipse cx="112" cy="81" rx="15" ry="16" fill="${furShade}"/>

        <ellipse cx="98" cy="70" rx="57" ry="34" fill="url(#furGrad)"/>
        <ellipse cx="87" cy="78" rx="30" ry="17" fill="${bellyFill}" opacity="0.95"/>
        <ellipse cx="62" cy="70" rx="24" ry="17" fill="url(#furGrad)"/>
        <ellipse cx="138" cy="61" rx="27" ry="23" fill="url(#furGrad)"/>
        <ellipse cx="161" cy="58" rx="13" ry="11" fill="url(#furGrad)"/>

        <ellipse cx="122" cy="20" rx="9" ry="${earHeight}" fill="url(#furGrad)" transform="rotate(${earLeftTilt} 122 20)"/>
        <ellipse cx="149" cy="18" rx="8" ry="${Math.max(20, earHeight - 3)}" fill="url(#furGrad)" transform="rotate(${earRightTilt} 149 18)"/>
        <ellipse cx="122" cy="21" rx="4" ry="${Math.max(12, Math.round(earHeight * 0.58))}" fill="${earInner}" transform="rotate(${earLeftTilt} 122 21)"/>
        <ellipse cx="149" cy="19" rx="3.6" ry="${Math.max(11, Math.round(earHeight * 0.54))}" fill="${earInner}" transform="rotate(${earRightTilt} 149 19)"/>

        ${eyeOpen
          ? `
            <ellipse cx="136" cy="57" rx="10" ry="11" fill="white"/>
            <ellipse cx="151" cy="58" rx="10" ry="11" fill="white"/>
            <circle cx="136" cy="58" r="5.8" fill="url(#eyeShine)"/>
            <circle cx="151" cy="59" r="5.8" fill="url(#eyeShine)"/>
            <circle cx="136" cy="58" r="2.2" fill="#111827"/>
            <circle cx="151" cy="59" r="2.2" fill="#111827"/>
            <circle cx="133" cy="55" r="1.2" fill="#ffffff"/>
            <circle cx="148" cy="56" r="1.2" fill="#ffffff"/>
          `
          : `
            <path d="M127 58 Q136 53 145 58" stroke="#2a211a" stroke-width="2" fill="none"/>
            <path d="M142 60 Q151 55 160 60" stroke="#2a211a" stroke-width="2" fill="none"/>
          `}

        <ellipse cx="161" cy="67" rx="7" ry="5" fill="#e79ba1"/>
        <path d="M149 67 Q161 63 173 67" stroke="#6d4127" stroke-width="1.8" fill="none"/>
        <path d="M148 71 q-10 4 -18 1" stroke="#6d4127" stroke-width="1.5" fill="none"/>
        <path d="M158 72 q10 4 18 1" stroke="#6d4127" stroke-width="1.5" fill="none"/>
        <path d="M152 63 L138 61" stroke="#5f412d" stroke-width="1.3"/>
        <path d="M152 66 L136 67" stroke="#5f412d" stroke-width="1.3"/>

        ${teeth === "long" ? "<path d='M158 71 v10 M164 71 v10' stroke='#ffffff' stroke-width='2'/>" : ""}

        <path d="M49 64 q-8 -5 -15 -3" stroke="${furShade}" stroke-width="2" fill="none"/>
        <path d="M48 72 q-9 2 -15 7" stroke="${furShade}" stroke-width="2" fill="none"/>
      </svg>
    `;
  }

  function getRabbitSprite(fur, ears, teeth, blink = false, earFlip = false) {
    const key = `${fur}|${ears}|${teeth}|${blink ? 1 : 0}|${earFlip ? 1 : 0}`;
    if (!rabbitSpriteCache.has(key)) {
      rabbitSpriteCache.set(key, createSvgImage(buildRabbitSvg({ fur, ears, teeth, blink, earFlip })));
    }
    return rabbitSpriteCache.get(key);
  }

  function buildWolfSvg(snarl = false) {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="250" height="152" viewBox="0 0 250 152">
        <defs>
          <linearGradient id="wolfBody" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="#8f8c8a"/>
            <stop offset="0.45" stop-color="#666361"/>
            <stop offset="1" stop-color="#4a4847"/>
          </linearGradient>
          <linearGradient id="wolfFurChest" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="#f2f0eb"/>
            <stop offset="1" stop-color="#cfc8be"/>
          </linearGradient>
        </defs>

        <ellipse cx="118" cy="130" rx="90" ry="12" fill="rgba(15,23,42,0.22)"/>

        <path d="M30 88 C56 64, 102 56, 160 63 C188 67, 207 79, 221 93 C210 103, 188 109, 154 111 C96 115, 58 110, 32 99 Z" fill="url(#wolfBody)"/>
        <path d="M67 98 C94 92, 120 90, 149 91 C145 108, 123 117, 96 117 C79 116, 71 108, 67 98 Z" fill="url(#wolfFurChest)"/>

        <path d="M29 89 L7 76 L15 94 Z" fill="#5a5755"/>

        <path d="M182 67 C192 56, 210 53, 223 60 C232 66, 235 79, 225 88 C215 96, 196 95, 183 86 Z" fill="url(#wolfBody)"/>
        <path d="M191 57 L198 36 L209 58 Z" fill="#4f4c4a"/>
        <path d="M209 59 L220 36 L229 63 Z" fill="#4f4c4a"/>

        <path d="M188 76 C197 68, 214 67, 221 74 C215 86, 199 89, 188 85 Z" fill="url(#wolfFurChest)"/>
        <ellipse cx="208" cy="73" rx="7.2" ry="4" fill="#f8f4ea" opacity="0.75"/>
        <circle cx="213" cy="73" r="3.2" fill="#111827"/>
        <circle cx="211" cy="71" r="1.3" fill="#ffffff"/>

        <ellipse cx="232" cy="82" rx="5.2" ry="3.7" fill="#1f2937"/>
        <path d="M226 85 L238 87 L226 89 Z" fill="#ef4444" opacity="0.7"/>
        ${snarl
          ? `
            <path d="M219 87 L223 93 M226 88 L230 95" stroke="#ffffff" stroke-width="1.6"/>
            <path d="M214 75 Q220 70 227 74" stroke="#1f2937" stroke-width="2" fill="none"/>
          `
          : ""}

        <path d="M83 103 v28 M116 104 v26 M150 102 v28 M178 99 v25" stroke="#3f3b38" stroke-width="8" stroke-linecap="round"/>

        <path d="M95 69 L138 72" stroke="#b8b2ad" stroke-width="2" opacity="0.5"/>
        <path d="M87 78 L132 80" stroke="#aba5a0" stroke-width="2" opacity="0.5"/>
        <path d="M107 86 L156 88" stroke="#b4aea9" stroke-width="2" opacity="0.5"/>
      </svg>
    `;
  }

  function getWolfSprite(snarl = false) {
    const key = snarl ? "snarl" : "default";
    if (!wolfSpriteCache.has(key)) {
      wolfSpriteCache.set(key, createSvgImage(buildWolfSvg(snarl)));
    }
    return wolfSpriteCache.get(key);
  }

  class Rabbit {
    constructor(model, x, y, habitat = null) {
      this.id = model.id;
      this.fur = model.fur;
      this.ears = model.ears;
      this.teeth = model.teeth;
      this.genotypeLabel = model.genotypeLabel || "";

      this.x = x;
      this.y = y;
      this.baseSpeed = rand(0.8, 1.5);
      this.velocityX = (Math.random() < 0.5 ? -1 : 1) * this.baseSpeed;
      this.velocityY = 0;
      this.gravity = 0.35;
      this.size = rand(13.5, 19);
      this.baseSize = this.size;
      this.alive = true;
      this.hungerMs = 0;
      this.animOffset = Math.random() * Math.PI * 2;

      this.habitat = habitat || {
        laneY: y,
        minX: 12,
        maxX: 1000
      };
    }

    distanceTo(target) {
      return Math.hypot(this.x - target.x, this.y - target.y);
    }

    updateMovement(dt, canvasWidth, nearestPlant, foodStressEnabled) {
      if (!this.alive) return;

      const laneY = this.habitat?.laneY ?? this.y;
      const minX = this.habitat?.minX ?? this.size;
      const maxX = this.habitat?.maxX ?? (canvasWidth - this.size);

      if (foodStressEnabled) {
        this.hungerMs += dt * 1000;
      } else {
        this.hungerMs = 0;
      }

      if (nearestPlant) {
        const dir = nearestPlant.x >= this.x ? 1 : -1;
        const speedBoost = foodStressEnabled ? 1.2 : 1;
        const targetSpeed = this.baseSpeed * speedBoost;
        this.velocityX = dir * targetSpeed;
      } else if (Math.random() < 0.01) {
        this.velocityX = -this.velocityX;
      }

      const maxSpeed = foodStressEnabled ? 2.2 : 1.8;
      if (this.velocityX > maxSpeed) this.velocityX = maxSpeed;
      if (this.velocityX < -maxSpeed) this.velocityX = -maxSpeed;

      this.x += this.velocityX;

      if (Math.random() < 0.0038 && this.y >= laneY - 0.2) {
        this.velocityY = -4.8;
      }

      this.velocityY += this.gravity;
      this.y += this.velocityY;

      if (this.y > laneY) {
        this.y = laneY;
        this.velocityY = 0;
      }

      if (this.x < minX + this.size) {
        this.x = minX + this.size;
        this.velocityX = Math.abs(this.baseSpeed);
        if (nearestPlant && nearestPlant.x < minX + this.size + 6) {
          this.velocityX = Math.abs(this.baseSpeed) * 0.9;
        }
      }

      if (this.x > maxX - this.size) {
        this.x = maxX - this.size;
        this.velocityX = -Math.abs(this.baseSpeed);
        if (nearestPlant && nearestPlant.x > maxX - this.size - 6) {
          this.velocityX = -Math.abs(this.baseSpeed) * 0.9;
        }
      }
    }

    draw(ctx, densityScale, isSelected, showLabels, animationTick = 0) {
      if (!this.alive) return;

      const drawSize = this.baseSize * densityScale;
      const bodyColor = this.fur === "light" ? "#e9ddc8" : "#6b4d38";
      const earInnerColor = this.fur === "light" ? "#d8a7a7" : "#8f5f5f";
      const facing = this.velocityX >= 0 ? 1 : -1;
      const blink = Math.sin(animationTick * 0.018 + this.animOffset) > 0.985;
      const earFlip = Math.sin(animationTick * 0.006 + this.animOffset * 0.7) > 0;
      const rabbitSprite = getRabbitSprite(this.fur, this.ears, this.teeth, blink, earFlip);

      ctx.save();
      ctx.translate(this.x, this.y);

      if (rabbitSprite?.complete && rabbitSprite.naturalWidth > 0) {
        ctx.fillStyle = "rgba(15, 23, 42, 0.16)";
        ctx.beginPath();
        ctx.ellipse(0, drawSize * 0.92, drawSize * 1.35, drawSize * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.scale(facing, 1);
        const spriteW = drawSize * 3.2;
        const spriteH = drawSize * 2.2;
        ctx.drawImage(rabbitSprite, -spriteW * 0.7, -spriteH * 0.8, spriteW, spriteH);
        ctx.restore();

        if (isSelected) {
          ctx.strokeStyle = "#2563eb";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, -drawSize * 0.05, drawSize * 1.35, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (showLabels) {
          ctx.fillStyle = "#0f172a";
          ctx.font = "11px system-ui, -apple-system, Segoe UI, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`${this.fur}, ${this.ears}, ${this.teeth}`, 0, -drawSize - 18);
          if (this.genotypeLabel) {
            const genotypeText = typeof this.genotypeLabel === "string"
              ? this.genotypeLabel
              : `${this.genotypeLabel.fur || ""} ${this.genotypeLabel.ears || ""} ${this.genotypeLabel.teeth || ""}`.trim();
            ctx.fillStyle = "#334155";
            ctx.fillText(genotypeText, 0, -drawSize - 6);
          }
        }

        ctx.restore();
        return;
      }

      ctx.fillStyle = "rgba(15, 23, 42, 0.16)";
      ctx.beginPath();
      ctx.ellipse(0, drawSize * 0.92, drawSize * 1.35, drawSize * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.scale(facing, 1);

      ctx.fillStyle = "#6b4f3b";
      ctx.beginPath();
      ctx.ellipse(-drawSize * 0.35, drawSize * 0.6, drawSize * 0.2, drawSize * 0.33, 0, 0, Math.PI * 2);
      ctx.ellipse(drawSize * 0.25, drawSize * 0.58, drawSize * 0.2, drawSize * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, drawSize * 1.15, drawSize * 0.82, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(-drawSize * 1.05, -drawSize * 0.05, drawSize * 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(drawSize * 0.95, -drawSize * 0.24, drawSize * 0.46, 0, Math.PI * 2);
      ctx.fill();

      const earLen = this.ears === "floppy" ? drawSize * 0.45 : drawSize * 0.88;
      ctx.beginPath();
      ctx.ellipse(drawSize * 0.72, -drawSize * 0.95, drawSize * 0.16, earLen, 0.08, 0, Math.PI * 2);
      ctx.ellipse(drawSize * 1.03, -drawSize * 0.98, drawSize * 0.15, earLen * (this.ears === "floppy" ? 1 : 0.92), -0.05, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = earInnerColor;
      ctx.beginPath();
      ctx.ellipse(drawSize * 0.73, -drawSize * 0.9, drawSize * 0.07, earLen * 0.55, 0.08, 0, Math.PI * 2);
      ctx.ellipse(drawSize * 1.03, -drawSize * 0.92, drawSize * 0.06, earLen * 0.52, -0.05, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.arc(drawSize * 1.08, -drawSize * 0.3, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#2f1f17";
      ctx.beginPath();
      ctx.arc(drawSize * 1.32, -drawSize * 0.16, 1.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(drawSize * 1.22, -drawSize * 0.1);
      ctx.lineTo(drawSize * 1.32, -drawSize * 0.06);
      ctx.lineTo(drawSize * 1.42, -drawSize * 0.1);
      ctx.stroke();

      if (this.teeth === "long") {
        ctx.strokeStyle = "#f8fafc";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(drawSize * 1.25, -drawSize * 0.03);
        ctx.lineTo(drawSize * 1.25, drawSize * 0.15);
        ctx.moveTo(drawSize * 1.35, -drawSize * 0.03);
        ctx.lineTo(drawSize * 1.35, drawSize * 0.15);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(17,24,39,0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(drawSize * 1.34, -drawSize * 0.16);
      ctx.lineTo(drawSize * 1.52, -drawSize * 0.2);
      ctx.moveTo(drawSize * 1.34, -drawSize * 0.12);
      ctx.lineTo(drawSize * 1.54, -drawSize * 0.12);
      ctx.stroke();

      ctx.restore();

      if (isSelected) {
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -drawSize * 0.05, drawSize * 1.35, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (showLabels) {
        ctx.fillStyle = "#0f172a";
        ctx.font = "11px system-ui, -apple-system, Segoe UI, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${this.fur}, ${this.ears}, ${this.teeth}`, 0, -drawSize - 18);
        if (this.genotypeLabel) {
          const genotypeText = typeof this.genotypeLabel === "string"
            ? this.genotypeLabel
            : `${this.genotypeLabel.fur || ""} ${this.genotypeLabel.ears || ""} ${this.genotypeLabel.teeth || ""}`.trim();
          ctx.fillStyle = "#334155";
          ctx.fillText(genotypeText, 0, -drawSize - 6);
        }
      }

      ctx.restore();
    }
  }

  class Wolf {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.speed = rand(1.6, 2.2);
      this.size = rand(14, 18);
      this.dir = Math.random() < 0.5 ? -1 : 1;
      this.targetY = y;
      this.isHunting = false;
    }

    update(rabbits, width, landTop, landBottom) {
      let killedRabbitId = null;
      const aliveRabbits = rabbits.filter((r) => r.alive);

      this.isHunting = aliveRabbits.length > 0;

      if (aliveRabbits.length === 0) {
        this.x += this.speed * this.dir;
        if (Math.random() < 0.015) {
          this.dir *= -1;
        }

        if (Math.random() < 0.02) {
          this.targetY = rand(landTop, landBottom);
        }
      } else {
        let nearest = aliveRabbits[0];
        let nearestDist = Infinity;
        for (const rabbit of aliveRabbits) {
          const dist = Math.hypot(rabbit.x - this.x, rabbit.y - this.y);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = rabbit;
          }
        }

        this.dir = nearest.x >= this.x ? 1 : -1;
        this.x += this.speed * this.dir;
        this.targetY = nearest.y;

        const verticalStep = Math.max(0.55, this.speed * 0.42);
        if (this.targetY > this.y) this.y += verticalStep;
        if (this.targetY < this.y) this.y -= verticalStep;

        if (Math.hypot(nearest.x - this.x, nearest.y - this.y) < this.size * 0.85 + nearest.size * 0.95) {
          nearest.alive = false;
          killedRabbitId = nearest.id;
        }
      }

      if (aliveRabbits.length === 0) {
        const cruiseStep = Math.max(0.3, this.speed * 0.25);
        if (this.targetY > this.y) this.y += cruiseStep;
        if (this.targetY < this.y) this.y -= cruiseStep;
      }

      if (this.x < this.size) {
        this.x = this.size;
        this.dir = 1;
      }

      if (this.x > width - this.size) {
        this.x = width - this.size;
        this.dir = -1;
      }

      if (this.y < landTop) this.y = landTop;
      if (this.y > landBottom) this.y = landBottom;

      return killedRabbitId;
    }

    draw(ctx, animationTick = 0) {
      const facing = this.dir >= 0 ? 1 : -1;
      const snarl = this.isHunting && Math.sin(animationTick * 0.014 + this.x * 0.02) > 0;
      const wolfSprite = getWolfSprite(snarl);

      ctx.save();
      ctx.translate(this.x, this.y);

      if (wolfSprite?.complete && wolfSprite.naturalWidth > 0) {
        ctx.fillStyle = "rgba(15, 23, 42, 0.22)";
        ctx.beginPath();
        ctx.ellipse(0, -2, this.size * 1.2, this.size * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.scale(facing, 1);
        const spriteW = this.size * 3.2;
        const spriteH = this.size * 1.9;
        ctx.drawImage(wolfSprite, -spriteW * 0.58, -spriteH * 0.95, spriteW, spriteH);
        ctx.restore();
        return;
      }

      ctx.scale(facing, 1);

      ctx.fillStyle = "rgba(15, 23, 42, 0.22)";
      ctx.beginPath();
      ctx.ellipse(0, -2, this.size * 1.2, this.size * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#6b7280";
      ctx.beginPath();
      ctx.ellipse(-2, -11, this.size * 1.25, this.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-this.size * 1.2, -12);
      ctx.lineTo(-this.size * 1.85, -18);
      ctx.lineTo(-this.size * 1.6, -11);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#4b5563";
      ctx.beginPath();
      ctx.ellipse(this.size * 1.02, -12, this.size * 0.58, this.size * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(this.size * 0.78, -this.size * 0.94);
      ctx.lineTo(this.size * 0.98, -this.size * 1.45);
      ctx.lineTo(this.size * 1.18, -this.size * 0.9);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(this.size * 1.14, -this.size * 0.9);
      ctx.lineTo(this.size * 1.35, -this.size * 1.4);
      ctx.lineTo(this.size * 1.5, -this.size * 0.8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#9ca3af";
      ctx.beginPath();
      ctx.ellipse(this.size * 1.18, -this.size * 0.96, this.size * 0.2, this.size * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#1f2937";
      ctx.beginPath();
      ctx.arc(this.size * 1.28, -12, 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.arc(this.size * 1.55, -11, 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.moveTo(this.size * 1.47, -9);
      ctx.lineTo(this.size * 1.62, -8.4);
      ctx.lineTo(this.size * 1.47, -7.8);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-this.size * 0.55, -5);
      ctx.lineTo(-this.size * 0.55, 2);
      ctx.moveTo(this.size * 0.05, -5);
      ctx.lineTo(this.size * 0.05, 2);
      ctx.moveTo(this.size * 0.62, -5);
      ctx.lineTo(this.size * 0.62, 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  class Plant {
    constructor(x, groundY, type) {
      this.x = x;
      this.groundY = groundY;
      this.type = type;
      this.height = type === "tough" ? rand(20, 34) : rand(16, 27);
      this.alive = true;
    }

    draw(ctx) {
      if (!this.alive) return;
      ctx.save();
      ctx.translate(this.x, this.groundY);

      if (this.type === "tough") {
        ctx.strokeStyle = "#3f2a1a";
        ctx.lineWidth = 2.6;
      } else {
        ctx.strokeStyle = "#0f7a37";
        ctx.lineWidth = 2.1;
      }

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -this.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -this.height * 0.68);
      ctx.lineTo(-6, -this.height * 0.42);
      ctx.moveTo(0, -this.height * 0.62);
      ctx.lineTo(6, -this.height * 0.36);
      ctx.stroke();

      ctx.fillStyle = this.type === "tough" ? "#2f9a7c" : "#37c06a";
      ctx.beginPath();
      ctx.arc(0, -this.height, 2.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  class EcosystemAnimator {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.population = [];
      this.wolves = [];
      this.plants = [];
      this.groundY = 0;
      this.animationId = 0;
      this.lastFrameTs = 0;
      this.lastGenerationSeen = -1;
      this.lastPopulationSignature = "";

      this.wolvesEnabled = false;
      this.limitedFoodEnabled = false;
      this.toughFoodEnabled = false;
      this.selectedRabbitId = null;
      this.showLabels = false;
      this.extinctionReason = "";
      this.statusNode = null;
      this.dayAmount = 1;
    }

    getLaneCount() {
      return 5;
    }

    habitatForIndex(index, totalCount = 1) {
      const lanes = this.getLaneCount();
      const lane = index % lanes;
      const laneRatio = lane / Math.max(1, lanes - 1);

      const laneY = this.groundY - 18 - laneRatio * 150;
      const sideInset = 16 + laneRatio * 90;

      const width = Math.max(120, this.canvas.width - sideInset * 2);
      const slotRatio = (index + 0.5) / Math.max(1, totalCount);
      const jitter = rand(-18, 18);
      const x = sideInset + slotRatio * width + jitter;

      return {
        x: Math.min(this.canvas.width - sideInset - 10, Math.max(sideInset + 10, x)),
        laneY,
        minX: sideInset,
        maxX: this.canvas.width - sideInset
      };
    }

    randomHabitatY() {
      return this.groundY - rand(8, 154);
    }

    initCanvas() {
      this.canvas = document.getElementById("ecosystemCanvas");
      if (!this.canvas) return false;

      this.ctx = this.canvas.getContext("2d");
      if (!this.ctx) return false;

      if (!this.canvas.width || this.canvas.width < 10) this.canvas.width = 800;
      if (!this.canvas.height || this.canvas.height < 10) this.canvas.height = 400;

      this.groundY = this.canvas.height - 22;
      return true;
    }

    getToggleState() {
      this.wolvesEnabled = !!document.getElementById("wolvesToggle")?.checked;
      this.limitedFoodEnabled = !!document.getElementById("limitedFoodToggle")?.checked;
      this.toughFoodEnabled = !!document.getElementById("toughFoodToggle")?.checked;
      this.applyPageTheme();
    }

    applyPageTheme() {
      const body = document.body;
      if (!body) return;
      const useDesert = this.limitedFoodEnabled;
      body.classList.toggle("theme-desert", useDesert);
      body.classList.toggle("theme-forest", !useDesert);
    }

    syncPopulationFromSimulation() {
      const simulation = window.SimulationModule;
      if (!simulation || typeof simulation.getPopulation !== "function" || typeof simulation.getGeneration !== "function") {
        return;
      }

      const generation = simulation.getGeneration();
      const models = simulation.getPopulation();
      const signature = `${generation}|${models.length}|${models.map((item) => item.id).join(",")}`;
      if (signature === this.lastPopulationSignature) return;

      const existingById = new Map(this.population.map((rabbit) => [rabbit.id, rabbit]));
      this.population = models.map((model, index) => {
        const existing = existingById.get(model.id);
        if (existing) {
          existing.fur = model.phenotype?.fur || existing.fur;
          existing.ears = model.phenotype?.ears || existing.ears;
          existing.teeth = model.phenotype?.teeth || existing.teeth;
          existing.genotypeLabel = model.genotypeLabel || existing.genotypeLabel;
          if (!existing.habitat) {
            const fallbackHabitat = this.habitatForIndex(index, models.length);
            existing.habitat = {
              laneY: fallbackHabitat.laneY,
              minX: fallbackHabitat.minX,
              maxX: fallbackHabitat.maxX
            };
            existing.y = fallbackHabitat.laneY;
          }
          return existing;
        }

        const habitat = this.habitatForIndex(index, models.length);

        return new Rabbit(
          {
            id: model.id,
            fur: model.phenotype?.fur || "light",
            ears: model.phenotype?.ears || "straight",
            teeth: model.phenotype?.teeth || "short",
            genotypeLabel: model.genotypeLabel || ""
          },
          habitat.x,
          habitat.laneY,
          {
            laneY: habitat.laneY,
            minX: habitat.minX,
            maxX: habitat.maxX
          }
        );
      });
      this.lastGenerationSeen = generation;
      this.lastPopulationSignature = signature;
      this.extinctionReason = "";
      this.setStatus(`Population: ${this.population.length}.`);

      if (this.wolvesEnabled) this.spawnWolves();
      this.spawnPlants();
    }

    ensureStatusNode() {
      if (this.statusNode) return;
      this.statusNode = document.getElementById("statusMessage");
      if (this.statusNode) return;

      const topControls = document.querySelector(".top-controls");
      if (!topControls) return;

      this.statusNode = document.createElement("div");
      this.statusNode.id = "statusMessage";
      this.statusNode.className = "generation-indicator";
      this.statusNode.style.gridColumn = "1 / -1";
      this.statusNode.style.textAlign = "left";
      this.statusNode.textContent = "Ready.";
      topControls.appendChild(this.statusNode);
    }

    setStatus(message) {
      this.ensureStatusNode();
      if (this.statusNode) {
        this.statusNode.textContent = message;
      }
    }

    createInitialPopulation() {
      const furOptions = ["light", "dark"];
      const earsOptions = ["straight", "floppy"];
      const teethOptions = ["short", "long"];

      this.population = Array.from({ length: INITIAL_POPULATION }, (_, index) => {
        const habitat = this.habitatForIndex(index, INITIAL_POPULATION);
        const model = {
          id: `visual-${index}-${Date.now()}`,
          fur: randomChoice(furOptions),
          ears: randomChoice(earsOptions),
          teeth: randomChoice(teethOptions)
        };
        return new Rabbit(model, habitat.x, habitat.laneY, {
          laneY: habitat.laneY,
          minX: habitat.minX,
          maxX: habitat.maxX
        });
      });
    }

    spawnWolves() {
      const targetCount = Math.floor(rand(2, 4));
      this.wolves = Array.from({ length: targetCount }, () => new Wolf(
        rand(16, this.canvas.width - 16),
        rand(this.groundY - 150, this.groundY - 12)
      ));
    }

    spawnPlants() {
      const baseCount = this.limitedFoodEnabled ? Math.floor(rand(7, 11)) : Math.floor(rand(14, 24));
      const toughChance = this.toughFoodEnabled ? 1 : 0.25;

      this.plants = Array.from({ length: baseCount }, () => new Plant(
        rand(10, this.canvas.width - 10),
        this.randomHabitatY() + 11,
        Math.random() < toughChance ? "tough" : "soft"
      ));
    }

    bindToggleListeners() {
      ["wolvesToggle", "limitedFoodToggle", "toughFoodToggle"].forEach((id) => {
        const node = document.getElementById(id);
        node?.addEventListener("change", () => {
          this.getToggleState();
          if (id === "wolvesToggle") {
            if (this.wolvesEnabled) this.spawnWolves();
            else this.wolves = [];
          }
          if (id === "limitedFoodToggle" || id === "toughFoodToggle") {
            this.spawnPlants();
          }

          if (this.population.length === 0) {
            this.extinctionReason = this.wolvesEnabled
              ? "No rabbits left: wolves hunted them."
              : "No rabbits left. Press Reset, then Add Mate.";
            this.setStatus(this.extinctionReason);
          }
        });
      });

      const rightPanel = document.querySelector(".right-panel");
      if (rightPanel && !document.getElementById("labelsToggle")) {
        const section = document.createElement("section");
        section.className = "sub-panel";
        section.innerHTML = `
          <h3>Display</h3>
          <div class="toggle-list">
            <label><input type="checkbox" id="labelsToggle" /> Show Labels</label>
          </div>
        `;
        rightPanel.appendChild(section);
      }

      document.getElementById("labelsToggle")?.addEventListener("change", (event) => {
        this.showLabels = !!event.target.checked;
      });

      window.addEventListener("simulation:population-changed", (event) => {
        const reason = event?.detail?.reason || "update";
        this.lastPopulationSignature = "";
        this.syncPopulationFromSimulation();

        if (reason === "add-mate") {
          this.setStatus(`Mate added. Population: ${this.population.length}. Press Play.`);
        }
      });

      this.canvas?.addEventListener("click", (event) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * this.canvas.width;
        const y = ((event.clientY - rect.top) / rect.height) * this.canvas.height;

        let nearest = null;
        let nearestDist = 16;
        for (const rabbit of this.population) {
          if (!rabbit.alive) continue;
          const dist = Math.hypot(rabbit.x - x, rabbit.y - y);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = rabbit;
          }
        }

        this.selectedRabbitId = nearest ? nearest.id : null;
        window.UIModule?.setSelectedRabbit?.(this.selectedRabbitId);
      });
    }

    drawEnvironmentBackground() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const isDesert = this.limitedFoodEnabled;
      const isHarsh = this.toughFoodEnabled;
      const generation = window.SimulationModule?.getGeneration?.() ?? 0;
      const cycle = (((generation % 12) / 12) + ((this.lastFrameTs || 0) * 0.000015)) % 1;
      const dayAmount = (Math.sin(cycle * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      this.dayAmount = dayAmount;

      const daySkyTop = isDesert ? "#7eb9dd" : "#3da0d8";
      const daySkyBottom = isDesert ? "#d7ebf6" : "#c4ecff";
      const nightSkyTop = isDesert ? "#1e2f45" : "#162a40";
      const nightSkyBottom = isDesert ? "#314a63" : "#2b4762";

      const skyTop = blendHex(nightSkyTop, daySkyTop, dayAmount);
      const skyBottom = blendHex(nightSkyBottom, daySkyBottom, dayAmount);
      const hillBack = isDesert ? "#9b744a" : "#7a8f64";
      const hillMid = isDesert ? "#8d633f" : "#6f8456";
      const groundMain = isDesert ? "#b78957" : "#9b7447";
      const groundEdge = isDesert ? "#94663d" : "#85572f";
      const accentPlant = isHarsh ? "#4d7b5f" : "#4ba64b";

      const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.groundY + 20);
      skyGradient.addColorStop(0, skyTop);
      skyGradient.addColorStop(1, skyBottom);
      this.ctx.fillStyle = skyGradient;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.drawCelestial(dayAmount, isDesert);
      if (dayAmount < 0.45) {
        this.drawStars(1 - (dayAmount / 0.45));
      }

      this.ctx.fillStyle = "rgba(255,255,255,0.9)";
      this.drawCloud(120, 36, 1.05);
      this.drawCloud(this.canvas.width * 0.48, 30, 0.92);
      this.drawCloud(this.canvas.width - 140, 42, 0.8);

      this.ctx.fillStyle = hillBack;
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.groundY - 62);
      this.ctx.quadraticCurveTo(this.canvas.width * 0.17, this.groundY - 114, this.canvas.width * 0.34, this.groundY - 66);
      this.ctx.quadraticCurveTo(this.canvas.width * 0.52, this.groundY - 122, this.canvas.width * 0.72, this.groundY - 76);
      this.ctx.quadraticCurveTo(this.canvas.width * 0.88, this.groundY - 120, this.canvas.width, this.groundY - 70);
      this.ctx.lineTo(this.canvas.width, this.groundY - 22);
      this.ctx.lineTo(0, this.groundY - 26);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.fillStyle = hillMid;
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.groundY - 34);
      this.ctx.quadraticCurveTo(this.canvas.width * 0.2, this.groundY - 84, this.canvas.width * 0.42, this.groundY - 42);
      this.ctx.quadraticCurveTo(this.canvas.width * 0.58, this.groundY - 88, this.canvas.width * 0.8, this.groundY - 48);
      this.ctx.quadraticCurveTo(this.canvas.width * 0.92, this.groundY - 72, this.canvas.width, this.groundY - 40);
      this.ctx.lineTo(this.canvas.width, this.groundY + 12);
      this.ctx.lineTo(0, this.groundY + 10);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.fillStyle = groundEdge;
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.groundY - 18);
      this.ctx.quadraticCurveTo(this.canvas.width * 0.2, this.groundY - 54, this.canvas.width * 0.42, this.groundY - 28);
      this.ctx.quadraticCurveTo(this.canvas.width * 0.6, this.groundY - 58, this.canvas.width, this.groundY - 22);
      this.ctx.lineTo(this.canvas.width, this.groundY + 14);
      this.ctx.lineTo(0, this.groundY + 14);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.fillStyle = groundMain;
      this.ctx.fillRect(0, this.groundY + 10, this.canvas.width, this.canvas.height - (this.groundY + 10));

      this.ctx.beginPath();
      this.ctx.moveTo(0, this.groundY + 10);
      this.ctx.lineTo(this.canvas.width, this.groundY + 10);
      this.ctx.strokeStyle = "rgba(89, 56, 31, 0.65)";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      for (let i = 0; i < 42; i++) {
        const x = (i / 31) * this.canvas.width + (Math.sin(i * 12.37) * 4);
        const y = this.groundY + 8 + Math.sin(i * 0.9) * 2;
        this.ctx.fillStyle = accentPlant;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
      }

      for (let i = 0; i < 16; i++) {
        const x = (i + 0.4) * (this.canvas.width / 16);
        const y = this.groundY - 8 - ((i % 3) * 6);
        this.drawGroundTuft(x, y, isHarsh, isDesert);
      }

      for (let i = 0; i < 10; i++) {
        const x = rand(12, this.canvas.width - 12);
        const y = this.groundY + rand(2, 12);
        this.drawPebble(x, y, isDesert);
      }
    }

    drawSun(isDesert) {
      const c = this.ctx;
      const sunX = this.canvas.width - 92;
      const sunY = 56;
      const glow = c.createRadialGradient(sunX, sunY, 6, sunX, sunY, 34);
      glow.addColorStop(0, isDesert ? "rgba(255, 226, 138, 0.95)" : "rgba(255, 230, 160, 0.9)");
      glow.addColorStop(1, "rgba(255, 226, 138, 0)");

      c.fillStyle = glow;
      c.beginPath();
      c.arc(sunX, sunY, 34, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = isDesert ? "#ffd166" : "#ffe08a";
      c.beginPath();
      c.arc(sunX, sunY, 15, 0, Math.PI * 2);
      c.fill();
    }

    drawCelestial(dayAmount, isDesert) {
      const c = this.ctx;
      const x = this.canvas.width - 92;
      const y = 56;

      if (dayAmount >= 0.5) {
        this.drawSun(isDesert);
        return;
      }

      const moonGlow = c.createRadialGradient(x, y, 6, x, y, 30);
      moonGlow.addColorStop(0, "rgba(230, 235, 255, 0.85)");
      moonGlow.addColorStop(1, "rgba(230, 235, 255, 0)");

      c.fillStyle = moonGlow;
      c.beginPath();
      c.arc(x, y, 30, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = "#eef2ff";
      c.beginPath();
      c.arc(x, y, 12, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = "rgba(43, 71, 98, 0.8)";
      c.beginPath();
      c.arc(x + 5, y - 2, 10, 0, Math.PI * 2);
      c.fill();
    }

    drawStars(intensity) {
      const c = this.ctx;
      const alpha = Math.max(0, Math.min(0.45, intensity * 0.45));
      if (alpha <= 0.01) return;

      c.save();
      c.fillStyle = `rgba(255,255,255,${alpha})`;
      const starCount = 28;
      for (let i = 0; i < starCount; i++) {
        const x = ((i * 97.37) % this.canvas.width);
        const y = 14 + ((i * 53.91) % 130);
        c.beginPath();
        c.arc(x, y, (i % 3 === 0 ? 1.6 : 1.1), 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }

    drawGroundTuft(x, y, isHarsh, isDesert) {
      const c = this.ctx;
      c.save();
      c.translate(x, y);
      c.strokeStyle = isHarsh ? "#2f7e63" : (isDesert ? "#5f8a42" : "#2f9e44");
      c.lineWidth = isHarsh ? 1.8 : 1.5;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(-3, -8);
      c.moveTo(0, 0);
      c.lineTo(3, -8);
      c.moveTo(0, 0);
      c.lineTo(0, -10);
      c.stroke();
      c.restore();
    }

    drawPebble(x, y, isDesert) {
      const c = this.ctx;
      c.fillStyle = isDesert ? "rgba(103, 76, 52, 0.42)" : "rgba(92, 82, 71, 0.32)";
      c.beginPath();
      c.ellipse(x, y, rand(1.8, 3.3), rand(1.2, 2.4), rand(0, Math.PI), 0, Math.PI * 2);
      c.fill();
    }

    drawCloud(x, y, scale = 1) {
      const c = this.ctx;
      c.save();
      c.translate(x, y);
      c.scale(scale, scale);
      c.beginPath();
      c.arc(-18, 0, 11, 0, Math.PI * 2);
      c.arc(-4, -8, 14, 0, Math.PI * 2);
      c.arc(14, -2, 10, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    drawSceneHud() {
      const simulation = window.SimulationModule;
      if (!simulation || typeof simulation.getPopulationSnapshot !== "function") return;

      const snapshot = simulation.getPopulationSnapshot();
      const total = Math.max(1, snapshot.total || 0);
      const lightRatio = (snapshot.lightFur || 0) / total;
      const darkRatio = 1 - lightRatio;

      const cx = this.canvas.width / 2;
      const cy = 24;
      const radius = 17;

      const phase = this.dayAmount >= 0.62
        ? { label: "Day", bg: "rgba(255, 240, 180, 0.9)", text: "#7c4a03" }
        : this.dayAmount <= 0.38
          ? { label: "Night", bg: "rgba(180, 196, 255, 0.85)", text: "#1e3a8a" }
          : { label: "Dusk", bg: "rgba(252, 211, 153, 0.9)", text: "#7c2d12" };

      this.ctx.save();
      this.ctx.fillStyle = "rgba(255,255,255,0.72)";
      if (typeof this.ctx.roundRect === "function") {
        this.ctx.beginPath();
        this.ctx.roundRect(cx - 56, 4, 112, 42, 10);
        this.ctx.fill();
      } else {
        this.ctx.fillRect(cx - 56, 4, 112, 42);
      }

      let start = -Math.PI / 2;
      const slices = [
        { ratio: lightRatio, color: "#f472b6" },
        { ratio: darkRatio, color: "#22c55e" }
      ];

      for (const slice of slices) {
        const angle = slice.ratio * Math.PI * 2;
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy);
        this.ctx.arc(cx, cy, radius, start, start + angle);
        this.ctx.closePath();
        this.ctx.fillStyle = slice.color;
        this.ctx.fill();
        start += angle;
      }

      this.ctx.strokeStyle = "#111827";
      this.ctx.lineWidth = 1.1;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.fillStyle = "#0f172a";
      this.ctx.textAlign = "center";
      this.ctx.font = "600 22px Segoe UI";
      this.ctx.fillText(`Generation ${snapshot.generation}`, cx + 80, cy + 7);

      const badgeX = cx + 190;
      const badgeY = cy - 16;
      const badgeW = 64;
      const badgeH = 24;

      this.ctx.fillStyle = phase.bg;
      if (typeof this.ctx.roundRect === "function") {
        this.ctx.beginPath();
        this.ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8);
        this.ctx.fill();
      } else {
        this.ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
      }

      this.ctx.fillStyle = phase.text;
      this.ctx.font = "600 13px Segoe UI";
      this.ctx.textAlign = "center";
      this.ctx.fillText(phase.label, badgeX + badgeW / 2, badgeY + 16);
      this.ctx.restore();
    }

    getNearestPlant(rabbit) {
      let nearest = null;
      let dist = Infinity;
      for (const plant of this.plants) {
        if (!plant.alive) continue;
        const d = Math.hypot(plant.x - rabbit.x, plant.groundY - rabbit.y);
        if (d < dist) {
          dist = d;
          nearest = plant;
        }
      }
      return nearest;
    }

    resolveFoodInteractions(dt) {
      if (!this.limitedFoodEnabled && !this.toughFoodEnabled) {
        return;
      }

      const foodStressEnabled = this.limitedFoodEnabled || this.toughFoodEnabled;

      const reductionChance = 0.0025;
      if (this.plants.length > 2 && Math.random() < reductionChance) {
        const idx = Math.floor(Math.random() * this.plants.length);
        this.plants.splice(idx, 1);
      }

      const diedFromFoodIds = [];
      for (const rabbit of this.population) {
        if (!rabbit.alive) continue;

        const nearestPlant = this.getNearestPlant(rabbit);
        rabbit.updateMovement(dt, this.canvas.width, nearestPlant, foodStressEnabled);

        if (nearestPlant && Math.hypot(rabbit.x - nearestPlant.x, rabbit.y - nearestPlant.groundY) < rabbit.size + 10) {
          const canEat = !this.toughFoodEnabled || nearestPlant.type === "soft" || rabbit.teeth === "long";
          if (canEat) {
            rabbit.hungerMs = 0;
            nearestPlant.alive = false;
          }
        }

        const hungerLimit = this.toughFoodEnabled && rabbit.teeth === "short"
          ? BASE_HUNGER_LIMIT_MS * 0.65
          : BASE_HUNGER_LIMIT_MS;

        if (rabbit.hungerMs > hungerLimit) {
          rabbit.alive = false;
          diedFromFoodIds.push(rabbit.id);
        }
      }

      if (diedFromFoodIds.length > 0) {
        const simulation = window.SimulationModule;
        if (simulation && typeof simulation.removeOrganismById === "function") {
          for (const id of diedFromFoodIds) {
            simulation.removeOrganismById(id, "food-starvation");
          }
        }
      }

      this.population = this.population.filter((rabbit) => rabbit.alive);
      if (this.population.length === 0) {
        if (this.limitedFoodEnabled && this.toughFoodEnabled) {
          this.extinctionReason = "No rabbits left: limited + tough food conditions were too harsh.";
        } else if (this.limitedFoodEnabled) {
          this.extinctionReason = "No rabbits left: limited food caused starvation.";
        } else if (this.toughFoodEnabled) {
          this.extinctionReason = "No rabbits left: tough food could not be eaten effectively.";
        }
      }

      this.plants = this.plants.filter((plant) => plant.alive);
      if (this.plants.length < 2) {
        this.spawnPlants();
      }
    }

    resolveMovementNoFood(dt) {
      for (const rabbit of this.population) {
        rabbit.updateMovement(dt, this.canvas.width, null, false);
      }
    }

    resolveWolfInteractions() {
      if (!this.wolvesEnabled) return;
      if (this.wolves.length === 0) this.spawnWolves();

      const killedIds = [];
      for (const wolf of this.wolves) {
        const killedId = wolf.update(this.population, this.canvas.width, this.groundY - 160, this.groundY - 8);
        if (killedId) killedIds.push(killedId);
      }

      this.population = this.population.filter((rabbit) => rabbit.alive);
      if (killedIds.length > 0) {
        const simulation = window.SimulationModule;
        if (simulation && typeof simulation.removeOrganismById === "function") {
          for (const id of killedIds) {
            simulation.removeOrganismById(id, "wolf-predation");
          }
        }
      }

      if (this.population.length === 0) {
        this.extinctionReason = "No rabbits left: wolves hunted them.";
        window.SimulationModule?.ensureExtinctionNotice?.("wolf-predation");
      }
    }

    drawWorld() {
      const densityScale = Math.max(0.24, 1 - this.population.length / 230);
      for (const plant of this.plants) plant.draw(this.ctx);
      const sortedRabbits = [...this.population].sort((a, b) => a.y - b.y);
      for (const rabbit of sortedRabbits) {
        rabbit.draw(this.ctx, densityScale, rabbit.id === this.selectedRabbitId, this.showLabels, this.lastFrameTs);
      }

      if (this.wolvesEnabled) {
        for (const wolf of this.wolves) {
          wolf.draw(this.ctx, this.lastFrameTs);
        }
      }
    }

    renderFrame(dt) {
      this.getToggleState();
      this.syncPopulationFromSimulation();
      this.drawEnvironmentBackground();

      if (this.limitedFoodEnabled || this.toughFoodEnabled) this.resolveFoodInteractions(dt);
      else this.resolveMovementNoFood(dt);

      this.resolveWolfInteractions();
      this.drawWorld();
      this.drawSceneHud();

      if (this.population.length === 0) {
        if (!this.extinctionReason) {
          if (this.limitedFoodEnabled && this.toughFoodEnabled) {
            this.extinctionReason = "No rabbits left: limited + tough food conditions were too harsh.";
          } else if (this.limitedFoodEnabled) {
            this.extinctionReason = "No rabbits left: limited food caused starvation.";
          } else if (this.toughFoodEnabled) {
            this.extinctionReason = "No rabbits left: tough food could not be eaten effectively.";
          } else if (this.wolvesEnabled) {
            this.extinctionReason = "No rabbits left: wolves hunted them.";
          } else {
            this.extinctionReason = "No rabbits left. Press Reset, then Add Mate.";
          }
        }
        this.setStatus(this.extinctionReason);
        window.SimulationModule?.ensureExtinctionNotice?.();
      }
    }

    animate = (ts) => {
      if (!this.lastFrameTs) this.lastFrameTs = ts;
      const dt = Math.min(0.05, (ts - this.lastFrameTs) / 1000);
      this.lastFrameTs = ts;

      this.renderFrame(dt);
      this.animationId = window.requestAnimationFrame(this.animate);
    };

    start() {
      if (!this.initCanvas()) return;

      this.getToggleState();
      this.createInitialPopulation();
      this.spawnPlants();
      if (this.wolvesEnabled) this.spawnWolves();
      this.bindToggleListeners();
      this.ensureStatusNode();
      this.setStatus("Ready. Add Mate, then press Play.");

      this.renderFrame(0.016);
      this.animate(performance.now());
    }
  }

  window.AnimationModule = {
    init() {
      const animator = new EcosystemAnimator();
      animator.start();
    }
  };

  window.addEventListener("DOMContentLoaded", () => {
    window.AnimationModule.init();
  });
})();
