import { PublicKey, TransactionSignature, VersionedTransaction, Transaction } from '@solana/web3.js';

/**
 * Data returned for each executed Solana transaction
 * @interface TransactionReturnData
 * @example
 * ```typescript
 * // Successful transaction result
 * const successData: TransactionReturnData = {
 *   message: "Transaction confirmed",
 *   hash: "2ZE7R7Xhm9V8Qf4vKyRKMJ6XHKM6eRXmFw7P8NXTW7qTgJhG5jzYR4M8KKvxjJb9Vs6KfYQpYsKJ4JUhP5K"
 * };
 *
 * // Failed transaction result
 * const failedData: TransactionReturnData = {
 *   message: "Transaction failed: Insufficient funds",
 *   hash: "3AF8S8Ymi0W9Rg5wLzSKNK7YILM7fSYnGx8Q9OYUX8rUhKiH6kzZS5N9LLwyKc0Wr7LgZRqQtLJ5KViQ6L"
 * };
 *
 * // Process transaction result
 * function handleTransactionResult(result: TransactionReturnData) {
 *   console.log(`Status: ${result.message}`);
 *   console.log(`Transaction: https://solscan.io/tx/${result.hash}`);
 *
 *   if (result.message.includes('confirmed')) {
 *     // Handle success
 *     showSuccessNotification(result.hash);
 *   } else {
 *     // Handle error
 *     showErrorNotification(result.message);
 *   }
 * }
 * ```
 */
export interface TransactionReturnData {
    /** Status message or error description */
    readonly message: string;
    /** Transaction signature/hash on Solana blockchain */
    readonly hash: TransactionSignature;
}

/**
 * Complete result of Solana transaction execution containing all transaction results
 * @interface TransactionReturn
 * @example
 * ```typescript
 * // Batch transaction result
 * const batchResult: TransactionReturn = {
 *   data: [
 *     {
 *       message: "Token transfer confirmed",
 *       hash: "2ZE7R7Xhm9V8Qf4vKyRKMJ6XHKM6eRXmFw7P8NXTW7qTgJhG5jzYR4M8KKvxjJb9Vs6KfYQpYsKJ4JUhP5K"
 *     },
 *     {
 *       message: "Swap completed",
 *       hash: "3AF8S8Ymi0W9Rg5wLzSKNK7YILM7fSYnGx8Q9OYUX8rUhKiH6kzZS5N9LLwyKc0Wr7LgZRqQtLJ5KViQ6L"
 *     }
 *   ]
 * };
 *
 * // Single transaction result
 * const singleResult: TransactionReturn = {
 *   data: [{
 *     message: "SOL transfer successful",
 *     hash: "4BG9T9Znj1X0Sg6xMzTKOL8YJMN8gTZoHy9R0PZVY9sVjLjI7l0aT6O0MMxzLd1Xs8MhaSrRuMK6LWjR7M"
 *   }]
 * };
 *
 * // Process all results
 * function processBatchResults(result: TransactionReturn) {
 *   const successful = result.data.filter(tx =>
 *     tx.message.includes('confirmed') || tx.message.includes('successful')
 *   );
 *
 *   const failed = result.data.filter(tx =>
 *     tx.message.includes('failed') || tx.message.includes('error')
 *   );
 *
 *   console.log(`Successful: ${successful.length}, Failed: ${failed.length}`);
 *
 *   // Create summary for user
 *   return {
 *     totalTransactions: result.data.length,
 *     successCount: successful.length,
 *     failureCount: failed.length,
 *     successfulHashes: successful.map(tx => tx.hash),
 *     failedHashes: failed.map(tx => tx.hash)
 *   };
 * }
 * ```
 */
export interface TransactionReturn {
    /** Array of transaction results */
    readonly data: TransactionReturnData[];
}

/**
 * Properties for sending one or multiple Solana transactions
 * @interface SendTransactionProps
 * @example
 * ```typescript
 * // Single transaction
 * const transferProps: SendTransactionProps = {
 *   account: toPublicKey('11111111111111111111111111111112'),
 *   transactions: [await buildV0Transaction({
 *     connection: options.solana.getConnection(),
 *     payer: userPublicKey,
 *     instructions: [SystemProgram.transfer({
 *       fromPubkey: userPublicKey,
 *       toPubkey: recipientPublicKey,
 *       lamports: 0.1 * LAMPORTS_PER_SOL
 *     })]
 *   })]
 * };
 *
 * // Multiple transactions (batch operations)
 * const batchProps: SendTransactionProps = {
 *   account: userPublicKey,
 *   transactions: [
 *     await buildV0Transaction({
 *       connection: options.solana.getConnection(),
 *       payer: userPublicKey,
 *       instructions: [createAssociatedTokenAccountInstruction(
 *         userPublicKey, // payer
 *         tokenAccount, // associated token account
 *         userPublicKey, // owner
 *         mintAddress // mint
 *       )]
 *     }),
 *     await buildV0Transaction({
 *       connection: options.solana.getConnection(),
 *       payer: userPublicKey,
 *       instructions: [createTransferInstruction(
 *         fromTokenAccount,
 *         toTokenAccount,
 *         userPublicKey,
 *         100_000 // 0.1 USDC
 *       )]
 *     })
 *   ]
 * };
 *
 * // Jupiter swap transaction
 * const swapProps: SendTransactionProps = {
 *   account: await options.solana.getPublicKey(),
 *   transactions: [await buildV0Transaction({
 *     connection: options.solana.getConnection(),
 *     payer: await options.solana.getPublicKey(),
 *     instructions: await getJupiterSwapInstructions({
 *       inputMint: 'So11111111111111111111111111111111111111112', // SOL
 *       outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
 *       amount: 0.1 * LAMPORTS_PER_SOL,
 *       slippageBps: 50
 *     })
 *   })]
 * };
 *
 * // Usage in adapter function
 * async function executeSolanaTransactions(props: SendTransactionProps) {
 *   const result = await options.solana.sendTransactions(props);
 *
 *   // Log all transaction hashes
 *   result.data.forEach((tx, index) => {
 *     console.log(`Transaction ${index + 1}: ${tx.hash}`);
 *   });
 *
 *   return result;
 * }
 *
 * // Error handling wrapper
 * async function safeSendTransactions(props: SendTransactionProps) {
 *   try {
 *     return await options.solana.sendTransactions(props);
 *   } catch (error) {
 *     console.error('Failed to send transactions:', error);
 *     return {
 *       data: props.transactions.map(() => ({
 *         message: `Transaction failed: ${error.message}`,
 *         hash: '' as TransactionSignature
 *       }))
 *     };
 *   }
 * }
 * ```
 */
export interface SendTransactionProps {
    /** Account that will execute the transactions */
    readonly account: PublicKey;
    /** Array of versioned transactions to execute */
    readonly transactions: VersionedTransaction[];
}

/**
 * Properties for signing Solana transactions
 * @interface SignTransactionProps
 * @example
 * ```typescript
 * // Sign a versioned transaction (default)
 * const signProps: SignTransactionProps = {
 *   transaction: await buildV0Transaction({
 *     connection: options.solana.getConnection(),
 *     payer: userPublicKey,
 *     instructions: [transferInstruction]
 *   })
 * };
 *
 * // Sign with specific method
 * const partialSignProps: SignTransactionProps = {
 *   transaction: versionedTransaction,
 *   signName: 'partialSign' // For multi-sig scenarios
 * };
 *
 * // Sign legacy transaction
 * const legacySignProps: SignTransactionProps = {
 *   transaction: new Transaction().add(transferInstruction),
 *   signName: 'sign'
 * };
 *
 * // Multi-signature workflow
 * async function multiSigTransactionFlow(
 *   transaction: VersionedTransaction,
 *   signers: PublicKey[]
 * ) {
 *   const signatures: (VersionedTransaction | Transaction)[] = [];
 *
 *   // Each signer partially signs the transaction
 *   for (const signer of signers) {
 *     const signedTx = await options.solana.signTransactions([{
 *       transaction,
 *       signName: 'partialSign'
 *     }]);
 *
 *     signatures.push(signedTx[0]);
 *   }
 *
 *   return signatures;
 * }
 *
 * // Batch signing
 * async function signMultipleTransactions(
 *   transactions: (VersionedTransaction | Transaction)[]
 * ) {
 *   const signProps = transactions.map(tx => ({
 *     transaction: tx,
 *     signName: 'sign' as const
 *   }));
 *
 *   return await options.solana.signTransactions(signProps);
 * }
 *
 * // Conditional signing based on transaction type
 * function createSignProps(
 *   transaction: VersionedTransaction | Transaction,
 *   isMultiSig: boolean = false
 * ): SignTransactionProps {
 *   return {
 *     transaction,
 *     signName: isMultiSig ? 'partialSign' : 'sign'
 *   };
 * }
 *
 * // Prepare transaction for signing
 * async function prepareAndSignTransaction(
 *   instructions: TransactionInstruction[],
 *   requiresPartialSign: boolean = false
 * ) {
 *   const transaction = await buildV0Transaction({
 *     connection: options.solana.getConnection(),
 *     payer: await options.solana.getPublicKey(),
 *     instructions
 *   });
 *
 *   const signProps: SignTransactionProps = {
 *     transaction,
 *     signName: requiresPartialSign ? 'partialSign' : 'sign'
 *   };
 *
 *   const [signedTransaction] = await options.solana.signTransactions([signProps]);
 *   return signedTransaction;
 * }
 *
 * // Integration with wallet adapters
 * async function signTransactionWithWallet(
 *   transaction: VersionedTransaction,
 *   walletType: 'phantom' | 'solflare' | 'backpack'
 * ) {
 *   const signProps: SignTransactionProps = {
 *     transaction,
 *     signName: 'sign'
 *   };
 *
 *   // Different wallets might have different signing patterns
 *   switch (walletType) {
 *     case 'phantom':
 *       return await options.solana.signTransactions([signProps]);
 *     case 'solflare':
 *       return await options.solana.signTransactions([signProps]);
 *     case 'backpack':
 *       return await options.solana.signTransactions([signProps]);
 *     default:
 *       throw new Error(`Unsupported wallet: ${walletType}`);
 *   }
 * }
 * ```
 */
export interface SignTransactionProps {
    /** Transaction to sign (versioned or legacy) */
    readonly transaction: VersionedTransaction | Transaction;
    /** Signing method - 'sign' for full signature, 'partialSign' for multi-sig scenarios */
    readonly signName?: 'sign' | 'partialSign';
}
