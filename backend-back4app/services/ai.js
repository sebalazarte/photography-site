const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';

const resolveTemperature = () => {
  const raw = process.env.OPENAI_TEMPERATURE;
  if (typeof raw !== 'string') {
    return undefined;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }
  const numeric = Number(trimmed);
  if (Number.isNaN(numeric)) {
    console.warn('OPENAI_TEMPERATURE inválido. Se ignorará y se usará el valor por defecto del modelo.');
    return undefined;
  }
  return numeric;
};

const OPENAI_TEMPERATURE = resolveTemperature();

const ensureOpenAIReady = () => {
  if (!OPENAI_API_KEY.trim()) {
    throw new Error('Configura OPENAI_API_KEY para usar la mejora con IA.');
  }
};

const normalizeInput = (text) => {
  if (typeof text !== 'string') return '';
  return text.trim();
};

const buildMessages = (text) => [
  {
    role: 'system',
    content:
      'Eres un copywriter profesional. Reescribe el texto con un tono cálido y elegante, manteniendo la intención original, corrigiendo errores y mejorando la fluidez en español neutral.',
  },
  {
    role: 'user',
    content: `Texto original:\n"""${text}"""\n\nDevuelve solo la versión mejorada.`,
  },
];

const extractImprovedText = (payload) => {
  if (!payload) return '';
  const choice = Array.isArray(payload.choices) ? payload.choices[0] : null;
  const message = choice?.message?.content;
  return typeof message === 'string' ? message.trim() : '';
};

const improveDescriptionCopy = async (text) => {
  const input = normalizeInput(text);
  if (!input) {
    throw new Error('Necesitás ingresar un texto para mejorarlo.');
  }
  ensureOpenAIReady();

  const payload = {
    model: OPENAI_MODEL,
    messages: buildMessages(input),
  };
  if (typeof OPENAI_TEMPERATURE === 'number') {
    payload.temperature = OPENAI_TEMPERATURE;
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  let data = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      // ignoramos los errores de parseo para reutilizar el mensaje genérico
    }
  }

  if (!response.ok) {
    const message = data?.error?.message || 'No se pudo mejorar el texto.';
    throw new Error(message);
  }

  const improved = extractImprovedText(data);
  if (!improved) {
    throw new Error('La IA no devolvió un texto mejorado.');
  }

  return improved;
};

export { improveDescriptionCopy };
