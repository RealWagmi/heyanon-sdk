import { Address, Hex, SignTypedDataParameters } from 'viem';

/**
 * Parameters for an EVM transaction
 * @interface TransactionParams
 * @example
 * ```typescript
 * // ERC20 token transfer
 * const transferTx: TransactionParams = {
 *   target: '0xA0b86a33E6417e4681831442Ff7Bd6c25b5d9C7a', // USDC contract
 *   data: encodeFunctionData({
 *     abi: erc20Abi,
 *     functionName: 'transfer',
 *     args: ['0x742d35Cc6634C0532925a3b8D4C2CA1c1DfF0bE8', parseUnits('100', 6)]
 *   })
 * };
 *
 * // Native token transfer
 * const nativeTx: TransactionParams = {
 *   target: '0x742d35Cc6634C0532925a3b8D4C2CA1c1DfF0bE8',
 *   data: '0x',
 *   value: parseEther('1') // 1 ETH
 * };
 *
 * // Contract interaction with gas limit
 * const contractTx: TransactionParams = {
 *   target: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI contract
 *   data: encodeFunctionData({
 *     abi: uniswapAbi,
 *     functionName: 'swapExactTokensForTokens',
 *     args: [amountIn, amountOutMin, path, to, deadline]
 *   }),
 *   gas: 200000n // Custom gas limit
 * };
 * ```
 */
export interface TransactionParams {
    /** Contract or recipient address */
    readonly target: Address;
    /** Encoded function call data or '0x' for simple transfers */
    readonly data: Hex;
    /** Amount of native currency to send (optional) */
    readonly value?: bigint;
    /** Gas limit for the transaction (optional) */
    readonly gas?: bigint;
}

/**
 * Data returned for each executed transaction
 * @interface TransactionReturnData
 * @example
 * ```typescript
 * // Successful transaction result
 * const successData: TransactionReturnData = {
 *   message: "Transaction confirmed",
 *   hash: "0x1234567890abcdef..."
 * };
 *
 * // Failed transaction result
 * const failedData: TransactionReturnData = {
 *   message: "Transaction failed: insufficient gas",
 *   hash: "0xabcdef1234567890..."
 * };
 * ```
 */
export interface TransactionReturnData {
    /** Status message or error description */
    readonly message: string;
    /** Transaction hash on the blockchain */
    readonly hash: Hex;
}

/**
 * Complete result of transaction execution containing all transaction results
 * @interface TransactionReturn
 * @example
 * ```typescript
 * // Batch transaction result
 * const batchResult: TransactionReturn = {
 *   data: [
 *     {
 *       message: "Approval confirmed",
 *       hash: "0x1111..."
 *     },
 *     {
 *       message: "Swap completed",
 *       hash: "0x2222..."
 *     }
 *   ]
 * };
 *
 * // Single transaction result
 * const singleResult: TransactionReturn = {
 *   data: [{
 *     message: "Transfer successful",
 *     hash: "0x3333..."
 *   }]
 * };
 *
 * // Process results
 * batchResult.data.forEach((tx, index) => {
 *   console.log(`Transaction ${index + 1}: ${tx.message} - ${tx.hash}`);
 * });
 * ```
 */
export interface TransactionReturn {
    /** Array of transaction results */
    readonly data: TransactionReturnData[];
}

/**
 * Properties for sending one or multiple transactions
 * @interface SendTransactionProps
 * @example
 * ```typescript
 * // Single transaction
 * const singleTxProps: SendTransactionProps = {
 *   chainId: 1, // Ethereum mainnet
 *   account: '0x742d35Cc6634C0532925a3b8D4C2CA1c1DfF0bE8',
 *   transactions: [{
 *     target: '0xA0b86a33E6417e4681831442Ff7Bd6c25b5d9C7a',
 *     data: encodeFunctionData({
 *       abi: erc20Abi,
 *       functionName: 'transfer',
 *       args: [recipient, amount]
 *     })
 *   }]
 * };
 *
 * // Batch transactions (approve + swap)
 * const batchTxProps: SendTransactionProps = {
 *   chainId: 137, // Polygon
 *   account: userAddress,
 *   transactions: [
 *     {
 *       target: tokenAddress,
 *       data: encodeFunctionData({
 *         abi: erc20Abi,
 *         functionName: 'approve',
 *         args: [spenderAddress, amount]
 *       })
 *     },
 *     {
 *       target: dexRouterAddress,
 *       data: encodeFunctionData({
 *         abi: dexRouterAbi,
 *         functionName: 'swapExactTokensForTokens',
 *         args: [amountIn, amountOutMin, path, userAddress, deadline]
 *       })
 *     }
 *   ]
 * };
 *
 * // Usage in adapter function
 * const result = await options.evm.sendTransactions(batchTxProps);
 * ```
 */
export interface SendTransactionProps {
    /** Chain ID where transactions will be executed */
    readonly chainId: number;
    /** Account address that will execute the transactions */
    readonly account: Address;
    /** Array of transactions to execute */
    readonly transactions: TransactionParams[];
}

/**
 * Properties for signing one or multiple messages
 * @interface SignMessagesProps
 * @example
 * ```typescript
 * // Single message
 * const signProps: SignMessagesProps = {
 *   account: '0x742d35Cc6634C0532925a3b8D4C2CA1c1DfF0bE8',
 *   messages: ['0x1234567890abcdef...']
 * };
 *
 * // Batch messages (multi-sig)
 * const batchSignProps: SignMessagesProps = {
 *   account: '0x742d35Cc6634C0532925a3b8D4C2CA1c1DfF0bE8',
 *   messages: ['0x1111...', '0x2222...', '0x3333...']
 * };
 * ```
 */
export interface SignMessagesProps {
    /** Account address that will sign the messages */
    readonly account: Address;
    /** Array of messages to sign */
    readonly messages: Hex[];
}

/**
 * Properties for signing one or multiple typed data
 * @interface SignTypedDatasProps
 * @example
 * ```typescript
 * // Single typed data
 * const signProps: SignTypedDatasProps = {
 *   account: '0x742d35Cc6634C0532925a3b8D4C2CA1c1DfF0bE8',
 *   datas: [{
 *     domain: {
 *       name: 'My Token',
 *       version: '1.0.0',
 *       chainId: 1,
 *       verifyingContract: '0x1234567890abcdef...'
 *     },
 *     primaryType: 'MyToken',
 *     message: {
 *       name: 'My Token',
 *       symbol: 'MTK',
 *       decimals: 18,
 *       totalSupply: parseUnits('1000000', 18)
 *     }
 *   }]
 * };
 *
 * // Batch typed data (multi-sig)
 * const batchSignProps: SignTypedDatasProps = {
 *   account: '0x742d35Cc6634C0532925a3b8D4C2CA1c1DfF0bE8',
 *   datas: [
 *     {
 *       domain: {
 *         name: 'My Token',
 *         version: '1.0.0',
 *         chainId: 1,
 *         verifyingContract: '0x1234567890abcdef...'
 *       },
 *       primaryType: 'MyToken',
 *       message: {
 *         name: 'My Token',
 *         symbol: 'MTK',
 *         decimals: 18,
 *         totalSupply: parseUnits('1000000', 18)
 *       }
 *     },
 *     {
 *       domain: {
 *         name: 'My Token',
 *         version: '1.0.0',
 *         chainId: 1,
 *         verifyingContract: '0x1234567890abcdef...'
 *       },
 *       primaryType: 'MyToken',
 *       message: {
 *         name: 'My Token',
 *         symbol: 'MTK',
 *         decimals: 18,
 *         totalSupply: parseUnits('1000000', 18)
 *       }
 *     }
 *   ]
 * };
 * ```
 */
export interface SignTypedDatasProps {
    /** Account address that will sign the typed data */
    readonly account: Address;
    /** Array of typed data to sign */
    readonly datas: Omit<SignTypedDataParameters, 'account'>[];
}
