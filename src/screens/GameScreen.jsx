import { useEffect, useMemo, useRef, useState } from 'react';

const BULB_COUNT = 10;

export default function GameScreen({ players, rounds, seconds, deck, onGameOver }) {
  const totalTurns = players.length * rounds;

  const [turnIndex, setTurnIndex] = useState(0);
  const [scores, setScores] = useState(() =>
    Object.fromEntries(players.map((p) => [p, 0]))
  );
  const [remaining, setRemaining] = useState(seconds);
  const [phase, setPhase] = useState('question'); // 'question' | 'revealed'
  const intervalRef = useRef(null);

  const currentPlayer = players[turnIndex % players.length];
  const currentQuestion = deck[turnIndex];

  useEffect(() => {
    if (phase !== 'question') return undefined;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setPhase('revealed');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnIndex, phase]);

  const bulbsLit = useMemo(() => {
    return Math.ceil((remaining / seconds) * BULB_COUNT);
  }, [remaining, seconds]);

  function handleReveal() {
    clearInterval(intervalRef.current);
    setPhase('revealed');
  }

  function goToNextTurn(scoreDelta) {
    setScores((prev) => ({
      ...prev,
      [currentPlayer]: prev[currentPlayer] + scoreDelta,
    }));

    const next = turnIndex + 1;
    if (next >= totalTurns) {
      onGameOver({ ...scores, [currentPlayer]: scores[currentPlayer] + scoreDelta });
      return;
    }
    setTurnIndex(next);
    setRemaining(seconds);
    setPhase('question');
  }

  if (!currentQuestion) {
    return (
      <div className="stage">
        <div className="card">
          <h1 className="marquee-title">Preparando preguntas…</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="stage">
      <div className="card">
        <div className="turn-tag">Turno de {currentPlayer}</div>
        <div className="progress-text">
          Pregunta {turnIndex + 1} de {totalTurns}
        </div>

        <p className="question-text">{currentQuestion.question}</p>

        <div className="bulb-row" aria-hidden="true">
          {Array.from({ length: BULB_COUNT }).map((_, i) => (
            <span
              key={i}
              className={`bulb ${i < bulbsLit ? 'bulb-on' : 'bulb-off'}`}
            />
          ))}
        </div>
        <p className="timer-number">{remaining}s</p>

        {phase === 'question' && (
          <button className="btn-primary" onClick={handleReveal} type="button">
            Revelar respuesta
          </button>
        )}

        {phase === 'revealed' && (
          <div className="reveal-block">
            <p className="answer-text">
              Respuesta correcta: <strong>{currentQuestion.answer}</strong>
            </p>
            <p className="judge-prompt">¿{currentPlayer} ha acertado?</p>
            <div className="judge-row">
              <button
                className="btn-correct"
                type="button"
                onClick={() => goToNextTurn(1)}
              >
                ✅ Acertó
              </button>
              <button
                className="btn-miss"
                type="button"
                onClick={() => goToNextTurn(0)}
              >
                ❌ Falló
              </button>
            </div>
          </div>
        )}

        <div className="mini-scoreboard">
          {players.map((p) => (
            <span key={p} className={p === currentPlayer ? 'active-score' : ''}>
              {p}: {scores[p]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
