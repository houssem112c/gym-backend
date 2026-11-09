import * as jwt from 'jsonwebtoken';
import 'dotenv/config';

const token = process.argv[2];
const secret = process.env.JWT_SECRET;

if (!token || !secret) {
    console.error('Usage: npx ts-node verify-token.ts <token>');
    process.exit(1);
}

try {
    const decoded = jwt.verify(token, secret);
    console.log('Token is valid!');
    console.log('Decoded payload:', JSON.stringify(decoded, null, 2));
} catch (error: any) {
    console.error('Token verification failed!');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
}
