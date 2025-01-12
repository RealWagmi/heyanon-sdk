import { describe, it, expect, vi } from 'vitest';
import { checkToApprove } from './checkToApprove';
import { erc20Abi, encodeFunctionData, zeroAddress } from 'viem';
import { TransactionParams, ChainId } from '../../blockchain';

describe('checkToApprove', () => {
    const mockProvider = {
        readContract: vi.fn(),
    };

    //@ts-ignore
    const getProvider: any = (chainId: ChainId) => mockProvider;

    const baseArgs = {
        chainId: 1 as ChainId,
        account: zeroAddress,
        target: zeroAddress,
        spender:zeroAddress,
        amount: BigInt(1000),
    };

    it('should not add a transaction if allowance is sufficient', async () => {
        mockProvider.readContract.mockResolvedValue(BigInt(2000));

        const transactions: TransactionParams[] = [];

        await checkToApprove({ args: baseArgs, getProvider, transactions });

        expect(transactions).toHaveLength(0);
    });

    it('should add a transaction if allowance is insufficient', async () => {
        mockProvider.readContract.mockResolvedValue(BigInt(500));

        const transactions: TransactionParams[] = [];

        await checkToApprove({ args: baseArgs, getProvider, transactions });

        expect(transactions).toHaveLength(1);
        expect(transactions[0]).toEqual({
            target: baseArgs.target,
            data: encodeFunctionData({
                abi: erc20Abi,
                functionName: 'approve',
                args: [baseArgs.spender, baseArgs.amount],
            }),
        });
    });
});