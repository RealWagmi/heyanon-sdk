import { describe, it, expect } from 'vitest';
import { getChainFromName } from './getChainFromName';
import { allEvmChains } from '../../constants/chains';
import { EvmChain } from '../../constants';

describe('getChainFromName', () => {
    for (const chainName of allEvmChains) {
        it(`should return the correct ChainId for ${chainName}`, () => {
            const result = getChainFromName(chainName);
            expect(typeof result).toBe('number');
        });
    }

    it('should throw an error for an unknown chain name', () => {
        expect(() => getChainFromName('unknownChain' as EvmChain)).toThrow('Unknown chain name: unknownChain');
    });
});
