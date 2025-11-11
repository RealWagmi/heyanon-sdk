import { Solana, WalletType } from '../blockchain';
import { Address as TonAddress } from '@ton/ton';
import { isAddress as viemIsAddress } from 'viem';

/**
 * Result object returned by the isAddress function
 * @interface IsAddressResult
 */
interface IsAddressResult {
    /** Whether the address is valid for any supported blockchain */
    valid: boolean;
    /** The type of wallet/blockchain the address belongs to (EVM, Solana, or TON) */
    walletType?: WalletType;
}

/**
 * Validates a blockchain address and determines its type across multiple blockchain networks
 * 
 * This function checks if a given string is a valid blockchain address for any of the
 * supported networks: EVM-compatible chains (Ethereum, Polygon, BSC, etc.), Solana, or TON.
 * It returns both the validation result and the detected wallet type.
 * 
 * @param value - The address string to validate
 * @returns Object containing validation result and wallet type
 * 
 * @example
 * ```typescript
 * // EVM address validation
 * const evmResult = isAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');
 * // Returns: { valid: true, walletType: WalletType.EVM }
 * 
 * // Solana address validation
 * const solanaResult = isAddress('DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK');
 * // Returns: { valid: true, walletType: WalletType.SOLANA }
 * 
 * // TON address validation
 * const tonResult = isAddress('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t');
 * // Returns: { valid: true, walletType: WalletType.TON }
 * 
 * // Invalid address
 * const invalidResult = isAddress('invalid-address');
 * // Returns: { valid: false }
 * 
 * // Routing transactions based on address type
 * async function sendTokens(recipientAddress: string, amount: bigint) {
 *   const { valid, walletType } = isAddress(recipientAddress);
 *   
 *   if (!valid) {
 *     throw new Error('Invalid recipient address');
 *   }
 *   
 *   switch (walletType) {
 *     case WalletType.EVM:
 *       return await options.evm.sendTransactions({
 *         transactions: [{ to: recipientAddress, value: amount }]
 *       });
 *       
 *     case WalletType.SOLANA:
 *       return await options.solana.sendTransactions({
 *         transactions: [{ instructions: [...] }]
 *       });
 *       
 *     case WalletType.TON:
 *       return await options.ton.sendTransactions({
 *         transactions: [{ to: recipientAddress, value: amount }]
 *       });
 *   }
 * }
 * 
 * // User input validation
 * function validateUserInput(userAddress: string) {
 *   const { valid, walletType } = isAddress(userAddress);
 *   
 *   if (!valid) {
 *     return { success: false, error: 'Invalid address format' };
 *   }
 *   
 *   return { success: true, walletType, address: userAddress };
 * }
 * ```
 */
export function isAddress(value: string): IsAddressResult {
    let result: IsAddressResult = { valid: false };

    try {
        result.valid = viemIsAddress(value);
        if (result.valid) {
            result.walletType = WalletType.EVM;
        }
    } catch (_error) {}

    try {
        Solana.utils.toPublicKey(value);
        result.valid = true;
        result.walletType = WalletType.SOLANA;
    } catch (_error) {}

    try {
        TonAddress.parse(value);
        result.valid = true;
        result.walletType = WalletType.TON;
    } catch (_error) {}

    return result;
}
