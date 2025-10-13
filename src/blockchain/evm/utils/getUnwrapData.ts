import { EvmChain } from '../../constants';
import { TransactionParams } from '../types';
import { encodeFunctionData } from 'viem';
import { WETH9Abi } from '../abis';
import { getWrapAddress } from './getWrapAddress';

/**
 * Generates transaction data for unwrapping tokens (converting wrapped tokens back to native currency)
 * @param chain - The EVM chain where the unwrap operation will occur
 * @param amount - The amount of wrapped tokens to unwrap (in wei/smallest unit)
 * @returns Transaction parameters for the unwrap operation
 * @example
 * ```typescript
 * import { parseEther } from 'viem';
 *
 * // Basic unwrap operation
 * const unwrapTxData = getUnwrapData(Chain.ETHEREUM, parseEther('1')); // Unwrap 1 WETH to ETH
 * // Returns: { target: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', data: '0x...' }
 *
 * // Different chains with their wrapped tokens
 * const unwrapWBNB = getUnwrapData(Chain.BSC, parseEther('0.5'));      // WBNB → BNB
 * const unwrapWMATIC = getUnwrapData(Chain.POLYGON, parseEther('100')); // WPOL → POL
 * const unwrapWAVAX = getUnwrapData(Chain.AVALANCHE, parseEther('10')); // WAVAX → AVAX
 *
 * // Use in adapter function
 * async function unwrapTokens(chain: EvmChain, amount: string) {
 *   const amountBigInt = parseEther(amount);
 *   const unwrapData = getUnwrapData(chain, amountBigInt);
 *
 *   return await options.evm.sendTransactions({
 *     transactions: [unwrapData]
 *   });
 * }
 *
 * // Complete unwrap workflow with balance check
 * async function safeUnwrapTokens(chain: EvmChain, amount: bigint) {
 *   const userAddress = await options.evm.getAddress();
 *   const wrappedTokenAddress = getWrapAddress(chain);
 *   const provider = options.evm.getProvider(getChainFromName(chain));
 *
 *   // Check user's wrapped token balance
 *   const balance = await provider.readContract({
 *     address: wrappedTokenAddress,
 *     abi: WETH9Abi,
 *     functionName: 'balanceOf',
 *     args: [userAddress]
 *   });
 *
 *   if (balance < amount) {
 *     throw new Error(`Insufficient wrapped token balance. Have: ${balance}, Need: ${amount}`);
 *   }
 *
 *   // Generate unwrap transaction
 *   const unwrapData = getUnwrapData(chain, amount);
 *
 *   return await options.evm.sendTransactions({
 *     transactions: [unwrapData]
 *   });
 * }
 *
 * // Batch unwrap on multiple chains
 * async function batchUnwrapAcrossChains(
 *   operations: Array<{ chain: EvmChain; amount: bigint }>
 * ) {
 *   const results = await Promise.allSettled(
 *     operations.map(async ({ chain, amount }) => {
 *       const unwrapData = getUnwrapData(chain, amount);
 *
 *       return {
 *         chain,
 *         amount,
 *         transaction: await options.evm.sendTransactions({
 *           transactions: [unwrapData]
 *         })
 *       };
 *     })
 *   );
 *
 *   return results.map((result, index) => ({
 *     ...operations[index],
 *     success: result.status === 'fulfilled',
 *     result: result.status === 'fulfilled' ? result.value : result.reason
 *   }));
 * }
 *
 * // Use in DeFi yield withdrawal
 * async function withdrawYieldAndUnwrap(chain: EvmChain, poolAddress: string) {
 *   const transactions: TransactionParams[] = [];
 *
 *   // First, withdraw from yield farming pool (gets wrapped tokens)
 *   transactions.push({
 *     target: poolAddress,
 *     data: encodeFunctionData({
 *       abi: yieldPoolAbi,
 *       functionName: 'withdraw',
 *       args: [userStakedAmount]
 *     })
 *   });
 *
 *   // Then unwrap the received tokens to native currency
 *   const unwrapData = getUnwrapData(chain, expectedWrappedAmount);
 *   transactions.push(unwrapData);
 *
 *   return await options.evm.sendTransactions({ transactions });
 * }
 *
 * // Gas estimation for unwrap operation
 * async function estimateUnwrapGas(chain: EvmChain, amount: bigint) {
 *   const unwrapData = getUnwrapData(chain, amount);
 *   const provider = options.evm.getProvider(getChainFromName(chain));
 *   const userAddress = await options.evm.getAddress();
 *
 *   return await provider.estimateGas({
 *     account: userAddress,
 *     to: unwrapData.target,
 *     data: unwrapData.data
 *   });
 * }
 * ```
 */
export function getUnwrapData(chain: EvmChain, amount: bigint): TransactionParams {
    const wraperAddress = getWrapAddress(chain);

    return {
        target: wraperAddress,
        data: encodeFunctionData({
            abi: WETH9Abi,
            functionName: 'withdraw',
            args: [amount],
        }),
    };
}
