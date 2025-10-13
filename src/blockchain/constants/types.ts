/**
 * Types of supported wallet architectures
 * @enum WalletType
 * @example
 * ```typescript
 * // Getting recipient address for specific wallet type
 * const evmRecipient = await options.getRecipient(WalletType.EVM);
 * // Returns: "0x742d35Cc6634C0532925a3b8D4C2CA1c1DfF0bE8"
 *
 * const solanaRecipient = await options.getRecipient(WalletType.SOLANA);
 * // Returns: "11111111111111111111111111111112"
 *
 * const tonRecipient = await options.getRecipient(WalletType.TON);
 * // Returns: "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t"
 *
 * // Mapping chain to wallet type
 * function getWalletType(chain: Chain): WalletType {
 *   if (chain === Chain.SOLANA) return WalletType.SOLANA;
 *   if (chain === Chain.TON) return WalletType.TON;
 *   return WalletType.EVM; // All other chains are EVM-compatible
 * }
 *
 * // Using in adapter functions
 * async function sendToUser(amount: string, chain: Chain) {
 *   const walletType = getWalletType(chain);
 *   const recipient = await options.getRecipient(walletType);
 *   // ... send logic
 * }
 * ```
 */
export enum WalletType {
    /** Ethereum Virtual Machine compatible wallets (MetaMask, WalletConnect, etc.) */
    EVM = 'evm',
    /** Solana wallets (Phantom, Solflare, etc.) */
    SOLANA = 'solana',
    /** The Open Network wallets (Tonkeeper, TON Wallet, etc.) */
    TON = 'ton',
}
