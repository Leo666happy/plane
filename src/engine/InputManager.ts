export class InputManager {
  private keys: Set<string> = new Set()

  constructor() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  isPressed(key: string): boolean {
    return this.keys.has(key)
  }

  isAnyPressed(...keys: string[]): boolean {
    return keys.some(k => this.keys.has(k))
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    this.keys.clear()
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
}
