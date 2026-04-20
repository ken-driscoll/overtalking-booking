import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: resolve(__dirname, '../../.env') });

import express from 'express';
import cookieSession from 'cookie-session';
import slotsRouter from './routes/slots.js';
import bookRouter from './routes/book.js';
import authRouter from './routes/auth.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());

app.use(
  cookieSession({
    name: 'session',
    secret: process.env.SESSION_SECRET ?? 'dev-secret-change-me',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
);

app.use('/api/auth', authRouter);
app.use('/api/slots', slotsRouter);
app.use('/api/book', bookRouter);

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
