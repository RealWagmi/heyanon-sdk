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

export enum WalletType {
    V3R2 = 'v3r2',
    V4 = 'v4',
    V5R1 = 'v5r1',
} 