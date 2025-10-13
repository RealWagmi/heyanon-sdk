/**
 * Creates a promise that resolves after the specified number of milliseconds
 * @param ms - Number of milliseconds to sleep/wait
 * @returns Promise that resolves after the specified delay
 * @example
 * ```typescript
 * // Basic usage - wait for 1 second
 * await sleep(1000);
 * console.log('Executed after 1 second');
 *
 * // Wait between operations
 * console.log('Starting operation...');
 * await sleep(2000);
 * console.log('Continuing after 2 seconds...');
 *
 * // Use in blockchain operations for rate limiting
 * async function batchProcessTransactions(transactions: TransactionParams[]) {
 *   const results = [];
 *
 *   for (const tx of transactions) {
 *     const result = await options.evm.sendTransactions({
 *       transactions: [tx]
 *     });
 *     results.push(result);
 *
 *     // Wait 3 seconds between transactions to avoid rate limits
 *     await sleep(3000);
 *   }
 *
 *   return results;
 * }
 *
 * // Polling with delays
 * async function pollTransactionStatus(hash: string, maxAttempts: number = 30) {
 *   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
 *     const receipt = await provider.getTransactionReceipt(hash);
 *
 *     if (receipt) {
 *       return receipt;
 *     }
 *
 *     console.log(`Attempt ${attempt}: Transaction not confirmed yet, waiting...`);
 *     await sleep(2000); // Wait 2 seconds before next check
 *   }
 *
 *   throw new Error('Transaction confirmation timeout');
 * }
 *
 * // Gradual data loading with delays
 * async function loadUserPortfolio(userAddress: string, chains: EvmChain[]) {
 *   const portfolio = [];
 *
 *   for (const chain of chains) {
 *     console.log(`Loading ${chain} data...`);
 *
 *     const chainData = await getUserBalances(userAddress, chain);
 *     portfolio.push({ chain, data: chainData });
 *
 *     // Small delay to prevent overwhelming APIs
 *     await sleep(500);
 *   }
 *
 *   return portfolio;
 * }
 *
 * // Retry with increasing delays (exponential backoff)
 * async function exponentialBackoffOperation<T>(
 *   operation: () => Promise<T>,
 *   maxRetries: number = 5
 * ): Promise<T> {
 *   let lastError: Error;
 *
 *   for (let attempt = 1; attempt <= maxRetries; attempt++) {
 *     try {
 *       return await operation();
 *     } catch (error) {
 *       lastError = error as Error;
 *
 *       if (attempt === maxRetries) {
 *         throw lastError;
 *       }
 *
 *       const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s, 16s, 32s
 *       console.log(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
 *       await sleep(delayMs);
 *     }
 *   }
 *
 *   throw lastError!;
 * }
 *
 * // Animation delays in UI
 * async function animatedTokenTransfer(fromAddress: string, toAddress: string, amount: bigint) {
 *   console.log('🚀 Initiating transfer...');
 *   await sleep(500);
 *
 *   console.log('⏳ Preparing transaction...');
 *   const tx = await buildTransferTransaction(fromAddress, toAddress, amount);
 *   await sleep(800);
 *
 *   console.log('📝 Signing transaction...');
 *   await sleep(1000);
 *
 *   console.log('📡 Broadcasting to network...');
 *   const result = await options.evm.sendTransactions({ transactions: [tx] });
 *   await sleep(500);
 *
 *   console.log('✅ Transfer complete!');
 *   return result;
 * }
 *
 * // Throttled API calls
 * async function throttledApiCalls<T>(
 *   apiCalls: (() => Promise<T>)[],
 *   delayBetweenCalls: number = 1000
 * ): Promise<T[]> {
 *   const results: T[] = [];
 *
 *   for (let i = 0; i < apiCalls.length; i++) {
 *     const result = await apiCalls[i]();
 *     results.push(result);
 *
 *     // Don't wait after the last call
 *     if (i < apiCalls.length - 1) {
 *       await sleep(delayBetweenCalls);
 *     }
 *   }
 *
 *   return results;
 * }
 *
 * // Blockchain confirmation waiting
 * async function waitForConfirmations(
 *   transactionHash: string,
 *   requiredConfirmations: number = 6,
 *   checkInterval: number = 15000 // 15 seconds
 * ) {
 *   let confirmations = 0;
 *
 *   while (confirmations < requiredConfirmations) {
 *     const receipt = await provider.getTransactionReceipt(transactionHash);
 *
 *     if (!receipt) {
 *       console.log('Transaction not found, waiting...');
 *       await sleep(checkInterval);
 *       continue;
 *     }
 *
 *     const currentBlock = await provider.getBlockNumber();
 *     confirmations = currentBlock - receipt.blockNumber + 1;
 *
 *     console.log(`Confirmations: ${confirmations}/${requiredConfirmations}`);
 *
 *     if (confirmations < requiredConfirmations) {
 *       await sleep(checkInterval);
 *     }
 *   }
 *
 *   console.log('✅ Transaction fully confirmed!');
 * }
 *
 * // Solana transaction confirmation with sleep
 * async function confirmSolanaTransactionWithSleep(
 *   signature: string,
 *   connection: Connection,
 *   timeout: number = 60000
 * ) {
 *   const startTime = Date.now();
 *
 *   while (Date.now() - startTime < timeout) {
 *     const status = await connection.getSignatureStatus(signature);
 *
 *     if (status.value?.confirmationStatus === 'confirmed' ||
 *         status.value?.confirmationStatus === 'finalized') {
 *       return status.value;
 *     }
 *
 *     await sleep(1000); // Check every second
 *   }
 *
 *   throw new Error('Transaction confirmation timeout');
 * }
 *
 * // TON transaction monitoring
 * async function monitorTonTransaction(hash: string, client: Client) {
 *   const maxAttempts = 30;
 *
 *   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
 *     try {
 *       const tx = await client.api.blockchain.getBlockchainTransaction(hash);
 *
 *       if (tx.success) {
 *         return tx;
 *       } else {
 *         throw new Error('Transaction failed');
 *       }
 *     } catch (error) {
 *       if (attempt === maxAttempts) {
 *         throw error;
 *       }
 *
 *       console.log(`Attempt ${attempt}: Transaction not ready, waiting 2 seconds...`);
 *       await sleep(2000);
 *     }
 *   }
 * }
 *
 * // Progressive loading with sleep
 * async function progressiveDataLoad(addresses: string[], progressCallback?: (progress: number) => void) {
 *   const results = [];
 *   const total = addresses.length;
 *
 *   for (let i = 0; i < addresses.length; i++) {
 *     const address = addresses[i];
 *     const data = await getAddressData(address);
 *     results.push(data);
 *
 *     // Update progress
 *     const progress = ((i + 1) / total) * 100;
 *     progressCallback?.(progress);
 *
 *     // Brief pause between loads
 *     if (i < addresses.length - 1) {
 *       await sleep(200);
 *     }
 *   }
 *
 *   return results;
 * }
 *
 * // Utility functions with sleep
 * const sleepSeconds = (seconds: number) => sleep(seconds * 1000);
 * const sleepMinutes = (minutes: number) => sleep(minutes * 60 * 1000);
 *
 * // Usage examples
 * // await sleepSeconds(5); // Sleep for 5 seconds
 * // await sleepMinutes(1); // Sleep for 1 minute
 * ```
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
