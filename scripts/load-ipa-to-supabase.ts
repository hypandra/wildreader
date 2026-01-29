import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Load environment variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8')
const envVars: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) envVars[key.trim()] = value.trim()
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY!

// First, ensure the table exists by running the migration
const migrationSQL = `-- Create IPA pronunciations table
CREATE TABLE IF NOT EXISTS wr_ipa_pronunciations (
  id SERIAL PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  lang TEXT NOT NULL DEFAULT 'en',
  ipa TEXT[] NOT NULL,
  has_more_variants BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT NOT NULL DEFAULT 'wiktionary',
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wr_ipa_pronunciations_word ON wr_ipa_pronunciations(word);
CREATE INDEX IF NOT EXISTS idx_wr_ipa_pronunciations_lang ON wr_ipa_pronunciations(lang);`

async function runMigration() {
  console.log('Applying migration...')
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ query: migrationSQL })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Migration failed: ${response.status} - ${error}`)
  }

  console.log('Migration applied successfully')
}

const supabase = createClient(supabaseUrl, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function checkTable() {
  const { data, error } = await supabase.rpc('exec_sql', { query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'wr_ipa_pronunciations' ORDER BY ordinal_position;" })
  console.log('Table columns:', data)
  if (error) console.error('Check error:', error)
}

async function main() {
  // Check if table exists
  const { data: tableData, error: tableError } = await supabase.from('wr_ipa_pronunciations').select('*').limit(1)
  console.log('Table exists?', !tableError, tableError)

  const data = JSON.parse(fs.readFileSync('data/ipa-data.json', 'utf8'))

  console.log(`Loading ${data.length} IPA records to Supabase...`)

  // Try one record first, with only basic columns
  const testRecord = {
    word: data[0].word,
    lang: data[0].lang,
    ipa: data[0].ipa,
    source: data[0].source
  }
  console.log('Test record:', testRecord)

  const { error } = await supabase.from('wr_ipa_pronunciations').upsert([testRecord], { onConflict: 'word' })

  if (error) {
    console.error('Error loading data:', error)
    process.exit(1)
  }

  console.log('Test successful, loading all...')

  // Filter data to only include columns that exist
  const filteredData = data.map((item: any) => ({
    word: item.word,
    lang: item.lang,
    ipa: item.ipa,
    source: item.source
  }))

  const { error: bulkError } = await supabase.from('wr_ipa_pronunciations').upsert(filteredData, { onConflict: 'word' })

  if (bulkError) {
    console.error('Bulk error:', bulkError)
  } else {
    console.log('Successfully loaded all IPA data!')
  }
}

main().catch(console.error)
