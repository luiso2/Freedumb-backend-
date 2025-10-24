#!/usr/bin/env node
/**
 * FREEDUMB - JWT Secret Generator
 * Generate cryptographically secure secrets for JWT tokens
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Colors
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// Generate cryptographically secure random string
function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

// Generate encryption key (must be exactly 32 bytes for AES-256)
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Generate IV (initialization vector) for encryption (16 bytes)
function generateIV() {
  return crypto.randomBytes(16).toString('hex').substring(0, 16);
}

console.log(`${colors.cyan}╔═══════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║   FREEDUMB - JWT Secrets Generator            ║${colors.reset}`);
console.log(`${colors.cyan}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

// Generate secrets
const jwtSecret = generateSecret(64);
const jwtRefreshSecret = generateSecret(64);
const encryptionKey = generateEncryptionKey();
const encryptionIV = generateIV();

console.log(`${colors.green}✅ Cryptographically secure secrets generated!${colors.reset}\n`);

console.log(`${colors.yellow}JWT Access Secret (128 characters):${colors.reset}`);
console.log(`${colors.cyan}${jwtSecret}${colors.reset}\n`);

console.log(`${colors.yellow}JWT Refresh Secret (128 characters):${colors.reset}`);
console.log(`${colors.cyan}${jwtRefreshSecret}${colors.reset}\n`);

console.log(`${colors.yellow}Encryption Key (64 characters - AES-256):${colors.reset}`);
console.log(`${colors.cyan}${encryptionKey}${colors.reset}\n`);

console.log(`${colors.yellow}Encryption IV (16 characters):${colors.reset}`);
console.log(`${colors.cyan}${encryptionIV}${colors.reset}\n`);

console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

// Ask if user wants to update .env file
const envPath = path.join(__dirname, '..', '.env');
const updateEnv = process.argv[2] === '--update' || process.argv[2] === '-u';

if (updateEnv) {
  try {
    // Read current .env
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Backup current .env
    const backupPath = path.join(__dirname, '..', `.env.backup.${Date.now()}`);
    fs.writeFileSync(backupPath, envContent);
    console.log(`${colors.green}✅ Backup created: ${path.basename(backupPath)}${colors.reset}\n`);

    // Replace secrets
    envContent = envContent.replace(
      /JWT_SECRET=.*/,
      `JWT_SECRET=${jwtSecret}`
    );
    envContent = envContent.replace(
      /JWT_REFRESH_SECRET=.*/,
      `JWT_REFRESH_SECRET=${jwtRefreshSecret}`
    );
    envContent = envContent.replace(
      /ENCRYPTION_KEY=.*/,
      `ENCRYPTION_KEY=${encryptionKey}`
    );
    envContent = envContent.replace(
      /ENCRYPTION_IV=.*/,
      `ENCRYPTION_IV=${encryptionIV}`
    );

    // Write updated .env
    fs.writeFileSync(envPath, envContent);

    console.log(`${colors.green}✅ .env file updated successfully!${colors.reset}\n`);
    console.log(`${colors.yellow}Updated values:${colors.reset}`);
    console.log(`  - JWT_SECRET`);
    console.log(`  - JWT_REFRESH_SECRET`);
    console.log(`  - ENCRYPTION_KEY`);
    console.log(`  - ENCRYPTION_IV\n`);

    console.log(`${colors.red}⚠️  IMPORTANT:${colors.reset}`);
    console.log(`  ${colors.yellow}All existing JWT tokens are now INVALID${colors.reset}`);
    console.log(`  ${colors.yellow}Users will need to login again${colors.reset}`);
    console.log(`  ${colors.yellow}Restart your backend server${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}❌ Error updating .env:${colors.reset}`, error.message);
  }
} else {
  console.log(`${colors.cyan}📝 Manual Update Instructions:${colors.reset}\n`);
  console.log(`Add these to your .env file:\n`);
  console.log(`${colors.yellow}JWT_SECRET${colors.reset}=${jwtSecret}`);
  console.log(`${colors.yellow}JWT_REFRESH_SECRET${colors.reset}=${jwtRefreshSecret}`);
  console.log(`${colors.yellow}ENCRYPTION_KEY${colors.reset}=${encryptionKey}`);
  console.log(`${colors.yellow}ENCRYPTION_IV${colors.reset}=${encryptionIV}\n`);

  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  console.log(`${colors.green}💡 Quick Update:${colors.reset}`);
  console.log(`Run with ${colors.cyan}--update${colors.reset} flag to automatically update .env file:`);
  console.log(`${colors.cyan}node scripts/generate-secrets.js --update${colors.reset}\n`);
}

console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

console.log(`${colors.cyan}🔐 Security Best Practices:${colors.reset}`);
console.log(`  ✅ Secrets are 128+ characters (cryptographically secure)`);
console.log(`  ✅ Generated using crypto.randomBytes()`);
console.log(`  ✅ Never commit these secrets to Git`);
console.log(`  ✅ Use different secrets for dev/staging/production`);
console.log(`  ✅ Rotate secrets periodically (every 90 days)`);
console.log(`  ✅ Store production secrets in secure vault (AWS Secrets Manager, etc.)\n`);

console.log(`${colors.yellow}⚠️  Remember:${colors.reset}`);
console.log(`  - Keep .env in .gitignore`);
console.log(`  - Never share secrets via email/chat`);
console.log(`  - Regenerate if secrets are compromised`);
console.log(`  - Use environment variables in production\n`);
