import { NATIVE_ADDRESS } from '../constants';

/**
 * Checks if the given address represents a native token (ETH, BNB, MATIC, etc.)
 * @param address - The token address to check
 * @returns True if the address represents a native token, false otherwise
 * @description Uses the special NATIVE_ADDRESS constant (0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) for comparison
 * @example
 * ```typescript
 * // Check native token addresses
 * console.log(isNativeAddress('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')); // true
 * console.log(isNativeAddress('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')); // true (case insensitive)
 *
 * // Check ERC20 token addresses
 * console.log(isNativeAddress('0xA0b86a33E6417e4681831442Ff7Bd6c25b5d9C7a')); // false (USDC)
 * console.log(isNativeAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')); // false (WETH)
 *
 * // Use in token swap logic
 * async function handleTokenTransfer(
 *   fromToken: string,
 *   toToken: string,
 *   amount: bigint,
 *   recipient: string
 * ) {
 *   if (isNativeAddress(fromToken)) {
 *     // Handle native token transfer (ETH, BNB, etc.)
 *     return await options.evm.sendTransactions({
 *       transactions: [{
 *         target: recipient,
 *         value: amount,
 *         data: '0x'
 *       }]
 *     });
 *   } else {
 *     // Handle ERC20 token transfer
 *     return await options.evm.sendTransactions({
 *       transactions: [{
 *         target: fromToken,
 *         data: encodeFunctionData({
 *           abi: erc20Abi,
 *           functionName: 'transfer',
 *           args: [recipient, amount]
 *         })
 *       }]
 *     });
 *   }
 * }
 *
 * // Use in DEX swap preparation
 * function prepareSwapTransaction(
 *   tokenIn: string,
 *   tokenOut: string,
 *   amountIn: bigint,
 *   chain: EvmChain
 * ) {
 *   const transactions: TransactionParams[] = [];
 *
 *   // If input token is native, we might need to wrap it first
 *   if (isNativeAddress(tokenIn)) {
 *     const wrapData = getWrapData(chain, amountIn);
 *     transactions.push(wrapData);
 *     tokenIn = getWrapAddress(chain); // Update to wrapped token address
 *   } else {
 *     // Approve ERC20 token for DEX router
 *     transactions.push(...getApprovalTransactions(tokenIn, DEX_ROUTER, amountIn));
 *   }
 *
 *   // Add swap transaction
 *   transactions.push(buildSwapTransaction(tokenIn, tokenOut, amountIn));
 *
 *   // If output token should be native, add unwrap transaction
 *   if (isNativeAddress(tokenOut)) {
 *     const unwrapData = getUnwrapData(chain, expectedAmountOut);
 *     transactions.push(unwrapData);
 *   }
 *
 *   return transactions;
 * }
 *
 * // Get token balance (native vs ERC20)
 * async function getTokenBalance(
 *   tokenAddress: string,
 *   userAddress: string,
 *   provider: PublicClient
 * ): Promise<bigint> {
 *   if (isNativeAddress(tokenAddress)) {
 *     // Get native token balance (ETH, BNB, etc.)
 *     return await provider.getBalance({ address: userAddress });
 *   } else {
 *     // Get ERC20 token balance
 *     return await provider.readContract({
 *       address: tokenAddress,
 *       abi: erc20Abi,
 *       functionName: 'balanceOf',
 *       args: [userAddress]
 *     });
 *   }
 * }
 *
 * // Token validation for UI
 * function validateTokenAddress(address: string): {
 *   valid: boolean;
 *   type: 'native' | 'erc20' | 'invalid';
 *   message?: string;
 * } {
 *   if (!address) {
 *     return { valid: false, type: 'invalid', message: 'Address is required' };
 *   }
 *
 *   if (isNativeAddress(address)) {
 *     return { valid: true, type: 'native' };
 *   }
 *
 *   if (isAddress(address)) {
 *     return { valid: true, type: 'erc20' };
 *   }
 *
 *   return { valid: false, type: 'invalid', message: 'Invalid address format' };
 * }
 *
 * // Portfolio calculation with native tokens
 * async function calculatePortfolioValue(
 *   tokens: Array<{ address: string; amount: bigint }>,
 *   chain: EvmChain
 * ) {
 *   const provider = options.evm.getProvider(getChainFromName(chain));
 *
 *   const tokenValues = await Promise.all(
 *     tokens.map(async ({ address, amount }) => {
 *       let tokenSymbol: string;
 *       let tokenDecimals: number;
 *
 *       if (isNativeAddress(address)) {
 *         // Handle native token
 *         tokenSymbol = getNativeTokenSymbol(chain); // ETH, BNB, MATIC, etc.
 *         tokenDecimals = 18;
 *       } else {
 *         // Handle ERC20 token
 *         [tokenSymbol, tokenDecimals] = await Promise.all([
 *           provider.readContract({
 *             address: address,
 *             abi: erc20Abi,
 *             functionName: 'symbol'
 *           }),
 *           provider.readContract({
 *             address: address,
 *             abi: erc20Abi,
 *             functionName: 'decimals'
 *           })
 *         ]);
 *       }
 *
 *       const formattedAmount = formatUnits(amount, tokenDecimals);
 *       const usdValue = await getTokenPriceUSD(tokenSymbol);
 *
 *       return {
 *         address,
 *         symbol: tokenSymbol,
 *         amount: formattedAmount,
 *         usdValue: parseFloat(formattedAmount) * usdValue,
 *         isNative: isNativeAddress(address)
 *       };
 *     })
 *   );
 *
 *   return tokenValues;
 * }
 *
 * // Gas estimation for different token types
 * async function estimateTransferGas(
 *   tokenAddress: string,
 *   to: string,
 *   amount: bigint,
 *   from: string,
 *   provider: PublicClient
 * ): Promise<bigint> {
 *   if (isNativeAddress(tokenAddress)) {
 *     // Estimate gas for native token transfer
 *     return await provider.estimateGas({
 *       account: from,
 *       to,
 *       value: amount
 *     });
 *   } else {
 *     // Estimate gas for ERC20 transfer
 *     return await provider.estimateGas({
 *       account: from,
 *       to: tokenAddress,
 *       data: encodeFunctionData({
 *         abi: erc20Abi,
 *         functionName: 'transfer',
 *         args: [to, amount]
 *       })
 *     });
 *   }
 * }
 *
 * // Filter tokens by type
 * function filterTokensByType(
 *   tokens: UserToken[],
 *   includeNative: boolean = true,
 *   includeERC20: boolean = true
 * ) {
 *   return tokens.filter(token => {
 *     const isNative = isNativeAddress(token.address);
 *     return (includeNative && isNative) || (includeERC20 && !isNative);
 *   });
 * }
 *
 * // Transaction fee calculation
 * function calculateTransactionCost(
 *   tokenAddress: string,
 *   gasPrice: bigint,
 *   gasLimit: bigint
 * ): { gasCost: bigint; requiresNativeForGas: boolean } {
 *   const gasCost = gasPrice * gasLimit;
 *   const requiresNativeForGas = !isNativeAddress(tokenAddress);
 *
 *   return { gasCost, requiresNativeForGas };
 * }
 * ```
 */
export function isNativeAddress(address: string): boolean {
    return address.toLowerCase() === NATIVE_ADDRESS.toLowerCase();
}
