import { sleep } from './sleep';
import { expect } from 'vitest';

describe('sleep', () => {
    test('should resolve after the specified time', async () => {
        const start = Date.now();
        const delay = 1000; // milliseconds

        await sleep(delay);

        const end = Date.now();
        const elapsed = end - start;

        expect(elapsed).toBeGreaterThanOrEqual(delay);
    });
});
