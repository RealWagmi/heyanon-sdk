import { SenderArguments } from '@ton/core';
import { TonApiClient } from '@ton-api/client';
import { ContractAdapter } from '@ton-api/ton-adapter';
import { Address } from '@ton/ton';

export interface TransactionReturnData {
    readonly message: string;
    readonly hash: string;
}

export interface TransactionReturn {
    readonly data: TransactionReturnData[];
}

export interface SendTransactionProps {
    readonly account: Address;
    readonly transactions: SenderArguments[];
}

export interface Client {
    readonly api: TonApiClient;
    readonly adapter: ContractAdapter;
}