#!/bin/bash
BASE="/Users/malikahusainova/Documents/Default Project/sky-escape/src"

# Create all necessary directories
mkdir -p "$BASE/game" "$BASE/hooks"

###############################################################################
# game/GameConfig.ts
###############################################################################
cat > "$BASE/game/GameConfig.ts" << 'EOF'
export const GAME_CONFIG = {
  canvas: { width: 480, height: 800 },
  lanes: [-120, 0, 120],
  laneTransitionSpeed: 12,
  baseSpeed: 3,
  maxSpeed: 18,
  speedIncrement: 0.0003,
  lives: 3,
  invincibilityDuration: 2000,
  hazardWarningTime: 800,
  difficulty: [
    { distance: 0, label: 'Training', speedMultiplier: 0.6, hazards: ['bomb'] as HazardType[] },
    { distance: 500, label: 'Escape', speedMultiplier: 0.8, hazards: ['bomb', 'missile'] as HazardType[] },
    { distance: 1500, label: 'Danger', speedMultiplier: 1.0, hazards: ['bomb', 'missile', 'laser', 'drone'] as HazardType[] },
    { distance: 3000, label: 'Inferno', speedMultiplier: 1.3, hazards: ['bomb', 'missile', 'laser', 'lightning', 'drone', 'mine'] as HazardType[] },
    { distance: 5000, label: 'Nightmare', speedMultiplier: 1.6, hazards: ['bomb', 'missile', 'laser', 'lightning', 'turbulence', 'mine', 'drone'] as HazardType[] },
  ],
  hazardSpeeds: {
    bomb: { base: 4, max: 12 }, missile: { base: 5, max: 14 }, laser: { base: 0, max: 0 },
    lightning: { base: 0, max: 0 }, turbulence: { base: 2, max: 6 }, mine: { base: 2, max: 5 }, drone: { base: 3, max: 9 },
  },
  hazardSpawnIntervals: {
    bomb: { min: 1200, max: 3000 }, missile: { min: 2000, max: 4500 }, laser: { min: 3000, max: 6000 },
    lightning: { min: 4000, max: 7000 }, turbulence: { min: 5000, max: 8000 }, mine: { min: 2500, max: 5000 }, drone: { min: 3000, max: 5500 },
  },
  locations: [
    { id: 'sky', name: 'Sky', unlockDistance: 0 }, { id: 'mountains', name: 'Mountains', unlockDistance: 500 },
    { id: 'ocean', name: 'Ocean', unlockDistance: 1000 }, { id: 'desert', name: 'Desert', unlockDistance: 2000 },
    { id: 'nightcity', name: 'Night City', unlockDistance: 3000 }, { id: 'storm', name: 'Thunderstorm', unlockDistance: 4000 },
    { id: 'space', name: 'Space', unlockDistance: 5000 },
  ] as const,
  powerUpTypes: ['shield', 'extralife', 'slowmo', 'magnet', 'doublepoints', 'speedboost'] as const,
  powerUpDuration: 8000,
  powerUpChance: 0.15,
} as const;

export type LocationId = (typeof GAME_CONFIG.locations)[number]['id'];
export type HazardType = 'bomb' | 'missile' | 'laser' | 'lightning' | 'turbulence' | 'mine' | 'drone';
export type PowerUpType = (typeof GAME_CONFIG.powerUpTypes)[number];
export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameover';

export interface GameState {
  status: GameStatus; score: number; highScore: number; lives: number;
  distance: number; speed: number; lane: number; targetLane: number;
  invincible: boolean; invincibleTimer: number;
  activePowerUps: Map<PowerUpType, number>;
  location: LocationId; nextLocation: LocationId; locationTransition: number;
  difficultyLevel: number; dodges: number; flightTime: number; combo: number;
}

export function getDefaultState(): GameState {
  return {
    status: 'menu', score: 0, highScore: 0, lives: GAME_CONFIG.lives,
    distance: 0, speed: GAME_CONFIG.baseSpeed, lane: 1, targetLane: 1,
    invincible: false, invincibleTimer: 0, activePowerUps: new Map(),
    location: 'sky', nextLocation: 'sky', locationTransition: 1,
    difficultyLevel: 0, dodges: 0, flightTime: 0, combo: 0,
  };
}
EOF

###############################################################################
# game/ObjectPool.ts
###############################################################################
cat > "$BASE/game/ObjectPool.ts" << 'EOF'
export class ObjectPool<T> {
  private pool: T[] = [];
  constructor(private factory: () => T, private reset: (obj: T) => void, initialSize: number) {
    for (let i = 0; i < initialSize; i++) this.pool.push(factory());
  }
  acquire(): T { return this.pool.length > 0 ? this.pool.pop()! : this.factory(); }
  release(obj: T): void { this.reset(obj); this.pool.push(obj); }
  get size(): number { return this.pool.length; }
}
EOF

###############################################################################
# game/GameLoop.ts
###############################################################################
cat > "$BASE/game/GameLoop.ts" << 'EOF'
export class GameLoop {
  private lastTime = 0;
  private accumulator = 0;
  private readonly fixedDt = 1000 / 60;
  private running = false;
  private rafId = 0;
  constructor(private updateFn: (dt: number) => void, private renderFn: (alpha: number) => void) {}

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  private loop = (now: number): void => {
    if (!this.running) return;
    const ft = Math.min(now - this.lastTime, 100);
    this.lastTime = now;
    this.accumulator += ft;
    while (this.accumulator >= this.fixedDt) { this.updateFn(this.fixedDt); this.accumulator -= this.fixedDt; }
    this.renderFn(this.accumulator / this.fixedDt);
    this.rafId = requestAnimationFrame(this.loop);
  };
}
EOF

###############################################################################
# game/InputSystem.ts
###############################################################################
cat > "$BASE/game/InputSystem.ts" << 'EOF'
export type InputAction = 'left' | 'right' | 'pause' | 'confirm';

export class InputSystem {
  private keys = new Set<string>();
  private touchStartX = 0;
  private touchStartY = 0;
  private actionQueue: InputAction[] = [];

  private handleKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.key.toLowerCase());
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') this.queueAction('left');
    if (k === 'ArrowRight' || k === 'd' || k === 'D') this.queueAction('right');
    if (k === 'Escape' || k === 'p' || k === 'P') this.queueAction('pause');
    if (k === 'Enter' || k === ' ') this.queueAction('confirm');
  };

  private handleKeyUp = (e: KeyboardEvent): void => { this.keys.delete(e.key.toLowerCase()); };

  private handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 0) return;
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    if (e.changedTouches.length === 0) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - this.touchStartX, dy = t.clientY - this.touchStartY;
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
    this.queueAction(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'confirm' : 'pause');
  };

  attach(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    window.addEventListener('touchend', this.handleTouchEnd, { passive: true });
  }

  detach(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchend', this.handleTouchEnd);
    this.actionQueue = [];
  }

  queueAction(a: InputAction): void { this.actionQueue.push(a); }
  pollAction(): InputAction | null { return this.actionQueue.shift() ?? null; }
  isKeyDown(k: string): boolean { return this.keys.has(k); }
}
EOF

###############################################################################
# game/AudioSystem.ts
###############################################################################
cat > "$BASE/game/AudioSystem.ts" << 'EOF'
export class AudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicPlaying = false;
  private musicInterval = 0;
  private muted = false;

  init(): void {
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.25;
    this.musicGain.connect(this.masterGain);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.6;
    this.sfxGain.connect(this.masterGain);
  }

  private ensure(): void { if (this.ctx?.state === 'suspended') this.ctx.resume(); }

  private tone(freq: number, dur: number, type: OscillatorType = 'square', vol: number = 0.3, dest?: AudioNode): void {
    if (!this.ctx || this.muted) return;
    this.ensure();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(dest || this.sfxGain!);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  playHit(): void { this.tone(100, 0.3, 'sawtooth', 0.5); this.tone(60, 0.4, 'sawtooth', 0.4); }
  playPowerUp(): void { setTimeout(() => this.tone(600, 0.1, 'sine', 0.3), 0); setTimeout(() => this.tone(800, 0.1, 'sine', 0.3), 100); setTimeout(() => this.tone(1000, 0.2, 'sine', 0.3), 200); }
  playDodge(): void { this.tone(400, 0.05, 'sine', 0.1); }

  playExplosion(): void {
    if (!this.ctx || this.muted) return;
    this.ensure();
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.5, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    src.connect(g); g.connect(this.sfxGain!); src.start();
  }

  playLaser(): void {
    if (!this.ctx || this.muted) return; this.ensure();
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.3);
    g.gain.setValueAtTime(0.2, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.connect(g); g.connect(this.sfxGain!); osc.start(); osc.stop(this.ctx.currentTime + 0.3);
  }

  playMissile(): void {
    if (!this.ctx || this.muted) return; this.ensure();
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.5);
    g.gain.setValueAtTime(0.15, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    osc.connect(g); g.connect(this.sfxGain!); osc.start(); osc.stop(this.ctx.currentTime + 0.5);
  }

  startMusic(): void {
    if (!this.ctx || this.musicPlaying) return;
    this.ensure(); this.musicPlaying = true;
    const notes = [55, 69, 82.5, 110];
    let idx = 0;
    this.musicInterval = window.setInterval(() => {
      if (!this.musicPlaying || !this.ctx) return;
      this.ensure();
      this.tone(notes[idx % notes.length], 0.3, 'triangle', 0.12, this.musicGain!);
      idx++;
      if (idx % 4 === 0) this.tone(notes[0] * 2, 0.15, 'sine', 0.06, this.musicGain!);
    }, 350);
  }

  stopMusic(): void { this.musicPlaying = false; if (this.musicInterval) { clearInterval(this.musicInterval); this.musicInterval = 0; } }
  setMuted(muted: boolean): void { this.muted = muted; if (this.masterGain) this.masterGain.gain.value = muted ? 0 : 0.5; }
  isMuted(): boolean { return this.muted; }
  destroy(): void { this.stopMusic(); if (this.ctx) { this.ctx.close(); this.ctx = null; } }
}
EOF

echo "Part 1 done - config, pool, loop, input, audio"
