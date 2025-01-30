import { PublicKey } from '@solana/web3.js';

export function toPublicKey(publicKey: string): PublicKey {
    try {
        const result = new PublicKey(publicKey);
        return result;
    } catch (error) {
        throw new Error(`${publicKey} is not publickey`);
    }
}
