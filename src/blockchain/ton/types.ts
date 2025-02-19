import { SenderArguments } from '@ton/core';
import { TonApiClient } from '@ton-api/client';
import { ContractAdapter } from '@ton-api/ton-adapter';

export interface TransactionReturnData {
    readonly message: string;
    readonly hash: string;
}

export interface TransactionReturn {
    readonly data: TransactionReturnData[];
}

export interface SendTransactionProps {
    readonly account: string;
    readonly transactions: SenderArguments[];
}

export interface Sender {
	hash: string;
	readonly address: string;
	send(args: SenderArguments): Promise<void>;
}

export interface TonClient {
    api: TonApiClient;
    adapter: ContractAdapter;
}
