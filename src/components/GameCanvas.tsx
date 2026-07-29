import { useRef, useEffect } from 'react'
import { Game } from '../game/Game'
import type { GameData } from '../game/types'

interface Props {
  onStateChange: (data: GameData) => void
  onGameOver: (score: number) => void
}

export function GameCanvas({ onStateChange, onGameOver }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const game = new Game()
    gameRef.current = game
    game.setOnStateChange(onStateChange)
    game.setOnGameOver(onGameOver)
    game.init('game-canvas')
    return () => game.destroy()
  }, [])

  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.setOnStateChange(onStateChange)
      gameRef.current.setOnGameOver(onGameOver)
    }
  }, [onStateChange, onGameOver])

  return <canvas id="game-canvas" ref={canvasRef} className="game-canvas" />
}
