// === Enums ===
export enum EnemyType {
  Normal = 'normal',
  Fast = 'fast',
  Large = 'large',
}

export enum PowerUpType {
  FireBoost = 'fireBoost',
  Shield = 'shield',
  Heal = 'heal',
}

export enum GamePhase {
  Normal = 'normal',
  BossWarning = 'bossWarning',
  Boss = 'boss',
}

// === Geometry ===
export interface Vec2 {
  x: number
  y: number
}

export interface Circle {
  x: number
  y: number
  radius: number
}

// === Entity base ===
export interface Entity {
  id: number
  x: number
  y: number
  width: number
  height: number
  radius: number
  active: boolean
  vx: number
  vy: number
}

// === Bullet ===
export interface Bullet extends Entity {
  owner: 'player' | 'enemy'
  damage: number
  bulletType: 'normal' | 'spread' | 'aimed' | 'boss'
}

// === Player ===
export interface PlayerState {
  x: number
  y: number
  width: number
  height: number
  radius: number
  hp: number
  maxHp: number
  speed: number
  fireRate: number
  fireTimer: number
  bulletDamage: number
  bulletCount: number
  shieldActive: boolean
  shieldHits: number
  invincibleTimer: number
  // Squash & stretch
  scaleX: number
  scaleY: number
  prevX: number
}

// === Enemy ===
export interface EnemyState extends Entity {
  enemyType: EnemyType
  hp: number
  maxHp: number
  scoreValue: number
  fireRate: number
  fireTimer: number
  movePattern: 'straight' | 'sine' | 'zigzag' | 'homing'
  moveTimer: number
  moveAmplitude: number
  moveFrequency: number
  // Visual
  scaleX: number
  scaleY: number
}

// === PowerUp ===
export interface PowerUpState extends Entity {
  powerUpType: PowerUpType
  fallSpeed: number
  pulseTimer: number
}

// === Particle ===
export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  alpha: number
  active: boolean
}

// === Boss ===
export interface BossState extends Entity {
  hp: number
  maxHp: number
  phase: number
  attackTimer: number
  attackCooldown: number
  currentAttack: 'spread' | 'aimed' | 'spawnMinions' | 'charge'
  isVulnerable: boolean
  bossNumber: number
  chargeTarget: number
  chargeTimer: number
  chargeReturnTimer: number
  // Visual
  scaleX: number
  scaleY: number
  damaged: boolean
}

// === Engine Callbacks ===
export interface EngineCallbacks {
  onScoreChange: (score: number) => void
  onHpChange: (hp: number, maxHp: number) => void
  onPowerUpCollected: (type: string) => void
  onPowerUpExpired: (type: string) => void
  onBossAppear: (bossHp: number, bossMaxHp: number) => void
  onBossDefeat: () => void
  onBossHpChange: (hp: number, maxHp: number) => void
  onGameOver: (finalScore: number) => void
  onPhaseChange: (phase: string) => void
  onPlayerDamaged: () => void
}

// === Particle Config ===
export interface ParticleConfig {
  count: number
  spread: number
  speedMin: number
  speedMax: number
  sizeMin: number
  sizeMax: number
  lifeMin: number
  lifeMax: number
  colors: string[]
}
