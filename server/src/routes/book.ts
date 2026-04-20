import { Router } from 'express';
import { createEvent } from '../lib/google-calendar.js';

const router = Router();

router.post('/', async (req, res) => {
  const user = req.session?.user;
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { slotStart, slotEnd, topic } = req.body as {
    slotStart?: string;
    slotEnd?: string;
    topic?: string;
  };

  if (!slotStart || !slotEnd) {
    res.status(400).json({ error: 'slotStart and slotEnd are required' });
    return;
  }

  const start = new Date(slotStart);
  const end = new Date(slotEnd);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    res.status(400).json({ error: 'Invalid slot times' });
    return;
  }

  const summary = topic?.trim() ? topic.trim() : 'Recording';

  try {
    const eventLink = await createEvent(process.env.RECORDINGS_CALENDAR_ID!, {
      start,
      end,
      summary,
      guestEmail: user.email,
      guestName: user.name,
    });

    res.json({ ok: true, eventLink });
  } catch (err) {
    console.error('Failed to create booking:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

export default router;
