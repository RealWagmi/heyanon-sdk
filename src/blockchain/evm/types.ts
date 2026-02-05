import { Abi, Address, Hex, SignTypedDataParameters } from 'viem';

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
 * Properties for deploying a smart contract
 * @interface ContractProps
 * @example
 * ```typescript
 * // ERC20 token deployment
 * const tokenContract: ContractProps = {
 *   abi: [
 *     {
 *       "inputs": [
 *         {"name": "_name", "type": "string"},
 *         {"name": "_symbol", "type": "string"},
 *         {"name": "_totalSupply", "type": "uint256"}
 *       ],
 *       "stateMutability": "nonpayable",
 *       "type": "constructor"
 *     }
 *   ],
 *   bytecode: "0x608060405234801561001057600080fd5b50...",
 *   args: ["MyToken", "MTK", parseUnits("1000000", 18)]
 * };
 *
 * // Simple contract without constructor arguments
 * const simpleContract: ContractProps = {
 *   abi: contractAbi,
 *   bytecode: "0x608060405234801561001057600080fd5b50..."
 * };
 *
 * // Multi-signature wallet deployment
 * const multisigContract: ContractProps = {
 *   abi: multisigAbi,
 *   bytecode: multisigBytecode,
 *   args: [
 *     ['0x1111...', '0x2222...', '0x3333...'], // owners
 *     2 // required confirmations
 *   ]
 * };
 * ```
 */
export interface ContractProps {
    /** Contract ABI (Application Binary Interface) */
    readonly abi: Abi | any[];
    /** Contract bytecode for deployment */
    readonly bytecode: Hex;
    /** Constructor arguments (optional) */
    readonly args?: any[];
}

/**
 * Properties for deploying one or multiple smart contracts
 * @interface DeployContractProps
 * @example
 * ```typescript
 * // Single contract deployment
 * const deployProps: DeployContractProps = {
 *   chainId: 1, // Ethereum mainnet
 *   account: '0x742d35Cc6634C0532925a3b8D4C2CA1c1DfF0bE8',
 *   contracts: [{
 *     abi: erc20Abi,
 *     bytecode: erc20Bytecode,
 *     args: ["MyToken", "MTK", parseUnits("1000000", 18)]
 *   }]
 * };
 *
 * // Multiple contract deployment (factory pattern)
 * const factoryDeployProps: DeployContractProps = {
 *   chainId: 137, // Polygon
 *   account: deployerAddress,
 *   contracts: [
 *     {
 *       abi: factoryAbi,
 *       bytecode: factoryBytecode,
 *       args: [feeRecipient, defaultFee]
 *     },
 *     {
 *       abi: implementationAbi,
 *       bytecode: implementationBytecode,
 *       args: []
 *     }
 *   ]
 * };
 *
 * // DeFi protocol deployment
 * const defiProtocolDeploy: DeployContractProps = {
 *   chainId: 42161, // Arbitrum
 *   account: protocolDeployer,
 *   contracts: [
 *     {
 *       abi: vaultAbi,
 *       bytecode: vaultBytecode,
 *       args: [underlyingToken, "Yield Vault", "YV"]
 *     },
 *     {
 *       abi: strategyAbi,
 *       bytecode: strategyBytecode,
 *       args: [vaultAddress, farmingPoolAddress]
 *     },
 *     {
 *       abi: governanceAbi,
 *       bytecode: governanceBytecode,
 *       args: [governanceToken, votingDelay, votingPeriod]
 *     }
 *   ]
 * };
 *
 * // Usage in adapter function
 * async function deployContracts(deployProps: DeployContractProps) {
 *   const deployedAddresses = await options.evm.deployContracts(deployProps);
 *
 *   deployedAddresses.forEach((address, index) => {
 *     console.log(`Contract ${index + 1} deployed at: ${address}`);
 *   });
 *
 *   return deployedAddresses;
 * }
 *
 * // Contract verification helper
 * function prepareContractVerification(
 *   deployProps: DeployContractProps,
 *   deployedAddresses: Address[]
 * ) {
 *   return deployProps.contracts.map((contract, index) => ({
 *     address: deployedAddresses[index],
 *     contractName: `Contract${index + 1}`,
 *     sourceCode: getSourceCodeFromBytecode(contract.bytecode),
 *     abi: JSON.stringify(contract.abi),
 *     constructorArgs: contract.args ? encodeAbiParameters(
 *       getConstructorInputs(contract.abi),
 *       contract.args
 *     ) : undefined
 *   }));
 * }
 * ```
 */
export interface DeployContractProps {
    /** Chain ID where contracts will be deployed */
    readonly chainId: number;
    /** Account address that will deploy the contracts */
    readonly account: Address;
    /** Array of contracts to deploy */
    readonly contracts: ContractProps[];
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
