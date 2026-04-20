import { Router } from 'express';
import { getAvailableSlots } from '../lib/slots.js';

const router = Router();

router.get('/', async (req, res) => {
  if (!req.session?.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const slots = await getAvailableSlots();
    res.json(slots);
  } catch (err) {
    console.error('Failed to fetch slots:', err);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

export default router;
