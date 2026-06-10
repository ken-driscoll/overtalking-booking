import { Router } from 'express';
import { addMonths, subMonths } from 'date-fns';
import { listEvents } from '../lib/google-calendar.js';

const router = Router();

// Summaries of recordings booked within ±2 months. The October theme dropdown
// intersects these against its film list to hide already-booked films.
router.get('/', async (req, res) => {
  if (!req.session?.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const now = new Date();
    const events = await listEvents(
      process.env.RECORDINGS_CALENDAR_ID!,
      subMonths(now, 2),
      addMonths(now, 2)
    );
    res.json(events.map((e) => e.summary.trim()).filter(Boolean));
  } catch (err) {
    console.error('Failed to fetch booked movies:', err);
    res.status(500).json({ error: 'Failed to fetch booked movies' });
  }
});

export default router;
