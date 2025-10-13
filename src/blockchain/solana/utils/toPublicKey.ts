import { PublicKey } from '@solana/web3.js';

/**
 * Converts a string representation to a Solana PublicKey object with validation
 * @param publicKey - String representation of the public key (base58 encoded)
 * @returns A valid PublicKey object
 * @throws {Error} When the provided string is not a valid Solana public key
 * @example
 * ```typescript
 * // Valid Solana public keys
 * const userPublicKey = toPublicKey('11111111111111111111111111111112');
 * const tokenMint = toPublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC
 * const programId = toPublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'); // SPL Token Program
 *
 * // Use in token operations
 * async function getTokenBalance(mintAddress: string, ownerAddress: string) {
 *   const mint = toPublicKey(mintAddress);
 *   const owner = toPublicKey(ownerAddress);
 *   const connection = options.solana.getConnection();
 *
 *   const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, {
 *     mint: mint
 *   });
 *
 *   if (tokenAccounts.value.length === 0) {
 *     return 0;
 *   }
 *
 *   return tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
 * }
 *
 * // Validate user input addresses
 * function validateSolanaAddress(address: string): { valid: boolean; publicKey?: PublicKey; error?: string } {
 *   try {
 *     const publicKey = toPublicKey(address);
 *     return { valid: true, publicKey };
 *   } catch (error) {
 *     return { valid: false, error: error.message };
 *   }
 * }
 *
 * // Use in transaction building
 * async function createTransferTransaction(
 *   fromAddress: string,
 *   toAddress: string,
 *   amount: number
 * ) {
 *   const fromPubkey = toPublicKey(fromAddress);
 *   const toPubkey = toPublicKey(toAddress);
 *
 *   const transferInstruction = SystemProgram.transfer({
 *     fromPubkey,
 *     toPubkey,
 *     lamports: amount * LAMPORTS_PER_SOL
 *   });
 *
 *   return await buildV0Transaction({
 *     connection: options.solana.getConnection(),
 *     payer: fromPubkey,
 *     instructions: [transferInstruction]
 *   });
 * }
 *
 * // Use with associated token accounts
 * import { getAssociatedTokenAddress } from '@solana/spl-token';
 *
 * async function getOrCreateAssociatedTokenAccount(
 *   mintAddress: string,
 *   ownerAddress: string
 * ) {
 *   const mint = toPublicKey(mintAddress);
 *   const owner = toPublicKey(ownerAddress);
 *   const connection = options.solana.getConnection();
 *
 *   const associatedTokenAddress = await getAssociatedTokenAddress(mint, owner);
 *
 *   // Check if account exists
 *   const accountInfo = await connection.getAccountInfo(associatedTokenAddress);
 *
 *   if (!accountInfo) {
 *     // Account doesn't exist, need to create it
 *     const createInstruction = createAssociatedTokenAccountInstruction(
 *       owner, // payer
 *       associatedTokenAddress, // associated token account
 *       owner, // owner
 *       mint // mint
 *     );
 *
 *     return { address: associatedTokenAddress, instruction: createInstruction };
 *   }
 *
 *   return { address: associatedTokenAddress, instruction: null };
 * }
 *
 * // Batch address validation
 * function validateMultipleAddresses(addresses: string[]): {
 *   valid: PublicKey[];
 *   invalid: Array<{ address: string; error: string }>;
 * } {
 *   const valid: PublicKey[] = [];
 *   const invalid: Array<{ address: string; error: string }> = [];
 *
 *   addresses.forEach(address => {
 *     try {
 *       valid.push(toPublicKey(address));
 *     } catch (error) {
 *       invalid.push({ address, error: error.message });
 *     }
 *   });
 *
 *   return { valid, invalid };
 * }
 *
 * // Use in NFT operations
 * async function getNFTMetadata(nftMintAddress: string) {
 *   const mint = toPublicKey(nftMintAddress);
 *   const connection = options.solana.getConnection();
 *
 *   // Get metadata account address
 *   const metadataPDA = PublicKey.findProgramAddressSync(
 *     [
 *       Buffer.from('metadata'),
 *       toPublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(), // Metaplex program
 *       mint.toBuffer()
 *     ],
 *     toPublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
 *   )[0];
 *
 *   const metadataAccount = await connection.getAccountInfo(metadataPDA);
 *   return metadataAccount;
 * }
 *
 * // Use in program interactions
 * async function interactWithCustomProgram(
 *   programIdString: string,
 *   accountStrings: string[],
 *   instructionData: Buffer
 * ) {
 *   const programId = toPublicKey(programIdString);
 *   const accounts = accountStrings.map(addr => ({
 *     pubkey: toPublicKey(addr),
 *     isSigner: false,
 *     isWritable: false
 *   }));
 *
 *   const instruction = new TransactionInstruction({
 *     keys: accounts,
 *     programId,
 *     data: instructionData
 *   });
 *
 *   return await buildV0Transaction({
 *     connection: options.solana.getConnection(),
 *     payer: await options.solana.getPublicKey(),
 *     instructions: [instruction]
 *   });
 * }
 *
 * // Error handling with detailed messages
 * function safeToPublicKey(address: string): PublicKey | null {
 *   try {
 *     return toPublicKey(address);
 *   } catch (error) {
 *     console.warn(`Invalid Solana address: ${address} - ${error.message}`);
 *     return null;
 *   }
 * }
 *
 * // Use in adapter configuration
 * async function setupSolanaAdapter(config: {
 *   userAddress: string;
 *   tokenMints: string[];
 *   programIds: string[];
 * }) {
 *   // Validate all addresses upfront
 *   const userPubkey = toPublicKey(config.userAddress);
 *   const mintPubkeys = config.tokenMints.map(toPublicKey);
 *   const programPubkeys = config.programIds.map(toPublicKey);
 *
 *   return {
 *     user: userPubkey,
 *     supportedMints: mintPubkeys,
 *     programs: programPubkeys
 *   };
 * }
 *
 * // Common Solana addresses as constants
 * const COMMON_ADDRESSES = {
 *   SYSTEM_PROGRAM: toPublicKey('11111111111111111111111111111112'),
 *   TOKEN_PROGRAM: toPublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
 *   ASSOCIATED_TOKEN_PROGRAM: toPublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
 *   USDC_MINT: toPublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
 *   WSOL_MINT: toPublicKey('So11111111111111111111111111111111111111112')
 * };
 * ```
 */
export function toPublicKey(publicKey: string): PublicKey {
    try {
        const result = new PublicKey(publicKey);
        return result;
    } catch (error) {
        throw new Error(`${publicKey} is not publickey`);
    }
}
