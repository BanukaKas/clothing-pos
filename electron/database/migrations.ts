import { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import { DATABASE_SCHEMA_SQL } from './schema';
import { seedInitialData } from './seed';
import { getDatabasePath } from './connection';

/**
 * Creates an automatic snapshot of the SQLite database before applying any schema updates.
 */
function createPreMigrationBackup(db: Database): void {
  try {
    const activePath = getDatabasePath();
    if (!activePath || !fs.existsSync(activePath)) return;

    const dbDir = path.dirname(activePath);
    const backupDir = path.join(dbDir, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = path.join(
      backupDir,
      `pre-migration-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db`
    );

    const data = db.export();
    fs.writeFileSync(backupFile, Buffer.from(data));
    console.log('[MINT FASHION MIGRATIONS] Created automatic pre-migration backup at:', backupFile);
  } catch (err) {
    console.warn('[MINT FASHION MIGRATIONS] Pre-migration backup warning:', err);
  }
}

export function runMigrations(db: Database): void {
  // 1. Create migrations tracking table
  db.run(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check existing migrations count
  const countMigrationsStmt = db.prepare('SELECT COUNT(*) as cnt FROM _migrations;');
  let existingMigrationCount = 0;
  if (countMigrationsStmt.step()) {
    existingMigrationCount = (countMigrationsStmt.getAsObject() as { cnt: number }).cnt || 0;
  }
  countMigrationsStmt.free();

  // If this database already has prior migrations, create pre-migration backup before applying any new changes
  if (existingMigrationCount > 0) {
    createPreMigrationBackup(db);
  }

  // --- Migration 001: Initial 19 Tables Schema ---
  const stmt001 = db.prepare('SELECT id FROM _migrations WHERE name = ?;');
  stmt001.bind(['001_initial_19_tables_schema']);
  const has001 = stmt001.step();
  stmt001.free();

  if (!has001) {
    console.log('[MINT FASHION MIGRATIONS] Applying 001_initial_19_tables_schema...');
    db.exec(DATABASE_SCHEMA_SQL);
    db.run('INSERT INTO _migrations (name) VALUES (?);', ['001_initial_19_tables_schema']);
  }

  // --- Migration 002: Barcode Management & Variant Barcode Indexing ---
  const stmt002 = db.prepare('SELECT id FROM _migrations WHERE name = ?;');
  stmt002.bind(['002_barcode_management_and_variant_barcodes']);
  const has002 = stmt002.step();
  stmt002.free();

  if (!has002) {
    console.log('[MINT FASHION MIGRATIONS] Applying 002_barcode_management_and_variant_barcodes...');

    // 1. Ensure variant barcode index exists
    db.run(`
      CREATE INDEX IF NOT EXISTS idx_variants_barcode 
      ON product_variants(barcode);
    `);

    // 2. Ensure each existing variant without a barcode gets an assigned unique barcode
    const unbarcodedStmt = db.prepare(`
      SELECT v.id, v.product_id, v.size, v.color_name, v.sku, p.barcode as prod_barcode
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      WHERE v.barcode IS NULL OR v.barcode = '';
    `);

    const toUpdate: { id: string; barcode: string }[] = [];
    while (unbarcodedStmt.step()) {
      const row = unbarcodedStmt.getAsObject() as {
        id: string;
        product_id: string;
        size: string;
        color_name: string;
        sku: string;
        prod_barcode: string;
      };
      const cleanColor = (row.color_name || 'STD').substring(0, 3).toUpperCase();
      const variantBarcode = `${row.prod_barcode}-${row.size}-${cleanColor}`;
      toUpdate.push({ id: row.id, barcode: variantBarcode });
    }
    unbarcodedStmt.free();

    for (const item of toUpdate) {
      db.run('UPDATE product_variants SET barcode = ? WHERE id = ?;', [item.barcode, item.id]);
    }

    // 3. Add default barcode configuration in settings if missing
    db.run(`
      INSERT OR IGNORE INTO settings (key, value) VALUES 
        ('barcode_default_symbology', 'CODE128'),
        ('barcode_default_prefix', 'MF'),
        ('label_default_size', '50x25'),
        ('label_show_price', '1'),
        ('label_show_sku', '1'),
        ('label_show_name', '1');
    `);

    // Record migration
    db.run('INSERT INTO _migrations (name) VALUES (?);', ['002_barcode_management_and_variant_barcodes']);
  }

  // --- Seed Initial Catalog Only if Database Has 0 Products (Never overwrite existing data!) ---
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM products;');
  let productCount = 0;
  if (countStmt.step()) {
    const row = countStmt.getAsObject() as { count: number };
    productCount = row.count || 0;
  }
  countStmt.free();

  if (productCount === 0) {
    console.log('[MINT FASHION MIGRATIONS] Fresh installation detected. Seeding initial clothing catalog...');
    seedInitialData(db);
  } else {
    console.log(`[MINT FASHION MIGRATIONS] Found ${productCount} existing customer products. Preserving data.`);
  }

  // Verify database integrity post-migration
  const integrityCheck = db.exec('PRAGMA integrity_check;');
  const checkStatus = integrityCheck[0]?.values[0]?.[0];
  if (checkStatus !== 'ok') {
    throw new Error(`Database integrity verification failed post-migration: ${checkStatus}`);
  }
  console.log('[MINT FASHION MIGRATIONS] Database integrity verified: OK.');
}
