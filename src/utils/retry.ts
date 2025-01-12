interface Options {
    readonly retries?: number;
    readonly delayMs?: number;
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(fn: () => Promise<T>, options?: Options): Promise<T> {
    const { retries = 0, delayMs } = options ?? {};
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            if (delayMs) {
                await delay(delayMs);
            }
            return await retry(fn, { ...options, retries: retries - 1 });
        } else {
            throw error;
        }
    }
}
