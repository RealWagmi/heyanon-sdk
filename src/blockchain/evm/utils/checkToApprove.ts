import { Address, erc20Abi, encodeFunctionData, PublicClient, getAddress } from 'viem';
import { TransactionParams } from '../types';

const ZERO_ALLOWANCE: Record<number, Address[]> = {
    1: ['0xdAC17F958D2ee523a2206206994597C13D831ec7'],
};

interface Props {
    readonly args: {
        readonly account: Address;
        readonly target: Address;
        readonly spender: Address;
        readonly amount: bigint;
    };
    readonly provider: PublicClient;
    readonly transactions: TransactionParams[];
}

export async function checkToApprove({ args, transactions, provider }: Props): Promise<void> {
    const { account, target, spender, amount } = args;

    const allowance = await provider.readContract({
        address: target,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [account, spender],
    });

    let chainId = provider.chain?.id;
    if (!chainId) {
        chainId = await provider.getChainId();
    }

    if (ZERO_ALLOWANCE[chainId]?.includes(getAddress(target))) {
        if (allowance < amount && allowance > 0n) {
            transactions.push({
                target,
                data: encodeFunctionData({
                    abi: erc20Abi,
                    functionName: 'approve',
                    args: [spender, 0n],
                }),
            });
        }
    }

    if (allowance < amount) {
        transactions.push({
            target,
            data: encodeFunctionData({
                abi: erc20Abi,
                functionName: 'approve',
                args: [spender, amount],
            }),
        });
    }
}
