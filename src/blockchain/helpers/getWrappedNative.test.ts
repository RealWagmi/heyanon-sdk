import { describe, it, expect } from 'vitest';
import { getWrappedNative } from './getWrappedNative';
import { allChainIds, ChainId, WETH9 } from '../constants';

describe('getWrappedNative', () => {
    for (const chainId of allChainIds) {
        it(`should return the correct token for chainId ${chainId}`, () => {
            const token = getWrappedNative(chainId);
            expect(token).toBe(WETH9[chainId as keyof typeof WETH9]);
        });
    }

    it('should throw an error for an invalid chainId', () => {
        const invalidChainId = -1; // Assuming 9999 is not a valid chainId
        expect(() => getWrappedNative(invalidChainId as ChainId)).toThrow(`Wrapped native for chainId ${invalidChainId} not found`);
    });
});
