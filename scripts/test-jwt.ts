#!/usr/bin/env tsx

/**
 * Test JWT token generation and verification
 * Usage: npx tsx scripts/test-jwt.ts [your-jwt-secret]
 */

import jwt from 'jsonwebtoken';

const secret = process.argv[2] || process.env.JWT_SECRET || 'test-secret-12345';

console.log('🔑 Testing JWT Token Generation\n');
console.log('Using secret:', secret.substring(0, 20) + '...\n');

try {
  // Generate token
  const payload = {
    sub: 'test-user-123',
    email: 'test@example.com',
    iat: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(payload, secret, { expiresIn: '1h' });
  
  console.log('✅ Token generated successfully!');
  console.log('Token:', token);
  console.log('');

  // Verify token
  const decoded = jwt.verify(token, secret);
  
  console.log('✅ Token verified successfully!');
  console.log('Decoded payload:', JSON.stringify(decoded, null, 2));
  console.log('');

  // Test with wrong secret (should fail)
  try {
    jwt.verify(token, 'wrong-secret');
    console.log('❌ ERROR: Token verification should have failed with wrong secret!');
  } catch (error) {
    console.log('✅ Correctly rejected token with wrong secret');
  }

  console.log('\n🎉 JWT setup is working correctly!');
  console.log('\nTo use this secret in your .env file:');
  console.log(`JWT_SECRET=${secret}`);

} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : error);
  process.exit(1);
}

