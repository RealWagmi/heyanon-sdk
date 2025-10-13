import { Token } from '@real-wagmi/sdk';
import { WETH9 } from '../constants';
import { EvmChain } from '../../constants/chains';

/**
 * Retrieves the wrapped native token object for a specific EVM chain
 * @param chain - The EVM chain to get the wrapped native token for
 * @returns Complete Token object with address, decimals, symbol, name, and chainId
 * @throws {Error} When the chain doesn't have a configured wrapped native token
 * @example
 * ```typescript
 * // Get wrapped native tokens for different chains
 * const weth = getWrappedNative(Chain.ETHEREUM);
 * console.log(weth);
 * // Output: {
 * //   chainId: 1,
 * //   address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
 * //   decimals: 18,
 * //   symbol: 'WETH',
 * //   name: 'Wrapped Ether'
 * // }
 *
 * const wbnb = getWrappedNative(Chain.BSC);        // WBNB on BSC
 * const wpol = getWrappedNative(Chain.POLYGON);    // WPOL on Polygon
 * const wavax = getWrappedNative(Chain.AVALANCHE); // WAVAX on Avalanche
 *
 * // Use token properties in DeFi operations
 * function formatTokenAmount(chain: EvmChain, amount: bigint): string {
 *   const token = getWrappedNative(chain);
 *   const formatted = formatUnits(amount, token.decimals);
 *   return `${formatted} ${token.symbol}`;
 * }
 *
 * // Create token pair for DEX operations
 * function createTokenPair(chainA: EvmChain, chainB: EvmChain) {
 *   const tokenA = getWrappedNative(chainA);
 *   const tokenB = getWrappedNative(chainB);
 *
 *   return {
 *     tokenA,
 *     tokenB,
 *     isValid: tokenA.chainId !== tokenB.chainId
 *   };
 * }
 *
 * // Use in liquidity pool operations
 * async function addLiquidityWithWrappedNative(
 *   chain: EvmChain,
 *   otherToken: Token,
 *   amountNative: bigint,
 *   amountOther: bigint
 * ) {
 *   const wrappedNative = getWrappedNative(chain);
 *
 *   // First wrap native currency
 *   const wrapData = getWrapData(chain, amountNative);
 *
 *   // Then add liquidity
 *   const addLiquidityData = {
 *     target: LP_ROUTER_ADDRESS,
 *     data: encodeFunctionData({
 *       abi: lpRouterAbi,
 *       functionName: 'addLiquidity',
 *       args: [
 *         wrappedNative.address,
 *         otherToken.address,
 *         amountNative,
 *         amountOther,
 *         0n, // min amounts (should be calculated properly)
 *         0n,
 *         await options.evm.getAddress(),
 *         Math.floor(Date.now() / 1000) + 3600 // deadline
 *       ]
 *     })
 *   };
 *
 *   return await options.evm.sendTransactions({
 *     transactions: [wrapData, addLiquidityData]
 *   });
 * }
 *
 * // Token validation and comparison
 * function isWrappedNativeToken(chain: EvmChain, tokenAddress: string): boolean {
 *   try {
 *     const wrappedNative = getWrappedNative(chain);
 *     return wrappedNative.address.toLowerCase() === tokenAddress.toLowerCase();
 *   } catch (error) {
 *     return false;
 *   }
 * }
 *
 * // Generate token list for UI
 * function generateWrappedNativeTokenList(chains: EvmChain[]) {
 *   return chains.map(chain => {
 *     try {
 *       const token = getWrappedNative(chain);
 *       return {
 *         ...token,
 *         chainName: chain,
 *         logoURI: `https://tokens.app/tokens/${token.chainId}/${token.address}.png`,
 *         tags: ['wrapped', 'native']
 *       };
 *     } catch (error) {
 *       return null;
 *     }
 *   }).filter(Boolean);
 * }
 *
 * // Cross-chain token bridge preparation
 * async function prepareBridgeTransaction(
 *   sourceChain: EvmChain,
 *   targetChain: EvmChain,
 *   amount: bigint
 * ) {
 *   const sourceToken = getWrappedNative(sourceChain);
 *   const targetToken = getWrappedNative(targetChain);
 *
 *   return {
 *     source: {
 *       chain: sourceChain,
 *       token: sourceToken,
 *       amount
 *     },
 *     target: {
 *       chain: targetChain,
 *       token: targetToken,
 *       expectedAmount: amount // Simplified - should include bridge fees
 *     },
 *     bridgeConfig: {
 *       sourceChainId: sourceToken.chainId,
 *       targetChainId: targetToken.chainId,
 *       tokenAddress: sourceToken.address
 *     }
 *   };
 * }
 *
 * // Portfolio tracking with wrapped natives
 * async function getWrappedNativePortfolio(
 *   chains: EvmChain[],
 *   userAddress: Address
 * ) {
 *   const portfolio = await Promise.allSettled(
 *     chains.map(async (chain) => {
 *       const token = getWrappedNative(chain);
 *       const provider = options.evm.getProvider(token.chainId);
 *
 *       const balance = await provider.readContract({
 *         address: token.address,
 *         abi: erc20Abi,
 *         functionName: 'balanceOf',
 *         args: [userAddress]
 *       });
 *
 *       return {
 *         chain,
 *         token,
 *         balance,
 *         formattedBalance: formatUnits(balance, token.decimals),
 *         usdValue: await getTokenUSDValue(token, balance) // External price service
 *       };
 *     })
 *   );
 *
 *   return portfolio
 *     .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
 *     .map(result => result.value)
 *     .filter(item => item.balance > 0n);
 * }
 *
 * // DEX price comparison across chains
 * async function compareWrappedNativePrices(chains: EvmChain[]) {
 *   const priceData = await Promise.allSettled(
 *     chains.map(async (chain) => {
 *       const token = getWrappedNative(chain);
 *       const price = await getDEXPrice(token); // External price fetching
 *
 *       return {
 *         chain,
 *         token: token.symbol,
 *         address: token.address,
 *         priceUSD: price,
 *         chainId: token.chainId
 *       };
 *     })
 *   );
 *
 *   return priceData
 *     .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
 *     .map(result => result.value)
 *     .sort((a, b) => b.priceUSD - a.priceUSD);
 * }
 *
 * // Safe version that returns null instead of throwing
 * function safeGetWrappedNative(chain: EvmChain): Token | null {
 *   try {
 *     return getWrappedNative(chain);
 *   } catch (error) {
 *     return null;
 *   }
 * }
 * ```
 */
export function getWrappedNative(chain: EvmChain): Token {
    const token = WETH9[chain];
    if (!token) throw new Error(`Wrapped native for chain ${chain} not found`);
    return token;
}
