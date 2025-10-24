#!/usr/bin/env node
/**
 * FREEDUMB - JWT Token Generator
 * Generate Bearer tokens for testing API endpoints
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function generateToken(userId, expiresIn = '15m') {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-123456789';

  return jwt.sign(
    { userId },
    secret,
    { expiresIn }
  );
}

function generateRefreshToken(userId, expiresIn = '7d') {
  const secret = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-987654321';

  return jwt.sign(
    { userId },
    secret,
    { expiresIn }
  );
}

function decodeToken(token) {
  const decoded = jwt.decode(token, { complete: true });
  return decoded;
}

// Main execution
console.log(`${colors.cyan}╔═══════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║   FREEDUMB - JWT Token Generator              ║${colors.reset}`);
console.log(`${colors.cyan}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

// Get userId from command line or generate new one
const userId = process.argv[2] || uuidv4();

// Generate tokens
const accessToken = generateToken(userId, '24h'); // 24 hours for testing
const refreshToken = generateRefreshToken(userId, '7d');

// Decode for display
const decodedAccess = decodeToken(accessToken);
const decodedRefresh = decodeToken(refreshToken);

// Display results
console.log(`${colors.green}✅ Tokens generated successfully!${colors.reset}\n`);

console.log(`${colors.yellow}User ID:${colors.reset}`);
console.log(`  ${userId}\n`);

console.log(`${colors.yellow}Access Token (24h):${colors.reset}`);
console.log(`  ${accessToken}\n`);

console.log(`${colors.yellow}Refresh Token (7d):${colors.reset}`);
console.log(`  ${refreshToken}\n`);

console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

console.log(`${colors.cyan}📋 Bearer Token (copy this for API requests):${colors.reset}`);
console.log(`${colors.green}Bearer ${accessToken}${colors.reset}\n`);

console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

console.log(`${colors.yellow}🔍 Token Details:${colors.reset}`);
console.log(`  Algorithm: ${decodedAccess.header.alg}`);
console.log(`  Type: ${decodedAccess.header.typ}`);
console.log(`  Issued At: ${new Date(decodedAccess.payload.iat * 1000).toLocaleString()}`);
console.log(`  Expires At: ${new Date(decodedAccess.payload.exp * 1000).toLocaleString()}`);
console.log(`  Valid For: ${Math.round((decodedAccess.payload.exp - decodedAccess.payload.iat) / 3600)} hours\n`);

console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

console.log(`${colors.cyan}📖 Usage Examples:${colors.reset}\n`);

console.log(`${colors.yellow}1. cURL:${colors.reset}`);
console.log(`   curl -H "Authorization: Bearer ${accessToken.substring(0, 30)}..." \\`);
console.log(`        http://localhost:3000/api/transactions\n`);

console.log(`${colors.yellow}2. Postman/Insomnia:${colors.reset}`);
console.log(`   Header: Authorization`);
console.log(`   Value: Bearer ${accessToken.substring(0, 30)}...\n`);

console.log(`${colors.yellow}3. JavaScript (fetch):${colors.reset}`);
console.log(`   fetch('http://localhost:3000/api/transactions', {`);
console.log(`     headers: {`);
console.log(`       'Authorization': 'Bearer ${accessToken.substring(0, 30)}...',`);
console.log(`       'Content-Type': 'application/json'`);
console.log(`     }`);
console.log(`   })\n`);

console.log(`${colors.yellow}4. Axios:${colors.reset}`);
console.log(`   axios.get('http://localhost:3000/api/transactions', {`);
console.log(`     headers: {`);
console.log(`       'Authorization': 'Bearer ${accessToken.substring(0, 30)}...'`);
console.log(`     }`);
console.log(`   })\n`);

console.log(`${colors.green}💡 Tip:${colors.reset} To generate a token for a specific user:`);
console.log(`   node scripts/generate-token.js <user-id>\n`);
