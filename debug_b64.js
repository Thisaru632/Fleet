const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const b64 = process.env.GOOGLE_PRIVATE_KEY_B64;
if (!b64) {
    console.log('GOOGLE_PRIVATE_KEY_B64 not found in .env.local');
    process.exit(1);
}

const decoded = Buffer.from(b64, 'base64').toString('utf8');
console.log('Decoded start:', JSON.stringify(decoded.substring(0, 50)));
console.log('Decoded end:', JSON.stringify(decoded.substring(decoded.length - 50)));

// Check if it has literal \n or actual newlines
if (decoded.includes('\\n')) {
    console.log('FOUND literal \\n in decoded string!');
} else {
    console.log('No literal \\n found.');
}

if (decoded.includes('\n')) {
    console.log('FOUND actual newlines in decoded string!');
}

try {
    const crypto = require('crypto');
    crypto.createPrivateKey(decoded);
    console.log('SUCCESS: Key is valid for crypto.createPrivateKey');
} catch (e) {
    console.log('FAILURE: Key is INVALID for crypto.createPrivateKey:', e.message);
}
