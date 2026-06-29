import type { BossState, EnemyState, Bullet, PlayerState } from './types'
import { GamePhase } from './types'
import { createBullet } from './Player'
import { createNormalEnemy } from './Enemy'

let nextId = 9000

export class BossManager {
  bossTimer: number = 0
  bossNumber: number = 0
  warningTimer: number = 0

  reset(): void {
    this.bossTimer = 0
    this.bossNumber = 0
    this.warningTimer = 0
  }

  createBoss(x: number, y: number, difficulty: number, bossNumber: number): BossState {
    return {
      id: nextId++,
      x, y,
      width: 140,
      height: 80,
      radius: 50,
      active: true,
      vx: 0,
      vy: 0,
      hp: Math.ceil(200 * bossNumber * difficulty),
      maxHp: Math.ceil(200 * bossNumber * difficulty),
      phase: 0,
      attackTimer: 1.5, // first attack after 1.5s
      attackCooldown: 2.5,
      currentAttack: 'spread',
      isVulnerable: true,
      bossNumber,
      chargeTarget: 0,
      chargeTimer: 0,
      chargeReturnTimer: 0,
      scaleX: 1,
      scaleY: 1,
      damaged: false,
    }
  }

  update(
    dt: number,
    player: PlayerState,
    enemies: EnemyState[],
    enemyBullets: Bullet[],
    boss: BossState | null,
    gamePhase: GamePhase,
    canvasWidth: number,
    canvasHeight: number,
    onPhaseChange: (phase: string) => void,
    onBossAppear: (hp: number, maxHp: number) => void,
    onBossDefeat: () => void,
  ): BossState | null {
    // Only accumulate timer in normal phase
    if (gamePhase === GamePhase.Normal) {
      this.bossTimer += dt
    }

    // Check for boss trigger
    if (gamePhase === GamePhase.Normal && this.bossTimer >= 60) {
      this.bossTimer = 0
      this.warningTimer = 2.0
      onPhaseChange('bossWarning')
      return null
    }

    // Warning phase
    if (gamePhase === GamePhase.BossWarning) {
      this.warningTimer -= dt
      if (this.warningTimer <= 0) {
        this.bossNumber++
        const difficulty = 1 + Math.pow(this.bossNumber * 60 / 60, 1.3)
        const newBoss = this.createBoss(
          canvasWidth / 2,
          80,
          difficulty,
          this.bossNumber
        )
        onPhaseChange('boss')
        onBossAppear(newBoss.hp, newBoss.maxHp)
        return newBoss
      }
      return null
    }

    // Boss fight
    if (gamePhase === GamePhase.Boss && boss && boss.active) {
      this.updateBoss(dt, boss, player, enemies, enemyBullets, canvasWidth, canvasHeight)
    }

    return boss
  }

  private updateBoss(
    dt: number,
    boss: BossState,
    player: PlayerState,
    enemies: EnemyState[],
    enemyBullets: Bullet[],
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    // Movement: slow horizontal wave
    boss.x += Math.sin(performance.now() * 0.0005) * 40 * dt
    boss.x = Math.max(100, Math.min(canvasWidth - 100, boss.x))
    boss.y = 80 + Math.sin(boss.x * 0.003 + performance.now() * 0.001) * 30

    // Phase check
    const hpPercent = boss.hp / boss.maxHp
    if (hpPercent > 0.6) boss.phase = 0
    else if (hpPercent > 0.3) boss.phase = 1
    else boss.phase = 2

    boss.damaged = boss.phase >= 1

    // --- Charge state (persists across frames, handled separately) ---
    if (boss.chargeTimer > 0) {
      // Charging downward toward target
      boss.chargeTimer -= dt
      const dx = boss.chargeTarget - boss.x
      boss.x += Math.sign(dx) * 600 * dt
      boss.y += 300 * dt
      if (boss.chargeTimer <= 0) {
        // End of charge: burst fire + return
        boss.chargeReturnTimer = 0.6
        for (let i = -2; i <= 2; i++) {
          enemyBullets.push(createBullet(
            boss.x, boss.y, i * 60, 250, 'enemy', 8 + boss.bossNumber * 2, 'boss'
          ))
        }
      }
      return // Don't run normal attack timer during charge
    }

    if (boss.chargeReturnTimer > 0) {
      // Returning upward
      boss.chargeReturnTimer -= dt
      boss.y -= 200 * dt
      if (boss.chargeReturnTimer <= 0) {
        boss.currentAttack = 'spread'
        boss.attackTimer = 1.5
      }
      return // Don't run normal attack timer during return
    }

    // --- Normal attack cycle ---
    const phaseSpeedMult = boss.phase === 0 ? 1 : boss.phase === 1 ? 1.3 : 2.0
    boss.attackTimer -= dt * phaseSpeedMult

    if (boss.attackTimer <= 0) {
      // Fire the current attack ONCE
      this.fireAttack(boss, player, enemies, enemyBullets, canvasHeight)
      // Pick next attack and set cooldown
      this.pickAttack(boss, boss.phase >= 1)
      boss.attackTimer = boss.attackCooldown
    }
  }

  private fireAttack(
    boss: BossState,
    player: PlayerState,
    enemies: EnemyState[],
    enemyBullets: Bullet[],
    canvasHeight: number,
  ): void {
    switch (boss.currentAttack) {
      case 'spread': {
        const count = 5 + boss.bossNumber
        const spreadAngle = Math.PI / 3.5 // ~51 degrees fan
        for (let i = 0; i < count; i++) {
          const angle = Math.PI / 2 - spreadAngle / 2 + (spreadAngle / (count - 1)) * i
          const speed = 220 + boss.bossNumber * 25
          enemyBullets.push(createBullet(
            boss.x, boss.y + boss.height / 2,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            'enemy', 5 + boss.bossNumber * 2, 'boss'
          ))
        }
        // Phase 2: double fan
        if (boss.phase >= 2) {
          setTimeout(() => {
            for (let i = 0; i < count; i++) {
              const angle = Math.PI / 2 - spreadAngle / 2 + (spreadAngle / (count - 1)) * i + 0.15
              const speed = 240 + boss.bossNumber * 25
              enemyBullets.push(createBullet(
                boss.x, boss.y + boss.height / 2,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                'enemy', 5 + boss.bossNumber * 2, 'boss'
              ))
            }
          }, 200)
        }
        break
      }
      case 'aimed': {
        const dx = player.x - boss.x
        const dy = player.y - boss.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const speed = 280 + boss.bossNumber * 25
        const baseAngle = Math.atan2(dy, dx)
        const count = boss.phase >= 2 ? 5 : 3
        for (let i = 0; i < count; i++) {
          const offset = (i - (count - 1) / 2) * 0.12
          enemyBullets.push(createBullet(
            boss.x, boss.y + boss.height / 2,
            Math.cos(baseAngle + offset) * speed,
            Math.sin(baseAngle + offset) * speed,
            'enemy', 5 + boss.bossNumber * 2, 'boss'
          ))
        }
        break
      }
      case 'spawnMinions': {
        const count = 3 + Math.floor(boss.bossNumber / 2)
        for (let i = 0; i < count; i++) {
          const ex = boss.x + (Math.random() - 0.5) * 120
          const ey = boss.y + (Math.random() - 0.5) * 40
          const enemy = createNormalEnemy(ex, 1 + boss.bossNumber * 0.5)
          enemy.y = ey
          enemies.push(enemy)
        }
        break
      }
      case 'charge': {
        boss.chargeTarget = player.x
        boss.chargeTimer = 0.8
        boss.isVulnerable = true
        break
      }
    }
  }

  private pickAttack(boss: BossState, includeMinions: boolean): void {
    const attacks: Array<'spread' | 'aimed'> = ['spread', 'aimed']
    if (includeMinions && boss.phase >= 1) attacks.push('spawnMinions')
    if (boss.bossNumber >= 2) attacks.push('charge')

    // Don't repeat charge consecutively
    const pool = boss.currentAttack === 'charge'
      ? attacks.filter(a => a !== 'charge')
      : attacks

    boss.currentAttack = pool[Math.floor(Math.random() * pool.length)]
    boss.attackCooldown = boss.currentAttack === 'spawnMinions'
      ? (7 / (1 + boss.phase * 0.3))
      : boss.currentAttack === 'charge'
        ? 10
        : (2.5 / (1 + boss.phase * 0.3))
  }
}
