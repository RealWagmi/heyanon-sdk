import { Connection, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';

/**
 * Properties for building a Solana v0 transaction
 * @interface Props
 */
interface Props {
    /** Solana connection to fetch recent blockhash */
    connection: Connection;
    /** Public key of the account that will pay for the transaction */
    payer: PublicKey;
    /** Array of transaction instructions to include */
    instructions: TransactionInstruction[];
}

/**
 * Builds a Solana v0 transaction with the provided instructions
 * @param props - The transaction building parameters
 * @returns A versioned transaction ready for signing and sending
 * @description Creates a v0 transaction with recent blockhash and compiles instructions into a transaction message
 * @example
 * ```typescript
 * import {
 *   SystemProgram,
 *   LAMPORTS_PER_SOL,
 *   PublicKey
 * } from '@solana/web3.js';
 *
 * // Simple SOL transfer
 * const transferInstruction = SystemProgram.transfer({
 *   fromPubkey: senderPublicKey,
 *   toPubkey: new PublicKey('11111111111111111111111111111112'),
 *   lamports: 0.1 * LAMPORTS_PER_SOL // 0.1 SOL
 * });
 *
 * const transaction = await buildV0Transaction({
 *   connection: options.solana.getConnection(),
 *   payer: await options.solana.getPublicKey(),
 *   instructions: [transferInstruction]
 * });
 *
 * // SPL Token transfer
 * import { createTransferInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
 *
 * const tokenMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC
 * const fromTokenAccount = await getAssociatedTokenAddress(tokenMint, senderPublicKey);
 * const toTokenAccount = await getAssociatedTokenAddress(tokenMint, recipientPublicKey);
 *
 * const tokenTransferInstruction = createTransferInstruction(
 *   fromTokenAccount,
 *   toTokenAccount,
 *   senderPublicKey,
 *   100_000, // 0.1 USDC (6 decimals)
 * );
 *
 * const tokenTransaction = await buildV0Transaction({
 *   connection: options.solana.getConnection(),
 *   payer: senderPublicKey,
 *   instructions: [tokenTransferInstruction]
 * });
 *
 * // Multi-instruction transaction (swap on Jupiter)
 * const swapInstructions = await jupiterApi.getSwapInstructions({
 *   inputMint: 'So11111111111111111111111111111111111111112', // SOL
 *   outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
 *   amount: 0.1 * LAMPORTS_PER_SOL,
 *   slippageBps: 50 // 0.5%
 * });
 *
 * const swapTransaction = await buildV0Transaction({
 *   connection: options.solana.getConnection(),
 *   payer: await options.solana.getPublicKey(),
 *   instructions: swapInstructions
 * });
 *
 * // DeFi operations (lending on Solend)
 * const lendingInstructions = [
 *   // Create user obligation account
 *   createInitObligationInstruction({
 *     obligation: obligationAccount.publicKey,
 *     lendingMarket: SOLEND_MAIN_MARKET,
 *     obligationOwner: userPublicKey
 *   }),
 *   // Deposit collateral
 *   createDepositObligationCollateralInstruction({
 *     sourceLiquidity: userTokenAccount,
 *     destinationCollateral: collateralAccount,
 *     depositReserve: solReserve,
 *     obligation: obligationAccount.publicKey,
 *     lendingMarket: SOLEND_MAIN_MARKET,
 *     obligationOwner: userPublicKey,
 *     transferAuthority: userPublicKey,
 *     liquidityAmount: depositAmount
 *   })
 * ];
 *
 * const lendingTransaction = await buildV0Transaction({
 *   connection: options.solana.getConnection(),
 *   payer: userPublicKey,
 *   instructions: lendingInstructions
 * });
 *
 * // NFT operations
 * import { createMintToInstruction, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
 *
 * const nftMintInstructions = [
 *   // Create associated token account for NFT
 *   createAssociatedTokenAccountInstruction(
 *     userPublicKey, // payer
 *     nftTokenAccount, // associated token account
 *     userPublicKey, // owner
 *     nftMint // mint
 *   ),
 *   // Mint NFT to user
 *   createMintToInstruction(
 *     nftMint, // mint
 *     nftTokenAccount, // destination
 *     mintAuthority, // authority
 *     1 // amount (1 for NFT)
 *   )
 * ];
 *
 * const nftTransaction = await buildV0Transaction({
 *   connection: options.solana.getConnection(),
 *   payer: userPublicKey,
 *   instructions: nftMintInstructions
 * });
 *
 * // Usage in adapter function
 * async function executeSolanaTransaction(instructions: TransactionInstruction[]) {
 *   const transaction = await buildV0Transaction({
 *     connection: options.solana.getConnection(),
 *     payer: await options.solana.getPublicKey(),
 *     instructions
 *   });
 *
 *   return await options.solana.sendTransactions({
 *     transactions: [transaction]
 *   });
 * }
 *
 * // Batch operations with multiple transactions
 * async function executeBatchOperations(
 *   operationBatches: TransactionInstruction[][]
 * ) {
 *   const transactions = await Promise.all(
 *     operationBatches.map(instructions =>
 *       buildV0Transaction({
 *         connection: options.solana.getConnection(),
 *         payer: await options.solana.getPublicKey(),
 *         instructions
 *       })
 *     )
 *   );
 *
 *   return await options.solana.sendTransactions({
 *     transactions
 *   });
 * }
 *
 * // Error handling and validation
 * async function safeBuildTransaction(
 *   connection: Connection,
 *   payer: PublicKey,
 *   instructions: TransactionInstruction[]
 * ) {
 *   try {
 *     // Validate instructions
 *     if (instructions.length === 0) {
 *       throw new Error('No instructions provided');
 *     }
 *
 *     // Check account balance for fees
 *     const balance = await connection.getBalance(payer);
 *     const minBalance = 5000; // Minimum lamports for transaction fees
 *
 *     if (balance < minBalance) {
 *       throw new Error(`Insufficient balance for transaction fees. Required: ${minBalance}, Available: ${balance}`);
 *     }
 *
 *     return await buildV0Transaction({
 *       connection,
 *       payer,
 *       instructions
 *     });
 *   } catch (error) {
 *     console.error('Failed to build transaction:', error);
 *     throw error;
 *   }
 * }
 * ```
 */
export async function buildV0Transaction({ connection, payer, instructions }: Props): Promise<VersionedTransaction> {
    const { blockhash } = await connection.getLatestBlockhash();
    const message = new TransactionMessage({
        payerKey: payer,
        recentBlockhash: blockhash,
        instructions,
    }).compileToV0Message();
    const transaction = new VersionedTransaction(message);

    return transaction;
}
