import { Chain, EvmChain } from '../../constants';

/**
 * Mapping of EVM chain names to their corresponding chain IDs
 * @constant ChainIds
 * @example
 * ```typescript
 * // Get chain ID for specific network
 * const ethereumId = ChainIds[Chain.ETHEREUM]; // 1
 * const polygonId = ChainIds[Chain.POLYGON];   // 137
 * const baseId = ChainIds[Chain.BASE];         // 8453
 * 
 * // Use in RPC provider configuration
 * const provider = new PublicClient({
 *   chain: {
 *     id: ChainIds[Chain.ETHEREUM],
 *     name: 'Ethereum',
 *     network: 'ethereum'
 *   }
 * });
 * 
 * // Validate chain ID from wallet
 * function isValidChain(chainId: number): boolean {
 *   return Object.values(ChainIds).includes(chainId);
 * }
 * 
 * // Get chain name from ID
 * function getChainFromId(chainId: number): EvmChain | undefined {
 *   return Object.entries(ChainIds).find(
 *     ([_, id]) => id === chainId
 *   )?.[0] as EvmChain;
 * }
 * 
 * // Switch wallet to specific chain
 * async function switchToChain(chain: EvmChain) {
 *   const chainId = ChainIds[chain];
 *   await window.ethereum.request({
 *     method: 'wallet_switchEthereumChain',
 *     params: [{ chainId: `0x${chainId.toString(16)}` }]
 *   });
 * }
 * ```
 */
export const ChainIds = {
    /** Ethereum Mainnet - Chain ID: 1 */
    [Chain.ETHEREUM]: 1,
    /** Optimism - Chain ID: 10 */
    [Chain.OPTIMISM]: 10,
    /** Binance Smart Chain - Chain ID: 56 */
    [Chain.BSC]: 56,
    /** Gnosis Chain - Chain ID: 100 */
    [Chain.GNOSIS]: 100,
    /** Polygon - Chain ID: 137 */
    [Chain.POLYGON]: 137,
    /** Sonic - Chain ID: 146 */
    [Chain.SONIC]: 146,
    /** zkSync Era - Chain ID: 324 */
    [Chain.ZKSYNC]: 324,
    /** Metis Andromeda - Chain ID: 1088 */
    [Chain.METIS]: 1088,
    /** Kava EVM - Chain ID: 2222 */
    [Chain.KAVA_EVM]: 2222,
    /** Base - Chain ID: 8453 */
    [Chain.BASE]: 8453,
    /** Avalanche C-Chain - Chain ID: 43114 */
    [Chain.AVALANCHE]: 43_114,
    /** Arbitrum One - Chain ID: 42161 */
    [Chain.ARBITRUM]: 42_161,
    /** Scroll - Chain ID: 534352 */
    [Chain.SCROLL]: 534_352,
    /** HyperEVM - Chain ID: 999 */
    [Chain.HYPEREVM]: 999,
    /** Plasma - Chain ID: 9745 */
    [Chain.PLASMA]: 9745,
} satisfies Record<EvmChain, number>;