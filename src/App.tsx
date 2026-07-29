import { useState, useCallback } from 'react'
import { GameCanvas } from './components/GameCanvas'
import { HUD } from './components/HUD'
import { StartScreen } from './components/StartScreen'
import { GameOverScreen } from './components/GameOverScreen'
import type { GameData } from './game/types'
import { GameStatus } from './game/types'

export default function App() {
  const [data, setData] = useState<GameData>({
    status: GameStatus.Menu, score: 0, highScore: 0, distance: 0,
    speed: 250, baseSpeed: 250, lives: 3, maxLives: 5, difficulty: 0,
    worldIndex: 0, worldTransition: 1, shakeIntensity: 0, shakeTimer: 0,
    comboCount: 0, dodgesCount: 0, timePlayed: 0, multiplier: 1,
  })
  const [gameOverScore, setGameOverScore] = useState(0)
  const [gameOverData, setGameOverData] = useState<GameData | null>(null)

  const onStateChange = useCallback((d: GameData) => { setData(d); if (d.status === GameStatus.GameOver) { setGameOverData(d); setGameOverScore(d.score) } }, [])
  const onGameOver = useCallback((score: number) => { setGameOverScore(score) }, [])

  return (
    <div className="app">
      <GameCanvas onStateChange={onStateChange} onGameOver={onGameOver} />
      {data.status === GameStatus.Menu && <StartScreen highScore={data.highScore} />}
      {(data.status === GameStatus.Playing || data.status === GameStatus.Paused) && <HUD data={data} />}
      {data.status === GameStatus.Paused && <div className="overlay"><div className="pause-text">PAUSED</div></div>}
      {data.status === GameStatus.GameOver && gameOverData && (
        <GameOverScreen score={gameOverScore} highScore={data.highScore} distance={gameOverData.distance} timePlayed={gameOverData.timePlayed} dodgesCount={gameOverData.dodgesCount} />
      )}
    </div>
  )
}
