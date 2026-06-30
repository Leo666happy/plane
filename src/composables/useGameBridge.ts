import { ref, type Ref } from 'vue'
import type { EngineCallbacks } from '../engine/types'

export interface GameBridgeState {
  score: Ref<number>
  hp: Ref<number>
  maxHp: Ref<number>
  activePowerUps: Ref<string[]>
  bossHp: Ref<number | null>
  bossMaxHp: Ref<number | null>
  gamePhase: Ref<string>
  isGameOver: Ref<boolean>
  finalScore: Ref<number>
  callbacks: EngineCallbacks
}

export function useGameBridge(): GameBridgeState {
  const score = ref(0)
  const hp = ref(100)
  const maxHp = ref(100)
  const activePowerUps = ref<string[]>([])
  const bossHp = ref<number | null>(null)
  const bossMaxHp = ref<number | null>(null)
  const gamePhase = ref<string>('normal')
  const isGameOver = ref(false)
  const finalScore = ref(0)

  const callbacks: EngineCallbacks = {
    onScoreChange: (s: number) => { score.value = s },
    onHpChange: (h: number, mh: number) => {
      hp.value = h
      maxHp.value = mh
    },
    onPowerUpCollected: (type: string) => {
      // heal is instant, don't show an icon
      if (type === 'heal') return
      activePowerUps.value = [...activePowerUps.value.filter(t => t !== type), type]
    },
    onPowerUpExpired: (type: string) => {
      activePowerUps.value = activePowerUps.value.filter(t => t !== type)
    },
    onBossAppear: (_bossHp: number, _bossMaxHp: number) => {
      bossHp.value = _bossHp
      bossMaxHp.value = _bossMaxHp
    },
    onBossHpChange: (h: number, _mh: number) => {
      bossHp.value = h
    },
    onBossDefeat: () => {
      bossHp.value = null
      bossMaxHp.value = null
    },
    onGameOver: (s: number) => {
      isGameOver.value = true
      finalScore.value = s
    },
    onPhaseChange: (p: string) => {
      gamePhase.value = p
    },
    onPlayerDamaged: () => {
      // handled by the emitter in GameCanvas
    },
  }

  return {
    score,
    hp,
    maxHp,
    activePowerUps,
    bossHp,
    bossMaxHp,
    gamePhase,
    isGameOver,
    finalScore,
    callbacks,
  }
}
