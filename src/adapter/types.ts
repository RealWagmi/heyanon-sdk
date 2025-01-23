import { AiTool } from '../ai';
import { ChainId, SendTransactionProps, TransactionReturn } from '../blockchain';
import { Hex, PublicClient, SignMessageReturnType, SignTypedDataParameters as ViemSignTypedDataParameters, SignTypedDataReturnType } from 'viem';

export interface FunctionReturn {
    readonly success: boolean;
    readonly data: string;
}

type SignTypedDataParameters = Omit<ViemSignTypedDataParameters, 'account'>;

export interface FunctionOptions {
    readonly getProvider: (chainId: ChainId) => PublicClient;
    readonly sendTransactions: (props: SendTransactionProps) => Promise<TransactionReturn>;
    readonly notify: (message: string) => Promise<any>;
    readonly signMessages?: (messages: Hex[]) => Promise<SignMessageReturnType[]>;
    readonly signTypedDatas?: (args: SignTypedDataParameters[]) => Promise<SignTypedDataReturnType[]>;
}

export interface AdapterExport {
    readonly tools: AiTool[];
    readonly functions: Record<string, (args: any, options: FunctionOptions) => PromiseLike<FunctionReturn>>;
    readonly description: string;
}
