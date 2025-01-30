import { describe, it, expect, vi, Mock } from 'vitest';
import { getWrapData } from './getWrapData';
import { Chain } from '../../constants';
import { encodeFunctionData } from 'viem';
import { getWrapAddress } from './getWrapAddress';
import { WETH9Abi } from '../abis';

vi.mock('./getWrapAddress');
vi.mock('viem', () => ({
    encodeFunctionData: vi.fn(),
}));

describe('getWrapData', () => {
    it('should return correct TransactionParams', () => {
        const mockChain = Chain.ETHEREUM;
        const mockAmount = BigInt(1000);
        const mockWrapAddress = '0x1234567890abcdef1234567890abcdef12345678';
        const mockEncodedData = '0xabcdef';

        (getWrapAddress as Mock).mockReturnValue(mockWrapAddress);
        (encodeFunctionData as Mock).mockReturnValue(mockEncodedData);

        const result = getWrapData(mockChain, mockAmount);

        expect(result).toEqual({
            target: mockWrapAddress,
            data: mockEncodedData,
            value: mockAmount,
        });
        expect(getWrapAddress).toHaveBeenCalledWith(mockChain);
        expect(encodeFunctionData).toHaveBeenCalledWith({
            abi: WETH9Abi,
            functionName: 'deposit',
        });
    });
});
