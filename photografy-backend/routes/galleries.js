import { Router } from 'express';
import {
  createGallery,
  deleteGallery,
  listGalleries,
  updateGalleryPositions,
  updateGalleryName,
} from '../services/galleries.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const galleries = await listGalleries();
    res.json(galleries);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const galleries = await createGallery(req.body?.name || '');
    res.status(201).json(galleries);
  } catch (error) {
    next(error);
  }
});

router.put('/:slug', async (req, res, next) => {
  try {
    const galleries = await updateGalleryName(req.params.slug, req.body?.name || '');
    res.json(galleries);
  } catch (error) {
    next(error);
  }
});

router.put('/positions/bulk', async (req, res, next) => {
  try {
    const positions = Array.isArray(req.body?.positions) ? req.body.positions : [];
    const galleries = await updateGalleryPositions(positions);
    res.json(galleries);
  } catch (error) {
    next(error);
  }
});

router.delete('/:slug', async (req, res, next) => {
  try {
    const galleries = await deleteGallery(req.params.slug);
    res.json(galleries);
  } catch (error) {
    next(error);
  }
});

export default router;
