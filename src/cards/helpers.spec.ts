import { Chain } from '../blockchain';
import { cardChain, cardDecimal, cardToken, presentCards, txRef } from './helpers';
import { strictCardDraftSchema } from './schema';

const usdc = {
    chain: 'base',
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
    logoURI: 'https://assets.coingecko.com/usdc.png',
    priceUsd: 0.9998,
};

describe('card helpers', () => {
    it('cardDecimal tolerates bad input and scales base units', () => {
        expect(cardDecimal('1e-7')).toBe('0.0000001');
        expect(cardDecimal(1742183412n, 6)).toBe('1742.183412');
        expect(cardDecimal(3484.37)).toBe('3484.37');
        expect(cardDecimal(undefined)).toBeUndefined();
        expect(cardDecimal(null)).toBeUndefined();
        expect(cardDecimal('')).toBeUndefined();
        expect(cardDecimal('abc')).toBeUndefined();
        expect(cardDecimal('1,000')).toBeUndefined();
    });

    it('cardChain accepts only Chain enum values', () => {
        expect(cardChain('base')).toBe(Chain.BASE);
        expect(cardChain('hypercore')).toBeUndefined();
        expect(cardChain(undefined)).toBeUndefined();
    });

    it('cardToken needs an identity and trims symbols', () => {
        expect(cardToken(undefined, '1')).toBeUndefined();
        expect(cardToken({ symbol: ' ', address: '' }, '1')).toBeUndefined();
        expect(cardToken({ symbol: 'X'.repeat(80) }, '1')?.symbol).toHaveLength(64);
        expect(cardToken({ address: '0xabc' }, '1')).toEqual({ amount: '1', symbol: undefined, address: '0xabc', logoURI: undefined, priceUsd: undefined });
    });

    it('cardToken carries logo and price hints and scales raw amounts by decimals', () => {
        expect(cardToken(usdc, undefined, 1741900000n)).toEqual({ amount: '1741.9', symbol: 'USDC', address: usdc.address, logoURI: usdc.logoURI, priceUsd: '0.9998' });
        expect(cardToken(usdc, undefined, '1741900000')?.amount).toBe('1741.9');
        expect(cardToken(usdc, '12.5')?.amount).toBe('12.5');
        expect(cardToken({ ...usdc, logoURI: 'javascript:alert(1)' }, '1')?.logoURI).toBeUndefined();
        expect(cardToken({ ...usdc, priceUsd: -1 }, '1')?.priceUsd).toBeUndefined();
        expect(cardToken({ ...usdc, priceUsd: '0.99' }, '1')?.priceUsd).toBe('0.99');
        expect(cardToken({ symbol: 'ETH' }, '1', '1000')?.amount).toBe('1'); // no decimals → raw amount ignored, human amount kept
    });

    it('cardToken output passes the strict token schema inside a draft', () => {
        const draft = { type: 'tx.transfer', chain: Chain.BASE, sent: cardToken(usdc, undefined, 1741900000n), recipient: '0xabc' };
        expect(strictCardDraftSchema.safeParse(draft).success).toBe(true);
    });

    it('txRef keeps only http(s) urls and defaults the role to action', () => {
        expect(txRef(Chain.BASE, '0xabc')).toEqual({ chain: Chain.BASE, hash: '0xabc', role: 'action', url: undefined });
        expect(txRef(Chain.BASE, '0xabc', 'source', 'https://basescan.org/tx/0xabc').url).toBe('https://basescan.org/tx/0xabc');
        expect(txRef(Chain.BASE, '0xabc', 'source', 'javascript:x').url).toBeUndefined();
    });

    it('presentCards drops missing cards', () => {
        const card = { type: 'generic' as const, title: 'x', rows: [] };
        expect(presentCards(undefined, card, null)).toEqual([card]);
        expect(presentCards()).toEqual([]);
    });
});
