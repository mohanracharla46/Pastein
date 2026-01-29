import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

const globalForRedis = global as unknown as { redis: any };

// Simulation for local-only testing WITHOUT a Redis server
const mockRedis = {
    pastes: new Map<string, any>(),
    pipeline() {
        return {
            _ops: [] as any[],
            hset(key: string, data: any) { this._ops.push(() => mockRedis.pastes.set(key, data)); return this; },
            expire(key: string, ttl: number) { return this; },
            async exec() { this._ops.forEach(op => op()); this._ops = []; return []; }
        };
    },
    async eval(script: string, numKeys: number, key: string, now: number) {
        const data = mockRedis.pastes.get(key);
        if (!data) return { err: 'NOT_FOUND' };

        if (data.expires_at && parseInt(data.expires_at) <= now) {
            mockRedis.pastes.delete(key);
            return { err: 'EXPIRED' };
        }

        if (data.remaining_views) {
            let remaining = parseInt(data.remaining_views);
            if (remaining <= 0) return { err: 'LIMIT_EXCEEDED' };
            remaining--;
            data.remaining_views = remaining.toString();
            mockRedis.pastes.set(key, data);
        }

        return [data.content, data.remaining_views || null, data.expires_at || null];
    },
    async ping() { return 'PONG'; },
    on() { return this; }
};

if (!globalForRedis.redis) {
    if (redisUrl) {
        const options: any = {
            maxRetriesPerRequest: null,
            retryStrategy: (times: number) => Math.min(times * 50, 2000),
        };

        // If using rediss:// (SSL), common in managed Redis services
        if (redisUrl.startsWith('rediss://')) {
            options.tls = {
                rejectUnauthorized: false // Often required for internal or self-signed certs in cloud envs
            };
        }

        globalForRedis.redis = new Redis(redisUrl, options);
    } else if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: REDIS_URL is not defined in production environment!');
        globalForRedis.redis = mockRedis; // Last resort fallback to prevent crash, but should be fixed
    } else {
        globalForRedis.redis = mockRedis;
    }
}

export const redis = globalForRedis.redis;
