#!/bin/bash
# Quick JWT Token Generator for FREEDUMB
# Usage: ./scripts/quick-token.sh [user-id]

# Load environment variables
source "$(dirname "$0")/../.env"

# Get user ID from argument or generate random UUID
if [ -z "$1" ]; then
  USER_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
else
  USER_ID="$1"
fi

# JWT Secret from .env
JWT_SECRET="${JWT_SECRET:-your-super-secret-jwt-key-change-this-in-production-123456789}"

# Generate timestamps
IAT=$(date +%s)
EXP=$((IAT + 86400)) # 24 hours

# Create JWT payload
HEADER='{"alg":"HS256","typ":"JWT"}'
PAYLOAD="{\"userId\":\"$USER_ID\",\"iat\":$IAT,\"exp\":$EXP}"

# Base64 URL encode
base64url() {
  openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\n'
}

# Encode header and payload
HEADER_B64=$(echo -n "$HEADER" | base64url)
PAYLOAD_B64=$(echo -n "$PAYLOAD" | base64url)

# Create signature
SIGNATURE=$(echo -n "$HEADER_B64.$PAYLOAD_B64" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | base64url)

# Combine to create JWT
TOKEN="$HEADER_B64.$PAYLOAD_B64.$SIGNATURE"

# Output
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  FREEDUMB - Quick Token Generator"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "User ID: $USER_ID"
echo ""
echo "Bearer Token:"
echo "Bearer $TOKEN"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Copy the line above and use it in your Authorization header"
echo ""
