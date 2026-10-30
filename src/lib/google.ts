import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

// Google Drive scopes for driver photo uploads (garage meters, fuel/repair receipts)
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive'
];

let cachedAuth: any = null;
let cachedDrive: any = null;

export async function getGoogleAuth() {
  if (cachedAuth) return cachedAuth;

  const jsonPath = path.join(process.cwd(), 'src/lib/service-account.json');
  
  // If service-account.json exists, use it directly
  if (fs.existsSync(jsonPath)) {
    cachedAuth = new google.auth.GoogleAuth({
      keyFile: jsonPath,
      scopes: SCOPES,
    });
    return cachedAuth;
  }

  // Fallback to Environment Variables
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (process.env.GOOGLE_PRIVATE_KEY_B64) {
    const cleanedB64 = process.env.GOOGLE_PRIVATE_KEY_B64.replace(/\s+/g, '');
    privateKey = Buffer.from(cleanedB64, 'base64').toString('utf8');
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

export async function getDrive() {
  if (cachedDrive) return cachedDrive;
  const auth = await getGoogleAuth();
  cachedDrive = google.drive({ version: 'v3', auth });
  return cachedDrive;
}
