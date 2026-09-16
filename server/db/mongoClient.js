import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

let cachedClient = null;
let cachedDb = null;
let indexesInitialized = false;

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
          name: 'Vyapaar Saathi Production Schema v2',
          updatedAt: new Date().toISOString() 
        } 
      },
      { upsert: true }
    );

    indexesInitialized = true;
  } catch (err) {
    console.warn('[MongoDB] Index/migration notice:', err.message);
  }
}

/**
 * Sleep helper for retry backoff
 */
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

/**
 * Establishes or returns cached MongoDB connection with retry-with-backoff.
 * 
 * Sizing rationale for maxPoolSize = 10:
 * In a serverless deployment (Vercel / AWS Lambda), each warm container maintains its own pool.
 * Shared/M0 MongoDB Atlas clusters have a connection limit of 500 connections.
 * Capping each container at 10 connections permits up to 50 concurrent Lambda execution units
 * without connection throttling, while providing sufficient connection reuse across warm starts.
 */
export async function getMongoDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null;
  }

  if (cachedDb) {
    return cachedDb;
  }

  const maxAttempts = 3;
  const backoffDelays = [500, 1000, 2000];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (!cachedClient) {
        cachedClient = new MongoClient(uri, {
          maxPoolSize: 10,
          minPoolSize: 1,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 15000,
          connectTimeoutMS: 10000,
        });
      }

      await cachedClient.connect();
      cachedDb = cachedClient.db('vyapaar_saathi');

      // Initialize indexes and schema metadata asynchronously
      ensureIndexesAndMigrations(cachedDb);

      return cachedDb;
    } catch (err) {
      console.warn(`[MongoDB] Connection attempt ${attempt}/${maxAttempts} failed:`, err.message);
      if (attempt < maxAttempts) {
        await sleep(backoffDelays[attempt - 1]);
      } else {
        console.warn('[MongoDB] All connection retries exhausted. Falling back to local SQLite store.');
        cachedClient = null;
        cachedDb = null;
        return null;
      }
    }
  }

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
