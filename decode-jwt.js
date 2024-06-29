// decode-jwt.js

const jwt = require('jsonwebtoken');

// Get the JWT from the command line arguments
const token = process.argv[2];

if (!token) {
  console.error('Error: No JWT provided. Usage: node decode-jwt.js <jwt>');
  process.exit(1);
}

// Decode the JWT without verifying the signature
const decoded = jwt.decode(token, { complete: true });

if (!decoded) {
  console.error('Error: Invalid JWT');
  process.exit(1);
}

console.log('Decoded JWT:', JSON.stringify(decoded, null, 2));
