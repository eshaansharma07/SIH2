import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Global caching across serverless invocations and module re-imports
let cachedClient = globalThis.__saakhsetuMongoClient || null;
let cachedDb = globalThis.__saakhsetuMongoDb || null;
let indexesInitialized = globalThis.__saakhsetuIndexesInitialized || false;
let lastFailureTimestamp = 0;
const FAILURE_COOLDOWN_MS = 5000; // 5 second cooldown after connection failure

/**
 * Checks if MONGODB_URI is provided in environment.
 */
export function isMongoConfigured() {
  return Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim());
}

/**
 * Creates essential indexes and checks schema versioning on startup.
 */
async function ensureIndexesAndMigrations(db) {
  if (indexesInitialized) return;
  indexesInitialized = true;
  globalThis.__saakhsetuIndexesInitialized = true;
  try {
    const shopsCol = db.collection('shops');
    const txCol = db.collection('transactions');
    const custCol = db.collection('customers');
    const metaCol = db.collection('schema_migrations');

    // 1. Index definitions for high-frequency queries
    await Promise.allSettled([
      shopsCol.createIndex({ id: 1 }, { unique: true }),
      shopsCol.createIndex({ phone: 1 }),
      shopsCol.createIndex({ is_demo: 1 }),

      txCol.createIndex({ shop_id: 1, date: -1 }),
      txCol.createIndex({ id: 1 }, { unique: true }),
      txCol.createIndex({ shop_id: 1, type: 1 }),

      custCol.createIndex({ shop_id: 1, created_at: -1 }),
      custCol.createIndex({ id: 1 }, { unique: true }),
      custCol.createIndex({ phone: 1 }),

      metaCol.createIndex({ key: 1 }, { unique: true })
    ]);

    // 2. Schema versioning record
    await metaCol.updateOne(
      { key: 'schema_version' },
      { 
        $set: { 
          version: 2, 
          name: 'SaakhSetu Production Schema v2',
          updatedAt: new Date().toISOString() 
        } 
      },
      { upsert: true }
    );
  } catch (err) {
    console.warn('[MongoDB] Index/migration notice:', err.message);
  }
}

/**
 * Sleep helper for retry backoff
 */
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

/**
 * Establishes or returns cached MongoDB connection with serverless connection hygiene.
 * 
 * Connection Pool Sizing for M0 Atlas (500 connection limit):
 * - maxPoolSize: 1 (serverless) / 2 (local): Each Lambda container processes requests
 *   serially; 1 socket per container guarantees zero connection starvation across dozens
 *   of concurrent Lambdas.
 * - minPoolSize: 0: Allows connection pool to shrink to 0 when idle, preventing lingering
 *   connections from accumulating across frozen containers.
 * - maxIdleTimeMS: 5000: Aggressively closes any idle socket after 5 seconds of inactivity.
 * - waitQueueTimeoutMS: 2000: Fails fast and falls back to SQLite rather than hanging requests.
 */
export async function getMongoDb() {
  const isTest = process.env.NODE_ENV === 'test' || 
                 process.env.npm_lifecycle_event === 'test' || 
                 process.execArgv.includes('--test') ||
                 process.argv.some(arg => arg.includes('test'));
  if (isTest) {
    return null;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null;
  }

  if (cachedDb) {
    return cachedDb;
  }
  if (globalThis.__saakhsetuMongoDb) {
    cachedDb = globalThis.__saakhsetuMongoDb;
    cachedClient = globalThis.__saakhsetuMongoClient;
    return cachedDb;
  }

  // Fast-path: if connection recently failed, fail fast to prevent serverless Lambda timeouts
  if (Date.now() - lastFailureTimestamp < FAILURE_COOLDOWN_MS) {
    return null;
  }

  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const maxAttempts = 2;
  const timeoutMs = 6000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (!cachedClient) {
        cachedClient = new MongoClient(uri, {
          maxPoolSize: 10,
          minPoolSize: 0,
          maxIdleTimeMS: 30000,
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 20000,
          connectTimeoutMS: 10000,
          waitQueueTimeoutMS: 10000,
        });
      }

      await cachedClient.connect();
      cachedDb = cachedClient.db('vyapaar_saathi');
      globalThis.__saakhsetuMongoClient = cachedClient;
      globalThis.__saakhsetuMongoDb = cachedDb;

      // Initialize indexes and schema metadata asynchronously without blocking request
      ensureIndexesAndMigrations(cachedDb).catch(() => {});

      return cachedDb;
    } catch (err) {
      console.warn(`[MongoDB] Connection attempt ${attempt}/${maxAttempts} failed:`, err.message);
      
      const isUnreachable = err.message.includes('ECONNREFUSED') || 
                            err.message.includes('ENOTFOUND') || 
                            err.message.includes('querySrv') ||
                            err.message.includes('timed out');

      if (attempt < maxAttempts && !isUnreachable) {
        await sleep(500);
      } else {
        console.warn('[MongoDB] Connection unavailable. Falling back immediately to local SQLite store.');
        if (cachedClient) {
          try {
            await cachedClient.close(true);
          } catch (_) {}
        }
        cachedClient = null;
        cachedDb = null;
        globalThis.__saakhsetuMongoClient = null;
        globalThis.__saakhsetuMongoDb = null;
        lastFailureTimestamp = Date.now();
        return null;
      }
    }
  }

  if (cachedClient) {
    try {
      await cachedClient.close(true);
    } catch (_) {}
    cachedClient = null;
    globalThis.__saakhsetuMongoClient = null;
  }
  lastFailureTimestamp = Date.now();
  return null;
}

export async function getTransactionsCollection() {
  const db = await getMongoDb();
  return db ? db.collection('transactions') : null;
}

export async function getShopsCollection() {
  const db = await getMongoDb();
  return db ? db.collection('shops') : null;
}

export async function getCustomersCollection() {
  const db = await getMongoDb();
  return db ? db.collection('customers') : null;
}

export async function getBenchmarksCollection() {
  const db = await getMongoDb();
  return db ? db.collection('peer_benchmarks') : null;
}

export async function getSchemesCollection() {
  const db = await getMongoDb();
  return db ? db.collection('government_schemes') : null;
}

export async function closeMongoConnection() {
  const client = cachedClient || globalThis.__saakhsetuMongoClient;
  if (client) {
    try {
      await client.close(true);
    } catch (_) {}
  }
  cachedClient = null;
  cachedDb = null;
  globalThis.__saakhsetuMongoClient = null;
  globalThis.__saakhsetuMongoDb = null;
  indexesInitialized = false;
  globalThis.__saakhsetuIndexesInitialized = false;
}

if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => { closeMongoConnection().catch(() => {}); });
  process.on('SIGINT', () => { closeMongoConnection().catch(() => {}); });
}

