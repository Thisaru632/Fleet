const { JWT } = require('google-auth-library');
const fs = require('fs');

async function testWithFudge() {
    try {
        const sa = JSON.parse(fs.readFileSync('src/lib/service-account.json', 'utf8'));
        console.log('Testing with 60-minute clock fudge...');
        
        const client = new JWT({
            email: sa.client_email,
            key: sa.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        // The JWT client uses Date.now() internally.
        // We can temporarily override Date.now()
        const realNow = Date.now;
        Date.now = () => realNow() - 60 * 60 * 1000; // Subtract 60 mins
        
        try {
            await client.authorize();
            console.log('SUCCESS with clock fudge! Your system clock is definitely the problem.');
        } catch (e) {
            console.log('FAILED even with clock fudge:', e.message);
        } finally {
            Date.now = realNow;
        }
    } catch (e) {
        console.error('Script error:', e.message);
    }
}
testWithFudge();
