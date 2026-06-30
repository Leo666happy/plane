export class InputManager {
  private keys: Set<string> = new Set()

  // Touch state — relative delta mode (virtual trackpad)
  private _touchDeltaX: number = 0
  private _touchDeltaY: number = 0
  private _isTouching: boolean = false
  private _lastTouchX: number = 0
  private _lastTouchY: number = 0
  private _touchJustStarted: boolean = false

  get touchDeltaX(): number { return this._touchDeltaX }
  get touchDeltaY(): number { return this._touchDeltaY }
  get isTouching(): boolean { return this._isTouching }

  private canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)

    canvas.addEventListener('touchstart', this.onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', this.onTouchMove, { passive: false })
    canvas.addEventListener('touchend', this.onTouchEnd)
    canvas.addEventListener('touchcancel', this.onTouchEnd)
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    this.canvas.removeEventListener('touchstart', this.onTouchStart)
    this.canvas.removeEventListener('touchmove', this.onTouchMove)
    this.canvas.removeEventListener('touchend', this.onTouchEnd)
    this.canvas.removeEventListener('touchcancel', this.onTouchEnd)
    this.keys.clear()
  }

  isPressed(key: string): boolean {
    return this.keys.has(key)
  }

  isAnyPressed(...keys: string[]): boolean {
    return keys.some(k => this.keys.has(k))
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.key)
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault()
    }
  }

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key)
  }

  private getCanvasPos(touch: Touch): { x: number; y: number } {
    const rect = (touch.target as HTMLElement).getBoundingClientRect()
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    }
  }

  private onTouchStart = (e: TouchEvent) => {
    e.preventDefault()
    const pos = this.getCanvasPos(e.touches[0])
    this._lastTouchX = pos.x
    this._lastTouchY = pos.y
    this._touchDeltaX = 0
    this._touchDeltaY = 0
    this._touchJustStarted = true
    this._isTouching = true
  }

  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    const pos = this.getCanvasPos(e.touches[0])
    // Accumulate deltas (sum since last frame, consumed in updateTouchDelta)
    this._touchDeltaX += pos.x - this._lastTouchX
    this._touchDeltaY += pos.y - this._lastTouchY
    this._lastTouchX = pos.x
    this._lastTouchY = pos.y
  }

  private onTouchEnd = () => {
    this._isTouching = false
  }

  // Called each frame — returns delta since last frame, resets accumulator
  updateTouchDelta(): void {
    // On the first frame after touchstart, discard accumulated delta
    // (there is none anyway, prevents a jump)
    if (this._touchJustStarted) {
      this._touchDeltaX = 0
      this._touchDeltaY = 0
      this._touchJustStarted = false
    }
    // Delta is consumed by Player.ts each frame, no need to reset here
    // because onTouchMove accumulates into it
  }

  // Called by Player.ts after reading deltas — clear for next frame
  consumeTouchDelta(): { dx: number; dy: number } {
    const dx = this._touchDeltaX
    const dy = this._touchDeltaY
    // Apply EMA smoothing on the deltas themselves to kill jitter
    this._touchDeltaX = 0
    this._touchDeltaY = 0
    return { dx, dy }
  }
}
