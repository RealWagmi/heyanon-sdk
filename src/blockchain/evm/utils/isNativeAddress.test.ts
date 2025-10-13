import { describe, it, expect } from 'vitest';
import { isNativeAddress } from './isNativeAddress';
import { NATIVE_ADDRESS } from '../constants';

describe('isNativeAddress', () => {
    it('should return true for the native address', () => {
        expect(isNativeAddress(NATIVE_ADDRESS)).toBe(true);
    });

    it('should return false for a non-native address', () => {
        expect(isNativeAddress('0x123')).toBe(false);
        expect(isNativeAddress('')).toBe(false);
        expect(isNativeAddress('invalidAddress')).toBe(false);
    });
});
