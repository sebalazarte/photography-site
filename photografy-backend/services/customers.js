import {
  parseRequest,
  encodeWhere,
  fetchRoleByName,
  addUserToRole,
  removeUserFromRole,
  fetchUserById,
} from '../lib/parseClient.js';

const mapToCustomerRecord = (entry) => ({
  id: entry.objectId,
  username: entry.username,
  name: entry.name ?? entry.username,
  email: entry.email ?? null,
  phone: entry.phone ?? null,
  whatsapp: entry.whatsapp ?? null,
  about: entry.acercaDe ?? null,
});

const listCustomers = async (roleName = 'customer') => {
  const role = await fetchRoleByName(roleName);
  if (!role) return [];

  const where = encodeWhere({
    $relatedTo: {
      object: {
        __type: 'Pointer',
        className: '_Role',
        objectId: role.objectId,
      },
      key: 'users',
    },
  });

  const data = await parseRequest(`/users?where=${where}&order=username`);
  return Array.isArray(data?.results) ? data.results.map(mapToCustomerRecord) : [];
};

const createCustomer = async ({
  username: rawUsername,
  password: rawPassword,
  email,
  name,
  phone,
  whatsapp,
  about,
  roleName = 'customer',
}) => {
  const username = typeof rawUsername === 'string' ? rawUsername.trim() : '';
  const password = typeof rawPassword === 'string' ? rawPassword.trim() : '';

  if (!username || !password) {
    throw new Error('Usuario y contraseña son obligatorios.');
  }

  const payload = { username, password };

  if (typeof email === 'string' && email.trim()) payload.email = email.trim();
  if (typeof name === 'string' && name.trim()) payload.name = name.trim();
  if (typeof phone === 'string' && phone.trim()) payload.phone = phone.trim();
  if (typeof whatsapp === 'string' && whatsapp.trim()) payload.whatsapp = whatsapp.trim();
  if (typeof about === 'string' && about.trim()) payload.acercaDe = about.trim();

  const created = await parseRequest('/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  try {
    const role = await fetchRoleByName(roleName);
    if (role) {
      await addUserToRole(created.objectId, role.objectId);
    }
  } catch (error) {
    console.warn('No se pudo asignar el rol al usuario', error);
  }

  const user = await fetchUserById(created.objectId);
  return mapToCustomerRecord(user);
};

const updateCustomer = async (id, {
  email,
  name,
  phone,
  whatsapp,
  about,
  password,
}) => {
  const updates = {};

  const assignField = (field, value, targetField = field) => {
    if (value === undefined) return;
    const trimmed = typeof value === 'string' ? value.trim() : '';
    updates[targetField] = trimmed ? trimmed : null;
  };

  assignField('email', email);
  assignField('name', name);
  assignField('phone', phone);
  assignField('whatsapp', whatsapp);
  assignField('about', about, 'acercaDe');

  if (typeof password === 'string') {
    const trimmed = password.trim();
    if (trimmed) {
      updates.password = trimmed;
    }
  }

  if (Object.keys(updates).length) {
    await parseRequest(`/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
  }

  const user = await fetchUserById(id);
  return mapToCustomerRecord(user);
};

const deleteCustomer = async (id, roleName = 'customer') => {
  try {
    const role = await fetchRoleByName(roleName);
    if (role) {
      await removeUserFromRole(id, role.objectId);
    }
  } catch (error) {
    console.warn(`No se pudo quitar el usuario ${id} del rol ${roleName}`, error);
  }

  await parseRequest(`/users/${id}`, {
    method: 'DELETE',
  });
};

export {
  mapToCustomerRecord,
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
