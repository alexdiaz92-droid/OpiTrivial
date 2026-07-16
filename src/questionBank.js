import preguntasPropias from './data/preguntas.json';

// Open Trivia DB devuelve el texto con entidades HTML (&quot;, &#039;, etc.)
// Este helper las decodifica usando el propio DOM del navegador.
function decodeHtml(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

async function fetchFromOpenTrivia(amount) {
  try {
    const res = await fetch(
      `https://opentdb.com/api.php?amount=${amount}&type=multiple`
    );
    if (!res.ok) throw new Error('Respuesta no válida de Open Trivia DB');
    const data = await res.json();
    if (!data.results) return [];

    return data.results.map((item) => ({
      question: decodeHtml(item.question),
      answer: decodeHtml(item.correct_answer),
      source: 'api',
    }));
  } catch (err) {
    console.warn('No se pudieron cargar preguntas de la API, se usarán solo las propias.', err);
    return [];
  }
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Construye el mazo de preguntas para una partida, combinando
 * las preguntas propias con preguntas obtenidas de Open Trivia DB.
 * @param {number} totalNeeded - número total de preguntas que necesita la partida
 */
export async function buildQuestionDeck(totalNeeded) {
  const propias = shuffle(preguntasPropias);
  const faltan = Math.max(totalNeeded - propias.length, 0);

  const deApi = faltan > 0 ? await fetchFromOpenTrivia(faltan) : [];

  const mazo = shuffle([...propias, ...deApi]);
  return mazo.slice(0, totalNeeded);
}
