import { PublicKey, Transaction, TransactionSignature } from '@solana/web3.js';
import { Address, Hex } from 'viem';

export type Account = Address | PublicKey;

export interface TransactionParams {
    readonly target: Address;
    readonly data: Hex;
    readonly value?: bigint;
    readonly gas?: bigint;
}

export interface TransactionReturnData {
    readonly message: string;
    readonly hash: Hex;
}

export interface TransactionReturn {
    readonly isMultisig: boolean;
    readonly data: TransactionReturnData[] | TransactionSignature;
}

export interface SendTransactionProps {
    readonly chainId: number;
    readonly account: Account;
    readonly transactions: TransactionParams[] | Transaction;
}
