import { PublicKey, TransactionSignature, VersionedTransaction } from '@solana/web3.js';

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
