import type { PlayerState, EnemyState, Bullet, PowerUpState, BossState, Particle } from './types'
import { EnemyType, PowerUpType, GamePhase } from './types'

// === Steampunk Color Palette ===
const C = {
  copper: '#b87333',
  copperLit: '#d4893a',
  copperDark: '#8b5e3c',
  gold: '#daa520',
  goldDark: '#b8860b',
  goldLit: '#f0c040',
  brass: '#b5a642',
  brassLit: '#c9ae5c',
  brassDark: '#8a7d30',
  brown: '#8b4513',
  brownLit: '#a0522d',
  darkIron: '#2f2f2f',
  darkIronLit: '#4a4a4a',
  bgWarm: '#1a1410',
  textWarm: '#f5deb3',
  fire: '#e8751a',
  fireLit: '#ffaa44',
  danger: '#c0392b',
  heal: '#27ae60',
  healLit: '#2ecc71',
  shield: '#2980b9',
  shieldLit: '#3498db',
}

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private noiseCanvas: HTMLCanvasElement | null = null
  private frameCount: number = 0

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
    this.generateNoiseTexture()
  }

  private generateNoiseTexture(): void {
    const w = 256
    const h = 256
    this.noiseCanvas = document.createElement('canvas')
    this.noiseCanvas.width = w
    this.noiseCanvas.height = h
    const nctx = this.noiseCanvas.getContext('2d')!
    const img = nctx.createImageData(w, h)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 30
      img.data[i] = v
      img.data[i + 1] = v
      img.data[i + 2] = v
      img.data[i + 3] = 30
    }
    nctx.putImageData(img, 0, 0)
  }

  clear(canvasWidth: number, canvasHeight: number): void {
    const ctx = this.ctx
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  }

  applyNoiseOverlay(canvasWidth: number, canvasHeight: number): void {
    if (!this.noiseCanvas) return
    const ctx = this.ctx
    ctx.save()
    ctx.globalAlpha = 0.04
    // Tile the noise across the screen
    for (let x = 0; x < canvasWidth; x += 256) {
      for (let y = 0; y < canvasHeight; y += 256) {
        ctx.drawImage(this.noiseCanvas, x, y)
      }
    }
    ctx.restore()
  }

  // === Player Plane Drawing ===
  drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, time: number): void {
    ctx.save()
    ctx.translate(player.x, player.y)

    // Squash & stretch
    ctx.scale(player.scaleX, player.scaleY)

    // Invincibility flash
    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer * 10) % 2 === 0) {
      ctx.globalAlpha = 0.4
    }

    const w = player.width
    const h = player.height

    // === Engine exhaust / flame ===
    this.drawExhaust(ctx, 0, h / 2 - 4, time)

    // === Main body (capsule shape) ===
    ctx.fillStyle = C.darkIron
    ctx.strokeStyle = C.brass
    ctx.lineWidth = 2.5
    ctx.beginPath()
    this.roundedRect(ctx, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 12)
    ctx.fill()
    ctx.stroke()

    // === Copper banding on body ===
    ctx.strokeStyle = C.copperLit
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-w / 2 + 10, -h / 4)
    ctx.lineTo(w / 2 - 10, -h / 4)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-w / 2 + 10, h / 4)
    ctx.lineTo(w / 2 - 10, h / 4)
    ctx.stroke()

    // === Wings ===
    // Left wing
    ctx.fillStyle = C.copper
    ctx.strokeStyle = C.brassLit
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-w / 2 + 4, h / 6)
    ctx.lineTo(-w / 2 - 16, h / 3 + 6)
    ctx.lineTo(-w / 2 + 2, h / 3 + 2)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Right wing
    ctx.beginPath()
    ctx.moveTo(w / 2 - 4, h / 6)
    ctx.lineTo(w / 2 + 16, h / 3 + 6)
    ctx.lineTo(w / 2 - 2, h / 3 + 2)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Wing rivets
    ctx.fillStyle = C.goldLit
    this.drawRivet(ctx, -w / 2 - 8, h / 4)
    this.drawRivet(ctx, w / 2 + 8, h / 4)

    // === Cockpit (glass dome) ===
    const cockpitGrad = ctx.createRadialGradient(0, -h / 6, 2, 0, -h / 6, 10)
    cockpitGrad.addColorStop(0, C.brassLit)
    cockpitGrad.addColorStop(0.6, C.goldDark)
    cockpitGrad.addColorStop(1, C.darkIron)
    ctx.fillStyle = cockpitGrad
    ctx.beginPath()
    ctx.ellipse(0, -h / 8, 8, 11, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = C.brass
    ctx.lineWidth = 1.5
    ctx.stroke()

    // === Propeller ===
    this.drawPropeller(ctx, 0, -h / 2 - 2, time)

    // === Tail fin ===
    ctx.fillStyle = C.brown
    ctx.strokeStyle = C.copper
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(-4, h / 2 - 8)
    ctx.lineTo(0, h / 2 + 8)
    ctx.lineTo(4, h / 2 - 8)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // === Body rivets ===
    ctx.fillStyle = C.goldLit
    for (let i = 0; i < 3; i++) {
      const ry = -h / 4 + i * (h / 4)
      this.drawRivet(ctx, -w / 4, ry)
      this.drawRivet(ctx, w / 4, ry)
    }

    // === Shield ring (if active) ===
    if (player.shieldActive) {
      ctx.strokeStyle = C.shieldLit
      ctx.lineWidth = 3
      ctx.globalAlpha = ctx.globalAlpha * (0.5 + 0.3 * Math.sin(time * 4))
      ctx.beginPath()
      ctx.arc(0, 0, player.radius + 8, 0, Math.PI * 2)
      ctx.stroke()
      // Shield glow
      ctx.shadowColor = C.shieldLit
      ctx.shadowBlur = 15
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    ctx.restore()
  }

  private drawExhaust(ctx: CanvasRenderingContext2D, cx: number, cy: number, time: number): void {
    const flicker = Math.sin(time * 20) * 0.3 + 0.7
    ctx.fillStyle = C.fire
    ctx.globalAlpha = flicker
    ctx.beginPath()
    ctx.moveTo(cx - 4, cy)
    ctx.lineTo(cx, cy + 8 + Math.random() * 4)
    ctx.lineTo(cx + 4, cy)
    ctx.closePath()
    ctx.fill()
    ctx.globalAlpha = 1

    // Inner brighter flame
    ctx.fillStyle = C.fireLit
    ctx.beginPath()
    ctx.moveTo(cx - 2, cy)
    ctx.lineTo(cx, cy + 4 + Math.random() * 2)
    ctx.lineTo(cx + 2, cy)
    ctx.closePath()
    ctx.fill()
  }

  private drawPropeller(ctx: CanvasRenderingContext2D, cx: number, cy: number, time: number): void {
    // Hub
    ctx.fillStyle = C.gold
    ctx.strokeStyle = C.goldDark
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Spinning blades
    ctx.fillStyle = C.brassLit
    const spin = time * 15
    for (let i = 0; i < 4; i++) {
      const angle = spin + (i * Math.PI) / 2
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(angle)
      ctx.beginPath()
      ctx.ellipse(8, 0, 8, 2.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = C.brassDark
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.restore()
    }
  }

  // === Enemy Drawings ===
  drawEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyState, time: number): void {
    ctx.save()
    ctx.translate(enemy.x, enemy.y)
    ctx.scale(enemy.scaleX, enemy.scaleY)

    switch (enemy.enemyType) {
      case EnemyType.Normal: this.drawNormalEnemy(ctx, enemy, time); break
      case EnemyType.Fast: this.drawFastEnemy(ctx, enemy, time); break
      case EnemyType.Large: this.drawLargeEnemy(ctx, enemy, time); break
    }

    ctx.restore()
  }

  private drawNormalEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyState, _time: number): void {
    const w = enemy.width
    const h = enemy.height

    // Body
    ctx.fillStyle = C.darkIron
    ctx.strokeStyle = C.danger
    ctx.lineWidth = 2
    this.roundedRect(ctx, -w / 2, -h / 2 + 6, w, h - 12, 8)
    ctx.fill()
    ctx.stroke()

    // Jagged wings (zigzag)
    ctx.fillStyle = C.copperDark
    ctx.strokeStyle = C.danger
    ctx.lineWidth = 1.5
    // Left
    ctx.beginPath()
    ctx.moveTo(-w / 2 + 2, -h / 6)
    ctx.lineTo(-w / 2 - 10, h / 8)
    ctx.lineTo(-w / 2 + 2, h / 3)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    // Right
    ctx.beginPath()
    ctx.moveTo(w / 2 - 2, -h / 6)
    ctx.lineTo(w / 2 + 10, h / 8)
    ctx.lineTo(w / 2 - 2, h / 3)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Red "eye" cockpit
    ctx.fillStyle = C.danger
    ctx.beginPath()
    ctx.ellipse(0, -h / 10, 5, 7, 0, 0, Math.PI * 2)
    ctx.fill()
    // Inner glow
    const eyeGrad = ctx.createRadialGradient(0, -h / 10, 1, 0, -h / 10, 5)
    eyeGrad.addColorStop(0, '#ff6666')
    eyeGrad.addColorStop(1, C.danger)
    ctx.fillStyle = eyeGrad
    ctx.fill()
  }

  private drawFastEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyState, _time: number): void {
    const w = enemy.width
    const h = enemy.height

    // Streamlined dart body
    ctx.fillStyle = C.darkIron
    ctx.strokeStyle = C.danger
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, -h / 2)           // nose
    ctx.lineTo(w / 2, h / 4)        // right body
    ctx.lineTo(w / 4, h / 2)        // right tail
    ctx.lineTo(-w / 4, h / 2)       // left tail
    ctx.lineTo(-w / 2, h / 4)       // left body
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Sharp triangular wings
    ctx.fillStyle = C.copperDark
    ctx.strokeStyle = C.fire
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(-w / 3, 0)
    ctx.lineTo(-w / 2 - 8, h / 3)
    ctx.lineTo(-w / 6, h / 3)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(w / 3, 0)
    ctx.lineTo(w / 2 + 8, h / 3)
    ctx.lineTo(w / 6, h / 3)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Red stripe
    ctx.strokeStyle = C.danger
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, -h / 6)
    ctx.lineTo(0, h / 6)
    ctx.stroke()
  }

  private drawLargeEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyState, _time: number): void {
    const w = enemy.width
    const h = enemy.height

    // Large body
    ctx.fillStyle = C.darkIron
    ctx.strokeStyle = C.copper
    ctx.lineWidth = 3
    this.roundedRect(ctx, -w / 2, -h / 2 + 4, w, h - 8, 14)
    ctx.fill()
    ctx.stroke()

    // Copper bands
    ctx.strokeStyle = C.copperLit
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(-w / 2 + 6, -h / 6)
    ctx.lineTo(w / 2 - 6, -h / 6)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-w / 2 + 6, h / 6)
    ctx.lineTo(w / 2 - 6, h / 6)
    ctx.stroke()

    // Twin engine nacelles on wings
    this.drawEngineNacelle(ctx, -w / 2 - 6, h / 5, 8, 14)
    this.drawEngineNacelle(ctx, w / 2 + 6, h / 5, 8, 14)

    // Wide wings
    ctx.fillStyle = C.copper
    ctx.strokeStyle = C.brassLit
    ctx.lineWidth = 2
    // Left
    ctx.beginPath()
    ctx.moveTo(-w / 2 + 6, -h / 8)
    ctx.lineTo(-w / 2 - 22, h / 5)
    ctx.lineTo(-w / 2, h / 4)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    // Right
    ctx.beginPath()
    ctx.moveTo(w / 2 - 6, -h / 8)
    ctx.lineTo(w / 2 + 22, h / 5)
    ctx.lineTo(w / 2, h / 4)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Cockpit (larger)
    const cGrad = ctx.createRadialGradient(0, -h / 6, 2, 0, -h / 6, 12)
    cGrad.addColorStop(0, C.goldLit)
    cGrad.addColorStop(1, C.goldDark)
    ctx.fillStyle = cGrad
    ctx.beginPath()
    ctx.ellipse(0, -h / 10, 10, 12, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = C.brass
    ctx.lineWidth = 2
    ctx.stroke()

    // Rivets
    ctx.fillStyle = C.goldLit
    for (let i = 0; i < 4; i++) {
      const ry = -h / 4 + i * (h / 5)
      this.drawRivet(ctx, -w / 4, ry)
      this.drawRivet(ctx, w / 4, ry)
    }
  }

  private drawEngineNacelle(ctx: CanvasRenderingContext2D, cx: number, cy: number, rw: number, rh: number): void {
    ctx.fillStyle = C.darkIronLit
    ctx.strokeStyle = C.brass
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    // Propeller disc
    ctx.fillStyle = C.brassLit
    ctx.beginPath()
    ctx.arc(cx, cy - rh + 2, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  // === Boss Airship Drawing ===
  drawBoss(ctx: CanvasRenderingContext2D, boss: BossState, time: number): void {
    ctx.save()
    ctx.translate(boss.x, boss.y)
    ctx.scale(boss.scaleX, boss.scaleY)

    const w = boss.width
    const h = boss.height

    // Main hull (ellipse)
    const hullGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2)
    hullGrad.addColorStop(0, C.darkIronLit)
    hullGrad.addColorStop(0.5, C.darkIron)
    hullGrad.addColorStop(1, C.darkIronLit)
    ctx.fillStyle = hullGrad
    ctx.strokeStyle = C.brass
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Copper banding
    ctx.strokeStyle = C.copperLit
    ctx.lineWidth = 3
    for (let i = -1; i <= 1; i++) {
      const by = i * h / 6
      ctx.beginPath()
      const halfW = Math.sqrt((1 - (by * by) / ((h / 2) * (h / 2))) * ((w / 2) * (w / 2)))
      ctx.moveTo(-halfW, by)
      ctx.lineTo(halfW, by)
      ctx.stroke()
    }

    // Gondola below
    ctx.fillStyle = C.brown
    ctx.strokeStyle = C.copper
    ctx.lineWidth = 2.5
    this.roundedRect(ctx, -w / 5, h / 2 + 2, w * 0.4, h * 0.35, 8)
    ctx.fill()
    ctx.stroke()

    // Turret on gondola (rotates toward player)
    ctx.fillStyle = C.darkIron
    ctx.strokeStyle = C.brass
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, h / 2 + 6, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    // Barrel
    ctx.strokeStyle = C.copperLit
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, h / 2 + 6)
    ctx.lineTo(0, h / 2 + 18)
    ctx.stroke()

    // Propellers on sides
    for (let side = -1; side <= 1; side += 2) {
      const px = side * (w / 2 + 6)
      const py = 0
      this.drawPropeller(ctx, px, py, time)
      // Engine housing
      ctx.fillStyle = C.darkIronLit
      ctx.strokeStyle = C.brass
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.ellipse(px, py, 6, 10, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }

    // Windows (portholes along hull)
    const windowCount = 6
    for (let i = 0; i < windowCount; i++) {
      const wx = -w / 3 + (i / (windowCount - 1)) * (w * 2 / 3)
      const wy = -h / 8
      const winGrad = ctx.createRadialGradient(wx, wy, 1, wx, wy, 5)
      winGrad.addColorStop(0, C.goldLit)
      winGrad.addColorStop(0.5, C.gold)
      winGrad.addColorStop(1, C.goldDark)
      ctx.fillStyle = winGrad
      ctx.strokeStyle = C.brassLit
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(wx, wy, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }

    // Damage effects (phase 2+)
    if (boss.damaged) {
      ctx.strokeStyle = C.fire
      ctx.lineWidth = 1.5
      // Crack lines
      for (let i = 0; i < 3; i++) {
        const cx = -w / 4 + Math.random() * (w / 2)
        const cy = -h / 4 + Math.random() * (h / 2)
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + (Math.random() - 0.5) * 20, cy + (Math.random() - 0.5) * 20)
        ctx.lineTo(cx + (Math.random() - 0.5) * 30, cy + (Math.random() - 0.5) * 30)
        ctx.stroke()
      }

      // Red flash (pulsing)
      const flashAlpha = 0.1 + 0.1 * Math.sin(time * 8)
      ctx.fillStyle = C.danger
      ctx.globalAlpha = flashAlpha
      ctx.beginPath()
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    ctx.restore()
  }

  // === Bullet Drawings ===
  drawBullet(ctx: CanvasRenderingContext2D, bullet: Bullet): void {
    ctx.save()
    ctx.translate(bullet.x, bullet.y)

    if (bullet.owner === 'player') {
      // Player bullet: gold diamond shape
      ctx.fillStyle = C.goldLit
      ctx.strokeStyle = C.goldDark
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, -7)
      ctx.lineTo(3, 0)
      ctx.lineTo(0, 7)
      ctx.lineTo(-3, 0)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      // Glow
      ctx.shadowColor = C.goldLit
      ctx.shadowBlur = 6
      ctx.fill()
      ctx.shadowBlur = 0
    } else if (bullet.bulletType === 'boss') {
      // Boss bullet: larger teardrop
      ctx.fillStyle = C.danger
      ctx.strokeStyle = '#ff4444'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(0, 2, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      // Glowing center
      ctx.fillStyle = C.fireLit
      ctx.beginPath()
      ctx.arc(0, 2, 2, 0, Math.PI * 2)
      ctx.fill()
    } else {
      // Enemy bullet: red circle with glow
      ctx.fillStyle = C.danger
      ctx.beginPath()
      ctx.arc(0, 0, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowColor = C.fire
      ctx.shadowBlur = 5
      ctx.fill()
      ctx.shadowBlur = 0
    }

    ctx.restore()
  }

  // === Power-Up Drawings ===
  drawPowerUp(ctx: CanvasRenderingContext2D, powerUp: PowerUpState): void {
    ctx.save()
    ctx.translate(powerUp.x, powerUp.y)

    const pulse = 1 + Math.sin(powerUp.pulseTimer) * 0.15
    ctx.scale(pulse, pulse)

    const r = powerUp.radius

    // Background circle
    let bgColor: string
    let iconColor: string
    switch (powerUp.powerUpType) {
      case PowerUpType.FireBoost:
        bgColor = C.fire
        iconColor = C.fireLit
        break
      case PowerUpType.Shield:
        bgColor = C.shield
        iconColor = C.shieldLit
        break
      case PowerUpType.Heal:
        bgColor = C.heal
        iconColor = C.healLit
        break
    }

    // Outer ring
    ctx.fillStyle = C.darkIron
    ctx.strokeStyle = bgColor
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Inner filled circle
    ctx.fillStyle = bgColor
    ctx.beginPath()
    ctx.arc(0, 0, r - 4, 0, Math.PI * 2)
    ctx.fill()

    // Icon
    ctx.fillStyle = iconColor
    ctx.strokeStyle = C.darkIron
    ctx.lineWidth = 1.5
    switch (powerUp.powerUpType) {
      case PowerUpType.FireBoost:
        // Gear icon
        this.drawGearIcon(ctx, 0, 0, 6, 5)
        break
      case PowerUpType.Shield:
        // Hexagon
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 6
          const px = Math.cos(a) * 6
          const py = Math.sin(a) * 6
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        break
      case PowerUpType.Heal:
        // Cross
        ctx.fillRect(-1.5, -5, 3, 10)
        ctx.fillRect(-5, -1.5, 10, 3)
        break
    }

    // Glow
    ctx.shadowColor = bgColor
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowBlur = 0

    ctx.restore()
  }

  private drawGearIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, teeth: number): void {
    ctx.beginPath()
    const step = (Math.PI * 2) / teeth
    for (let i = 0; i < teeth; i++) {
      const a1 = i * step
      const a2 = a1 + step * 0.5
      const a3 = a1 + step
      const outerR = radius
      const innerR = radius * 0.6
      ctx.lineTo(cx + Math.cos(a1) * outerR, cy + Math.sin(a1) * outerR)
      ctx.lineTo(cx + Math.cos(a2) * innerR, cy + Math.sin(a2) * innerR)
      ctx.lineTo(cx + Math.cos(a3) * outerR, cy + Math.sin(a3) * outerR)
    }
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, cy, radius * 0.25, 0, Math.PI * 2)
    ctx.fill()
  }

  // === Particle Drawing ===
  drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
    ctx.save()
    ctx.globalAlpha = p.alpha
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // === Boss Warning Text ===
  drawBossWarning(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, warningTimer: number): void {
    const alpha = Math.abs(Math.sin(warningTimer * 6))
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.font = 'bold 48px "Fredoka One", cursive'
    ctx.fillStyle = C.danger
    ctx.textAlign = 'center'
    ctx.shadowColor = C.danger
    ctx.shadowBlur = 20
    ctx.fillText('⚠ WARNING ⚠', canvasWidth / 2, canvasHeight / 2 - 40)
    ctx.font = '20px "Nunito", sans-serif'
    ctx.fillStyle = C.textWarm
    ctx.fillText('BOSS APPROACHING', canvasWidth / 2, canvasHeight / 2 + 10)
    ctx.shadowBlur = 0
    ctx.restore()
  }

  // === Boss Victory Text ===
  drawBossDefeatText(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, timer: number): void {
    if (timer <= 0) return
    const alpha = Math.min(1, timer / 0.5)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.font = 'bold 36px "Fredoka One", cursive'
    ctx.fillStyle = C.goldLit
    ctx.textAlign = 'center'
    ctx.shadowColor = C.gold
    ctx.shadowBlur = 15
    ctx.fillText('BOSS DEFEATED!', canvasWidth / 2, canvasHeight / 2)
    ctx.shadowBlur = 0
    ctx.restore()
  }

  // === Damage Vignette (red flash on hit) ===
  drawDamageVignette(canvasWidth: number, canvasHeight: number, intensity: number): void {
    const ctx = this.ctx
    ctx.save()
    // Red radial gradient from edges inward
    const grad = ctx.createRadialGradient(
      canvasWidth / 2, canvasHeight / 2, canvasHeight * 0.3,
      canvasWidth / 2, canvasHeight / 2, canvasHeight * 0.9
    )
    grad.addColorStop(0, 'rgba(192, 57, 43, 0)')
    grad.addColorStop(0.5, 'rgba(200, 40, 30, 0.1)')
    grad.addColorStop(1, `rgba(180, 30, 20, ${0.35 * intensity})`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    ctx.restore()
  }

  // === Helpers ===
  private roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.arcTo(x + w, y, x + w, y + r, r)
    ctx.lineTo(x + w, y + h - r)
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
    ctx.lineTo(x + r, y + h)
    ctx.arcTo(x, y + h, x, y + h - r, r)
    ctx.lineTo(x, y + r)
    ctx.arcTo(x, y, x + r, y, r)
    ctx.closePath()
  }

  private drawRivet(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.beginPath()
    ctx.arc(x, y, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawMiniGear(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, rotation: number): void {
    // Used for background -- simple gear shape
    ctx.fillStyle = C.brass
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  // === Frame Counter ===
  tick(): void {
    this.frameCount++
  }
}
