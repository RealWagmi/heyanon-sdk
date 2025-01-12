import { describe, it, expect } from 'vitest';
import { getChainName } from './getChainName';
import { chainNames, allChainIds, ChainId } from '../constants';

describe('getChainName', () => {
    for (let chainId of allChainIds) {
        it(`should return the correct chain name for a valid chain id (${chainId})`, () => {
            const expectedName = chainNames[chainId];
            expect(getChainName(chainId)).toBe(expectedName);
        });
    }

    it('should throw an error for an invalid chain id', () => {
        const invalidChainId = -1; // Assuming 999 is an invalid ChainId
        expect(() => getChainName(invalidChainId as ChainId)).toThrow(`Chain name with id ${invalidChainId} not found`);
    });
});
