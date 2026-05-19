const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'src/lib/service-account.json');
if (!fs.existsSync(jsonPath)) {
    console.log('File not found');
    process.exit(1);
}

try {
    const content = fs.readFileSync(jsonPath, 'utf8');
    const sa = JSON.parse(content);
    let key = sa.private_key;

    console.log('Original key length:', key.length);

    // Clean the key
    const header = '-----BEGIN PRIVATE KEY-----';
    const footer = '-----END PRIVATE KEY-----';
    
    let body = key;
    if (body.includes(header)) body = body.replace(header, '');
    if (body.includes(footer)) body = body.replace(footer, '');
    
    // Remove ALL whitespace from the body
    body = body.replace(/\s+/g, '');
    
    // Reconstruct with proper newlines
    // Google usually likes it in one block or with 64-char lines. 
    // But most importantly, the header and footer must be on their own lines.
    const fixedKey = `${header}\n${body}\n${footer}\n`;
    
    sa.private_key = fixedKey;
    
    fs.writeFileSync(jsonPath, JSON.stringify(sa, null, 2));
    console.log('SUCCESS: Fixed service-account.json');
    
    // Also generate B64 for .env.local just in case
    const b64 = Buffer.from(fixedKey).toString('base64');
    console.log('\n--- NEW B64 KEY (Copy this if needed) ---\n');
    console.log(b64);
    console.log('\n-----------------------------------------\n');

} catch (e) {
    console.error('Error:', e.message);
}
