import { headers } from 'next/headers';

/**
 * Gets the current time, considering the TEST_MODE and x-test-now-ms header.
 */
export async function getCurrentTime(): Promise<number> {
    const isTestMode = process.env.TEST_MODE === '1';

    if (isTestMode) {
        const headersList = await headers();
        const testNowMs = headersList.get('x-test-now-ms');

        if (testNowMs) {
            const parsed = parseInt(testNowMs, 10);
            if (!isNaN(parsed)) {
                return parsed;
            }
        }
    }

    return Date.now();
}
