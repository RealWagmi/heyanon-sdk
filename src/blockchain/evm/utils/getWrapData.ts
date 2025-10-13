import { TransactionParams } from '../types';
import { EvmChain } from '../../constants';
import { encodeFunctionData } from 'viem';
import { WETH9Abi } from '../abis';
import { getWrapAddress } from './getWrapAddress';

/**
 * Generates transaction data for wrapping native currency into wrapped tokens (e.g., ETH → WETH)
 * @param chain - The EVM chain where the wrap operation will occur
 * @param amount - The amount of native currency to wrap (in wei/smallest unit)
 * @returns Transaction parameters for the wrap operation including target, data, and value
 * @example
 * ```typescript
 * import { parseEther } from 'viem';
 *
 * // Basic wrap operation
 * const wrapTxData = getWrapData(Chain.ETHEREUM, parseEther('1')); // Wrap 1 ETH to WETH
 * // Returns: {
 * //   target: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
 * //   data: '0xd0e30db0',
 * //   value: 1000000000000000000n
 * // }
 *
 * // Different chains with their native currencies
 * const wrapBNB = getWrapData(Chain.BSC, parseEther('0.5'));      // BNB → WBNB
 * const wrapMATIC = getWrapData(Chain.POLYGON, parseEther('100')); // POL → WPOL
 * const wrapAVAX = getWrapData(Chain.AVALANCHE, parseEther('10')); // AVAX → WAVAX
 *
 * // Use in adapter function
 * async function wrapNativeTokens(chain: EvmChain, amount: string) {
 *   const amountBigInt = parseEther(amount);
 *   const wrapData = getWrapData(chain, amountBigInt);
 *
 *   return await options.evm.sendTransactions({
 *     transactions: [wrapData]
 *   });
 * }
 *
 * // Complete wrap workflow with balance check
 * async function safeWrapTokens(chain: EvmChain, amount: bigint) {
 *   const userAddress = await options.evm.getAddress();
 *   const provider = options.evm.getProvider(getChainFromName(chain));
 *
 *   // Check user's native token balance
 *   const balance = await provider.getBalance({ address: userAddress });
 *
 *   if (balance < amount) {
 *     throw new Error(`Insufficient native token balance. Have: ${balance}, Need: ${amount}`);
 *   }
 *
 *   // Generate wrap transaction
 *   const wrapData = getWrapData(chain, amount);
 *
 *   return await options.evm.sendTransactions({
 *     transactions: [wrapData]
 *   });
 * }
 *
 * // Use in DEX operations that require wrapped tokens
 * async function wrapAndSwap(
 *   chain: EvmChain,
 *   amountIn: bigint,
 *   tokenOut: Address,
 *   minAmountOut: bigint
 * ) {
 *   const transactions: TransactionParams[] = [];
 *
 *   // First, wrap native currency
 *   const wrapData = getWrapData(chain, amountIn);
 *   transactions.push(wrapData);
 *
 *   // Then approve wrapped token for DEX
 *   const wrapAddress = getWrapAddress(chain);
 *   await checkToApprove({
 *     args: {
 *       account: await options.evm.getAddress(),
 *       target: wrapAddress,
 *       spender: DEX_ROUTER_ADDRESS,
 *       amount: amountIn
 *     },
 *     provider: options.evm.getProvider(getChainFromName(chain)),
 *     transactions
 *   });
 *
 *   // Finally, execute swap
 *   transactions.push({
 *     target: DEX_ROUTER_ADDRESS,
 *     data: encodeFunctionData({
 *       abi: dexRouterAbi,
 *       functionName: 'swapExactTokensForTokens',
 *       args: [amountIn, minAmountOut, [wrapAddress, tokenOut], userAddress, deadline]
 *     })
 *   });
 *
 *   return await options.evm.sendTransactions({ transactions });
 * }
 *
 * // Batch wrap operations across multiple chains
 * async function batchWrapAcrossChains(
 *   operations: Array<{ chain: EvmChain; amount: bigint }>
 * ) {
 *   const results = await Promise.allSettled(
 *     operations.map(async ({ chain, amount }) => {
 *       const wrapData = getWrapData(chain, amount);
 *
 *       return {
 *         chain,
 *         amount,
 *         transaction: await options.evm.sendTransactions({
 *           transactions: [wrapData]
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
 * // Use in yield farming setup
 * async function wrapAndStake(
 *   chain: EvmChain,
 *   stakingPoolAddress: Address,
 *   amount: bigint
 * ) {
 *   const transactions: TransactionParams[] = [];
 *   const wrapAddress = getWrapAddress(chain);
 *
 *   // Wrap native currency
 *   const wrapData = getWrapData(chain, amount);
 *   transactions.push(wrapData);
 *
 *   // Approve wrapped token for staking pool
 *   await checkToApprove({
 *     args: {
 *       account: await options.evm.getAddress(),
 *       target: wrapAddress,
 *       spender: stakingPoolAddress,
 *       amount
 *     },
 *     provider: options.evm.getProvider(getChainFromName(chain)),
 *     transactions
 *   });
 *
 *   // Stake wrapped tokens
 *   transactions.push({
 *     target: stakingPoolAddress,
 *     data: encodeFunctionData({
 *       abi: stakingPoolAbi,
 *       functionName: 'stake',
 *       args: [amount]
 *     })
 *   });
 *
 *   return await options.evm.sendTransactions({ transactions });
 * }
 *
 * // Gas estimation for wrap operation
 * async function estimateWrapGas(chain: EvmChain, amount: bigint) {
 *   const wrapData = getWrapData(chain, amount);
 *   const provider = options.evm.getProvider(getChainFromName(chain));
 *   const userAddress = await options.evm.getAddress();
 *
 *   return await provider.estimateGas({
 *     account: userAddress,
 *     to: wrapData.target,
 *     data: wrapData.data,
 *     value: wrapData.value
 *   });
 * }
 *
 * // Progressive wrap for large amounts
 * async function progressiveWrap(
 *   chain: EvmChain,
 *   totalAmount: bigint,
 *   batchSize: bigint = parseEther('10')
 * ) {
 *   const transactions: TransactionParams[] = [];
 *   let remainingAmount = totalAmount;
 *
 *   while (remainingAmount > 0n) {
 *     const currentBatch = remainingAmount > batchSize ? batchSize : remainingAmount;
 *     const wrapData = getWrapData(chain, currentBatch);
 *     transactions.push(wrapData);
 *
 *     remainingAmount -= currentBatch;
 *   }
 *
 *   return await options.evm.sendTransactions({ transactions });
 * }
 * ```
 */
export function getWrapData(chain: EvmChain, amount: bigint): TransactionParams {
    const wraperAddress = getWrapAddress(chain);

    return {
        target: wraperAddress,
        data: encodeFunctionData({
            abi: WETH9Abi,
            functionName: 'deposit',
        }),
        value: amount,
    };
}
