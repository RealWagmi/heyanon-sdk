/**
 * Supported blockchain networks in the SDK
 * @enum Chain
 * @example
 * ```typescript
 * // Using chain in token configuration
 * const token: UserToken = {
 *   chain: Chain.ETHEREUM,
 *   name: "USD Coin",
 *   symbol: "USDC",
 *   address: "0xA0b86a33E6417e4681831442Ff7Bd6c25b5d9C7a",
 *   decimals: 6
 * };
 *
 * // Checking if chain is EVM compatible
 * const isEvm = chain !== Chain.SOLANA && chain !== Chain.TON;
 *
 * // Using in adapter configuration
 * const adapter: AdapterExport = {
 *   chains: [Chain.ETHEREUM, Chain.POLYGON, Chain.BSC],
 *   // ... other properties
 * };
 * ```
 */
export enum Chain {
    /** Ethereum mainnet */
    ETHEREUM = 'ethereum',
    /** Optimism Layer 2 */
    OPTIMISM = 'optimism',
    /** Binance Smart Chain */
    BSC = 'bsc',
    /** Gnosis Chain (formerly xDai) */
    GNOSIS = 'gnosis',
    /** Polygon (Matic) */
    POLYGON = 'polygon',
    /** Sonic blockchain */
    SONIC = 'sonic',
    /** zkSync Era */
    ZKSYNC = 'zksync',
    /** Metis Andromeda */
    METIS = 'metis',
    /** Kava EVM */
    KAVA_EVM = 'kava_evm',
    /** Base Layer 2 */
    BASE = 'base',
    /** Avalanche C-Chain */
    AVALANCHE = 'avalanche',
    /** Arbitrum One */
    ARBITRUM = 'arbitrum',
    /** Scroll Layer 2 */
    SCROLL = 'scroll',
    /** Solana blockchain */
    SOLANA = 'solana',
    /** The Open Network (TON) */
    TON = 'ton',
    /** HyperEVM blockchain */
    HYPEREVM = 'hyperevm',
    /** Plasma blockchain */
    PLASMA = 'plasma',
}

/**
 * Type representing EVM-compatible chains (excludes Solana and TON)
 * @example
 * ```typescript
 * function processEvmChain(chain: EvmChain) {
 *   // This function only accepts EVM chains
 *   console.log(`Processing EVM chain: ${chain}`);
 * }
 *
 * processEvmChain(Chain.ETHEREUM); // ✅ Valid
 * processEvmChain(Chain.POLYGON);  // ✅ Valid
 * processEvmChain(Chain.SOLANA);   // ❌ TypeScript error
 * ```
 */
export type EvmChain = Exclude<Chain, Chain.SOLANA | Chain.TON>;

/**
 * Array containing all supported blockchain chains
 * @example
 * ```typescript
 * // Get all available chains
 * console.log(`Supported chains: ${allChains.length}`);
 *
 * // Check if a chain is supported
 * const isSupported = allChains.includes(Chain.ETHEREUM);
 *
 * // Iterate through all chains
 * allChains.forEach(chain => {
 *   console.log(`Chain: ${chain}`);
 * });
 * ```
 */
export const allChains = Object.values(Chain);

/**
 * Array containing only EVM-compatible chains (excludes Solana and TON)
 * @example
 * ```typescript
 * // Get all EVM chains
 * console.log(`EVM chains: ${allEvmChains.length}`);
 *
 * // Filter tokens by EVM chains
 * const evmTokens = tokens.filter(token =>
 *   allEvmChains.includes(token.chain as EvmChain)
 * );
 *
 * // Create EVM-specific configuration
 * const evmConfig = {
 *   supportedChains: allEvmChains,
 *   rpcEndpoints: allEvmChains.map(chain => ({
 *     chain,
 *     url: getRpcUrl(chain)
 *   }))
 * };
 * ```
 */
export const allEvmChains = Object.values(Chain).filter(chain => chain !== Chain.SOLANA && chain !== Chain.TON);
