/**
 * Tags for categorizing different types of adapters in the ecosystem
 * @enum AdapterTag
 * @example
 * ```typescript
 * // Using in adapter configuration
 * const swapAdapter: AdapterExport = {
 *   tags: [AdapterTag.DEX, AdapterTag.LP],
 *   // ... other properties
 * };
 *
 * // Filtering adapters by tag
 * const dexAdapters = adapters.filter(adapter =>
 *   adapter.tags.includes(AdapterTag.DEX)
 * );
 *
 * // Multiple tags for complex protocols
 * const compoundAdapter = {
 *   tags: [AdapterTag.LENDING, AdapterTag.FARM],
 *   // ... other properties
 * };
 * ```
 */
export enum AdapterTag {
    /** Automated Liquidity Management protocols */
    ALM = 'ALM',
    /** Staking protocols and validators */
    STAKE = 'Stake',
    /** Lending and borrowing protocols */
    LENDING = 'Lending',
    /** Yield farming and liquidity mining */
    FARM = 'Farm',
    /** Perpetual trading and derivatives */
    PERPETUALS = 'Perpetuals',
    /** Cross-chain bridges */
    BRIDGE = 'Bridge',
    /** Limit order protocols */
    LIMIT_ORDER = 'Limit orders',
    /** Decentralized exchanges */
    DEX = 'DEX',
    /** Liquidity provision protocols */
    LP = 'LP',
    /** Gaming and GameFi protocols */
    GAMES = 'Games',
    /** Centralized exchange integrations */
    CEX = 'CEX',
    /** Token launchpads and IDO platforms */
    LAUNCHPAD = 'Launchpad',
}
