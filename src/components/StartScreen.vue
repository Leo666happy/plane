<template>
  <div class="screen-overlay start-screen">
    <!-- Decorative gears -->
    <div class="gear gear-large gear-left"></div>
    <div class="gear gear-small gear-right"></div>
    <div class="gear gear-medium gear-top-right"></div>

    <!-- Title section -->
    <div class="title-section">
      <h1 class="title">飞机大战</h1>
      <p class="subtitle">发条总动员 · 无尽模式</p>
    </div>

    <!-- Decorative divider -->
    <div class="divider">
      <span class="divider-line"></span>
      <span class="divider-gear">⚙</span>
      <span class="divider-line"></span>
    </div>

    <!-- Start button -->
    <button class="steampunk-btn start-btn" @click="$emit('start')">
      ⚙ 开始游戏
    </button>

    <!-- Controls hint -->
    <div class="controls-hint">
      <div class="hint-row">
        <span class="key-icon">↑↓←→</span>
        <span>方向键移动飞机</span>
      </div>
      <div class="hint-row">
        <span class="key-icon">♨</span>
        <span>自动发射子弹 · 消灭敌机 · 收集道具</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{ start: [] }>()
</script>

<style scoped>
.start-screen {
  background: radial-gradient(ellipse at center, var(--bg-warm-lit) 0%, var(--bg-warm) 60%, #0d0a06 100%);
  gap: 24px;
}

/* === Gear decorations === */
.gear {
  position: absolute;
  border-radius: 50%;
  opacity: 0.12;
  pointer-events: none;
}
.gear::before {
  content: '';
  position: absolute;
  inset: -15%;
  border-radius: 50%;
  border: 3px solid var(--brass);
  animation: gearSpin 12s linear infinite;
}
.gear::after {
  content: '⚙';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: inherit;
  color: var(--brass);
  animation: gearSpin 8s linear infinite;
}
.gear-large {
  width: 120px;
  height: 120px;
  bottom: -40px;
  left: -40px;
  font-size: 120px;
}
.gear-medium {
  width: 70px;
  height: 70px;
  top: -20px;
  right: 20px;
  font-size: 70px;
}
.gear-small {
  width: 50px;
  height: 50px;
  top: 40px;
  right: -10px;
  font-size: 50px;
}

@keyframes gearSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* === Title === */
.title-section {
  text-align: center;
}

.title {
  font-family: var(--font-title);
  font-size: clamp(2rem, 6vw, 3.2rem);
  background: linear-gradient(180deg, var(--gold-lit) 0%, var(--brass-lit) 40%, var(--gold-dark) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
  filter: drop-shadow(0 3px 6px rgba(0,0,0,0.6));
  letter-spacing: 6px;
  margin-bottom: 6px;
}

.subtitle {
  font-family: var(--font-body);
  font-size: 1.1rem;
  color: var(--text-warm-dim);
  letter-spacing: 4px;
}

/* === Divider === */
.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 280px;
}

.divider-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--brass-dark), transparent);
}

.divider-gear {
  font-size: 1.4rem;
  color: var(--brass);
  animation: gearSpin 6s linear infinite;
}

/* === Controls hint === */
.controls-hint {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.hint-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
  color: var(--text-warm-dim);
}

.key-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  padding: 4px 8px;
  background: var(--dark-iron);
  border: 1px solid var(--brass-dark);
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--brass-lit);
  letter-spacing: 1px;
}
</style>
