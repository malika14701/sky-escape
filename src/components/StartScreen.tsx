export function StartScreen({ highScore }: { highScore: number }) {
  return (
    <div className="overlay start-screen">
      <div className="start-content">
        <h1 className="game-title">SKY ESCAPE</h1>
        <p className="subtitle">Arcade Flight Survival</p>
        <div className="instructions">
          <p>← → or A / D to change lanes</p>
          <p>P or ESC to pause</p>
        </div>
        {highScore > 0 && <p className="high-score">🏆 High Score: {highScore.toLocaleString()}</p>}
        <p className="prompt">TAP or press any key to start</p>
      </div>
    </div>
  )
}
