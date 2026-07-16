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
 * Busca una pregunta de reemplazo para sustituir una marcada como inválida.
 * Prioriza preguntas propias no usadas todavía en la partida; si no quedan,
 * recurre a Open Trivia DB, reintentando para evitar duplicados.
 * @param {string[]} excludeQuestions - textos de las preguntas ya presentes en la partida
 */
export async function fetchReplacementQuestion(excludeQuestions) {
  const excludeSet = new Set(
    excludeQuestions.map((q) => q.trim().toLowerCase())
  );

  const unusedLocal = preguntasPropias.filter(
    (q) => !excludeSet.has(q.question.trim().toLowerCase())
  );
  if (unusedLocal.length > 0) {
    const pool = shuffle(unusedLocal);
    return pool[0];
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const [fresh] = await fetchFromOpenTrivia(1);
    if (fresh && !excludeSet.has(fresh.question.trim().toLowerCase())) {
      return fresh;
    }
  }

  return null;
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
