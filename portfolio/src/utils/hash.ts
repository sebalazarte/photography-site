const toHex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer))
  .map(byte => byte.toString(16).padStart(2, '0'))
  .join('');

const getSubtleCrypto = () => {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  const globalCrypto = (globalThis as { crypto?: Crypto }).crypto;
  return globalCrypto?.subtle ?? null;
};

export const sha256 = async (text: string) => {
  const subtle = getSubtleCrypto();
  if (!subtle) {
    throw new Error('No se pudo acceder al motor criptográfico');
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const digest = await subtle.digest('SHA-256', data);
  return toHex(digest);
};
