#!/usr/bin/env node

/**
 * Run database migration using Supabase JavaScript client
 * This works around IPv4/IPv6 connectivity issues by using the REST API
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables');
  console.error('Make sure .env.local is loaded with:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  try {
    console.log('📖 Reading migration file...');
    const migrationSQL = readFileSync(
      join(__dirname, '../supabase/migrations/20240101000000_initial_schema.sql'),
      'utf8'
    );

    console.log('🚀 Executing migration...');

    // Split the SQL into individual statements and execute them
    // This is necessary because the Supabase client doesn't support multi-statement queries
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`   Found ${statements.length} SQL statements`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';

      // Skip comments
      if (stmt.trim().startsWith('--')) continue;

      process.stdout.write(`   Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc('exec', { sql: stmt });

      if (error) {
        console.log(' ❌');
        throw new Error(`Statement ${i + 1} failed: ${error.message}\n\nSQL:\n${stmt.substring(0, 200)}...`);
      }

      console.log(' ✓');
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nCreated:');
    console.log('  - 7 tables (wr_child_profiles, wr_vocabulary_items, wr_letters, wr_mastery_data, wr_game_sessions, wr_rewards, wr_api_keys)');
    console.log('  - 2 enums (item_type, game_type)');
    console.log('  - Row Level Security policies');
    console.log('  - 5 database functions');
    console.log('  - Auto-initialization trigger for new children');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
