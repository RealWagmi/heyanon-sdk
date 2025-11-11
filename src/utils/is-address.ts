import { Solana, WalletType } from '../blockchain';
import { Address as TonAddress } from '@ton/ton';
import { isAddress as viemIsAddress } from 'viem';

interface IsAddressResult {
    valid: boolean;
    walletType?: WalletType;
}

export function isAddress(value: string): IsAddressResult {
    let result: IsAddressResult = { valid: false };

    try {
        result.valid = viemIsAddress(value);
        if (result.valid) {
            result.walletType = WalletType.EVM;
        }
    } catch (_error) {}

    try {
        Solana.utils.toPublicKey(value);
        result.valid = true;
        result.walletType = WalletType.SOLANA;
    } catch (_error) {}

    try {
        TonAddress.parse(value);
        result.valid = true;
        result.walletType = WalletType.TON;
    } catch (_error) {}

    return result;
}
