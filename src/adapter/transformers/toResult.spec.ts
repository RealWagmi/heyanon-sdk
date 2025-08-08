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

    it('should format object data correctly', () => {
        const data = { key: 'value' };
        const result = toResult(data, false);
        expect(result.success).toBe(true);
        expect(result.data).toBe(JSON.stringify(data));
    });

    it('should format array data correctly', () => {
        const data = [1, 2, 3];
        const result = toResult(data, false);
        expect(result.success).toBe(true);
        expect(result.data).toBe(JSON.stringify(data));
    });
});
