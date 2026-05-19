const crypto = require('crypto');
const fs = require('fs');

try {
    const sa = JSON.parse(fs.readFileSync('src/lib/service-account.json', 'utf8'));
    const key = sa.private_key;

    const sign = crypto.createSign('SHA256');
    sign.update('test');
    const signature = sign.sign(key, 'base64');
    console.log('SUCCESS: Successfully signed data with the private key.');
    console.log('Signature length:', signature.length);
} catch (e) {
    console.log('FAILURE: Could not sign with the private key:', e.message);
}
