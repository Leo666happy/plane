import type { PlayerState, Bullet } from './types'
import { PowerUpType } from './types'
import type { InputManager } from './InputManager'

let nextId = 1

export function createPlayer(x: number, y: number): PlayerState {
  return {
    x,
    y,
    width: 48,
    height: 56,
    radius: 22,
    hp: 100,
    maxHp: 100,
    speed: 350,
    fireRate: 3,
    fireTimer: 0,
    bulletDamage: 10,
    bulletCount: 1,
    shieldActive: false,
    shieldHits: 0,
    invincibleTimer: 0,
    scaleX: 1,
    scaleY: 1,
    prevX: x,
  }
}

export function updatePlayer(
  player: PlayerState,
  dt: number,
  input: InputManager,
  bullets: Bullet[],
  canvasWidth: number,
  canvasHeight: number
): void {
  // Movement
  let dx = 0
  let dy = 0

  if (input.isTouching) {
    // Touch control: relative delta — plane moves same distance as finger
    const delta = input.consumeTouchDelta()
    player.x += delta.dx
    player.y += delta.dy
  } else {
    // Keyboard control
    if (input.isPressed('ArrowLeft') || input.isPressed('a')) dx -= 1
    if (input.isPressed('ArrowRight') || input.isPressed('d')) dx += 1
    if (input.isPressed('ArrowUp') || input.isPressed('w')) dy -= 1
    if (input.isPressed('ArrowDown') || input.isPressed('s')) dy += 1
  }

  // Normalize diagonal movement
  if (dx !== 0 && dy !== 0) {
    const len = Math.sqrt(dx * dx + dy * dy)
    dx /= len
    dy /= len
  }

  player.x += dx * player.speed * dt
  player.y += dy * player.speed * dt

  // Clamp to canvas
  const margin = player.width / 2
  player.x = Math.max(margin, Math.min(canvasWidth - margin, player.x))
  player.y = Math.max(margin, Math.min(canvasHeight - margin, player.y))

  // Squash & stretch
  const moveDelta = player.x - player.prevX
  if (Math.abs(moveDelta) > 1) {
    const stretch = Math.abs(moveDelta) * 0.008
    player.scaleX = 1 + Math.min(stretch, 0.25)
    player.scaleY = 1 - Math.min(stretch * 0.5, 0.15)
  } else {
    // Spring back
    player.scaleX += (1 - player.scaleX) * 8 * dt
    player.scaleY += (1 - player.scaleY) * 8 * dt
  }
  player.prevX = player.x

  // Shooting (auto-fire)
  player.fireTimer -= dt
  if (player.fireTimer <= 0) {
    player.fireTimer = 1 / player.fireRate
    fireBullets(player, bullets)
  }

  // Invincibility timer
  if (player.invincibleTimer > 0) {
    player.invincibleTimer -= dt
  }
}

function fireBullets(player: PlayerState, bullets: Bullet[]): void {
  const bulletSpeed = -600
  const cx = player.x
  const cy = player.y - player.height / 2

  if (player.bulletCount === 1) {
    bullets.push(createBullet(cx, cy, 0, bulletSpeed, 'player', player.bulletDamage))
  } else if (player.bulletCount >= 3) {
    // Spread fire: center, left, right
    const spreadAngle = Math.PI / 18 // 10 degrees
    bullets.push(createBullet(cx, cy, Math.sin(-spreadAngle) * 100, bulletSpeed, 'player', player.bulletDamage))
    bullets.push(createBullet(cx, cy, 0, bulletSpeed, 'player', player.bulletDamage))
    bullets.push(createBullet(cx, cy, Math.sin(spreadAngle) * 100, bulletSpeed, 'player', player.bulletDamage))
  }
}

export function createBullet(
  x: number, y: number, vx: number, vy: number,
  owner: 'player' | 'enemy', damage: number,
  bulletType: 'normal' | 'spread' | 'aimed' | 'boss' = 'normal'
): Bullet {
  return {
    id: nextId++,
    x, y,
    width: 6,
    height: 14,
    radius: 4,
    active: true,
    vx, vy,
    owner,
    damage,
    bulletType,
  }
}

export function playerTakeDamage(player: PlayerState, damage: number): boolean {
  if (player.invincibleTimer > 0) return false

  if (player.shieldActive) {
    player.shieldHits--
    if (player.shieldHits <= 0) {
      player.shieldActive = false
    }
    return false // shield absorbed
  }

  player.hp -= damage
  player.invincibleTimer = 1.5
  return true // actually took damage
}

let powerUpTimers: Map<string, number> = new Map()

export function applyPowerUp(player: PlayerState, type: PowerUpType): void {
  switch (type) {
    case PowerUpType.FireBoost:
      player.bulletCount = 3
      player.bulletDamage = 15
      powerUpTimers.set('fireBoost', 10)
      break
    case PowerUpType.Shield:
      player.shieldActive = true
      player.shieldHits += 3
      break
    case PowerUpType.Heal:
      player.hp = Math.min(player.maxHp, player.hp + 30)
      break
  }
}

export function updatePowerUpTimers(player: PlayerState, dt: number): string[] {
  const expired: string[] = []
  for (const [type, timer] of powerUpTimers) {
    const newTimer = timer - dt
    if (newTimer <= 0) {
      expired.push(type)
      powerUpTimers.delete(type)
    } else {
      powerUpTimers.set(type, newTimer)
    }
  }
  for (const type of expired) {
    if (type === 'fireBoost') {
      player.bulletCount = 1
      player.bulletDamage = 10
    }
  }
  return expired
}

export function resetPlayerPowerUps(player: PlayerState): void {
  powerUpTimers.clear()
  player.bulletCount = 1
  player.bulletDamage = 10
  player.shieldActive = false
  player.shieldHits = 0
}
