export const formatWhatsappLink = (value?: string | null) => {
  if (!value) return null;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  const digits = value.replace(/\D+/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}`;
};
