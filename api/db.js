// api/db.js - Universal Centralized Storage API for Vercel
import net from 'net';
import tls from 'tls';

function getRedisUrl() {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  if (process.env.STORAGE_URL) return process.env.STORAGE_URL;
  if (process.env.STORAGE_REDIS_URL) return process.env.STORAGE_REDIS_URL;
  if (process.env.KV_URL) return process.env.KV_URL;

  for (const [key, val] of Object.entries(process.env)) {
    if (typeof val === 'string' && (val.startsWith('redis://') || val.startsWith('rediss://'))) {
      return val;
    }
  }
  return null;
}

// 1. Standard ioredis driver (installed via package.json)
async function tryIoRedis(redisUrl, command, key, val = null) {
  try {
    const { default: Redis } = await import('ioredis');
    const client = new Redis(redisUrl, {
      connectTimeout: 4000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined
    });
    await client.connect();
    let result = null;
    if (command === 'GET') {
      result = await client.get(key);
    } else if (command === 'SET') {
      result = await client.set(key, val);
    }
    try { await client.quit(); } catch (_) {}
    return { ok: true, result };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// 2. Zero-dependency native Node socket fallback (works even without node_modules)
function sendRedisSocket(redisUrl, args) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(redisUrl);
      const isTls = parsedUrl.protocol === 'rediss:';
      const port = parseInt(parsedUrl.port) || (isTls ? 6380 : 6379);
      const host = parsedUrl.hostname;
      const username = parsedUrl.username || 'default';
      const password = parsedUrl.password;

      const connector = isTls ? tls : net;
      const socket = connector.connect({ host, port, rejectUnauthorized: false });

      let rawData = Buffer.alloc(0);
      let resolved = false;

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          try { socket.destroy(); } catch (_) {}
          reject(new Error('Redis socket timeout'));
        }
      }, 5000);

      socket.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          reject(err);
        }
      });

      socket.on('connect', () => {
        let payload = '';
        if (password) {
          payload += `*3\r\n$4\r\nAUTH\r\n$${Buffer.byteLength(username)}\r\n${username}\r\n$${Buffer.byteLength(password)}\r\n${password}\r\n`;
        }
        payload += `*${args.length}\r\n`;
        for (const a of args) {
          const s = String(a);
          payload += `$${Buffer.byteLength(s)}\r\n${s}\r\n`;
        }
        socket.write(payload);
      });

      socket.on('data', (chunk) => {
        rawData = Buffer.concat([rawData, chunk]);
        let responseText = rawData.toString('utf8');

        if (password && responseText.startsWith('+OK\r\n')) {
          responseText = responseText.slice(5);
        }

        if (responseText.length === 0) return;

        if (responseText.startsWith('$-1\r\n')) {
          resolved = true;
          clearTimeout(timer);
          try { socket.end(); } catch (_) {}
          resolve(null);
        } else if (responseText.startsWith('$')) {
          const firstNl = responseText.indexOf('\r\n');
          if (firstNl !== -1) {
            const len = parseInt(responseText.slice(1, firstNl));
            const dataStart = firstNl + 2;
            if (Buffer.byteLength(responseText.slice(dataStart)) >= len) {
              const content = responseText.slice(dataStart, dataStart + len);
              resolved = true;
              clearTimeout(timer);
              try { socket.end(); } catch (_) {}
              resolve(content);
            }
          }
        } else if (responseText.startsWith('+OK')) {
          resolved = true;
          clearTimeout(timer);
          try { socket.end(); } catch (_) {}
          resolve('OK');
        } else if (responseText.startsWith('-')) {
          resolved = true;
          clearTimeout(timer);
          try { socket.end(); } catch (_) {}
          reject(new Error(responseText.slice(1).trim()));
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const redisUrl = getRedisUrl();
  const kvRestUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvRestToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  // GET: Fetch shared centralized database
  if (req.method === 'GET') {
    if (redisUrl) {
      // 1. Try ioredis
      const ioRes = await tryIoRedis(redisUrl, 'GET', 'petty_cash_database');
      if (ioRes.ok) {
        if (ioRes.result) {
          try {
            const parsed = JSON.parse(ioRes.result);
            return res.status(200).json(parsed);
          } catch (_) {}
        }
        return res.status(200).json({
          claims: [],
          users: [],
          pcfAmount: 5000.00,
          replenishments: [],
          storage: 'redis-empty'
        });
      }

      // 2. Fallback to raw socket
      try {
        const val = await sendRedisSocket(redisUrl, ['GET', 'petty_cash_database']);
        if (val) {
          const parsed = JSON.parse(val);
          return res.status(200).json(parsed);
        }
      } catch (err) {
        console.error("Redis socket read error:", err.message);
      }
    } else if (kvRestUrl && kvRestToken) {
      try {
        const r = await fetch(`${kvRestUrl}/get/petty_cash_database`, {
          headers: { Authorization: `Bearer ${kvRestToken}` }
        });
        const d = await r.json();
        if (d && d.result) {
          const parsed = typeof d.result === 'string' ? JSON.parse(d.result) : d.result;
          return res.status(200).json(parsed);
        }
      } catch (e) {
        console.error("KV read error:", e.message);
      }
    }

    return res.status(200).json({
      claims: [],
      users: [],
      pcfAmount: 5000.00,
      replenishments: [],
      storage: redisUrl ? 'redis-empty' : 'no-connection'
    });
  }

  // POST: Save shared centralized database
  if (req.method === 'POST') {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const jsonStr = JSON.stringify(payload);

    if (redisUrl) {
      const ioRes = await tryIoRedis(redisUrl, 'SET', 'petty_cash_database', jsonStr);
      if (ioRes.ok) {
        return res.status(200).json({ status: 'saved', storage: 'redis-ioredis' });
      }

      try {
        await sendRedisSocket(redisUrl, ['SET', 'petty_cash_database', jsonStr]);
        return res.status(200).json({ status: 'saved', storage: 'redis-socket' });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    } else if (kvRestUrl && kvRestToken) {
      try {
        await fetch(`${kvRestUrl}/set/petty_cash_database`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${kvRestToken}`,
            'Content-Type': 'application/json'
          },
          body: jsonStr
        });
        return res.status(200).json({ status: 'saved', storage: 'vercel-kv' });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }

    return res.status(200).json({ status: 'warning', message: 'No Redis or KV database connected to this project' });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
