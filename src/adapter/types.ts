import { OpenAI } from 'openai';
import { EVM, Solana, TON, WalletType, Chain } from '../blockchain';
import { Hex, PublicClient, SignMessageReturnType, SignTypedDataParameters as ViemSignTypedDataParameters, SignTypedDataReturnType, Address } from 'viem';
import { Connection, PublicKey, Transaction as SolanaTransaction, VersionedTransaction as SolanaVersionedTransaction } from '@solana/web3.js';
import { AdapterTag } from './misc';
import { Address as TonAddress } from '@ton/ton';
import { DeployContractProps } from '../blockchain/evm/types';
import { Exchange, exchanges } from 'ccxt';

/**
 * Result of adapter function execution
 * @interface FunctionReturn
 * @example
 * ```typescript
 * const result: FunctionReturn = {
 *   success: true,
 *   data: "Transaction hash: 0x123..."
 * };
 * ```
 */
export interface FunctionReturn {
    /** Success status of the operation */
    readonly success: boolean;
    /** Result data as string */
    readonly data: string;
}

type SignTypedDataParameters = Omit<ViemSignTypedDataParameters, 'account'>;

/**
 * Options for working with EVM blockchains
 * @interface EvmFunctionOptions
 * @example
 * ```typescript
 * const evmOptions: EvmFunctionOptions = {
 *   getAddress: async () => "0x742d35Cc6634C0532925a3b8D4C2CA1c1DfF0bE8",
 *   getProvider: (chainId) => new PublicClient({ chain: { id: chainId } }),
 *   sendTransactions: async (props) => ({ success: true, hash: "0x..." }),
 *   deployContracts: async (props) => ["0x123..."]
 * };
 * ```
 */
export interface EvmFunctionOptions {
    /** Get wallet address */
    readonly getAddress: () => Promise<Address>;
    /** Get provider for specified chain */
    readonly getProvider: (chainId: number) => PublicClient;
    /** Send transactions */
    readonly sendTransactions: (props: EVM.types.SendTransactionProps) => Promise<EVM.types.TransactionReturn>;
    /** Deploy smart contracts */
    readonly deployContracts: (props: DeployContractProps) => Promise<Address[]>;
    /** Sign messages (optional) */
    readonly signMessages?: (messages: Hex[]) => Promise<SignMessageReturnType[]>;
    /** Sign typed data (optional) */
    readonly signTypedDatas?: (args: SignTypedDataParameters[]) => Promise<SignTypedDataReturnType[]>;
}

/**
 * Options for working with Solana blockchain
 * @interface SolanaFunctionOptions
 * @example
 * ```typescript
 * const solanaOptions: SolanaFunctionOptions = {
 *   getConnection: () => new Connection("https://api.mainnet-beta.solana.com"),
 *   getPublicKey: async () => new PublicKey("11111111111111111111111111111112"),
 *   sendTransactions: async (props) => ({ success: true, signature: "5VT..." })
 * };
 * ```
 */
export interface SolanaFunctionOptions {
    /** Get Solana connection */
    readonly getConnection: () => Connection;
    /** Get wallet public key */
    readonly getPublicKey: () => Promise<PublicKey>;
    /** Send transactions */
    readonly sendTransactions: (props: Solana.types.SendTransactionProps) => Promise<Solana.types.TransactionReturn>;
    /** Sign transactions (optional) */
    readonly signTransactions?: (transactions: Solana.types.SignTransactionProps[]) => Promise<(SolanaTransaction | SolanaVersionedTransaction)[]>;
}

/**
 * Options for working with TON blockchain
 * @interface TonFunctionOptions
 */
export interface TonFunctionOptions {
    /** Get wallet address */
    readonly getAddress: () => Promise<TonAddress>;
    /** Get TON client */
    readonly getClient: () => Promise<TON.types.Client>;
    /** Send transactions */
    readonly sendTransactions: (props: TON.types.SendTransactionProps) => Promise<TON.types.TransactionReturn>;
}

/**
 * User token information
 * @interface UserToken
 * @example
 * ```typescript
 * const usdcToken: UserToken = {
 *   chain: Chain.Ethereum,
 *   name: "USD Coin",
 *   symbol: "USDC",
 *   address: "0xA0b86a33E6417e4681831442Ff7Bd6c25b5d9C7a",
 *   decimals: 6
 * };
 * ```
 */
export interface UserToken {
    /** Blockchain network of the token */
    readonly chain: Chain;
    /** Token name */
    readonly name: string;
    /** Token symbol */
    readonly symbol: string;
    /** Token contract address */
    readonly address: string;
    /** Number of decimal places */
    readonly decimals: number;
}

/**
 * Complete set of function options for all supported blockchains and utilities
 * @interface FunctionOptions
 * @example
 * ```typescript
 * const options: FunctionOptions = {
 *   evm: evmOptions,
 *   solana: solanaOptions,
 *   ton: tonOptions,
 *   notify: async (message, type) => console.log(`${type}: ${message}`),
 *   getRecipient: async (type) => "recipient_address",
 *   getUserTokens: async () => [usdcToken],
 *   getCcxtExchange: async (name) => new exchanges[name](),
 *   addUserToken: async (token) => token
 * };
 * ```
 */
export interface FunctionOptions {
    /** EVM blockchain options */
    readonly evm: EvmFunctionOptions;
    /** Solana blockchain options */
    readonly solana: SolanaFunctionOptions;
    /** TON blockchain options */
    readonly ton: TonFunctionOptions;
    /** Send notification to user */
    readonly notify: (message: string, type?: 'alert' | 'regular') => Promise<void>;
    /** Get recipient address for specific wallet type */
    readonly getRecipient: (type: WalletType) => Promise<string>;
    /** Get user's token list */
    readonly getUserTokens: () => Promise<UserToken[]>;
    /** Get CCXT exchange instance */
    readonly getCcxtExchange: (name: keyof typeof exchanges) => Promise<Exchange>;
    /** Add token to user's token list */
    readonly addUserToken: (token: UserToken) => Promise<UserToken>;
}

/**
 * Adapter export with configuration and functions
 * @interface AdapterExport
 * @example
 * ```typescript
 * const myAdapter: AdapterExport = {
 *   chains: [Chain.Ethereum, Chain.Polygon],
 *   tags: [AdapterTag.DeFi, AdapterTag.DEX],
 *   description: "Swap tokens on decentralized exchanges",
 *   functions: {
 *     swap: async (args, options) => ({ success: true, data: "Swap completed" })
 *   },
 *   executableFunctions: ["swap"],
 *   tools: [{ type: "function", function: { name: "swap", description: "..." } }]
 * };
 * ```
 */
export interface AdapterExport {
    /** Supported blockchain networks */
    readonly chains: Chain[];
    /** Adapter tags for categorization */
    readonly tags: AdapterTag[];
    /** Adapter description */
    readonly description: string;
    /** Available adapter functions */
    readonly functions: Record<string, (args: any, options: FunctionOptions) => Promise<FunctionReturn>>;
    /** List of executable functions */
    readonly executableFunctions: string[];
    /** Tools for OpenAI integration */
    readonly tools: OpenAI.Chat.Completions.ChatCompletionTool[];
}
