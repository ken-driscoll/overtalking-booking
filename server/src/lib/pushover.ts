export async function sendPushoverNotification(title: string, message: string): Promise<void> {
  const { PUSHOVER_TOKEN, PUSHOVER_USER_KEY } = process.env;
  if (!PUSHOVER_TOKEN || !PUSHOVER_USER_KEY) return;

  const body = new URLSearchParams({
    token: PUSHOVER_TOKEN,
    user: PUSHOVER_USER_KEY,
    title,
    message,
  });

  const res = await fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    body,
  });

  if (!res.ok) {
    console.error('Pushover notification failed:', await res.text());
  }
}
