import { AiTool } from '../ai';
import { EVM, Solana } from '../blockchain';
import { Hex, PublicClient, SignMessageReturnType, SignTypedDataParameters as ViemSignTypedDataParameters, SignTypedDataReturnType } from 'viem';
import { Connection, PublicKey } from '@solana/web3.js';

export interface FunctionReturn {
    readonly success: boolean;
    readonly data: string;
}

type SignTypedDataParameters = Omit<ViemSignTypedDataParameters, 'account'>;

export interface EvmFunctionOptions {
    readonly getProvider: (chainId: number) => PublicClient;
    readonly sendTransactions: (props: EVM.types.SendTransactionProps) => Promise<EVM.types.TransactionReturn>;
    readonly signMessages?: (messages: Hex[]) => Promise<SignMessageReturnType[]>;
    readonly signTypedDatas?: (args: SignTypedDataParameters[]) => Promise<SignTypedDataReturnType[]>;
}

export interface SolanaFunctionOptions {
    readonly getConnection: () => Connection;
    readonly sendTransactions: (props: Solana.types.SendTransactionProps) => Promise<Solana.types.TransactionReturn>;
    readonly getPublicKey: () => Promise<PublicKey>;
}

export interface FunctionOptions {
    readonly evm: EvmFunctionOptions;
    readonly solana: SolanaFunctionOptions;
    readonly notify: (message: string) => Promise<void>;
}

export interface AdapterExport {
    readonly tools: AiTool[];
    readonly functions: Record<string, (args: any, options: FunctionOptions) => Promise<FunctionReturn>>;
    readonly description: string;
}
