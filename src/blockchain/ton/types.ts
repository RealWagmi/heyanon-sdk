import { SenderArguments } from '@ton/core';
import { TonApiClient } from '@ton-api/client';
import { ContractAdapter } from '@ton-api/ton-adapter';
import { Address, TonClient, TonClient4 } from '@ton/ton';

/**
 * Data returned for each executed TON transaction
 * @interface TransactionReturnData
 * @example
 * ```typescript
 * // Successful transaction result
 * const successData: TransactionReturnData = {
 *   message: "Transaction confirmed",
 *   hash: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
 * };
 *
 * // Failed transaction result
 * const failedData: TransactionReturnData = {
 *   message: "Transaction failed: Insufficient balance",
 *   hash: "b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567a"
 * };
 *
 * // Process transaction result
 * function handleTonTransactionResult(result: TransactionReturnData) {
 *   console.log(`Status: ${result.message}`);
 *   console.log(`Transaction: https://tonscan.org/tx/${result.hash}`);
 *
 *   if (result.message.includes('confirmed')) {
 *     // Handle success
 *     showSuccessNotification(`Transaction confirmed: ${result.hash}`);
 *   } else {
 *     // Handle error
 *     showErrorNotification(result.message);
 *   }
 * }
 *
 * // Extract transaction details
 * function parseTransactionResult(result: TransactionReturnData) {
 *   return {
 *     isSuccess: result.message.includes('confirmed') || result.message.includes('successful'),
 *     transactionId: result.hash,
 *     explorerUrl: `https://tonscan.org/tx/${result.hash}`,
 *     statusMessage: result.message
 *   };
 * }
 * ```
 */
export interface TransactionReturnData {
    /** Status message or error description */
    readonly message: string;
    /** Transaction hash on TON blockchain */
    readonly hash: string;
}

/**
 * Complete result of TON transaction execution containing all transaction results
 * @interface TransactionReturn
 * @example
 * ```typescript
 * // Batch transaction result
 * const batchResult: TransactionReturn = {
 *   data: [
 *     {
 *       message: "TON transfer confirmed",
 *       hash: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
 *     },
 *     {
 *       message: "Jetton transfer completed",
 *       hash: "b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567a"
 *     }
 *   ]
 * };
 *
 * // Single transaction result
 * const singleResult: TransactionReturn = {
 *   data: [{
 *     message: "Smart contract deployment successful",
 *     hash: "c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567ab2"
 *   }]
 * };
 *
 * // Process all results
 * function processTonBatchResults(result: TransactionReturn) {
 *   const successful = result.data.filter(tx =>
 *     tx.message.includes('confirmed') ||
 *     tx.message.includes('successful') ||
 *     tx.message.includes('completed')
 *   );
 *
 *   const failed = result.data.filter(tx =>
 *     tx.message.includes('failed') ||
 *     tx.message.includes('error') ||
 *     tx.message.includes('rejected')
 *   );
 *
 *   console.log(`TON Transactions - Successful: ${successful.length}, Failed: ${failed.length}`);
 *
 *   // Create comprehensive summary
 *   return {
 *     totalTransactions: result.data.length,
 *     successCount: successful.length,
 *     failureCount: failed.length,
 *     successfulHashes: successful.map(tx => tx.hash),
 *     failedHashes: failed.map(tx => tx.hash),
 *     explorerLinks: result.data.map(tx => `https://tonscan.org/tx/${tx.hash}`)
 *   };
 * }
 *
 * // Calculate transaction fees
 * async function calculateTransactionCosts(result: TransactionReturn, client: Client) {
 *   const costs = await Promise.all(
 *     result.data.map(async (tx) => {
 *       try {
 *         const txData = await client.api.blockchain.getBlockchainTransaction(tx.hash);
 *         return {
 *           hash: tx.hash,
 *           fee: txData.fee.total,
 *           success: tx.message.includes('confirmed')
 *         };
 *       } catch (error) {
 *         return {
 *           hash: tx.hash,
 *           fee: 0,
 *           success: false,
 *           error: error.message
 *         };
 *       }
 *     })
 *   );
 *
 *   return costs;
 * }
 * ```
 */
export interface TransactionReturn {
    /** Array of transaction results */
    readonly data: TransactionReturnData[];
}

/**
 * Properties for sending one or multiple TON transactions
 * @interface SendTransactionProps
 * @example
 * ```typescript
 * // Simple TON transfer
 * const transferProps: SendTransactionProps = {
 *   account: Address.parse('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t'),
 *   transactions: [{
 *     to: Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'),
 *     value: toNano('1'), // 1 TON
 *     body: beginCell().endCell(), // Empty body for simple transfer
 *     bounce: false
 *   }]
 * };
 *
 * // Jetton (TON token) transfer
 * const jettonTransferProps: SendTransactionProps = {
 *   account: senderAddress,
 *   transactions: [{
 *     to: jettonWalletAddress,
 *     value: toNano('0.1'), // Gas fee
 *     body: beginCell()
 *       .storeUint(0xf8a7ea5, 32) // Jetton transfer opcode
 *       .storeUint(0, 64) // Query ID
 *       .storeCoins(toNano('100')) // Jetton amount
 *       .storeAddress(recipientAddress)
 *       .storeAddress(senderAddress) // Response address
 *       .storeBit(0) // Custom payload
 *       .storeCoins(toNano('0.01')) // Forward amount
 *       .storeBit(0) // Forward payload
 *       .endCell(),
 *     bounce: false
 *   }]
 * };
 *
 * // Smart contract deployment
 * const deployProps: SendTransactionProps = {
 *   account: deployerAddress,
 *   transactions: [{
 *     to: contractAddress,
 *     value: toNano('0.5'), // Initial contract balance
 *     body: beginCell()
 *       .storeRef(contractCode) // Contract code
 *       .storeRef(contractData) // Initial data
 *       .endCell(),
 *     bounce: false,
 *     init: {
 *       code: contractCode,
 *       data: contractData
 *     }
 *   }]
 * };
 *
 * // Batch operations (multiple transactions)
 * const batchProps: SendTransactionProps = {
 *   account: userAddress,
 *   transactions: [
 *     {
 *       to: Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'),
 *       value: toNano('0.5'),
 *       body: beginCell().endCell(),
 *       bounce: false
 *     },
 *     {
 *       to: jettonMasterAddress,
 *       value: toNano('0.1'),
 *       body: buildJettonMintBody({
 *         recipient: userAddress,
 *         amount: toNano('1000'),
 *         queryId: Date.now()
 *       }),
 *       bounce: true
 *     }
 *   ]
 * };
 *
 * // DEX operations (DeDust swap)
 * const swapProps: SendTransactionProps = {
 *   account: await options.ton.getAddress(),
 *   transactions: [{
 *     to: poolAddress,
 *     value: toNano('1.5'), // TON amount + gas
 *     body: beginCell()
 *       .storeUint(0xea06185d, 32) // Swap opcode
 *       .storeUint(0, 64) // Query ID
 *       .storeCoins(toNano('1')) // Amount in
 *       .storeAddress(jettonAddressOut)
 *       .storeCoins(minAmountOut)
 *       .storeAddress(userAddress) // Recipient
 *       .endCell(),
 *     bounce: true
 *   }]
 * };
 *
 * // NFT operations
 * const nftTransferProps: SendTransactionProps = {
 *   account: nftOwnerAddress,
 *   transactions: [{
 *     to: nftItemAddress,
 *     value: toNano('0.1'),
 *     body: beginCell()
 *       .storeUint(0x5fcc3d14, 32) // NFT transfer opcode
 *       .storeUint(0, 64) // Query ID
 *       .storeAddress(newOwnerAddress)
 *       .storeAddress(nftOwnerAddress) // Response address
 *       .storeBit(0) // Custom payload
 *       .storeCoins(toNano('0.01')) // Forward amount
 *       .endCell(),
 *     bounce: false
 *   }]
 * };
 *
 * // Usage in adapter function
 * async function executeTonTransactions(props: SendTransactionProps) {
 *   const result = await options.ton.sendTransactions(props);
 *
 *   // Log all transaction hashes
 *   result.data.forEach((tx, index) => {
 *     console.log(`TON Transaction ${index + 1}: ${tx.hash}`);
 *     console.log(`Status: ${tx.message}`);
 *   });
 *
 *   return result;
 * }
 * ```
 */
export interface SendTransactionProps {
    /** Account that will execute the transactions */
    readonly account: Address;
    /** Array of TON transaction arguments */
    readonly transactions: SenderArguments[];
}

/**
 * TON blockchain client configuration with multiple client types and adapters
 * @interface Client
 * @example
 * ```typescript
 * // Create TON client configuration
 * const tonClient: Client = {
 *   api: new TonApiClient({
 *     baseUrl: 'https://tonapi.io',
 *     apiKey: 'your-api-key'
 *   }),
 *   client: new TonClient({
 *     endpoint: 'https://toncenter.com/api/v2/jsonRPC'
 *   }),
 *   client4: new TonClient4({
 *     endpoint: 'https://mainnet-v4.tonhubapi.com'
 *   }),
 *   adapter: new ContractAdapter()
 * };
 *
 * // Use different clients for different operations
 * async function getTonAccountInfo(address: Address, client: Client) {
 *   // Use TonApiClient for rich API data
 *   const accountInfo = await client.api.accounts.getAccount(address.toString());
 *
 *   // Use TonClient for basic operations
 *   const balance = await client.client.getBalance(address);
 *
 *   // Use TonClient4 for v4 API features
 *   const accountState = await client.client4.getAccount(
 *     client.client4.provider.block.lastSeqno,
 *     address
 *   );
 *
 *   return {
 *     address: address.toString(),
 *     balance: balance.toString(),
 *     status: accountInfo.status,
 *     lastActivity: accountInfo.lastActivity,
 *     interfaces: accountInfo.interfaces
 *   };
 * }
 *
 * // Smart contract interaction
 * async function interactWithContract(
 *   contractAddress: Address,
 *   method: string,
 *   params: any[],
 *   client: Client
 * ) {
 *   // Use adapter for contract interactions
 *   const contract = client.adapter.open(
 *     Contract.create({
 *       workchain: contractAddress.workChain,
 *       address: contractAddress.hash
 *     }, contractCode)
 *   );
 *
 *   // Call contract method
 *   const result = await contract.get(method, params);
 *   return result;
 * }
 *
 * // Jetton operations using different clients
 * async function getJettonInfo(jettonMaster: Address, client: Client) {
 *   // Get jetton data using API client
 *   const jettonInfo = await client.api.jettons.getJetton(jettonMaster.toString());
 *
 *   // Get on-chain data using TonClient
 *   const jettonData = await client.client.runMethod(jettonMaster, 'get_jetton_data');
 *
 *   return {
 *     name: jettonInfo.metadata?.name,
 *     symbol: jettonInfo.metadata?.symbol,
 *     decimals: jettonInfo.metadata?.decimals,
 *     totalSupply: jettonData.stack.readBigNumber(),
 *     mintable: jettonData.stack.readBoolean(),
 *     adminAddress: jettonData.stack.readAddress()
 *   };
 * }
 *
 * // Transaction tracking
 * async function trackTransaction(hash: string, client: Client) {
 *   try {
 *     // Use API client for detailed transaction info
 *     const txInfo = await client.api.blockchain.getBlockchainTransaction(hash);
 *
 *     return {
 *       hash: txInfo.hash,
 *       success: txInfo.success,
 *       fee: txInfo.fee.total,
 *       timestamp: txInfo.utime,
 *       inMsg: txInfo.inMsg,
 *       outMsgs: txInfo.outMsgs
 *     };
 *   } catch (error) {
 *     console.error('Failed to track transaction:', error);
 *     return null;
 *   }
 * }
 *
 * // Multi-client balance checking
 * async function getComprehensiveBalance(address: Address, client: Client) {
 *   const [apiBalance, clientBalance, client4Balance] = await Promise.allSettled([
 *     client.api.accounts.getAccount(address.toString())
 *       .then(acc => acc.balance),
 *     client.client.getBalance(address),
 *     client.client4.getAccount(
 *       await client.client4.provider.block.lastSeqno,
 *       address
 *     ).then(acc => acc.account.balance?.coins || 0n)
 *   ]);
 *
 *   return {
 *     api: apiBalance.status === 'fulfilled' ? apiBalance.value : null,
 *     client: clientBalance.status === 'fulfilled' ? clientBalance.value : null,
 *     client4: client4Balance.status === 'fulfilled' ? client4Balance.value : null
 *   };
 * }
 *
 * // Initialize client with configuration
 * function createTonClient(config: {
 *   apiKey?: string;
 *   network?: 'mainnet' | 'testnet';
 *   endpoints?: {
 *     api?: string;
 *     client?: string;
 *     client4?: string;
 *   };
 * }): Client {
 *   const isTestnet = config.network === 'testnet';
 *
 *   return {
 *     api: new TonApiClient({
 *       baseUrl: config.endpoints?.api || (isTestnet ? 'https://testnet.tonapi.io' : 'https://tonapi.io'),
 *       apiKey: config.apiKey
 *     }),
 *     client: new TonClient({
 *       endpoint: config.endpoints?.client || (isTestnet
 *         ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
 *         : 'https://toncenter.com/api/v2/jsonRPC')
 *     }),
 *     client4: new TonClient4({
 *       endpoint: config.endpoints?.client4 || (isTestnet
 *         ? 'https://testnet-v4.tonhubapi.com'
 *         : 'https://mainnet-v4.tonhubapi.com')
 *     }),
 *     adapter: new ContractAdapter()
 *   };
 * }
 * ```
 */
export interface Client {
    /** TON API client for rich blockchain data and operations */
    readonly api: TonApiClient;
    /** Standard TON client for basic blockchain operations */
    readonly client: TonClient;
    /** TON v4 client for advanced features and better performance */
    readonly client4: TonClient4;
    /** Contract adapter for smart contract interactions */
    readonly adapter: ContractAdapter;
}
