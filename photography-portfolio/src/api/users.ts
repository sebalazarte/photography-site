import { parseRequest } from './client';

interface ParseUser {
  objectId: string;
  username: string;
  email?: string;
  name?: string;
  phone?: string;
  whatsapp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactProfile {
  id: string;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
}

const mapToContactProfile = (user: ParseUser): ContactProfile => ({
  id: user.objectId,
  username: user.username,
  name: user.name ?? user.username,
  email: user.email,
  phone: user.phone,
  whatsapp: user.whatsapp,
});

export const fetchPrimaryContactProfile = async (): Promise<ContactProfile | null> => {
  const data = await parseRequest<{ results?: ParseUser[] }>(
    '/users?order=createdAt&limit=1'
  );
  const user = data?.results?.[0];
  if (!user) return null;
  return mapToContactProfile(user);
};
