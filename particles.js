// High-performance neon particle & visual juice system
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.damageNumbers = [];
    this.shockwaves = [];
    this.orbitalBeams = [];
    this.blackHoles = [];
    this.dashGhostTrails = [];
    this.floatingTexts = [];
    this.screenShake = { duration: 0, intensity: 0, x: 0, y: 0 };
    this.gridMotes = [];
    this.initGridMotes(60);
  }

  initGridMotes(count) {
    for (let i = 0; i < count; i++) {
      this.gridMotes.push({
        x: Math.random() * 2000 - 1000,
        y: Math.random() * 2000 - 1000,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        color: Math.random() > 0.5 ? '#00f3ff' : '#ff0077'
      });
    }
  }

  addDashTrail(x, y, angle, color = '#00f3ff') {
    this.dashGhostTrails.push({
      x,
      y,
      angle,
      color,
      alpha: 0.8,
      life: 0.35
    });

    // Add trailing electric sparks
    for (let i = 0; i < 4; i++) {
      const spd = Math.random() * 2 + 1;
      const spdAngle = angle + Math.PI + (Math.random() - 0.5) * 1.5;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(spdAngle) * spd,
        vy: Math.sin(spdAngle) * spd,
        size: Math.random() * 2.5 + 1,
        color: color,
        alpha: 0.9,
        decay: 0.05,
        glow: true
      });
    }
  }

  addOrbitalBeam(x, y) {
    this.orbitalBeams.push({
      x,
      y,
      width: 70,
      alpha: 1,
      life: 0.75
    });
  }

  addBlackHole(x, y) {
    this.blackHoles.push({
      x,
      y,
      radius: 130,
      angle: 0,
      alpha: 1,
      life: 3.5
    });
  }

  triggerScreenShake(intensity = 8, duration = 0.2) {
    this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    this.screenShake.duration = Math.max(this.screenShake.duration, duration);
  }

  addExplosion(x, y, color = '#ff0077', count = 25, isBoss = false) {
    const finalCount = isBoss ? count * 2.5 : count;
    for (let i = 0; i < finalCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (isBoss ? 7 : 4.5) + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * (isBoss ? 5 : 3.5) + 1.5,
        color: color,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.02,
        glow: true
      });
    }

    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius: isBoss ? 160 : 70,
      color: color,
      alpha: 1,
      speed: isBoss ? 6 : 4
    });
  }

  addDamageNumber(x, y, amount, isCrit = false) {
    this.damageNumbers.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y - 10,
      amount: Math.round(amount),
      isCrit,
      vy: -1.8,
      alpha: 1,
      life: 0.6
    });
  }

  addFloatingText(x, y, text, color = '#00f3ff') {
    this.floatingTexts.push({
      x,
      y: y - 20,
      text,
      color,
      vy: -1.6,
      alpha: 1,
      life: 1.1
    });
  }

  addHealAura(x, y) {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 / 16) * i;
      const speed = Math.random() * 2.5 + 1.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: Math.random() * 3 + 2,
        color: '#00ff66',
        alpha: 1,
        decay: 0.035,
        glow: true
      });
    }
    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius: 85,
      speed: 4,
      color: '#00ff88',
      width: 3,
      alpha: 1
    });
  }

  addMagnetWave(x, y) {
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 80 + 30;
      this.particles.push({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: -Math.cos(angle) * 3.5,
        vy: -Math.sin(angle) * 3.5,
        size: Math.random() * 3 + 1.5,
        color: '#00f3ff',
        alpha: 1,
        decay: 0.04,
        glow: true
      });
    }
    this.shockwaves.push({
      x,
      y,
      radius: 10,
      maxRadius: 260,
      speed: 12,
      color: '#00f3ff',
      width: 4,
      alpha: 1
    });
  }

  update(dt) {
    // Screen shake update
    if (this.screenShake.duration > 0) {
      this.screenShake.duration -= dt;
      const decay = this.screenShake.intensity;
      this.screenShake.x = (Math.random() * 2 - 1) * decay;
      this.screenShake.y = (Math.random() * 2 - 1) * decay;
      this.screenShake.intensity *= 0.92;
    } else {
      this.screenShake.x = 0;
      this.screenShake.y = 0;
      this.screenShake.intensity = 0;
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed;
      sw.alpha = 1 - (sw.radius / sw.maxRadius);
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Damage numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.y += d.vy;
      d.life -= dt;
      d.alpha = Math.max(0, d.life / 0.6);
      if (d.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }

    // Dash Ghost Trails
    for (let i = this.dashGhostTrails.length - 1; i >= 0; i--) {
      const g = this.dashGhostTrails[i];
      g.life -= dt;
      g.alpha = Math.max(0, g.life / 0.35);
      if (g.life <= 0) {
        this.dashGhostTrails.splice(i, 1);
      }
    }

    // Floating UI Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life -= dt;
      ft.alpha = Math.max(0, ft.life / 1.1);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Orbital Beams
    for (let i = this.orbitalBeams.length - 1; i >= 0; i--) {
      const b = this.orbitalBeams[i];
      b.life -= dt;
      b.alpha = Math.max(0, b.life / 0.75);
      b.width = Math.max(10, b.width * 0.96);
      if (b.life <= 0) {
        this.orbitalBeams.splice(i, 1);
      }
    }

    // Black Holes
    for (let i = this.blackHoles.length - 1; i >= 0; i--) {
      const bh = this.blackHoles[i];
      bh.life -= dt;
      bh.angle += dt * 5;
      if (bh.life < 0.5) {
        bh.alpha = bh.life / 0.5;
      }
      if (bh.life <= 0) {
        this.blackHoles.splice(i, 1);
      }
    }

    // Grid motes
    for (const m of this.gridMotes) {
      m.x += m.speedX;
      m.y += m.speedY;
      if (m.x > 1000) m.x = -1000;
      if (m.x < -1000) m.x = 1000;
      if (m.y > 1000) m.y = -1000;
      if (m.y < -1000) m.y = 1000;
    }
  }

  draw(ctx, camera) {
    ctx.save();

    // Orbital Beams (Render behind or across everything)
    for (const b of this.orbitalBeams) {
      const bx = b.x - camera.x;
      ctx.save();
      ctx.globalAlpha = Math.max(0, b.alpha);
      ctx.shadowBlur = 35;
      ctx.shadowColor = '#00f3ff';
      const grad = ctx.createLinearGradient(bx - b.width / 2, 0, bx + b.width / 2, 0);
      grad.addColorStop(0, 'rgba(0, 243, 255, 0)');
      grad.addColorStop(0.3, 'rgba(0, 243, 255, 0.7)');
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(0.7, 'rgba(0, 243, 255, 0.7)');
      grad.addColorStop(1, 'rgba(0, 243, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(bx - b.width / 2, 0, b.width, ctx.canvas.height);
      ctx.restore();
    }

    // Black Holes
    for (const bh of this.blackHoles) {
      const x = bh.x - camera.x;
      const y = bh.y - camera.y;
      ctx.save();
      ctx.globalAlpha = Math.max(0, bh.alpha);
      ctx.translate(x, y);
      ctx.rotate(bh.angle);

      // Swirling rings
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#9d00ff';
      ctx.strokeStyle = '#9d00ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, bh.radius * 0.85, 0, Math.PI * 1.6);
      ctx.stroke();

      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, bh.radius * 0.45, Math.PI * 0.5, Math.PI * 2);
      ctx.stroke();

      // Deep dark core
      ctx.fillStyle = '#020208';
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Dash Ghost Trails
    for (const g of this.dashGhostTrails) {
      const gx = g.x - camera.x;
      const gy = g.y - camera.y;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(g.angle);
      ctx.globalAlpha = Math.max(0, g.alpha * 0.5);
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-12, -12);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-12, 12);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Shockwaves
    for (const sw of this.shockwaves) {
      const sx = sw.x - camera.x;
      const sy = sw.y - camera.y;
      ctx.beginPath();
      ctx.arc(sx, sy, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.stroke();
    }

    // Particles
    for (const p of this.particles) {
      const px = p.x - camera.x;
      const py = p.y - camera.y;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      if (p.glow) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
      }
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Damage numbers
    ctx.shadowBlur = 0;
    for (const d of this.damageNumbers) {
      const dx = d.x - camera.x;
      const dy = d.y - camera.y;
      ctx.globalAlpha = Math.max(0, d.alpha);
      ctx.font = d.isCrit ? '900 18px "Orbitron", sans-serif' : '700 13px "Rajdhani", sans-serif';
      ctx.fillStyle = d.isCrit ? '#ffea00' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(d.isCrit ? `CRIT ${d.amount}` : `${d.amount}`, dx, dy);
    }

    // Floating Special Texts
    for (const ft of this.floatingTexts) {
      const fx = ft.x - camera.x;
      const fy = ft.y - camera.y;
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = '900 16px "Orbitron", sans-serif';
      ctx.shadowBlur = 12;
      ctx.shadowColor = ft.color;
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, fx, fy);
      ctx.restore();
    }

    ctx.restore();
  }

  drawGridMotes(ctx, camera) {
    ctx.save();
    for (const m of this.gridMotes) {
      const mx = m.x - camera.x * 0.3;
      const my = m.y - camera.y * 0.3;
      ctx.fillStyle = m.color;
      ctx.globalAlpha = m.alpha;
      ctx.beginPath();
      ctx.arc(mx, my, m.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

window.particleSystem = new ParticleSystem();
