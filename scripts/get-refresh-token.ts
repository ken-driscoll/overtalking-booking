/**
 * One-time script to obtain a refresh token for the Overtalking Google account.
 * Run with: npx tsx scripts/get-refresh-token.ts
 * Sign in as overtalkingpod@gmail.com when prompted.
 * Copy the printed refresh token into your .env file.
 */

import { google } from 'googleapis';
import * as readline from 'readline';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment first.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob'
);

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
console.log('');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Paste the authorization code here: ', async (code) => {
  rl.close();
  const { tokens } = await oauth2Client.getToken(code.trim());
  console.log('\n✅ Success! Add this to your .env file:\n');
  console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
});
