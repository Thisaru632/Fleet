import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive'
];

let cachedAuth: any = null;
let cachedSheets: any = null;
let cachedDrive: any = null;

export async function getGoogleAuth() {
  if (cachedAuth) return cachedAuth;

  const jsonPath = path.join(process.cwd(), 'src/lib/service-account.json');
  console.log('Attempting auth. JSON path:', jsonPath);
  
  // If the service-account.json exists, use it directly (Most Reliable)
  if (fs.existsSync(jsonPath)) {
    console.log('Using service-account.json file for auth');
    cachedAuth = new google.auth.GoogleAuth({
      keyFile: jsonPath,
      scopes: SCOPES,
    });
    return cachedAuth;
  }
  console.log('service-account.json not found, falling back to env vars');

  // Fallback to Environment Variables
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (process.env.GOOGLE_PRIVATE_KEY_B64) {
    privateKey = Buffer.from(process.env.GOOGLE_PRIVATE_KEY_B64, 'base64').toString('utf8');
  }

  const formattedKey = privateKey
    ? privateKey.replace(/\\n/g, '\n').replace(/"/g, '').trim()
    : undefined;

  cachedAuth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: formattedKey,
    },
    scopes: SCOPES,
  });

  return cachedAuth;
}

export async function getSheets() {
  if (cachedSheets) return cachedSheets;
  const auth = await getGoogleAuth();
  cachedSheets = google.sheets({ version: 'v4', auth });
  return cachedSheets;
}

export async function getDrive() {
  if (cachedDrive) return cachedDrive;
  const auth = await getGoogleAuth();
  cachedDrive = google.drive({ version: 'v3', auth });
  return cachedDrive;
}
