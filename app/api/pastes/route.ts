import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { redis } from '@/lib/redis';
import { getCurrentTime } from '@/lib/time';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { content, ttl_seconds, max_views } = body;

        // Validation
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json({ error: 'Content is required and must be non-empty' }, { status: 400 });
        }

        if (ttl_seconds !== undefined && (!Number.isInteger(ttl_seconds) || ttl_seconds < 1)) {
            return NextResponse.json({ error: 'ttl_seconds must be an integer >= 1' }, { status: 400 });
        }

        if (max_views !== undefined && (!Number.isInteger(max_views) || max_views < 1)) {
            return NextResponse.json({ error: 'max_views must be an integer >= 1' }, { status: 400 });
        }

        const id = nanoid(12);
        const now = await getCurrentTime();

        const pasteData: Record<string, string> = {
            content: content,
        };

        if (ttl_seconds) {
            pasteData.expires_at = (now + (ttl_seconds * 1000)).toString();
        }

        if (max_views) {
            pasteData.remaining_views = max_views.toString();
        }

        const key = `paste:${id}`;

        const pipeline = redis.pipeline();
        pipeline.hset(key, pasteData);
        if (ttl_seconds) {
            pipeline.expire(key, ttl_seconds);
        }
        await pipeline.exec();

        const host = req.headers.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const url = `${protocol}://${host}/p/${id}`;

        return NextResponse.json({ id, url }, { status: 201 });

    } catch (error) {
        console.error('Error creating paste:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
