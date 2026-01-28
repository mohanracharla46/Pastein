import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getCurrentTime } from '@/lib/time';

const GET_PASTE_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])

local exists = redis.call('EXISTS', key)
if exists == 0 then
    return {err = "NOT_FOUND"}
end

local expires_at = redis.call('HGET', key, 'expires_at')
if expires_at and tonumber(expires_at) <= now then
    redis.call('DEL', key)
    return {err = "EXPIRED"}
end

local remaining_views = redis.call('HGET', key, 'remaining_views')
if remaining_views then
    local remaining = tonumber(remaining_views)
    if remaining <= 0 then
        return {err = "LIMIT_EXCEEDED"}
    end
    -- Decrement view count
    remaining = redis.call('HINCRBY', key, 'remaining_views', -1)
    remaining_views = tostring(remaining)
end

local content = redis.call('HGET', key, 'content')

return {content, remaining_views, expires_at}
`;

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const now = await getCurrentTime();
        const key = `paste:${id}`;

        const result = await redis.eval(GET_PASTE_SCRIPT, 1, key, now) as any;

        if (result && result.err) {
            if (result.err === 'NOT_FOUND' || result.err === 'EXPIRED' || result.err === 'LIMIT_EXCEEDED') {
                return NextResponse.json({ error: result.err === 'NOT_FOUND' ? 'Missing paste' : (result.err === 'EXPIRED' ? 'Expired paste' : 'View limit exceeded') }, { status: 404 });
            }
            throw new Error(`Persistence error: ${result.err}`);
        }

        if (!result || !Array.isArray(result)) {
            throw new Error('Invalid response from persistence layer');
        }

        const [content, remaining_views, expires_at] = result;

        return NextResponse.json({
            content,
            remaining_views: (remaining_views !== null && remaining_views !== undefined) ? parseInt(remaining_views, 10) : null,
            expires_at: (expires_at !== null && expires_at !== undefined) ? new Date(parseInt(expires_at, 10)).toISOString() : null,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error fetching paste:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
