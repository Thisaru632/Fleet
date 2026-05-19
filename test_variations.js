const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function testVariations() {
    const sa = JSON.parse(fs.readFileSync('src/lib/service-account.json', 'utf8'));
    const email = sa.client_email;
    const rawKey = sa.private_key;

    const variations = [
        { name: 'Original', key: rawKey },
        { name: 'No whitespace in body', key: (function() {
            const h = '-----BEGIN PRIVATE KEY-----';
            const f = '-----END PRIVATE KEY-----';
            const b = rawKey.replace(h, '').replace(f, '').replace(/\s+/g, '');
            return `${h}\n${b}\n${f}\n`;
        })() },
        { name: '64-char lines', key: (function() {
            const h = '-----BEGIN PRIVATE KEY-----';
            const f = '-----END PRIVATE KEY-----';
            const b = rawKey.replace(h, '').replace(f, '').replace(/\s+/g, '');
            const lines = [];
            for (let i = 0; i < b.length; i += 64) lines.push(b.substring(i, i + 64));
            return `${h}\n${lines.join('\n')}\n${f}\n`;
        })() },
        { name: 'No trailing newline', key: rawKey.trim() }
    ];

    for (const v of variations) {
        console.log(`Testing variation: ${v.name}...`);
        try {
            const auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: email,
                    private_key: v.key
                },
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
            const client = await auth.getClient();
            await client.authorize();
            console.log(`  SUCCESS!`);
            process.exit(0);
        } catch (e) {
            console.log(`  FAILED: ${e.message}`);
        }
    }
    
    console.log('\nAll variations failed. This strongly suggests either:');
    console.log('1. The clock skew (System is ~50 mins ahead)');
    console.log('2. The key/email mismatch.');
    console.log('3. The key has been revoked.');
}

testVariations();
