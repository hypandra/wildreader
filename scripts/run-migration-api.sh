#!/bin/bash

# Run database migration via Supabase REST API
# This works around IPv4/IPv6 and authentication issues

set -e

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
MIGRATION_FILE="supabase/migrations/20240101000000_initial_schema.sql"

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ]; then
  echo "❌ Missing environment variables"
  echo "Loading from .env.local..."
  source .env.local
fi

echo "📖 Reading migration file..."
SQL_CONTENT=$(cat "$MIGRATION_FILE")

echo "🚀 Executing migration via Supabase REST API..."

# Use the Supabase SQL endpoint via PostgREST
# We need to execute this as raw SQL
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"sql\": $(jq -Rs . < "$MIGRATION_FILE")}" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "✅ Migration request sent!"
