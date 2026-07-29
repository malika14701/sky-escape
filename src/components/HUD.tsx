import type { GameData } from '../game/types'

export function HUD({ data }: { data: GameData }) {
  return (
    <div className="hud">
      <div className="hud-row">
        <div className="hud-item">
          <span className="hud-label">SCORE</span>
          <span className="hud-value">{data.score.toLocaleString()}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">DIST</span>
          <span className="hud-value">{Math.floor(data.distance)}m</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">MULT</span>
          <span className="hud-value">x{data.multiplier.toFixed(1)}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">LIVES</span>
          <span className="hud-value">{'♥'.repeat(data.lives)}{'♡'.repeat(Math.max(0, data.maxLives - data.lives))}</span>
        </div>
      </div>
      <div className="hud-combo">{data.comboCount > 1 ? `🔥 ${data.comboCount} combo` : ''}</div>
    </div>
  )
}
