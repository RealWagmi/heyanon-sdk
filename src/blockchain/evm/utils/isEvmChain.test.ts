import { describe, it, expect } from 'vitest';
import { isEvmChain } from './isEvmChain';
import { allEvmChains } from '../../constants';

describe('isEvmChain', () => {
    it('should return true for a valid EVM chain', () => {
        allEvmChains.forEach(chain => {
            expect(isEvmChain(chain)).toBe(true);
        });
    });

    it('should return false for an invalid EVM chain', () => {
        expect(isEvmChain('invalidChain')).toBe(false);
        expect(isEvmChain('')).toBe(false);
        expect(isEvmChain('123')).toBe(false);
    });
});
