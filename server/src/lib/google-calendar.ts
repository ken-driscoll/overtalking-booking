import { google } from 'googleapis';
import { fromZonedTime } from 'date-fns-tz';

const TZ = 'America/Chicago';

function getOAuth2Client() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return client;
}

export interface CalendarEvent {
  start: string;
  end: string;
  summary: string;
}

export async function listEvents(
  calendarId: string,
  timeMin: Date,
  timeMax: Date
): Promise<CalendarEvent[]> {
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: 'v3', auth });

  const res = await calendar.events.list({
    calendarId,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (res.data.items ?? []).map((e) => {
    // Timed events have dateTime; all-day events have only date (e.g. "2026-04-24").
    // Date-only strings must be parsed as CT midnight, not UTC midnight, otherwise
    // a Friday blackout ends at 2026-04-25T00:00:00Z which equals the 7pm CT slot start.
    const toUtc = (dt?: string | null, d?: string | null): string => {
      if (dt) return dt;
      if (d) return fromZonedTime(new Date(`${d}T00:00:00`), TZ).toISOString();
      return '';
    };
    return {
      start: toUtc(e.start?.dateTime, e.start?.date),
      end: toUtc(e.end?.dateTime, e.end?.date),
      summary: e.summary ?? '',
    };
  });
}

export async function createEvent(
  calendarId: string,
  {
    start,
    end,
    summary,
    guestEmail,
    guestName,
    zoomJoinUrl,
  }: {
    start: Date;
    end: Date;
    summary: string;
    guestEmail: string;
    guestName: string;
    zoomJoinUrl?: string;
  }
): Promise<string> {
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: 'v3', auth });

  const description = zoomJoinUrl
    ? `Recording session with ${guestName} on the Overtalking Podcast.\n\nJoin Zoom Meeting: ${zoomJoinUrl}`
    : `Recording session with ${guestName} on the Overtalking Podcast.`;

  const res = await calendar.events.insert({
    calendarId,
    sendUpdates: 'all',
    requestBody: {
      summary,
      location: zoomJoinUrl,
      start: { dateTime: start.toISOString(), timeZone: 'America/Chicago' },
      end: { dateTime: end.toISOString(), timeZone: 'America/Chicago' },
      attendees: [{ email: guestEmail, displayName: guestName }],
      description,
    },
  });

  return res.data.htmlLink ?? '';
}
