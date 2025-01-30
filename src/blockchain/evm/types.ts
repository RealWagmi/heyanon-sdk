import { Address, Hex } from 'viem';

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
    readonly data: TransactionReturnData[];
}

export interface SendTransactionProps {
    readonly chainId: number;
    readonly account: Address;
    readonly transactions: TransactionParams[];
}
