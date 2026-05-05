const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config({path: '.env.local'});

const rawKey = process.env.GOOGLE_PRIVATE_KEY;
console.log('Raw key length:', rawKey?.length);

const formattedKey = rawKey.replace(/\\n/g, '\n').replace(/"/g, '');
console.log('Formatted key start:', JSON.stringify(formattedKey.substring(0, 40)));

try {
    crypto.createPrivateKey(formattedKey);
    console.log('SUCCESS: Key is valid and recognized by OpenSSL');
} catch (e) {
    console.log('FAILURE: OpenSSL error:', e.message);
    
    // Try to fix it?
    console.log('Attempting auto-fix (cleaning internal whitespace)...');
    const base64Part = formattedKey
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\s+/g, '');
    const fixedKey = `-----BEGIN PRIVATE KEY-----\n${base64Part}\n-----END PRIVATE KEY-----`;
    
    try {
        crypto.createPrivateKey(fixedKey);
        console.log('AUTO-FIX SUCCESS: Cleaned key is valid!');
        fs.writeFileSync('fixed_key.txt', fixedKey);
    } catch (e2) {
        console.log('AUTO-FIX FAILURE:', e2.message);
    }
}
