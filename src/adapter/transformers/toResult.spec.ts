import { toResult } from './toResult';

describe('toResult', () => {
    it('should return success true when error is false', () => {
        const result = toResult('data', false);
        expect(result.success).toBe(true);
        expect(result.data).toBe('data');
    });

    it('should return success false when error is true', () => {
        const result = toResult('data', true);
        expect(result.success).toBe(false);
        expect(result.data).toBe('ERROR: data');
    });
});
