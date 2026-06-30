export class InputManager {
  private keys: Set<string> = new Set()

  // Touch state
  private _touchX: number = 0
  private _touchY: number = 0
  private _isTouching: boolean = false

  get touchX(): number { return this._touchX }
  get touchY(): number { return this._touchY }
  get isTouching(): boolean { return this._isTouching }

  private canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)

    // Touch events on canvas
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
    this._touchX = pos.x
    this._touchY = pos.y
    this._isTouching = true
  }

  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    const pos = this.getCanvasPos(e.touches[0])
    this._touchX = pos.x
    this._touchY = pos.y
  }

  private onTouchEnd = () => {
    this._isTouching = false
  }
}
