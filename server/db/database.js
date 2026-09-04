import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbPath = path.join(__dirname, 'vyapaar_saathi.db');

// Handle Vercel / AWS Lambda read-only filesystem by using /tmp
if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const tmpPath = path.join('/tmp', 'vyapaar_saathi.db');
  try {
    if (!fs.existsSync(tmpPath) && fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, tmpPath);
    }
  } catch (err) {
    console.warn('[Database] Copy to /tmp notice:', err.message);
  }
  dbPath = tmpPath;
}

const db = new Database(dbPath);

// Enable WAL mode if supported
try {
  db.pragma('journal_mode = WAL');
} catch (e) {
  // Ignore in environments where WAL is restricted
}

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS shops (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    trade_type TEXT NOT NULL,
    trade_name TEXT NOT NULL,
    village TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    vintage_years REAL NOT NULL,
    monthly_revenue REAL NOT NULL,
    ownership TEXT DEFAULT 'rented',
    bank_account_type TEXT DEFAULT 'savings',
    phone TEXT,
    owner_category TEXT DEFAULT 'general',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT NOT NULL, -- 'income' (daily sales), 'expense' (inventory/rent), 'udhaar_given' (credit to customer), 'udhaar_repaid'
    amount REAL NOT NULL,
    category TEXT NOT NULL, -- 'Groceries', 'Vegetables', 'Dairy', 'Stock Purchase', 'Electricity', etc.
    payment_mode TEXT NOT NULL, -- 'cash', 'upi', 'khata'
    customer_vendor_name TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(shop_id) REFERENCES shops(id)
  );

  CREATE TABLE IF NOT EXISTS peer_benchmarks (
    id TEXT PRIMARY KEY,
    district TEXT NOT NULL,
    trade_type TEXT NOT NULL,
    avg_monthly_revenue_min REAL NOT NULL,
    avg_monthly_revenue_max REAL NOT NULL,
    avg_daily_footfall INTEGER NOT NULL,
    avg_inventory_turnover_days INTEGER NOT NULL,
    avg_digital_share_percent REAL NOT NULL,
    top_festival_cues TEXT
  );

  CREATE TABLE IF NOT EXISTS advisory_chat_history (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(shop_id) REFERENCES shops(id)
  );

  CREATE TABLE IF NOT EXISTS credit_records (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    factor_consistency REAL NOT NULL,
    factor_growth REAL NOT NULL,
    factor_discipline REAL NOT NULL,
    factor_vintage REAL NOT NULL,
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(shop_id) REFERENCES shops(id)
  );
`);

export default db;
