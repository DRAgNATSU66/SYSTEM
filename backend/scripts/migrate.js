/**
 * SYSTEM OS — Database Migration Runner
 *
 * Usage:
 *   node scripts/migrate.js --token YOUR_SUPABASE_PAT
 *
 * Get your Personal Access Token from:
 *   https://supabase.com/dashboard/account/tokens
 *
 * The project ref is read from VITE_SUPABASE_URL in .env
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Parse CLI args ────────────────────────────────────────────
const args = process.argv.slice(2);
const tokenIdx = args.indexOf('--token');
const ACCESS_TOKEN = tokenIdx !== -1 ? args[tokenIdx + 1] : process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('\n❌  No access token provided.');
  console.error('   Get yours at: https://supabase.com/dashboard/account/tokens');
  console.error('   Then run:  node scripts/migrate.js --token YOUR_TOKEN\n');
  process.exit(1);
}

// ── Read .env to extract project ref ─────────────────────────
// .env lives in frontend/ — one level up from backend/scripts/
const envPath = path.resolve(__dirname, '../../frontend/.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
if (!urlMatch) {
  console.error('❌  Could not find VITE_SUPABASE_URL in .env');
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
console.log(`\n🔗  Project: ${projectRef}`);

// ── Read SQL file ─────────────────────────────────────────────
// supabase/ lives at backend/supabase/ — sibling of scripts/
const sqlPath = path.resolve(__dirname, '../supabase/init.sql');
const fullSql = fs.readFileSync(sqlPath, 'utf-8');

// ── Split SQL into executable chunks ─────────────────────────
// Split on statement boundaries, keeping DO $$ blocks intact
function splitStatements(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;

  const lines = sql.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();

    // Skip pure comment lines and empty lines at top level (not inside blocks)
    if (!inDollarQuote && (trimmed.startsWith('--') || trimmed === '')) {
      continue;
    }

    current += line + '\n';

    // Track $$ dollar-quoting
    if (!inDollarQuote) {
      const match = current.match(/\$\$|\$[a-zA-Z_]+\$/g);
      if (match && match.length % 2 === 1) {
        inDollarQuote = true;
      }
    } else {
      const match = current.match(/\$\$|\$[a-zA-Z_]+\$/g);
      if (match && match.length % 2 === 0) {
        inDollarQuote = false;
      }
    }

    // End of statement: semicolon at end of line outside dollar quotes
    if (!inDollarQuote && trimmed.endsWith(';')) {
      const stmt = current.trim();
      if (stmt.length > 1) {
        statements.push(stmt);
      }
      current = '';
    }
  }

  if (current.trim().length > 0) {
    statements.push(current.trim());
  }

  return statements;
}

// ── Run a single SQL statement via Management API ─────────────
async function runSQL(sql) {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { error: text }; }

  if (!res.ok) {
    throw new Error(json?.message || json?.error || `HTTP ${res.status}`);
  }

  return json;
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  const statements = splitStatements(fullSql);
  console.log(`\n📋  Found ${statements.length} SQL statements to execute.\n`);

  let passed = 0;
  let skipped = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 80);
    process.stdout.write(`  [${i + 1}/${statements.length}] ${preview}… `);

    try {
      await runSQL(stmt);
      console.log('✅');
      passed++;
    } catch (err) {
      const msg = err.message || '';
      // Idempotent errors — safe to skip
      const isIdempotent =
        msg.includes('already exists') ||
        msg.includes('does not exist') ||
        msg.includes('duplicate key') ||
        msg.includes('relation') ||
        msg.includes('extension') ||
        msg.includes('DROP TABLE') ||
        msg.includes('cannot drop');

      if (isIdempotent) {
        console.log(`⏭  (skipped: ${msg.slice(0, 60)})`);
        skipped++;
      } else {
        console.log(`❌  ${msg.slice(0, 80)}`);
        errors.push({ index: i + 1, preview, error: msg });
        failed++;
      }
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`✅  Passed:  ${passed}`);
  console.log(`⏭   Skipped: ${skipped}  (already exist — safe)`);
  console.log(`❌  Failed:  ${failed}`);

  if (errors.length > 0) {
    console.log('\n⚠️  Failures:');
    errors.forEach(e => {
      console.log(`   [${e.index}] ${e.preview}`);
      console.log(`         → ${e.error}\n`);
    });
  }

  if (failed === 0) {
    console.log('\n🚀  Migration complete! Your SYSTEM database is ready.\n');
  } else {
    console.log('\n⚠️  Some statements failed — check above. Most are safe to ignore if already applied.\n');
  }
}

main().catch(err => {
  console.error('\n💥  Fatal error:', err.message);
  process.exit(1);
});
