import { describe, it, expect } from 'vitest';
import { isAddress } from './is-address';
import { WalletType } from '../blockchain';

describe('isAddress', () => {
    it('should return valid false for invalid address', () => {
        const result = isAddress('invalid-address');
        expect(result.valid).toBe(false);
        expect(result.walletType).toBeUndefined();
    });

    it('should return valid false for empty string', () => {
        const result = isAddress('');
        expect(result.valid).toBe(false);
        expect(result.walletType).toBeUndefined();
    });

    it('should detect valid EVM address', () => {
        const evmAddress = '0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36';
        const result = isAddress(evmAddress);
        expect(result.valid).toBe(true);
        expect(result.walletType).toBe(WalletType.EVM);
    });

    it('should detect valid Solana address', () => {
        const solanaAddress = 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK';
        const result = isAddress(solanaAddress);
        expect(result.valid).toBe(true);
        expect(result.walletType).toBe(WalletType.SOLANA);
    });

    it('should detect valid TON address', () => {
        const tonAddress = 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2';
        const result = isAddress(tonAddress);
        expect(result.valid).toBe(true);
        expect(result.walletType).toBe(WalletType.TON);
    });

    it('should detect valid TON address', () => {
        const tonAddress = '0:1a689676d73e06cd480731f13cdd517cc40df6fb9b2ce9ec92d4e592bb4df484';
        const result = isAddress(tonAddress);
        expect(result.valid).toBe(true);
        expect(result.walletType).toBe(WalletType.TON);
    });

    it('should detect valid TON address', () => {
        const tonAddress = 'UQCOtqcrEmnzyny5Tm08Jp9kQzWU0Bk_IUb4YfP6Ya28UT8O';
        const result = isAddress(tonAddress);
        expect(result.valid).toBe(true);
        expect(result.walletType).toBe(WalletType.TON);
    });
});
