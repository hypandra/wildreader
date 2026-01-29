#!/usr/bin/env node

/**
 * Run database migration using Supabase REST API
 * This works around IPv4/IPv6 connectivity issues
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

async function runMigration() {
  try {
    console.log('📖 Reading migration file...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20240101000000_initial_schema.sql'),
      'utf8'
    );

    console.log('🚀 Executing migration via Supabase API...');

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: migrationSQL })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    console.log('✅ Migration completed successfully!');
    console.log('\nCreated:');
    console.log('  - 7 tables (wr_child_profiles, wr_vocabulary_items, wr_letters, wr_mastery_data, wr_game_sessions, wr_rewards, wr_api_keys)');
    console.log('  - 2 enums (item_type, game_type)');
    console.log('  - Row Level Security policies');
    console.log('  - 5 database functions');
    console.log('  - Auto-initialization trigger for new children');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
