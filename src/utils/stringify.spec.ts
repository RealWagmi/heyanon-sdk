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

    test('should handle circular references', () => {
        const obj: any = { key: 'value' };
        obj.self = obj;
        const result = stringify(obj);
        expect(result).toBe('{"key":"value","self":"[Circular]"}');
    });
});
