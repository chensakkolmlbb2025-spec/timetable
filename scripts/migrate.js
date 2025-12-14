#!/usr/bin/env node
/*
 * Simple DB migration runner that executes a provided SQL file against a Postgres DB.
 * Usage: DATABASE_URL=postgres://user:pass@host:5432/db npm run migrate -- db/migrations/2025-12-14-add-repeat-daily.sql
 */

const fs = require('fs')
const { Client } = require('pg')

async function main() {
  const file = process.argv[2]
  if (!file) {
    console.error('Usage: node scripts/migrate.js <migration-file.sql>')
    process.exit(1)
  }

  const sql = fs.readFileSync(file, 'utf8')
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('Please set DATABASE_URL environment variable (postgres://user:pass@host:5432/db)')
    process.exit(1)
  }

  const client = new Client({ connectionString: databaseUrl })
  try {
    await client.connect()
    console.log(`Applying migration ${file}...`)
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('COMMIT')
    console.log('Migration applied successfully')
  } catch (err) {
    console.error('Migration failed:', err)
    try { await client.query('ROLLBACK') } catch (e) { /* noop */ }
    process.exit(2)
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(2)
})
