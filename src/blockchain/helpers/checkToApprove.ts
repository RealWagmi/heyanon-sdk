import { Address, erc20Abi, encodeFunctionData, PublicClient } from 'viem';
import { TransactionParams } from '../../blockchain';
import { ChainId } from '../constants/chains';

const ZERO_ALLOWANCE = [
    { chainId: ChainId.ETHEREUM, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' }
] satisfies { chainId: ChainId, address: Address}[]

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

    if(ZERO_ALLOWANCE.some(({ chainId, address }) => chainId === provider.chain?.id && address.toLowerCase() === target.toLowerCase())) {
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
