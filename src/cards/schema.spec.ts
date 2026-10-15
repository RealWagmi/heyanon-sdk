import { Chain } from '../blockchain';
import { CONDITIONS, DRAFTS } from './__fixtures__/drafts';
import {
    automationCardSchema,
    cardActionSchema,
    cardDataSchema,
    cardDraftSchema,
    cardIntentSchema,
    cardObjectSchema,
    cardSchema,
    conditionSchema,
    parseCards,
    CARD_TYPES,
    strictCardDraftSchema,
} from './schema';

const card = {
    id: 'crd_01JA7Q3M8K2V9X4N6P1R5T8W0Y',
    type: 'tx.swap',
    data: DRAFTS['tx.swap'],
    state: 'complete',
    wallets: ['0x4b9d8e1c2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d'],
    txs: [{ chain: Chain.ARBITRUM, hash: '0x7c1e5a9b2f', url: 'https://arbiscan.io/tx/0x7c1e5a9b2f', role: 'action' }],
    actions: [{ kind: 'execute', id: 'cancel', label: 'Cancel', handle: 'v1:kR3mQx9ZtP2aW7Lf', confirm: 'Cancel?', expiresAt: '2026-10-14T12:52:09.004Z' }],
    group: { id: 'grp_1', kind: 'pair' },
};

describe('card data and draft schemas', () => {
    it('has a fixture for every card type', () => {
        expect(Object.keys(DRAFTS).sort()).toEqual([...CARD_TYPES].sort());
    });

    it.each(CARD_TYPES)('accepts a valid %s draft, strictly and leniently', type => {
        const draft = DRAFTS[type];
        expect(strictCardDraftSchema.safeParse(draft).success).toBe(true);
        expect(cardDraftSchema.safeParse(draft).success).toBe(true);
        expect(cardDataSchema.safeParse(draft).success).toBe(true);
    });

    it.each(CARD_TYPES)('rejects a %s draft with a required field removed', type => {
        const draft = (DRAFTS[type] as unknown) as Record<string, unknown>;
        const required = Object.keys(draft).find(key => {
            const { [key]: _removed, ...rest } = draft;
            return key !== 'type' && !cardDataSchema.safeParse(rest).success;
        });
        expect(required).toBeDefined();
    });

    it('rejects an unknown card type and a chain outside the Chain enum', () => {
        expect(cardDataSchema.safeParse({ type: 'tx.unknown', chain: Chain.BASE }).success).toBe(false);
        expect(cardDataSchema.safeParse({ ...DRAFTS['tx.transfer'], chain: 'hypercore' }).success).toBe(false);
    });

    it('requires symbol or address on a token', () => {
        expect(cardDataSchema.safeParse({ ...DRAFTS['tx.transfer'], sent: { amount: '1' } }).success).toBe(false);
        expect(cardDataSchema.safeParse({ ...DRAFTS['tx.transfer'], sent: { amount: '1', address: '0xabc' } }).success).toBe(true);
    });

    it('accepts realistic adapter values: long symbols, tiny amounts, Solana mints, TON addresses', () => {
        expect(cardDataSchema.safeParse({ ...DRAFTS['tx.transfer'], sent: { amount: '0.000000000000000001', symbol: 'ETH/USDT:USDT' } }).success).toBe(true);
        expect(
            cardDataSchema.safeParse({
                ...DRAFTS['tx.transfer'],
                chain: Chain.TON,
                recipient: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t',
                sent: { amount: '1', symbol: 'TON' },
            }).success,
        ).toBe(true);
        expect(cardDataSchema.safeParse({ ...DRAFTS['tx.swap'], received: { amount: '1', symbol: '$ Visit usdc-airdrop.com to claim rewards' } }).success).toBe(true);
    });

    it('rejects formatted, exponent, blank and signed amounts where a quantity is expected', () => {
        for (const amount of ['1,000.5', '1e18', '', '.5', '5.', '-100']) {
            expect(cardDataSchema.safeParse({ ...DRAFTS['tx.transfer'], sent: { amount, symbol: 'USDC' } }).success).toBe(false);
        }
        expect(cardDataSchema.safeParse({ ...DRAFTS['venue.order'], leverage: '-10' }).success).toBe(false);
    });

    it('requires an integer amount when decimals is set', () => {
        expect(cardDataSchema.safeParse({ ...DRAFTS['tx.transfer'], sent: { amount: '1500000', symbol: 'USDC', decimals: 6 } }).success).toBe(true);
        expect(cardDataSchema.safeParse({ ...DRAFTS['tx.transfer'], sent: { amount: '1.5', symbol: 'USDC', decimals: 6 } }).success).toBe(false);
        expect(strictCardDraftSchema.safeParse({ ...DRAFTS['tx.transfer'], sent: { amount: '1.5', symbol: 'USDC', decimals: 6 } }).success).toBe(false);
        expect(cardDataSchema.safeParse({ ...DRAFTS['perp.position'], action: 'close', pnl: { amount: '-1.5', symbol: 'USDC', decimals: 6 } }).success).toBe(false);
    });

    it('allows a signed amount only where a value can be negative', () => {
        expect(cardDataSchema.safeParse({ ...DRAFTS['perp.position'], action: 'close', pnl: { amount: '-12.5', symbol: 'USDC' } }).success).toBe(true);
        expect(cardDataSchema.safeParse({ ...DRAFTS['perp.position'], sizeDelta: '-1' }).success).toBe(true);
        expect(cardDataSchema.safeParse({ ...DRAFTS['perp.position'], size: '-1' }).success).toBe(false);
    });

    it('accepts only http(s) and ipfs links', () => {
        for (const url of ['https://arbiscan.io/tx/0x1', 'http://localhost:3000/x', 'ipfs://bafy123/meta.json', 'https://solscan.io/tx/5VT?cluster=mainnet']) {
            expect(cardDataSchema.safeParse({ ...DRAFTS['tx.bridge'], trackingUrl: url }).success).toBe(true);
        }
        for (const url of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<b>x</b>', 'foo:bar', 'arbiscan.io/tx/0x1']) {
            expect(cardDataSchema.safeParse({ ...DRAFTS['tx.bridge'], trackingUrl: url }).success).toBe(false);
            expect(cardDataSchema.safeParse({ ...DRAFTS.generic, links: [{ label: 'x', url }] }).success).toBe(false);
        }
    });

    it('strict draft rejects unknown keys at any depth while the lenient one strips them', () => {
        const typos = [
            { ...DRAFTS['tx.swap'], recieved: { amount: '1', symbol: 'USDC' } },
            { ...DRAFTS['tx.swap'], received: { amout: '1742.18', symbol: 'USDC' } },
            { ...DRAFTS['venue.order'], actions: [{ ...DRAFTS['venue.order'].actions![0], dangerous: true }] },
            { ...DRAFTS['tx.bridge'], txRefs: [{ chain: Chain.ARBITRUM, hash: '0x1', rol: 'approve' }] },
            { ...DRAFTS['perp.position'], protection: { takeProfitt: '3900' } },
        ];
        for (const typo of typos) {
            expect(strictCardDraftSchema.safeParse(typo).success).toBe(false);
            const lenient = cardDraftSchema.safeParse(typo);
            expect(lenient.success).toBe(true);
        }
        const stripped = cardDraftSchema.safeParse(typos[1]);
        if (stripped.success && stripped.data.type === 'tx.swap') expect(stripped.data.received).toEqual({ symbol: 'USDC' });
    });

    it('ties an automation kind to its payload', () => {
        expect(cardDataSchema.safeParse({ ...DRAFTS.automation, plan: undefined }).success).toBe(false);
        expect(cardDataSchema.safeParse({ type: 'automation', kind: 'copytrade', summary: 'Copy 0xabc' }).success).toBe(false);
        expect(
            cardDataSchema.safeParse({ type: 'automation', kind: 'copytrade', summary: 'Copy 0xabc', copytrade: { chain: Chain.BASE, target: '0xabc', status: 'active' } }).success,
        ).toBe(true);
        expect(cardDataSchema.safeParse({ type: 'automation', kind: 'trigger', summary: 'Custom check' }).success).toBe(true);
        expect(strictCardDraftSchema.safeParse({ ...DRAFTS.automation, plan: undefined }).success).toBe(false);
        expect(automationCardSchema.safeParse({ ...DRAFTS.automation, plan: undefined }).success).toBe(false);
        expect(automationCardSchema.safeParse(DRAFTS.automation).success).toBe(true);
    });

    it.each(Object.keys(CONDITIONS) as (keyof typeof CONDITIONS)[])('accepts a %s condition and rejects it without its discriminator', kind => {
        expect(conditionSchema.safeParse(CONDITIONS[kind]).success).toBe(true);
        const { kind: _kind, ...rest } = CONDITIONS[kind];
        expect(conditionSchema.safeParse(rest).success).toBe(false);
    });

    it('keeps time conditions in unix seconds', () => {
        expect(conditionSchema.safeParse({ kind: 'time', at: Date.now() }).success).toBe(false);
        expect(conditionSchema.safeParse({ kind: 'time', at: Math.floor(Date.now() / 1000) }).success).toBe(true);
    });

    it('accepts venue order amounts in contracts with a contract size', () => {
        expect(
            cardDataSchema.safeParse({ ...DRAFTS['venue.order'], venue: 'okx', amount: { amount: '5', symbol: 'BTC' }, amountUnit: 'contracts', contractSize: '0.01' }).success,
        ).toBe(true);
        expect(cardDataSchema.safeParse({ ...DRAFTS['venue.order'], amountUnit: 'lots' }).success).toBe(false);
    });

    it('types function arguments as plain objects', () => {
        expect(cardIntentSchema.safeParse({ kind: 'read', label: 'Check', protocol: 'okx', functionName: 'getOrder', args: ['x'] }).success).toBe(false);
        expect(cardIntentSchema.safeParse({ kind: 'read', label: 'Check', protocol: 'okx', functionName: 'getOrder', args: { orderId: '1' } }).success).toBe(true);
    });

    it('validates button intents and actions by kind', () => {
        expect(cardIntentSchema.safeParse({ kind: 'navigate', label: 'Open positions', target: 'portfolio/positions' }).success).toBe(true);
        expect(cardIntentSchema.safeParse({ kind: 'execute', label: 'Cancel', protocol: 'okx', functionName: 'cancelOrder', args: {} }).success).toBe(false); // confirm missing
        expect(cardIntentSchema.safeParse({ kind: 'teleport', label: 'x' }).success).toBe(false);
        expect(cardActionSchema.safeParse({ kind: 'read', id: 'r', label: 'Check order', read: 'cex_order', params: { orderId: '1' } }).success).toBe(true);
        expect(cardActionSchema.safeParse({ kind: 'navigate', id: 'n', label: 'Open', target: 'home' }).success).toBe(true);
        expect(cardActionSchema.safeParse({ kind: 'draft', id: 'd', label: 'Retry', text: 'Retry the swap with 1% slippage' }).success).toBe(true);
        expect(cardActionSchema.safeParse({ kind: 'execute', id: 'e', label: 'Cancel', confirm: 'Cancel?', expiresAt: 'x' }).success).toBe(false); // handle missing
    });

    it('caps the number of intents on a draft', () => {
        const intent = { kind: 'navigate' as const, label: 'Open', target: 'home' };
        expect(cardDraftSchema.safeParse({ ...DRAFTS.generic, actions: Array(9).fill(intent) }).success).toBe(false);
    });
});

describe('card envelope', () => {
    it('accepts a card and requires type to match data.type', () => {
        expect(cardSchema.safeParse(card).success).toBe(true);
        expect(cardSchema.safeParse({ ...card, type: 'tx.bridge' }).success).toBe(false);
        expect(cardSchema.safeParse({ ...card, group: { id: 'g', kind: 'oco' } }).success).toBe(true);
        expect(cardSchema.safeParse({ ...card, group: { id: 'g', kind: 'tuple' } }).success).toBe(false);
    });

    it('strips the removed envelope fields like any other unknown key', () => {
        const legacy = { ...card, version: 1, supersedes: 'crd_old', seriesId: 'series_1', createdAt: '2026-10-13T12:52:09.004Z' };
        const parsed = cardSchema.safeParse(legacy);
        expect(parsed.success).toBe(true);
        for (const key of ['version', 'supersedes', 'seriesId', 'createdAt']) expect(parsed.data).not.toHaveProperty(key);
    });

    it('never accepts a raw draft as data, so execute intents cannot leak to clients', () => {
        const withDraftExtras = { ...card, type: 'venue.order', data: DRAFTS['venue.order'] };
        expect(cardSchema.safeParse(withDraftExtras).success).toBe(false);
        const { actions: _intents, ...data } = DRAFTS['venue.order'];
        expect(cardSchema.safeParse({ ...card, type: 'venue.order', data }).success).toBe(true);
    });

    it('rejects an execute action without a handle', () => {
        const leaked = { kind: 'execute', id: 'cancel', label: 'Cancel', protocol: 'okx', functionName: 'cancelOrder', args: {}, confirm: 'Cancel?', expiresAt: 'x' };
        expect(cardSchema.safeParse({ ...card, actions: [leaked] }).success).toBe(false);
    });

    it('marks a used execute action with an optional done flag', () => {
        const [execute] = card.actions;
        expect(cardActionSchema.safeParse(execute).success).toBe(true);
        expect(cardActionSchema.safeParse({ ...execute, done: true }).success).toBe(true);
        expect(cardActionSchema.safeParse({ ...execute, done: 'yes' }).success).toBe(false);
        const parsed = cardSchema.safeParse({ ...card, actions: [{ ...execute, done: true }] });
        expect(parsed.data?.actions[0]).toMatchObject({ kind: 'execute', handle: execute.handle, done: true });
    });

    it('exposes the plain object schema so servers can extend the envelope', () => {
        const extended = cardObjectSchema.extend({ turnId: cardObjectSchema.shape.id });
        expect(extended.safeParse({ ...card, turnId: 'turn_1' }).success).toBe(true);
    });

    it('parseCards keeps valid cards, degrades unknown types to generic and drops garbage', () => {
        const newer = { ...card, id: 'crd_new', type: 'tx.options', data: { type: 'tx.options', strike: '3000' } };
        const parsed = parseCards([card, newer, { nope: true }, 'x', null]);
        expect(parsed.map(c => c.id)).toEqual([card.id, 'crd_new']);
        expect(parsed[1]).toMatchObject({ type: 'generic', state: 'complete', data: { type: 'generic', title: 'Unsupported card: tx.options' } });
        expect(parseCards(undefined)).toEqual([]);
    });

    it('parseCards drops an entry without a valid id or a data object', () => {
        const { id: _id, ...withoutId } = card;
        const unknownType = { ...card, type: 'tx.options' };
        expect(parseCards([withoutId, { ...card, id: 42 }, { ...unknownType, data: undefined }, { ...unknownType, data: 'x' }, { ...unknownType, data: [] }])).toEqual([]);
        const tooLong = 'x'.repeat(65);
        expect(
            parseCards([
                { ...unknownType, id: tooLong },
                { ...card, id: tooLong },
                { ...unknownType, id: '' },
            ]),
        ).toEqual([]);
        expect(parseCards([{ ...unknownType, id: 'x'.repeat(64) }]).map(c => c.type)).toEqual(['generic']);
    });

    it('parseCards keeps the envelope fields of a degraded card that still validate', () => {
        const newer = { ...card, id: 'crd_new', type: 'tx.options', data: { type: 'tx.options', strike: '3000' }, notes: ['Partial fill'], taskId: 'task_1' };
        const generic = { type: 'generic', title: 'Unsupported card: tx.options', rows: [] };
        expect(parseCards([newer])).toEqual([{ ...newer, type: 'generic', data: generic }]);

        const [degraded] = parseCards([{ ...newer, state: 'exploded', wallets: [7, '0xabc'], txs: 'x', actions: [{ kind: 'teleport' }, card.actions[0]], group: { id: 'g', kind: 'tuple' } }]);
        expect(degraded).toEqual({
            id: 'crd_new',
            type: 'generic',
            data: generic,
            state: 'unknown',
            wallets: ['0xabc'],
            txs: [],
            actions: [card.actions[0]],
            notes: ['Partial fill'],
            taskId: 'task_1',
        });
        expect(degraded).not.toHaveProperty('group');
        expect(cardSchema.safeParse(degraded).success).toBe(true);
    });
});

describe('token display hints', () => {
    it('accepts optional logoURI and priceUsd', () => {
        const sent = { amount: '0.5', symbol: 'ETH', logoURI: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', priceUsd: '3484.37' };
        expect(cardDataSchema.safeParse({ ...DRAFTS['tx.swap'], sent }).success).toBe(true);
        expect(cardDataSchema.safeParse({ ...DRAFTS['tx.swap'], sent: { ...sent, logoURI: 'ipfs://bafy/eth.png' } }).success).toBe(true);
    });

    it('validates them like every other link and amount', () => {
        expect(cardDataSchema.safeParse({ ...DRAFTS['tx.swap'], sent: { amount: '0.5', symbol: 'ETH', logoURI: 'javascript:alert(1)' } }).success).toBe(false);
        expect(cardDataSchema.safeParse({ ...DRAFTS['tx.swap'], sent: { amount: '0.5', symbol: 'ETH', priceUsd: '-1' } }).success).toBe(false);
        expect(cardDataSchema.safeParse({ ...DRAFTS['tx.swap'], sent: { amount: '0.5', symbol: 'ETH', priceUsd: '3,484' } }).success).toBe(false);
    });
});
