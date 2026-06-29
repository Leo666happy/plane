export class BackgroundManager {
  private canvasWidth: number
  private canvasHeight: number
  private gears: Gear[]
  private clouds: Cloud[]
  private sparkles: Sparkle[]

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.gears = []
    this.clouds = []
    this.sparkles = []
    this.generate(canvasWidth, canvasHeight)
  }

  private generate(w: number, h: number): void {
    // Layer 1: Gear silhouettes (far, slow)
    this.gears = []
    for (let i = 0; i < 8; i++) {
      this.gears.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: 40 + Math.random() * 80,
        rotation: Math.random() * Math.PI * 2,
        speed: 10 + Math.random() * 20,
        opacity: 0.04 + Math.random() * 0.06,
        teeth: 6 + Math.floor(Math.random() * 6),
      })
    }

    // Layer 2: Clouds (mid)
    this.clouds = []
    for (let i = 0; i < 6; i++) {
      this.clouds.push({
        x: Math.random() * w,
        y: Math.random() * h,
        width: 80 + Math.random() * 160,
        height: 20 + Math.random() * 30,
        speed: 30 + Math.random() * 30,
        opacity: 0.08 + Math.random() * 0.1,
      })
    }

    // Layer 3: Small sparkles/gears (near, fast)
    this.sparkles = []
    for (let i = 0; i < 15; i++) {
      this.sparkles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 2 + Math.random() * 4,
        speed: 60 + Math.random() * 40,
        opacity: 0.1 + Math.random() * 0.2,
      })
    }
  }

  update(dt: number): void {
    // Layer 1
    for (const g of this.gears) {
      g.y += g.speed * dt
      g.rotation += 0.3 * dt
      if (g.y > this.canvasHeight + 100) {
        g.y = -100
        g.x = Math.random() * this.canvasWidth
      }
    }

    // Layer 2
    for (const c of this.clouds) {
      c.y += c.speed * dt
      if (c.y > this.canvasHeight + 100) {
        c.y = -100
        c.x = Math.random() * this.canvasWidth
      }
    }

    // Layer 3
    for (const s of this.sparkles) {
      s.y += s.speed * dt
      if (s.y > this.canvasHeight + 20) {
        s.y = -20
        s.x = Math.random() * this.canvasWidth
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, this.canvasHeight)
    grad.addColorStop(0, '#1a1410')
    grad.addColorStop(0.5, '#2a1f14')
    grad.addColorStop(1, '#1a1410')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)

    // Layer 1: Gear silhouettes
    for (const g of this.gears) {
      ctx.save()
      ctx.globalAlpha = g.opacity
      this.drawGearSilhouette(ctx, g.x, g.y, g.radius, g.teeth, g.rotation)
      ctx.restore()
    }

    // Layer 2: Clouds
    for (const c of this.clouds) {
      ctx.save()
      ctx.globalAlpha = c.opacity
      this.drawCloud(ctx, c.x, c.y, c.width, c.height)
      ctx.restore()
    }

    // Layer 3: Sparkles
    for (const s of this.sparkles) {
      ctx.save()
      ctx.globalAlpha = s.opacity
      ctx.fillStyle = '#daa520'
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  private drawGearSilhouette(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, teeth: number, rotation: number): void {
    ctx.fillStyle = '#b5a642'
    ctx.strokeStyle = '#b5a642'
    ctx.lineWidth = 2
    ctx.beginPath()
    const step = (Math.PI * 2) / teeth
    for (let i = 0; i < teeth; i++) {
      const a1 = rotation + i * step
      const a2 = a1 + step * 0.5
      const a3 = a1 + step
      const outerR = radius
      const innerR = radius * 0.65
      ctx.lineTo(cx + Math.cos(a1) * outerR, cy + Math.sin(a1) * outerR)
      ctx.lineTo(cx + Math.cos(a2) * innerR, cy + Math.sin(a2) * innerR)
      ctx.lineTo(cx + Math.cos(a3) * outerR, cy + Math.sin(a3) * outerR)
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    // Inner circle
    ctx.beginPath()
    ctx.arc(cx, cy, radius * 0.3, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillStyle = '#3a2a1a'
    ctx.beginPath()
    ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(x - w * 0.25, y + h * 0.1, w * 0.3, h * 0.4, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(x + w * 0.3, y - h * 0.1, w * 0.25, h * 0.35, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  resize(w: number, h: number): void {
    this.canvasWidth = w
    this.canvasHeight = h
    this.generate(w, h)
  }
}

interface Gear {
  x: number; y: number; radius: number; rotation: number;
  speed: number; opacity: number; teeth: number;
}

interface Cloud {
  x: number; y: number; width: number; height: number;
  speed: number; opacity: number;
}

interface Sparkle {
  x: number; y: number; size: number; speed: number; opacity: number;
}
