import { Chain } from '../blockchain';
import { DRAFTS } from './__fixtures__/drafts';
import { cardKey, cardPredecessorKey } from './key';

describe('cardKey', () => {
    it('keys venue orders by venue, market, symbol and order id', () => {
        expect(cardKey(DRAFTS['venue.order'])).toBe('order:binance:futures:BTC/USDT:123456');
        expect(cardKey({ ...DRAFTS['venue.order'], orderId: undefined })).toBeUndefined();
    });

    it('keys venue transfers by transfer id', () => {
        expect(cardKey(DRAFTS['venue.transfer'])).toBe('transfer:okx:w-778899');
    });

    it('keys positions by position id, else by symbol and side, and margin changes share the position key', () => {
        expect(cardKey(DRAFTS['perp.position'])).toBe('position:hyperliquid:ETH:long');
        expect(cardKey({ ...DRAFTS['perp.position'], positionId: 'pos-1' })).toBe('position:hyperliquid:pos-1');
        expect(cardKey({ ...DRAFTS['perp.margin'], side: 'long' })).toBe('position:bybit:ETH/USDT:USDT:long');
        expect(cardKey(DRAFTS['perp.margin'])).toBeUndefined(); // no side, no position id
    });

    it('separates a vault position from the personal one on the same market', () => {
        const personal = cardKey(DRAFTS['perp.position']);
        const vault = cardKey({ ...DRAFTS['perp.position'], account: { kind: 'vault', address: '0xABCDEF' } });
        expect(vault).toBe('position:hyperliquid:vault:0xabcdef:ETH:long');
        expect(vault).not.toBe(personal);
    });

    it('keys bridges by the source hash, preferring the source tx over approvals and destinations', () => {
        expect(cardKey({ ...DRAFTS['tx.bridge'], sourceTxHash: '0xABC' })).toBe('bridge:arbitrum:0xabc');
        const captured = [
            { chain: Chain.ARBITRUM, hash: '0xAPPROVE', role: 'approve' as const },
            { chain: Chain.ARBITRUM, hash: '0xSEND', role: 'source' as const },
            { chain: Chain.BASE, hash: '0xDEST', role: 'destination' as const },
        ];
        expect(cardKey(DRAFTS['tx.bridge'], captured)).toBe('bridge:arbitrum:0xsend');
        expect(cardKey(DRAFTS['tx.bridge'], [captured[0], { chain: Chain.ARBITRUM, hash: '0xACT', role: 'action' }])).toBe('bridge:arbitrum:0xact');
        expect(cardKey(DRAFTS['tx.bridge'], [captured[0]])).toBe('bridge:arbitrum:0xapprove');
        expect(cardKey(DRAFTS['tx.bridge'])).toBeUndefined();
    });

    it('keys on-chain cards by the action transaction, skipping approvals', () => {
        const txs = [
            { chain: Chain.BASE, hash: '0xAPPROVE', role: 'approve' as const },
            { chain: Chain.BASE, hash: '0xACTION', role: 'action' as const },
        ];
        expect(cardKey(DRAFTS['tx.lend'], txs)).toBe('tx:base:0xaction');
        expect(cardKey(DRAFTS['tx.lend'], [txs[0], { chain: Chain.BASE, hash: '0xCLAIM', role: 'claim' }])).toBe('tx:base:0xclaim');
        expect(cardKey(DRAFTS['tx.lend'], [txs[0]])).toBe('tx:base:0xapprove'); // nothing better than the approval
        expect(cardKey(DRAFTS['tx.lend'])).toBeUndefined();
    });

    it('keeps Solana signatures case-sensitive', () => {
        expect(cardKey(DRAFTS['tx.swap'], [{ chain: Chain.SOLANA, hash: '5VTxAbC' }])).toBe('tx:solana:5VTxAbC');
    });

    it('keys launches by token address and copy-trading rules by chain and target', () => {
        expect(cardKey(DRAFTS['token.launch'])).toBe('launch:solana:So11111111111111111111111111111111111111112');
        const rule = { type: 'automation' as const, kind: 'copytrade' as const, summary: 'Copy', copytrade: { chain: Chain.BASE, target: '0xTarget', status: 'active' as const } };
        expect(cardKey(rule)).toBe('copytrade:base:0xtarget');
        expect(cardKey({ ...rule, copytrade: { ...rule.copytrade, status: 'paused' } })).toBe(cardKey(rule));
    });

    it('leaves task-based automations and generic cards unkeyed', () => {
        expect(cardKey(DRAFTS.automation)).toBeUndefined();
        expect(cardKey(DRAFTS.generic, [{ chain: Chain.BASE, hash: '0x1' }])).toBeUndefined();
    });
});

describe('cardPredecessorKey', () => {
    it('links an edited order to the order it replaces', () => {
        const edited = { ...DRAFTS['venue.order'], orderId: '2', replacesOrderId: '1', event: 'edited' as const };
        expect(cardPredecessorKey(edited)).toBe('order:binance:futures:BTC/USDT:1');
        expect(cardKey(edited)).toBe('order:binance:futures:BTC/USDT:2');
    });

    it('falls back to cardKey for everything else', () => {
        expect(cardPredecessorKey(DRAFTS['venue.order'])).toBe(cardKey(DRAFTS['venue.order']));
        expect(cardPredecessorKey(DRAFTS['tx.lend'], [{ chain: Chain.BASE, hash: '0xA', role: 'action' }])).toBe('tx:base:0xa');
    });
});
