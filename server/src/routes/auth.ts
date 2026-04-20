import { Router } from 'express';

const router = Router();

router.post('/verify-token', async (req, res) => {
  const { accessToken } = req.body as { accessToken?: string };
  if (!accessToken) {
    res.status(400).json({ error: 'Missing accessToken' });
    return;
  }

  try {
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userInfoRes.ok) {
      res.status(401).json({ error: 'Invalid access token' });
      return;
    }

    const info = await userInfoRes.json() as { email?: string; name?: string };
    if (!info.email) {
      res.status(401).json({ error: 'Could not retrieve email' });
      return;
    }

    req.session!.user = {
      email: info.email,
      name: info.name ?? info.email,
    };

    res.json({ email: info.email, name: info.name });
  } catch {
    res.status(401).json({ error: 'Token verification failed' });
  }
});

router.post('/signout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const user = req.session?.user;
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json(user);
});

export default router;
