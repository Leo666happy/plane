<template>
  <div class="game-wrapper">
    <div class="game-area">
      <StartScreen
        v-if="screen === 'start'"
        @start="onStart"
      />
      <template v-if="screen === 'playing' || screen === 'gameover'">
        <GameCanvas
          ref="gameCanvasRef"
          :key="gameKey"
          @update:score="onScoreUpdate"
          @update:hp="onHpUpdate"
          @powerup-collected="onPowerUpCollected"
          @powerup-expired="onPowerUpExpired"
          @boss-appehar="onBossAppear"
          @boss-hp-change="onBossHpChange"
          @boss-defeat="onBossDefeat"
          @phase-change="onPhaseChange"
          @game-over="onGameOver"
          @player-damaged="onPlayerDamaged"
        />
        <GameHUD
          :score="score"
          :highScore="highScore"
          :hp="hp"
          :maxHp="maxHp"
          :activePowerUps="activePowerUps"
          :bossHp="bossHp"
          :bossMaxHp="bossMaxHp"
          :gamePhase="gamePhase"
          :isDamaged="isDamaged"
        />
      </template>
      <GameOverScreen
        v-if="screen === 'gameover'"
        :finalScore="finalScore"
        :highScore="highScore"
        @restart="onRestart"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import StartScreen from './StartScreen.vue'
import GameCanvas from './GameCanvas.vue'
import GameHUD from './GameHUD.vue'
import GameOverScreen from './GameOverScreen.vue'

type Screen = 'start' | 'playing' | 'gameover'

const screen = ref<Screen>('start')
const gameKey = ref(0)

// HUD state
const score = ref(0)
const hp = ref(100)
const maxHp = ref(100)
const activePowerUps = ref<string[]>([])
const bossHp = ref<number | null>(null)
const bossMaxHp = ref<number | null>(null)
const gamePhase = ref<string>('normal')
const finalScore = ref(0)
const highScore = ref(0)
const isDamaged = ref(false)
let damagedTimer: ReturnType<typeof setTimeout> | null = null

// Load high score from localStorage
const saved = localStorage.getItem('plane-battle-high-score')
if (saved) {
  highScore.value = parseInt(saved, 10)
}

function resetState() {
  score.value = 0
  hp.value = 100
  maxHp.value = 100
  activePowerUps.value = []
  bossHp.value = null
  bossMaxHp.value = null
  gamePhase.value = 'normal'
  finalScore.value = 0
  isDamaged.value = false
  if (damagedTimer) {
    clearTimeout(damagedTimer)
    damagedTimer = null
  }
}

function onStart() {
  resetState()
  screen.value = 'playing'
}

function onScoreUpdate(s: number) {
  score.value = s
}

function onHpUpdate(h: number, mh: number) {
  hp.value = h
  maxHp.value = mh
}

function onPowerUpCollected(type: string) {
  if (type === 'heal') return // instant effect, no icon
  activePowerUps.value = [...activePowerUps.value, type]
}

function onPowerUpExpired(type: string) {
  activePowerUps.value = activePowerUps.value.filter(t => t !== type)
}

function onBossAppear() {}

function onBossHpChange(h: number, mh: number) {
  bossHp.value = h
  bossMaxHp.value = mh
}

function onBossDefeat() {
  bossHp.value = null
  bossMaxHp.value = null
}

function onPhaseChange(phase: string) {
  gamePhase.value = phase
}

function onPlayerDamaged() {
  isDamaged.value = true
  if (damagedTimer) clearTimeout(damagedTimer)
  damagedTimer = setTimeout(() => {
    isDamaged.value = false
  }, 200)
}

function onGameOver(final: number) {
  finalScore.value = final
  if (final > highScore.value) {
    highScore.value = final
    localStorage.setItem('plane-battle-high-score', String(final))
  }
  screen.value = 'gameover'
}

function onRestart() {
  resetState()
  gameKey.value++
  nextTick(() => {
    screen.value = 'playing'
  })
}
</script>

<style scoped>
.game-wrapper {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #0d0a06;
}

.game-area {
  position: relative;
  /* 9:16 aspect ratio — height fills screen, width calculated */
  width: min(100vw, calc(100vh * 9 / 16));
  height: 100vh;
  overflow: hidden;
  background: var(--bg-warm);
  box-shadow:
    0 0 40px rgba(0,0,0,0.6),
    0 0 0 3px var(--dark-iron),
    0 0 0 6px var(--brass-dark);
}

</style>
