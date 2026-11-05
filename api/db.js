// api/db.js - Vercel Serverless Function for Centralized Multi-Device Storage
import Redis from 'ioredis';

let redis = null;

function getClient() {
  const url = process.env.REDIS_URL || process.env.STORAGE_URL || process.env.KV_URL;
  if (!url) return null;
  if (!redis) {
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      lazyConnect: false
    });
  }
  return redis;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getClient();

  if (req.method === 'GET') {
    if (client) {
      try {
        const val = await client.get('petty_cash_database');
        if (val) {
          const parsed = JSON.parse(val);
          return res.status(200).json(parsed);
        }
      } catch (err) {
        console.error("Redis get error:", err);
      }
    }
    return res.status(200).json({
      claims: [],
      users: [],
      pcfAmount: 5000.00,
      replenishments: [],
      storage: client ? 'redis-empty' : 'no-redis'
    });
  }

  if (req.method === 'POST') {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (client) {
      try {
        await client.set('petty_cash_database', JSON.stringify(payload));
        return res.status(200).json({ status: 'saved', storage: 'redis' });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }
    return res.status(200).json({ status: 'warning', message: 'Redis client not initialized' });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
