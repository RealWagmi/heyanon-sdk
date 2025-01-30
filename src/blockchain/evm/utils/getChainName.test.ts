import { describe, it, expect } from 'vitest';
import { getChainName } from './getChainName';
import { ChainIds } from '../constants/chains';

describe('getChainName', () => {
    for (let [name, chainId] of Object.entries(ChainIds)) {
        it(`should return the correct chain name for a valid chain id (${chainId})`, () => {
            expect(getChainName(chainId)).toBe(name);
        });
    }

    it('should throw an error for an invalid chain id', () => {
        const invalidChainId = -1;
        expect(() => getChainName(invalidChainId)).toThrow(`Chain name with id ${invalidChainId} not found`);
    });
});
