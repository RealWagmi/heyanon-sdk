import { describe, it, expect, vi, Mock } from 'vitest';
import { getUnwrapData } from './getUnwrapData';
import { Chain } from '../../constants';
import { encodeFunctionData } from 'viem';
import { WETH9Abi } from '../abis';
import { getWrapAddress } from './getWrapAddress';

vi.mock('./getWrapAddress');
vi.mock('viem', () => ({
    encodeFunctionData: vi.fn(),
}));

describe('getUnwrapData', () => {
    it('should return correct transaction params', () => {
        const mockChain = Chain.ETHEREUM;
        const mockAmount = BigInt(1000);
        const mockWrapAddress = '0x1234567890abcdef1234567890abcdef12345678';
        const mockEncodedData = '0xabcdef';

        (getWrapAddress as Mock).mockReturnValue(mockWrapAddress);
        (encodeFunctionData as Mock).mockReturnValue(mockEncodedData);

        const result = getUnwrapData(mockChain, mockAmount);

        expect(result).toEqual({
            target: mockWrapAddress,
            data: mockEncodedData,
        });

        expect(getWrapAddress).toHaveBeenCalledWith(mockChain);
        expect(encodeFunctionData).toHaveBeenCalledWith({
            abi: WETH9Abi,
            functionName: 'withdraw',
            args: [mockAmount],
        });
    });
});
