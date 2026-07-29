import { useState, useCallback } from 'react'
import type { GameData } from '../game/types'
import { GameStatus } from '../game/types'

const defaultData: GameData = {
  status: GameStatus.Menu, score: 0, highScore: 0, distance: 0,
  speed: 250, baseSpeed: 250, lives: 3, maxLives: 5, difficulty: 0,
  worldIndex: 0, worldTransition: 1, shakeIntensity: 0, shakeTimer: 0,
  comboCount: 0, dodgesCount: 0, timePlayed: 0, multiplier: 1
}

export function useGame() {
  const [data, setData] = useState<GameData>(defaultData)
  const onStateChange = useCallback((d: GameData) => setData({ ...d }), [])
  const onGameOver = useCallback((_score: number) => { }, [])
  return { data, onStateChange, onGameOver }
}
