/**
 * Converts a JavaScript value to a JSON string with support for BigInt values
 *
 * This function extends the standard JSON.stringify to handle BigInt values,
 * which are commonly used in blockchain applications for handling large numbers
 * like token amounts, gas prices, and transaction values.
 *
 * @param value - The value to convert to JSON string
 * @param space - Optional. A String or Number object used to insert white space into the output JSON string for readability purposes
 * @returns JSON string representation of the value with BigInt values converted to strings
 *
 * @example
 * ```typescript
 * // Basic usage with primitive values
 * stringify({ name: 'Alice', age: 25 });
 * // Returns: '{"name":"Alice","age":25}'
 *
 * // Handling BigInt values (common in blockchain)
 * const tokenAmount = BigInt('1000000000000000000'); // 1 ETH in wei
 * stringify({ amount: tokenAmount, symbol: 'ETH' });
 * // Returns: '{"amount":"1000000000000000000","symbol":"ETH"}'
 *
 * // Pretty printing with indentation
 * const transactionData = {
 *   hash: '0x1234567890abcdef',
 *   value: BigInt('500000000000000000'), // 0.5 ETH
 *   gasPrice: BigInt('20000000000'), // 20 Gwei
 *   gasLimit: BigInt('21000')
 * };
 *
 * stringify(transactionData, 2);
 * // Returns:
 * // {
 * //   "hash": "0x1234567890abcdef",
 * //   "value": "500000000000000000",
 * //   "gasPrice": "20000000000",
 * //   "gasLimit": "21000"
 * // }
 *
 * // EVM transaction parameters
 * const evmTx = {
 *   to: '0x742d35cc6798c532c9c75e2c7ad3e6b9b11b38c1',
 *   value: BigInt('1000000000000000000'), // 1 ETH
 *   gasLimit: BigInt('21000'),
 *   gasPrice: BigInt('30000000000'), // 30 Gwei
 *   nonce: 42,
 *   data: '0x'
 * };
 *
 * const txJson = stringify(evmTx);
 * console.log('Transaction JSON:', txJson);
 * // Outputs: {"to":"0x742d35cc6798c532c9c75e2c7ad3e6b9b11b38c1","value":"1000000000000000000","gasLimit":"21000","gasPrice":"30000000000","nonce":42,"data":"0x"}
 *
 * // Token balance information
 * const tokenBalance = {
 *   address: '0xa0b86a33e6885b3ae5372f1c6c8e0e2e3e3b8c4d',
 *   symbol: 'USDC',
 *   decimals: 6,
 *   balance: BigInt('1500000000'), // 1,500 USDC (6 decimals)
 *   valueInWei: BigInt('1500000000000000000000') // equivalent ETH value
 * };
 *
 * stringify(tokenBalance, '  '); // Using string indentation
 * // Returns formatted JSON with BigInt values as strings
 *
 * // Array of transactions with BigInt values
 * const transactions = [
 *   {
 *     hash: '0xabc123',
 *     value: BigInt('100000000000000000'), // 0.1 ETH
 *     timestamp: 1697184000
 *   },
 *   {
 *     hash: '0xdef456',
 *     value: BigInt('250000000000000000'), // 0.25 ETH
 *     timestamp: 1697184060
 *   }
 * ];
 *
 * stringify(transactions);
 * // Returns: [{"hash":"0xabc123","value":"100000000000000000","timestamp":1697184000},{"hash":"0xdef456","value":"250000000000000000","timestamp":1697184060}]
 *
 * // Solana transaction data
 * const solanaData = {
 *   signature: '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW',
 *   slot: BigInt('123456789'),
 *   lamports: BigInt('1000000000'), // 1 SOL in lamports
 *   fee: BigInt('5000') // transaction fee
 * };
 *
 * stringify(solanaData, 4);
 * // Returns formatted JSON with BigInt slot and lamport values as strings
 *
 * // TON transaction information
 * const tonTx = {
 *   hash: 'abc123def456',
 *   lt: BigInt('25123456000001'), // logical time
 *   value: BigInt('1000000000'), // 1 TON in nanotons
 *   fees: {
 *     inFwdFee: BigInt('1000000'),
 *     storageFee: BigInt('500000'),
 *     gasFee: BigInt('2000000')
 *   }
 * };
 *
 * stringify(tonTx);
 * // All BigInt values converted to strings for JSON compatibility
 *
 * // DeFi protocol data with large numbers
 * const defiData = {
 *   protocol: 'Uniswap V3',
 *   poolAddress: '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8',
 *   liquidity: BigInt('12345678901234567890123'),
 *   sqrtPriceX96: BigInt('1234567890123456789012345'),
 *   tick: -276324,
 *   feeGrowthGlobal0X128: BigInt('98765432109876543210'),
 *   feeGrowthGlobal1X128: BigInt('13579246801357924680')
 * };
 *
 * const defiJson = stringify(defiData, 2);
 * console.log('DeFi Pool Data:', defiJson);
 *
 * // NFT metadata with BigInt token IDs
 * const nftData = {
 *   contractAddress: '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
 *   tokenId: BigInt('1234567890123456789'),
 *   owner: '0x123456789abcdef123456789abcdef123456789a',
 *   metadata: {
 *     name: 'Cool NFT #1234567890123456789',
 *     description: 'A unique digital asset',
 *     image: 'ipfs://QmHash123456789'
 *   },
 *   lastSalePrice: BigInt('5000000000000000000') // 5 ETH
 * };
 *
 * stringify(nftData);
 * // BigInt tokenId and lastSalePrice converted to strings
 *
 * // Multi-chain portfolio data
 * const portfolio = {
 *   ethereum: {
 *     nativeBalance: BigInt('2500000000000000000'), // 2.5 ETH
 *     tokens: [
 *       {
 *         symbol: 'USDC',
 *         balance: BigInt('1000000000'), // 1,000 USDC (6 decimals)
 *         address: '0xa0b86a33e6885b3ae5372f1c6c8e0e2e3e3b8c4d'
 *       }
 *     ]
 *   },
 *   polygon: {
 *     nativeBalance: BigInt('100000000000000000000'), // 100 MATIC
 *     tokens: []
 *   },
 *   solana: {
 *     nativeBalance: BigInt('5000000000'), // 5 SOL
 *     tokens: []
 *   }
 * };
 *
 * const portfolioJson = stringify(portfolio, 2);
 * // All BigInt balances converted to strings for cross-chain compatibility
 *
 * // Error handling with BigInt
 * try {
 *   const problematicData = {
 *     regularNumber: 123,
 *     bigIntValue: BigInt('999999999999999999999'),
 *     circularRef: null as any
 *   };
 *   problematicData.circularRef = problematicData; // Creates circular reference
 *
 *   // This will throw due to circular reference, not BigInt
 *   stringify(problematicData);
 * } catch (error) {
 *   console.error('Stringify error:', error.message);
 * }
 *
 * // Comparison with standard JSON.stringify (would fail with BigInt)
 * const bigIntData = { amount: BigInt('123456789012345678901234567890') };
 *
 * // ❌ This would throw: JSON.stringify(bigIntData)
 * // TypeError: Do not know how to serialize a BigInt
 *
 * // ✅ This works: stringify(bigIntData)
 * stringify(bigIntData);
 * // Returns: '{"amount":"123456789012345678901234567890"}'
 *
 * // Logging blockchain events with BigInt block numbers
 * const blockchainEvents = [
 *   {
 *     event: 'Transfer',
 *     blockNumber: BigInt('18500000'),
 *     transactionIndex: 25,
 *     logIndex: 3,
 *     args: {
 *       from: '0x123...',
 *       to: '0x456...',
 *       value: BigInt('1000000000000000000')
 *     }
 *   }
 * ];
 *
 * const eventsLog = stringify(blockchainEvents, 2);
 * console.log('Blockchain Events:', eventsLog);
 *
 * // Configuration objects with BigInt limits
 * const sdkConfig = {
 *   maxGasPrice: BigInt('100000000000'), // 100 Gwei
 *   minBalance: BigInt('100000000000000000'), // 0.1 ETH
 *   retryDelayMs: 1000,
 *   maxRetries: 3,
 *   networkTimeouts: {
 *     ethereum: BigInt('15000'), // 15 seconds in ms
 *     polygon: BigInt('5000'),   // 5 seconds in ms
 *     solana: BigInt('10000')    // 10 seconds in ms
 *   }
 * };
 *
 * const configJson = stringify(sdkConfig);
 * // Safely serialize configuration with BigInt values
 *
 * // Utility for pretty-printing blockchain data
 * function logBlockchainData(data: any, label: string = 'Data') {
 *   console.log(`${label}:`, stringify(data, 2));
 * }
 *
 * // Usage in debugging
 * logBlockchainData({
 *   txHash: '0xabc123',
 *   blockNumber: BigInt('18500001'),
 *   gasUsed: BigInt('21000')
 * }, 'Transaction Receipt');
 * ```
 */
export function stringify(value: any, space?: string | number): string {
    return JSON.stringify(value, (_key, value) => (typeof value === 'bigint' ? value.toString() : value), space);
}
