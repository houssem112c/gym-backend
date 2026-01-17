import * as jwt from 'jsonwebtoken';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNTdkYjVjMC01MjJlLTQxMTUtYjExMC0wN2EzYzk1NDRlNmEiLCJlbWFpbCI6ImFkbWluQGd5bS5jb20iLCJpYXQiOjE3Njg2NTg1MDEsImV4cCI6MTc2ODY1OTQwMX0.gvQ60NNbe9hZoZDNMBD0Zb2KqqFhR6FNqWTQvjWiVt0';
const secret = 'your-secret-key-change-this-in-production';

try {
    const decoded = jwt.verify(token, secret);
    console.log('✅ Token is valid!');
    console.log('Decoded payload:', JSON.stringify(decoded, null, 2));
} catch (error: any) {
    console.error('❌ Token verification failed!');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
}
