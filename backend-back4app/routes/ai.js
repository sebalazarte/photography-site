import { Router } from 'express';
import { improveDescriptionCopy } from '../services/ai.js';

const router = Router();

router.post('/improve-text', async (req, res, next) => {
  try {
    const text = typeof req.body?.text === 'string' ? req.body.text : '';
    const improved = await improveDescriptionCopy(text);
    res.json({ improved });
  } catch (error) {
    next(error);
  }
});

export default router;
