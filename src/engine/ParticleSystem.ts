import type { Particle, ParticleConfig } from './types'

export class ParticleSystem {
  private pool: Particle[]
  private poolSize: number

  constructor(poolSize: number = 500) {
    this.poolSize = poolSize
    this.pool = []
    for (let i = 0; i < poolSize; i++) {
      this.pool.push(this.createDeadParticle())
    }
  }

  private createDeadParticle(): Particle {
    return {
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0, size: 0,
      color: '#000', alpha: 0, active: false,
    }
  }

  emit(x: number, y: number, config: ParticleConfig): void {
    for (let i = 0; i < config.count; i++) {
      const p = this.getDead()
      if (!p) break

      const angle = Math.random() * Math.PI * 2
      const speed = config.speedMin + Math.random() * (config.speedMax - config.speedMin)
      p.x = x
      p.y = y
      p.vx = Math.cos(angle) * speed * (0.5 + Math.random())
      p.vy = Math.sin(angle) * speed * (0.5 + Math.random())
      p.life = config.lifeMin + Math.random() * (config.lifeMax - config.lifeMin)
      p.maxLife = p.life
      p.size = config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin)
      p.color = config.colors[Math.floor(Math.random() * config.colors.length)]
      p.alpha = 1
      p.active = true
    }
  }

  private getDead(): Particle | null {
    for (const p of this.pool) {
      if (!p.active) return p
    }
    // Pool exhausted, recycle oldest
    let oldest = this.pool[0]
    for (const p of this.pool) {
      if (p.life < oldest.life) oldest = p
    }
    return oldest
  }

  explosion(x: number, y: number, size: 'small' | 'medium' | 'large'): void {
    const counts = { small: 15, medium: 30, large: 50 }
    const count = counts[size]
    this.emit(x, y, {
      count,
      spread: 1,
      speedMin: 80,
      speedMax: 250,
      sizeMin: 2,
      sizeMax: 6,
      lifeMin: 0.3,
      lifeMax: 1.0,
      colors: ['#e8751a', '#ffaa44', '#ffdd88', '#c0392b', '#daa520'],
    })
    // Smoke puffs
    this.emit(x, y, {
      count: Math.floor(count / 3),
      spread: 0.5,
      speedMin: 20,
      speedMax: 60,
      sizeMin: 4,
      sizeMax: 10,
      lifeMin: 0.5,
      lifeMax: 1.5,
      colors: ['#2f2f2f', '#4a4a4a', '#1a1410'],
    })
  }

  smokePuff(x: number, y: number): void {
    this.emit(x, y, {
      count: 8,
      spread: 0.3,
      speedMin: 10,
      speedMax: 40,
      sizeMin: 3,
      sizeMax: 8,
      lifeMin: 0.4,
      lifeMax: 0.8,
      colors: ['#3a2a1a', '#2f2f2f', '#4a4a4a'],
    })
  }

  sparkTrail(x: number, y: number): void {
    this.emit(x, y, {
      count: 3,
      spread: 0.2,
      speedMin: 20,
      speedMax: 60,
      sizeMin: 1,
      sizeMax: 3,
      lifeMin: 0.15,
      lifeMax: 0.4,
      colors: ['#ffaa44', '#ffdd88', '#daa520'],
    })
  }

  bossExplosion(x: number, y: number): void {
    // Chain of explosions
    for (let i = 0; i < 5; i++) {
      const ox = x + (Math.random() - 0.5) * 100
      const oy = y + (Math.random() - 0.5) * 60
      this.emit(ox, oy, {
        count: 40,
        spread: 1,
        speedMin: 100,
        speedMax: 350,
        sizeMin: 3,
        sizeMax: 12,
        lifeMin: 0.5,
        lifeMax: 2.0,
        colors: ['#e8751a', '#ffaa44', '#ffdd88', '#c0392b', '#daa520', '#b87333'],
      })
    }
    // Massive smoke
    this.emit(x, y, {
      count: 60,
      spread: 0.8,
      speedMin: 30,
      speedMax: 100,
      sizeMin: 6,
      sizeMax: 18,
      lifeMin: 1.0,
      lifeMax: 3.0,
      colors: ['#2f2f2f', '#4a4a4a', '#1a1410', '#3a2a1a'],
    })
  }

  powerUpSparkle(x: number, y: number): void {
    this.emit(x, y, {
      count: 10,
      spread: 1,
      speedMin: 30,
      speedMax: 80,
      sizeMin: 1,
      sizeMax: 3,
      lifeMin: 0.3,
      lifeMax: 0.6,
      colors: ['#f0c040', '#daa520', '#ffdd88'],
    })
  }

  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) continue
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt
      p.alpha = Math.max(0, p.life / p.maxLife)
      if (p.life <= 0) {
        p.active = false
      }
    }
  }

  getActiveParticles(): Particle[] {
    return this.pool.filter(p => p.active)
  }
}
