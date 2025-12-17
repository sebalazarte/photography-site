import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';

const PORT = process.env.PORT || 4000;
const PARSE_SERVER_URL = process.env.PARSE_SERVER_URL || 'https://parseapi.back4app.com';
const PARSE_APP_ID = process.env.PARSE_APP_ID;
const PARSE_REST_KEY = process.env.PARSE_REST_KEY;
const PARSE_JS_KEY = process.env.PARSE_JS_KEY || '';
const PARSE_MASTER_KEY = process.env.PARSE_MASTER_KEY || '';

if (!PARSE_APP_ID || !PARSE_REST_KEY) {
  console.warn('Faltan PARSE_APP_ID o PARSE_REST_KEY. Configura las variables de entorno antes de iniciar el servidor.');
}

const withParseHeaders = (inputHeaders = {}) => {
  const headers = new Headers(inputHeaders);
  headers.set('X-Parse-Application-Id', PARSE_APP_ID || '');
  headers.set('X-Parse-REST-API-Key', PARSE_REST_KEY || '');
  if (PARSE_JS_KEY) {
    headers.set('X-Parse-JavaScript-Key', PARSE_JS_KEY);
  }
  if (PARSE_MASTER_KEY) {
    headers.set('X-Parse-Master-Key', PARSE_MASTER_KEY);
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  return headers;
};

const ensureParseReady = () => {
  if (!PARSE_APP_ID || !PARSE_REST_KEY) {
    throw new Error('Configura PARSE_APP_ID y PARSE_REST_KEY para usar el backend.');
  }
};

const parseRequest = async (path, options = {}) => {
  ensureParseReady();
  const headers = withParseHeaders(options.headers);
  const response = await fetch(`${PARSE_SERVER_URL}${path}`, {
    ...options,
    headers,
  });

  const raw = await response.text();
  if (!response.ok) {
    let message = raw || 'Error en la solicitud';
    try {
      const payload = raw ? JSON.parse(raw) : null;
      message = payload?.error || payload?.message || message;
    } catch {
      // ignoramos errores de parseo
    }
    throw new Error(message);
  }

  if (!raw) {
    return undefined;
  }

  return JSON.parse(raw);
};

const uploadParseFile = async (file) => {
  ensureParseReady();
  const headers = withParseHeaders({
    'Content-Type': file.mimetype || 'application/octet-stream',
  });

  const response = await fetch(`${PARSE_SERVER_URL}/files/${encodeURIComponent(file.originalname)}`, {
    method: 'POST',
    body: file.buffer,
    headers,
  });

  const raw = await response.text();
  if (!response.ok) {
    let message = raw || 'No se pudo subir el archivo';
    try {
      const payload = raw ? JSON.parse(raw) : null;
      message = payload?.error || payload?.message || message;
    } catch {
      // ignoramos errores de parseo
    }
    throw new Error(message);
  }

  return JSON.parse(raw);
};

const BATCH_LIMIT = 50;

const runBatch = async (requests) => {
  if (!requests.length) return;
  for (let index = 0; index < requests.length; index += BATCH_LIMIT) {
    const chunk = requests.slice(index, index + BATCH_LIMIT);
    await parseRequest('/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: chunk }),
    });
  }
};

const slugify = (str) =>
  str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    || `galeria-${Date.now()}`;

const galleryFolderKey = (slug) => `galleries/${slug}`;

const encodeWhere = (query) => encodeURIComponent(JSON.stringify(query));

const escapeRegex = (value) => (typeof value === 'string' ? value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '');

const mapToCustomerRecord = (entry) => ({
  id: entry.objectId,
  username: entry.username,
  name: entry.name ?? entry.username,
  email: entry.email ?? null,
  phone: entry.phone ?? null,
  whatsapp: entry.whatsapp ?? null,
  about: entry.acercaDe ?? null,
});

const fetchRoleByName = async (name) => {
  const where = encodeWhere({
    name: {
      $regex: `^${escapeRegex(name)}$`,
      $options: 'i',
    },
  });
  const data = await parseRequest(`/roles?where=${where}&limit=1`);
  const roles = Array.isArray(data?.results) ? data.results : [];
  return roles[0] ?? null;
};

const addUserToRole = async (userId, roleId) => {
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
};

const fetchUserById = async (userId) => {
  const entry = await parseRequest(`/users/${userId}`);
  return mapToCustomerRecord(entry);
};

const mapPhoto = (entry, index) => ({
  id: entry.objectId,
  filename: entry.photoId ?? entry.photoFile?.name ?? entry.objectId,
  originalName: entry.originalName ?? entry.photoId ?? entry.photoFile?.name ?? 'Foto sin título',
  url: entry.photoFile?.url ?? '',
  uploadedAt: entry.updatedAt ?? entry.createdAt,
  size: entry.fileSize ?? null,
  order: index,
});

const fetchPhotoOrders = async (folderKey) => {
  const where = encodeWhere({ folderKey });
  const data = await parseRequest(`/classes/PhotoOrder?where=${where}&order=position,createdAt&limit=1000`);
  const entries = Array.isArray(data?.results) ? data.results : [];

  const sorted = [...entries].sort((a, b) => {
    const posA = Number.isFinite(a.position) ? a.position : Number.MAX_SAFE_INTEGER;
    const posB = Number.isFinite(b.position) ? b.position : Number.MAX_SAFE_INTEGER;
    if (posA !== posB) return posA - posB;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  let needsNormalization = false;
  sorted.forEach((item, index) => {
    if (!Number.isFinite(item.position) || item.position !== index) {
      needsNormalization = true;
    }
  });

  if (needsNormalization) {
    const requests = sorted.map((entry, index) => ({
      method: 'PUT',
      path: `/parse/classes/PhotoOrder/${entry.objectId}`,
      body: { position: index },
    }));
    await runBatch(requests);
    sorted.forEach((entry, index) => {
      entry.position = index;
    });
  }

  return sorted.map(mapPhoto);
};

const findGalleryBySlug = async (slug) => {
  const where = encodeWhere({ slug });
  const data = await parseRequest(`/classes/Gallery?where=${where}&limit=1`);
  return Array.isArray(data?.results) ? data.results[0] ?? null : null;
};

const deleteFolderPhotoOrders = async (folderKey) => {
  const where = encodeWhere({ folderKey });
  const data = await parseRequest(`/classes/PhotoOrder?where=${where}&limit=1000`);
  const entries = Array.isArray(data?.results) ? data.results : [];
  const requests = entries.map((entry) => ({
    method: 'DELETE',
    path: `/parse/classes/PhotoOrder/${entry.objectId}`,
  }));
  await runBatch(requests);
};

const ensureUniqueSlug = async (name) => {
  const base = slugify(name);
  const data = await parseRequest('/classes/Gallery?limit=1000');
  const existing = new Set((data?.results ?? []).map((gallery) => gallery.slug));
  if (!existing.has(base)) {
    return base;
  }
  let counter = 2;
  let candidate = `${base}-${counter}`;
  while (existing.has(candidate)) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }
  return candidate;
};

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

app.get('/api/customers', async (req, res, next) => {
  try {
    const roleName = typeof req.query.role === 'string' && req.query.role.trim() ? req.query.role.trim() : 'customer';
    const role = await fetchRoleByName(roleName);
    if (!role) {
      return res.json([]);
    }
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
    const users = Array.isArray(data?.results) ? data.results.map(mapToCustomerRecord) : [];
    res.json(users);
  } catch (error) {
    next(error);
  }
});

app.post('/api/customers', async (req, res, next) => {
  try {
    const {
      username: rawUsername,
      password: rawPassword,
      email,
      name,
      phone,
      whatsapp,
      about,
      roleName,
    } = req.body || {};

    const username = typeof rawUsername === 'string' ? rawUsername.trim() : '';
    const password = typeof rawPassword === 'string' ? rawPassword.trim() : '';

    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son obligatorios.' });
    }

    const payload = {
      username,
      password,
    };

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

    const resolvedRoleName = typeof roleName === 'string' && roleName.trim() ? roleName.trim() : 'customer';
    try {
      const role = await fetchRoleByName(resolvedRoleName);
      if (role) {
        await addUserToRole(created.objectId, role.objectId);
      }
    } catch (roleError) {
      console.warn('No se pudo asignar el rol al usuario', roleError);
    }

    const user = await fetchUserById(created.objectId);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

app.put('/api/customers/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = {};

    const assignField = (field, value, targetField = field) => {
      if (value === undefined) return;
      const trimmed = typeof value === 'string' ? value.trim() : '';
      updates[targetField] = trimmed ? trimmed : null;
    };

    assignField('email', req.body?.email);
    assignField('name', req.body?.name);
    assignField('phone', req.body?.phone);
    assignField('whatsapp', req.body?.whatsapp);
    assignField('about', req.body?.about, 'acercaDe');

    if (typeof req.body?.password === 'string') {
      const trimmed = req.body.password.trim();
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
    res.json(user);
  } catch (error) {
    next(error);
  }
});

app.get('/api/photos', async (req, res, next) => {
  try {
    const folder = typeof req.query.folder === 'string' ? req.query.folder : null;
    if (!folder) {
      return res.status(400).json({ message: 'folder requerido' });
    }
    const photos = await fetchPhotoOrders(folder);
    res.json(photos);
  } catch (error) {
    next(error);
  }
});

app.post('/api/photos', upload.array('photos', 12), async (req, res, next) => {
  try {
    const folder = typeof req.query.folder === 'string' ? req.query.folder : null;
    if (!folder) {
      return res.status(400).json({ message: 'folder requerido' });
    }

    const incoming = Array.isArray(req.files) ? req.files : [];
    if (!incoming.length) {
      const photos = await fetchPhotoOrders(folder);
      return res.json(photos);
    }

    const existing = await fetchPhotoOrders(folder);
    let nextPosition = existing.length;

    for (const file of incoming) {
      const uploaded = await uploadParseFile(file);
      const body = {
        folderKey: folder,
        photoId: uploaded.name,
        position: nextPosition,
        originalName: file.originalname,
        fileSize: file.size,
        photoFile: {
          __type: 'File',
          name: uploaded.name,
        },
      };
      nextPosition += 1;
      await parseRequest('/classes/PhotoOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    }

    const photos = await fetchPhotoOrders(folder);
    res.status(201).json(photos);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/photos', async (req, res, next) => {
  try {
    const folder = typeof req.query.folder === 'string' ? req.query.folder : null;
    const photoId = typeof req.query.id === 'string'
      ? req.query.id
      : typeof req.query.photoId === 'string'
        ? req.query.photoId
        : typeof req.query.filename === 'string'
          ? req.query.filename
          : null;
    if (!folder || !photoId) {
      return res.status(400).json({ message: 'folder e id requeridos' });
    }

    try {
      await parseRequest(`/classes/PhotoOrder/${photoId}`, { method: 'DELETE' });
    } catch (error) {
      console.warn('No se pudo eliminar el registro en Parse', error);
    }

    const photos = await fetchPhotoOrders(folder);
    res.json(photos);
  } catch (error) {
    next(error);
  }
});

app.put('/api/photos/order', async (req, res, next) => {
  try {
    const folder = typeof req.body?.folder === 'string' ? req.body.folder : null;
    const order = Array.isArray(req.body?.order) ? req.body.order : null;
    if (!folder || !order) {
      return res.status(400).json({ message: 'folder y order requeridos' });
    }

    for (let index = 0; index < order.length; index += 1) {
      const objectId = order[index];
      await parseRequest(`/classes/PhotoOrder/${objectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ position: index }),
      });
    }
    const photos = await fetchPhotoOrders(folder);
    res.json(photos);
  } catch (error) {
    next(error);
  }
});

app.get('/api/galleries', async (_req, res, next) => {
  try {
    const data = await parseRequest('/classes/Gallery?order=slug');
    res.json(Array.isArray(data?.results) ? data.results.map(({ name, slug }) => ({ name, slug })) : []);
  } catch (error) {
    next(error);
  }
});

app.post('/api/galleries', async (req, res, next) => {
  try {
    const name = (req.body?.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'nombre requerido' });
    }
    const slug = await ensureUniqueSlug(name);
    await parseRequest('/classes/Gallery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, slug }),
    });
    const data = await parseRequest('/classes/Gallery?order=slug');
    res.status(201).json(Array.isArray(data?.results) ? data.results.map(({ name: n, slug: s }) => ({ name: n, slug: s })) : []);
  } catch (error) {
    next(error);
  }
});

app.put('/api/galleries/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const name = (req.body?.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'nombre requerido' });
    }
    const gallery = await findGalleryBySlug(slug);
    if (!gallery) {
      return res.status(404).json({ message: 'Galería no encontrada' });
    }
    await parseRequest(`/classes/Gallery/${gallery.objectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    const data = await parseRequest('/classes/Gallery?order=slug');
    res.json(Array.isArray(data?.results) ? data.results.map(({ name: n, slug: s }) => ({ name: n, slug: s })) : []);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/galleries/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const gallery = await findGalleryBySlug(slug);
    if (!gallery) {
      return res.status(404).json({ message: 'Galería no encontrada' });
    }
    await deleteFolderPhotoOrders(galleryFolderKey(slug));
    await parseRequest(`/classes/Gallery/${gallery.objectId}`, {
      method: 'DELETE',
    });
    const data = await parseRequest('/classes/Gallery?order=slug');
    res.json(Array.isArray(data?.results) ? data.results.map(({ name: n, slug: s }) => ({ name: n, slug: s })) : []);
  } catch (error) {
    next(error);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Error inesperado' });
});

const start = () => {
  app.listen(PORT, () => {
    console.log(`Servidor listo en http://localhost:${PORT}`);
  });
};

const isDirectRun = process.argv[1] && process.argv[1].endsWith('index.js');

if (isDirectRun) {
  start();
}

export { app, start };
