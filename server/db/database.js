import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbPath = path.join(__dirname, 'vyapaar_saathi.db');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

// Handle Vercel / AWS Lambda read-only filesystem by using /tmp
if (isServerless) {
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

let db;
try {
  const { default: Database } = await import('better-sqlite3');
  db = new Database(dbPath);

  const statementCache = new Map();
  const originalPrepare = db.prepare.bind(db);
  db.prepare = function(sql) {
    let stmt = statementCache.get(sql);
    if (!stmt) {
      stmt = originalPrepare(sql);
      statementCache.set(sql, stmt);
    }
    return stmt;
  };

  try {
    if (isServerless) {
      db.pragma('journal_mode = MEMORY');
      db.pragma('synchronous = OFF');
      db.pragma('temp_store = MEMORY');
    } else {
      db.pragma('journal_mode = WAL');
    }
  } catch (e) {}
} catch (loadErr) {
  // Graceful fallback to Node's built-in node:sqlite (Node 22.5+)
  const { DatabaseSync } = await import('node:sqlite');
  const rawDb = new DatabaseSync(dbPath);
  const sanitize = (val) => {
    if (val === undefined) return null;
    if (typeof val === 'boolean') return val ? 1 : 0;
    return val;
  };

  const origPrepare = rawDb.prepare.bind(rawDb);
  rawDb.prepare = function(sql) {
    const stmt = origPrepare(sql);
    return {
      run: (...args) => stmt.run(...args.map(sanitize)),
      get: (...args) => stmt.get(...args.map(sanitize)),
      all: (...args) => stmt.all(...args.map(sanitize))
    };
  };

  rawDb.pragma = (str) => {
    try {
      rawDb.exec(`PRAGMA ${str}`);
    } catch (e) {}
  };

  rawDb.transaction = (fn) => {
    return (...args) => {
      rawDb.exec('BEGIN TRANSACTION');
      try {
        const result = fn(...args);
        rawDb.exec('COMMIT');
        return result;
      } catch (err) {
        rawDb.exec('ROLLBACK');
        throw err;
      }
    };
  };

  try {
    rawDb.pragma('journal_mode = WAL');
  } catch (e) {}

  db = rawDb;
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
    is_demo INTEGER DEFAULT 0,
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
    customer_phone TEXT,
    customer_id TEXT,
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

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    village_address TEXT,
    credit_limit REAL DEFAULT 5000,
    notes TEXT,
    last_reminder_sent DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(shop_id) REFERENCES shops(id)
  );
`);

// Safe migration for existing sqlite db instances
try {
  db.exec('ALTER TABLE shops ADD COLUMN is_demo INTEGER DEFAULT 0;');
} catch (_) {
  // Column already exists
}

try {
  db.exec("ALTER TABLE shops ADD COLUMN password TEXT DEFAULT '1234';");
} catch (_) {
  // Column already exists
}

try {
  db.exec('ALTER TABLE transactions ADD COLUMN customer_phone TEXT;');
} catch (_) {
  // Column already exists
}

try {
  db.exec('ALTER TABLE transactions ADD COLUMN customer_id TEXT;');
  db.exec('CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);');
} catch (_) {
  // Column / index already exists
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      village_address TEXT,
      credit_limit REAL DEFAULT 5000,
      notes TEXT,
      last_reminder_sent DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(shop_id) REFERENCES shops(id)
    );
    CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON customers(shop_id);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
  `);
} catch (_) {
  // Table / index already exists
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS government_schemes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      ministry TEXT NOT NULL,
      category TEXT NOT NULL,
      scope TEXT DEFAULT 'central',
      applicable_states TEXT DEFAULT '[]',
      max_loan_amount REAL DEFAULT 0,
      loan_range_text TEXT,
      interest_rate TEXT,
      subsidy_text TEXT,
      collateral_required INTEGER DEFAULT 0,
      collateral_text TEXT,
      tenure TEXT,
      plain_language_summary TEXT,
      plain_language_summary_hi TEXT,
      last_verified TEXT,
      official_source_url TEXT,
      statutory_reference TEXT,
      why_you_qualify_rules TEXT,
      required_documents TEXT,
      application_steps TEXT,
      official_portal TEXT,
      is_scraped INTEGER DEFAULT 0,
      source_portal TEXT DEFAULT 'official',
      scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_gov_schemes_category ON government_schemes(category);
    CREATE INDEX IF NOT EXISTS idx_gov_schemes_scope ON government_schemes(scope);
  `);
} catch (_) {
  // Table / index already exists
}

export default db;
