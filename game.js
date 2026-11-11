// Cyber Pulse: Overdrive V4.0 - Core Game Engine
(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  // Meta Progression (Chip Upgrades, Stage & Hangar saved in localStorage)
  const defaultMeta = {
    cores: 0,
    selectedShip: 'assault',
    selectedStage: 'sector_1',
    unlockedShips: ['assault'],
    upgrades: {
      maxHp: 0,
      damage: 0,
      speed: 0,
      magnet: 0,
      cooldown: 0,
      crit: 0,
      expBonus: 0,
      coreBonus: 0
    }
  };

  const chipDefs = [
    { id: 'maxHp', name: '奈米裝甲核心', desc: '提升最大生命值 +20%', max: 5, cost: [50, 120, 250, 500, 1000], bonus: (lvl) => 1 + lvl * 0.2 },
    { id: 'damage', name: '超載能量電容', desc: '全武器基礎傷害 +15%', max: 5, cost: [60, 150, 300, 600, 1200], bonus: (lvl) => 1 + lvl * 0.15 },
    { id: 'speed', name: '重力推進噴口', desc: '機體移動速度 +10%', max: 5, cost: [40, 100, 200, 450, 900], bonus: (lvl) => 1 + lvl * 0.1 },
    { id: 'magnet', name: '量子磁吸場', desc: '晶體能量拾取範圍 +30%', max: 5, cost: [30, 80, 180, 400, 800], bonus: (lvl) => 1 + lvl * 0.3 },
    { id: 'cooldown', name: '高頻超頻晶片', desc: '所有武器冷卻縮減 +8%', max: 5, cost: [70, 160, 350, 700, 1500], bonus: (lvl) => 1 - lvl * 0.08 },
    { id: 'crit', name: '精確瞄準矩陣', desc: '暴擊率 +6% (暴擊造成2倍傷害)', max: 5, cost: [50, 130, 280, 550, 1100], bonus: (lvl) => lvl * 0.06 },
    { id: 'expBonus', name: '超頻神經網路', desc: '戰鬥經驗值獲取量 +15%', max: 5, cost: [45, 110, 240, 480, 950], bonus: (lvl) => 1 + lvl * 0.15 },
    { id: 'coreBonus', name: '核心萃取協定', desc: '核心晶片獲取量與結算獎勵 +20%', max: 5, cost: [80, 180, 400, 800, 1600], bonus: (lvl) => 1 + lvl * 0.2 }
  ];

  // Stage / Level Registry
  const STAGE_REGISTRY = {
    sector_1: {
      id: 'sector_1',
      name: '🌃 霓虹矩陣',
      stars: '★☆☆☆',
      duration: 360, // 6 mins
      coreMult: 1.0,
      hpScale: 1.0,
      spdScale: 1.0,
      bgDark: '#05070e',
      gridColor: '0, 243, 255',
      accentHex: '#00f3ff',
      desc: '標準 6 分鐘賽博網格戰區，鎮守首領：霓虹霸主 & 頂點核心。'
    },
    sector_2: {
      id: 'sector_2',
      name: '🌋 赤紅熔核帶',
      stars: '★★☆☆',
      duration: 480, // 8 mins
      coreMult: 1.5,
      hpScale: 1.25,
      spdScale: 1.15,
      bgDark: '#120406',
      gridColor: '255, 70, 20',
      accentHex: '#ff4614',
      desc: '高溫熔岩星區，敵速+15%，出沒自爆熔岩蟲與首領【獄炎機神】。'
    },
    sector_3: {
      id: 'sector_3',
      name: '🌌 虛空星淵',
      stars: '★★★☆',
      duration: 480, // 8 mins
      coreMult: 2.2,
      hpScale: 1.55,
      spdScale: 1.2,
      bgDark: '#080314',
      gridColor: '175, 50, 255',
      accentHex: '#af32ff',
      desc: '暗物質深淵，敵血+55%，出沒量子分裂體與首領【虛空利維坦】。'
    },
    sector_4: {
      id: 'sector_4',
      name: '♾️ 歐米茄無盡煉獄',
      stars: '★★★★',
      duration: Infinity, // Endless
      coreMult: 3.0,
      hpScale: 1.85,
      spdScale: 1.28,
      bgDark: '#110d02',
      gridColor: '255, 200, 0',
      accentHex: '#ffc800',
      desc: '無時間上限終極煉獄！全敵種混編、首領輪番降臨，核心收益 300%！'
    }
  };

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
      cdrBonus: 0,
      magBonus: 0,
      dashCharges: 1,
      dashCd: 2.2,
      startWeapons: { blaster: 1 }
    },
    phantom: {
      id: 'phantom',
      name: 'PHANTOM-X 幽靈',
      role: '高機動刺客戰機',
      avatar: '🛸',
      desc: '超高航速、具備 2 次連續衝刺充能！起始武裝為旋轉光刃，機動性極致飄逸。',
      cost: 150,
      color: '#ff00aa',
      hpMult: 0.85,
      spdMult: 1.25,
      critBonus: 0.08,
      cdrBonus: 0,
      magBonus: 0,
      dashCharges: 2,
      dashCd: 1.8,
      startWeapons: { blades: 1 }
    },
    titan: {
      id: 'titan',
      name: 'TITAN-IX 泰坦',
      role: '重裝裝甲堡壘',
      avatar: '🛡️',
      desc: '厚實裝甲與常態護盾，開局持連鎖電弧與相位護盾，衝撞反傷撕裂敵群。',
      cost: 250,
      color: '#ffaa00',
      hpMult: 1.55,
      spdMult: 0.90,
      critBonus: 0.0,
      cdrBonus: 0,
      magBonus: 0,
      dashCharges: 1,
      dashCd: 2.8,
      startWeapons: { lightning: 1, shield: 1 }
    },
    valkyrie: {
      id: 'valkyrie',
      name: 'VALKYRIE-7 女武神',
      role: '稜鏡光束特化機',
      avatar: '☄️',
      desc: '搭載高能光學核心，開局配備【稜鏡聚焦雷射 + 浮游支援機】，自帶 15% 冷卻縮減！',
      cost: 350,
      color: '#ff3366',
      hpMult: 1.05,
      spdMult: 1.12,
      critBonus: 0.12,
      cdrBonus: 0.15,
      magBonus: 0,
      dashCharges: 2,
      dashCd: 2.0,
      startWeapons: { laser: 1, drone: 1 }
    },
    frostbite: {
      id: 'frostbite',
      name: 'ZERO-K 極凍零號',
      role: '極寒領域控場機',
      avatar: '❄️',
      desc: '量子低溫戰術機，開局配備【絕對零度冰環 + 量子迴旋鏢】，自帶 +40% 磁吸範圍與 2 次衝刺！',
      cost: 450,
      color: '#00ffcc',
      hpMult: 1.2,
      spdMult: 1.10,
      critBonus: 0.08,
      cdrBonus: 0.08,
      magBonus: 0.40,
      dashCharges: 2,
      dashCd: 1.9,
      startWeapons: { frost: 1, boomerang: 1 }
    }
  };

  let meta = JSON.parse(localStorage.getItem('cyber_pulse_meta_v2') || 'null');
  if (!meta) {
    const oldMeta = JSON.parse(localStorage.getItem('cyber_pulse_meta') || 'null');
    meta = JSON.parse(JSON.stringify(defaultMeta));
    if (oldMeta) {
      meta.cores = oldMeta.cores || 0;
      meta.upgrades = Object.assign(meta.upgrades, oldMeta.upgrades || {});
    }
  } else {
    meta.selectedStage = meta.selectedStage || 'sector_1';
    meta.upgrades = Object.assign({}, defaultMeta.upgrades, meta.upgrades || {});
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

  // Input Handling & PC-Only Secret "debug" Key Sequence
  const keys = {};
  const debugState = {
    unlocked: false,
    godMode: false,
    infiniteOverdrive: false
  };
  let debugKeyBuffer = '';

  function isPCDevice() {
    return window.innerWidth > 768 && !window.matchMedia('(pointer: coarse)').matches;
  }

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    window.soundFX.ensureContext();
    if (k === ' ' || k === 'shift') {
      triggerDash();
    }

    // Track secret "debug" code on PC only
    if (k.length === 1 && k >= 'a' && k <= 'z' && isPCDevice()) {
      debugKeyBuffer = (debugKeyBuffer + k).slice(-10);
      if (debugKeyBuffer.endsWith('debug')) {
        debugKeyBuffer = '';
        toggleDebugConsole();
      }
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
      if (touch.clientX > width - 150 && touch.clientY > height - 200) continue;

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
    },
    boomerang: {
      name: '量子迴旋鏢',
      type: '迴旋切割',
      icon: '🪃',
      desc: '投擲高能電漿迴旋鏢，穿透敵陣後折返機體，來回切割路徑敵軍',
      levels: [
        { cooldown: 1.5, damage: 28, count: 1, speed: 11 },
        { cooldown: 1.35, damage: 36, count: 2, speed: 12 },
        { cooldown: 1.2, damage: 45, count: 2, speed: 13 },
        { cooldown: 1.0, damage: 56, count: 3, speed: 14 },
        { cooldown: 0.8, damage: 72, count: 4, speed: 15, label: '【超限滿級】次元迴旋斬' }
      ]
    },
    laser: {
      name: '稜鏡聚焦雷射',
      type: '高能光束',
      icon: '🔦',
      desc: '鎖定目標發射瞬間貫穿的高溫聚焦雷射，直線融化一切重甲敵機',
      levels: [
        { cooldown: 1.7, damage: 48, beams: 1, width: 6 },
        { cooldown: 1.45, damage: 65, beams: 1, width: 8 },
        { cooldown: 1.25, damage: 82, beams: 2, width: 9 },
        { cooldown: 1.05, damage: 105, beams: 2, width: 11 },
        { cooldown: 0.82, damage: 140, beams: 3, width: 14, label: '【超限滿級】死星稜鏡砲' }
      ]
    },
    mine: {
      name: '虛空引力地雷',
      type: '戰術佈雷',
      icon: '💣',
      desc: '隨移動在場上佈下高爆電磁地雷，敵人觸發時引爆大範圍電漿震波',
      levels: [
        { cooldown: 2.2, damage: 60, count: 1, radius: 90 },
        { cooldown: 1.9, damage: 80, count: 1, radius: 105 },
        { cooldown: 1.6, damage: 105, count: 2, radius: 115 },
        { cooldown: 1.35, damage: 130, count: 2, radius: 130 },
        { cooldown: 1.05, damage: 170, count: 3, radius: 150, label: '【超限滿級】量子毀滅雷區' }
      ]
    },
    frost: {
      name: '絕對零度冰環',
      type: '極寒控場',
      icon: '❄️',
      desc: '在機體周圍張開常駐極寒力場，持續凍傷範圍內敵軍並大幅降低其航速',
      levels: [
        { radius: 110, damage: 15, slow: 0.65 },
        { radius: 130, damage: 22, slow: 0.58 },
        { radius: 150, damage: 30, slow: 0.50 },
        { radius: 175, damage: 40, slow: 0.42 },
        { radius: 205, damage: 55, slow: 0.35, label: '【超限滿級】永凍極地領域' }
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
    },
    chrono_blizzard: {
      name: '極光時空暴雪',
      type: '傳奇超武',
      icon: '🌨️',
      desc: '【迴旋鏢 + 絕對零度 終極融合】召喚全場極寒冰晶風暴凍結敵軍，並齊射 6 枚巨型次元斬刃！',
      req: ['boomerang', 'frost']
    },
    omega_annihilator: {
      name: '歐米茄毀滅死光',
      type: '傳奇超武',
      icon: '☄️',
      desc: '【聚焦雷射 + 引力地雷 終極融合】機體爆發 360 度彩虹稜鏡死光橫掃全場，並引發連環量子爆破！',
      req: ['laser', 'mine']
    }
  };

  // Game Runtime State
  let gameState = 'MENU';
  let currentStage = STAGE_REGISTRY.sector_1;
  let gameTime = 0;
  let killCount = 0;
  let sessionCores = 0;
  let totalDamageDealt = 0;
  let bossSpawned3m = false;
  let bossSpawned7m = false;
  let nextEndlessBossTime = 150;
  let nextEliteTime = 45;
  let warningBannerTimer = 0;

  const camera = { x: 0, y: 0 };
  let player;
  let enemies = [];
  let bullets = [];
  let enemyBullets = [];
  let mines = [];
  let laserBeams = [];
  let drops = [];

  function showWarningBanner(text, duration = 3.2) {
    const banner = document.getElementById('warning-banner');
    if (!banner) return;
    banner.textContent = text;
    banner.classList.add('active');
    warningBannerTimer = duration;
  }

  // Create Player based on Selected Ship & Chips
  function createPlayer() {
    const ship = SHIP_REGISTRY[meta.selectedShip] || SHIP_REGISTRY.assault;

    const hpBonus = chipDefs[0].bonus(meta.upgrades.maxHp || 0) * ship.hpMult;
    const dmgBonus = chipDefs[1].bonus(meta.upgrades.damage || 0);
    const spdBonus = chipDefs[2].bonus(meta.upgrades.speed || 0) * ship.spdMult;
    const magBonus = chipDefs[3].bonus(meta.upgrades.magnet || 0) * (1 + (ship.magBonus || 0));
    const cdrBonus = chipDefs[4].bonus(meta.upgrades.cooldown || 0) * (1 - (ship.cdrBonus || 0));
    const critBonus = chipDefs[5].bonus(meta.upgrades.crit || 0) + ship.critBonus;
    const expMult = chipDefs[6].bonus(meta.upgrades.expBonus || 0);
    const coreMult = chipDefs[7].bonus(meta.upgrades.coreBonus || 0) * (currentStage ? currentStage.coreMult : 1.0);

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
      expMult,
      coreMult,
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
      // Powerup States
      overdriveTimer: 0,
      globalMagnetActive: false,
      globalMagnetTimer: 0,
      weapons: Object.assign({
        blaster: 0, blades: 0, lightning: 0, nova: 0, drone: 0, shield: 0,
        boomerang: 0, laser: 0, mine: 0, frost: 0,
        orbital_judgement: 0, vortex_singularity: 0, aegis_fortress: 0,
        chrono_blizzard: 0, omega_annihilator: 0
      }, ship.startWeapons),
      timers: {
        blaster: 0,
        bladesAngle: 0,
        lightning: 0,
        nova: 0,
        drone: 0,
        boomerang: 0,
        laser: 0,
        mine: 0,
        frost: 0,
        orbital_judgement: 0,
        vortex_singularity: 0,
        aegis_fortress: 0,
        chrono_blizzard: 0,
        omega_annihilator: 0
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

  // Map Random Powerup Item Spawner
  let mapItemSpawnTimer = 0;
  function updateMapItemSpawns(dt) {
    mapItemSpawnTimer += dt;
    const activeSpecialItems = drops.filter(d => ['magnet', 'heal', 'overdrive', 'nuke', 'chest'].includes(d.type)).length;
    // Spawn every 18 seconds if fewer than 6 special items on the map
    if (mapItemSpawnTimer >= 18 && activeSpecialItems < 6) {
      mapItemSpawnTimer = 0;
      spawnRandomMapPowerup();
    }
  }

  function spawnRandomMapPowerup(nearDist = null) {
    if (!player) return;
    const angle = Math.random() * Math.PI * 2;
    const dist = nearDist !== null ? nearDist : (Math.random() * 500 + 420);
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;

    const types = ['heal', 'magnet', 'overdrive', 'chest', 'nuke'];
    const weights = [0.30, 0.25, 0.22, 0.13, 0.10];
    let r = Math.random();
    let selectedType = 'heal';
    for (let i = 0; i < types.length; i++) {
      if (r < weights[i]) {
        selectedType = types[i];
        break;
      }
      r -= weights[i];
    }

    drops.push({
      x,
      y,
      type: selectedType,
      isMapItem: true,
      spawnTime: gameTime
    });
  }

  // Enemy Spawns & Swarm Horde System
  let spawnTimer = 0;
  let nextSwarmTime = 30; // First swarm wave at 30 seconds

  function updateEnemySpawns(dt) {
    spawnTimer += dt;

    // Much denser spawn rate: generates true monster hordes
    const interval = Math.max(0.07, 0.42 - (gameTime / 360) * 0.32);

    if (spawnTimer >= interval && enemies.length < 185) {
      spawnTimer = 0;
      // Scales from 2 to 12 enemies per spawn burst
      const count = 2 + Math.min(10, Math.floor(gameTime / 30) * 2);
      for (let i = 0; i < count; i++) {
        if (enemies.length >= 185) break;
        spawnRandomEnemy(false);
      }
    }

    // Periodic Golden Elite Enemy (every 45s)
    if (gameTime >= nextEliteTime) {
      nextEliteTime += 45;
      spawnRandomEnemy(true);
    }

    // Periodic Massive Swarm Invasions (Surrounding Rings of Monsters)
    if (gameTime >= nextSwarmTime) {
      nextSwarmTime += 40; // Wave every 40s
      showWarningBanner('⚠ 警告：大規模賽博蟲群包圍網接近 ⚠', 2.8);
      spawnSwarmRing(28 + Math.min(28, Math.floor(gameTime / 15)));
    }

    // Stage Boss spawns
    if (currentStage.id === 'sector_4') {
      if (gameTime >= nextEndlessBossTime) {
        nextEndlessBossTime += 135;
        const tiers = ['OVERLORD', 'VULCAN', 'LEVIATHAN', 'APEX'];
        const pick = tiers[Math.floor((gameTime / 135) % tiers.length)];
        spawnBoss(pick);
      }
    } else {
      const midTime = currentStage.id === 'sector_1' ? 150 : 180;
      const finalTime = currentStage.id === 'sector_1' ? 300 : 400;

      if (gameTime >= midTime && !bossSpawned3m) {
        bossSpawned3m = true;
        if (currentStage.id === 'sector_2') spawnBoss('VULCAN');
        else if (currentStage.id === 'sector_3') spawnBoss('LEVIATHAN');
        else spawnBoss('OVERLORD');
      }
      if (gameTime >= finalTime && !bossSpawned7m) {
        bossSpawned7m = true;
        spawnBoss('APEX');
      }
    }
  }

  // Spawns a dense ring of fast drones closing in from all 360 degrees
  function spawnSwarmRing(count) {
    window.soundFX.shoot(300);
    window.particleSystem.triggerScreenShake(6, 0.2);

    const viewW = width / zoom;
    const viewH = height / zoom;
    const radius = Math.hypot(viewW, viewH) * 0.55 + 90;
    const hpMult = currentStage.hpScale;
    const spdMult = currentStage.spdScale;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = player.x + Math.cos(angle) * radius;
      const y = player.y + Math.sin(angle) * radius;
      const hp = (16 + gameTime * 0.3) * hpMult;

      enemies.push({
        x,
        y,
        type: 'drone',
        hp,
        maxHp: hp,
        speed: 2.3 * spdMult,
        radius: 11,
        color: '#ff0055', // Red glowing swarm
        expVal: 8,
        shootTimer: 0,
        hitFlash: 0,
        slowTimer: 0,
        slowFactor: 1
      });
    }
  }

  function spawnRandomEnemy(isElite = false) {
    const angle = Math.random() * Math.PI * 2;
    const viewW = width / zoom;
    const viewH = height / zoom;
    const dist = Math.hypot(viewW, viewH) * 0.55 + 80;
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;

    const r = Math.random();
    let type = 'drone';

    if ((currentStage.id === 'sector_2' || currentStage.id === 'sector_4' || gameTime > 90) && r < 0.18) {
      type = 'bomber';
    } else if ((currentStage.id === 'sector_3' || currentStage.id === 'sector_4' || gameTime > 140) && r < 0.34) {
      type = 'splitter';
    } else if (gameTime > 110 && r < 0.52) {
      type = 'sentinel';
    } else if (gameTime > 45 && r < 0.75) {
      type = 'crawler';
    } else if (gameTime > 180 && r < 0.90) {
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
    } else if (type === 'bomber') {
      hp = 38 + gameTime * 0.7;
      speed = 2.85;
      radius = 14;
      color = '#ff5500';
      expVal = 28;
    } else if (type === 'splitter') {
      hp = 85 + gameTime * 1.15;
      speed = 1.5;
      radius = 18;
      color = '#00ffaa';
      expVal = 35;
    }

    hp *= currentStage.hpScale;
    speed *= currentStage.spdScale;

    if (isElite) {
      hp *= 5.5;
      radius = Math.round(radius * 1.45);
      color = '#ffd700';
      expVal *= 5;
    }

    enemies.push({
      x,
      y,
      type,
      isElite,
      hp,
      maxHp: hp,
      speed,
      radius,
      color,
      expVal,
      shootTimer,
      hitFlash: 0,
      slowTimer: 0,
      slowFactor: 1
    });
  }

  function spawnBoss(tier) {
    window.soundFX.bossAlarm();
    window.particleSystem.triggerScreenShake(14, 0.6);

    const angle = Math.random() * Math.PI * 2;
    const x = player.x + Math.cos(angle) * 350;
    const y = player.y + Math.sin(angle) * 350;

    let name = '【OVERLORD】霓虹霸主';
    let hp = 2800 * currentStage.hpScale;
    let speed = 1.15;
    let radius = 38;
    let color = '#ffff00';
    let isApex = false;

    if (tier === 'VULCAN') {
      name = '【VULCAN】獄炎機神';
      hp = 4200 * currentStage.hpScale;
      speed = 1.3;
      radius = 42;
      color = '#ff4500';
    } else if (tier === 'LEVIATHAN') {
      name = '【LEVIATHAN】虛空利維坦';
      hp = 5600 * currentStage.hpScale;
      speed = 1.25;
      radius = 44;
      color = '#b829ff';
    } else if (tier === 'APEX') {
      name = '【APEX CORE】頂點核心';
      hp = 7500 * currentStage.hpScale;
      speed = 1.4;
      radius = 46;
      color = '#ff0033';
      isApex = true;
    }

    showWarningBanner(`⚠ 首領降臨：${name} ⚠`, 4.0);

    enemies.push({
      x,
      y,
      type: 'boss',
      bossTier: tier,
      isApex,
      name,
      hp,
      maxHp: hp,
      speed,
      radius,
      color,
      expVal: 800,
      attackTimer: 0,
      spiralAngle: 0,
      hitFlash: 0,
      slowTimer: 0,
      slowFactor: 1
    });
  }

  // Weapons & Super Weapons Update
  function updateWeapons(dt) {
    const effCdr = player.overdriveTimer > 0 ? player.cdr * 0.52 : player.cdr;

    // 1. Pulse Blaster
    if (player.weapons.blaster > 0) {
      const cfg = WEAPON_REGISTRY.blaster.levels[player.weapons.blaster - 1];
      player.timers.blaster += dt;
      const rate = cfg.fireRate * effCdr;
      if (player.timers.blaster >= rate) {
        player.timers.blaster = 0;
        fireBlaster(cfg);
      }
    }

    // 2. Orbital Blades
    if (player.weapons.blades > 0) {
      const cfg = WEAPON_REGISTRY.blades.levels[player.weapons.blades - 1];
      player.timers.bladesAngle += cfg.speed * dt * (player.overdriveTimer > 0 ? 1.4 : 1.0);
      checkBladeCollisions(cfg);
    }

    // 3. Arc Lightning
    if (player.weapons.lightning > 0) {
      const cfg = WEAPON_REGISTRY.lightning.levels[player.weapons.lightning - 1];
      player.timers.lightning += dt;
      const cd = cfg.cooldown * effCdr;
      if (player.timers.lightning >= cd) {
        player.timers.lightning = 0;
        fireLightning(cfg);
      }
    }

    // 4. Plasma Nova
    if (player.weapons.nova > 0) {
      const cfg = WEAPON_REGISTRY.nova.levels[player.weapons.nova - 1];
      player.timers.nova += dt;
      const cd = cfg.cooldown * effCdr;
      if (player.timers.nova >= cd) {
        player.timers.nova = 0;
        fireNova(cfg);
      }
    }

    // 5. Drone Companion
    if (player.weapons.drone > 0) {
      const cfg = WEAPON_REGISTRY.drone.levels[player.weapons.drone - 1];
      player.timers.drone += dt;
      const rate = cfg.fireRate * effCdr;
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

    // 7. Quantum Boomerang
    if (player.weapons.boomerang > 0) {
      const cfg = WEAPON_REGISTRY.boomerang.levels[player.weapons.boomerang - 1];
      player.timers.boomerang += dt;
      const cd = cfg.cooldown * effCdr;
      if (player.timers.boomerang >= cd) {
        player.timers.boomerang = 0;
        fireBoomerang(cfg);
      }
    }

    // 8. Prism Laser Beam
    if (player.weapons.laser > 0) {
      const cfg = WEAPON_REGISTRY.laser.levels[player.weapons.laser - 1];
      player.timers.laser += dt;
      const cd = cfg.cooldown * effCdr;
      if (player.timers.laser >= cd) {
        player.timers.laser = 0;
        fireLaser(cfg);
      }
    }

    // 9. Cyber Proximity Mines
    if (player.weapons.mine > 0) {
      const cfg = WEAPON_REGISTRY.mine.levels[player.weapons.mine - 1];
      player.timers.mine += dt;
      const cd = cfg.cooldown * effCdr;
      if (player.timers.mine >= cd) {
        player.timers.mine = 0;
        deployMines(cfg);
      }
    }

    // 10. Cryo Frost Field
    if (player.weapons.frost > 0) {
      const cfg = WEAPON_REGISTRY.frost.levels[player.weapons.frost - 1];
      player.timers.frost += dt;
      if (player.timers.frost >= 0.35) {
        player.timers.frost = 0;
        updateFrostField(cfg);
      }
    }

    // --- SUPER WEAPONS ---
    // A. Orbital Judgement
    if (player.weapons.orbital_judgement > 0) {
      player.timers.orbital_judgement += dt;
      const cd = 3.2 * effCdr;
      if (player.timers.orbital_judgement >= cd) {
        player.timers.orbital_judgement = 0;
        triggerOrbitalJudgement();
      }
    }

    // B. Vortex Singularity
    if (player.weapons.vortex_singularity > 0) {
      player.timers.vortex_singularity += dt;
      const cd = 3.6 * effCdr;
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

    // D. Chrono Blizzard
    if (player.weapons.chrono_blizzard > 0) {
      player.timers.chrono_blizzard += dt;
      const cd = 3.4 * effCdr;
      if (player.timers.chrono_blizzard >= cd) {
        player.timers.chrono_blizzard = 0;
        triggerChronoBlizzard();
      }
    }

    // E. Omega Annihilator
    if (player.weapons.omega_annihilator > 0) {
      player.timers.omega_annihilator += dt;
      const cd = 3.0 * effCdr;
      if (player.timers.omega_annihilator >= cd) {
        player.timers.omega_annihilator = 0;
        triggerOmegaAnnihilator();
      }
    }
  }

  // O(N) fast closest enemy finder using squared distance (Zero array allocation, zero Math.sqrt)
  function getClosestEnemy(x, y, maxDistSq = Infinity) {
    let closest = null;
    let minDistSq = maxDistSq;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      const dx = e.x - x;
      const dy = e.y - y;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistSq) {
        minDistSq = distSq;
        closest = e;
      }
    }
    return closest;
  }

  function fireBlaster(cfg) {
    if (enemies.length === 0) return;
    const target = getClosestEnemy(player.x, player.y);
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

      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (!e) continue;
        const hitR = e.radius + 14;
        const dx = e.x - bx;
        const dy = e.y - by;
        if (Math.abs(dx) > hitR || Math.abs(dy) > hitR) continue;
        if (dx * dx + dy * dy < hitR * hitR) {
          damageEnemy(e, cfg.damage * player.damageMult * 0.25);
          window.soundFX.blade();
          if (Math.random() < 0.25) {
            window.particleSystem.addExplosion(bx, by, '#39ff14', 2);
          }
        }
      }
    }
  }

  function fireLightning(cfg) {
    if (enemies.length === 0) return;
    let current = getClosestEnemy(player.x, player.y);
    if (!current) return;

    window.soundFX.lightning();
    const hitSet = new Set([current]);
    damageEnemy(current, cfg.damage * player.damageMult);

    for (let c = 0; c < cfg.chains; c++) {
      window.particleSystem.addExplosion(current.x, current.y, '#ffe600', 4);
      let next = null;
      let minDistSq = 220 * 220;
      for (let i = 0; i < enemies.length; i++) {
        const candidate = enemies[i];
        if (!hitSet.has(candidate)) {
          const dx = candidate.x - current.x;
          const dy = candidate.y - current.y;
          if (Math.abs(dx) > 220 || Math.abs(dy) > 220) continue;
          const dSq = dx * dx + dy * dy;
          if (dSq < minDistSq) {
            minDistSq = dSq;
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
    window.particleSystem.addExplosion(player.x, player.y, '#9d00ff', 25);

    const rSq = cfg.radius * cfg.radius;
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (!e) continue;
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if (Math.abs(dx) > cfg.radius || Math.abs(dy) > cfg.radius) continue;
      if (dx * dx + dy * dy <= rSq) {
        damageEnemy(e, cfg.damage * player.damageMult);
        const angle = Math.atan2(dy, dx);
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

  function fireBoomerang(cfg) {
    if (enemies.length === 0) return;
    const target = getClosestEnemy(player.x, player.y);
    const baseAngle = target ? Math.atan2(target.y - player.y, target.x - player.x) : player.rotation;
    window.soundFX.blade();

    for (let i = 0; i < cfg.count; i++) {
      const spread = (i - (cfg.count - 1) / 2) * 0.35;
      const angle = baseAngle + spread;
      bullets.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * cfg.speed,
        vy: Math.sin(angle) * cfg.speed,
        speed: cfg.speed,
        isBoomerang: true,
        returnPhase: false,
        age: 0,
        maxOutTime: 0.52,
        damage: cfg.damage * player.damageMult,
        pierce: 99,
        life: 1.8,
        color: '#00ffaa',
        radius: 11,
        hitList: new Set()
      });
    }
  }

  function fireLaser(cfg) {
    if (enemies.length === 0) return;
    window.soundFX.shoot(1200);

    for (let b = 0; b < cfg.beams; b++) {
      const target = b === 0 ? getClosestEnemy(player.x, player.y) : enemies[Math.floor(Math.random() * enemies.length)];
      if (!target) continue;

      const angle = Math.atan2(target.y - player.y, target.x - player.x);
      const beamLen = 580;
      const x2 = player.x + Math.cos(angle) * beamLen;
      const y2 = player.y + Math.sin(angle) * beamLen;

      laserBeams.push({
        x1: player.x,
        y1: player.y,
        x2,
        y2,
        width: cfg.width,
        color: '#ff007f',
        life: 0.22,
        maxLife: 0.22
      });

      // Line segment collision check against enemies
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (!e) continue;
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const proj = dx * cosA + dy * sinA;
        if (proj < 0 || proj > beamLen) continue;
        const perp = Math.abs(-dx * sinA + dy * cosA);
        if (perp <= e.radius + cfg.width + 6) {
          damageEnemy(e, cfg.damage * player.damageMult);
        }
      }
    }
  }

  function deployMines(cfg) {
    window.soundFX.click();
    for (let i = 0; i < cfg.count; i++) {
      if (mines.length >= 18) mines.shift();
      const angle = Math.random() * Math.PI * 2;
      const dist = 25 + Math.random() * 35;
      mines.push({
        x: player.x + Math.cos(angle) * dist,
        y: player.y + Math.sin(angle) * dist,
        blastRadius: cfg.radius,
        damage: cfg.damage * player.damageMult,
        life: 14.0
      });
    }
  }

  function updateFrostField(cfg) {
    const rSq = cfg.radius * cfg.radius;
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (!e) continue;
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if (Math.abs(dx) > cfg.radius || Math.abs(dy) > cfg.radius) continue;
      if (dx * dx + dy * dy <= rSq) {
        e.slowTimer = 0.8;
        e.slowFactor = cfg.slow;
        damageEnemy(e, cfg.damage * player.damageMult);
      }
    }
  }

  // Super Weapon Triggers
  function triggerOrbitalJudgement() {
    if (enemies.length === 0) return;
    const target = getClosestEnemy(player.x, player.y);
    if (!target) return;

    window.soundFX.orbitalBeam();
    window.particleSystem.triggerScreenShake(16, 0.4);
    window.particleSystem.addOrbitalBeam(target.x, target.y);

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e && Math.abs(e.x - target.x) < 55) {
        damageEnemy(e, 380 * player.damageMult);
      }
    }

    const zapCount = Math.min(8, enemies.length);
    for (let i = 0; i < zapCount; i++) {
      if (enemies[i]) {
        damageEnemy(enemies[i], 120 * player.damageMult);
      }
    }
  }

  function triggerVortexSingularity() {
    if (enemies.length === 0) return;
    const target = getClosestEnemy(player.x, player.y) || player;

    window.soundFX.blackHole();
    window.particleSystem.triggerScreenShake(12, 0.35);
    window.particleSystem.addBlackHole(target.x, target.y);

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (!e) continue;
      const dx = e.x - target.x;
      const dy = e.y - target.y;
      if (Math.abs(dx) > 300 || Math.abs(dy) > 300) continue;
      if (dx * dx + dy * dy < 300 * 300) {
        const a = Math.atan2(-dy, -dx);
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

  function triggerChronoBlizzard() {
    window.soundFX.nova();
    window.particleSystem.triggerScreenShake(10, 0.3);
    window.particleSystem.addExplosion(player.x, player.y, '#00ffff', 22);

    // Freeze & damage all nearby enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (!e) continue;
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if (Math.abs(dx) > 340 || Math.abs(dy) > 340) continue;
      if (dx * dx + dy * dy <= 340 * 340) {
        e.slowTimer = 3.0;
        e.slowFactor = 0.25;
        damageEnemy(e, 210 * player.damageMult);
      }
    }

    // Launch 6 giant frost boomerangs in 360 ring
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + (Date.now() * 0.001);
      bullets.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 14,
        vy: Math.sin(angle) * 14,
        speed: 14,
        isBoomerang: true,
        returnPhase: false,
        age: 0,
        maxOutTime: 0.6,
        damage: 145 * player.damageMult,
        pierce: 99,
        life: 2.0,
        color: '#00ffff',
        radius: 15,
        hitList: new Set()
      });
    }
  }

  function triggerOmegaAnnihilator() {
    window.soundFX.orbitalBeam();
    window.particleSystem.triggerScreenShake(14, 0.35);

    const beamLen = 540;
    const baseRot = Date.now() * 0.002;
    for (let b = 0; b < 6; b++) {
      const angle = baseRot + (b / 6) * Math.PI * 2;
      const x2 = player.x + Math.cos(angle) * beamLen;
      const y2 = player.y + Math.sin(angle) * beamLen;

      laserBeams.push({
        x1: player.x,
        y1: player.y,
        x2,
        y2,
        width: 15,
        color: b % 2 === 0 ? '#ffd700' : '#ff0055',
        life: 0.30,
        maxLife: 0.30
      });

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (!e) continue;
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const proj = dx * cosA + dy * sinA;
        if (proj < 0 || proj > beamLen) continue;
        const perp = Math.abs(-dx * sinA + dy * cosA);
        if (perp <= e.radius + 22) {
          damageEnemy(e, 320 * player.damageMult);
        }
      }
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
    window.particleSystem.addExplosion(e.x, e.y, e.color, isBoss ? 40 : 8, isBoss);

    // Special enemy death behaviors
    if (e.type === 'splitter' && !e.isMini && enemies.length < 180) {
      for (let s = 0; s < 2; s++) {
        const a = Math.random() * Math.PI * 2;
        enemies.push({
          x: e.x + Math.cos(a) * 16,
          y: e.y + Math.sin(a) * 16,
          type: 'drone',
          isMini: true,
          hp: 22 * currentStage.hpScale,
          maxHp: 22 * currentStage.hpScale,
          speed: 2.7 * currentStage.spdScale,
          radius: 9,
          color: '#00ffaa',
          expVal: 12,
          shootTimer: 0,
          hitFlash: 0,
          slowTimer: 0,
          slowFactor: 1
        });
      }
    }

    if (isBoss) {
      window.particleSystem.triggerScreenShake(15, 0.5);
      drops.push({ x: e.x, y: e.y, type: 'core', val: Math.round(60 * player.coreMult) });
      drops.push({ x: e.x + 25, y: e.y, type: 'chest' });
      drops.push({ x: e.x - 25, y: e.y, type: 'heal', val: 60 });
      drops.push({ x: e.x, y: e.y + 25, type: 'exp', val: 450 });
    } else if (e.isElite) {
      drops.push({ x: e.x, y: e.y, type: 'core', val: Math.round(20 * player.coreMult) });
      drops.push({ x: e.x + 15, y: e.y, type: 'chest' });
      drops.push({ x: e.x - 15, y: e.y, type: 'exp', val: e.expVal });
    } else {
      // Consolidate EXP drops when pool exceeds 160 so zero EXP is lost and FPS stays 60
      if (drops.length > 160) {
        let merged = false;
        for (let i = 0; i < drops.length; i++) {
          if (drops[i].type === 'exp') {
            drops[i].val += e.expVal;
            drops[i].x = e.x;
            drops[i].y = e.y;
            merged = true;
            break;
          }
        }
        if (!merged) drops.push({ x: e.x, y: e.y, type: 'exp', val: e.expVal });
      } else {
        drops.push({ x: e.x, y: e.y, type: 'exp', val: e.expVal });
      }

      const r = Math.random();
      if (r < 0.085) {
        drops.push({ x: e.x, y: e.y, type: 'core', val: Math.max(1, Math.round(5 * player.coreMult)) });
      } else if (r < 0.012) {
        drops.push({ x: e.x, y: e.y, type: 'nuke' });
      } else if (r < 0.03 && player.hp < player.maxHp * 0.7) {
        drops.push({ x: e.x, y: e.y, type: 'heal', val: 25 });
      }
    }

    const idx = enemies.indexOf(e);
    if (idx !== -1) enemies.splice(idx, 1);
  }

  function hurtPlayer(dmg) {
    if (debugState.godMode || player.invulnTime > 0) return;
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
      updateWeaponBarHUD();
    if (debugState.unlocked) renderDebugWeaponsGrid();
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
    updateWeaponBarHUD();
    if (debugState.unlocked) renderDebugWeaponsGrid();
  }

  function updateWeaponBarHUD() {
    const bar = document.getElementById('hud-weapons-bar');
    if (!bar || !player) return;
    bar.innerHTML = '';

    for (const [fKey, fDef] of Object.entries(FUSION_REGISTRY)) {
      if (player.weapons[fKey] > 0) {
        const pill = document.createElement('div');
        pill.className = 'weapon-slot-pill fusion';
        pill.innerHTML = `<span>${fDef.icon}</span><span>MAX</span>`;
        bar.appendChild(pill);
      }
    }

    for (const [wKey, wDef] of Object.entries(WEAPON_REGISTRY)) {
      const lvl = player.weapons[wKey] || 0;
      if (lvl > 0) {
        const pill = document.createElement('div');
        pill.className = 'weapon-slot-pill';
        pill.innerHTML = `<span>${wDef.icon}</span><span>${lvl >= 5 ? 'MAX' : 'LV.' + lvl}</span>`;
        bar.appendChild(pill);
      }
    }
  }

  // Stage Selector UI in Main Menu
  function renderStageSelectGrid() {
    const grid = document.getElementById('stage-select-grid');
    if (!grid) return;
    grid.innerHTML = '';

    Object.values(STAGE_REGISTRY).forEach((st) => {
      const isSelected = meta.selectedStage === st.id;
      const card = document.createElement('div');
      card.className = `stage-card ${isSelected ? 'active' : ''}`;
      card.innerHTML = `
        <div class="stage-card-header">
          <span class="stage-card-name" style="color: ${isSelected ? st.accentHex : '#fff'}">${st.name}</span>
          <span class="stage-card-mult">核心 ${st.coreMult}x</span>
        </div>
        <div class="stage-card-desc">${st.stars}｜${st.desc}</div>
      `;
      card.addEventListener('click', () => {
        meta.selectedStage = st.id;
        currentStage = st;
        saveMeta();
        window.soundFX.click();
        renderStageSelectGrid();
      });
      grid.appendChild(card);
    });
  }

  // End Game
  function endGame(isVictory) {
    gameState = isVictory ? 'VICTORY' : 'GAMEOVER';
    window.soundFX.stopBGM();

    if (isVictory) {
      sessionCores += Math.round(80 * currentStage.coreMult);
    }

    meta.cores += sessionCores;
    saveMeta();

    const banner = document.getElementById('warning-banner');
    if (banner) banner.classList.remove('active');

    const screen = document.getElementById('settlement-modal');
    document.getElementById('settlement-title').textContent = isVictory ? `戰區肅清 - ${currentStage.name}` : '機體信號中斷 - SYSTEM FAILURE';
    document.getElementById('settlement-sub').textContent = isVictory ? '你成功征服此戰區，獲得額外通關核心獎勵！' : '核心能源耗盡，但收集的資料晶片已成功上傳。';

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

    currentStage = STAGE_REGISTRY[meta.selectedStage] || STAGE_REGISTRY.sector_1;
    player = createPlayer();
    enemies = [];
    bullets = [];
    enemyBullets = [];
    mines = [];
    laserBeams = [];
    drops = [];

    gameTime = 0;
    killCount = 0;
    sessionCores = 0;
    totalDamageDealt = 0;
    bossSpawned3m = false;
    bossSpawned7m = false;
    nextEndlessBossTime = 150;
    nextEliteTime = 45;
    nextSwarmTime = 30;
    mapItemSpawnTimer = 0;
    warningBannerTimer = 0;

    const banner = document.getElementById('warning-banner');
    if (banner) banner.classList.remove('active');

    updateWeaponBarHUD();
    if (debugState.unlocked) renderDebugWeaponsGrid();

    // Spawn 2 initial supply drops nearby to reward early navigation
    spawnRandomMapPowerup(300);
    spawnRandomMapPowerup(480);

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
    document.getElementById('main-menu').classList.remove('active');
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
  let chipShopSource = 'menu'; // 'menu' or 'settlement'

  function openChipShop(source = 'menu') {
    chipShopSource = source;
    window.soundFX.click();
    const modal = document.getElementById('chip-modal');
    renderChipRows();
    if (source === 'settlement') {
      document.getElementById('settlement-modal').classList.remove('active');
    } else {
      document.getElementById('main-menu').classList.remove('active');
    }
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
    if (gameTime >= currentStage.duration) {
      endGame(true);
      return;
    }

    if (warningBannerTimer > 0) {
      warningBannerTimer -= dt;
      if (warningBannerTimer <= 0) {
        const banner = document.getElementById('warning-banner');
        if (banner) banner.classList.remove('active');
      }
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
    // Powerup Timers & FX
    if (debugState.infiniteOverdrive) {
      player.overdriveTimer = 2.0;
    }
    if (player.overdriveTimer > 0) {
      player.overdriveTimer -= dt;
      if (Math.random() < 0.45) {
        window.particleSystem.particles.push({
          x: player.x + (Math.random() - 0.5) * 22,
          y: player.y + (Math.random() - 0.5) * 22,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          size: Math.random() * 2.5 + 1,
          color: '#ffe600',
          alpha: 1,
          decay: 0.05,
          glow: false
        });
      }
    }

    if (player.globalMagnetActive) {
      player.globalMagnetTimer -= dt;
      if (player.globalMagnetTimer <= 0) {
        player.globalMagnetActive = false;
      }
    }

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
    const effSpeed = player.overdriveTimer > 0 ? player.speed * 1.3 : player.speed;
    if (len > 0) {
      player.vx = (mx / len) * effSpeed;
      player.vy = (my / len) * effSpeed;
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
  updateMapItemSpawns(dt);
  updateWeapons(dt);

    // Laser Beams Decay
    for (let i = laserBeams.length - 1; i >= 0; i--) {
      laserBeams[i].life -= dt;
      if (laserBeams[i].life <= 0) laserBeams.splice(i, 1);
    }

    // Proximity Mines Check
    for (let i = mines.length - 1; i >= 0; i--) {
      const m = mines[i];
      m.life -= dt;
      let triggered = m.life <= 0;

      if (!triggered) {
        for (let j = 0; j < enemies.length; j++) {
          const e = enemies[j];
          const dx = e.x - m.x;
          const dy = e.y - m.y;
          if (Math.abs(dx) < 38 && Math.abs(dy) < 38 && dx * dx + dy * dy < 38 * 38) {
            triggered = true;
            break;
          }
        }
      }

      if (triggered) {
        window.soundFX.explosion(false);
        window.particleSystem.addExplosion(m.x, m.y, '#ff8800', 14);
        const rSq = m.blastRadius * m.blastRadius;
        for (let j = enemies.length - 1; j >= 0; j--) {
          const e = enemies[j];
          if (!e) continue;
          const dx = e.x - m.x;
          const dy = e.y - m.y;
          if (Math.abs(dx) > m.blastRadius || Math.abs(dy) > m.blastRadius) continue;
          if (dx * dx + dy * dy <= rSq) {
            damageEnemy(e, m.damage);
          }
        }
        mines.splice(i, 1);
      }
    }

    // Bullets & Boomerangs
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (b.isBoomerang) {
        b.age += dt;
        if (!b.returnPhase && b.age >= b.maxOutTime) {
          b.returnPhase = true;
          b.hitList.clear(); // Allow hitting enemies again on return!
        }
        if (b.returnPhase) {
          const angle = Math.atan2(player.y - b.y, player.x - b.x);
          b.vx = Math.cos(angle) * (b.speed * 1.25);
          b.vy = Math.sin(angle) * (b.speed * 1.25);
          const pdx = player.x - b.x;
          const pdy = player.y - b.y;
          if (pdx * pdx + pdy * pdy < 24 * 24) {
            bullets.splice(i, 1);
            continue;
          }
        }
      } else if (b.homing && b.target && b.target.hp > 0) {
        const angle = Math.atan2(b.target.y - b.y, b.target.x - b.x);
        b.vx = Math.cos(angle) * b.speed;
        b.vy = Math.sin(angle) * b.speed;
      }
      b.x += b.vx;
      b.y += b.vy;
      b.life -= dt;

      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (!e || b.hitList.has(e)) continue;
        const hitR = e.radius + b.radius;
        const dx = e.x - b.x;
        const dy = e.y - b.y;
        if (Math.abs(dx) > hitR || Math.abs(dy) > hitR) continue;
        if (dx * dx + dy * dy < hitR * hitR) {
          b.hitList.add(e);
          damageEnemy(e, b.damage);
          b.pierce--;
          if (Math.random() < 0.35) {
            window.particleSystem.addExplosion(b.x, b.y, b.color, 3);
          }
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

      const edx = player.x - eb.x;
      const edy = player.y - eb.y;
      const pHitR = player.radius + 6;
      if (Math.abs(edx) < pHitR && Math.abs(edy) < pHitR && edx * edx + edy * edy < pHitR * pHitR) {
        hurtPlayer(18);
        window.particleSystem.addExplosion(eb.x, eb.y, '#ff0055', 5);
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
      const pdx = player.x - e.x;
      const pdy = player.y - e.y;

      // Despawn non-boss if player ran too far away
      if (e.type !== 'boss' && (Math.abs(pdx) > 1900 || Math.abs(pdy) > 1900)) {
        enemies.splice(i, 1);
        continue;
      }

      if (e.slowTimer > 0) {
        e.slowTimer -= dt;
      }
      const spdMult = e.slowTimer > 0 ? (e.slowFactor || 0.5) : 1.0;

      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(angle) * e.speed * spdMult;
      e.y += Math.sin(angle) * e.speed * spdMult;

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
        const fireInterval = e.isApex ? 0.35 : (e.bossTier === 'VULCAN' ? 0.45 : 0.65);
        if (e.attackTimer >= fireInterval) {
          e.attackTimer = 0;
          const bulletCount = e.isApex ? 6 : (e.bossTier === 'LEVIATHAN' ? 5 : 4);
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

      const hitR = player.radius + e.radius;
      if (Math.abs(pdx) < hitR && Math.abs(pdy) < hitR && pdx * pdx + pdy * pdy < hitR * hitR) {
        // Titan reflect damage
        if (player.shipId === 'titan') {
          damageEnemy(e, 65 * player.damageMult);
          window.particleSystem.addExplosion(e.x, e.y, '#ffaa00', 8);
        }
        if (e.type === 'bomber') {
          hurtPlayer(22);
          killEnemy(e);
          continue;
        }
        hurtPlayer(e.type === 'boss' ? 28 : 12);
      }
    }

    // Drops Magnet & Pickup
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      const dist = Math.hypot(player.x - d.x, player.y - d.y);

      // Global Magnet Active OR Within Player Magnet Radius
      const isGlobalMagnet = player.globalMagnetActive;
      if (isGlobalMagnet || dist < player.magnetRadius) {
        const angle = Math.atan2(player.y - d.y, player.x - d.x);
        const pullSpeed = isGlobalMagnet ? 24 : 9.5;
        d.x += Math.cos(angle) * pullSpeed;
        d.y += Math.sin(angle) * pullSpeed;
      }

      if (dist < player.radius + 16) {
        if (d.type === 'exp') {
          window.soundFX.pickup();
          player.exp += d.val * player.expMult;
          checkLevelUp();
        } else if (d.type === 'core') {
          window.soundFX.pickup();
          sessionCores += d.val;
        } else if (d.type === 'heal') {
          const healAmt = d.val || Math.max(35, Math.round(player.maxHp * 0.35));
          player.hp = Math.min(player.maxHp, player.hp + healAmt);
          window.soundFX.heal();
          window.particleSystem.addHealAura(player.x, player.y);
          window.particleSystem.addFloatingText(player.x, player.y, `💚 裝甲修復 +${healAmt}!`, '#00ff66');
        } else if (d.type === 'magnet') {
          player.globalMagnetActive = true;
          player.globalMagnetTimer = 4.0;
          window.soundFX.magnet();
          window.particleSystem.addMagnetWave(player.x, player.y);
          window.particleSystem.addFloatingText(player.x, player.y, '🧲 超導磁石：全域吸收!', '#00f3ff');
        } else if (d.type === 'overdrive') {
          player.overdriveTimer = 7.0;
          window.soundFX.hypercharge();
          window.particleSystem.triggerScreenShake(7, 0.25);
          window.particleSystem.addFloatingText(player.x, player.y, '⚡ 超載狂暴 7秒!', '#ffe600');
        } else if (d.type === 'nuke') {
          triggerNuke();
          window.particleSystem.addFloatingText(player.x, player.y, '💣 EMP 核爆全域殲滅!', '#ff0055');
        } else if (d.type === 'chest') {
          const coreGain = Math.round(18 * player.coreMult);
          sessionCores += coreGain;
          window.soundFX.fusion();
          for (let k = 0; k < 8; k++) {
            drops.push({ x: player.x + (Math.random() - 0.5) * 60, y: player.y + (Math.random() - 0.5) * 60, type: 'exp', val: 25 });
          }
          window.particleSystem.addFloatingText(player.x, player.y, `📦 賽博補給箱 +${coreGain}核心!`, '#00ffcc');
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

    ctx.fillStyle = currentStage ? currentStage.bgDark : '#05070e';
    ctx.fillRect(0, 0, viewW, viewH);

    const shake = window.particleSystem.screenShake;
    const cam = { x: camera.x + shake.x, y: camera.y + shake.y };

    drawCyberBackground(cam, viewW, viewH);
    drawCyberStructures(cam, viewW, viewH);
    window.particleSystem.drawGridMotes(ctx, cam);

    if (player && player.weapons.frost > 0) {
      drawFrostField(cam);
    }

    drawMines(cam, viewW, viewH);
    drawDrops(cam);

    for (const t of player ? player.trail : []) {
      ctx.fillStyle = `rgba(${player.shipId === 'phantom' ? '255, 0, 170' : '0, 243, 255'}, ${t.alpha * 0.4})`;
      ctx.beginPath();
      ctx.arc(t.x - cam.x, t.y - cam.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < enemies.length; i++) {
      drawEnemy(enemies[i], cam, viewW, viewH);
    }

    // Laser Beams
    drawLaserBeams(cam);

    // Enemy Bullets (No shadowBlur for 60 FPS performance)
    ctx.fillStyle = '#ff0055';
    ctx.shadowBlur = 0;
    for (let i = 0; i < enemyBullets.length; i++) {
      const eb = enemyBullets[i];
      const ebx = eb.x - cam.x;
      const eby = eb.y - cam.y;
      if (ebx < -20 || ebx > viewW + 20 || eby < -20 || eby > viewH + 20) continue;
      ctx.beginPath();
      ctx.arc(ebx, eby, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player Bullets & Spinning Boomerangs (Fast rendering without per-bullet shadowBlur)
    ctx.shadowBlur = 0;
    const now = Date.now();
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      const bx = b.x - cam.x;
      const by = b.y - cam.y;
      if (bx < -25 || bx > viewW + 25 || by < -25 || by > viewH + 25) continue;
      ctx.fillStyle = b.color;
      if (b.isBoomerang) {
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(now * 0.018 + i);
        ctx.fillRect(-b.radius, -3, b.radius * 2, 6);
        ctx.fillRect(-3, -b.radius, 6, b.radius * 2);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(bx, by, b.radius, 0, Math.PI * 2);
        ctx.fill();
      }
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
    drawOffScreenIndicators(cam, viewW, viewH);

    ctx.restore();
  }

  // Pre-generated Parallax Background Stars & Nebulae
  const bgStarsFar = [];
  const bgStarsMid = [];
  for (let i = 0; i < 90; i++) {
    bgStarsFar.push({
      x: (Math.random() * 3000) - 1500,
      y: (Math.random() * 3000) - 1500,
      size: Math.random() * 1.2 + 0.6,
      baseAlpha: Math.random() * 0.4 + 0.2,
      freq: Math.random() * 2 + 1
    });
  }
  for (let i = 0; i < 60; i++) {
    bgStarsMid.push({
      x: (Math.random() * 3000) - 1500,
      y: (Math.random() * 3000) - 1500,
      size: Math.random() * 1.8 + 1.0,
      baseAlpha: Math.random() * 0.5 + 0.3,
      color: Math.random() > 0.6 ? '#00f3ff' : (Math.random() > 0.5 ? '#ff007f' : '#ffffff'),
      freq: Math.random() * 3 + 1
    });
  }

  const nebulae = [
    { x: -600, y: -500, r: 550, color: 'rgba(0, 243, 255, 0.05)' },
    { x: 1200, y: 1000, r: 650, color: 'rgba(255, 0, 127, 0.045)' },
    { x: -1000, y: 1400, r: 500, color: 'rgba(157, 0, 255, 0.045)' },
    { x: 1600, y: -1200, r: 600, color: 'rgba(0, 150, 255, 0.04)' }
  ];

  function drawCyberBackground(cam, viewW, viewH) {
    const now = Date.now();
    const gCol = currentStage ? currentStage.gridColor : '0, 243, 255';
    const accentHex = currentStage ? currentStage.accentHex : '#00f3ff';

    // 1. Radiant Deep Space Nebulae (Parallax 0.18x)
    ctx.save();
    for (const neb of nebulae) {
      const nx = (neb.x - cam.x * 0.18);
      const ny = (neb.y - cam.y * 0.18);
      if (nx + neb.r < 0 || nx - neb.r > viewW || ny + neb.r < 0 || ny - neb.r > viewH) continue;

      const grad = ctx.createRadialGradient(nx, ny, 10, nx, ny, neb.r);
      grad.addColorStop(0, `rgba(${gCol}, 0.055)`);
      grad.addColorStop(1, 'rgba(5, 7, 14, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(nx, ny, neb.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. Parallax Stars (Layer 1 - Distant 0.12x)
    ctx.save();
    for (const s of bgStarsFar) {
      const range = 2400;
      const sx = ((s.x - cam.x * 0.12) % range + range) % range - (range - viewW) / 2;
      const sy = ((s.y - cam.y * 0.12) % range + range) % range - (range - viewH) / 2;
      if (sx < -10 || sx > viewW + 10 || sy < -10 || sy > viewH + 10) continue;

      const twinkle = Math.sin(now * 0.002 * s.freq) * 0.25;
      ctx.fillStyle = `rgba(220, 240, 255, ${Math.max(0.1, s.baseAlpha + twinkle)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Parallax Stars (Layer 2 - Mid 0.28x)
    for (const s of bgStarsMid) {
      const range = 2400;
      const sx = ((s.x - cam.x * 0.28) % range + range) % range - (range - viewW) / 2;
      const sy = ((s.y - cam.y * 0.28) % range + range) % range - (range - viewH) / 2;
      if (sx < -10 || sx > viewW + 10 || sy < -10 || sy > viewH + 10) continue;

      const twinkle = Math.sin(now * 0.003 * s.freq) * 0.3;
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.max(0.15, s.baseAlpha + twinkle);
      ctx.beginPath();
      ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 4. Cyber Matrix Grid
    ctx.save();
    const gridSize = 60;
    const offsetX = -cam.x % gridSize;
    const offsetY = -cam.y % gridSize;

    // Minor grid lines
    ctx.strokeStyle = `rgba(${gCol}, 0.06)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = offsetX; x < viewW + gridSize; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, viewH);
    }
    for (let y = offsetY; y < viewH + gridSize; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(viewW, y);
    }
    ctx.stroke();

    // Major grid lines (every 240px)
    const majorGrid = 240;
    const majorOffsetX = -cam.x % majorGrid;
    const majorOffsetY = -cam.y % majorGrid;
    ctx.strokeStyle = `rgba(${gCol}, 0.18)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = majorOffsetX; x < viewW + majorGrid; x += majorGrid) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, viewH);
    }
    for (let y = majorOffsetY; y < viewH + majorGrid; y += majorGrid) {
      ctx.moveTo(0, y);
      ctx.lineTo(viewW, y);
    }
    ctx.stroke();

    // Intersection cyber nodes (+) at every 120px (zero shadowBlur for high FPS)
    const nodeGrid = 120;
    const nodeOffsetX = -cam.x % nodeGrid;
    const nodeOffsetY = -cam.y % nodeGrid;
    ctx.fillStyle = `rgba(${gCol}, 0.42)`;
    for (let x = nodeOffsetX; x < viewW + nodeGrid; x += nodeGrid) {
      for (let y = nodeOffsetY; y < viewH + nodeGrid; y += nodeGrid) {
        ctx.fillRect(x - 3, y - 0.5, 6, 1);
        ctx.fillRect(x - 0.5, y - 3, 1, 6);
      }
    }

    // 5. Light Pulses sliding across major grid lines
    const pulseT = (now * 0.08) % 1200;
    ctx.fillStyle = accentHex;
    for (let x = majorOffsetX; x < viewW + majorGrid; x += majorGrid * 2) {
      const py = (pulseT + x * 2) % viewH;
      ctx.fillRect(x - 1.5, py - 6, 3, 12);
    }
    for (let y = majorOffsetY; y < viewH + majorGrid; y += majorGrid * 2) {
      const px = (pulseT + y * 2) % viewW;
      ctx.fillRect(px - 6, y - 1.5, 12, 3);
    }

    ctx.restore();
  }

  // Deterministic Pseudo-Random Generator based on Chunk Coords
  function chunkHash(cx, cy) {
    let h = (cx * 374761393 + cy * 668265263) ^ 0x5bf03635;
    h = (h ^ (h >> 13)) * 1274126177;
    return (h ^ (h >> 16)) >>> 0;
  }

  function drawCyberStructures(cam, viewW, viewH) {
    const chunkSize = 720;
    const minChunkX = Math.floor(cam.x / chunkSize) - 1;
    const maxChunkX = Math.floor((cam.x + viewW) / chunkSize) + 1;
    const minChunkY = Math.floor(cam.y / chunkSize) - 1;
    const maxChunkY = Math.floor((cam.y + viewH) / chunkSize) + 1;
    const now = Date.now();

    ctx.save();
    for (let cx = minChunkX; cx <= maxChunkX; cx++) {
      for (let cy = minChunkY; cy <= maxChunkY; cy++) {
        const hash = chunkHash(cx, cy);
        if ((hash % 100) > 38) continue; // 38% probability of having a structure in this chunk

        const localX = (hash % (chunkSize - 200)) + 100;
        const localY = ((hash >> 8) % (chunkSize - 200)) + 100;
        const worldX = cx * chunkSize + localX;
        const worldY = cy * chunkSize + localY;

        const screenX = worldX - cam.x;
        const screenY = worldY - cam.y;

        if (screenX < -150 || screenX > viewW + 150 || screenY < -150 || screenY > viewH + 150) continue;

        const variant = (hash >> 16) % 4;
        ctx.save();
        ctx.translate(screenX, screenY);

        if (variant === 0) {
          // --- Type 0: 太陽能通訊衛星 (Solar Relay Satellite) ---
          const rot = (hash % 360) * Math.PI / 180 + Math.sin(now * 0.0005 + hash) * 0.15;
          ctx.rotate(rot);

          // Solar panel wings (left and right)
          ctx.fillStyle = 'rgba(0, 150, 255, 0.35)';
          ctx.strokeStyle = '#00f3ff';
          ctx.lineWidth = 1;
          // Left wing
          ctx.fillRect(-64, -14, 40, 28);
          ctx.strokeRect(-64, -14, 40, 28);
          ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
          ctx.beginPath();
          ctx.moveTo(-44, -14); ctx.lineTo(-44, 14);
          ctx.moveTo(-64, 0); ctx.lineTo(-24, 0);
          ctx.stroke();

          // Right wing
          ctx.fillRect(24, -14, 40, 28);
          ctx.strokeRect(24, -14, 40, 28);
          ctx.beginPath();
          ctx.moveTo(44, -14); ctx.lineTo(44, 14);
          ctx.moveTo(24, 0); ctx.lineTo(64, 0);
          ctx.stroke();

          // Central module body
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#00f3ff';
          ctx.lineWidth = 1.5;
          ctx.fillRect(-18, -18, 36, 36);
          ctx.strokeRect(-18, -18, 36, 36);

          // Blinking sensor beacon
          const blink = Math.sin(now * 0.004 + hash) > 0;
          ctx.fillStyle = blink ? '#ff0055' : '#00f3ff';
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();

        } else if (variant === 1) {
          // --- Type 1: 賽博數據方尖碑 (Data Monolith) ---
          const floatY = Math.sin(now * 0.001 + hash) * 8;
          ctx.translate(0, floatY);

          ctx.fillStyle = '#080c18';
          ctx.strokeStyle = 'rgba(255, 0, 127, 0.7)';
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          ctx.moveTo(0, -42);
          ctx.lineTo(22, 0);
          ctx.lineTo(0, 42);
          ctx.lineTo(-22, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Glowing internal neon core
          ctx.fillStyle = '#00f3ff';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();

          // Floating holographic data rings
          const ringPulse = (now * 0.0015 + hash) % (Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(0, 0, 36, 14, ringPulse, 0, Math.PI * 2);
          ctx.stroke();

        } else if (variant === 2) {
          // --- Type 2: 廢棄環形空間站 / 反應爐遺構 (Derelict Reactor Ring) ---
          const ringAngle = now * 0.0003 + hash;
          ctx.rotate(ringAngle);

          ctx.strokeStyle = 'rgba(100, 140, 180, 0.4)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 48, 0, Math.PI * 2);
          ctx.stroke();

          // Segmented outer armor brackets
          ctx.strokeStyle = '#00f3ff';
          ctx.lineWidth = 2.5;
          for (let b = 0; b < 4; b++) {
            ctx.beginPath();
            ctx.arc(0, 0, 52, b * Math.PI / 2 + 0.1, b * Math.PI / 2 + 0.9);
            ctx.stroke();
          }

          // Faint energy discharge in center
          if (Math.sin(now * 0.005 + hash) > 0.4) {
            ctx.fillStyle = 'rgba(0, 243, 255, 0.2)';
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();
          }

        } else {
          // --- Type 3: 全息戰區浮標 (Holo Hazard Beacon) ---
          ctx.strokeStyle = 'rgba(255, 230, 0, 0.75)';
          ctx.lineWidth = 1.5;

          // Outer caution diamond
          ctx.beginPath();
          ctx.moveTo(0, -22);
          ctx.lineTo(22, 0);
          ctx.lineTo(0, 22);
          ctx.lineTo(-22, 0);
          ctx.closePath();
          ctx.stroke();

          // Inner warning mark
          ctx.fillStyle = '#ffe600';
          ctx.font = '700 12px "Orbitron", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚠', 0, 0);

          // Digital Sector ID Tag
          ctx.font = '600 9px "Orbitron", monospace';
          ctx.fillStyle = 'rgba(0, 243, 255, 0.6)';
          ctx.fillText(`SEC-${(hash % 90 + 10)}`, 0, 32);
        }

        ctx.restore();
      }
    }
    ctx.restore();
  }

  function drawOffScreenIndicators(cam, viewW, viewH) {
    const cx = viewW / 2;
    const cy = viewH / 2;
    const margin = 42;

    for (const d of drops) {
      if (!['magnet', 'heal', 'overdrive', 'nuke', 'chest'].includes(d.type)) continue;

      const sx = d.x - cam.x;
      const sy = d.y - cam.y;

      if (sx >= margin && sx <= viewW - margin && sy >= margin && sy <= viewH - margin) continue;

      const dx = sx - cx;
      const dy = sy - cy;
      const angle = Math.atan2(dy, dx);
      const dist = Math.hypot(dx, dy);

      const padX = viewW / 2 - margin;
      const padY = viewH / 2 - margin;
      const scaleX = Math.abs(dx) > 0 ? padX / Math.abs(dx) : 1;
      const scaleY = Math.abs(dy) > 0 ? padY / Math.abs(dy) : 1;
      const scale = Math.min(scaleX, scaleY);
      const edgeX = cx + dx * scale;
      const edgeY = cy + dy * scale;

      let icon = '💎';
      let color = '#00f3ff';
      if (d.type === 'heal') { icon = '💚'; color = '#00ff66'; }
      else if (d.type === 'magnet') { icon = '🧲'; color = '#00f3ff'; }
      else if (d.type === 'overdrive') { icon = '⚡'; color = '#ffe600'; }
      else if (d.type === 'nuke') { icon = '💣'; color = '#ff0055'; }
      else if (d.type === 'chest') { icon = '📦'; color = '#00ffcc'; }

      ctx.save();
      ctx.translate(edgeX, edgeY);

      ctx.shadowBlur = 12;
      ctx.shadowColor = color;
      ctx.fillStyle = 'rgba(8, 12, 22, 0.9)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.rotate(angle);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(21, 0);
      ctx.lineTo(15, -5);
      ctx.lineTo(15, 5);
      ctx.closePath();
      ctx.fill();

      ctx.rotate(-angle);
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, 0, 0);

      ctx.font = '700 9px "Orbitron", sans-serif';
      ctx.fillStyle = color;
      ctx.fillText(`${Math.round(dist / 10)}m`, 0, 20);

      ctx.restore();
    }
  }

  function drawFrostField(cam) {
    const cfg = WEAPON_REGISTRY.frost.levels[player.weapons.frost - 1];
    const px = player.x - cam.x;
    const py = player.y - cam.y;
    const pulse = Math.sin(Date.now() * 0.004) * 5;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 255, 220, 0.06)';
    ctx.strokeStyle = 'rgba(0, 255, 220, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, cfg.radius + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawMines(cam, viewW, viewH) {
    const now = Date.now();
    ctx.save();
    ctx.shadowBlur = 0;
    for (let i = 0; i < mines.length; i++) {
      const m = mines[i];
      const mx = m.x - cam.x;
      const my = m.y - cam.y;
      if (mx < -25 || mx > viewW + 25 || my < -25 || my > viewH + 25) continue;

      const blink = Math.sin(now * 0.015 + i) > 0;
      ctx.fillStyle = '#1a1008';
      ctx.strokeStyle = '#ff8800';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mx, my, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = blink ? '#ff0044' : '#ffe600';
      ctx.beginPath();
      ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawLaserBeams(cam) {
    if (laserBeams.length === 0) return;
    ctx.save();
    for (let i = 0; i < laserBeams.length; i++) {
      const b = laserBeams[i];
      const alpha = Math.max(0, b.life / b.maxLife);
      ctx.globalAlpha = alpha;

      // Outer laser aura
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.x1 - cam.x, b.y1 - cam.y);
      ctx.lineTo(b.x2 - cam.x, b.y2 - cam.y);
      ctx.stroke();

      // Inner white-hot core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2, b.width * 0.4);
      ctx.beginPath();
      ctx.moveTo(b.x1 - cam.x, b.y1 - cam.y);
      ctx.lineTo(b.x2 - cam.x, b.y2 - cam.y);
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
    } else if (player.shipId === 'valkyrie') {
      ctx.beginPath();
      ctx.moveTo(23, 0);
      ctx.lineTo(-6, -15);
      ctx.lineTo(-12, -5);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-12, 5);
      ctx.lineTo(-6, 15);
      ctx.closePath();
      ctx.fill();
    } else if (player.shipId === 'frostbite') {
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(4, -12);
      ctx.lineTo(-14, -10);
      ctx.lineTo(-9, 0);
      ctx.lineTo(-14, 10);
      ctx.lineTo(4, 12);
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

  function drawEnemy(e, cam, viewW, viewH) {
    const ex = e.x - cam.x;
    const ey = e.y - cam.y;

    // Frustum / Viewport culling: skip off-screen enemies completely
    if (ex < -55 || ex > viewW + 55 || ey < -55 || ey > viewH + 55) return;

    ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : (e.slowTimer > 0 && e.type !== 'boss' ? '#66f7ff' : e.color);

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
    } else if (e.type === 'bomber') {
      // Spiky triangle/diamond bomber
      ctx.beginPath();
      ctx.moveTo(ex, ey - e.radius * 1.2);
      ctx.lineTo(ex + e.radius * 1.1, ey + e.radius * 0.8);
      ctx.lineTo(ex - e.radius * 1.1, ey + e.radius * 0.8);
      ctx.closePath();
      ctx.fill();
    } else if (e.type === 'splitter') {
      // Hexagonal splitter cell
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3;
        const hx = ex + Math.cos(a) * e.radius;
        const hy = ey + Math.sin(a) * e.radius;
        if (k === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
    } else if (e.type === 'boss') {
      ctx.save();
      ctx.shadowBlur = 14;
      ctx.shadowColor = e.color;
      const pulse = Math.sin(Date.now() * 0.006) * 4;
      ctx.beginPath();
      ctx.arc(ex, ey, e.radius + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      const barW = 90;
      const barH = 7;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(ex - barW / 2, ey - e.radius - 22, barW, barH);
      ctx.fillStyle = e.color;
      ctx.fillRect(ex - barW / 2, ey - e.radius - 22, barW * Math.max(0, e.hp / e.maxHp), barH);
    }

    if (e.isElite) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ex, ey, e.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
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
    const viewW = width / zoom;
    const viewH = height / zoom;
    const now = Date.now();
    ctx.shadowBlur = 0;

    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      const dx = d.x - cam.x;
      const dy = d.y - cam.y;

      // Off-screen viewport culling
      if (dx < -35 || dx > viewW + 35 || dy < -35 || dy > viewH + 35) continue;

      if (d.type === 'exp') {
        ctx.fillStyle = d.val > 50 ? '#ffe600' : (d.val > 20 ? '#ff007f' : '#00f3ff');
        ctx.fillRect(dx - 3, dy - 3, 6, 6);
      } else if (d.type === 'core') {
        ctx.fillStyle = '#00ffaa';
        ctx.beginPath();
        ctx.arc(dx, dy, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.save();
        // Special Environmental Powerups with High-tech Hex Beacon Aura
        const floatY = dy + Math.sin(now / 220 + d.x * 0.01) * 4;
        const pulse = (Math.sin(now / 200) + 1) * 0.5;

        let icon = '💎';
        let mainColor = '#00f3ff';
        if (d.type === 'heal') { icon = '✚'; mainColor = '#00ff66'; }
        else if (d.type === 'magnet') { icon = '🧲'; mainColor = '#00f3ff'; }
        else if (d.type === 'overdrive') { icon = '⚡'; mainColor = '#ffe600'; }
        else if (d.type === 'nuke') { icon = '💣'; mainColor = '#ff0055'; }
        else if (d.type === 'chest') { icon = '📦'; mainColor = '#00ffcc'; }

        // Expanding beacon aura ring on the ground
        ctx.strokeStyle = mainColor;
        ctx.globalAlpha = 0.35 + pulse * 0.3;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(dx, dy, 16 + pulse * 8, 0, Math.PI * 2);
        ctx.stroke();

        // Futuristic hexagonal container
        ctx.globalAlpha = 0.95;
        ctx.translate(dx, floatY);
        ctx.fillStyle = 'rgba(10, 16, 28, 0.92)';
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const angle = (Math.PI / 3) * a;
          const hx = Math.cos(angle) * 16;
          const hy = Math.sin(angle) * 16;
          if (a === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Icon inside
        ctx.font = '700 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = mainColor;
        ctx.fillText(icon, 0, 1);
        ctx.restore();
      }
    }
  }

  // Bind Buttons & Events
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('replay-btn').addEventListener('click', startGame);
  document.getElementById('open-hangar-btn').addEventListener('click', openHangar);
  document.getElementById('close-hangar-btn').addEventListener('click', () => {
    window.soundFX.click();
    document.getElementById('hangar-modal').classList.remove('active');
    document.getElementById('main-menu').classList.add('active');
  });
  document.getElementById('open-chip-btn').addEventListener('click', () => openChipShop('menu'));
  document.getElementById('settlement-chip-btn').addEventListener('click', () => openChipShop('settlement'));
  document.getElementById('close-chip-btn').addEventListener('click', () => {
    window.soundFX.click();
    document.getElementById('chip-modal').classList.remove('active');
    if (chipShopSource === 'settlement') {
      document.getElementById('settlement-modal').classList.add('active');
    } else {
      document.getElementById('main-menu').classList.add('active');
    }
  });

  const settlementMenuBtn = document.getElementById('settlement-menu-btn');
  if (settlementMenuBtn) {
    settlementMenuBtn.addEventListener('click', () => {
      window.soundFX.click();
      document.getElementById('settlement-modal').classList.remove('active');
      document.getElementById('chip-modal').classList.remove('active');
      document.getElementById('hangar-modal').classList.remove('active');
      document.getElementById('main-menu').classList.add('active');
      gameState = 'MENU';
    });
  }

  const muteBtn = document.getElementById('mute-btn');
  muteBtn.addEventListener('click', () => {
    const isMuted = window.soundFX.toggleMute();
    muteBtn.textContent = isMuted ? '🔇 靜音' : '🔊 音效';
  });

  // =========================================================
  // PC-ONLY SECRET DEBUG CONSOLE (Type "debug" on keyboard)
  // =========================================================
  const debugPanel = document.getElementById('debug-panel');

  function toggleDebugConsole() {
    if (!isPCDevice() || !debugPanel) return;
    debugState.unlocked = true;
    const isNowActive = !debugPanel.classList.contains('active');
    if (isNowActive) {
      debugPanel.classList.add('active');
      window.soundFX.fusion();
      showWarningBanner('🛠 DEV DEBUG MODE ACTIVATED (PC ONLY)', 2.2);
      renderDebugWeaponsGrid();
    } else {
      debugPanel.classList.remove('active');
      window.soundFX.click();
    }
  }

  function renderDebugWeaponsGrid() {
    const grid = document.getElementById('debug-weapons-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Base Weapons (Click to cycle LV.0 -> LV.5)
    for (const [wKey, wDef] of Object.entries(WEAPON_REGISTRY)) {
      const lvl = player ? (player.weapons[wKey] || 0) : 0;
      const btn = document.createElement('button');
      btn.className = `debug-btn ${lvl > 0 ? 'active-toggle' : ''}`;
      btn.textContent = `${wDef.icon} ${wDef.name.slice(0, 4)} (${lvl}/5)`;
      btn.addEventListener('click', () => {
        if (!player) return;
        player.weapons[wKey] = lvl >= 5 ? 0 : lvl + 1;
        if (wKey === 'shield' && player.weapons.shield > 0) {
          const cfg = WEAPON_REGISTRY.shield.levels[player.weapons.shield - 1];
          player.maxShield = cfg.maxShield;
          player.shield = cfg.maxShield;
        }
        window.soundFX.click();
        updateWeaponBarHUD();
        renderDebugWeaponsGrid();
      });
      grid.appendChild(btn);
    }

    // Fusion Super Weapons (Click to toggle ON / OFF)
    for (const [fKey, fDef] of Object.entries(FUSION_REGISTRY)) {
      const active = player && player.weapons[fKey] > 0;
      const btn = document.createElement('button');
      btn.className = `debug-btn gold ${active ? 'active-toggle' : ''}`;
      btn.textContent = `${fDef.icon} ${fDef.name.slice(0, 4)} [${active ? 'ON' : 'OFF'}]`;
      btn.addEventListener('click', () => {
        if (!player) return;
        player.weapons[fKey] = active ? 0 : 1;
        window.soundFX.fusion();
        updateWeaponBarHUD();
        renderDebugWeaponsGrid();
      });
      grid.appendChild(btn);
    }
  }

  // Bind Debug Panel Buttons
  const dbgCloseBtn = document.getElementById('debug-close-btn');
  if (dbgCloseBtn) {
    dbgCloseBtn.addEventListener('click', () => {
      debugPanel.classList.remove('active');
      window.soundFX.click();
    });
  }

  const dbgGodBtn = document.getElementById('dbg-god-btn');
  if (dbgGodBtn) {
    dbgGodBtn.addEventListener('click', () => {
      debugState.godMode = !debugState.godMode;
      dbgGodBtn.textContent = `🛡️ 無敵模式: ${debugState.godMode ? 'ON' : 'OFF'}`;
      dbgGodBtn.classList.toggle('active-toggle', debugState.godMode);
      window.soundFX.click();
    });
  }

  const dbgOverdriveBtn = document.getElementById('dbg-overdrive-btn');
  if (dbgOverdriveBtn) {
    dbgOverdriveBtn.addEventListener('click', () => {
      debugState.infiniteOverdrive = !debugState.infiniteOverdrive;
      dbgOverdriveBtn.textContent = `⚡ 無限狂暴: ${debugState.infiniteOverdrive ? 'ON' : 'OFF'}`;
      dbgOverdriveBtn.classList.toggle('active-toggle', debugState.infiniteOverdrive);
      window.soundFX.hypercharge();
    });
  }

  const dbgLvlUpBtn = document.getElementById('dbg-lvlup-btn');
  if (dbgLvlUpBtn) {
    dbgLvlUpBtn.addEventListener('click', () => {
      if (!player || gameState !== 'PLAYING') return;
      player.level++;
      window.soundFX.levelup();
      showUpgradeModal();
    });
  }

  const dbgHealBtn = document.getElementById('dbg-heal-btn');
  if (dbgHealBtn) {
    dbgHealBtn.addEventListener('click', () => {
      if (!player) return;
      player.hp = player.maxHp;
      player.shield = player.maxShield;
      window.soundFX.heal();
      window.particleSystem.addHealAura(player.x, player.y);
    });
  }

  const dbgCoresBtn = document.getElementById('dbg-cores-btn');
  if (dbgCoresBtn) {
    dbgCoresBtn.addEventListener('click', () => {
      meta.cores += 5000;
      sessionCores += 5000;
      saveMeta();
      window.soundFX.fusion();
      if (document.getElementById('chip-modal').classList.contains('active')) renderChipRows();
      if (document.getElementById('hangar-modal').classList.contains('active')) renderHangarGrid();
    });
  }

  const dbgUnlockAllBtn = document.getElementById('dbg-unlockall-btn');
  if (dbgUnlockAllBtn) {
    dbgUnlockAllBtn.addEventListener('click', () => {
      meta.unlockedShips = Object.keys(SHIP_REGISTRY);
      chipDefs.forEach((c) => { meta.upgrades[c.id] = c.max; });
      meta.cores += 9999;
      saveMeta();
      window.soundFX.fusion();
      if (document.getElementById('chip-modal').classList.contains('active')) renderChipRows();
      if (document.getElementById('hangar-modal').classList.contains('active')) renderHangarGrid();
      showWarningBanner('🔓 已解鎖全部 5 台戰機與滿級晶片矩陣！', 2.5);
    });
  }

  const dbgMaxWeaponsBtn = document.getElementById('dbg-maxweapons-btn');
  if (dbgMaxWeaponsBtn) {
    dbgMaxWeaponsBtn.addEventListener('click', () => {
      if (!player) return;
      for (const wKey of Object.keys(WEAPON_REGISTRY)) player.weapons[wKey] = 5;
      for (const fKey of Object.keys(FUSION_REGISTRY)) player.weapons[fKey] = 1;
      const cfg = WEAPON_REGISTRY.shield.levels[4];
      player.maxShield = cfg.maxShield * 2.2;
      player.shield = player.maxShield;
      window.soundFX.fusion();
      updateWeaponBarHUD();
    if (debugState.unlocked) renderDebugWeaponsGrid();
      renderDebugWeaponsGrid();
    });
  }

  const dbgResetWeaponsBtn = document.getElementById('dbg-resetweapons-btn');
  if (dbgResetWeaponsBtn) {
    dbgResetWeaponsBtn.addEventListener('click', () => {
      if (!player) return;
      for (const wKey of Object.keys(WEAPON_REGISTRY)) player.weapons[wKey] = 0;
      for (const fKey of Object.keys(FUSION_REGISTRY)) player.weapons[fKey] = 0;
      player.weapons.blaster = 1;
      window.soundFX.click();
      updateWeaponBarHUD();
    if (debugState.unlocked) renderDebugWeaponsGrid();
      renderDebugWeaponsGrid();
    });
  }

  const dbgEliteBtn = document.getElementById('dbg-elite-btn');
  if (dbgEliteBtn) {
    dbgEliteBtn.addEventListener('click', () => {
      if (!player) return;
      spawnRandomEnemy(true);
      window.soundFX.shoot(500);
    });
  }

  const dbgSwarmBtn = document.getElementById('dbg-swarm-btn');
  if (dbgSwarmBtn) {
    dbgSwarmBtn.addEventListener('click', () => {
      if (!player) return;
      spawnSwarmRing(36);
    });
  }

  const bossBtns = [
    ['dbg-boss-overlord', 'OVERLORD'],
    ['dbg-boss-vulcan', 'VULCAN'],
    ['dbg-boss-leviathan', 'LEVIATHAN'],
    ['dbg-boss-apex', 'APEX']
  ];
  bossBtns.forEach(([id, tier]) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', () => {
        if (!player) return;
        spawnBoss(tier);
      });
    }
  });

  const dbgItemsBtn = document.getElementById('dbg-items-btn');
  if (dbgItemsBtn) {
    dbgItemsBtn.addEventListener('click', () => {
      if (!player) return;
      const types = ['heal', 'magnet', 'overdrive', 'chest', 'nuke'];
      types.forEach((t, idx) => {
        const a = (idx / types.length) * Math.PI * 2;
        drops.push({
          x: player.x + Math.cos(a) * 110,
          y: player.y + Math.sin(a) * 110,
          type: t,
          isMapItem: true,
          spawnTime: gameTime
        });
      });
      window.soundFX.pickup();
    });
  }

  const dbgNukeBtn = document.getElementById('dbg-nuke-btn');
  if (dbgNukeBtn) {
    dbgNukeBtn.addEventListener('click', () => {
      if (!player) return;
      triggerNuke();
    });
  }

  const dbgTimeBtn = document.getElementById('dbg-time-btn');
  if (dbgTimeBtn) {
    dbgTimeBtn.addEventListener('click', () => {
      gameTime += 60;
      window.soundFX.click();
    });
  }

  const dbgWinBtn = document.getElementById('dbg-win-btn');
  if (dbgWinBtn) {
    dbgWinBtn.addEventListener('click', () => {
      if (gameState === 'PLAYING') endGame(true);
    });
  }

  currentStage = STAGE_REGISTRY[meta.selectedStage] || STAGE_REGISTRY.sector_1;
  renderStageSelectGrid();
  requestAnimationFrame(gameLoop);
})();
