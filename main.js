/**
 * Whack-a-Mole (Canvas 2D) - Professional Quality
 * Mouse + Touch via Pointer Events | Vanilla JS | No External Dependencies
 * Features: Web Audio synthesized sounds, animated background, combos, floating text
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG - All tunable constants in one place
// ═══════════════════════════════════════════════════════════════════════════
const CONFIG = {
  // Canvas logical dimensions (scaled for devicePixelRatio)
  LOGICAL_WIDTH: 720,
  LOGICAL_HEIGHT: 900,

  // Grid
  GRID_ROWS: 3,
  GRID_COLS: 3,
  GRID_PADDING: 70,
  GRID_TOP_OFFSET: 140,

  // Game timing
  GAME_DURATION_MS: 60000,
  INITIAL_LIVES: 3,
  COUNTDOWN_SECONDS: 3,

  // Spawning & difficulty
  SPAWN_INTERVAL_START_MS: 900,
  SPAWN_INTERVAL_MIN_MS: 350,
  SPAWN_INTERVAL_RAMP_PER_SEC: 8,

  MOLE_VISIBLE_START_MS: 1000,
  MOLE_VISIBLE_MIN_MS: 500,
  MOLE_VISIBLE_RAMP_PER_SEC: 5,

  // Golden mole
  GOLDEN_MOLE_CHANCE: 0.10,
  GOLDEN_MOLE_POINTS: 3,
  GOLDEN_MOLE_VISIBLE_MULT: 0.5,

  // Bomb mole (negative points, reduces combo)
  BOMB_MOLE_CHANCE: 0.08,
  BOMB_MOLE_PENALTY: 2,

  // Combo system
  COMBO_TIMEOUT_MS: 1500,
  COMBO_MULTIPLIER_MAX: 5,

  // Animation
  MOLE_POP_DURATION_MS: 120,
  MOLE_HIDE_DURATION_MS: 80,
  HIT_FLASH_DURATION_MS: 100,
  SHAKE_DURATION_MS: 150,
  SHAKE_INTENSITY: 4,

  // Particles
  PARTICLES_PER_HIT: 12,
  PARTICLE_LIFETIME_MS: 500,
  PARTICLE_SPEED_MIN: 100,
  PARTICLE_SPEED_MAX: 250,
  PARTICLE_SIZE_MIN: 4,
  PARTICLE_SIZE_MAX: 12,
  PARTICLE_POOL_SIZE: 128,

  // Background particles
  BG_PARTICLE_COUNT: 30,

  // Floating text
  FLOAT_TEXT_POOL_SIZE: 20,
  FLOAT_TEXT_LIFETIME_MS: 800,
  FLOAT_TEXT_RISE_SPEED: 80,

  // Confetti
  CONFETTI_COUNT: 100,
  CONFETTI_LIFETIME_MS: 3000,

  // Penalty (set to 'score', 'lives', or 'none')
  MISS_PENALTY_TYPE: 'score',
  MISS_PENALTY_AMOUNT: 1,

  // Audio
  MASTER_VOLUME: 0.4,
  MUSIC_VOLUME: 0.15,

  // Debug
  DEBUG: false,

  // Colors
  COLORS: {
    BG_GRADIENT_TOP: '#1a1f35',
    BG_GRADIENT_BOTTOM: '#0d1117',
    GROUND_LIGHT: '#3d5c3a',
    GROUND_DARK: '#2a4028',
    GRASS_LIGHT: '#5a8f54',
    GRASS_DARK: '#3d6b38',
    HUD_BG: 'rgba(0,0,0,0.4)',
    HUD_TEXT: '#ffffff',
    HUD_ACCENT: '#4ecdc4',
    HOLE_OUTER: '#4a3728',
    HOLE_INNER: '#1a1210',
    HOLE_RIM: '#6b5344',
    MOLE_BODY: '#8b6b4a',
    MOLE_BODY_DARK: '#6b4f32',
    MOLE_FACE: '#c4a67a',
    MOLE_NOSE: '#4a3525',
    MOLE_EYES: '#1b1b1b',
    MOLE_CHEEKS: '#d4a574',
    GOLDEN_BODY: '#ffd700',
    GOLDEN_FACE: '#fff8dc',
    GOLDEN_GLOW: 'rgba(255, 215, 0, 0.3)',
    BOMB_BODY: '#333333',
    BOMB_FUSE: '#ff4444',
    BOMB_GLOW: 'rgba(255, 68, 68, 0.3)',
    HIT_FLASH: 'rgba(255,255,255,0.9)',
    OVERLAY_BG: 'rgba(0,0,0,0.75)',
    PANEL_BG: 'rgba(20,25,40,0.95)',
    PANEL_BORDER: 'rgba(78, 205, 196, 0.3)',
    PANEL_GLOW: 'rgba(78, 205, 196, 0.1)',
    ACCENT: '#4ecdc4',
    ACCENT_DARK: '#3ba99c',
    GOLDEN_ACCENT: '#ffd700',
    DANGER: '#ff6b6b',
    PARTICLE_NORMAL: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#a8e6cf'],
    PARTICLE_GOLDEN: ['#ffd700', '#ffed4a', '#fff8dc', '#f6e05e', '#fbbf24'],
    PARTICLE_BOMB: ['#ff4444', '#ff6666', '#aa2222', '#ff8888'],
    CONFETTI: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ffd700', '#ff9ff3', '#48dbfb'],
  },

  // Storage keys
  STORAGE_KEY_BEST: 'whackamole_best_score',
  STORAGE_KEY_MUTED: 'whackamole_muted',
};

// ═══════════════════════════════════════════════════════════════════════════
// STATE ENUM
// ═══════════════════════════════════════════════════════════════════════════
const State = Object.freeze({
  START: 'START',
  COUNTDOWN: 'COUNTDOWN',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
});

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════
const Utils = {
  clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  },

  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  smoothstep(t) {
    return t * t * (3 - 2 * t);
  },

  // Easing functions
  easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  easeInBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },

  easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
  },

  easeInQuad(t) {
    return t * t;
  },

  easeOutElastic(t) {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  },

  // Distance squared (avoid sqrt)
  distSq(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  },

  // Format time as M:SS
  formatTime(ms) {
    const secs = Math.ceil(ms / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}`;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SEEDABLE RNG - Isolates randomness for determinism
// ═══════════════════════════════════════════════════════════════════════════
const RNG = {
  _seed: null,
  _state: null,

  seed(s = null) {
    this._seed = s;
    this._state = s;
  },

  _mulberry32() {
    let t = (this._state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  },

  random() {
    return this._seed !== null ? this._mulberry32() : Math.random();
  },

  randInt(min, max) {
    return Math.floor(this.random() * (max - min) + min);
  },

  randFloat(min, max) {
    return this.random() * (max - min) + min;
  },

  pick(arr) {
    return arr[this.randInt(0, arr.length)];
  },
};

RNG.seed(null);

// ═══════════════════════════════════════════════════════════════════════════
// AUDIO MANAGER - Web Audio API synthesized sounds
// ═══════════════════════════════════════════════════════════════════════════
const AudioManager = {
  _ctx: null,
  _muted: false,
  _initialized: false,
  _musicOsc: null,
  _musicGain: null,

  init() {
    // Load muted preference
    try {
      this._muted = localStorage.getItem(CONFIG.STORAGE_KEY_MUTED) === 'true';
    } catch { }
  },

  // Lazy init audio context (requires user gesture)
  _ensureContext() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
    return this._ctx;
  },

  get muted() {
    return this._muted;
  },

  set muted(val) {
    this._muted = !!val;
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY_MUTED, String(this._muted));
    } catch { }
    if (this._muted) this.stopMusic();
  },

  toggle() {
    this.muted = !this._muted;
    return this._muted;
  },

  // Play a sound by name
  play(name) {
    if (this._muted) return;
    const ctx = this._ensureContext();
    const now = ctx.currentTime;
    const vol = CONFIG.MASTER_VOLUME;

    switch (name) {
      case 'spawn': this._playSpawn(ctx, now, vol); break;
      case 'hit': this._playHit(ctx, now, vol); break;
      case 'golden': this._playGolden(ctx, now, vol); break;
      case 'bomb': this._playBomb(ctx, now, vol); break;
      case 'miss': this._playMiss(ctx, now, vol); break;
      case 'countdown': this._playCountdown(ctx, now, vol); break;
      case 'go': this._playGo(ctx, now, vol); break;
      case 'gameover': this._playGameOver(ctx, now, vol); break;
      case 'combo': this._playCombo(ctx, now, vol); break;
      case 'warning': this._playWarning(ctx, now, vol); break;
      case 'newbest': this._playNewBest(ctx, now, vol); break;
    }
  },

  _createOsc(ctx, type, freq) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    return osc;
  },

  _createGain(ctx, vol) {
    const gain = ctx.createGain();
    gain.gain.value = vol;
    gain.connect(ctx.destination);
    return gain;
  },

  _playSpawn(ctx, now, vol) {
    const osc = this._createOsc(ctx, 'sine', 300);
    const gain = this._createGain(ctx, vol * 0.3);
    osc.connect(gain);
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.08);
    gain.gain.setValueAtTime(vol * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  },

  _playHit(ctx, now, vol) {
    // Punchy hit sound
    const osc = this._createOsc(ctx, 'square', 200);
    const osc2 = this._createOsc(ctx, 'sawtooth', 150);
    const gain = this._createGain(ctx, vol * 0.4);
    osc.connect(gain);
    osc2.connect(gain);
    
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
    osc2.frequency.setValueAtTime(150, now);
    osc2.frequency.exponentialRampToValueAtTime(50, now + 0.08);
    
    gain.gain.setValueAtTime(vol * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.start(now);
    osc.stop(now + 0.15);
    osc2.start(now);
    osc2.stop(now + 0.1);
  },

  _playGolden(ctx, now, vol) {
    // Sparkly arpeggio
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this._createOsc(ctx, 'sine', freq);
      const gain = this._createGain(ctx, vol * 0.25);
      osc.connect(gain);
      const t = now + i * 0.05;
      gain.gain.setValueAtTime(vol * 0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  },

  _playBomb(ctx, now, vol) {
    // Explosion sound
    const osc = this._createOsc(ctx, 'sawtooth', 100);
    const gain = this._createGain(ctx, vol * 0.5);
    osc.connect(gain);
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
    gain.gain.setValueAtTime(vol * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);

    // Add noise
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this._createGain(ctx, vol * 0.3);
    noise.connect(noiseGain);
    noiseGain.gain.setValueAtTime(vol * 0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    noise.start(now);
    noise.stop(now + 0.2);
  },

  _playMiss(ctx, now, vol) {
    const osc = this._createOsc(ctx, 'sine', 200);
    const gain = this._createGain(ctx, vol * 0.2);
    osc.connect(gain);
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
    gain.gain.setValueAtTime(vol * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  },

  _playCountdown(ctx, now, vol) {
    const osc = this._createOsc(ctx, 'sine', 440);
    const gain = this._createGain(ctx, vol * 0.35);
    osc.connect(gain);
    gain.gain.setValueAtTime(vol * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  },

  _playGo(ctx, now, vol) {
    const osc = this._createOsc(ctx, 'sine', 880);
    const gain = this._createGain(ctx, vol * 0.4);
    osc.connect(gain);
    gain.gain.setValueAtTime(vol * 0.4, now);
    gain.gain.setValueAtTime(vol * 0.4, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  },

  _playGameOver(ctx, now, vol) {
    const notes = [392, 349, 330, 262]; // G4, F4, E4, C4
    notes.forEach((freq, i) => {
      const osc = this._createOsc(ctx, 'triangle', freq);
      const gain = this._createGain(ctx, vol * 0.3);
      osc.connect(gain);
      const t = now + i * 0.2;
      gain.gain.setValueAtTime(vol * 0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  },

  _playCombo(ctx, now, vol) {
    const osc = this._createOsc(ctx, 'sine', 600 + Game.combo * 50);
    const gain = this._createGain(ctx, vol * 0.2);
    osc.connect(gain);
    gain.gain.setValueAtTime(vol * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  },

  _playWarning(ctx, now, vol) {
    const osc = this._createOsc(ctx, 'square', 220);
    const gain = this._createGain(ctx, vol * 0.15);
    osc.connect(gain);
    gain.gain.setValueAtTime(vol * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  },

  _playNewBest(ctx, now, vol) {
    // Victory fanfare
    const notes = [523, 659, 784, 1047, 784, 1047]; // C5 E5 G5 C6 G5 C6
    const durations = [0.1, 0.1, 0.1, 0.15, 0.1, 0.3];
    let t = now;
    notes.forEach((freq, i) => {
      const osc = this._createOsc(ctx, 'sine', freq);
      const gain = this._createGain(ctx, vol * 0.3);
      osc.connect(gain);
      gain.gain.setValueAtTime(vol * 0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + durations[i]);
      osc.start(t);
      osc.stop(t + durations[i] + 0.05);
      t += durations[i];
    });
  },

  startMusic() {
    if (this._muted || this._musicOsc) return;
    const ctx = this._ensureContext();
    
    // Simple ambient pad
    this._musicGain = ctx.createGain();
    this._musicGain.gain.value = CONFIG.MUSIC_VOLUME;
    this._musicGain.connect(ctx.destination);
    
    // Multiple oscillators for rich sound
    const freqs = [65.41, 98.00, 130.81]; // C2, G2, C3
    this._musicOsc = freqs.map(f => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      osc.connect(this._musicGain);
      osc.start();
      return osc;
    });
  },

  stopMusic() {
    if (this._musicOsc) {
      this._musicOsc.forEach(o => o.stop());
      this._musicOsc = null;
    }
    if (this._musicGain) {
      this._musicGain.disconnect();
      this._musicGain = null;
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// OBJECT POOLS - Reusable particle and text objects
// ═══════════════════════════════════════════════════════════════════════════

// Particle Pool
const ParticlePool = {
  _pool: [],
  _active: [],

  init(size) {
    this._pool.length = 0;
    this._active.length = 0;
    for (let i = 0; i < size; i++) {
      this._pool.push(this._create());
    }
  },

  _create() {
    return {
      x: 0, y: 0, vx: 0, vy: 0,
      size: 0, color: '#fff',
      life: 0, maxLife: 0,
      rotation: 0, rotSpeed: 0,
      shape: 'circle', // 'circle', 'square', 'star'
      gravity: 200,
    };
  },

  spawn(x, y, vx, vy, size, color, lifetime, shape = 'circle', gravity = 200) {
    let p = this._pool.pop() || this._create();
    p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.size = size; p.color = color;
    p.life = lifetime; p.maxLife = lifetime;
    p.rotation = RNG.randFloat(0, Math.PI * 2);
    p.rotSpeed = RNG.randFloat(-5, 5);
    p.shape = shape;
    p.gravity = gravity;
    this._active.push(p);
  },

  update(dt) {
    const dtSec = dt / 1000;
    for (let i = this._active.length - 1; i >= 0; i--) {
      const p = this._active[i];
      p.life -= dt;
      if (p.life <= 0) {
        this._pool.push(this._active.splice(i, 1)[0]);
      } else {
        p.x += p.vx * dtSec;
        p.y += p.vy * dtSec;
        p.vy += p.gravity * dtSec;
        p.rotation += p.rotSpeed * dtSec;
      }
    }
  },

  draw(ctx) {
    for (const p of this._active) {
      const alpha = Utils.clamp(p.life / p.maxLife, 0, 1);
      const scale = 0.3 + 0.7 * alpha;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * scale, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'square') {
        const s = p.size * scale;
        ctx.fillRect(-s, -s, s * 2, s * 2);
      } else if (p.shape === 'star') {
        this._drawStar(ctx, 0, 0, 5, p.size * scale, p.size * scale * 0.5);
      }
      
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  },

  _drawStar(ctx, cx, cy, spikes, outerR, innerR) {
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  },

  clear() {
    while (this._active.length) {
      this._pool.push(this._active.pop());
    }
  },

  get count() { return this._active.length; },
};

// Floating Text Pool
const FloatTextPool = {
  _pool: [],
  _active: [],

  init(size) {
    this._pool.length = 0;
    this._active.length = 0;
    for (let i = 0; i < size; i++) {
      this._pool.push({ x: 0, y: 0, text: '', color: '#fff', life: 0, maxLife: 0, scale: 1 });
    }
  },

  spawn(x, y, text, color, lifetime = CONFIG.FLOAT_TEXT_LIFETIME_MS) {
    let t = this._pool.pop();
    if (!t) t = { x: 0, y: 0, text: '', color: '#fff', life: 0, maxLife: 0, scale: 1 };
    t.x = x; t.y = y; t.text = text; t.color = color;
    t.life = lifetime; t.maxLife = lifetime; t.scale = 1;
    this._active.push(t);
  },

  update(dt) {
    const rise = CONFIG.FLOAT_TEXT_RISE_SPEED * dt / 1000;
    for (let i = this._active.length - 1; i >= 0; i--) {
      const t = this._active[i];
      t.life -= dt;
      t.y -= rise;
      if (t.life <= 0) {
        this._pool.push(this._active.splice(i, 1)[0]);
      }
    }
  },

  draw(ctx) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of this._active) {
      const progress = 1 - t.life / t.maxLife;
      const alpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3;
      const scale = 1 + Utils.easeOutCubic(Math.min(progress * 3, 1)) * 0.3;
      
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${Math.floor(28 * scale)}px system-ui, -apple-system, sans-serif`;
      
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillText(t.text, t.x + 2, t.y + 2);
      
      // Text
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  },

  clear() {
    while (this._active.length) {
      this._pool.push(this._active.pop());
    }
  },
};

// Background particles (ambient floating dots)
const BgParticles = {
  particles: [],

  init() {
    this.particles = [];
    for (let i = 0; i < CONFIG.BG_PARTICLE_COUNT; i++) {
      this.particles.push({
        x: RNG.randFloat(0, CONFIG.LOGICAL_WIDTH),
        y: RNG.randFloat(0, CONFIG.LOGICAL_HEIGHT),
        size: RNG.randFloat(1, 3),
        speed: RNG.randFloat(10, 30),
        alpha: RNG.randFloat(0.1, 0.4),
        phase: RNG.randFloat(0, Math.PI * 2),
      });
    }
  },

  update(dt) {
    const dtSec = dt / 1000;
    for (const p of this.particles) {
      p.y -= p.speed * dtSec;
      p.x += Math.sin(p.phase + p.y * 0.01) * 10 * dtSec;
      p.phase += dtSec;
      if (p.y < -10) {
        p.y = CONFIG.LOGICAL_HEIGHT + 10;
        p.x = RNG.randFloat(0, CONFIG.LOGICAL_WIDTH);
      }
    }
  },

  draw(ctx) {
    ctx.fillStyle = '#fff';
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
};

// Confetti (for new high score)
const Confetti = {
  _active: [],

  spawn() {
    for (let i = 0; i < CONFIG.CONFETTI_COUNT; i++) {
      this._active.push({
        x: RNG.randFloat(0, CONFIG.LOGICAL_WIDTH),
        y: -20 - RNG.randFloat(0, 200),
        vx: RNG.randFloat(-50, 50),
        vy: RNG.randFloat(100, 300),
        size: RNG.randFloat(6, 12),
        color: RNG.pick(CONFIG.COLORS.CONFETTI),
        rotation: RNG.randFloat(0, Math.PI * 2),
        rotSpeed: RNG.randFloat(-8, 8),
        life: CONFIG.CONFETTI_LIFETIME_MS,
      });
    }
  },

  update(dt) {
    const dtSec = dt / 1000;
    for (let i = this._active.length - 1; i >= 0; i--) {
      const c = this._active[i];
      c.life -= dt;
      c.x += c.vx * dtSec;
      c.y += c.vy * dtSec;
      c.vy += 100 * dtSec; // gravity
      c.vx *= 0.99; // drag
      c.rotation += c.rotSpeed * dtSec;
      if (c.life <= 0 || c.y > CONFIG.LOGICAL_HEIGHT + 50) {
        this._active.splice(i, 1);
      }
    }
  },

  draw(ctx) {
    for (const c of this._active) {
      const alpha = Utils.clamp(c.life / 500, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = c.color;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  },

  clear() {
    this._active.length = 0;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CANVAS & SCALING
// ═══════════════════════════════════════════════════════════════════════════
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const _tempVec = { x: 0, y: 0 };

const Scaling = {
  dpr: 1,
  cssWidth: 0,
  cssHeight: 0,

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    this.dpr = window.devicePixelRatio || 1;

    const maxW = Math.min(window.innerWidth - 20, CONFIG.LOGICAL_WIDTH);
    const maxH = Math.min(window.innerHeight - 20, CONFIG.LOGICAL_HEIGHT);
    const scale = Math.min(maxW / CONFIG.LOGICAL_WIDTH, maxH / CONFIG.LOGICAL_HEIGHT);

    this.cssWidth = Math.floor(CONFIG.LOGICAL_WIDTH * scale);
    this.cssHeight = Math.floor(CONFIG.LOGICAL_HEIGHT * scale);

    canvas.style.width = `${this.cssWidth}px`;
    canvas.style.height = `${this.cssHeight}px`;

    canvas.width = Math.floor(this.cssWidth * this.dpr);
    canvas.height = Math.floor(this.cssHeight * this.dpr);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(
      (this.cssWidth * this.dpr) / CONFIG.LOGICAL_WIDTH,
      (this.cssHeight * this.dpr) / CONFIG.LOGICAL_HEIGHT
    );
  },

  pointerToLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    _tempVec.x = ((clientX - rect.left) / rect.width) * CONFIG.LOGICAL_WIDTH;
    _tempVec.y = ((clientY - rect.top) / rect.height) * CONFIG.LOGICAL_HEIGHT;
    return _tempVec;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ENTITIES - Holes and Moles
// ═══════════════════════════════════════════════════════════════════════════
const holes = [];

function buildHoles() {
  holes.length = 0;
  const gridW = CONFIG.LOGICAL_WIDTH - CONFIG.GRID_PADDING * 2;
  const gridH = CONFIG.LOGICAL_HEIGHT - CONFIG.GRID_TOP_OFFSET - CONFIG.GRID_PADDING;
  const cellW = gridW / CONFIG.GRID_COLS;
  const cellH = gridH / CONFIG.GRID_ROWS;
  const holeRadius = Math.min(cellW, cellH) * 0.28;

  for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
    for (let c = 0; c < CONFIG.GRID_COLS; c++) {
      holes.push({
        index: r * CONFIG.GRID_COLS + c,
        cx: CONFIG.GRID_PADDING + cellW * (c + 0.5),
        cy: CONFIG.GRID_TOP_OFFSET + cellH * (r + 0.55),
        r: holeRadius,
      });
    }
  }
}

// Mole types
const MoleType = { NORMAL: 0, GOLDEN: 1, BOMB: 2 };

let activeMole = null;

function spawnMole(ts, visibleMs, type = MoleType.NORMAL) {
  if (activeMole) return;

  const holeIndex = RNG.randInt(0, holes.length);
  const hole = holes[holeIndex];

  activeMole = {
    holeIndex,
    spawnTime: ts,
    despawnTime: ts + visibleMs,
    type,
    hit: false,
    hitTime: 0,
    baseX: hole.cx,
    baseY: hole.cy - hole.r * 0.15,
    radius: hole.r * 0.6,
  };

  AudioManager.play('spawn');
}

function getMoleAnimatedY(mole, now) {
  const popDur = CONFIG.MOLE_POP_DURATION_MS;
  const hideDur = CONFIG.MOLE_HIDE_DURATION_MS;
  const elapsed = now - mole.spawnTime;
  const remaining = mole.despawnTime - now;

  let offset = 0;
  const hideOffset = mole.radius * 1.5;

  if (mole.hit) {
    const hitElapsed = now - mole.hitTime;
    const hideT = Utils.clamp(hitElapsed / hideDur, 0, 1);
    offset = Utils.easeInQuad(hideT) * hideOffset;
  } else if (elapsed < popDur) {
    const t = Utils.clamp(elapsed / popDur, 0, 1);
    offset = (1 - Utils.easeOutBack(t)) * hideOffset;
  } else if (remaining < hideDur && remaining > 0) {
    const t = 1 - remaining / hideDur;
    offset = Utils.easeInBack(t) * hideOffset;
  }

  return mole.baseY + offset;
}

// ═══════════════════════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════════════════════
const Game = {
  state: State.START,

  // Stats
  score: 0,
  lives: 0,
  timeLeftMs: 0,
  elapsedMs: 0,

  // Tracking
  totalClicks: 0,
  successfulHits: 0,
  bestScore: 0,
  isNewBest: false,

  // Combo
  combo: 0,
  maxCombo: 0,
  lastHitTime: 0,

  // Countdown
  countdownValue: 0,
  lastCountdownSound: 0,

  // Timing
  lastTs: 0,
  nextSpawnMs: 0,

  // Effects
  shakeUntil: 0,
  shakeOffsetX: 0,
  shakeOffsetY: 0,
  lastWarningSecond: -1,

  // FPS
  fpsFrames: 0,
  fpsTime: 0,
  fpsDisplay: 0,

  // Animation timers
  stateEnterTime: 0,
  titleBob: 0,

  init() {
    this.bestScore = this._loadBestScore();
    AudioManager.init();
    ParticlePool.init(CONFIG.PARTICLE_POOL_SIZE);
    FloatTextPool.init(CONFIG.FLOAT_TEXT_POOL_SIZE);
    BgParticles.init();
    buildHoles();
    Scaling.init();
    Input.init();
  },

  _loadBestScore() {
    try {
      return parseInt(localStorage.getItem(CONFIG.STORAGE_KEY_BEST), 10) || 0;
    } catch { return 0; }
  },

  _saveBestScore() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY_BEST, String(this.bestScore));
    } catch { }
  },

  startCountdown(ts) {
    this.state = State.COUNTDOWN;
    this.stateEnterTime = ts;
    this.countdownValue = CONFIG.COUNTDOWN_SECONDS;
    this.lastCountdownSound = 0;
    
    // Reset game state
    this.score = 0;
    this.lives = CONFIG.INITIAL_LIVES;
    this.timeLeftMs = CONFIG.GAME_DURATION_MS;
    this.elapsedMs = 0;
    this.totalClicks = 0;
    this.successfulHits = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lastHitTime = 0;
    this.isNewBest = false;
    this.lastWarningSecond = -1;
    activeMole = null;
    ParticlePool.clear();
    FloatTextPool.clear();
    Confetti.clear();
    this.shakeUntil = 0;
    
    AudioManager.startMusic();
  },

  startPlaying(ts) {
    this.state = State.PLAYING;
    this.stateEnterTime = ts;
    this.nextSpawnMs = 300;
    AudioManager.play('go');
  },

  pause() {
    if (this.state === State.PLAYING) {
      this.state = State.PAUSED;
      AudioManager.stopMusic();
    }
  },

  resume(ts) {
    if (this.state === State.PAUSED) {
      this.state = State.PLAYING;
      this.lastTs = ts; // Prevent huge dt after unpause
      AudioManager.startMusic();
    }
  },

  togglePause(ts) {
    if (this.state === State.PLAYING) this.pause();
    else if (this.state === State.PAUSED) this.resume(ts);
  },

  end(ts) {
    this.state = State.GAME_OVER;
    this.stateEnterTime = ts;
    activeMole = null;
    AudioManager.stopMusic();
    
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.isNewBest = true;
      this._saveBestScore();
      Confetti.spawn();
      AudioManager.play('newbest');
    } else {
      AudioManager.play('gameover');
    }
  },

  getCurrentSpawnInterval() {
    const seconds = this.elapsedMs / 1000;
    const reduced = CONFIG.SPAWN_INTERVAL_START_MS - seconds * CONFIG.SPAWN_INTERVAL_RAMP_PER_SEC;
    return Utils.clamp(reduced, CONFIG.SPAWN_INTERVAL_MIN_MS, CONFIG.SPAWN_INTERVAL_START_MS);
  },

  getCurrentVisibleTime() {
    const seconds = this.elapsedMs / 1000;
    const reduced = CONFIG.MOLE_VISIBLE_START_MS - seconds * CONFIG.MOLE_VISIBLE_RAMP_PER_SEC;
    return Utils.clamp(reduced, CONFIG.MOLE_VISIBLE_MIN_MS, CONFIG.MOLE_VISIBLE_START_MS);
  },

  getComboMultiplier() {
    return Math.min(this.combo, CONFIG.COMBO_MULTIPLIER_MAX);
  },

  applyMissPenalty() {
    // Break combo
    this.combo = 0;
    
    if (CONFIG.MISS_PENALTY_TYPE === 'score') {
      this.score = Math.max(0, this.score - CONFIG.MISS_PENALTY_AMOUNT);
    } else if (CONFIG.MISS_PENALTY_TYPE === 'lives') {
      this.lives -= CONFIG.MISS_PENALTY_AMOUNT;
      if (this.lives <= 0) {
        this.lives = 0;
        this.end(performance.now());
      }
    }
    AudioManager.play('miss');
  },

  handleHit(mole, now) {
    mole.hit = true;
    mole.hitTime = now;
    this.successfulHits++;
    
    // Combo logic
    if (now - this.lastHitTime < CONFIG.COMBO_TIMEOUT_MS) {
      this.combo++;
      if (this.combo > 1) AudioManager.play('combo');
    } else {
      this.combo = 1;
    }
    this.lastHitTime = now;
    this.maxCombo = Math.max(this.maxCombo, this.combo);

    // Calculate points
    let points = 0;
    let textColor = CONFIG.COLORS.ACCENT;
    let particleColors = CONFIG.COLORS.PARTICLE_NORMAL;
    
    if (mole.type === MoleType.GOLDEN) {
      points = CONFIG.GOLDEN_MOLE_POINTS;
      textColor = CONFIG.COLORS.GOLDEN_ACCENT;
      particleColors = CONFIG.COLORS.PARTICLE_GOLDEN;
      AudioManager.play('golden');
    } else if (mole.type === MoleType.BOMB) {
      points = -CONFIG.BOMB_MOLE_PENALTY;
      textColor = CONFIG.COLORS.DANGER;
      particleColors = CONFIG.COLORS.PARTICLE_BOMB;
      this.combo = 0; // Bombs break combo
      AudioManager.play('bomb');
    } else {
      points = 1;
      AudioManager.play('hit');
    }

    // Apply combo multiplier (not for bombs)
    if (points > 0 && this.combo > 1) {
      points *= this.getComboMultiplier();
    }

    this.score = Math.max(0, this.score + Math.floor(points));

    // Spawn floating text
    const moleY = getMoleAnimatedY(mole, now);
    let text = points > 0 ? `+${Math.floor(points)}` : `${Math.floor(points)}`;
    if (this.combo > 1 && mole.type !== MoleType.BOMB) {
      text += ` x${this.getComboMultiplier()}`;
    }
    FloatTextPool.spawn(mole.baseX, moleY - 20, text, textColor);

    // Particles
    for (let i = 0; i < CONFIG.PARTICLES_PER_HIT; i++) {
      const angle = RNG.randFloat(0, Math.PI * 2);
      const speed = RNG.randFloat(CONFIG.PARTICLE_SPEED_MIN, CONFIG.PARTICLE_SPEED_MAX);
      const size = RNG.randFloat(CONFIG.PARTICLE_SIZE_MIN, CONFIG.PARTICLE_SIZE_MAX);
      const shape = RNG.pick(['circle', 'square', 'star']);
      ParticlePool.spawn(
        mole.baseX, moleY,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 80,
        size, RNG.pick(particleColors),
        CONFIG.PARTICLE_LIFETIME_MS, shape
      );
    }

    // Screen shake (stronger for bombs)
    const shakeMult = mole.type === MoleType.BOMB ? 2 : 1;
    this.shakeUntil = now + CONFIG.SHAKE_DURATION_MS * shakeMult;
  },

  update(ts) {
    // FPS
    this.fpsFrames++;
    if (ts - this.fpsTime >= 1000) {
      this.fpsDisplay = this.fpsFrames;
      this.fpsFrames = 0;
      this.fpsTime = ts;
    }

    // Delta time
    if (!this.lastTs) this.lastTs = ts;
    const dt = Math.min(ts - this.lastTs, 100);
    this.lastTs = ts;

    // Always update visuals
    this.titleBob = Math.sin(ts / 500) * 5;
    ParticlePool.update(dt);
    FloatTextPool.update(dt);
    BgParticles.update(dt);
    Confetti.update(dt);

    // Screen shake
    if (ts < this.shakeUntil) {
      const intensity = CONFIG.SHAKE_INTENSITY;
      this.shakeOffsetX = RNG.randFloat(-intensity, intensity);
      this.shakeOffsetY = RNG.randFloat(-intensity, intensity);
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    // Countdown state
    if (this.state === State.COUNTDOWN) {
      const elapsed = ts - this.stateEnterTime;
      const newValue = CONFIG.COUNTDOWN_SECONDS - Math.floor(elapsed / 1000);
      
      if (newValue !== this.countdownValue && newValue > 0) {
        this.countdownValue = newValue;
        AudioManager.play('countdown');
      }
      
      if (elapsed >= CONFIG.COUNTDOWN_SECONDS * 1000) {
        this.startPlaying(ts);
      }
      return;
    }

    if (this.state !== State.PLAYING) return;

    this.elapsedMs += dt;
    this.timeLeftMs -= dt;

    // Warning sound for last 10 seconds
    const secsLeft = Math.ceil(this.timeLeftMs / 1000);
    if (secsLeft <= 10 && secsLeft !== this.lastWarningSecond && secsLeft > 0) {
      this.lastWarningSecond = secsLeft;
      AudioManager.play('warning');
    }

    if (this.timeLeftMs <= 0) {
      this.timeLeftMs = 0;
      this.end(ts);
      return;
    }

    // Spawn scheduling
    this.nextSpawnMs -= dt;
    if (this.nextSpawnMs <= 0 && !activeMole) {
      // Determine mole type
      let type = MoleType.NORMAL;
      const roll = RNG.random();
      if (roll < CONFIG.GOLDEN_MOLE_CHANCE) {
        type = MoleType.GOLDEN;
      } else if (roll < CONFIG.GOLDEN_MOLE_CHANCE + CONFIG.BOMB_MOLE_CHANCE) {
        type = MoleType.BOMB;
      }

      let visibleTime = this.getCurrentVisibleTime();
      if (type === MoleType.GOLDEN) visibleTime *= CONFIG.GOLDEN_MOLE_VISIBLE_MULT;
      
      spawnMole(ts, visibleTime, type);
      this.nextSpawnMs = this.getCurrentSpawnInterval();
    }

    // Mole expiry
    if (activeMole) {
      if (activeMole.hit) {
        if (ts >= activeMole.hitTime + CONFIG.MOLE_HIDE_DURATION_MS) {
          activeMole = null;
        }
      } else if (ts >= activeMole.despawnTime) {
        // Missed (only lose life for normal/golden, not bombs)
        if (activeMole.type !== MoleType.BOMB) {
          this.lives--;
          this.combo = 0;
          if (this.lives <= 0) {
            this.lives = 0;
            this.end(ts);
          }
        }
        activeMole = null;
      }
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// INPUT HANDLING
// ═══════════════════════════════════════════════════════════════════════════
const Input = {
  init() {
    canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e), { passive: false });
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
  },

  onPointerDown(e) {
    e.preventDefault();
    const p = Scaling.pointerToLogical(e.clientX, e.clientY);
    const ts = performance.now();

    if (Game.state === State.START) {
      Game.startCountdown(ts);
      return;
    }

    if (Game.state === State.GAME_OVER) {
      // Only restart after a short delay to prevent accidental restarts
      if (ts - Game.stateEnterTime > 500) {
        Game.startCountdown(ts);
      }
      return;
    }

    // Check UI buttons
    if (this._hitTestMuteButton(p.x, p.y)) {
      AudioManager.toggle();
      return;
    }

    if (Game.state === State.PLAYING || Game.state === State.PAUSED) {
      if (this._hitTestPauseButton(p.x, p.y)) {
        Game.togglePause(ts);
        return;
      }
    }

    if (Game.state === State.PAUSED) {
      Game.resume(ts);
      return;
    }

    if (Game.state !== State.PLAYING) return;

    Game.totalClicks++;

    // Hit test mole
    if (activeMole && !activeMole.hit) {
      const now = performance.now();
      const moleY = getMoleAnimatedY(activeMole, now);
      const distSq = Utils.distSq(p.x, p.y, activeMole.baseX, moleY);
      if (distSq <= activeMole.radius * activeMole.radius * 1.2) { // Slightly forgiving hitbox
        Game.handleHit(activeMole, now);
        return;
      }
    }

    // Miss click penalty
    Game.applyMissPenalty();
  },

  onKeyDown(e) {
    const ts = performance.now();
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (Game.state === State.PLAYING || Game.state === State.PAUSED) {
        Game.togglePause(ts);
      }
    }
    if (e.key === 'm' || e.key === 'M') {
      AudioManager.toggle();
    }
    if (e.key === ' ' || e.key === 'Enter') {
      if (Game.state === State.START) {
        Game.startCountdown(ts);
      } else if (Game.state === State.GAME_OVER && ts - Game.stateEnterTime > 500) {
        Game.startCountdown(ts);
      }
    }
  },

  _hitTestPauseButton(x, y) {
    return Utils.distSq(x, y, CONFIG.LOGICAL_WIDTH - 50, 70) <= 25 * 25;
  },

  _hitTestMuteButton(x, y) {
    return Utils.distSq(x, y, CONFIG.LOGICAL_WIDTH - 100, 70) <= 25 * 25;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════════════════════
const Renderer = {
  draw(ts) {
    const W = CONFIG.LOGICAL_WIDTH;
    const H = CONFIG.LOGICAL_HEIGHT;

    ctx.clearRect(0, 0, W, H);

    // Apply screen shake
    ctx.save();
    ctx.translate(Game.shakeOffsetX, Game.shakeOffsetY);

    this._drawBackground(ts);
    this._drawGround();
    this._drawHoles();
    this._drawMole(ts);
    ParticlePool.draw(ctx);
    FloatTextPool.draw(ctx);

    ctx.restore();

    // HUD (not affected by shake)
    if (Game.state === State.PLAYING || Game.state === State.PAUSED || Game.state === State.COUNTDOWN) {
      this._drawHUD(ts);
    }

    // Overlays
    if (Game.state === State.START) {
      this._drawStartScreen(ts);
    } else if (Game.state === State.COUNTDOWN) {
      this._drawCountdown(ts);
    } else if (Game.state === State.GAME_OVER) {
      Confetti.draw(ctx);
      this._drawGameOverScreen(ts);
    } else if (Game.state === State.PAUSED) {
      this._drawPauseOverlay();
    }

    // Debug
    if (CONFIG.DEBUG) this._drawDebug();
  },

  _drawBackground(ts) {
    const W = CONFIG.LOGICAL_WIDTH;
    const H = CONFIG.LOGICAL_HEIGHT;

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, CONFIG.COLORS.BG_GRADIENT_TOP);
    grad.addColorStop(1, CONFIG.COLORS.BG_GRADIENT_BOTTOM);
    ctx.fillStyle = grad;
    ctx.fillRect(-20, -20, W + 40, H + 40);

    // Stars/particles
    BgParticles.draw(ctx);

    // Subtle vignette
    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  },

  _drawGround() {
    const W = CONFIG.LOGICAL_WIDTH;
    const H = CONFIG.LOGICAL_HEIGHT;
    const groundY = CONFIG.GRID_TOP_OFFSET - 40;

    // Ground gradient
    const grad = ctx.createLinearGradient(0, groundY, 0, H);
    grad.addColorStop(0, CONFIG.COLORS.GROUND_LIGHT);
    grad.addColorStop(0.3, CONFIG.COLORS.GROUND_DARK);
    grad.addColorStop(1, '#1a2a18');
    ctx.fillStyle = grad;
    
    // Wavy ground
    ctx.beginPath();
    ctx.moveTo(-20, groundY);
    for (let x = 0; x <= W + 20; x += 40) {
      const wave = Math.sin(x * 0.02) * 15;
      ctx.lineTo(x, groundY + wave);
    }
    ctx.lineTo(W + 20, H + 20);
    ctx.lineTo(-20, H + 20);
    ctx.closePath();
    ctx.fill();

    // Grass tufts
    ctx.fillStyle = CONFIG.COLORS.GRASS_LIGHT;
    for (let x = 20; x < W; x += 60) {
      const baseY = groundY + Math.sin(x * 0.02) * 15;
      this._drawGrass(x, baseY, 8 + Math.sin(x) * 3);
    }
  },

  _drawGrass(x, y, height) {
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.quadraticCurveTo(x - 5, y - height, x, y - height - 5);
    ctx.quadraticCurveTo(x + 5, y - height, x + 3, y);
    ctx.fill();
  },

  _drawHoles() {
    for (const h of holes) {
      // Dirt mound
      const moundGrad = ctx.createRadialGradient(h.cx, h.cy + h.r * 0.3, 0, h.cx, h.cy + h.r * 0.3, h.r * 1.3);
      moundGrad.addColorStop(0, '#5a4a3a');
      moundGrad.addColorStop(0.6, '#4a3a2a');
      moundGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = moundGrad;
      ctx.beginPath();
      ctx.ellipse(h.cx, h.cy + h.r * 0.3, h.r * 1.3, h.r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hole rim
      ctx.beginPath();
      ctx.ellipse(h.cx, h.cy, h.r, h.r * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = CONFIG.COLORS.HOLE_RIM;
      ctx.fill();

      // Inner hole
      ctx.beginPath();
      ctx.ellipse(h.cx, h.cy, h.r * 0.85, h.r * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = CONFIG.COLORS.HOLE_INNER;
      ctx.fill();

      // Hole depth gradient
      const depthGrad = ctx.createLinearGradient(h.cx, h.cy - h.r * 0.3, h.cx, h.cy + h.r * 0.3);
      depthGrad.addColorStop(0, 'rgba(0,0,0,0.3)');
      depthGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = depthGrad;
      ctx.fill();

      if (CONFIG.DEBUG) {
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(String(h.index), h.cx, h.cy + 5);
      }
    }
  },

  _drawMole(ts) {
    if (!activeMole) return;

    const m = activeMole;
    const now = ts;
    const y = getMoleAnimatedY(m, now);
    const hole = holes[m.holeIndex];

    // Clip to hole area for hiding effect
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(hole.cx, hole.cy, hole.r * 0.85, hole.r * 0.5, 0, 0, Math.PI * 2);
    ctx.rect(hole.cx - hole.r, hole.cy - hole.r * 2, hole.r * 2, hole.r * 2);
    ctx.clip();

    // Hit effects
    let flashAlpha = 0;
    let scale = 1;
    if (m.hit) {
      const hitElapsed = now - m.hitTime;
      if (hitElapsed < CONFIG.HIT_FLASH_DURATION_MS) {
        flashAlpha = 1 - hitElapsed / CONFIG.HIT_FLASH_DURATION_MS;
      }
      const t = Utils.clamp(hitElapsed / 60, 0, 1);
      scale = 1 + 0.25 * (1 - Utils.easeOutQuad(t));
    }

    ctx.save();
    ctx.translate(m.baseX, y);
    ctx.scale(scale, scale);

    // Glow for special moles
    if (m.type === MoleType.GOLDEN && !m.hit) {
      ctx.shadowColor = CONFIG.COLORS.GOLDEN_GLOW;
      ctx.shadowBlur = 20;
    } else if (m.type === MoleType.BOMB && !m.hit) {
      ctx.shadowColor = CONFIG.COLORS.BOMB_GLOW;
      ctx.shadowBlur = 15;
    }

    // Body colors based on type
    let bodyColor, faceColor, bodyDark;
    if (m.type === MoleType.GOLDEN) {
      bodyColor = CONFIG.COLORS.GOLDEN_BODY;
      faceColor = CONFIG.COLORS.GOLDEN_FACE;
      bodyDark = '#c9a800';
    } else if (m.type === MoleType.BOMB) {
      bodyColor = CONFIG.COLORS.BOMB_BODY;
      faceColor = '#555';
      bodyDark = '#222';
    } else {
      bodyColor = CONFIG.COLORS.MOLE_BODY;
      faceColor = CONFIG.COLORS.MOLE_FACE;
      bodyDark = CONFIG.COLORS.MOLE_BODY_DARK;
    }

    // Main body
    const r = m.radius;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    const bodyGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
    bodyGrad.addColorStop(0, bodyColor);
    bodyGrad.addColorStop(1, bodyDark);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    ctx.shadowBlur = 0;

    // Ears
    ctx.fillStyle = bodyDark;
    ctx.beginPath();
    ctx.arc(-r * 0.6, -r * 0.6, r * 0.25, 0, Math.PI * 2);
    ctx.arc(r * 0.6, -r * 0.6, r * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Face/snout
    ctx.beginPath();
    ctx.ellipse(0, r * 0.2, r * 0.5, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = faceColor;
    ctx.fill();

    // Nose
    if (m.type === MoleType.BOMB) {
      // Fuse for bomb
      ctx.strokeStyle = CONFIG.COLORS.BOMB_FUSE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.8);
      ctx.quadraticCurveTo(r * 0.3, -r * 1.1, 0, -r * 1.2);
      ctx.stroke();
      // Spark
      const sparkSize = 4 + Math.sin(now * 0.02) * 2;
      ctx.fillStyle = '#ff4';
      ctx.beginPath();
      ctx.arc(0, -r * 1.2, sparkSize, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(0, r * 0.05, r * 0.15, r * 0.12, 0, 0, Math.PI * 2);
      ctx.fillStyle = CONFIG.COLORS.MOLE_NOSE;
      ctx.fill();
      // Nose highlight
      ctx.beginPath();
      ctx.arc(-r * 0.04, r * 0.02, r * 0.04, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fill();
    }

    // Eyes
    const eyeY = -r * 0.15;
    const eyeSpacing = r * 0.25;
    const eyeSize = r * 0.12;

    if (m.hit) {
      // X eyes when hit
      ctx.strokeStyle = CONFIG.COLORS.MOLE_EYES;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      [-1, 1].forEach(side => {
        const ex = side * eyeSpacing;
        ctx.beginPath();
        ctx.moveTo(ex - eyeSize, eyeY - eyeSize);
        ctx.lineTo(ex + eyeSize, eyeY + eyeSize);
        ctx.moveTo(ex + eyeSize, eyeY - eyeSize);
        ctx.lineTo(ex - eyeSize, eyeY + eyeSize);
        ctx.stroke();
      });
    } else {
      // Normal eyes
      ctx.fillStyle = CONFIG.COLORS.MOLE_EYES;
      ctx.beginPath();
      ctx.arc(-eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
      ctx.arc(eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      // Eye highlights
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(-eyeSpacing - 2, eyeY - 2, eyeSize * 0.4, 0, Math.PI * 2);
      ctx.arc(eyeSpacing - 2, eyeY - 2, eyeSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cheeks (not for bombs)
    if (m.type !== MoleType.BOMB) {
      ctx.fillStyle = CONFIG.COLORS.MOLE_CHEEKS;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.ellipse(-r * 0.4, r * 0.15, r * 0.12, r * 0.08, 0, 0, Math.PI * 2);
      ctx.ellipse(r * 0.4, r * 0.15, r * 0.12, r * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Whiskers (not for bombs)
    if (m.type !== MoleType.BOMB) {
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      [-1, 1].forEach(side => {
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(side * r * 0.25, r * 0.1 + i * 4);
          ctx.lineTo(side * r * 0.6, r * 0.05 + i * 6 - 5);
          ctx.stroke();
        }
      });
    }

    // Flash overlay
    if (flashAlpha > 0) {
      ctx.globalAlpha = flashAlpha * 0.7;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = CONFIG.COLORS.HIT_FLASH;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
    ctx.restore();

    // Debug hitbox
    if (CONFIG.DEBUG) {
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(m.baseX, y, m.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  },

  _drawHUD(ts) {
    const W = CONFIG.LOGICAL_WIDTH;

    // HUD background
    ctx.fillStyle = CONFIG.COLORS.HUD_BG;
    this._roundedRect(15, 15, W - 30, 90, 16);
    ctx.fill();

    // Border glow
    ctx.strokeStyle = CONFIG.COLORS.PANEL_BORDER;
    ctx.lineWidth = 1;
    this._roundedRect(15, 15, W - 30, 90, 16);
    ctx.stroke();

    ctx.textBaseline = 'middle';

    // Score with glow
    ctx.fillStyle = CONFIG.COLORS.HUD_TEXT;
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${Game.score}`, 35, 60);

    // Combo indicator
    if (Game.combo > 1 && Game.state === State.PLAYING) {
      ctx.fillStyle = CONFIG.COLORS.GOLDEN_ACCENT;
      ctx.font = 'bold 18px system-ui';
      ctx.fillText(`x${Game.getComboMultiplier()} COMBO`, 35, 88);
    }

    // Lives
    ctx.textAlign = 'center';
    const livesX = W / 2;
    for (let i = 0; i < CONFIG.INITIAL_LIVES; i++) {
      const heartX = livesX - 30 + i * 30;
      const filled = i < Game.lives;
      ctx.fillStyle = filled ? CONFIG.COLORS.DANGER : 'rgba(255,255,255,0.2)';
      ctx.font = '24px system-ui';
      ctx.fillText('♥', heartX, 60);
    }

    // Time
    const secsLeft = Math.ceil(Game.timeLeftMs / 1000);
    const isWarning = secsLeft <= 10 && Game.state === State.PLAYING;
    const timePulse = isWarning ? 0.8 + Math.sin(ts * 0.01) * 0.2 : 1;

    ctx.textAlign = 'right';
    ctx.fillStyle = isWarning ? CONFIG.COLORS.DANGER : CONFIG.COLORS.HUD_TEXT;
    ctx.font = `bold ${Math.floor(26 * timePulse)}px system-ui`;
    ctx.fillText(Utils.formatTime(Game.timeLeftMs), W - 120, 60);

    // Mute button
    ctx.fillStyle = AudioManager.muted ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(W - 100, 70, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = CONFIG.COLORS.BG_GRADIENT_TOP;
    ctx.fillText(AudioManager.muted ? '🔇' : '🔊', W - 100, 71);

    // Pause button
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(W - 50, 70, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CONFIG.COLORS.BG_GRADIENT_TOP;
    ctx.fillRect(W - 57, 62, 5, 16);
    ctx.fillRect(W - 48, 62, 5, 16);

    ctx.textAlign = 'left';
  },

  _drawStartScreen(ts) {
    const W = CONFIG.LOGICAL_WIDTH;
    const H = CONFIG.LOGICAL_HEIGHT;

    ctx.fillStyle = CONFIG.COLORS.OVERLAY_BG;
    ctx.fillRect(0, 0, W, H);

    // Panel
    const pw = 520, ph = 400;
    const px = (W - pw) / 2, py = (H - ph) / 2;

    // Panel glow
    ctx.shadowColor = CONFIG.COLORS.PANEL_GLOW;
    ctx.shadowBlur = 30;
    ctx.fillStyle = CONFIG.COLORS.PANEL_BG;
    this._roundedRect(px, py, pw, ph, 24);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = CONFIG.COLORS.PANEL_BORDER;
    ctx.lineWidth = 2;
    this._roundedRect(px, py, pw, ph, 24);
    ctx.stroke();

    // Title with bob
    ctx.fillStyle = CONFIG.COLORS.ACCENT;
    ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔨 Whack-a-Mole', W / 2, py + 70 + Game.titleBob);

    // Subtitle
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '18px system-ui';
    ctx.fillText('A Classic Arcade Game', W / 2, py + 110);

    // Instructions
    ctx.fillStyle = CONFIG.COLORS.HUD_TEXT;
    ctx.font = '19px system-ui';
    const instructions = [
      '🐹 Whack moles before they hide!',
      '⭐ Golden moles = +3 points',
      '💣 Avoid bombs! They hurt your score',
      '🔥 Chain hits for combo multipliers',
      '⏸️ Press P to pause',
    ];
    instructions.forEach((text, i) => {
      ctx.fillText(text, W / 2, py + 155 + i * 32);
    });

    // Best score
    if (Game.bestScore > 0) {
      ctx.fillStyle = CONFIG.COLORS.GOLDEN_ACCENT;
      ctx.font = 'bold 20px system-ui';
      ctx.fillText(`🏆 Best Score: ${Game.bestScore}`, W / 2, py + ph - 80);
    }

    // Start prompt (pulsing)
    const pulse = 0.8 + Math.sin(ts * 0.005) * 0.2;
    ctx.fillStyle = CONFIG.COLORS.ACCENT;
    ctx.font = `bold ${Math.floor(26 * pulse)}px system-ui`;
    ctx.fillText('Tap / Click to Start', W / 2, py + ph - 35);

    ctx.textAlign = 'left';
  },

  _drawCountdown(ts) {
    const W = CONFIG.LOGICAL_WIDTH;
    const H = CONFIG.LOGICAL_HEIGHT;
    const elapsed = ts - Game.stateEnterTime;
    const phase = (elapsed % 1000) / 1000;

    // Slight overlay
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, W, H);

    // Countdown number
    const scale = 1.5 - Utils.easeOutCubic(phase) * 0.5;
    const alpha = 1 - Utils.easeInQuad(phase);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = CONFIG.COLORS.ACCENT;
    ctx.font = `bold ${Math.floor(120 * scale)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = Game.countdownValue > 0 ? String(Game.countdownValue) : 'GO!';
    ctx.fillText(text, W / 2, H / 2);

    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  },

  _drawGameOverScreen(ts) {
    const W = CONFIG.LOGICAL_WIDTH;
    const H = CONFIG.LOGICAL_HEIGHT;
    const elapsed = ts - Game.stateEnterTime;
    const fadeIn = Utils.clamp(elapsed / 300, 0, 1);

    ctx.globalAlpha = fadeIn;
    ctx.fillStyle = CONFIG.COLORS.OVERLAY_BG;
    ctx.fillRect(0, 0, W, H);

    // Panel
    const pw = 500, ph = 420;
    const px = (W - pw) / 2, py = (H - ph) / 2;
    const slideUp = (1 - Utils.easeOutCubic(fadeIn)) * 50;

    ctx.shadowColor = CONFIG.COLORS.PANEL_GLOW;
    ctx.shadowBlur = 30;
    ctx.fillStyle = CONFIG.COLORS.PANEL_BG;
    this._roundedRect(px, py + slideUp, pw, ph, 24);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = CONFIG.COLORS.PANEL_BORDER;
    ctx.lineWidth = 2;
    this._roundedRect(px, py + slideUp, pw, ph, 24);
    ctx.stroke();

    // Title
    ctx.fillStyle = Game.isNewBest ? CONFIG.COLORS.GOLDEN_ACCENT : CONFIG.COLORS.DANGER;
    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Game.isNewBest ? '🏆 New Record!' : 'Game Over', W / 2, py + 60 + slideUp);

    // Score
    ctx.fillStyle = CONFIG.COLORS.HUD_TEXT;
    ctx.font = 'bold 64px system-ui';
    ctx.fillText(String(Game.score), W / 2, py + 140 + slideUp);

    ctx.font = '20px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('POINTS', W / 2, py + 175 + slideUp);

    // Stats
    ctx.font = '22px system-ui';
    ctx.fillStyle = CONFIG.COLORS.HUD_TEXT;

    const accuracy = Game.totalClicks > 0
      ? Math.round((Game.successfulHits / Game.totalClicks) * 100)
      : 0;

    const stats = [
      `Best: ${Game.bestScore}`,
      `Accuracy: ${accuracy}%`,
      `Max Combo: x${Game.maxCombo}`,
      `Hits: ${Game.successfulHits}`,
    ];

    stats.forEach((text, i) => {
      ctx.fillText(text, W / 2, py + 220 + i * 35 + slideUp);
    });

    // Restart prompt
    if (elapsed > 500) {
      const pulse = 0.8 + Math.sin(ts * 0.005) * 0.2;
      ctx.fillStyle = CONFIG.COLORS.ACCENT;
      ctx.font = `bold ${Math.floor(24 * pulse)}px system-ui`;
      ctx.fillText('Tap / Click to Play Again', W / 2, py + ph - 35 + slideUp);
    }

    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  },

  _drawPauseOverlay() {
    const W = CONFIG.LOGICAL_WIDTH;
    const H = CONFIG.LOGICAL_HEIGHT;

    ctx.fillStyle = CONFIG.COLORS.OVERLAY_BG;
    ctx.fillRect(0, 0, W, H);

    // Panel
    const pw = 350, ph = 180;
    const px = (W - pw) / 2, py = (H - ph) / 2;

    ctx.fillStyle = CONFIG.COLORS.PANEL_BG;
    this._roundedRect(px, py, pw, ph, 20);
    ctx.fill();

    ctx.strokeStyle = CONFIG.COLORS.PANEL_BORDER;
    ctx.lineWidth = 2;
    this._roundedRect(px, py, pw, ph, 20);
    ctx.stroke();

    ctx.fillStyle = CONFIG.COLORS.HUD_TEXT;
    ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⏸️ Paused', W / 2, py + 65);

    ctx.font = '20px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('Tap or press P to resume', W / 2, py + 120);

    ctx.textAlign = 'left';
  },

  _drawDebug() {
    ctx.fillStyle = '#0f0';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const lines = [
      `FPS: ${Game.fpsDisplay}`,
      `Particles: ${ParticlePool.count}`,
      `State: ${Game.state}`,
      `Combo: ${Game.combo}`,
    ];
    lines.forEach((line, i) => {
      ctx.fillText(line, 10, CONFIG.LOGICAL_HEIGHT - 80 + i * 16);
    });
  },

  _roundedRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// GAME LOOP
// ═══════════════════════════════════════════════════════════════════════════
function gameLoop(ts) {
  Game.update(ts);
  Renderer.draw(ts);
  requestAnimationFrame(gameLoop);
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════
Game.init();
requestAnimationFrame(gameLoop);
