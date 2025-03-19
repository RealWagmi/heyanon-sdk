import { PublicKey, TransactionSignature, VersionedTransaction, Transaction } from '@solana/web3.js';

export interface TransactionReturnData {
    readonly message: string;
    readonly hash: TransactionSignature;
}

export interface TransactionReturn {
    readonly data: TransactionReturnData[];
}

export interface SendTransactionProps {
    readonly account: PublicKey;
    readonly transactions: VersionedTransaction[];
}

export interface SignTransactionProps {
    readonly transaction: VersionedTransaction | Transaction;
    readonly signName?: 'sign' | 'partialSign';
}