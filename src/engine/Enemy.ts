import type { EnemyState, Bullet } from './types'
import { EnemyType } from './types'
import { createBullet } from './Player'

let nextId = 1000

export function createNormalEnemy(x: number, difficulty: number): EnemyState {
  const hpMult = 1 + (difficulty - 1) * 0.4
  return {
    id: nextId++,
    x, y: -60,
    width: 40,
    height: 44,
    radius: 18,
    active: true,
    vx: 0,
    vy: 120 + difficulty * 15,
    enemyType: EnemyType.Normal,
    hp: Math.ceil(20 * hpMult),
    maxHp: Math.ceil(20 * hpMult),
    scoreValue: 100,
    fireRate: 0.4 * difficulty,
    fireTimer: 1.5 + Math.random() * 2,
    movePattern: Math.random() < 0.3 ? 'sine' : 'straight',
    moveTimer: 0,
    moveAmplitude: 60 + Math.random() * 40,
    moveFrequency: 1.5 + Math.random() * 1.5,
    scaleX: 1,
    scaleY: 1,
  }
}

export function createFastEnemy(x: number, difficulty: number): EnemyState {
  const hpMult = 1 + (difficulty - 1) * 0.3
  return {
    id: nextId++,
    x, y: -40,
    width: 28,
    height: 32,
    radius: 12,
    active: true,
    vx: 0,
    vy: 200 + difficulty * 25,
    enemyType: EnemyType.Fast,
    hp: Math.ceil(10 * hpMult),
    maxHp: Math.ceil(10 * hpMult),
    scoreValue: 150,
    fireRate: 0.2 * difficulty,
    fireTimer: 2 + Math.random() * 2,
    movePattern: 'zigzag',
    moveTimer: 0,
    moveAmplitude: 100 + difficulty * 20,
    moveFrequency: 2.5,
    scaleX: 1,
    scaleY: 1,
  }
}

export function createLargeEnemy(x: number, difficulty: number): EnemyState {
  const hpMult = 1 + (difficulty - 1) * 0.5
  return {
    id: nextId++,
    x, y: -80,
    width: 56,
    height: 60,
    radius: 26,
    active: true,
    vx: 0,
    vy: 80 + difficulty * 10,
    enemyType: EnemyType.Large,
    hp: Math.ceil(50 * hpMult),
    maxHp: Math.ceil(50 * hpMult),
    scoreValue: 300,
    fireRate: 0.6 * difficulty,
    fireTimer: 1 + Math.random(),
    movePattern: 'homing',
    moveTimer: 0,
    moveAmplitude: 40,
    moveFrequency: 1,
    scaleX: 1,
    scaleY: 1,
  }
}

export function updateEnemy(
  enemy: EnemyState,
  dt: number,
  playerX: number,
  canvasWidth: number,
  bullets: Bullet[]
): void {
  // Movement patterns
  enemy.moveTimer += dt

  switch (enemy.movePattern) {
    case 'straight':
      // Just moves downward via vy
      break
    case 'sine':
      enemy.vx = Math.sin(enemy.moveTimer * enemy.moveFrequency * Math.PI * 2) * enemy.moveAmplitude
      break
    case 'zigzag': {
      const period = 1.2
      const halfPeriod = period / 2
      const t = enemy.moveTimer % period
      if (t < halfPeriod) {
        enemy.vx = -enemy.moveAmplitude * 0.7
      } else {
        enemy.vx = enemy.moveAmplitude * 0.7
      }
      break
    }
    case 'homing': {
      const dx = playerX - enemy.x
      const homingSpeed = 60
      if (Math.abs(dx) > 5) {
        enemy.vx = Math.sign(dx) * Math.min(Math.abs(dx) * 2, homingSpeed)
      }
      break
    }
  }

  // Apply movement
  enemy.x += enemy.vx * dt
  enemy.y += enemy.vy * dt

  // Clamp horizontal
  enemy.x = Math.max(enemy.width / 2, Math.min(canvasWidth - enemy.width / 2, enemy.x))

  // Shooting
  enemy.fireTimer -= dt
  if (enemy.fireTimer <= 0 && enemy.y > 0 && enemy.y < 800) {
    enemy.fireTimer = 1 / enemy.fireRate
    const bx = enemy.x
    const by = enemy.y + enemy.height / 2
    bullets.push(createBullet(bx, by, 0, 200, 'enemy', 10))
    // Large enemies fire spread
    if (enemy.enemyType === EnemyType.Large) {
      bullets.push(createBullet(bx - 12, by, -40, 180, 'enemy', 10))
      bullets.push(createBullet(bx + 12, by, 40, 180, 'enemy', 10))
    }
  }

  // Remove if off bottom
  if (enemy.y > 900) {
    enemy.active = false
  }
}
