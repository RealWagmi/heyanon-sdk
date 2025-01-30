import { describe, it, expect } from 'vitest';
import { PublicKey, Keypair } from '@solana/web3.js';
import { toPublicKey } from './toPublicKey';

describe('toPublicKey', () => {
    it('should convert a valid public key string to a PublicKey object', () => {
        const validPublicKey = Keypair.generate().publicKey.toString();
        const result = toPublicKey(validPublicKey);
        expect(result).toBeInstanceOf(PublicKey);
        expect(result.toString()).toBe(validPublicKey);
    });

    it('should throw an error for an invalid public key string', () => {
        const invalidPublicKey = 'invalidPublicKey';
        expect(() => toPublicKey(invalidPublicKey)).toThrow(`${invalidPublicKey} is not publickey`);
    });
});
