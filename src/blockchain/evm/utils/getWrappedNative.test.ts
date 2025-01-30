import { describe, it, expect } from 'vitest';
import { getWrappedNative } from './getWrappedNative';
import { WETH9 } from '../constants';
import { allEvmChains, Chain, EvmChain } from '../../constants/chains';

describe('getWrappedNative', () => {
    for (const chainId of allEvmChains) {
        it(`should return the correct token for chainId ${chainId}`, () => {
            const token = getWrappedNative(chainId);
            expect(token).toBe(WETH9[chainId]);
        });
    }

    it('should throw an error for an invalid chainId', () => {
        expect(() => getWrappedNative(Chain.SOLANA as EvmChain)).toThrow(`Wrapped native for chain ${Chain.SOLANA} not found`);
    });
});
