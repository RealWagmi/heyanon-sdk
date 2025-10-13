import { EvmChain } from '../../constants';
import { ChainIds } from '../constants';

/**
 * Converts an EVM chain name to its corresponding numeric chain ID
 * @param chain - The EVM chain name
 * @returns The numeric chain ID for the specified chain
 * @throws {Error} When the chain name is not supported
 * @example
 * ```typescript
 * // Get chain IDs for different networks
 * const ethereumId = getChainFromName(Chain.ETHEREUM); // 1
 * const polygonId = getChainFromName(Chain.POLYGON);   // 137
 * const baseId = getChainFromName(Chain.BASE);         // 8453
 *
 * // Use in provider configuration
 * function createProvider(chain: EvmChain) {
 *   const chainId = getChainFromName(chain);
 *   return new PublicClient({
 *     chain: { id: chainId, name: chain },
 *     transport: http(getRpcUrl(chainId))
 *   });
 * }
 *
 * // Validate and switch wallet chain
 * async function switchWalletChain(targetChain: EvmChain) {
 *   try {
 *     const chainId = getChainFromName(targetChain);
 *
 *     await window.ethereum.request({
 *       method: 'wallet_switchEthereumChain',
 *       params: [{ chainId: `0x${chainId.toString(16)}` }]
 *     });
 *
 *     console.log(`Switched to ${targetChain} (Chain ID: ${chainId})`);
 *   } catch (error) {
 *     console.error(`Failed to switch to ${targetChain}:`, error);
 *   }
 * }
 *
 * // Use in multi-chain adapter function
 * async function getTokenBalance(chain: EvmChain, tokenAddress: string, userAddress: string) {
 *   const chainId = getChainFromName(chain);
 *   const provider = options.evm.getProvider(chainId);
 *
 *   return await provider.readContract({
 *     address: tokenAddress,
 *     abi: erc20Abi,
 *     functionName: 'balanceOf',
 *     args: [userAddress]
 *   });
 * }
 *
 * // Error handling example
 * function safeGetChainId(chain: string): number | null {
 *   try {
 *     return getChainFromName(chain as EvmChain);
 *   } catch (error) {
 *     console.warn(`Unsupported chain: ${chain}`);
 *     return null;
 *   }
 * }
 *
 * // Batch operations across multiple chains
 * async function getMultiChainData(chains: EvmChain[]) {
 *   const results = await Promise.allSettled(
 *     chains.map(async (chain) => {
 *       const chainId = getChainFromName(chain);
 *       const provider = options.evm.getProvider(chainId);
 *
 *       return {
 *         chain,
 *         chainId,
 *         blockNumber: await provider.getBlockNumber()
 *       };
 *     })
 *   );
 *
 *   return results
 *     .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
 *     .map(result => result.value);
 * }
 * ```
 */
export function getChainFromName(chain: EvmChain): number {
    const chainId = ChainIds[chain];
    if (!chainId) throw new Error(`Unknown chain name: ${chain}`);

    return chainId;
}
