#!/bin/bash

# Comprehensive database connection diagnostic script
# Usage: ./scripts/diagnose-database.sh

echo "🔍 Database Connection Diagnostics"
echo "===================================="
echo ""

BACKEND_ENV="backend/.env"

# Check if .env exists
if [ ! -f "$BACKEND_ENV" ]; then
    echo "❌ backend/.env file not found!"
    echo "   Run: ./scripts/fix-database-url.sh"
    exit 1
fi

# Extract DATABASE_URL
DATABASE_URL=$(grep "^DATABASE_URL=" "$BACKEND_ENV" | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in $BACKEND_ENV"
    exit 1
fi

echo "📋 Current Configuration:"
echo "   DATABASE_URL: ${DATABASE_URL:0:50}..." # Show first 50 chars
echo ""

# Parse hostname
HOSTNAME=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

if [ -z "$HOSTNAME" ]; then
    echo "❌ Could not parse hostname from DATABASE_URL"
    exit 1
fi

echo "🌐 Network Diagnostics:"
echo "   Hostname: $HOSTNAME"
echo "   Port: ${PORT:-5432}"
echo ""

# Test DNS resolution
echo "1️⃣  Testing DNS Resolution..."
if nslookup "$HOSTNAME" > /dev/null 2>&1; then
    echo "   ✅ DNS resolution successful"
    IP=$(nslookup "$HOSTNAME" 2>/dev/null | grep -A 1 "Name:" | tail -1 | awk '{print $2}')
    if [ -n "$IP" ]; then
        echo "   IP Address: $IP"
    fi
else
    echo "   ❌ DNS resolution FAILED"
    echo ""
    echo "   This means the hostname cannot be found. Possible causes:"
    echo "   - Project is paused or deleted (Supabase)"
    echo "   - Hostname is incorrect"
    echo "   - DNS server issues"
    echo ""
    
    if [[ "$HOSTNAME" == *".supabase.co"* ]]; then
        echo "   💡 For Supabase projects:"
        echo "   1. Go to https://supabase.com"
        echo "   2. Check if your project is active (not paused)"
        echo "   3. Go to Settings → Database"
        echo "   4. Verify the connection string matches"
        echo "   5. If project was paused, restore it from dashboard"
    fi
    echo ""
    exit 1
fi

echo ""

# Test port connectivity
echo "2️⃣  Testing Port Connectivity..."
PORT_TO_TEST=${PORT:-5432}
if command -v nc &> /dev/null; then
    if nc -z -w 5 "$HOSTNAME" "$PORT_TO_TEST" 2>/dev/null; then
        echo "   ✅ Port $PORT_TO_TEST is reachable"
    else
        echo "   ⚠️  Port $PORT_TO_TEST is not reachable (firewall or server down)"
    fi
else
    echo "   ⚠️  'nc' (netcat) not installed, skipping port test"
fi

echo ""

# Test actual database connection
echo "3️⃣  Testing Database Connection..."
cd backend

node -e "
  require('dotenv').config();
  const { Pool } = require('pg');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }
  
  // Check if Supabase (requires SSL)
  const isSupabase = connectionString.includes('.supabase.co');
  
  const pool = new Pool({ 
    connectionString,
    ssl: isSupabase ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000
  });
  
  console.log('   Attempting connection...');
  
  pool.query('SELECT version() as version')
    .then((result) => {
      console.log('   ✅ Database connection successful!');
      console.log('   PostgreSQL version:', result.rows[0].version.substring(0, 50) + '...');
      pool.end();
      process.exit(0);
    })
    .catch((error) => {
      const errorMsg = error.message || 'Unknown error';
      console.error('   ❌ Database connection failed');
      console.error('');
      console.error('   Error:', errorMsg);
      console.error('');
      
      if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo')) {
        console.error('   💡 DNS Resolution Issue:');
        console.error('      The hostname cannot be resolved.');
        if (connectionString.includes('.supabase.co')) {
          console.error('      - Check if Supabase project is active');
          console.error('      - Verify connection string in Supabase dashboard');
          console.error('      - Project might be paused or deleted');
        }
      } else if (errorMsg.includes('password') || errorMsg.includes('authentication')) {
        console.error('   💡 Authentication Issue:');
        console.error('      - Check username and password in DATABASE_URL');
        console.error('      - Verify credentials in database dashboard');
      } else if (errorMsg.includes('timeout')) {
        console.error('   💡 Connection Timeout:');
        console.error('      - Check if database server is running');
        console.error('      - Verify network connectivity');
        console.error('      - Check firewall settings');
      }
      
      pool.end();
      process.exit(1);
    });
" 2>&1

EXIT_CODE=$?
cd ..

echo ""

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All diagnostics passed! Database is ready to use."
else
    echo "❌ Database connection failed. See errors above for details."
    exit 1
fi

