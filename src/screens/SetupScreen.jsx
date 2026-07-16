import { useState } from 'react';

export default function SetupScreen({ onStart, error: externalError }) {
  const [players, setPlayers] = useState([]);
  const [nameInput, setNameInput] = useState('');
  const [rounds, setRounds] = useState(3);
  const [seconds, setSeconds] = useState(20);
  const [error, setError] = useState('');

  function addPlayer() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    if (players.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      setError('Ese nombre ya está en la lista.');
      return;
    }
    setPlayers([...players, trimmed]);
    setNameInput('');
    setError('');
  }

  function removePlayer(name) {
    setPlayers(players.filter((p) => p !== name));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPlayer();
    }
  }

  function handleSubmit() {
    if (players.length < 1) {
      setError('Añade al menos un jugador para empezar.');
      return;
    }
    onStart({ players, rounds, seconds });
  }

  return (
    <div className="stage">
      <div className="card">
        <h1 className="marquee-title">
          <span className="accent">OPI</span> sabe de Trivial
        </h1>
        <p className="subtitle">Configura la partida antes de encender las luces.</p>

        <label className="field-label" htmlFor="player-name">
          Jugadores
        </label>
        <div className="player-input-row">
          <input
            id="player-name"
            type="text"
            placeholder="Nombre del jugador"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="btn-bulb" onClick={addPlayer} type="button">
            Añadir
          </button>
        </div>

        {players.length > 0 && (
          <ul className="player-list">
            {players.map((name) => (
              <li key={name}>
                <span>{name}</span>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removePlayer(name)}
                  aria-label={`Quitar a ${name}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="config-row">
          <label htmlFor="rounds">Rondas por jugador</label>
          <input
            id="rounds"
            type="number"
            min="1"
            max="20"
            value={rounds}
            onChange={(e) => setRounds(Math.max(1, Number(e.target.value)))}
          />
        </div>

        <div className="config-row">
          <label htmlFor="seconds">Segundos por pregunta</label>
          <input
            id="seconds"
            type="number"
            min="5"
            max="120"
            value={seconds}
            onChange={(e) => setSeconds(Math.max(5, Number(e.target.value)))}
          />
        </div>

        {(error || externalError) && (
          <p className="error-text">{error || externalError}</p>
        )}

        <button className="btn-primary" onClick={handleSubmit} type="button">
          Empezar partida
        </button>
      </div>
    </div>
  );
}
