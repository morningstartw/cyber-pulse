// Cyber Pulse: Overdrive V2.0 - Core Game Engine
(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  // Meta Progression (Chip Upgrades & Hangar saved in localStorage)
  const defaultMeta = {
    cores: 0,
    selectedShip: 'assault',
    unlockedShips: ['assault'],
    upgrades: {
      maxHp: 0,
      damage: 0,
      speed: 0,
      magnet: 0,
      cooldown: 0,
      crit: 0
    }
  };

  const chipDefs = [
    { id: 'maxHp', name: '奈米裝甲核心', desc: '提升最大生命值 +20%', max: 5, cost: [50, 120, 250, 500, 1000], bonus: (lvl) => 1 + lvl * 0.2 },
    { id: 'damage', name: '超載能量電容', desc: '全武器基礎傷害 +15%', max: 5, cost: [60, 150, 300, 600, 1200], bonus: (lvl) => 1 + lvl * 0.15 },
    { id: 'speed', name: '重力推進噴口', desc: '機體移動速度 +10%', max: 5, cost: [40, 100, 200, 450, 900], bonus: (lvl) => 1 + lvl * 0.1 },
    { id: 'magnet', name: '量子磁吸場', desc: '晶體能量拾取範圍 +30%', max: 5, cost: [30, 80, 180, 400, 800], bonus: (lvl) => 1 + lvl * 0.3 },
    { id: 'cooldown', name: '高頻超頻晶片', desc: '所有武器冷卻縮減 +8%', max: 5, cost: [70, 160, 350, 700, 1500], bonus: (lvl) => 1 - lvl * 0.08 },
    { id: 'crit', name: '精確瞄準矩陣', desc: '暴擊率 +6% (暴擊造成2倍傷害)', max: 5, cost: [50, 130, 280, 550, 1100], bonus: (lvl) => lvl * 0.06 }
  ];

  // Ship Hangar Registry
  const SHIP_REGISTRY = {
    assault: {
      id: 'assault',
      name: 'PULSE-01 突擊者',
      role: '全能突擊戰機',
      avatar: '🚀',
      desc: '均衡全能機體，開局配備脈衝光砲，自帶 +10% 暴擊率加成與標準戰術衝刺。',
      cost: 0,
      color: '#00f3ff',
      hpMult: 1.0,
      spdMult: 1.0,
      critBonus: 0.10,
      dashCharges: 1,
      dashCd: 2.2,
      startWeapons: { blaster: 1, blades: 0, lightning: 0, nova: 0, drone: 0, shield: 0 }
    },
    phantom: {
      id: 'phantom',
      name: 'PHANTOM-X 幽靈',
      role: '高機動刺客戰機',
      avatar: '🛸',
      desc: '超高航速、具備 2 次連續衝刺充能！起始武裝為旋轉光刃，機動性極致飄逸。',
      cost: 150,
      color: '#ff00aa',
      hpMult: 0.8,
      spdMult: 1.25,
      critBonus: 0.05,
      dashCharges: 2,
      dashCd: 1.8,
      startWeapons: { blaster: 0, blades: 1, lightning: 0, nova: 0, drone: 0, shield: 0 }
    },
    titan: {
      id: 'titan',
      name: 'TITAN-IX 泰坦',
      role: '重裝裝甲堡壘',
      avatar: '🛡️',
      desc: '厚實裝甲與常態護盾，開局持連鎖電弧與相位護盾，衝撞反傷撕裂敵群。',
      cost: 250,
      color: '#ffaa00',
      hpMult: 1.5,
      spdMult: 0.88,
      critBonus: 0.0,
      dashCharges: 1,
      dashCd: 3.0,
      startWeapons: { blaster: 0, blades: 0, lightning: 1, nova: 0, drone: 0, shield: 1 }
    }
  };

  let meta = JSON.parse(localStorage.getItem('cyber_pulse_meta_v2') || 'null');
  if (!meta) {
    const oldMeta = JSON.parse(localStorage.getItem('cyber_pulse_meta') || 'null');
    meta = defaultMeta;
    if (oldMeta) {
      meta.cores = oldMeta.cores || 0;
      meta.upgrades = Object.assign(meta.upgrades, oldMeta.upgrades || {});
    }
  }
  function saveMeta() {
    localStorage.setItem('cyber_pulse_meta_v2', JSON.stringify(meta));
  }

  // Viewport, Camera Zoom & Scaling
  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = 1;
  let zoom = 1.0;

  function updateZoom() {
    const minDim = Math.min(width, height);
    if (minDim < 550) {
      zoom = 0.52; // Mobile phones: pull back camera by ~48% for huge, comfortable field of view
    } else if (minDim < 850) {
      zoom = 0.70; // Tablets
    } else {
      zoom = 0.88; // Desktop
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    updateZoom();
  }
  window.addEventListener('resize', resize);
  resize();

  // Input Handling
  const keys = {};
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    window.soundFX.ensureContext();
    if (k === ' ' || k === 'shift') {
      triggerDash();
    }
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  // Mobile Dash Button (Larger & Stop Propagation to Joystick)
  const mobileDashBtn = document.getElementById('mobile-dash-btn');
  mobileDashBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.soundFX.ensureContext();
    triggerDash();
  }, { passive: false });
  mobileDashBtn.addEventListener('click', (e) => {
    e.preventDefault();
    triggerDash();
  });

  // Dynamic Virtual Joystick for Mobile (Multi-Touch Aware - never interrupts on Dash)
  const joystick = {
    active: false,
    touchId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    dx: 0,
    dy: 0,
    maxRadius: 55
  };

  const joyBase = document.getElementById('joystick-base');
  const joyStick = document.getElementById('joystick-stick');

  window.addEventListener('touchstart', (e) => {
    window.soundFX.ensureContext();
    if (gameState !== 'PLAYING') return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      // Ignore if touch begins on bottom-right corner where dash button lives
      if (touch.clientX > width - 150 && touch.clientY > height - 150) continue;

      if (joystick.touchId === null) {
        joystick.touchId = touch.identifier;
        joystick.active = true;
        joystick.startX = touch.clientX;
        joystick.startY = touch.clientY;
        joystick.currentX = touch.clientX;
        joystick.currentY = touch.clientY;
        joystick.dx = 0;
        joystick.dy = 0;

        joyBase.style.display = 'block';
        joyBase.style.left = `${touch.clientX}px`;
        joyBase.style.top = `${touch.clientY}px`;
        joyStick.style.left = `${touch.clientX}px`;
        joyStick.style.top = `${touch.clientY}px`;
        break;
      }
    }
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (!joystick.active || joystick.touchId === null) return;

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.identifier === joystick.touchId) {
        const diffX = touch.clientX - joystick.startX;
        const diffY = touch.clientY - joystick.startY;
        const dist = Math.hypot(diffX, diffY);
        const angle = Math.atan2(diffY, diffX);

        const clampedDist = Math.min(dist, joystick.maxRadius);
        joystick.currentX = joystick.startX + Math.cos(angle) * clampedDist;
        joystick.currentY = joystick.startY + Math.sin(angle) * clampedDist;

        joystick.dx = (joystick.currentX - joystick.startX) / joystick.maxRadius;
        joystick.dy = (joystick.currentY - joystick.startY) / joystick.maxRadius;

        joyStick.style.left = `${joystick.currentX}px`;
        joyStick.style.top = `${joystick.currentY}px`;
        break;
      }
    }
  }, { passive: false });

  const handleTouchEnd = (e) => {
    if (!joystick.active || joystick.touchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystick.touchId) {
        joystick.active = false;
        joystick.touchId = null;
        joystick.dx = 0;
        joystick.dy = 0;
        joyBase.style.display = 'none';
        break;
      }
    }
  };
  window.addEventListener('touchend', handleTouchEnd);
  window.addEventListener('touchcancel', handleTouchEnd);

  // Weapon & Fusion Definitions
  const WEAPON_REGISTRY = {
    blaster: {
      name: '脈衝光砲',
      type: '主武器',
      icon: '⚡',
      desc: '高速發射貫穿敵人的能量光束',
      levels: [
        { fireRate: 0.38, damage: 22, count: 1, speed: 12, pierce: 1 },
        { fireRate: 0.32, damage: 28, count: 1, speed: 13, pierce: 2 },
        { fireRate: 0.28, damage: 34, count: 2, speed: 14, pierce: 2 },
        { fireRate: 0.22, damage: 42, count: 3, speed: 15, pierce: 3 },
        { fireRate: 0.16, damage: 55, count: 4, speed: 16, pierce: 4, label: '【超限滿級】雷霆超載' }
      ]
    },
    blades: {
      name: '旋轉光刃',
      type: '環繞武器',
      icon: '🌀',
      desc: '召喚高能光刃環繞機體旋轉撕裂周圍敵人',
      levels: [
        { count: 2, radius: 75, speed: 2.5, damage: 16 },
        { count: 3, radius: 85, speed: 2.8, damage: 22 },
        { count: 4, radius: 95, speed: 3.2, damage: 28 },
        { count: 5, radius: 105, speed: 3.5, damage: 36 },
        { count: 7, radius: 120, speed: 4.2, damage: 48, label: '【超限滿級】天基光輪' }
      ]
    },
    lightning: {
      name: '連鎖電弧',
      type: '鎖定武器',
      icon: '🌩️',
      desc: '向附近敵人降下電弧並在群體間跳躍傳導',
      levels: [
        { cooldown: 1.8, chains: 3, damage: 30 },
        { cooldown: 1.5, chains: 4, damage: 42 },
        { cooldown: 1.2, chains: 6, damage: 56 },
        { cooldown: 0.9, chains: 8, damage: 72 },
        { cooldown: 0.65, chains: 12, damage: 95, label: '【超限滿級】滅世風暴' }
      ]
    },
    nova: {
      name: '離子脈衝波',
      type: '範圍護體',
      icon: '💥',
      desc: '定期爆發全方位高能衝擊波擊退並重創敵潮',
      levels: [
        { cooldown: 3.8, radius: 130, damage: 35, knockback: 45 },
        { cooldown: 3.2, radius: 160, damage: 50, knockback: 60 },
        { cooldown: 2.6, radius: 190, damage: 70, knockback: 75 },
        { cooldown: 2.0, radius: 220, damage: 95, knockback: 90 },
        { cooldown: 1.4, radius: 260, damage: 130, knockback: 110, label: '【超限滿級】超新星塌縮' }
      ]
    },
    drone: {
      name: '浮游支援機',
      type: '無人僚機',
      icon: '🛸',
      desc: '伴隨機體的戰術無人機，自動發射導向微型飛彈',
      levels: [
        { fireRate: 1.2, damage: 32, count: 1 },
        { fireRate: 1.0, damage: 45, count: 2 },
        { fireRate: 0.8, damage: 60, count: 2 },
        { fireRate: 0.6, damage: 80, count: 3 },
        { fireRate: 0.4, damage: 110, count: 4, label: '【超限滿級】蜂群終結者' }
      ]
    },
    shield: {
      name: '相位偏轉護盾',
      type: '被動強化',
      icon: '🛡️',
      desc: '生成能量護盾吸收傷害，破碎後定期自動修復',
      levels: [
        { maxShield: 35, regenTime: 8 },
        { maxShield: 60, regenTime: 7 },
        { maxShield: 90, regenTime: 6 },
        { maxShield: 130, regenTime: 5 },
        { maxShield: 180, regenTime: 3.5, label: '【超限滿級】絕對防衛矩陣' }
      ]
    }
  };

  // Golden Legendary Fusion Super Weapons
  const FUSION_REGISTRY = {
    orbital_judgement: {
      name: '天基天譴軌道砲',
      type: '傳奇超武',
      icon: '🌌',
      desc: '【光砲 + 電弧 終極融合】從天際降下毀滅級貫穿離子光柱，並引發全螢幕連鎖天罰雷暴！',
      req: ['blaster', 'lightning']
    },
    vortex_singularity: {
      name: '虛空引力黑洞',
      type: '傳奇超武',
      icon: '🕳️',
      desc: '【光刃 + 脈衝波 終極融合】召喚高速旋轉的時空黑洞，吸扯全場所有敵機進入核心粉碎！',
      req: ['blades', 'nova']
    },
    aegis_fortress: {
      name: '神盾守護母艦',
      type: '傳奇超武',
      icon: '🪐',
      desc: '【浮游機 + 護盾 終極融合】解鎖 4 具全域作戰衛星，提供巨量護盾並發射無限暴風飛彈！',
      req: ['drone', 'shield']
    }
  };

  // Game Runtime State
  let gameState = 'MENU';
  let gameTime = 0;
  let killCount = 0;
  let sessionCores = 0;
  let totalDamageDealt = 0;
  let bossSpawned3m = false;
  let bossSpawned7m = false;

  const camera = { x: 0, y: 0 };
  let player;
  let enemies = [];
  let bullets = [];
  let enemyBullets = [];
  let drops = [];

  // Create Player based on Selected Ship & Chips
  function createPlayer() {
    const ship = SHIP_REGISTRY[meta.selectedShip] || SHIP_REGISTRY.assault;

    const hpBonus = chipDefs[0].bonus(meta.upgrades.maxHp || 0) * ship.hpMult;
    const dmgBonus = chipDefs[1].bonus(meta.upgrades.damage || 0);
    const spdBonus = chipDefs[2].bonus(meta.upgrades.speed || 0) * ship.spdMult;
    const magBonus = chipDefs[3].bonus(meta.upgrades.magnet || 0);
    const cdrBonus = chipDefs[4].bonus(meta.upgrades.cooldown || 0);
    const critBonus = chipDefs[5].bonus(meta.upgrades.crit || 0) + ship.critBonus;

    const baseHp = 100 * hpBonus;

    const p = {
      shipId: ship.id,
      shipDef: ship,
      color: ship.color,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: ship.id === 'titan' ? 17 : 14,
      rotation: 0,
      maxHp: baseHp,
      hp: baseHp,
      shield: 0,
      maxShield: 0,
      shieldTimer: 0,
      speed: 3.8 * spdBonus,
      damageMult: dmgBonus,
      magnetRadius: 100 * magBonus,
      cdr: cdrBonus,
      critRate: 0.05 + critBonus,
      level: 1,
      exp: 0,
      nextExp: 35,
      invulnTime: 0,
      trail: [],
      // Dash system
      dashCharges: ship.dashCharges,
      maxDashCharges: ship.dashCharges,
      dashCd: ship.dashCd,
      dashCdTimer: 0,
      isDashing: false,
      dashDuration: 0,
      dashVx: 0,
      dashVy: 0,
      weapons: Object.assign({
        blaster: 0, blades: 0, lightning: 0, nova: 0, drone: 0, shield: 0,
        orbital_judgement: 0, vortex_singularity: 0, aegis_fortress: 0
      }, ship.startWeapons),
      timers: {
        blaster: 0,
        bladesAngle: 0,
        lightning: 0,
        nova: 0,
        drone: 0,
        orbital_judgement: 0,
        vortex_singularity: 0,
        aegis_fortress: 0
      }
    };

    if (p.weapons.shield > 0) {
      const cfg = WEAPON_REGISTRY.shield.levels[p.weapons.shield - 1];
      p.maxShield = cfg.maxShield;
      p.shield = cfg.maxShield;
    }

    return p;
  }

  // Active Dash Trigger
  function triggerDash() {
    if (gameState !== 'PLAYING' || !player) return;
    if (player.dashCharges <= 0 || player.isDashing) return;

    player.dashCharges--;
    player.isDashing = true;
    player.dashDuration = 0.22;
    player.invulnTime = 0.25;

    let dirX = Math.cos(player.rotation);
    let dirY = Math.sin(player.rotation);
    if (Math.hypot(player.vx, player.vy) > 0.5) {
      const spd = Math.hypot(player.vx, player.vy);
      dirX = player.vx / spd;
      dirY = player.vy / spd;
    }

    const dashSpeed = player.speed * 3.4;
    player.dashVx = dirX * dashSpeed;
    player.dashVy = dirY * dashSpeed;

    window.soundFX.dash();
    window.particleSystem.triggerScreenShake(7, 0.15);
    window.particleSystem.addDashTrail(player.x, player.y, player.rotation, player.color);
    window.particleSystem.addExplosion(player.x, player.y, player.color, 12);
  }

  // Enemy Spawns & Swarm Horde System
  let spawnTimer = 0;
  let nextSwarmTime = 30; // First swarm wave at 30 seconds

  function updateEnemySpawns(dt) {
    spawnTimer += dt;

    // Much denser spawn rate: generates true monster hordes
    const interval = Math.max(0.07, 0.42 - (gameTime / 360) * 0.32);

    if (spawnTimer >= interval && enemies.length < 450) {
      spawnTimer = 0;
      // Scales from 3 to 18 enemies per spawn burst
      const count = 2 + Math.floor(gameTime / 25) * 2;
      for (let i = 0; i < count; i++) {
        spawnRandomEnemy();
      }
    }

    // Periodic Massive Swarm Invasions (Surrounding Rings of Monsters)
    if (gameTime >= nextSwarmTime) {
      nextSwarmTime += 40; // Wave every 40s
      spawnSwarmRing(35 + Math.min(45, Math.floor(gameTime / 10)));
    }

    // Boss spawns
    if (gameTime >= 180 && !bossSpawned3m) {
      bossSpawned3m = true;
      spawnBoss('OVERLORD');
    }
    if (gameTime >= 420 && !bossSpawned7m) {
      bossSpawned7m = true;
      spawnBoss('APEX');
    }
  }

  // Spawns a dense ring of fast drones closing in from all 360 degrees
  function spawnSwarmRing(count) {
    window.soundFX.shoot(300);
    window.particleSystem.triggerScreenShake(6, 0.2);

    const viewW = width / zoom;
    const viewH = height / zoom;
    const radius = Math.hypot(viewW, viewH) * 0.55 + 90;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = player.x + Math.cos(angle) * radius;
      const y = player.y + Math.sin(angle) * radius;

      enemies.push({
        x,
        y,
        type: 'drone',
        hp: 16 + gameTime * 0.3,
        maxHp: 16 + gameTime * 0.3,
        speed: 2.3,
        radius: 11,
        color: '#ff0055', // Red glowing swarm
        expVal: 8,
        shootTimer: 0,
        hitFlash: 0
      });
    }
  }

  function spawnRandomEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const viewW = width / zoom;
    const viewH = height / zoom;
    const dist = Math.hypot(viewW, viewH) * 0.55 + 80;
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;

    const r = Math.random();
    let type = 'drone';

    if (gameTime > 120 && r < 0.25) {
      type = 'sentinel';
    } else if (gameTime > 50 && r < 0.55) {
      type = 'crawler';
    } else if (gameTime > 200 && r < 0.2) {
      type = 'stalker';
    }

    let hp = 20 + gameTime * 0.4;
    let speed = 2.1;
    let radius = 12;
    let color = '#00f3ff';
    let expVal = 10;
    let shootTimer = 0;

    if (type === 'crawler') {
      hp = 42 + gameTime * 0.75;
      speed = 1.6;
      radius = 15;
      color = '#ff007f';
      expVal = 18;
    } else if (type === 'sentinel') {
      hp = 110 + gameTime * 1.4;
      speed = 1.0;
      radius = 21;
      color = '#ffaa00';
      expVal = 40;
      shootTimer = Math.random() * 2;
    } else if (type === 'stalker') {
      hp = 65 + gameTime * 1.1;
      speed = 3.2;
      radius = 13;
      color = '#9d00ff';
      expVal = 50;
    }

    enemies.push({
      x,
      y,
      type,
      hp,
      maxHp: hp,
      speed,
      radius,
      color,
      expVal,
      shootTimer,
      hitFlash: 0
    });
  }

  function spawnBoss(tier) {
    window.soundFX.bossAlarm();
    window.particleSystem.triggerScreenShake(14, 0.6);

    const angle = Math.random() * Math.PI * 2;
    const x = player.x + Math.cos(angle) * 350;
    const y = player.y + Math.sin(angle) * 350;

    const isApex = tier === 'APEX';
    enemies.push({
      x,
      y,
      type: 'boss',
      isApex,
      name: isApex ? '【APEX CORE】頂點核心' : '【OVERLORD】霓虹霸主',
      hp: isApex ? 7000 : 2800,
      maxHp: isApex ? 7000 : 2800,
      speed: isApex ? 1.4 : 1.1,
      radius: isApex ? 46 : 38,
      color: isApex ? '#ff0033' : '#ffff00',
      expVal: 800,
      attackTimer: 0,
      spiralAngle: 0,
      hitFlash: 0
    });
  }

  // Weapons & Super Weapons Update
  function updateWeapons(dt) {
    // 1. Pulse Blaster
    if (player.weapons.blaster > 0) {
      const cfg = WEAPON_REGISTRY.blaster.levels[player.weapons.blaster - 1];
      player.timers.blaster += dt;
      const rate = cfg.fireRate * player.cdr;
      if (player.timers.blaster >= rate) {
        player.timers.blaster = 0;
        fireBlaster(cfg);
      }
    }

    // 2. Orbital Blades
    if (player.weapons.blades > 0) {
      const cfg = WEAPON_REGISTRY.blades.levels[player.weapons.blades - 1];
      player.timers.bladesAngle += cfg.speed * dt;
      checkBladeCollisions(cfg);
    }

    // 3. Arc Lightning
    if (player.weapons.lightning > 0) {
      const cfg = WEAPON_REGISTRY.lightning.levels[player.weapons.lightning - 1];
      player.timers.lightning += dt;
      const cd = cfg.cooldown * player.cdr;
      if (player.timers.lightning >= cd) {
        player.timers.lightning = 0;
        fireLightning(cfg);
      }
    }

    // 4. Plasma Nova
    if (player.weapons.nova > 0) {
      const cfg = WEAPON_REGISTRY.nova.levels[player.weapons.nova - 1];
      player.timers.nova += dt;
      const cd = cfg.cooldown * player.cdr;
      if (player.timers.nova >= cd) {
        player.timers.nova = 0;
        fireNova(cfg);
      }
    }

    // 5. Drone Companion
    if (player.weapons.drone > 0) {
      const cfg = WEAPON_REGISTRY.drone.levels[player.weapons.drone - 1];
      player.timers.drone += dt;
      const rate = cfg.fireRate * player.cdr;
      if (player.timers.drone >= rate) {
        player.timers.drone = 0;
        fireDroneMissiles(cfg);
      }
    }

    // 6. Shield Regen
    if (player.weapons.shield > 0) {
      const cfg = WEAPON_REGISTRY.shield.levels[player.weapons.shield - 1];
      player.maxShield = player.weapons.aegis_fortress ? cfg.maxShield * 2.2 : cfg.maxShield;
      if (player.shield < player.maxShield) {
        player.shieldTimer += dt;
        const regenTime = player.weapons.aegis_fortress ? cfg.regenTime * 0.5 : cfg.regenTime;
        if (player.shieldTimer >= regenTime) {
          player.shieldTimer = 0;
          player.shield = player.maxShield;
          window.particleSystem.addExplosion(player.x, player.y, '#00f3ff', 12);
        }
      }
    }

    // --- SUPER WEAPONS ---
    // A. Orbital Judgement
    if (player.weapons.orbital_judgement > 0) {
      player.timers.orbital_judgement += dt;
      const cd = 3.2 * player.cdr;
      if (player.timers.orbital_judgement >= cd) {
        player.timers.orbital_judgement = 0;
        triggerOrbitalJudgement();
      }
    }

    // B. Vortex Singularity
    if (player.weapons.vortex_singularity > 0) {
      player.timers.vortex_singularity += dt;
      const cd = 3.6 * player.cdr;
      if (player.timers.vortex_singularity >= cd) {
        player.timers.vortex_singularity = 0;
        triggerVortexSingularity();
      }
    }

    // C. Aegis Fortress
    if (player.weapons.aegis_fortress > 0) {
      player.timers.aegis_fortress += dt;
      const cd = 0.35 * player.cdr;
      if (player.timers.aegis_fortress >= cd) {
        player.timers.aegis_fortress = 0;
        fireAegisMissiles();
      }
    }
  }

  function fireBlaster(cfg) {
    if (enemies.length === 0) return;
    const sorted = [...enemies].sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
    const target = sorted[0];
    if (!target) return;

    const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
    window.soundFX.shoot();

    for (let i = 0; i < cfg.count; i++) {
      const spread = (i - (cfg.count - 1) / 2) * 0.12;
      const angle = baseAngle + spread;
      bullets.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * cfg.speed,
        vy: Math.sin(angle) * cfg.speed,
        damage: cfg.damage * player.damageMult,
        pierce: cfg.pierce,
        life: 1.4,
        color: '#00f3ff',
        radius: 4,
        hitList: new Set()
      });
    }
  }

  function checkBladeCollisions(cfg) {
    const angleStep = (Math.PI * 2) / cfg.count;
    for (let i = 0; i < cfg.count; i++) {
      const a = player.timers.bladesAngle + i * angleStep;
      const bx = player.x + Math.cos(a) * cfg.radius;
      const by = player.y + Math.sin(a) * cfg.radius;

      for (const e of enemies) {
        if (Math.hypot(e.x - bx, e.y - by) < e.radius + 14) {
          damageEnemy(e, cfg.damage * player.damageMult * 0.25);
          window.soundFX.blade();
          window.particleSystem.addExplosion(bx, by, '#39ff14', 2);
        }
      }
    }
  }

  function fireLightning(cfg) {
    if (enemies.length === 0) return;
    const sorted = [...enemies].sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
    let current = sorted[0];
    if (!current) return;

    window.soundFX.lightning();
    const hitSet = new Set([current]);
    damageEnemy(current, cfg.damage * player.damageMult);

    for (let c = 0; c < cfg.chains; c++) {
      window.particleSystem.addExplosion(current.x, current.y, '#ffe600', 6);
      let next = null;
      let minDist = 220;
      for (const candidate of enemies) {
        if (!hitSet.has(candidate)) {
          const d = Math.hypot(candidate.x - current.x, candidate.y - current.y);
          if (d < minDist) {
            minDist = d;
            next = candidate;
          }
        }
      }
      if (next) {
        hitSet.add(next);
        damageEnemy(next, cfg.damage * player.damageMult * 0.85);
        current = next;
      } else {
        break;
      }
    }
  }

  function fireNova(cfg) {
    window.soundFX.nova();
    window.particleSystem.triggerScreenShake(7, 0.2);
    window.particleSystem.addExplosion(player.x, player.y, '#9d00ff', 40);

    for (const e of enemies) {
      const dist = Math.hypot(e.x - player.x, e.y - player.y);
      if (dist <= cfg.radius) {
        damageEnemy(e, cfg.damage * player.damageMult);
        const angle = Math.atan2(e.y - player.y, e.x - player.x);
        e.x += Math.cos(angle) * cfg.knockback;
        e.y += Math.sin(angle) * cfg.knockback;
      }
    }
  }

  function fireDroneMissiles(cfg) {
    if (enemies.length === 0) return;
    window.soundFX.shoot(880);

    for (let i = 0; i < cfg.count; i++) {
      const target = enemies[Math.floor(Math.random() * enemies.length)];
      bullets.push({
        x: player.x + Math.sin(Date.now() * 0.003) * 35,
        y: player.y + Math.cos(Date.now() * 0.003) * 35,
        target,
        homing: true,
        speed: 7.5,
        damage: cfg.damage * player.damageMult,
        pierce: 1,
        life: 2.2,
        color: '#ff00aa',
        radius: 5,
        hitList: new Set()
      });
    }
  }

  // Super Weapon Triggers
  function triggerOrbitalJudgement() {
    if (enemies.length === 0) return;
    const sorted = [...enemies].sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
    const target = sorted[0];
    if (!target) return;

    window.soundFX.orbitalBeam();
    window.particleSystem.triggerScreenShake(16, 0.4);
    window.particleSystem.addOrbitalBeam(target.x, target.y);

    for (const e of enemies) {
      if (Math.abs(e.x - target.x) < 55) {
        damageEnemy(e, 380 * player.damageMult);
      }
    }

    for (let i = 0; i < Math.min(12, enemies.length); i++) {
      damageEnemy(enemies[i], 120 * player.damageMult);
      window.particleSystem.addExplosion(enemies[i].x, enemies[i].y, '#00f3ff', 8);
    }
  }

  function triggerVortexSingularity() {
    if (enemies.length === 0) return;
    const sorted = [...enemies].sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
    const target = sorted[0] || player;

    window.soundFX.blackHole();
    window.particleSystem.triggerScreenShake(12, 0.35);
    window.particleSystem.addBlackHole(target.x, target.y);

    for (const e of enemies) {
      const d = Math.hypot(e.x - target.x, e.y - target.y);
      if (d < 300) {
        const a = Math.atan2(target.y - e.y, target.x - e.x);
        e.x += Math.cos(a) * 75;
        e.y += Math.sin(a) * 75;
        damageEnemy(e, 180 * player.damageMult);
      }
    }
  }

  function fireAegisMissiles() {
    if (enemies.length === 0) return;
    window.soundFX.shoot(950);

    for (let i = 0; i < 4; i++) {
      const a = (Date.now() * 0.004) + (i * Math.PI / 2);
      const sx = player.x + Math.cos(a) * 60;
      const sy = player.y + Math.sin(a) * 60;

      const target = enemies[Math.floor(Math.random() * enemies.length)];
      bullets.push({
        x: sx,
        y: sy,
        target,
        homing: true,
        speed: 9.0,
        damage: 85 * player.damageMult,
        pierce: 2,
        life: 2.5,
        color: '#ffd700',
        radius: 6,
        hitList: new Set()
      });
    }
  }

  function damageEnemy(e, rawDamage) {
    const isCrit = Math.random() < player.critRate;
    const finalDamage = isCrit ? rawDamage * 2.0 : rawDamage;

    e.hp -= finalDamage;
    e.hitFlash = 0.12;
    totalDamageDealt += finalDamage;

    window.particleSystem.addDamageNumber(e.x, e.y, finalDamage, isCrit);

    if (e.hp <= 0) {
      killEnemy(e);
    }
  }

  function killEnemy(e) {
    killCount++;
    const isBoss = e.type === 'boss';

    window.soundFX.explosion(isBoss);
    window.particleSystem.addExplosion(e.x, e.y, e.color, isBoss ? 50 : 16, isBoss);

    if (isBoss) {
      window.particleSystem.triggerScreenShake(15, 0.5);
      drops.push({ x: e.x, y: e.y, type: 'core', val: 50 });
      drops.push({ x: e.x + 20, y: e.y, type: 'heal', val: 50 });
      drops.push({ x: e.x - 20, y: e.y, type: 'exp', val: 400 });
    } else {
      drops.push({ x: e.x, y: e.y, type: 'exp', val: e.expVal });
      const r = Math.random();
      if (r < 0.08) {
        drops.push({ x: e.x, y: e.y, type: 'core', val: 5 });
      } else if (r < 0.015) {
        drops.push({ x: e.x, y: e.y, type: 'nuke' });
      } else if (r < 0.03 && player.hp < player.maxHp * 0.7) {
        drops.push({ x: e.x, y: e.y, type: 'heal', val: 25 });
      }
    }

    const idx = enemies.indexOf(e);
    if (idx !== -1) enemies.splice(idx, 1);
  }

  function hurtPlayer(dmg) {
    if (player.invulnTime > 0) return;
    window.soundFX.hit();
    window.particleSystem.triggerScreenShake(8, 0.25);
    player.invulnTime = 0.4;

    if (player.shield > 0) {
      player.shield -= dmg;
      if (player.shield < 0) {
        player.hp += player.shield;
        player.shield = 0;
      }
      player.shieldTimer = 0;
    } else {
      player.hp -= dmg;
    }

    if (player.hp <= 0) {
      player.hp = 0;
      endGame(false);
    }
  }

  function triggerNuke() {
    window.soundFX.explosion(true);
    window.particleSystem.triggerScreenShake(18, 0.5);
    for (const e of [...enemies]) {
      if (e.type !== 'boss') {
        killEnemy(e);
      } else {
        damageEnemy(e, 500);
      }
    }
  }

  // Level Up & Fusion Upgrades
  function checkLevelUp() {
    if (player.exp >= player.nextExp) {
      player.exp -= player.nextExp;
      player.level++;
      player.nextExp = Math.floor(player.nextExp * 1.35 + 20);

      window.soundFX.levelup();
      showUpgradeModal();
    }
  }

  function showUpgradeModal() {
    gameState = 'UPGRADE';
    const modal = document.getElementById('upgrade-modal');
    const grid = document.getElementById('upgrade-cards-grid');
    grid.innerHTML = '';

    const choices = [];

    // Check available Fusion Super Weapons
    for (const [fKey, fDef] of Object.entries(FUSION_REGISTRY)) {
      if (!player.weapons[fKey]) {
        const req1Met = player.weapons[fDef.req[0]] >= 5;
        const req2Met = player.weapons[fDef.req[1]] >= 5;
        if (req1Met && req2Met) {
          choices.push({
            key: fKey,
            def: fDef,
            isFusion: true,
            nextLevel: 1
          });
        }
      }
    }

    // Normal upgrades
    const available = [];
    for (const [key, def] of Object.entries(WEAPON_REGISTRY)) {
      const currentLvl = player.weapons[key];
      if (currentLvl < def.levels.length) {
        available.push({
          key,
          def,
          isFusion: false,
          nextLevel: currentLvl + 1
        });
      }
    }

    const shuffled = available.sort(() => 0.5 - Math.random());
    while (choices.length < 3 && shuffled.length > 0) {
      choices.push(shuffled.pop());
    }

    if (choices.length === 0) {
      choices.push({
        key: 'healAll',
        def: { name: '戰地極限修復', type: '緊急維護', icon: '❤️', desc: '立即修復機體 60% 生命值並獲得 50 核心晶片' },
        nextLevel: 1,
        isFusion: false
      });
    }

    choices.forEach((choice) => {
      const card = document.createElement('div');
      card.className = `upgrade-card ${choice.isFusion ? 'fusion' : ''}`;
      const lvlStr = choice.isFusion ? '【超武融合】' : (choice.key === 'healAll' ? 'MAX' : `LV.${choice.nextLevel}`);

      card.innerHTML = `
        <div class="card-icon">${choice.def.icon}</div>
        <div class="card-content">
          <div class="card-name">${choice.def.name}</div>
          <div class="card-type">${choice.def.type}</div>
          <div class="card-desc">${choice.def.desc}</div>
        </div>
        <div class="card-level">${lvlStr}</div>
      `;

      card.addEventListener('click', () => {
        applyUpgrade(choice.key, choice.isFusion);
        modal.classList.remove('active');
        gameState = 'PLAYING';
      });

      grid.appendChild(card);
    });

    modal.classList.add('active');
  }

  function applyUpgrade(key, isFusion) {
    if (isFusion) {
      window.soundFX.fusion();
      player.weapons[key] = 1;
      return;
    }

    window.soundFX.click();
    if (key === 'healAll') {
      player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.6);
      meta.cores += 50;
      saveMeta();
      return;
    }
    player.weapons[key] = (player.weapons[key] || 0) + 1;
  }

  // End Game
  function endGame(isVictory) {
    gameState = isVictory ? 'VICTORY' : 'GAMEOVER';
    window.soundFX.stopBGM();

    meta.cores += sessionCores;
    saveMeta();

    const screen = document.getElementById('settlement-modal');
    document.getElementById('settlement-title').textContent = isVictory ? '任務圓滿完成 - MISSION CLEARED' : '機體信號中斷 - SYSTEM FAILURE';
    document.getElementById('settlement-sub').textContent = isVictory ? '你成功肅清了所有霓虹威脅，登頂賽博王座！' : '核心能源耗盡，但收集的資料晶片已成功上傳。';

    const min = Math.floor(gameTime / 60);
    const sec = Math.floor(gameTime % 60);
    document.getElementById('stat-time').textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    document.getElementById('stat-kills').textContent = killCount;
    document.getElementById('stat-level').textContent = `LV.${player.level}`;
    document.getElementById('stat-cores').textContent = `+${sessionCores}`;

    screen.classList.add('active');
  }

  // Start Game
  function startGame() {
    window.soundFX.ensureContext();
    window.soundFX.startBGM();

    player = createPlayer();
    enemies = [];
    bullets = [];
    enemyBullets = [];
    drops = [];

    gameTime = 0;
    killCount = 0;
    sessionCores = 0;
    totalDamageDealt = 0;
    bossSpawned3m = false;
    bossSpawned7m = false;
    nextSwarmTime = 30;

    document.getElementById('main-menu').classList.remove('active');
    document.getElementById('settlement-modal').classList.remove('active');
    document.getElementById('chip-modal').classList.remove('active');
    document.getElementById('hangar-modal').classList.remove('active');

    gameState = 'PLAYING';
  }

  // Hangar UI
  function openHangar() {
    window.soundFX.click();
    const modal = document.getElementById('hangar-modal');
    renderHangarGrid();
    modal.classList.add('active');
  }

  function renderHangarGrid() {
    const container = document.getElementById('hangar-grid-container');
    container.innerHTML = '';

    Object.values(SHIP_REGISTRY).forEach((ship) => {
      const isUnlocked = meta.unlockedShips.includes(ship.id);
      const isSelected = meta.selectedShip === ship.id;

      const card = document.createElement('div');
      card.className = `ship-card ${isSelected ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`;

      let btnText = '出擊中';
      if (!isUnlocked) {
        btnText = `解鎖 (${ship.cost} 核心)`;
      } else if (!isSelected) {
        btnText = '選擇此戰機';
      }

      card.innerHTML = `
        <div class="ship-avatar">${ship.avatar}</div>
        <div class="ship-name" style="color: ${ship.color}">${ship.name}</div>
        <div class="ship-role">${ship.role}</div>
        <div class="ship-perk">${ship.desc}</div>
        <button class="ship-status-btn" ${isSelected ? 'disabled' : ''}>${btnText}</button>
      `;

      const btn = card.querySelector('.ship-status-btn');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isUnlocked) {
          if (meta.cores >= ship.cost) {
            meta.cores -= ship.cost;
            meta.unlockedShips.push(ship.id);
            meta.selectedShip = ship.id;
            saveMeta();
            window.soundFX.fusion();
            renderHangarGrid();
          } else {
            alert(`核心不足！需要 ${ship.cost} 核心（當前持有：${meta.cores}）`);
          }
        } else if (!isSelected) {
          meta.selectedShip = ship.id;
          saveMeta();
          window.soundFX.click();
          renderHangarGrid();
        }
      });

      container.appendChild(card);
    });
  }

  // Chip Shop UI
  function openChipShop() {
    window.soundFX.click();
    const modal = document.getElementById('chip-modal');
    renderChipRows();
    modal.classList.add('active');
  }

  function renderChipRows() {
    document.getElementById('chip-currency-display').textContent = meta.cores;
    const list = document.getElementById('chip-list-container');
    list.innerHTML = '';

    chipDefs.forEach((chip) => {
      const currentLvl = meta.upgrades[chip.id] || 0;
      const isMax = currentLvl >= chip.max;
      const cost = isMax ? '已滿級' : `${chip.cost[currentLvl]} 核心`;

      const row = document.createElement('div');
      row.className = 'chip-row';
      row.innerHTML = `
        <div class="chip-info">
          <div class="chip-name">${chip.name} (階級 ${currentLvl}/${chip.max})</div>
          <div class="chip-desc">${chip.desc}</div>
        </div>
        <button class="chip-buy-btn" ${isMax || meta.cores < chip.cost[currentLvl] ? 'disabled' : ''}>
          ${cost}
        </button>
      `;

      const btn = row.querySelector('.chip-buy-btn');
      if (!isMax && meta.cores >= chip.cost[currentLvl]) {
        btn.addEventListener('click', () => {
          meta.cores -= chip.cost[currentLvl];
          meta.upgrades[chip.id] = currentLvl + 1;
          saveMeta();
          window.soundFX.click();
          renderChipRows();
        });
      }

      list.appendChild(row);
    });
  }

  // Main Loop
  let lastTime = performance.now();
  function gameLoop(now) {
    requestAnimationFrame(gameLoop);
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (gameState === 'PLAYING') {
      updateGame(dt);
    }

    renderGame();
  }

  function updateGame(dt) {
    gameTime += dt;
    if (gameTime >= 480) {
      endGame(true);
      return;
    }

    // Dash Recharge Timer
    if (player.dashCharges < player.maxDashCharges) {
      player.dashCdTimer += dt;
      if (player.dashCdTimer >= player.dashCd) {
        player.dashCdTimer = 0;
        player.dashCharges++;
      }
    }

    // Dash Button Visual state
    if (mobileDashBtn) {
      if (player.dashCharges > 0) {
        mobileDashBtn.classList.remove('on-cd');
      } else {
        mobileDashBtn.classList.add('on-cd');
      }
    }

    // Dashing state vs Normal movement
    if (player.isDashing) {
      player.dashDuration -= dt;
      player.x += player.dashVx;
      player.y += player.dashVy;

      // Burn passing enemies
      for (const e of enemies) {
        if (Math.hypot(e.x - player.x, e.y - player.y) < player.radius + e.radius + 10) {
          damageEnemy(e, 45 * player.damageMult);
          const pushA = Math.atan2(e.y - player.y, e.x - player.x);
          e.x += Math.cos(pushA) * 20;
          e.y += Math.sin(pushA) * 20;
        }
      }

      window.particleSystem.addDashTrail(player.x, player.y, player.rotation, player.color);

      if (player.dashDuration <= 0) {
        player.isDashing = false;
      }
    } else {
      // Normal Player Movement
      let mx = 0;
      let my = 0;

      if (keys['w'] || keys['arrowup']) my -= 1;
      if (keys['s'] || keys['arrowdown']) my += 1;
      if (keys['a'] || keys['arrowleft']) mx -= 1;
      if (keys['d'] || keys['arrowright']) mx += 1;

      if (joystick.active) {
        mx = joystick.dx;
        my = joystick.dy;
      }

      const len = Math.hypot(mx, my);
      if (len > 0) {
        player.vx = (mx / len) * player.speed;
        player.vy = (my / len) * player.speed;
        player.rotation = Math.atan2(player.vy, player.vx);
      } else {
        player.vx *= 0.8;
        player.vy *= 0.8;
      }

      player.x += player.vx;
      player.y += player.vy;
    }

    if (player.invulnTime > 0) {
      player.invulnTime -= dt;
    }

    // Player Trail
    if (Math.hypot(player.vx, player.vy) > 0.5) {
      player.trail.push({ x: player.x, y: player.y, alpha: 0.6 });
    }
    for (let i = player.trail.length - 1; i >= 0; i--) {
      player.trail[i].alpha -= dt * 3;
      if (player.trail[i].alpha <= 0) player.trail.splice(i, 1);
    }

    // Camera follow smoothly with Zoom field of view
    const viewW = width / zoom;
    const viewH = height / zoom;
    camera.x += (player.x - viewW / 2 - camera.x) * 0.1;
    camera.y += (player.y - viewH / 2 - camera.y) * 0.1;

    // Updates
    updateEnemySpawns(dt);
    updateWeapons(dt);

    // Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (b.homing && b.target && enemies.includes(b.target)) {
        const angle = Math.atan2(b.target.y - b.y, b.target.x - b.x);
        b.vx = Math.cos(angle) * b.speed;
        b.vy = Math.sin(angle) * b.speed;
      }
      b.x += b.vx;
      b.y += b.vy;
      b.life -= dt;

      for (const e of enemies) {
        if (!b.hitList.has(e) && Math.hypot(e.x - b.x, e.y - b.y) < e.radius + b.radius) {
          b.hitList.add(e);
          damageEnemy(e, b.damage);
          b.pierce--;
          window.particleSystem.addExplosion(b.x, b.y, b.color, 4);
          if (b.pierce <= 0) break;
        }
      }

      if (b.life <= 0 || b.pierce <= 0) {
        bullets.splice(i, 1);
      }
    }

    // Enemy Bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const eb = enemyBullets[i];
      eb.x += eb.vx;
      eb.y += eb.vy;
      eb.life -= dt;

      if (Math.hypot(player.x - eb.x, player.y - eb.y) < player.radius + 6) {
        hurtPlayer(18);
        window.particleSystem.addExplosion(eb.x, eb.y, '#ff0055', 6);
        enemyBullets.splice(i, 1);
        continue;
      }

      if (eb.life <= 0) {
        enemyBullets.splice(i, 1);
      }
    }

    // Enemies collision & cleanup
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];

      // Despawn non-boss if player ran too far away
      if (e.type !== 'boss' && Math.hypot(player.x - e.x, player.y - e.y) > 2200) {
        enemies.splice(i, 1);
        continue;
      }

      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(angle) * e.speed;
      e.y += Math.sin(angle) * e.speed;

      if (e.hitFlash > 0) e.hitFlash -= dt;

      if (e.type === 'sentinel') {
        e.shootTimer += dt;
        if (e.shootTimer >= 3.0) {
          e.shootTimer = 0;
          enemyBullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(angle) * 4.2,
            vy: Math.sin(angle) * 4.2,
            life: 3.5
          });
        }
      } else if (e.type === 'boss') {
        e.attackTimer += dt;
        e.spiralAngle += dt * 3.5;
        if (e.attackTimer >= (e.isApex ? 0.35 : 0.7)) {
          e.attackTimer = 0;
          const bulletCount = e.isApex ? 6 : 4;
          for (let b = 0; b < bulletCount; b++) {
            const bAngle = e.spiralAngle + (b * Math.PI * 2) / bulletCount;
            enemyBullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(bAngle) * 3.8,
              vy: Math.sin(bAngle) * 3.8,
              life: 4.5
            });
          }
        }
      }

      if (Math.hypot(player.x - e.x, player.y - e.y) < player.radius + e.radius) {
        // Titan reflect damage
        if (player.shipId === 'titan') {
          damageEnemy(e, 65 * player.damageMult);
          window.particleSystem.addExplosion(e.x, e.y, '#ffaa00', 8);
        }
        hurtPlayer(e.type === 'boss' ? 28 : 12);
      }
    }

    // Drops Magnet & Pickup
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      const dist = Math.hypot(player.x - d.x, player.y - d.y);

      if (dist < player.magnetRadius) {
        const angle = Math.atan2(player.y - d.y, player.x - d.x);
        d.x += Math.cos(angle) * 8.5;
        d.y += Math.sin(angle) * 8.5;
      }

      if (dist < player.radius + 12) {
        window.soundFX.pickup();
        if (d.type === 'exp') {
          player.exp += d.val;
          checkLevelUp();
        } else if (d.type === 'core') {
          sessionCores += d.val;
        } else if (d.type === 'heal') {
          player.hp = Math.min(player.maxHp, player.hp + d.val);
        } else if (d.type === 'nuke') {
          triggerNuke();
        }
        drops.splice(i, 1);
      }
    }

    window.particleSystem.update(dt);
    updateHUD();
  }

  function updateHUD() {
    const min = Math.floor(gameTime / 60);
    const sec = Math.floor(gameTime % 60);
    document.getElementById('timer-val').textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    document.getElementById('kill-val').textContent = killCount;
    document.getElementById('core-val').textContent = sessionCores;
    document.getElementById('level-val').textContent = player.level;

    const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
    document.getElementById('hud-hp-fill').style.width = `${hpPct}%`;

    const expPct = Math.max(0, Math.min(100, (player.exp / player.nextExp) * 100));
    document.getElementById('exp-bar-fill').style.width = `${expPct}%`;
  }

  // Render Game Scene with camera Zoom
  function renderGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0);

    const viewW = width / zoom;
    const viewH = height / zoom;

    ctx.fillStyle = '#05070e';
    ctx.fillRect(0, 0, viewW, viewH);

    const shake = window.particleSystem.screenShake;
    const cam = { x: camera.x + shake.x, y: camera.y + shake.y };

    drawCyberGrid(cam, viewW, viewH);
    window.particleSystem.drawGridMotes(ctx, cam);
    drawDrops(cam);

    for (const t of player ? player.trail : []) {
      ctx.fillStyle = `rgba(${player.shipId === 'phantom' ? '255, 0, 170' : '0, 243, 255'}, ${t.alpha * 0.4})`;
      ctx.beginPath();
      ctx.arc(t.x - cam.x, t.y - cam.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const e of enemies) {
      drawEnemy(e, cam);
    }

    for (const eb of enemyBullets) {
      ctx.fillStyle = '#ff0055';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff0055';
      ctx.beginPath();
      ctx.arc(eb.x - cam.x, eb.y - cam.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const b of bullets) {
      ctx.fillStyle = b.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = b.color;
      ctx.beginPath();
      ctx.arc(b.x - cam.x, b.y - cam.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (player && player.weapons.blades > 0) {
      drawOrbitalBlades(cam);
    }

    if (player && player.weapons.drone > 0) {
      drawDrone(cam);
    }

    if (player && player.weapons.aegis_fortress > 0) {
      drawAegisSatellites(cam);
    }

    if (player && gameState !== 'GAMEOVER') {
      drawPlayer(cam);
    }

    window.particleSystem.draw(ctx, cam);

    ctx.restore();
  }

  function drawCyberGrid(cam, viewW, viewH) {
    const gridSize = 60;
    const offsetX = -cam.x % gridSize;
    const offsetY = -cam.y % gridSize;

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.07)';
    ctx.lineWidth = 1;

    for (let x = offsetX; x < viewW + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, viewH);
      ctx.stroke();
    }
    for (let y = offsetY; y < viewH + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(viewW, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayer(cam) {
    const px = player.x - cam.x;
    const py = player.y - cam.y;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(player.rotation);

    ctx.shadowBlur = 18;
    ctx.shadowColor = player.color;

    ctx.fillStyle = player.invulnTime > 0 && Math.floor(Date.now() / 60) % 2 === 0 ? '#ffffff' : player.color;

    // Distinct hull shapes for different ships
    if (player.shipId === 'phantom') {
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(-14, -8);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-14, 8);
      ctx.closePath();
      ctx.fill();
    } else if (player.shipId === 'titan') {
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(8, -14);
      ctx.lineTo(-14, -14);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-14, 14);
      ctx.lineTo(8, 14);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-12, -12);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-12, 12);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    if (player.shield > 0) {
      ctx.shadowColor = '#00aaff';
      ctx.strokeStyle = `rgba(0, 170, 255, ${0.4 + Math.sin(Date.now() * 0.005) * 0.2})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, player.radius + 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawEnemy(e, cam) {
    const ex = e.x - cam.x;
    const ey = e.y - cam.y;

    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = e.color;
    ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : e.color;

    if (e.type === 'drone') {
      ctx.beginPath();
      ctx.moveTo(ex, ey - e.radius);
      ctx.lineTo(ex + e.radius, ey);
      ctx.lineTo(ex, ey + e.radius);
      ctx.lineTo(ex - e.radius, ey);
      ctx.closePath();
      ctx.fill();
    } else if (e.type === 'crawler') {
      ctx.beginPath();
      ctx.arc(ex, ey, e.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'sentinel') {
      ctx.beginPath();
      ctx.arc(ex, ey, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (e.type === 'stalker') {
      ctx.beginPath();
      ctx.arc(ex, ey, e.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'boss') {
      const pulse = Math.sin(Date.now() * 0.006) * 4;
      ctx.beginPath();
      ctx.arc(ex, ey, e.radius + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      const barW = 80;
      const barH = 7;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(ex - barW / 2, ey - e.radius - 20, barW, barH);
      ctx.fillStyle = '#ff0033';
      ctx.fillRect(ex - barW / 2, ey - e.radius - 20, barW * (e.hp / e.maxHp), barH);
    }

    ctx.restore();
  }

  function drawOrbitalBlades(cam) {
    const cfg = WEAPON_REGISTRY.blades.levels[player.weapons.blades - 1];
    const angleStep = (Math.PI * 2) / cfg.count;

    ctx.save();
    for (let i = 0; i < cfg.count; i++) {
      const a = player.timers.bladesAngle + i * angleStep;
      const bx = player.x + Math.cos(a) * cfg.radius - cam.x;
      const by = player.y + Math.sin(a) * cfg.radius - cam.y;

      ctx.shadowBlur = 15;
      ctx.shadowColor = '#39ff14';
      ctx.fillStyle = '#39ff14';

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(a + Math.PI / 2);
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawDrone(cam) {
    const angle = Date.now() * 0.003;
    const dx = player.x + Math.cos(angle) * 40 - cam.x;
    const dy = player.y + Math.sin(angle) * 40 - cam.y;

    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff00aa';
    ctx.fillStyle = '#ff00aa';
    ctx.beginPath();
    ctx.arc(dx, dy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawAegisSatellites(cam) {
    for (let i = 0; i < 4; i++) {
      const angle = (Date.now() * 0.004) + (i * Math.PI / 2);
      const sx = player.x + Math.cos(angle) * 60 - cam.x;
      const sy = player.y + Math.sin(angle) * 60 - cam.y;

      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ffd700';
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawDrops(cam) {
    for (const d of drops) {
      const dx = d.x - cam.x;
      const dy = d.y - cam.y;

      ctx.save();
      if (d.type === 'exp') {
        ctx.fillStyle = d.val > 50 ? '#ffe600' : (d.val > 20 ? '#ff007f' : '#00f3ff');
        ctx.shadowBlur = 8;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fillRect(dx - 3, dy - 3, 6, 6);
      } else if (d.type === 'core') {
        ctx.fillStyle = '#00ffaa';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00ffaa';
        ctx.beginPath();
        ctx.arc(dx, dy, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.type === 'heal') {
        ctx.fillStyle = '#00ff66';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ff66';
        ctx.font = '16px sans-serif';
        ctx.fillText('✚', dx - 6, dy + 6);
      } else if (d.type === 'nuke') {
        ctx.fillStyle = '#ff0033';
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#ff0033';
        ctx.font = '18px sans-serif';
        ctx.fillText('💣', dx - 8, dy + 6);
      }
      ctx.restore();
    }
  }

  // Bind Buttons & Events
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('replay-btn').addEventListener('click', startGame);
  document.getElementById('open-hangar-btn').addEventListener('click', openHangar);
  document.getElementById('close-hangar-btn').addEventListener('click', () => {
    window.soundFX.click();
    document.getElementById('hangar-modal').classList.remove('active');
  });
  document.getElementById('open-chip-btn').addEventListener('click', openChipShop);
  document.getElementById('settlement-chip-btn').addEventListener('click', openChipShop);
  document.getElementById('close-chip-btn').addEventListener('click', () => {
    window.soundFX.click();
    document.getElementById('chip-modal').classList.remove('active');
  });

  const muteBtn = document.getElementById('mute-btn');
  muteBtn.addEventListener('click', () => {
    const isMuted = window.soundFX.toggleMute();
    muteBtn.textContent = isMuted ? '🔇 靜音' : '🔊 音效';
  });

  requestAnimationFrame(gameLoop);
})();
