import { listEvents } from './google-calendar.js';
import { addWeeks, startOfDay, eachDayOfInterval, isWeekend } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const TZ = 'America/Chicago';
const WEEKS_AHEAD = 8;

export interface Slot {
  start: string; // ISO string (UTC)
  end: string;   // ISO string (UTC)
  label: string; // e.g. "7:00 PM – 8:00 PM"
}

interface Candidate { hour: number; minute: number }

function weekdaySlots(): Candidate[] {
  return [{ hour: 19, minute: 0 }]; // 7:00 PM CT
}

function weekendSlots(): Candidate[] {
  // On-the-hour and half-hour slots from 1pm, ending by 4pm
  return [
    { hour: 13, minute: 0  }, // 1:00 – 2:00
    { hour: 13, minute: 30 }, // 1:30 – 2:30
    { hour: 14, minute: 0  }, // 2:00 – 3:00
    { hour: 14, minute: 30 }, // 2:30 – 3:30
    { hour: 15, minute: 0  }, // 3:00 – 4:00
  ];
}

function formatSlotLabel(hour: number, minute: number): string {
  const fmt = (h: number, m: number) => {
    const suffix = h >= 12 ? 'PM' : 'AM';
    const display = h > 12 ? h - 12 : h;
    return m === 0 ? `${display}:00 ${suffix}` : `${display}:30 ${suffix}`;
  };
  const endTotalMinutes = hour * 60 + minute + 60;
  const endHour = Math.floor(endTotalMinutes / 60);
  const endMinute = endTotalMinutes % 60;
  return `${fmt(hour, minute)} – ${fmt(endHour, endMinute)}`;
}

function overlaps(
  slotStart: Date,
  slotEnd: Date,
  eventStart: string,
  eventEnd: string
): boolean {
  const es = new Date(eventStart).getTime();
  const ee = new Date(eventEnd).getTime();
  const ss = slotStart.getTime();
  const se = slotEnd.getTime();
  return ss < ee && se > es;
}

export async function getAvailableSlots(): Promise<Slot[]> {
  const now = new Date();
  const windowEnd = addWeeks(now, WEEKS_AHEAD);

  const [recordingEvents, blackoutEvents] = await Promise.all([
    listEvents(process.env.RECORDINGS_CALENDAR_ID!, now, windowEnd),
    listEvents(process.env.BLACKOUT_CALENDAR_ID!, now, windowEnd),
  ]);
  const blockedEvents = [...recordingEvents, ...blackoutEvents];

  const days = eachDayOfInterval({ start: startOfDay(now), end: startOfDay(windowEnd) });

  const slots: Slot[] = [];

  for (const day of days) {
    const zonedDay = toZonedTime(day, TZ);
    const weekend = isWeekend(zonedDay);
    const candidates = weekend ? weekendSlots() : weekdaySlots();

    for (const { hour, minute } of candidates) {
      const slotStartLocal = new Date(
        zonedDay.getFullYear(),
        zonedDay.getMonth(),
        zonedDay.getDate(),
        hour, minute, 0, 0
      );
      const slotEndLocal = new Date(slotStartLocal.getTime() + 60 * 60 * 1000);

      const slotStart = fromZonedTime(slotStartLocal, TZ);
      const slotEnd = fromZonedTime(slotEndLocal, TZ);

      if (slotStart.getTime() < now.getTime() + 2 * 60 * 60 * 1000) continue;

      const blocked = blockedEvents.some((e) =>
        overlaps(slotStart, slotEnd, e.start, e.end)
      );
      if (blocked) continue;

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        label: formatSlotLabel(hour, minute),
      });
    }
  }

  return slots;
}
