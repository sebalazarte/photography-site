import { Router } from 'express';
import multer from 'multer';
import { deletePhoto, listPhotos, updatePhotoOrder, uploadPhotos } from '../services/photos.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const folder = typeof req.query.folder === 'string' ? req.query.folder : null;
    if (!folder) {
      return res.status(400).json({ message: 'folder requerido' });
    }
    const photos = await listPhotos(folder);
    res.json(photos);
  } catch (error) {
    next(error);
  }
});

router.post('/', upload.array('photos', 12), async (req, res, next) => {
  try {
    const folder = typeof req.query.folder === 'string' ? req.query.folder : null;
    if (!folder) {
      return res.status(400).json({ message: 'folder requerido' });
    }

    const incoming = Array.isArray(req.files) ? req.files : [];
    if (!incoming.length) {
      const photos = await listPhotos(folder);
      return res.json(photos);
    }

    const photos = await uploadPhotos(folder, incoming);
    res.status(201).json(photos);
  } catch (error) {
    next(error);
  }
});

router.delete('/', async (req, res, next) => {
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
      const photos = await deletePhoto(folder, photoId);
      res.json(photos);
    } catch (deleteError) {
      console.warn('No se pudo eliminar el registro en Parse', deleteError);
      const photos = await listPhotos(folder);
      res.json(photos);
    }
  } catch (error) {
    next(error);
  }
});

router.put('/order', async (req, res, next) => {
  try {
    const folder = typeof req.body?.folder === 'string' ? req.body.folder : null;
    const order = Array.isArray(req.body?.order) ? req.body.order : null;
    if (!folder || !order) {
      return res.status(400).json({ message: 'folder y order requeridos' });
    }

    const photos = await updatePhotoOrder(folder, order);
    res.json(photos);
  } catch (error) {
    next(error);
  }
});

export default router;
