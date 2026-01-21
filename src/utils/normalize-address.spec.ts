import { describe, it, expect, vi } from 'vitest';
import { normalizeAddress } from './normalize-address';
import { Chain } from '../blockchain';
import { Address as TonAddress } from '@ton/ton';

describe('normalizeAddress', () => {
    describe('validation', () => {
        it('should throw error for invalid address', () => {
            expect(() => normalizeAddress(Chain.ETHEREUM, 'invalid')).toThrow('This is not a address: invalid');
        });
    });

    describe('native address normalization', () => {
        it('should convert native address to WETH9 on Ethereum', () => {
            const result = normalizeAddress(Chain.ETHEREUM, '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE');

            expect(result).toBe('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
        });

        it('should convert native address to WMATIC on Polygon', () => {
            const result = normalizeAddress(Chain.POLYGON, '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE');

            expect(result).toBe('0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270');
        });

        it('should handle native address with different casing', () => {
            const result = normalizeAddress(Chain.ETHEREUM, '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');

            expect(result).toBe('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
        });

        it('should convert native address to wrapped SOL on Solana', () => {
            const result = normalizeAddress(Chain.SOLANA, '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE');

            expect(result).toBe('So11111111111111111111111111111111111111112');
        });

        it('should convert native address to zero address on TON', () => {
            const result = normalizeAddress(Chain.TON, '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE');

            expect(result).toBe('0:0000000000000000000000000000000000000000000000000000000000000000');
        });
    });

    describe('TON address normalization', () => {
        it('should convert TON address to raw string format', () => {
            const mockTonAddress = {
                toRawString: vi.fn().mockReturnValue('0:1234567890abcdef'),
            };
            vi.spyOn(TonAddress, 'parse').mockReturnValue(mockTonAddress as any);

            const result = normalizeAddress(Chain.TON, 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t');

            expect(TonAddress.parse).toHaveBeenCalledWith('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t');
            expect(result).toBe('0:1234567890abcdef');
        });
    });

    describe('regular address normalization', () => {
        it('should return EVM address unchanged', () => {
            const address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
            const result = normalizeAddress(Chain.ETHEREUM, address);

            expect(result).toBe(address);
        });

        it('should return Solana address unchanged', () => {
            const address = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
            const result = normalizeAddress(Chain.SOLANA, address);

            expect(result).toBe(address);
        });
    });
});
