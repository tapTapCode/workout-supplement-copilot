#!/bin/bash

# Test JWT token generation
# Usage: ./scripts/test-jwt.sh [your-jwt-secret]

SECRET=${1:-${JWT_SECRET:-test-secret-12345}}

echo "🔑 Testing JWT Token Generation"
echo "================================"
echo ""
echo "Using secret: ${SECRET:0:20}..."
echo ""

cd backend

# Check if jsonwebtoken is installed
if ! npm list jsonwebtoken > /dev/null 2>&1; then
    echo "Installing jsonwebtoken..."
    npm install jsonwebtoken > /dev/null 2>&1
fi

# Generate and test token
node -e "
const jwt = require('jsonwebtoken');
const secret = process.argv[1];

try {
  const payload = {
    sub: 'test-user-123',
    email: 'test@example.com'
  };
  
  const token = jwt.sign(payload, secret, { expiresIn: '1h' });
  console.log('✅ Token generated successfully!');
  console.log('Token:', token);
  console.log('');
  
  const decoded = jwt.verify(token, secret);
  console.log('✅ Token verified successfully!');
  console.log('Decoded:', JSON.stringify(decoded, null, 2));
  console.log('');
  console.log('🎉 JWT setup is working correctly!');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
" "$SECRET"

