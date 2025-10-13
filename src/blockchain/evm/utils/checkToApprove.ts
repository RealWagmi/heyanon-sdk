import { Address, erc20Abi, encodeFunctionData, PublicClient, getAddress } from 'viem';
import { TransactionParams } from '../types';

/**
 * Mapping of chain IDs to token addresses that require zero allowance before setting new approval
 * @constant ZERO_ALLOWANCE
 * @description Some tokens (like USDT on Ethereum) require setting allowance to 0 before setting a new non-zero value
 * @example
 * ```typescript
 * // USDT on Ethereum requires zero allowance reset
 * const usdtAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
 * const ethereumChainId = 1;
 *
 * // Check if token requires zero allowance
 * const requiresZero = ZERO_ALLOWANCE[ethereumChainId]?.includes(usdtAddress);
 * ```
 */
const ZERO_ALLOWANCE: Record<number, Address[]> = {
    /** Ethereum mainnet tokens requiring zero allowance reset */
    1: ['0xdAC17F958D2ee523a2206206994597C13D831ec7'], // USDT
};

/**
 * Properties for checking and preparing token approval transactions
 * @interface Props
 */
interface Props {
    /** Approval parameters */
    readonly args: {
        /** Account address that owns the tokens */
        readonly account: Address;
        /** Token contract address */
        readonly target: Address;
        /** Address that will be approved to spend tokens */
        readonly spender: Address;
        /** Amount of tokens to approve */
        readonly amount: bigint;
    };
    /** Ethereum provider for reading contract state */
    readonly provider: PublicClient;
    /** Transaction array to append approval transactions to */
    readonly transactions: TransactionParams[];
}

/**
 * Checks current token allowance and prepares approval transactions if needed
 * @param props - The approval check parameters
 * @description Handles special cases like USDT that require zero allowance before setting new approval
 * @example
 * ```typescript
 * // Basic usage in a swap function
 * async function prepareSwapTransactions() {
 *   const transactions: TransactionParams[] = [];
 *
 *   await checkToApprove({
 *     args: {
 *       account: '0x742d35Cc6634C0532925a3b8D4C2CA1c1DfF0bE8',
 *       target: '0xA0b86a33E6417e4681831442Ff7Bd6c25b5d9C7a', // USDC
 *       spender: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
 *       amount: parseUnits('100', 6) // 100 USDC
 *     },
 *     provider: publicClient,
 *     transactions
 *   });
 *
 *   // Add swap transaction
 *   transactions.push({
 *     target: routerAddress,
 *     data: swapCalldata
 *   });
 *
 *   return transactions;
 * }
 *
 * // Example with USDT (requires zero allowance)
 * async function approveUSDT() {
 *   const transactions: TransactionParams[] = [];
 *
 *   await checkToApprove({
 *     args: {
 *       account: userAddress,
 *       target: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
 *       spender: spenderAddress,
 *       amount: parseUnits('50', 6)
 *     },
 *     provider: ethereumProvider,
 *     transactions
 *   });
 *
 *   // Will generate two transactions for USDT:
 *   // 1. approve(spender, 0) - reset to zero
 *   // 2. approve(spender, amount) - set new allowance
 * }
 *
 * // Integration with adapter function
 * async function executeSwap(tokenIn: Address, tokenOut: Address, amountIn: bigint) {
 *   const transactions: TransactionParams[] = [];
 *
 *   // Check and prepare approval if needed
 *   if (tokenIn !== NATIVE_ADDRESS) {
 *     await checkToApprove({
 *       args: {
 *         account: await options.evm.getAddress(),
 *         target: tokenIn,
 *         spender: DEX_ROUTER_ADDRESS,
 *         amount: amountIn
 *       },
 *       provider: options.evm.getProvider(chainId),
 *       transactions
 *     });
 *   }
 *
 *   // Add swap transaction
 *   transactions.push(buildSwapTransaction(tokenIn, tokenOut, amountIn));
 *
 *   return await options.evm.sendTransactions({ transactions });
 * }
 * ```
 */
export async function checkToApprove({ args, transactions, provider }: Props): Promise<void> {
    const { account, target, spender, amount } = args;

    // Read current allowance from the token contract
    const allowance = await provider.readContract({
        address: target,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [account, spender],
    });

    // Get chain ID for checking special token requirements
    let chainId = provider.chain?.id;
    if (!chainId) {
        chainId = await provider.getChainId();
    }

    // Handle tokens that require zero allowance before setting new approval (e.g., USDT)
    if (ZERO_ALLOWANCE[chainId]?.includes(getAddress(target))) {
        if (allowance < amount && allowance > 0n) {
            // First, reset allowance to zero
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

    // Set new allowance if current allowance is insufficient
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
