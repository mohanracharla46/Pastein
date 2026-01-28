import { notFound } from 'next/navigation';
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

export default async function ViewPastePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const now = await getCurrentTime();
    const key = `paste:${id}`;

    let result;
    try {
        result = await redis.eval(GET_PASTE_SCRIPT, 1, key, now) as any;
    } catch (error) {
        console.error('Persistence layer error:', error);
        throw new Error('Could not connect to the persistence layer. Please check your Redis configuration.');
    }

    if (result && result.err) {
        if (result.err === 'NOT_FOUND' || result.err === 'EXPIRED' || result.err === 'LIMIT_EXCEEDED') {
            notFound();
        }
        throw new Error(`Persistence error: ${result.err}`);
    }

    if (!result || !Array.isArray(result)) {
        throw new Error('Invalid response from persistence layer');
    }

    const [content, remaining_views, expires_at] = result;
    const viewsNum = (remaining_views !== null && remaining_views !== undefined) ? parseInt(remaining_views, 10) : null;
    const expiresDate = (expires_at !== null && expires_at !== undefined) ? new Date(parseInt(expires_at, 10)) : null;

    return (
        <div className="container">
            <div className="paste-card">
                <header className="paste-header">
                    <h1>Paste Details</h1>
                    <div className="paste-meta">
                        {viewsNum !== null && (
                            <span>Remaining Views: {viewsNum}</span>
                        )}
                        {expiresDate !== null && (
                            <span>
                                Expires at: {expiresDate.toLocaleString()}
                            </span>
                        )}
                    </div>
                </header>
                <hr />
                <div className="paste-content">
                    <pre>{content}</pre>
                </div>
                <footer>
                    <a href="/" className="btn-secondary">Create New Paste</a>
                </footer>
            </div>
        </div>
    );
}
