import { ChainIds } from '../constants/chains';

/**
 * Converts a numeric chain ID to its corresponding EVM chain name
 * @param chainId - The numeric chain ID to convert
 * @returns The chain name corresponding to the provided chain ID
 * @throws {Error} When the chain ID is not supported
 * @example
 * ```typescript
 * // Get chain names from IDs
 * const ethereumName = getChainName(1);      // 'ethereum'
 * const polygonName = getChainName(137);     // 'polygon'
 * const baseName = getChainName(8453);       // 'base'
 *
 * // Handle wallet chain changes
 * window.ethereum.on('chainChanged', (chainId: string) => {
 *   try {
 *     const decimalChainId = parseInt(chainId, 16);
 *     const chainName = getChainName(decimalChainId);
 *     console.log(`Switched to ${chainName} (Chain ID: ${decimalChainId})`);
 *
 *     // Update UI or reload data for new chain
 *     updateUIForChain(chainName);
 *   } catch (error) {
 *     console.warn(`Unsupported chain ID: ${chainId}`);
 *     showUnsupportedChainWarning();
 *   }
 * });
 *
 * // Validate user's current chain
 * async function validateCurrentChain() {
 *   const chainId = await window.ethereum.request({ method: 'eth_chainId' });
 *   const decimalChainId = parseInt(chainId, 16);
 *
 *   try {
 *     const chainName = getChainName(decimalChainId);
 *     return { supported: true, chainName, chainId: decimalChainId };
 *   } catch (error) {
 *     return { supported: false, chainId: decimalChainId };
 *   }
 * }
 *
 * // Display user-friendly chain information
 * function formatChainInfo(chainId: number) {
 *   try {
 *     const chainName = getChainName(chainId);
 *     const displayNames = {
 *       ethereum: 'Ethereum Mainnet',
 *       polygon: 'Polygon',
 *       bsc: 'Binance Smart Chain',
 *       arbitrum: 'Arbitrum One',
 *       base: 'Base',
 *       optimism: 'Optimism'
 *     };
 *
 *     return {
 *       name: chainName,
 *       displayName: displayNames[chainName] || chainName,
 *       chainId
 *     };
 *   } catch (error) {
 *     return {
 *       name: 'unknown',
 *       displayName: `Unknown Chain (${chainId})`,
 *       chainId
 *     };
 *   }
 * }
 *
 * // Use in multi-chain token tracking
 * async function getTokenInfo(tokenAddress: string, chainId: number) {
 *   try {
 *     const chainName = getChainName(chainId);
 *     const provider = options.evm.getProvider(chainId);
 *
 *     const [name, symbol, decimals] = await Promise.all([
 *       provider.readContract({
 *         address: tokenAddress,
 *         abi: erc20Abi,
 *         functionName: 'name'
 *       }),
 *       provider.readContract({
 *         address: tokenAddress,
 *         abi: erc20Abi,
 *         functionName: 'symbol'
 *       }),
 *       provider.readContract({
 *         address: tokenAddress,
 *         abi: erc20Abi,
 *         functionName: 'decimals'
 *       })
 *     ]);
 *
 *     return {
 *       chain: chainName,
 *       chainId,
 *       address: tokenAddress,
 *       name,
 *       symbol,
 *       decimals
 *     };
 *   } catch (error) {
 *     throw new Error(`Failed to get token info on chain ${chainId}: ${error.message}`);
 *   }
 * }
 *
 * // Safe version that returns null instead of throwing
 * function safeGetChainName(chainId: number): string | null {
 *   try {
 *     return getChainName(chainId);
 *   } catch (error) {
 *     return null;
 *   }
 * }
 * ```
 */
export function getChainName(chainId: number): string {
    for (const [name, chain] of Object.entries(ChainIds)) {
        if (chain === chainId) {
            return name;
        }
    }

    throw new Error(`Chain name with id ${chainId} not found`);
}
