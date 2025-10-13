import { EvmChain, allEvmChains } from '../../constants';

/**
 * Checks if a given chain name is an EVM-compatible blockchain
 * @param chain - The chain name to validate
 * @returns True if the chain is EVM-compatible, false otherwise
 * @description This function excludes non-EVM chains like Solana and TON
 * @example
 * ```typescript
 * // Valid EVM chains
 * console.log(isEvmChain('ethereum'));  // true
 * console.log(isEvmChain('polygon'));   // true
 * console.log(isEvmChain('bsc'));       // true
 * console.log(isEvmChain('arbitrum'));  // true
 * console.log(isEvmChain('base'));      // true
 *
 * // Non-EVM chains
 * console.log(isEvmChain('solana'));    // false
 * console.log(isEvmChain('ton'));       // false
 *
 * // Invalid/unknown chains
 * console.log(isEvmChain('bitcoin'));   // false
 * console.log(isEvmChain('cosmos'));    // false
 * console.log(isEvmChain('unknown'));   // false
 *
 * // Use in adapter function routing
 * async function processTransaction(chain: string, transaction: any) {
 *   if (isEvmChain(chain)) {
 *     // Use EVM-specific processing
 *     return await options.evm.sendTransactions({
 *       transactions: [transaction]
 *     });
 *   } else if (chain === 'solana') {
 *     // Use Solana-specific processing
 *     return await options.solana.sendTransactions({
 *       transactions: [transaction]
 *     });
 *   } else if (chain === 'ton') {
 *     // Use TON-specific processing
 *     return await options.ton.sendTransactions({
 *       transactions: [transaction]
 *     });
 *   } else {
 *     throw new Error(`Unsupported chain: ${chain}`);
 *   }
 * }
 *
 * // Validate user input
 * function validateChainSelection(selectedChain: string) {
 *   if (!selectedChain) {
 *     return { valid: false, error: 'Chain not selected' };
 *   }
 *
 *   if (isEvmChain(selectedChain)) {
 *     return {
 *       valid: true,
 *       type: 'evm',
 *       chainId: getChainFromName(selectedChain as EvmChain)
 *     };
 *   }
 *
 *   if (selectedChain === 'solana' || selectedChain === 'ton') {
 *     return { valid: true, type: selectedChain };
 *   }
 *
 *   return { valid: false, error: `Unsupported chain: ${selectedChain}` };
 * }
 *
 * // Filter tokens by chain type
 * function filterTokensByChainType(tokens: UserToken[], evmOnly: boolean = false) {
 *   if (evmOnly) {
 *     return tokens.filter(token => isEvmChain(token.chain));
 *   }
 *   return tokens;
 * }
 *
 * // Get appropriate provider based on chain
 * function getChainProvider(chain: string) {
 *   if (isEvmChain(chain)) {
 *     const chainId = getChainFromName(chain as EvmChain);
 *     return options.evm.getProvider(chainId);
 *   } else if (chain === 'solana') {
 *     return options.solana.getConnection();
 *   } else if (chain === 'ton') {
 *     return options.ton.getClient();
 *   } else {
 *     throw new Error(`No provider available for chain: ${chain}`);
 *   }
 * }
 *
 * // Multi-chain balance fetching with type checking
 * async function getMultiChainBalances(
 *   chains: string[],
 *   tokenAddress: string,
 *   userAddress: string
 * ) {
 *   const balances = await Promise.allSettled(
 *     chains.map(async (chain) => {
 *       if (isEvmChain(chain)) {
 *         const provider = options.evm.getProvider(
 *           getChainFromName(chain as EvmChain)
 *         );
 *
 *         const balance = await provider.readContract({
 *           address: tokenAddress,
 *           abi: erc20Abi,
 *           functionName: 'balanceOf',
 *           args: [userAddress]
 *         });
 *
 *         return { chain, balance, type: 'evm' };
 *       } else {
 *         // Handle non-EVM chains differently
 *         throw new Error(`Non-EVM balance fetching not implemented for ${chain}`);
 *       }
 *     })
 *   );
 *
 *   return balances
 *     .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
 *     .map(result => result.value);
 * }
 *
 * // Chain-specific transaction building
 * function buildTransaction(chain: string, params: any) {
 *   if (isEvmChain(chain)) {
 *     return {
 *       target: params.to,
 *       data: params.data,
 *       value: params.value || '0'
 *     };
 *   } else if (chain === 'solana') {
 *     return {
 *       instructions: params.instructions,
 *       signers: params.signers
 *     };
 *   } else if (chain === 'ton') {
 *     return {
 *       to: params.to,
 *       amount: params.amount,
 *       payload: params.payload
 *     };
 *   } else {
 *     throw new Error(`Cannot build transaction for unsupported chain: ${chain}`);
 *   }
 * }
 *
 * // UI component for chain selection
 * function getChainCategories(chains: string[]) {
 *   const evmChains = chains.filter(isEvmChain);
 *   const nonEvmChains = chains.filter(chain => !isEvmChain(chain));
 *
 *   return {
 *     evm: {
 *       title: 'EVM Compatible',
 *       chains: evmChains,
 *       icon: 'ethereum-logo'
 *     },
 *     nonEvm: {
 *       title: 'Other Blockchains',
 *       chains: nonEvmChains,
 *       icon: 'blockchain-logo'
 *     }
 *   };
 * }
 *
 * // Type-safe chain processing
 * function processChainSpecificOperation<T>(
 *   chain: string,
 *   evmHandler: (chain: EvmChain) => T,
 *   solanaHandler: () => T,
 *   tonHandler: () => T
 * ): T {
 *   if (isEvmChain(chain)) {
 *     return evmHandler(chain as EvmChain);
 *   } else if (chain === 'solana') {
 *     return solanaHandler();
 *   } else if (chain === 'ton') {
 *     return tonHandler();
 *   } else {
 *     throw new Error(`Unsupported chain: ${chain}`);
 *   }
 * }
 * ```
 */
export function isEvmChain(chain: string): boolean {
    return allEvmChains.includes(chain as EvmChain);
}
