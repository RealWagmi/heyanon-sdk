/**
 * Special address representing native tokens (ETH, BNB, MATIC, etc.) in EVM chains
 * @constant NATIVE_ADDRESS
 * @example
 * ```typescript
 * // Check if token is native currency
 * function isNativeToken(tokenAddress: string): boolean {
 *   return tokenAddress.toLowerCase() === NATIVE_ADDRESS.toLowerCase();
 * }
 *
 * // Use in token swap configuration
 * const swapConfig = {
 *   fromToken: NATIVE_ADDRESS, // ETH on Ethereum
 *   toToken: '0xA0b86a33E6417e4681831442Ff7Bd6c25b5d9C7a', // USDC
 *   amount: '1000000000000000000' // 1 ETH
 * };
 *
 * // Handle native vs ERC20 transfers differently
 * async function transferToken(to: string, amount: string, tokenAddress: string) {
 *   if (tokenAddress === NATIVE_ADDRESS) {
 *     // Send native ETH
 *     return await sendTransaction({ to, value: amount });
 *   } else {
 *     // Send ERC20 token
 *     return await sendERC20Transfer(tokenAddress, to, amount);
 *   }
 * }
 *
 * // Filter native tokens from token list
 * const erc20Tokens = tokens.filter(token =>
 *   token.address !== NATIVE_ADDRESS
 * );
 * ```
 */
export const NATIVE_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

/**
 * Dead address used for burning tokens or as a null destination
 * @constant DEAD_ADDRESS
 * @example
 * ```typescript
 * // Burn tokens by sending to dead address
 * async function burnTokens(tokenAddress: string, amount: string) {
 *   return await sendERC20Transfer(tokenAddress, DEAD_ADDRESS, amount);
 * }
 *
 * // Check if address is a burn address
 * function isBurnAddress(address: string): boolean {
 *   return address.toLowerCase() === DEAD_ADDRESS.toLowerCase() ||
 *          address === '0x0000000000000000000000000000000000000000';
 * }
 *
 * // Calculate circulating supply excluding burned tokens
 * async function getCirculatingSupply(tokenAddress: string) {
 *   const totalSupply = await getTotalSupply(tokenAddress);
 *   const burnedBalance = await getTokenBalance(tokenAddress, DEAD_ADDRESS);
 *   return totalSupply - burnedBalance;
 * }
 *
 * // Use in deflationary token mechanics
 * const burnTransaction = {
 *   to: DEAD_ADDRESS,
 *   value: '0',
 *   data: encodeFunctionData({
 *     abi: erc20Abi,
 *     functionName: 'transfer',
 *     args: [DEAD_ADDRESS, burnAmount]
 *   })
 * };
 * ```
 */
export const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';
