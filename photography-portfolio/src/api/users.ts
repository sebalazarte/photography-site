import { backendRequest, HAS_BACKEND, isNetworkError } from './backend';
import { parseRequest } from './client';

interface ParseUser {
  objectId: string;
  username: string;
  email?: string;
  name?: string;
  phone?: string;
  whatsapp?: string;
  acercaDe?: string;
  createdAt: string;
  updatedAt: string;
}

interface ParseRole {
  objectId: string;
  name: string;
}

export interface ContactProfile {
  id: string;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  about?: string;
}

export type CustomerRecord = ContactProfile;

const mapToContactProfile = (user: ParseUser): ContactProfile => ({
  id: user.objectId,
  username: user.username,
  name: user.name ?? user.username,
  email: user.email,
  phone: user.phone,
  whatsapp: user.whatsapp,
  about: user.acercaDe,
});

export const fetchPrimaryContactProfile = async (): Promise<ContactProfile | null> => {
  const data = await parseRequest<{ results?: ParseUser[] }>(
    '/users?order=createdAt&limit=1'
  );
  const user = data?.results?.[0];
  if (!user) return null;
  return mapToContactProfile(user);
};

const fetchRoleByName = async (name: string): Promise<ParseRole | null> => {
  const where = encodeURIComponent(JSON.stringify({ name }));
  const data = await parseRequest<{ results?: ParseRole[] }>(`/roles?where=${where}&limit=1`);
  return data?.results?.[0] ?? null;
};

const addUserToRole = async (userId: string, roleId: string) => {
  try {
    await parseRequest(`/roles/${roleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        users: {
          __op: 'AddRelation',
          objects: [
            {
              __type: 'Pointer',
              className: '_User',
              objectId: userId,
            },
          ],
        },
      }),
    });
  } catch (error) {
    console.warn(`No se pudo agregar el usuario ${userId} al rol ${roleId}`, error);
  }
};

const removeUserFromRole = async (userId: string, roleId: string) => {
  try {
    await parseRequest(`/roles/${roleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        users: {
          __op: 'RemoveRelation',
          objects: [
            {
              __type: 'Pointer',
              className: '_User',
              objectId: userId,
            },
          ],
        },
      }),
    });
  } catch (error) {
    console.warn(`No se pudo quitar el usuario ${userId} del rol ${roleId}`, error);
  }
};

const fetchUserById = async (userId: string): Promise<ContactProfile> => {
  const user = await parseRequest<ParseUser>(`/users/${userId}`);
  return mapToContactProfile(user);
};

export interface CreateCustomerInput {
  username: string;
  password: string;
  email?: string;
  name?: string;
  phone?: string;
  whatsapp?: string;
  about?: string;
  roleName?: string;
}

export interface UpdateCustomerInput {
  email?: string;
  name?: string;
  phone?: string;
  whatsapp?: string;
  about?: string;
  password?: string;
}

export const createCustomerAccount = async (input: CreateCustomerInput) => {
  if (HAS_BACKEND) {
    try {
      return await backendRequest<CustomerRecord>('/api/customers', {
        method: 'POST',
        body: JSON.stringify({
          username: input.username,
          password: input.password,
          email: input.email,
          name: input.name,
          phone: input.phone,
          whatsapp: input.whatsapp,
          about: input.about,
          roleName: input.roleName ?? 'customer',
        }),
      });
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error instanceof Error ? error : new Error('No se pudo crear el cliente.');
      }
      console.warn('Fallo la llamada al backend, usando Parse como alternativa.', error);
    }
  }

  const username = input.username.trim();
  const password = input.password.trim();
  if (!username || !password) {
    throw new Error('Usuario y contraseña son obligatorios');
  }

  const email = (input.email ?? '').trim();
  const name = (input.name ?? '').trim();
  const phone = (input.phone ?? '').trim();
  const whatsapp = (input.whatsapp ?? '').trim();
  const about = (input.about ?? '').trim();

  const payload: Record<string, unknown> = {
    username,
    password,
  };

  if (email) payload.email = email;
  if (name) payload.name = name;
  if (phone) payload.phone = phone;
  if (whatsapp) payload.whatsapp = whatsapp;
  if (about) payload.acercaDe = about;

  const created = await parseRequest<{ objectId: string } & Partial<ParseUser>>('/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const roleName = input.roleName ?? 'customer';
  try {
    const role = await fetchRoleByName(roleName);
    if (role) {
      await addUserToRole(created.objectId, role.objectId);
    } else {
      console.warn(`No se encontró el rol ${roleName} en Parse.`);
    }
  } catch (error) {
    console.warn('No se pudo asignar el rol al nuevo usuario', error);
  }

  return fetchUserById(created.objectId);
};

export const fetchCustomers = async (): Promise<CustomerRecord[]> => {
  if (HAS_BACKEND) {
    try {
      return await backendRequest<CustomerRecord[]>('/api/customers');
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error instanceof Error ? error : new Error('No se pudieron obtener los clientes.');
      }
      console.warn('No se pudo usar el backend para listar clientes, intentando directamente en Parse.', error);
    }
  }

  const role = await fetchRoleByName('customer');
  if (!role) return [];

  const where = encodeURIComponent(JSON.stringify({
    $relatedTo: {
      object: {
        __type: 'Pointer',
        className: '_Role',
        objectId: role.objectId,
      },
      key: 'users',
    },
  }));

  const data = await parseRequest<{ results?: ParseUser[] }>(`/users?where=${where}&order=username`);
  return data?.results?.map(mapToContactProfile) ?? [];
};

export const updateCustomerAccount = async (userId: string, input: UpdateCustomerInput): Promise<CustomerRecord> => {
  if (HAS_BACKEND) {
    try {
      return await backendRequest<CustomerRecord>(`/api/customers/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          email: input.email,
          name: input.name,
          phone: input.phone,
          whatsapp: input.whatsapp,
          about: input.about,
          password: input.password,
        }),
      });
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error instanceof Error ? error : new Error('No se pudo actualizar el cliente.');
      }
      console.warn('No se pudo usar el backend para actualizar el cliente, intentando directamente en Parse.', error);
    }
  }

  const payload: Record<string, unknown> = {};

  const assignField = (field: string, value: string | undefined | null, targetField = field) => {
    if (value === undefined) return;
    const trimmed = value?.trim() ?? '';
    payload[targetField] = trimmed ? trimmed : null;
  };

  assignField('email', input.email);
  assignField('name', input.name);
  assignField('phone', input.phone);
  assignField('whatsapp', input.whatsapp);
  assignField('acercaDe', input.about);

  if (input.password !== undefined) {
    const trimmed = input.password.trim();
    if (trimmed) {
      payload.password = trimmed;
    }
  }

  if (Object.keys(payload).length) {
    await parseRequest(`/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  return fetchUserById(userId);
};

export const deleteCustomerAccount = async (userId: string, roleName = 'customer'): Promise<void> => {
  if (HAS_BACKEND) {
    try {
      const query = roleName ? `?role=${encodeURIComponent(roleName)}` : '';
      await backendRequest<void>(`/api/customers/${userId}${query}`, {
        method: 'DELETE',
      });
      return;
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error instanceof Error ? error : new Error('No se pudo eliminar el cliente.');
      }
      console.warn('No se pudo usar el backend para eliminar el cliente, intentando directamente en Parse.', error);
    }
  }

  try {
    const role = await fetchRoleByName(roleName);
    if (role) {
      await removeUserFromRole(userId, role.objectId);
    }
  } catch (error) {
    console.warn(`No se pudo quitar el usuario ${userId} del rol ${roleName} en Parse`, error);
  }

  await parseRequest(`/users/${userId}`, {
    method: 'DELETE',
  });
};
