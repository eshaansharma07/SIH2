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

export async function getMongoDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null;
  }

  if (cachedDb) {
    return cachedDb;
  }

  try {
    if (!cachedClient) {
      cachedClient = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 15000,
      });
      await cachedClient.connect();
    }
    cachedDb = cachedClient.db('vyapaar_saathi');
    return cachedDb;
  } catch (err) {
    console.warn('[MongoDB] Connection error (falling back to SQLite):', err.message);
    return null;
  }
}

export async function getTransactionsCollection() {
  const db = await getMongoDb();
  return db ? db.collection('transactions') : null;
}

export async function getShopsCollection() {
  const db = await getMongoDb();
  return db ? db.collection('shops') : null;
}
