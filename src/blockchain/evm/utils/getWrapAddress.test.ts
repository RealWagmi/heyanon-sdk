import { describe, it, expect } from 'vitest';
import { getWrapAddress } from './getWrapAddress';
import { Chain, EvmChain } from '../../constants';
import { WETH9 } from '../constants';

describe('getWrapAddress', () => {
    it('should return the correct wrap address for a valid chain', () => {
        const chain = Chain.ETHEREUM;
        const expectedAddress = WETH9[chain].address;
        const result = getWrapAddress(chain);
        expect(result).toBe(expectedAddress);
    });

    it('should throw an error if the wrap address is not set for the chain', () => {
        const chain = 'InvalidChain' as Chain;
        expect(() => getWrapAddress(chain as EvmChain)).toThrow(`Wrap address not set: ${chain}`);
    });
});
