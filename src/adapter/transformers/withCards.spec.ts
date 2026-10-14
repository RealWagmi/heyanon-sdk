import { vi } from 'vitest';
import { Chain } from '../../blockchain';
import { toResult } from './toResult';
import { getCardValidationMode, setCardValidationMode, withCards, withCardsStrict } from './withCards';

const swap = {
    type: 'tx.swap' as const,
    protocol: '1inch',
    chain: Chain.ARBITRUM,
    sent: { amount: '0.5', symbol: 'ETH' },
    received: { amount: '1742.18', symbol: 'USDC' },
};

describe('withCards', () => {
    afterEach(() => setCardValidationMode('strict'));

    it('detects the test environment and defaults to strict', () => {
        expect(getCardValidationMode()).toBe('strict');
    });

    it('attaches validated cards and leaves success and data untouched', () => {
        const result = withCards(toResult('Swapped 0.5 ETH for 1742.18 USDC'), swap);
        expect(result.success).toBe(true);
        expect(result.data).toBe('Swapped 0.5 ETH for 1742.18 USDC');
        expect(result.cards).toEqual([swap]);
    });

    it('appends to cards already present', () => {
        const first = withCards(toResult('ok'), swap);
        const second = withCards(first, { ...swap, chain: Chain.BASE });
        expect(second.cards).toHaveLength(2);
        expect(second.cards?.[1].type).toBe('tx.swap');
    });

    it('keeps cards on a failed result when a transaction already happened', () => {
        const result = withCards(toResult('Receipt not confirmed in time', true), { ...swap, txRefs: [{ chain: Chain.ARBITRUM, hash: '0xabc' }] });
        expect(result.success).toBe(false);
        expect(result.cards?.[0]).toMatchObject({ txRefs: [{ chain: Chain.ARBITRUM, hash: '0xabc' }] });
    });

    it('in strict mode throws a readable error for an invalid draft, at any depth', () => {
        expect(() => withCards(toResult('ok'), { ...swap, sent: { amount: 'half' } } as any)).toThrow(/Invalid card draft #0 \(tx\.swap\): sent/);
        expect(() => withCards(toResult('ok'), { ...swap, recieved: swap.received } as any)).toThrow(/Unrecognized key/);
        expect(() => withCards(toResult('ok'), { ...swap, received: { amout: '1', symbol: 'USDC' } } as any)).toThrow(/received.*Unrecognized key/);
        expect(() => withCards(toResult('ok'), { type: 'nope' } as any)).toThrow(/Invalid card draft #0 \(nope\)/);
    });

    it('in lenient mode drops the invalid card with a warning and never throws', () => {
        setCardValidationMode('lenient');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const result = withCards(toResult('Swapped'), { ...swap, price: '1.2e-9' } as any, swap);
        expect(result).toEqual({ success: true, data: 'Swapped', cards: [swap] });
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toMatch(/Invalid card draft #0 \(tx\.swap\): price.*card dropped/);
        warn.mockRestore();
    });

    it('in lenient mode strips unknown keys instead of rejecting them', () => {
        setCardValidationMode('lenient');
        const result = withCards(toResult('ok'), { ...swap, recieved: swap.received } as any);
        expect(result.cards).toEqual([swap]);
    });

    it('withCardsStrict throws even in lenient mode', () => {
        setCardValidationMode('lenient');
        expect(() => withCardsStrict(toResult('ok'), { ...swap, sent: { amount: 'half' } } as any)).toThrow(/Invalid card draft/);
    });

    it('returns a plain result when called without cards', () => {
        expect(withCards(toResult('ok'))).toEqual({ success: true, data: 'ok', cards: [] });
    });
});
