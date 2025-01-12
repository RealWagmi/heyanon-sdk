import { Address, erc20Abi, encodeFunctionData } from 'viem';
import { TransactionParams, ChainId } from '../../blockchain';
import { FunctionOptions } from '../../adapter';

interface Props {
    readonly args: {
        readonly chainId: ChainId;
        readonly account: Address;
        readonly target: Address;
        readonly spender: Address;
        readonly amount: bigint;
    }
    readonly getProvider: FunctionOptions['getProvider'];
    readonly transactions: TransactionParams[];
}

export async function checkToApprove({ args, getProvider, transactions }: Props ): Promise<void> {
    const { chainId, account, target, spender, amount } = args;

    const publicClient = getProvider(chainId);

    const allowance = await publicClient.readContract({
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
