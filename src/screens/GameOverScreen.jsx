export default function GameOverScreen({ scores, onRestart }) {
  const ranking = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topScore = ranking[0]?.[1] ?? 0;

  return (
    <div className="stage">
      <div className="card">
        <h1 className="marquee-title">
          Fin de la <span className="accent">partida</span>
        </h1>
        <p className="subtitle">Así ha quedado el marcador final.</p>

        <ol className="ranking-list">
          {ranking.map(([name, score], i) => (
            <li
              key={name}
              className={score === topScore ? 'ranking-winner' : ''}
            >
              <span className="ranking-position">{i + 1}</span>
              <span className="ranking-name">{name}</span>
              <span className="ranking-score">{score}</span>
            </li>
          ))}
        </ol>

        <button className="btn-primary" onClick={onRestart} type="button">
          Jugar otra vez
        </button>
      </div>
    </div>
  );
}
