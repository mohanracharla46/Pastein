import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET() {
    try {
        // Check persistence layer
        await redis.ping();

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
        console.error('Health check failed:', error);
        return NextResponse.json({ ok: false, error: 'Persistence layer unreachable' }, { status: 500 });
    }
}
