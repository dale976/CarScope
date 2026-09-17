import { Database } from 'bun:sqlite';
import { closeSync, openSync } from 'node:fs';

// Cumulative development allowance. No automatic reset or free-quota assumptions.
export const LIMIT_PENCE = 1000;
export const SEARCH_RESERVATION_PENCE = 2;
export const BUDGET_PATH = Bun.env.CARSCOPE_BUDGET_PATH ?? new URL('../../.budget/marketcheck.sqlite', import.meta.url).pathname;

export function initializeBudget(path = BUDGET_PATH) {
  closeSync(openSync(path, 'wx', 0o600)); // Never overwrite existing accounting.
  const db = new Database(path);
  try {
    db.exec('CREATE TABLE budget (id INTEGER PRIMARY KEY CHECK(id = 1), reserved INTEGER NOT NULL CHECK(reserved >= 0 AND reserved <= 1000)); INSERT INTO budget VALUES (1, 0);');
  } finally { db.close(); }
}
function connect(path: string) {
  return new Database(path, { create: false, strict: true });
}
export function readBudget(path = BUDGET_PATH) {
  const db = connect(path);
  try {
    const row = db.query('SELECT reserved FROM budget WHERE id = 1').get() as { reserved: number } | null;
    if (!row || !Number.isSafeInteger(row.reserved) || row.reserved < 0 || row.reserved > LIMIT_PENCE) throw new Error('Invalid budget ledger; live requests blocked.');
    return { limitPence: LIMIT_PENCE, reservedPence: row.reserved, remainingPence: LIMIT_PENCE - row.reserved };
  } finally { db.close(); }
}
export function reserveSearchCall(path = BUDGET_PATH) {
  const db = connect(path);
  try {
    // One atomic, conditional write serializes competing processes. Commit before HTTP.
    const result = db.query('UPDATE budget SET reserved = reserved + ? WHERE id = 1 AND reserved >= 0 AND reserved <= ?').run(SEARCH_RESERVATION_PENCE, LIMIT_PENCE - SEARCH_RESERVATION_PENCE);
    if (result.changes !== 1) throw new Error('MarketCheck budget exhausted or invalid; request blocked.');
  } finally { db.close(); }
}
