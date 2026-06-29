<template>
  <canvas ref="canvasRef" class="game-canvas"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { GameEngine } from '../engine/GameEngine'
import { useGameBridge } from '../composables/useGameBridge'

const emit = defineEmits<{
  'update:score': [score: number]
  'update:hp': [hp: number, maxHp: number]
  'powerup-collected': [type: string]
  'powerup-expired': [type: string]
  'boss-appear': [hp: number, maxHp: number]
  'boss-hp-change': [hp: number, maxHp: number]
  'boss-defeat': []
  'phase-change': [phase: string]
  'game-over': [finalScore: number]
  'player-damaged': []
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let engine: GameEngine | null = null

const bridge = useGameBridge()

// Wire bridge callbacks to component emits
bridge.callbacks.onScoreChange = (score: number) => {
  emit('update:score', score)
}
bridge.callbacks.onHpChange = (hp: number, maxHp: number) => {
  emit('update:hp', hp, maxHp)
}
bridge.callbacks.onPowerUpCollected = (type: string) => {
  emit('powerup-collected', type)
}
bridge.callbacks.onPowerUpExpired = (type: string) => {
  emit('powerup-expired', type)
}
bridge.callbacks.onBossAppear = (hp: number, maxHp: number) => {
  emit('boss-appear', hp, maxHp)
}
bridge.callbacks.onBossHpChange = (hp: number, maxHp: number) => {
  emit('boss-hp-change', hp, maxHp)
}
bridge.callbacks.onBossDefeat = () => {
  emit('boss-defeat')
}
bridge.callbacks.onPhaseChange = (phase: string) => {
  emit('phase-change', phase)
}
bridge.callbacks.onGameOver = (finalScore: number) => {
  emit('game-over', finalScore)
}
bridge.callbacks.onPlayerDamaged = () => {
  emit('player-damaged')
}

function getTargetSize(): { w: number; h: number } {
  // The game area is 9:16, constrained within the viewport
  const vw = window.innerWidth
  const vh = window.innerHeight
  const gameW = Math.min(vw, (vh * 9) / 16)
  return { w: gameW, h: vh }
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  const { w, h } = getTargetSize()
  engine = new GameEngine(canvas, bridge.callbacks, w, h)

  // Resize handler — use game area dimensions
  const onResize = () => {
    const { w: nw, h: nh } = getTargetSize()
    engine?.resize(nw, nh)
  }
  window.addEventListener('resize', onResize)

  // Store cleanup refs on element
  ;(canvas as any).__cleanup = () => {
    window.removeEventListener('resize', onResize)
  }
})

onUnmounted(() => {
  engine?.dispose()
  engine = null
  const canvas = canvasRef.value
  if (canvas && (canvas as any).__cleanup) {
    ;(canvas as any).__cleanup()
  }
})
</script>

<style scoped>
.game-canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}
</style>
