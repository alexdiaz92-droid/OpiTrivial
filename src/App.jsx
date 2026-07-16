import { useState } from 'react';
import SetupScreen from './screens/SetupScreen';
import GameScreen from './screens/GameScreen';
import GameOverScreen from './screens/GameOverScreen';
import { buildQuestionDeck } from './questionBank';

export default function App() {
  const [phase, setPhase] = useState('setup'); // 'setup' | 'loading' | 'playing' | 'gameover'
  const [config, setConfig] = useState(null);
  const [deck, setDeck] = useState([]);
  const [finalScores, setFinalScores] = useState({});
  const [loadError, setLoadError] = useState('');

  async function handleStart(gameConfig) {
    setConfig(gameConfig);
    setPhase('loading');
    setLoadError('');
    try {
      const totalNeeded = gameConfig.players.length * gameConfig.rounds;
      const newDeck = await buildQuestionDeck(totalNeeded);
      if (newDeck.length === 0) {
        setLoadError('No se pudieron cargar preguntas. Revisa tu conexión e inténtalo de nuevo.');
        setPhase('setup');
        return;
      }
      setDeck(newDeck);
      setPhase('playing');
    } catch (err) {
      setLoadError('Ha ocurrido un error preparando la partida.');
      setPhase('setup');
    }
  }

  function handleGameOver(scores) {
    setFinalScores(scores);
    setPhase('gameover');
  }

  function handleRestart() {
    setConfig(null);
    setDeck([]);
    setFinalScores({});
    setPhase('setup');
  }

  if (phase === 'loading') {
    return (
      <div className="stage">
        <div className="card">
          <h1 className="marquee-title">
            Encendiendo <span className="accent">luces…</span>
          </h1>
          <p className="subtitle">Preparando el mazo de preguntas.</p>
        </div>
      </div>
    );
  }

  if (phase === 'playing' && config) {
    return (
      <GameScreen
        players={config.players}
        rounds={config.rounds}
        seconds={config.seconds}
        deck={deck}
        onGameOver={handleGameOver}
      />
    );
  }

  if (phase === 'gameover') {
    return <GameOverScreen scores={finalScores} onRestart={handleRestart} />;
  }

  return <SetupScreen onStart={handleStart} error={loadError} />;
}
