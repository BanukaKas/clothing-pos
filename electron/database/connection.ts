import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';

let sqlInstance: SqlJsStatic | null = null;
let dbInstance: Database | null = null;
let currentDbPath: string | null = null;
let isSaving = false;
let saveQueued = false;

export async function getSqlInstance(): Promise<SqlJsStatic> {
  if (!sqlInstance) {
    try {
      sqlInstance = await initSqlJs();
    } catch (e) {
      // Find wasm path in node_modules or app resources
      const candidatePaths = [
        path.resolve(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm'),
        path.resolve(__dirname, '../../node_modules/sql.js/dist/sql-wasm.wasm'),
        path.resolve(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm'),
        path.resolve(process.resourcesPath || '', 'sql-wasm.wasm'),
      ];
      const found = candidatePaths.find(p => fs.existsSync(p));
      if (found) {
        sqlInstance = await initSqlJs({ locateFile: () => found });
      } else {
        throw e;
      }
    }
  }
  return sqlInstance;
}


export async function initializeDatabase(customDbPath?: string): Promise<Database> {
  if (dbInstance && currentDbPath === customDbPath) {
    return dbInstance;
  }

  const SQL = await getSqlInstance();

  // Determine database file path
  let dbFilePath = customDbPath;
  if (!dbFilePath) {
    // Attempt to get userData from electron, or fallback to standard AppData directory
    try {
      // Dynamic require so this module can be tested in standard Node or Electron
      const { app } = require('electron');
      const userDataDir = app.getPath('userData');
      const dbDir = path.join(userDataDir, 'database');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      dbFilePath = path.join(dbDir, 'mint-fashion.db');
    } catch {
      // Node environment fallback (for unit tests / scripts)
      const baseDir = process.env.APPDATA || process.env.HOME || process.cwd();
      const dbDir = path.join(baseDir, '.mint-fashion-pos', 'database');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      dbFilePath = path.join(dbDir, 'mint-fashion.db');
    }
  }

  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  currentDbPath = dbFilePath;

  // Load existing database from disk or instantiate new
  if (fs.existsSync(dbFilePath)) {
    const fileBuffer = fs.readFileSync(dbFilePath);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
    // Immediate initial persist
    persistDatabaseSync(dbInstance, dbFilePath);
  }

  // Enable foreign keys
  dbInstance.run('PRAGMA foreign_keys = ON;');

  return dbInstance;
}

export function getDatabase(): Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbInstance;
}

export function getDatabasePath(): string | null {
  return currentDbPath;
}

/**
 * Persist SQLite WebAssembly memory state to disk using atomic write.
 * Writes to a temporary file first, then atomically renames.
 */
export function persistDatabase(): void {
  if (!dbInstance || !currentDbPath) return;

  if (isSaving) {
    saveQueued = true;
    return;
  }

  isSaving = true;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    const tempPath = `${currentDbPath}.tmp-${Date.now()}`;

    fs.writeFileSync(tempPath, buffer);
    fs.renameSync(tempPath, currentDbPath);
  } catch (err) {
    console.error('Failed to persist SQLite database to disk:', err);
  } finally {
    isSaving = false;
    if (saveQueued) {
      saveQueued = false;
      persistDatabase();
    }
  }
}

function persistDatabaseSync(db: Database, targetPath: string): void {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    const tempPath = `${targetPath}.tmp`;
    fs.writeFileSync(tempPath, buffer);
    fs.renameSync(tempPath, targetPath);
  } catch (err) {
    console.error('Failed to persist database synchronously:', err);
  }
}

/**
 * Run a multi-step callback inside an atomic SQLite transaction.
 * If any error is thrown, the transaction is rolled back and changes are discarded.
 */
export function runTransaction<T>(callback: (db: Database) => T): T {
  const db = getDatabase();
  db.run('BEGIN TRANSACTION;');
  try {
    const result = callback(db);
    db.run('COMMIT;');
    persistDatabase();
    return result;
  } catch (error) {
    try {
      db.run('ROLLBACK;');
    } catch (rbError) {
      console.error('Failed to rollback transaction:', rbError);
    }
    throw error;
  }
}

export function sanitizeParams(params: any[] = []): any[] {
  return params.map(p => (p === undefined ? null : p));
}

/**
 * Helper to execute a query returning multiple typed rows.
 */
export function query<T = any>(sql: string, params: any[] = []): T[] {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  try {
    if (params && params.length > 0) {
      stmt.bind(sanitizeParams(params));
    }
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    return results;
  } finally {
    stmt.free();
  }
}

/**
 * Helper to execute a query returning a single typed row (or undefined).
 */
export function get<T = any>(sql: string, params: any[] = []): T | undefined {
  const rows = query<T>(sql, params);
  return rows.length > 0 ? rows[0] : undefined;
}

/**
 * Helper to execute an INSERT/UPDATE/DELETE statement and persist changes.
 */
export function run(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number } {
  const db = getDatabase();
  db.run(sql, sanitizeParams(params));
  persistDatabase();
  return {
    changes: db.getRowsModified(),
    lastInsertRowid: 0,
  };
}


/**
 * Helper to execute raw batch SQL (like migrations or schema).
 */
export function exec(sql: string): void {
  const db = getDatabase();
  db.exec(sql);
  persistDatabase();
}

/**
 * Check integrity of database file using SQLite PRAGMA quick_check.
 */
export function checkIntegrity(): { ok: boolean; message: string } {
  try {
    const res = query<{ integrity_check: string }>('PRAGMA integrity_check;');
    const status = res[0]?.integrity_check || 'unknown';
    return {
      ok: status === 'ok',
      message: status,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err.message || 'Integrity check failed',
    };
  }
}

/**
 * Backup the active SQLite database to a user-chosen destination.
 */
export async function backupDatabase(targetFilePath: string): Promise<boolean> {
  const db = getDatabase();
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    const dir = path.dirname(targetFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetFilePath, buffer);
    return true;
  } catch (err) {
    console.error('Backup database failed:', err);
    throw err;
  }
}

/**
 * Restore the SQLite database from a backup file with integrity verification.
 */
export async function restoreDatabase(sourceFilePath: string): Promise<boolean> {
  if (!fs.existsSync(sourceFilePath)) {
    throw new Error('Backup source file does not exist');
  }

  const SQL = await getSqlInstance();
  const buffer = fs.readFileSync(sourceFilePath);

  // Test validity of the candidate database
  let candidateDb: Database | null = null;
  try {
    candidateDb = new SQL.Database(buffer);
    const check = candidateDb.exec('PRAGMA integrity_check;');
    const isOk = check[0]?.values[0]?.[0] === 'ok';
    if (!isOk) {
      throw new Error('Backup database file is corrupted');
    }
  } finally {
    if (candidateDb) {
      candidateDb.close();
    }
  }

  if (dbInstance) {
    dbInstance.close();
  }

  dbInstance = new SQL.Database(buffer);
  dbInstance.run('PRAGMA foreign_keys = ON;');

  if (currentDbPath) {
    persistDatabaseSync(dbInstance, currentDbPath);
  }

  return true;
}

/**
 * Cleanly close the database on app shutdown.
 */
export function closeDatabase(): void {
  if (dbInstance) {
    persistDatabase();
    dbInstance.close();
    dbInstance = null;
  }
}
