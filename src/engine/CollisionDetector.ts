import type { Circle } from './types'

const CELL_SIZE = 100

export class CollisionDetector {
  private grid: Map<string, Circle[]> = new Map()

  clear(): void {
    this.grid.clear()
  }

  insert(entity: Circle): void {
    const cells = this.getCells(entity)
    for (const key of cells) {
      let list = this.grid.get(key)
      if (!list) {
        list = []
        this.grid.set(key, list)
      }
      list.push(entity)
    }
  }

  query(entity: Circle): Circle[] {
    const cells = this.getCells(entity)
    const result: Circle[] = []
    const seen = new Set<Circle>()
    for (const key of cells) {
      const list = this.grid.get(key)
      if (!list) continue
      for (const other of list) {
        if (other !== entity && !seen.has(other)) {
          seen.add(other)
          result.push(other)
        }
      }
    }
    return result
  }

  private getCells(entity: Circle): string[] {
    const minX = Math.floor((entity.x - entity.radius) / CELL_SIZE)
    const maxX = Math.floor((entity.x + entity.radius) / CELL_SIZE)
    const minY = Math.floor((entity.y - entity.radius) / CELL_SIZE)
    const maxY = Math.floor((entity.y + entity.radius) / CELL_SIZE)

    const keys: string[] = []
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        keys.push(`${cx},${cy}`)
      }
    }
    return keys
  }
}

export function circleCollision(a: Circle, b: Circle): boolean {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const minDist = a.radius + b.radius
  return dx * dx + dy * dy < minDist * minDist
}
