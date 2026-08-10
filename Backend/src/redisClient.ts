import { createClient } from 'redis';

export interface IRedisClient {
  connect(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<boolean>;
  keys(pattern: string): Promise<string[]>;
}

class MemoryRedisClient implements IRedisClient {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async connect(): Promise<void> {
    console.log('✓ Initialized in-memory fallback Redis Client successfully.');
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    const expiresAt = options?.EX ? Date.now() + options.EX * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async incr(key: string): Promise<number> {
    const val = await this.get(key);
    const num = val ? parseInt(val, 10) + 1 : 1;
    await this.set(key, num.toString());
    return num;
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const item = this.store.get(key);
    if (item) {
      item.expiresAt = Date.now() + seconds * 1000;
      return true;
    }
    return false;
  }

  async keys(pattern: string): Promise<string[]> {
    const results: string[] = [];
    const now = Date.now();
    
    // Convert Redis pattern wildcard (e.g. cache:cars:*) to regex
    const regexStr = '^' + pattern.replace(/\*/g, '.*') + '$';
    const regex = new RegExp(regexStr);

    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.store.delete(key);
        continue;
      }
      if (regex.test(key)) {
        results.push(key);
      }
    }
    return results;
  }
}

// Initialized as a mock client first, then replaced on connect
let redisClient: IRedisClient = new MemoryRedisClient();

async function initRedis(): Promise<IRedisClient> {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  console.log(`Connecting to Redis at ${redisUrl}...`);
  
  const realClient = createClient({ url: redisUrl });
  
  realClient.on('error', (err: any) => {
    // Suppress error message spam if real Redis isn't running
  });

  try {
    // Attempt real connection with a 2-second timeout
    await Promise.race([
      realClient.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 2000))
    ]);
    
    console.log('✓ Successfully connected to local Redis Server.');
    
    // Wrap real client to match our interface
    redisClient = {
      connect: async () => {},
      get: async (key) => realClient.get(key),
      set: async (key, value, options) => {
        if (options?.EX) {
          await realClient.set(key, value, { EX: options.EX });
        } else {
          await realClient.set(key, value);
        }
      },
      del: async (key) => {
        await realClient.del(key);
      },
      incr: async (key) => realClient.incr(key),
      expire: async (key, seconds) => !!(await realClient.expire(key, seconds)),
      keys: async (pattern) => realClient.keys(pattern)
    };
  } catch (error) {
    console.warn('⚠ Could not connect to real Redis server. Falling back to in-memory cache.');
    try {
      await realClient.disconnect();
    } catch (_) {}
    
    const memClient = new MemoryRedisClient();
    await memClient.connect();
    redisClient = memClient;
  }

  return redisClient;
}

export { initRedis, redisClient };
export default redisClient;
