import { stringify } from './stringify';
import { expect } from 'vitest';

describe('stringify', () => {
    test('should stringify an object correctly', () => {
        const obj = { key: 'value' };
        const result = stringify(obj);
        expect(result).toBe('{"key":"value"}');
    });

    test('should stringify an array correctly', () => {
        const arr = [1, 2, 3];
        const result = stringify(arr);
        expect(result).toBe('[1,2,3]');
    });

    test('should convert BigInt values to strings', () => {
        const obj = { big: 12345678901234567890n };
        const result = stringify(obj);
        expect(result).toBe('{"big":"12345678901234567890"}');
    });

    test('should handle nested structures with BigInt', () => {
        const obj = {
            nested: {
                bigArray: [1n, 2n, 3n],
            },
        };
        const result = stringify(obj);
        expect(result).toBe('{"nested":{"bigArray":["1","2","3"]}}');
    });

    test('should apply indentation when provided', () => {
        const obj = { key: 'value', big: 10n };
        const result = stringify(obj, 2);
        expect(result).toBe(`{\n  "key": "value",\n  "big": "10"\n}`);
    });
});
