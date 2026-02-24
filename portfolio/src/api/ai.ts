import { backendRequest, HAS_BACKEND } from './backend';

interface ImproveTextResponse {
  improved?: string;
}

export const improveContactDescription = async (text: string) => {
  if (!HAS_BACKEND) {
    throw new Error('La mejora con IA requiere el backend en ejecución.');
  }

  const payload = await backendRequest<ImproveTextResponse>('/api/ai/improve-text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  const improved = (payload?.improved ?? '').trim();
  if (!improved) {
    throw new Error('No se obtuvo una versión mejorada del texto.');
  }

  return improved;
};
