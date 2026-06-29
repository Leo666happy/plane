import type { EnemyState } from './types'
import { EnemyType } from './types'
import { createNormalEnemy, createFastEnemy, createLargeEnemy } from './Enemy'

export class WaveManager {
  elapsedTime: number = 0
  private spawnTimer: number = 0
  private spawnInterval: number = 1.5
  difficulty: number = 1.0

  reset(): void {
    this.elapsedTime = 0
    this.spawnTimer = 0
    this.spawnInterval = 1.5
    this.difficulty = 1.0
  }

  update(dt: number, enemies: EnemyState[], canvasWidth: number): void {
    this.elapsedTime += dt
    this.difficulty = 1 + Math.pow(this.elapsedTime / 60, 1.3)

    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) {
      this.spawnInterval = Math.max(0.3, 1.5 / this.difficulty)
      this.spawnTimer = this.spawnInterval

      // Count active enemies, don't exceed limit
      const activeCount = enemies.filter(e => e.active).length
      const maxEnemies = Math.min(30, 5 + Math.floor(this.difficulty * 2))
      if (activeCount >= maxEnemies) return

      // Spawn 1-3 enemies
      const groupSize = this.difficulty > 3 ? (Math.random() < 0.3 ? 3 : Math.random() < 0.5 ? 2 : 1) : 1
      for (let i = 0; i < groupSize; i++) {
        if (activeCount + i >= maxEnemies) break
        const x = 50 + Math.random() * (canvasWidth - 100) + (i - (groupSize - 1) / 2) * 60
        const enemy = this.createEnemy(x)
        enemies.push(enemy)
      }
    }
  }

  private createEnemy(x: number): EnemyState {
    const d = this.difficulty

    if (d < 1.5) {
      if (Math.random() < 0.8) return createNormalEnemy(x, d)
      return createFastEnemy(x, d)
    } else if (d < 3.0) {
      const roll = Math.random()
      if (roll < 0.5) return createNormalEnemy(x, d)
      if (roll < 0.8) return createFastEnemy(x, d)
      return createLargeEnemy(x, d)
    } else {
      const roll = Math.random()
      if (roll < 0.3) return createNormalEnemy(x, d)
      if (roll < 0.65) return createFastEnemy(x, d)
      return createLargeEnemy(x, d)
    }
  }
}
