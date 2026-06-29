import type { PowerUpState } from './types'
import { PowerUpType } from './types'

let nextId = 5000

export function createPowerUp(x: number, y: number, type?: PowerUpType): PowerUpState {
  let powerUpType: PowerUpType
  if (type) {
    powerUpType = type
  } else {
    // Random with weights
    const roll = Math.random()
    if (roll < 0.5) {
      powerUpType = PowerUpType.FireBoost
    } else if (roll < 0.75) {
      powerUpType = PowerUpType.Shield
    } else {
      powerUpType = PowerUpType.Heal
    }
  }

  return {
    id: nextId++,
    x,
    y,
    width: 24,
    height: 24,
    radius: 12,
    active: true,
    vx: 0,
    vy: 0,
    powerUpType,
    fallSpeed: 80,
    pulseTimer: Math.random() * Math.PI * 2,
  }
}

export function updatePowerUp(p: PowerUpState, dt: number): void {
  p.y += p.fallSpeed * dt
  p.pulseTimer += dt * 3

  // Remove if off bottom
  if (p.y > 900) {
    p.active = false
  }
}
