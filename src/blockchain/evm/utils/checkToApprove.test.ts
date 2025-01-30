import { describe, it, expect, vi } from 'vitest';
import { checkToApprove } from './checkToApprove';
import { zeroAddress } from 'viem';
import { TransactionParams } from '../types';

describe('checkToApprove', () => {
    const mockProvider = {
        readContract: vi.fn(),
        chain: { id: 1 },
    } as any;

    const account = zeroAddress;
    const target = zeroAddress;
    const spender = zeroAddress;
    const amount: bigint = 1000n;

    it('should not add a transaction if allowance is sufficient', async () => {
        mockProvider.readContract.mockResolvedValue(BigInt(2000));
        const transactions: TransactionParams[] = [];

        await checkToApprove({
            args: { account, target, spender, amount },
            provider: mockProvider,
            transactions,
        });

        expect(transactions).toHaveLength(0);
    });

    it('should add a transaction if allowance is insufficient', async () => {
        mockProvider.readContract.mockResolvedValue(BigInt(500));
        const transactions: TransactionParams[] = [];

        await checkToApprove({
            args: { account, target, spender, amount },
            provider: mockProvider,
            transactions,
        });

        expect(transactions).toHaveLength(1);
        expect(transactions[0]).toEqual({
            target,
            data: expect.any(String),
        });
    });

    it('should add a zero allowance transaction', async () => {
        mockProvider.readContract.mockResolvedValue(BigInt(500));
        const transactions: TransactionParams[] = [];

        await checkToApprove({
            args: { account, target: '0xdAC17F958D2ee523a2206206994597C13D831ec7', spender, amount },
            provider: mockProvider,
            transactions,
        });

        expect(transactions).toHaveLength(2);
    });
});
