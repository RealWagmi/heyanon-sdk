import { Address, erc20Abi, encodeFunctionData, PublicClient } from 'viem';
import { TransactionParams } from '../../blockchain';

interface Props {
    readonly args: {
        readonly account: Address;
        readonly target: Address;
        readonly spender: Address;
        readonly amount: bigint;
    }
    readonly provider: PublicClient;
    readonly transactions: TransactionParams[];
}

export async function checkToApprove({ args, transactions, provider }: Props ): Promise<void> {
    const { account, target, spender, amount } = args;

    const allowance = await provider.readContract({
        address: target,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [account, spender],
    });

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
