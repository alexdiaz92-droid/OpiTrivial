import preguntasPropias from './data/preguntas.json';

// Open Trivia DB devuelve el texto con entidades HTML (&quot;, &#039;, etc.)
// Este helper las decodifica usando el propio DOM del navegador.
function decodeHtml(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

// Traduce un texto corto de inglés a español usando MyMemory (API pública,
// gratuita, sin clave). Si falla por cualquier motivo, se devuelve el texto
// original en inglés en vez de romper la partida.
async function translateToSpanish(text) {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`
    );
    if (!res.ok) throw new Error('Fallo en el servicio de traducción');
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    return translated && translated.trim() ? translated : text;
  } catch (err) {
    console.warn('No se pudo traducir, se mostrará en inglés.', err);
    return text;
  }
}

async function fetchFromOpenTrivia(amount) {
  if (amount <= 0) return [];
  try {
    const res = await fetch(
      `https://opentdb.com/api.php?amount=${Math.min(amount, 50)}&type=multiple`
    );
    if (!res.ok) throw new Error('Respuesta no válida de Open Trivia DB');
    const data = await res.json();
    if (!data.results) return [];

    return await Promise.all(
      data.results.map(async (item) => {
        const questionEn = decodeHtml(item.question);
        const answerEn = decodeHtml(item.correct_answer);
        const [question, answer] = await Promise.all([
          translateToSpanish(questionEn),
          translateToSpanish(answerEn),
        ]);
        return { question, answer, source: 'api' };
      })
    );
  } catch (err) {
    console.warn('No se pudieron cargar preguntas de la API.', err);
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
 * Elige al azar qué fuente probar primero (propia o API), para no priorizar
 * siempre la misma, y recurre a la otra si la primera no tiene disponibles.
 * @param {string[]} excludeQuestions - textos de las preguntas ya presentes en la partida
 */
export async function fetchReplacementQuestion(excludeQuestions) {
  const excludeSet = new Set(
    excludeQuestions.map((q) => q.trim().toLowerCase())
  );

  const unusedLocal = preguntasPropias.filter(
    (q) => !excludeSet.has(q.question.trim().toLowerCase())
  );

  function tryLocal() {
    if (unusedLocal.length === 0) return null;
    return shuffle(unusedLocal)[0];
  }

  async function tryApi() {
    for (let attempt = 0; attempt < 5; attempt++) {
      const [fresh] = await fetchFromOpenTrivia(1);
      if (fresh && !excludeSet.has(fresh.question.trim().toLowerCase())) {
        return fresh;
      }
    }
    return null;
  }

  const tryLocalFirst = Math.random() < 0.5;

  if (tryLocalFirst) {
    return tryLocal() || (await tryApi());
  }
  return (await tryApi()) || tryLocal();
}

/**
 * Construye el mazo de preguntas para una partida, mezclando de forma
 * indiscriminada preguntas propias y preguntas de Open Trivia DB (traducidas),
 * sin priorizar ninguna de las dos fuentes.
 * @param {number} totalNeeded - número total de preguntas que necesita la partida
 */
export async function buildQuestionDeck(totalNeeded) {
  const localCandidates = shuffle(preguntasPropias).slice(0, totalNeeded);
  const apiCandidates = await fetchFromOpenTrivia(totalNeeded);

  let combined = shuffle([...localCandidates, ...apiCandidates]);

  // Red de seguridad: si por lo que sea no hay suficientes (p.ej. sin
  // conexión y pocas preguntas propias disponibles), completamos con el
  // resto de preguntas propias que no se hayan usado todavía.
  if (combined.length < totalNeeded) {
    const usedQuestions = new Set(
      combined.map((q) => q.question.trim().toLowerCase())
    );
    const extraLocal = shuffle(preguntasPropias).filter(
      (q) => !usedQuestions.has(q.question.trim().toLowerCase())
    );
    combined = [...combined, ...extraLocal];
  }

  return shuffle(combined).slice(0, totalNeeded);
}
