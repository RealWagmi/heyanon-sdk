import { AiTool } from '../ai';
import { EVM, Solana, TON } from '../blockchain';
import { Hex, PublicClient, SignMessageReturnType, SignTypedDataParameters as ViemSignTypedDataParameters, SignTypedDataReturnType, Address as EvmAddress } from 'viem';
import { Connection, PublicKey } from '@solana/web3.js';
import { AdapterTag } from './misc';
import { Address as TonAddress } from '@ton/ton';

export interface FunctionReturn {
    readonly success: boolean;
    readonly data: string;
}

type SignTypedDataParameters = Omit<ViemSignTypedDataParameters, 'account'>;

export interface EvmFunctionOptions {
    readonly getProvider: (chainId: number) => PublicClient;
    readonly getRecipient: () => Promise<EvmAddress>;
    readonly sendTransactions: (props: EVM.types.SendTransactionProps) => Promise<EVM.types.TransactionReturn>;
    readonly signMessages?: (messages: Hex[]) => Promise<SignMessageReturnType[]>;
    readonly signTypedDatas?: (args: SignTypedDataParameters[]) => Promise<SignTypedDataReturnType[]>;
}

export interface SolanaFunctionOptions {
    readonly getConnection: () => Connection;
    readonly getRecipient: () => Promise<PublicKey>;
    readonly getPublicKey: () => Promise<PublicKey>;
    readonly sendTransactions: (props: Solana.types.SendTransactionProps) => Promise<Solana.types.TransactionReturn>;
}

export interface TonFunctionOptions {
    readonly getAddress: () => Promise<TonAddress>;
    readonly getClient: () => Promise<TON.types.Client>;
    readonly sendTransactions: (props: TON.types.SendTransactionProps) => Promise<TON.types.TransactionReturn>;
}

export interface FunctionOptions {
    readonly evm: EvmFunctionOptions;
    readonly solana: SolanaFunctionOptions;
    readonly ton: TonFunctionOptions;
    readonly notify: (message: string) => Promise<void>;
}

export interface AdapterExport {
    readonly tools: AiTool[];
    readonly functions: Record<string, (args: any, options: FunctionOptions) => Promise<FunctionReturn>>;
    readonly description: string;
    readonly tags?: AdapterTag[];
}
