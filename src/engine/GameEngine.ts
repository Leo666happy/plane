import type { EngineCallbacks } from './types'
import { GamePhase } from './types'
import type { PlayerState, Bullet, EnemyState, PowerUpState, BossState } from './types'
import { InputManager } from './InputManager'
import { Renderer } from './Renderer'
import { BackgroundManager } from './BackgroundManager'
import { ParticleSystem } from './ParticleSystem'
import { CollisionDetector, circleCollision } from './CollisionDetector'
import { WaveManager } from './WaveManager'
import { BossManager } from './BossManager'
import { createPlayer, updatePlayer, playerTakeDamage, applyPowerUp, updatePowerUpTimers, resetPlayerPowerUps } from './Player'
import { updateBullet } from './Bullet'
import { updateEnemy } from './Enemy'
import { createPowerUp, updatePowerUp } from './PowerUp'
import { PowerUpType } from './types'

export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private dpr: number
  private canvasWidth: number = 0
  private canvasHeight: number = 0
  private animFrameId: number = 0
  private lastTime: number = 0
  private running: boolean = false
  private paused: boolean = false

  // Subsystems
  private input: InputManager
  private renderer: Renderer
  private background: BackgroundManager | null = null
  private particles: ParticleSystem
  private collision: CollisionDetector
  private waveManager: WaveManager
  private bossManager: BossManager

  // Game state
  private player: PlayerState
  private playerBullets: Bullet[] = []
  private enemyBullets: Bullet[] = []
  private enemies: EnemyState[] = []
  private powerUps: PowerUpState[] = []
  private boss: BossState | null = null
  private score: number = 0
  private gamePhase: GamePhase = GamePhase.Normal
  private bossDefeatTextTimer: number = 0
  private cleanupTimer: number = 0

  // Screen shake / damage feedback
  private shakeIntensity: number = 0
  private shakeTimer: number = 0
  private damageFlashTimer: number = 0

  // Callbacks
  private callbacks: EngineCallbacks

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks, canvasWidth?: number, canvasHeight?: number) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.dpr = window.devicePixelRatio || 1
    this.callbacks = callbacks

    // Logical canvas size
    this.canvasWidth = canvasWidth ?? window.innerWidth
    this.canvasHeight = canvasHeight ?? window.innerHeight

    // Set physical canvas buffer for HiDPI
    canvas.width = this.canvasWidth * this.dpr
    canvas.height = this.canvasHeight * this.dpr
    canvas.style.width = this.canvasWidth + 'px'
    canvas.style.height = this.canvasHeight + 'px'
    this.ctx.scale(this.dpr, this.dpr)

    // Initialize subsystems
    this.input = new InputManager(canvas)
    this.renderer = new Renderer(this.ctx)
    this.background = new BackgroundManager(this.canvasWidth, this.canvasHeight)
    this.particles = new ParticleSystem(500)
    this.collision = new CollisionDetector()
    this.waveManager = new WaveManager()
    this.bossManager = new BossManager()

    // Create player
    this.player = createPlayer(this.canvasWidth / 2, this.canvasHeight - 120)

    // Setup visibility listener
    this.setupVisibilityListener()

    // Start game loop
    this.lastTime = performance.now()
    this.running = true
    this.loop(this.lastTime)
  }

  private setupVisibilityListener(): void {
    const handler = () => {
      if (document.hidden) {
        this.paused = true
        if (this.animFrameId) {
          cancelAnimationFrame(this.animFrameId)
          this.animFrameId = 0
        }
      } else {
        this.paused = false
        if (this.running) {
          this.lastTime = performance.now()
          this.loop(this.lastTime)
        }
      }
    }
    document.addEventListener('visibilitychange', handler)
  }

  private loop = (now: number): void => {
    if (!this.running || this.paused) return

    const dt = Math.min((now - this.lastTime) / 1000, 0.05) // cap at 50ms
    this.lastTime = now

    this.update(dt)
    this.render()

    this.animFrameId = requestAnimationFrame(this.loop)
  }

  // === Update ===
  private update(dt: number): void {
    // 0. Smooth touch input (low-pass filter sensor noise)
    this.input.updateTouchFilter()

    // 1. Update player
    updatePlayer(this.player, dt, this.input, this.playerBullets, this.canvasWidth, this.canvasHeight)

    // 2. Update power-up timers
    const expired = updatePowerUpTimers(this.player, dt)
    for (const type of expired) {
      this.callbacks.onPowerUpExpired(type)
    }

    // 3. Update boss manager
    const prevPhase = this.gamePhase
    const newBoss = this.bossManager.update(
      dt, this.player, this.enemies, this.enemyBullets,
      this.boss, this.gamePhase, this.canvasWidth, this.canvasHeight,
      (phase: string) => {
        this.gamePhase = phase as GamePhase
        this.callbacks.onPhaseChange(phase)
      },
      (hp: number, maxHp: number) => {
        this.callbacks.onBossAppear(hp, maxHp)
      },
      () => {
        this.callbacks.onBossDefeat()
        this.bossDefeatTextTimer = 2.0
      },
    )

    if (newBoss) {
      this.boss = newBoss
    }

    // 4. Update wave manager (only during normal phase)
    if (this.gamePhase === GamePhase.Normal) {
      this.waveManager.update(dt, this.enemies, this.canvasWidth)
    }

    // 5. Update enemies
    for (const enemy of this.enemies) {
      if (!enemy.active) continue
      updateEnemy(enemy, dt, this.player.x, this.canvasWidth, this.enemyBullets)
    }

    // 6. Update bullets
    for (const b of this.playerBullets) {
      if (b.active) updateBullet(b, dt, this.canvasWidth, this.canvasHeight)
    }
    for (const b of this.enemyBullets) {
      if (b.active) updateBullet(b, dt, this.canvasWidth, this.canvasHeight)
    }

    // 7. Update power-ups
    for (const p of this.powerUps) {
      if (p.active) updatePowerUp(p, dt)
    }

    // 8. Update particles
    this.particles.update(dt)

    // 9. Update background
    this.background?.update(dt)

    // 10. Update boss defeat text timer
    if (this.bossDefeatTextTimer > 0) {
      this.bossDefeatTextTimer -= dt
    }

    // 10b. Update screen shake & damage flash
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt
      this.shakeIntensity = this.shakeTimer * 6 // decay from 1.2 down to 0
    } else {
      this.shakeIntensity = 0
    }
    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer -= dt
    }

    // 11. Collision detection
    this.runCollisions()

    // 12. Clean up inactive entities periodically
    this.cleanupTimer += dt
    if (this.cleanupTimer > 1.0) {
      this.cleanupTimer = 0
      this.cleanupEntities()
    }

    // 13. Enforce bullet limits
    this.enforceLimits()
  }

  private runCollisions(): void {
    // Build spatial grid
    this.collision.clear()

    // Insert all collision-relevant entities
    for (const b of this.playerBullets) {
      if (b.active) this.collision.insert(b)
    }
    for (const e of this.enemies) {
      if (e.active) this.collision.insert(e)
    }
    if (this.boss && this.boss.active && this.boss.isVulnerable) {
      this.collision.insert(this.boss)
    }

    // Player bullets vs enemies
    for (const bullet of this.playerBullets) {
      if (!bullet.active) continue
      const nearby = this.collision.query(bullet)
      for (const other of nearby) {
        if (!circleCollision(bullet, other)) continue

        // Check if it's an enemy
        const enemy = this.enemies.find(e => e === other && e.active)
        if (enemy) {
          bullet.active = false
          enemy.hp -= bullet.damage
          this.particles.sparkTrail(bullet.x, bullet.y)
          if (enemy.hp <= 0) {
            enemy.active = false
            this.score += enemy.scoreValue
            this.callbacks.onScoreChange(this.score)
            const size = enemy.enemyType === 'large' ? 'large' : enemy.enemyType === 'fast' ? 'small' : 'medium'
            this.particles.explosion(enemy.x, enemy.y, size)
            this.tryDropPowerUp(enemy.x, enemy.y)
          }
          break
        }

        // Check boss
        if (this.boss && other === this.boss && this.boss.active && this.boss.isVulnerable) {
          bullet.active = false
          this.boss.hp -= bullet.damage
          this.particles.sparkTrail(bullet.x, bullet.y)
          this.callbacks.onBossHpChange(this.boss.hp, this.boss.maxHp)
          if (this.boss.hp <= 0) {
            this.boss.hp = 0
            this.boss.active = false
            this.score += 1000 * this.boss.bossNumber
            this.callbacks.onScoreChange(this.score)
            this.particles.bossExplosion(this.boss.x, this.boss.y)
            this.callbacks.onBossDefeat()
            this.bossDefeatTextTimer = 2.0
            this.gamePhase = GamePhase.Normal
            this.callbacks.onPhaseChange('normal')
            this.bossManager.bossTimer = 0
            this.boss = null
          }
          break
        }
      }
    }

    // Enemy bullets vs player
    if (this.player.invincibleTimer <= 0) {
      for (const bullet of this.enemyBullets) {
        if (!bullet.active) continue
        if (circleCollision(bullet, this.player)) {
          bullet.active = false
          const hadShield = this.player.shieldActive
          const tookDamage = playerTakeDamage(this.player, bullet.damage)
          if (tookDamage) {
            this.particles.smokePuff(this.player.x, this.player.y)
            this.callbacks.onHpChange(this.player.hp, this.player.maxHp)
            this.callbacks.onPlayerDamaged()
            this.shakeTimer = 0.2
            this.damageFlashTimer = 0.15
            if (this.player.hp <= 0) {
              this.player.hp = 0
              this.particles.explosion(this.player.x, this.player.y, 'large')
              this.running = false
              this.callbacks.onGameOver(this.score)
              return
            }
          } else if (hadShield && !this.player.shieldActive) {
            // Shield just broke
            this.callbacks.onPowerUpExpired('shield')
            this.particles.sparkTrail(this.player.x, this.player.y)
          } else if (this.player.shieldActive) {
            this.particles.sparkTrail(this.player.x, this.player.y)
          }
        }
      }
    }

    // Enemy body vs player
    if (this.player.invincibleTimer <= 0) {
      for (const enemy of this.enemies) {
        if (!enemy.active) continue
        if (circleCollision(enemy, this.player)) {
          const damage = enemy.enemyType === 'large' ? 20 : 10
          const hadShield = this.player.shieldActive
          const tookDamage = playerTakeDamage(this.player, damage)
          enemy.hp -= 15
          if (enemy.hp <= 0) {
            enemy.active = false
            this.score += enemy.scoreValue
            this.callbacks.onScoreChange(this.score)
            this.particles.explosion(enemy.x, enemy.y, 'small')
          }
          if (tookDamage) {
            this.callbacks.onHpChange(this.player.hp, this.player.maxHp)
            this.particles.smokePuff(this.player.x, this.player.y)
            this.callbacks.onPlayerDamaged()
            this.shakeTimer = 0.2
            this.damageFlashTimer = 0.15
            if (this.player.hp <= 0) {
              this.player.hp = 0
              this.particles.explosion(this.player.x, this.player.y, 'large')
              this.running = false
              this.callbacks.onGameOver(this.score)
              return
            }
          } else if (hadShield && !this.player.shieldActive) {
            this.callbacks.onPowerUpExpired('shield')
            this.particles.sparkTrail(this.player.x, this.player.y)
          } else if (this.player.shieldActive) {
            this.particles.sparkTrail(this.player.x, this.player.y)
          }
        }
      }
    }

    // Player vs power-ups
    for (const p of this.powerUps) {
      if (!p.active) continue
      const dx = this.player.x - p.x
      const dy = this.player.y - p.y
      if (dx * dx + dy * dy < 50 * 50) {
        p.active = false
        applyPowerUp(this.player, p.powerUpType)
        this.particles.powerUpSparkle(p.x, p.y)
        this.callbacks.onPowerUpCollected(p.powerUpType)
        if (p.powerUpType === PowerUpType.Heal) {
          this.callbacks.onHpChange(this.player.hp, this.player.maxHp)
        }
      }
    }
  }

  private tryDropPowerUp(x: number, y: number): void {
    const chance = 0.15
    if (Math.random() < chance) {
      const pu = createPowerUp(x, y)
      this.powerUps.push(pu)
    }
  }

  private cleanupEntities(): void {
    this.playerBullets = this.playerBullets.filter(b => b.active)
    this.enemyBullets = this.enemyBullets.filter(b => b.active)
    this.enemies = this.enemies.filter(e => e.active)
    this.powerUps = this.powerUps.filter(p => p.active)
  }

  private enforceLimits(): void {
    // Player bullets cap
    if (this.playerBullets.length > 50) {
      const toRemove = this.playerBullets.length - 50
      this.playerBullets.splice(0, toRemove)
    }
    // Enemy bullets cap
    if (this.enemyBullets.length > 120) {
      const toRemove = this.enemyBullets.length - 120
      this.enemyBullets.splice(0, toRemove)
    }
    // Power-ups cap
    if (this.powerUps.length > 10) {
      this.powerUps.splice(0, this.powerUps.length - 10)
    }
  }

  // === Render ===
  private render(): void {
    const ctx = this.ctx
    this.renderer.clear(this.canvasWidth, this.canvasHeight)

    // Apply camera shake offset
    let shakeX = 0
    let shakeY = 0
    if (this.shakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2
      shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2
    }

    ctx.save()
    ctx.translate(shakeX, shakeY)

    // Background
    this.background?.render(ctx)

    // Power-ups (behind everything)
    for (const p of this.powerUps) {
      if (p.active) this.renderer.drawPowerUp(ctx, p)
    }

    // Player bullets
    for (const b of this.playerBullets) {
      if (b.active) this.renderer.drawBullet(ctx, b)
    }

    // Enemy bullets
    for (const b of this.enemyBullets) {
      if (b.active) this.renderer.drawBullet(ctx, b)
    }

    // Enemies
    for (const enemy of this.enemies) {
      if (enemy.active) this.renderer.drawEnemy(ctx, enemy, performance.now() / 1000)
    }

    // Boss
    if (this.boss && this.boss.active) {
      this.renderer.drawBoss(ctx, this.boss, performance.now() / 1000)
    }

    // Player
    this.renderer.drawPlayer(ctx, this.player, performance.now() / 1000)

    // Particles
    for (const p of this.particles.getActiveParticles()) {
      this.renderer.drawParticle(ctx, p)
    }

    // Boss warning text
    if (this.gamePhase === GamePhase.BossWarning) {
      this.renderer.drawBossWarning(ctx, this.canvasWidth, this.canvasHeight, this.bossManager.warningTimer)
    }

    // Boss defeat text
    if (this.bossDefeatTextTimer > 0) {
      this.renderer.drawBossDefeatText(ctx, this.canvasWidth, this.canvasHeight, this.bossDefeatTextTimer)
    }

    // Noise overlay (vintage texture)
    this.renderer.applyNoiseOverlay(this.canvasWidth, this.canvasHeight)

    // Restore camera shake translation
    ctx.restore()

    // Damage red vignette (drawn outside shake so it affects the whole screen)
    if (this.damageFlashTimer > 0) {
      this.renderer.drawDamageVignette(this.canvasWidth, this.canvasHeight, this.damageFlashTimer / 0.15)
    }

    // Frame count
    this.renderer.tick()
  }

  // === Public API ===
  resize(newWidth: number, newHeight: number): void {
    this.canvasWidth = newWidth
    this.canvasHeight = newHeight

    this.canvas.width = newWidth * this.dpr
    this.canvas.height = newHeight * this.dpr
    this.canvas.style.width = newWidth + 'px'
    this.canvas.style.height = newHeight + 'px'
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)

    this.background?.resize(newWidth, newHeight)

    // Clamp player position
    this.player.x = Math.max(this.player.width / 2, Math.min(newWidth - this.player.width / 2, this.player.x))
    this.player.y = Math.max(this.player.height / 2, Math.min(newHeight - this.player.height / 2, this.player.y))
  }

  pause(): void {
    this.paused = true
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = 0
    }
  }

  resume(): void {
    this.paused = false
    if (this.running) {
      this.lastTime = performance.now()
      this.loop(this.lastTime)
    }
  }

  dispose(): void {
    this.running = false
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = 0
    }
    this.input.dispose()
  }
}
