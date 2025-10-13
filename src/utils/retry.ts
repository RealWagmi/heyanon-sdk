/**
 * Options for configuring retry behavior
 * @interface Options
 */
interface Options {
    /** Number of retry attempts (default: 0) */
    readonly retries?: number;
    /** Delay between retry attempts in milliseconds (optional) */
    readonly delayMs?: number;
}

/**
 * Creates a delay for the specified number of milliseconds
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the specified delay
 * @example
 * ```typescript
 * // Wait for 1 second
 * await delay(1000);
 *
 * // Wait for 500ms before next operation
 * await delay(500);
 * console.log('Operation executed after delay');
 * ```
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Executes an async function with automatic retry logic on failure
 * @template T - The return type of the function
 * @param fn - The async function to execute with retry logic
 * @param options - Configuration options for retry behavior
 * @returns Promise that resolves with the function result or rejects after all retries are exhausted
 * @example
 * ```typescript
 * // Basic retry without delay
 * const result = await retry(
 *   async () => {
 *     const response = await fetch('https://api.example.com/data');
 *     if (!response.ok) throw new Error('Network error');
 *     return response.json();
 *   },
 *   { retries: 3 }
 * );
 *
 * // Retry with delay between attempts
 * const dataWithDelay = await retry(
 *   async () => {
 *     const connection = await database.connect();
 *     return await connection.query('SELECT * FROM users');
 *   },
 *   { retries: 5, delayMs: 1000 } // Wait 1 second between retries
 * );
 *
 * // Blockchain transaction with exponential backoff simulation
 * async function sendTransactionWithRetry(transaction: TransactionParams) {
 *   let attempt = 0;
 *
 *   return await retry(
 *     async () => {
 *       attempt++;
 *       console.log(`Attempt ${attempt}: Sending transaction...`);
 *
 *       const result = await options.evm.sendTransactions({
 *         transactions: [transaction]
 *       });
 *
 *       if (!result.data[0].message.includes('confirmed')) {
 *         throw new Error('Transaction not confirmed');
 *       }
 *
 *       return result;
 *     },
 *     { retries: 3, delayMs: 2000 }
 *   );
 * }
 *
 * // API call with retry for rate limiting
 * async function fetchTokenPrice(tokenAddress: string) {
 *   return await retry(
 *     async () => {
 *       const response = await fetch(`https://api.coingecko.com/api/v3/tokens/${tokenAddress}`);
 *
 *       if (response.status === 429) {
 *         throw new Error('Rate limited');
 *       }
 *
 *       if (!response.ok) {
 *         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
 *       }
 *
 *       return await response.json();
 *     },
 *     { retries: 5, delayMs: 3000 } // 3 second delay for rate limits
 *   );
 * }
 *
 * // RPC provider failover
 * async function getBlockNumberWithFailover(providers: PublicClient[]) {
 *   let providerIndex = 0;
 *
 *   return await retry(
 *     async () => {
 *       if (providerIndex >= providers.length) {
 *         throw new Error('All providers failed');
 *       }
 *
 *       const provider = providers[providerIndex];
 *
 *       try {
 *         return await provider.getBlockNumber();
 *       } catch (error) {
 *         providerIndex++;
 *         throw error;
 *       }
 *     },
 *     { retries: providers.length - 1, delayMs: 500 }
 *   );
 * }
 *
 * // Solana transaction confirmation
 * async function confirmSolanaTransaction(signature: string, connection: Connection) {
 *   return await retry(
 *     async () => {
 *       const status = await connection.getSignatureStatus(signature);
 *
 *       if (!status.value) {
 *         throw new Error('Transaction not found');
 *       }
 *
 *       if (status.value.err) {
 *         throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
 *       }
 *
 *       if (!status.value.confirmationStatus) {
 *         throw new Error('Transaction not confirmed yet');
 *       }
 *
 *       return status.value;
 *     },
 *     { retries: 30, delayMs: 1000 } // Check every second for 30 seconds
 *   );
 * }
 *
 * // TON client operations with retry
 * async function getTonAccountWithRetry(address: Address, client: Client) {
 *   return await retry(
 *     async () => {
 *       try {
 *         return await client.api.accounts.getAccount(address.toString());
 *       } catch (error) {
 *         if (error.message.includes('429')) {
 *           throw new Error('Rate limited - will retry');
 *         }
 *         if (error.message.includes('timeout')) {
 *           throw new Error('Timeout - will retry');
 *         }
 *         // Don't retry for other errors
 *         throw error;
 *       }
 *     },
 *     { retries: 3, delayMs: 2000 }
 *   );
 * }
 *
 * // File operations with retry
 * async function readFileWithRetry(filePath: string) {
 *   return await retry(
 *     async () => {
 *       const fs = await import('fs/promises');
 *       return await fs.readFile(filePath, 'utf-8');
 *     },
 *     { retries: 3, delayMs: 100 }
 *   );
 * }
 *
 * // Complex retry with custom logic
 * async function smartContractCallWithRetry(
 *   contractAddress: Address,
 *   methodName: string,
 *   args: any[],
 *   provider: PublicClient
 * ) {
 *   let gasPrice = await provider.getGasPrice();
 *
 *   return await retry(
 *     async () => {
 *       try {
 *         return await provider.readContract({
 *           address: contractAddress,
 *           abi: contractAbi,
 *           functionName: methodName,
 *           args
 *         });
 *       } catch (error) {
 *         if (error.message.includes('gas')) {
 *           // Increase gas price for next attempt
 *           gasPrice = gasPrice * 110n / 100n; // +10%
 *           console.log(`Increasing gas price to ${gasPrice}`);
 *         }
 *         throw error;
 *       }
 *     },
 *     { retries: 3, delayMs: 1000 }
 *   );
 * }
 *
 * // Error handling patterns
 * async function handleOperationWithRetry<T>(
 *   operation: () => Promise<T>,
 *   operationName: string
 * ): Promise<T> {
 *   try {
 *     return await retry(operation, { retries: 3, delayMs: 1000 });
 *   } catch (error) {
 *     console.error(`${operationName} failed after all retries:`, error);
 *
 *     // Log for monitoring
 *     if (typeof error === 'object' && error !== null) {
 *       console.error('Final error details:', {
 *         message: error.message,
 *         stack: error.stack,
 *         operation: operationName
 *       });
 *     }
 *
 *     throw new Error(`${operationName} failed: ${error.message}`);
 *   }
 * }
 *
 * // Usage in adapter functions
 * async function executeWithRetry<T>(
 *   operation: () => Promise<T>,
 *   retryConfig: Options = { retries: 3, delayMs: 1000 }
 * ): Promise<T> {
 *   return await retry(operation, retryConfig);
 * }
 * ```
 */
export async function retry<T>(fn: () => Promise<T>, options?: Options): Promise<T> {
    const { retries = 0, delayMs } = options ?? {};
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            if (delayMs) {
                await delay(delayMs);
            }
            return await retry(fn, { ...options, retries: retries - 1 });
        } else {
            throw error;
        }
    }
}
