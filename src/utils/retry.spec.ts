import { describe, it, expect, vi } from 'vitest';
import { retry } from './retry';

describe('retry', () => {
    it('should resolve if the function succeeds on the first try', async () => {
        const fn = vi.fn().mockResolvedValue('success');
        const result = await retry(fn);
        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry the specified number of times if the function fails', async () => {
        const fn = vi
            .fn()
            .mockRejectedValueOnce(new Error('fail'))
            .mockRejectedValueOnce(new Error('fail'))
            .mockResolvedValue('success');
        const result = await retry(fn, { retries: 2 });
        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw an error if the function fails after the specified number of retries', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('fail'));
        await expect(retry(fn, { retries: 2 })).rejects.toThrow('fail');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should wait for the specified delay between retries', async () => {
        const fn = vi
            .fn()
            .mockRejectedValueOnce(new Error('fail'))
            .mockResolvedValue('success');
        const delayMs = 100;
        const start = Date.now();
        const result = await retry(fn, { retries: 1, delayMs });
        const end = Date.now();
        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(2);
        expect(end - start).toBeGreaterThanOrEqual(delayMs);
    });
});
