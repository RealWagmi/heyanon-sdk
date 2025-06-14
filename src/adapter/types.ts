import { AiTool } from '../ai';
import { EVM, Solana, TON, WalletType, Chain } from '../blockchain';
import { Hex, PublicClient, SignMessageReturnType, SignTypedDataParameters as ViemSignTypedDataParameters, SignTypedDataReturnType, Address } from 'viem';
import { Connection, PublicKey, Transaction as SolanaTransaction, VersionedTransaction as SolanaVersionedTransaction } from '@solana/web3.js';
import { AdapterTag } from './misc';
import { Address as TonAddress } from '@ton/ton';
import { DeployContractProps } from '../blockchain/evm/types';
import { Exchange, exchanges } from 'ccxt';

export interface FunctionReturn {
    readonly success: boolean;
    readonly data: string;
}

type SignTypedDataParameters = Omit<ViemSignTypedDataParameters, 'account'>;

export interface EvmFunctionOptions {
    readonly getAddress: () => Promise<Address>;
    readonly getProvider: (chainId: number) => PublicClient;
    readonly sendTransactions: (props: EVM.types.SendTransactionProps) => Promise<EVM.types.TransactionReturn>;
    readonly deployContracts: (props: DeployContractProps) => Promise<Address[]>;
    readonly signMessages?: (messages: Hex[]) => Promise<SignMessageReturnType[]>;
    readonly signTypedDatas?: (args: SignTypedDataParameters[]) => Promise<SignTypedDataReturnType[]>;
}

export interface SolanaFunctionOptions {
    readonly getConnection: () => Connection;
    readonly getPublicKey: () => Promise<PublicKey>;
    readonly sendTransactions: (props: Solana.types.SendTransactionProps) => Promise<Solana.types.TransactionReturn>;
    readonly signTransactions?: (transactions: Solana.types.SignTransactionProps[]) => Promise<(SolanaTransaction | SolanaVersionedTransaction)[]>;
}

export interface TonFunctionOptions {
    readonly getAddress: () => Promise<TonAddress>;
    readonly getClient: () => Promise<TON.types.Client>;
    readonly sendTransactions: (props: TON.types.SendTransactionProps) => Promise<TON.types.TransactionReturn>;
}

export interface UserToken {
    readonly chain: Chain;
    readonly name: string;
    readonly symbol: string;
    readonly address: string;
    readonly decimals: number;
}

export interface FunctionOptions {
    readonly evm: EvmFunctionOptions;
    readonly solana: SolanaFunctionOptions;
    readonly ton: TonFunctionOptions;
    readonly notify: (message: string, type?: 'alert' | 'regular') => Promise<void>;
    readonly getRecipient: (type: WalletType) => Promise<string>;
    readonly getUserTokens: () => Promise<UserToken[]>;
    readonly getCcxtExchange: (name: keyof typeof exchanges) => Promise<Exchange>;
    readonly updateUserTokens: (props: { evmAddresses: string[]; solanaAddresses: string[]; tonAddresses: string[] }) => Promise<{ [key: string]: string }>;
}

export interface AdapterExport {
    readonly tools: AiTool[];
    readonly functions: Record<string, (args: any, options: FunctionOptions) => Promise<FunctionReturn>>;
    readonly description: string;
    readonly chains: Chain[];
    readonly tags: AdapterTag[];
}
