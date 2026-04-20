interface ZoomTokenResponse {
  access_token: string;
  expires_in: number;
}

interface ZoomMeeting {
  joinUrl: string;
  meetingId: number;
  password: string;
}

async function getAccessToken(): Promise<string> {
  const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env;
  const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Zoom auth failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as ZoomTokenResponse;
  return data.access_token;
}

export async function createZoomMeeting(
  topic: string,
  startTime: Date,
  durationMinutes = 60
): Promise<ZoomMeeting> {
  const token = await getAccessToken();

  const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic,
      type: 2, // scheduled meeting
      start_time: startTime.toISOString(),
      duration: durationMinutes,
      timezone: 'America/Chicago',
      settings: {
        waiting_room: false,
        join_before_host: true,
        auto_recording: 'none',
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Zoom meeting creation failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as { join_url: string; id: number; password: string };
  return {
    joinUrl: data.join_url,
    meetingId: data.id,
    password: data.password,
  };
}
