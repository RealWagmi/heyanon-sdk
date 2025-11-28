import { getTimestamp } from './get-timestamp';
import { describe, it, expect } from 'vitest';

describe('getTimestamp', () => {
    it('should return number', () => {
        const timestamp = getTimestamp();
        expect(typeof timestamp).toBe('number');
    });
});
