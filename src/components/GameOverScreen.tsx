interface Props { score: number; highScore: number; distance: number; timePlayed: number; dodgesCount: number }
export function GameOverScreen({ score, highScore, distance, timePlayed, dodgesCount }: Props) {
  const isNew = score >= highScore && score > 0
  return (
    <div className="overlay game-over-overlay">
      <div className="game-over-content">
        <h2 className="game-over-title">GAME OVER</h2>
        {isNew && <p className="new-record">🏆 NEW RECORD!</p>}
        <div className="stats">
          <div className="stat-row"><span>Score</span><span>{score.toLocaleString()}</span></div>
          <div className="stat-row"><span>High Score</span><span>{highScore.toLocaleString()}</span></div>
          <div className="stat-row"><span>Distance</span><span>{Math.floor(distance)}m</span></div>
          <div className="stat-row"><span>Survived</span><span>{Math.floor(timePlayed)}s</span></div>
          <div className="stat-row"><span>Dodges</span><span>{dodgesCount}</span></div>
        </div>
        <p className="prompt">TAP or press any key to play again</p>
      </div>
    </div>
  )
}
