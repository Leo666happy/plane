<template>
  <div class="game-hud" v-if="visible" :class="{ 'is-damaged': isDamaged }">
    <!-- Top bar: Score left, Power-ups right -->
    <div class="hud-top-row">
      <div class="hud-score-block">
        <div class="hud-score">
          <span class="score-icon">⚙</span>
          <span class="score-text">{{ score.toLocaleString() }}</span>
        </div>
        <div class="hud-high-score">
          <span class="high-label">最高</span>
          <span class="high-text">{{ highScore.toLocaleString() }}</span>
        </div>
      </div>

      <div class="hud-powerups">
        <div
          v-for="pu in activePowerUps"
          :key="pu"
          class="powerup-icon"
          :class="pu"
          :title="powerUpLabel(pu)"
        >
          <span v-if="pu === 'fireBoost'">⚙</span>
          <span v-else-if="pu === 'shield'">⬡</span>
          <span v-else-if="pu === 'heal'">✚</span>
        </div>
      </div>
    </div>

    <!-- HP bar row (below score) -->
    <div class="hud-hp-row">
      <div class="hud-hp">
        <span class="hp-label">HP</span>
        <div class="hp-bar-container">
          <div class="hp-bar-fill" :style="{ width: hpPercent + '%' }" :class="hpClass"></div>
        </div>
        <span class="hp-text">{{ hp }} / {{ maxHp }}</span>
      </div>
    </div>

    <!-- Boss HP Bar (below HP bar) -->
    <div v-if="bossHp !== null" class="hud-boss">
      <span class="boss-label">⚠ BOSS</span>
      <div class="boss-bar-container">
        <div
          class="boss-bar-fill"
          :style="{ width: bossHpPercent + '%' }"
          :class="{ danger: (bossHp ?? 0) / (bossMaxHp ?? 1) < 0.3 }"
        ></div>
      </div>
      <span class="boss-phase" v-if="bossPhaseText">{{ bossPhaseText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  score: number
  highScore: number
  hp: number
  maxHp: number
  activePowerUps: string[]
  bossHp: number | null
  bossMaxHp: number | null
  gamePhase: string
  isDamaged?: boolean
}>()

const visible = computed(() => props.gamePhase !== 'start')

const hpPercent = computed(() => {
  return Math.max(0, Math.min(100, (props.hp / props.maxHp) * 100))
})

const hpClass = computed(() => {
  if (props.hp <= 30) return 'danger'
  if (props.hp <= 60) return 'warning'
  return 'healthy'
})

const bossHpPercent = computed(() => {
  if (props.bossHp === null || props.bossMaxHp === null || props.bossMaxHp === 0) return 0
  return Math.max(0, Math.min(100, (props.bossHp / props.bossMaxHp) * 100))
})

const bossPhaseText = computed(() => {
  if (props.bossHp === null || props.bossMaxHp === null) return ''
  const pct = props.bossHp / props.bossMaxHp
  if (pct > 0.6) return ''
  if (pct > 0.3) return 'Phase 2'
  return 'Phase 3 · DANGER'
})

function powerUpLabel(type: string): string {
  switch (type) {
    case 'fireBoost': return '火力加强'
    case 'shield': return '护盾'
    case 'heal': return '回血'
    default: return type
  }
}
</script>

<style scoped>
.game-hud {
  position: absolute;
  inset: 0;
  top: 0;
  pointer-events: none;
  z-index: 5;
  font-family: var(--font-body);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 12px;
  gap: 2px;
}

.game-hud.is-damaged {
  animation: hudShake 0.2s ease-out;
}

@keyframes hudShake {
  0% { transform: translateX(0); }
  15% { transform: translateX(-6px) translateY(3px); }
  30% { transform: translateX(5px) translateY(-2px); }
  50% { transform: translateX(-3px) translateY(1px); }
  70% { transform: translateX(2px); }
  100% { transform: translateX(0) translateY(0); }
}

/* === Top row: score + power-ups === */
.hud-top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}

/* === Score block (score + high score) === */
.hud-score-block {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* === Score === */
.hud-score {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(26, 20, 16, 0.7);
  border: 2px solid var(--brass-dark);
  border-radius: 8px;
  padding: 3px 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
}

/* === High score === */
.hud-high-score {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 4px;
}

.high-label {
  font-family: var(--font-body);
  font-size: 0.65rem;
  color: var(--text-warm-dim);
  letter-spacing: 1px;
}

.high-text {
  font-family: var(--font-title);
  font-size: 0.75rem;
  color: var(--brass-lit);
  text-shadow: 0 0 4px rgba(181, 166, 66, 0.3);
}

.score-icon {
  font-size: 1rem;
  color: var(--brass-lit);
  animation: gearSpin 4s linear infinite;
}

@keyframes gearSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.score-text {
  font-family: var(--font-title);
  font-size: 1rem;
  color: var(--gold-lit);
  text-shadow: 0 0 6px rgba(218, 165, 32, 0.3);
}

/* === Power-ups === */
.hud-powerups {
  display: flex;
  gap: 6px;
}

.powerup-icon {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  border: 2px solid;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  animation: powerUpIn 0.3s ease-out;
}

@keyframes powerUpIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.powerup-icon.fireBoost {
  background: rgba(232, 117, 26, 0.3);
  border-color: var(--accent-fire);
  color: var(--accent-fire-lit);
  box-shadow: 0 0 10px rgba(232, 117, 26, 0.3);
}

.powerup-icon.shield {
  background: rgba(41, 128, 185, 0.3);
  border-color: var(--shield);
  color: var(--shield-lit);
  box-shadow: 0 0 10px rgba(41, 128, 185, 0.3);
}

.powerup-icon.heal {
  background: rgba(39, 174, 96, 0.3);
  border-color: var(--heal);
  color: var(--heal-lit);
  box-shadow: 0 0 10px rgba(39, 174, 96, 0.3);
}

/* === HP bar row === */
.hud-hp-row {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: -48px;
}

.hud-hp {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(26, 20, 16, 0.7);
  border: 2px solid var(--brass-dark);
  border-radius: 8px;
  padding: 4px 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
}

.hp-label {
  font-family: var(--font-title);
  font-size: 0.8rem;
  color: var(--danger);
  letter-spacing: 1px;
  flex-shrink: 0;
}

.hp-bar-container {
  position: relative;
  width: 120px;
  height: 14px;
  background: var(--dark-iron);
  border: 1px solid var(--brass-dark);
  border-radius: 3px;
  overflow: hidden;
}

.hp-bar-fill {
  position: absolute;
  inset: 1px;
  border-radius: 2px;
  transition: width 0.3s ease;
  right: auto;
}

.hp-bar-fill.healthy {
  background: linear-gradient(90deg, var(--copper), var(--copper-lit));
  box-shadow: 0 0 6px rgba(184, 115, 51, 0.4);
}

.hp-bar-fill.warning {
  background: linear-gradient(90deg, var(--accent-fire), var(--accent-fire-lit));
  box-shadow: 0 0 6px rgba(232, 117, 26, 0.4);
}

.hp-bar-fill.danger {
  background: linear-gradient(90deg, var(--danger), #e74c3c);
  box-shadow: 0 0 10px rgba(192, 57, 43, 0.5);
  animation: hpPulse 0.5s ease-in-out infinite;
}

@keyframes hpPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.hp-text {
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--text-warm-dim);
  min-width: 48px;
  text-align: center;
  flex-shrink: 0;
}

/* === Boss HP Bar === */
.hud-boss {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(26, 20, 16, 0.85);
  border: 2px solid var(--danger);
  border-radius: 8px;
  padding: 4px 12px;
  box-shadow: 0 0 16px rgba(192, 57, 43, 0.2);
  animation: bossBarIn 0.3s ease-out;
}

@keyframes bossBarIn {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.boss-label {
  font-family: var(--font-title);
  font-size: 0.8rem;
  color: var(--danger);
  letter-spacing: 1px;
  text-shadow: 0 0 8px rgba(192, 57, 43, 0.4);
  flex-shrink: 0;
}

.boss-bar-container {
  width: 180px;
  height: 12px;
  background: var(--dark-iron);
  border: 1px solid var(--brass-dark);
  border-radius: 3px;
  overflow: hidden;
}

.boss-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--danger), #e74c3c);
  border-radius: 2px;
  transition: width 0.3s ease;
  box-shadow: 0 0 8px rgba(192, 57, 43, 0.4);
}

.boss-bar-fill.danger {
  background: linear-gradient(90deg, #ff0000, var(--danger));
  animation: bossBarPulse 0.4s ease-in-out infinite;
}

@keyframes bossBarPulse {
  0%, 100% { box-shadow: 0 0 8px rgba(192, 57, 43, 0.4); }
  50% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.6); }
}

.boss-phase {
  font-family: var(--font-body);
  font-size: 0.7rem;
  color: var(--accent-fire-lit);
  letter-spacing: 1px;
}
</style>
