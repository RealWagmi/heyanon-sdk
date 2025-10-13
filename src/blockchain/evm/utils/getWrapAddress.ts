import { EvmChain } from '../../constants';
import { WETH9 } from '../constants';
import { Address } from 'viem';

/**
 * Retrieves the wrapped native token contract address for a specific EVM chain
 * @param chain - The EVM chain to get the wrapped token address for
 * @returns The contract address of the wrapped native token (WETH9-compatible)
 * @throws {Error} When the chain doesn't have a configured wrapped token address
 * @example
 * ```typescript
 * // Get wrapped token addresses for different chains
 * const wethAddress = getWrapAddress(Chain.ETHEREUM);   // '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
 * const wbnbAddress = getWrapAddress(Chain.BSC);        // '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
 * const wpolAddress = getWrapAddress(Chain.POLYGON);    // '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
 *
 * // Use in token operations
 * async function getWrappedTokenBalance(chain: EvmChain, userAddress: Address) {
 *   const wrapAddress = getWrapAddress(chain);
 *   const provider = options.evm.getProvider(getChainFromName(chain));
 *
 *   return await provider.readContract({
 *     address: wrapAddress,
 *     abi: erc20Abi,
 *     functionName: 'balanceOf',
 *     args: [userAddress]
 *   });
 * }
 *
 * // Check if token address is a wrapped native token
 * function isWrappedNativeToken(chain: EvmChain, tokenAddress: Address): boolean {
 *   try {
 *     const wrapAddress = getWrapAddress(chain);
 *     return wrapAddress.toLowerCase() === tokenAddress.toLowerCase();
 *   } catch (error) {
 *     return false;
 *   }
 * }
 *
 * // Use in DEX trading setup
 * async function setupTokenSwap(
 *   chain: EvmChain,
 *   tokenIn: Address,
 *   tokenOut: Address,
 *   amountIn: bigint
 * ) {
 *   const transactions: TransactionParams[] = [];
 *   const wrapAddress = getWrapAddress(chain);
 *
 *   // If input is native token, wrap it first
 *   if (tokenIn === NATIVE_ADDRESS) {
 *     const wrapData = getWrapData(chain, amountIn);
 *     transactions.push(wrapData);
 *     tokenIn = wrapAddress; // Update tokenIn to wrapped version
 *   }
 *
 *   // Add swap transaction
 *   transactions.push(buildSwapTransaction(tokenIn, tokenOut, amountIn));
 *
 *   // If output should be native, add unwrap transaction
 *   if (tokenOut === NATIVE_ADDRESS) {
 *     const unwrapData = getUnwrapData(chain, expectedAmountOut);
 *     transactions.push(unwrapData);
 *   }
 *
 *   return transactions;
 * }
 *
 * // Get wrapped token info for UI display
 * function getWrappedTokenInfo(chain: EvmChain) {
 *   const address = getWrapAddress(chain);
 *   const token = WETH9[chain];
 *
 *   return {
 *     address,
 *     name: token.name,
 *     symbol: token.symbol,
 *     decimals: token.decimals,
 *     chainId: token.chainId
 *   };
 * }
 *
 * // Approve wrapped token for spending
 * async function approveWrappedToken(
 *   chain: EvmChain,
 *   spender: Address,
 *   amount: bigint
 * ) {
 *   const wrapAddress = getWrapAddress(chain);
 *   const transactions: TransactionParams[] = [];
 *
 *   await checkToApprove({
 *     args: {
 *       account: await options.evm.getAddress(),
 *       target: wrapAddress,
 *       spender,
 *       amount
 *     },
 *     provider: options.evm.getProvider(getChainFromName(chain)),
 *     transactions
 *   });
 *
 *   return transactions;
 * }
 *
 * // Multi-chain wrapped token portfolio
 * async function getWrappedTokenPortfolio(
 *   chains: EvmChain[],
 *   userAddress: Address
 * ) {
 *   const portfolio = await Promise.allSettled(
 *     chains.map(async (chain) => {
 *       try {
 *         const wrapAddress = getWrapAddress(chain);
 *         const provider = options.evm.getProvider(getChainFromName(chain));
 *
 *         const balance = await provider.readContract({
 *           address: wrapAddress,
 *           abi: erc20Abi,
 *           functionName: 'balanceOf',
 *           args: [userAddress]
 *         });
 *
 *         return {
 *           chain,
 *           address: wrapAddress,
 *           balance,
 *           token: WETH9[chain]
 *         };
 *       } catch (error) {
 *         throw new Error(`Failed to get wrapped token for ${chain}: ${error.message}`);
 *       }
 *     })
 *   );
 *
 *   return portfolio
 *     .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
 *     .map(result => result.value)
 *     .filter(item => item.balance > 0n);
 * }
 *
 * // Safe version that returns null instead of throwing
 * function safeGetWrapAddress(chain: EvmChain): Address | null {
 *   try {
 *     return getWrapAddress(chain);
 *   } catch (error) {
 *     return null;
 *   }
 * }
 * ```
 */
export function getWrapAddress(chain: EvmChain): Address {
    const wraperAddress = WETH9[chain]?.address;
    if (!wraperAddress) throw new Error(`Wrap address not set: ${chain}`);

    return wraperAddress;
}
