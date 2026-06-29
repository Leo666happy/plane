import type { Bullet } from './types'

export function updateBullet(b: Bullet, dt: number, canvasWidth: number, canvasHeight: number): void {
  b.x += b.vx * dt
  b.y += b.vy * dt

  // Mark inactive if off screen
  if (b.y < -30 || b.y > canvasHeight + 30 || b.x < -30 || b.x > canvasWidth + 30) {
    b.active = false
  }
}
