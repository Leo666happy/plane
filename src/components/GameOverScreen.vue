<template>
  <div class="screen-overlay gameover-screen">
    <!-- Darken overlay -->
    <div class="overlay-bg"></div>

    <!-- Crash animation text -->
    <div class="content">
      <h2 class="gameover-title">游戏结束</h2>

      <div class="score-frame">
        <div class="score-row">
          <span class="score-label">最终得分</span>
          <span class="score-value">{{ finalScore.toLocaleString() }}</span>
        </div>
        <div class="score-divider"></div>
        <div class="score-row">
          <span class="score-label">最高分</span>
          <span class="score-value high">{{ highScore.toLocaleString() }}</span>
        </div>
      </div>

      <button class="steampunk-btn restart-btn" @click="$emit('restart')">
        ⚙ 重新开始
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  finalScore: number
  highScore: number
}>()
defineEmits<{ restart: [] }>()
</script>

<style scoped>
.gameover-screen {
  z-index: 20;
}

.overlay-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(26,20,16,0.85) 0%, rgba(13,10,6,0.95) 100%);
  pointer-events: none;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  z-index: 1;
}

.gameover-title {
  font-family: var(--font-title);
  font-size: clamp(1.6rem, 5vw, 2.8rem);
  color: var(--danger);
  letter-spacing: 4px;
  text-shadow:
    0 0 20px rgba(192, 57, 43, 0.5),
    0 3px 6px rgba(0,0,0,0.6);
  animation: shakeIn 0.5s ease-out;
}

@keyframes shakeIn {
  0% { transform: translateX(-20px); opacity: 0; }
  20% { transform: translateX(16px); }
  40% { transform: translateX(-12px); }
  60% { transform: translateX(6px); }
  80% { transform: translateX(-3px); }
  100% { transform: translateX(0); opacity: 1; }
}

.score-frame {
  background: linear-gradient(180deg, rgba(47,47,47,0.8), rgba(26,20,16,0.9));
  border: 2px solid var(--brass-dark);
  border-radius: 12px;
  padding: 16px 28px;
  min-width: 200px;
  box-shadow:
    0 0 0 4px var(--dark-iron),
    0 0 0 6px var(--brass-dark),
    0 8px 32px rgba(0,0,0,0.5);
  position: relative;
}

/* Rivet corners */
.score-frame::before {
  content: '';
  position: absolute;
  top: -8px;
  left: -8px;
  right: -8px;
  bottom: -8px;
  border-radius: 20px;
  pointer-events: none;
  background:
    radial-gradient(circle 4px, var(--brass-lit) 50%, transparent 50%) -8px -8px,
    radial-gradient(circle 4px, var(--brass-lit) 50%, transparent 50%) calc(100% + 8px) -8px,
    radial-gradient(circle 4px, var(--brass-lit) 50%, transparent 50%) -8px calc(100% + 8px),
    radial-gradient(circle 4px, var(--brass-lit) 50%, transparent 50%) calc(100% + 8px) calc(100% + 8px);
  background-repeat: no-repeat;
}

.score-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 32px;
  padding: 8px 0;
}

.score-label {
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--text-warm-dim);
  letter-spacing: 3px;
}

.score-value {
  font-family: var(--font-title);
  font-size: 1.4rem;
  color: var(--gold-lit);
  text-shadow: 0 0 10px rgba(218, 165, 32, 0.3);
}

.score-value.high {
  font-size: 1.2rem;
  color: var(--brass-lit);
}

.score-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--brass-dark), transparent);
  margin: 4px 0;
}

.restart-btn {
  margin-top: 8px;
}
</style>
