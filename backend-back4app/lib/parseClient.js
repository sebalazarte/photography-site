import 'dotenv/config';

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

const encodeWhere = (query) => encodeURIComponent(JSON.stringify(query));

const escapeRegex = (value) => (typeof value === 'string' ? value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '');

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

const fetchUserById = async (userId) => parseRequest(`/users/${userId}`);

const removeUserFromRole = async (userId, roleId) => {
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
};

export {
  PORT,
  parseRequest,
  uploadParseFile,
  runBatch,
  encodeWhere,
  fetchRoleByName,
  addUserToRole,
  removeUserFromRole,
  fetchUserById,
};
