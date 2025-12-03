import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fsp from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4000;
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const HOME_DIR = path.join(SRC_DIR, 'Home');
const GALLERIES_DIR = path.join(SRC_DIR, 'Galeries');
const GALLERIES_DB = path.join(__dirname, 'galleries.json');
const PHOTO_ORDER_DB = path.join(__dirname, 'photo-order.json');

const ensureBaseFolders = async () => {
  await fsp.mkdir(HOME_DIR, { recursive: true });
  await fsp.mkdir(GALLERIES_DIR, { recursive: true });
  await readPhotoOrder();
};

const readGalleries = async () => {
  try {
    const data = await fsp.readFile(GALLERIES_DB, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed.galleries) ? parsed.galleries : [];
  } catch {
    return [];
  }
};

const writeGalleries = async (galleries) => {
  await fsp.writeFile(GALLERIES_DB, JSON.stringify({ galleries }, null, 2));
};

const readPhotoOrder = async () => {
  try {
    const data = await fsp.readFile(PHOTO_ORDER_DB, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fsp.writeFile(PHOTO_ORDER_DB, JSON.stringify({}, null, 2));
      return {};
    }
    throw error;
  }
};

const writePhotoOrder = async (orderMap) => {
  await fsp.writeFile(PHOTO_ORDER_DB, JSON.stringify(orderMap, null, 2));
};

const slugify = (str) =>
  str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    || `galeria-${Date.now()}`;

const sanitizeFolderRequest = (folderParam = '') => {
  const normalized = folderParam.replace(/\\/g, '/').split('/').filter(Boolean);
  if (!normalized.length) throw new Error('folder requerido');
  if (normalized[0] === 'home' && normalized.length === 1) {
    return {
      folderPath: HOME_DIR,
      publicPath: 'Home',
      orderKey: 'home'
    };
  }
  if (normalized[0] === 'galleries' && normalized[1]) {
    const slug = normalized[1];
    return {
      folderPath: path.join(GALLERIES_DIR, slug),
      publicPath: path.join('Galeries', slug).replace(/\\/g, '/'),
      orderKey: `galleries/${slug}`
    };
  }
  throw new Error('folder inválido');
};

const folderMiddleware = async (req, res, next) => {
  try {
    const info = sanitizeFolderRequest(req.query.folder);
    await fsp.mkdir(info.folderPath, { recursive: true });
    req.folderInfo = info;
    next();
  } catch (error) {
    next(error);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!req.folderInfo) return cb(new Error('Sin carpeta destino'));
    cb(null, req.folderInfo.folderPath);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${Date.now()}__${safeName}`);
  }
});

const upload = multer({ storage });

const listFiles = async (info) => {
  try {
    const files = await fsp.readdir(info.folderPath);
    let items = await Promise.all(files.map(async (file) => {
      const stat = await fsp.stat(path.join(info.folderPath, file));
      if (!stat.isFile()) return null;
      const [, original = file] = file.split('__');
      return {
        id: file,
        filename: file,
        originalName: original,
        url: `/media/${info.publicPath}/${file}`.replace(/\\/g, '/'),
        uploadedAt: stat.mtime.toISOString(),
        size: stat.size
      };
    }));

    items = items.filter(Boolean).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    if (!info.orderKey) {
      return items;
    }

    const allOrders = await readPhotoOrder();
    const folderOrders = { ...(allOrders[info.orderKey] ?? {}) };
    const existingIds = new Set();
    const missingIds = [];
    let updated = false;

    items.forEach((item) => {
      existingIds.add(item.id);
      if (typeof folderOrders[item.id] !== 'number') {
        missingIds.push(item.id);
      }
    });

    if (missingIds.length) {
      const maxOrder = Object.values(folderOrders)
        .filter(value => typeof value === 'number')
        .reduce((prev, value) => Math.max(prev, value), 0);
      let nextOrder = maxOrder;
      missingIds.reverse().forEach((id) => {
        nextOrder += 1;
        folderOrders[id] = nextOrder;
      });
      updated = true;
    }

    Object.keys(folderOrders).forEach((id) => {
      if (!existingIds.has(id)) {
        delete folderOrders[id];
        updated = true;
      }
    });

    if (updated) {
      if (Object.keys(folderOrders).length) {
        allOrders[info.orderKey] = folderOrders;
      } else {
        delete allOrders[info.orderKey];
      }
      await writePhotoOrder(allOrders);
    }

    return items
      .map(item => ({ ...item, order: folderOrders[item.id] }))
      .sort((a, b) => {
        const orderDiff = (b.order ?? 0) - (a.order ?? 0);
        if (orderDiff !== 0) return orderDiff;
        const dateDiff = new Date(b.uploadedAt) - new Date(a.uploadedAt);
        if (dateDiff !== 0) return dateDiff;
        return a.id.localeCompare(b.id);
      });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
};

const app = express();
app.use(cors());
app.use(express.json());
app.use('/media', express.static(SRC_DIR));

app.get('/api/photos', async (req, res, next) => {
  try {
    const info = sanitizeFolderRequest(req.query.folder);
    await fsp.mkdir(info.folderPath, { recursive: true });
    const files = await listFiles(info);
    res.json(files);
  } catch (error) {
    next(error);
  }
});

app.post('/api/photos', folderMiddleware, upload.array('photos', 12), async (req, res, next) => {
  try {
    const files = await listFiles(req.folderInfo);
    res.json(files);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/photos', folderMiddleware, async (req, res, next) => {
  try {
    const { filename } = req.query;
    if (!filename) return res.status(400).json({ message: 'filename requerido' });
    await fsp.rm(path.join(req.folderInfo.folderPath, filename));
    const files = await listFiles(req.folderInfo);
    res.json(files);
  } catch (error) {
    next(error);
  }
});

app.get('/api/galleries', async (_req, res, next) => {
  try {
    await ensureBaseFolders();
    const galleries = await readGalleries();
    res.json(galleries);
  } catch (error) {
    next(error);
  }
});

app.post('/api/galleries', async (req, res, next) => {
  try {
    const name = (req.body?.name || '').trim();
    if (!name) return res.status(400).json({ message: 'nombre requerido' });
    const slugBase = slugify(name);
    const galleries = await readGalleries();
    let slug = slugBase;
    let counter = 2;
    while (galleries.some(g => g.slug === slug)) {
      slug = `${slugBase}-${counter++}`;
    }
    await fsp.mkdir(path.join(GALLERIES_DIR, slug), { recursive: true });
    const updated = [...galleries, { name, slug }];
    await writeGalleries(updated);
    res.status(201).json(updated);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/galleries/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const galleries = await readGalleries();
    if (!galleries.some(g => g.slug === slug)) {
      return res.status(404).json({ message: 'Galería no encontrada' });
    }
    await fsp.rm(path.join(GALLERIES_DIR, slug), { recursive: true, force: true });
    const updated = galleries.filter(g => g.slug !== slug);
    await writeGalleries(updated);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Error inesperado' });
});

export const start = async () => {
  await ensureBaseFolders();
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
};

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isDirectRun) {
  if (process.argv.includes('--verify')) {
    ensureBaseFolders()
      .then(() => readGalleries())
      .then((galleries) => {
        console.log(`Base verificada. Galerías registradas: ${galleries.length}`);
        process.exit(0);
      })
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  } else {
    start();
  }
}

export { app };
