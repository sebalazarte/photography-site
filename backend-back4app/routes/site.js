import { Router } from 'express';
import { getSiteProfile, updateSiteProfile, updateSiteAbout } from '../services/site.js';

const router = Router();

const resolveSiteId = (req) => {
  const siteId = typeof req.query?.siteId === 'string' ? req.query.siteId.trim() : '';
  return siteId || null;
};

router.get('/', async (req, res, next) => {
  try {
    const siteId = resolveSiteId(req);
    if (!siteId) {
      return res.status(400).json({ message: 'siteId requerido' });
    }
    const profile = await getSiteProfile(siteId);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const siteId = resolveSiteId(req);
    if (!siteId) {
      return res.status(400).json({ message: 'siteId requerido' });
    }
    const profile = await updateSiteProfile(siteId, req.body ?? {});
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

router.put('/about', async (req, res, next) => {
  try {
    const siteId = resolveSiteId(req);
    if (!siteId) {
      return res.status(400).json({ message: 'siteId requerido' });
    }
    const about = typeof req.body?.about === 'string' ? req.body.about : '';
    const profile = await updateSiteAbout(siteId, about);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

export default router;