import { Chain, EVM, EvmChain } from '../blockchain';
import { Address as TonAddress } from '@ton/ton';
import { isAddress } from './is-address';
import { getAddress } from 'viem';

const { NATIVE_ADDRESS, WETH9 } = EVM.constants;
const { isEvmChain } = EVM.utils;

/**
 * Normalizes a blockchain address to its canonical form for a specific chain
 *
 * This function performs chain-specific address normalization:
 * - Converts native token address (0xEee...eEe) to wrapped token address (WETH, WMATIC, etc.)
 * - Converts TON addresses to raw string format
 * - Validates address format before normalization
 *
 * @param chain - The blockchain network (Ethereum, Polygon, Solana, TON, etc.)
 * @param address - The address to normalize
 * @returns Normalized address in canonical format
 * @throws Error if address is invalid or WETH9 is not found for the chain
 *
 * @example
 * ```typescript
 * // EVM: Convert native address to WETH9
 * const normalized = normalizeAddress(
 *   Chain.ETHEREUM,
 *   '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
 * );
 * // Returns: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' (WETH on Ethereum)
 *
 * // Polygon: Native to Wrapped
 * const wmatic = normalizeAddress(
 *   Chain.POLYGON,
 *   '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
 * );
 * // Returns: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' (WMATIC)
 *
 * // Solana: Native address to wrapped SOL
 * const wsol = normalizeAddress(
 *   Chain.SOLANA,
 *   '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
 * );
 * // Returns: 'So11111111111111111111111111111111111111112' (Wrapped SOL)
 *
 * // TON: Convert to raw format
 * const tonRaw = normalizeAddress(
 *   Chain.TON,
 *   'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t'
 * );
 * // Returns: '0:...' (raw format)
 *
 * // Regular EVM address (no change)
 * const usdcAddress = normalizeAddress(
 *   Chain.ETHEREUM,
 *   '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
 * );
 * // Returns: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' (unchanged)
 *
 * // Token swap with normalization
 * async function swapTokens(
 *   chain: Chain,
 *   tokenIn: string,
 *   tokenOut: string,
 *   amount: bigint
 * ) {
 *   // Normalize addresses for consistent processing
 *   const normalizedTokenIn = normalizeAddress(chain, tokenIn);
 *   const normalizedTokenOut = normalizeAddress(chain, tokenOut);
 *
 *   const swapData = await buildSwapTransaction(
 *     chain,
 *     normalizedTokenIn,
 *     normalizedTokenOut,
 *     amount
 *   );
 *
 *   return swapData;
 * }
 *
 * // Usage: Swap native ETH to USDC
 * await swapTokens(
 *   Chain.ETHEREUM,
 *   '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
 *   '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
 *   BigInt('1000000000000000000')
 * );
 * ```
 */
export function normalizeAddress(chain: Chain, address: string): string {
    const { valid } = isAddress(address);
    if (!valid) throw new Error(`This is not a address: ${address}`);

    if (address.toLowerCase() === NATIVE_ADDRESS.toLowerCase()) {
        if (isEvmChain(chain)) {
            const weth9 = WETH9[chain as EvmChain];
            if (!weth9) throw new Error(`WETH9 not found for ${chain}`);
            return weth9.address;
        }

        if (chain === Chain.SOLANA) {
            return 'So11111111111111111111111111111111111111112';
        }

        if (chain === Chain.TON) {
            return '0:0000000000000000000000000000000000000000000000000000000000000000';
        }
    }

    if (isEvmChain(chain)) return getAddress(address);
    if (chain === Chain.TON) {
        const tonAddress = TonAddress.parse(address);
        return tonAddress.toRawString();
    }

    return address;
}
