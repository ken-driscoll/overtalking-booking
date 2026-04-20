/**
 * One-time script to obtain a refresh token for the Overtalking Google account.
 * Run with: npx tsx scripts/get-refresh-token.ts
 * Sign in as overtalkingpod@gmail.com when the browser opens.
 * The refresh token will be printed to the terminal.
 */

import { google } from 'googleapis';
import * as http from 'http';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:8080';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment first.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ],
});

console.log('\nOpen this URL in your browser and sign in as overtalkingpod@gmail.com:\n');
console.log(authUrl);
console.log('\nWaiting for Google to redirect back...\n');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url!, `http://localhost:8080`);
  const code = url.searchParams.get('code');

  if (!code) {
    res.writeHead(400);
    res.end('Missing code parameter.');
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<html><body><h2>Success! You can close this tab and return to the terminal.</h2></body></html>');
  server.close();

  const { tokens } = await oauth2Client.getToken(code);
  console.log('✅ Success! Add this to your .env file:\n');
  console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
});

server.listen(8080);
