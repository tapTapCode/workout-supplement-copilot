#!/bin/bash

# Health check script for TayAI services

echo "Checking TayAI services..."

# Check backend
echo -n "Backend API: "
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✓ Running"
else
    echo "✗ Not running"
fi

# Check frontend
echo -n "Frontend: "
if curl -s http://localhost:3000 > /dev/null; then
    echo "✓ Running"
else
    echo "✗ Not running"
fi

# Check PostgreSQL (if accessible)
echo -n "PostgreSQL: "
if docker ps | grep -q tayai-postgres || pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "✓ Running"
else
    echo "✗ Not running"
fi

# Check Redis
echo -n "Redis: "
if docker ps | grep -q tayai-redis || redis-cli -h localhost -p 6379 ping > /dev/null 2>&1; then
    echo "✓ Running"
else
    echo "✗ Not running"
fi

echo ""
echo "Service check complete!"
