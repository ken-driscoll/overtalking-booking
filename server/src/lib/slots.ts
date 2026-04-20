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

function weekdaySlots(localDate: Date): Array<{ hour: number }> {
  return [{ hour: 19 }]; // 7pm CT
}

function weekendSlots(localDate: Date): Array<{ hour: number }> {
  return [{ hour: 13 }, { hour: 14 }, { hour: 15 }]; // 1pm, 2pm, 3pm CT
}

function formatSlotLabel(startHour: number): string {
  const fmt = (h: number) => {
    const suffix = h >= 12 ? 'PM' : 'AM';
    const display = h > 12 ? h - 12 : h;
    return `${display}:00 ${suffix}`;
  };
  return `${fmt(startHour)} – ${fmt(startHour + 1)}`;
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
    // Work in CT local time
    const zonedDay = toZonedTime(day, TZ);
    const weekend = isWeekend(zonedDay);
    const candidates = weekend ? weekendSlots(zonedDay) : weekdaySlots(zonedDay);

    for (const { hour } of candidates) {
      // Build slot start/end in CT, convert to UTC
      const slotStartLocal = new Date(
        zonedDay.getFullYear(),
        zonedDay.getMonth(),
        zonedDay.getDate(),
        hour, 0, 0, 0
      );
      const slotEndLocal = new Date(slotStartLocal);
      slotEndLocal.setHours(slotEndLocal.getHours() + 1);

      const slotStart = fromZonedTime(slotStartLocal, TZ);
      const slotEnd = fromZonedTime(slotEndLocal, TZ);

      // Skip slots in the past (with 2-hour buffer)
      if (slotStart.getTime() < now.getTime() + 2 * 60 * 60 * 1000) continue;

      // Skip if any blocked event overlaps
      const blocked = blockedEvents.some((e) =>
        overlaps(slotStart, slotEnd, e.start, e.end)
      );
      if (blocked) continue;

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        label: formatSlotLabel(hour),
      });
    }
  }

  return slots;
}
