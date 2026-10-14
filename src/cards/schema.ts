import { z } from 'zod';
import { Chain } from '../blockchain';
import {
    AutomationCardData,
    BridgeCardData,
    CardAction,
    CardData,
    CardDraft,
    CardIntent,
    CardToken,
    CardTokenRef,
    ChatCard,
    ClaimCardData,
    Condition,
    DcaPlan,
    GenericCardData,
    LendCardData,
    LiquidityCardData,
    PerpMarginCardData,
    PerpPositionCardData,
    Settlement,
    SwapCardData,
    TokenLaunchCardData,
    TransferCardData,
    TxRef,
    VaultCardData,
    VenueOrderCardData,
    VenueTransferCardData,
} from './types';

/**
 * Card contract: structured facts an adapter function reports about what it did, so a client can render a card
 * instead of parsing the reply text.
 *
 * Layers:
 *  - `CardData`  — the facts a tool knows (one discriminated union, shared by every layer);
 *  - `CardDraft` — what an adapter returns in `FunctionReturn.cards` (`CardData` + button intents + extra tx refs);
 *  - `ChatCard`  — what the chat server stores and sends to clients (`CardData` wrapped in an envelope with id,
 *                  state, wallet, captured transactions and buttons resolved to opaque handles).
 *
 * Fields are only added within a version, and every new field is optional. A breaking change is a new card type
 * or a new `CARD_VERSION`.
 *
 * Every schema exists in two builds: lenient (unknown keys are stripped at every depth; used on the wire and by
 * clients) and strict (unknown keys are rejected at every depth; used by `withCards` in tests so a typo fails
 * loudly). Both builds come from one factory so they cannot drift. The readable contract is in ./types.ts; the
 * parity block at the bottom of this file fails `tsc` if a schema and its interface disagree.
 */
export const CARD_VERSION = 1 as const;

/** Every card type. Types describe the shape of the card, not the protocol: `venue` / `protocol` are fields inside `data`. */
export const CARD_TYPES = [
    'tx.swap',
    'tx.transfer',
    'tx.bridge',
    'tx.lend',
    'vault',
    'tx.liquidity',
    'tx.claim',
    'token.launch',
    'venue.order',
    'perp.position',
    'perp.margin',
    'venue.transfer',
    'automation',
    'generic',
] as const;

/** Off-chain trading venues: centralized exchanges and perp DEXes that have no `Chain` of their own. */
export const VENUES = ['binance', 'bybit', 'kraken', 'mexc', 'okx', 'hyperliquid', 'aster', 'jupiter-perps'] as const;

export const ORDER_STATUSES = ['submitted', 'open', 'pending_trigger', 'partially_filled', 'filled', 'canceled', 'rejected', 'expired'] as const;

/** Card state as the server sets it when the card is written. Later changes arrive as a new card that `supersedes` this one. */
export const CARD_STATES = ['pending', 'complete', 'failed', 'blocked', 'needs_input', 'unknown'] as const;

/** Role of a transaction inside one card: `approve` / `close` are auxiliary, `action` is the operation itself. */
export const TX_ROLES = ['approve', 'action', 'source', 'destination', 'claim', 'close'] as const;

/** Several cards produced by one function call belong together (TP/SL pair, OCO, cancel-all). */
export const CARD_GROUP_KINDS = ['oco', 'pair', 'batch'] as const;

/** Unit of `venue.order.amount`: base asset, quote currency or exchange contracts (see `contractSize`). */
export const AMOUNT_UNITS = ['base', 'quote', 'contracts'] as const;

// ---------------------------------------------------------------------------------------------------------------------
// Primitives shared by both builds
// ---------------------------------------------------------------------------------------------------------------------

/** Non-negative decimal string: digits, optional fraction, no sign, no exponent, no separators. Use `toDecimalString`. */
const unsignedDecimal = z.string().regex(/^\d+(?:\.\d+)?$/, 'unsigned decimal string expected (use toDecimalString)');
/** Signed decimal string for values that can be negative: pnl, deltas, funding rates, condition thresholds. */
const signedDecimal = z.string().regex(/^-?\d+(?:\.\d+)?$/, 'decimal string expected (use toDecimalString)');
const text = (max: number) =>
    z
        .string()
        .min(1)
        .max(max);

/** Links a client may open: http(s) or ipfs only, never `javascript:`, `data:` or custom schemes. Clients must re-check. */
function isHttpUrl(value: string): boolean {
    try {
        const protocol = new URL(value).protocol;
        return protocol === 'http:' || protocol === 'https:' || protocol === 'ipfs:';
    } catch {
        return false;
    }
}
const httpUrl = z
    .string()
    .max(2048)
    .refine(isHttpUrl, { error: 'http(s) or ipfs URL expected' });

/** Function arguments: any plain object, typed as `object` so adapters can pass their own interfaces. */
const plainObject = z.custom<object>(
    v => typeof v === 'object' && v !== null && !Array.isArray(v) && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null),
    { error: 'plain object expected' },
);
const hasIdentity = (t: { symbol?: string; address?: string }) => !!(t.symbol || t.address);

export const chainSchema = z.enum(Chain);
export const venueSchema = z.enum(VENUES);
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export const cardStateSchema = z.enum(CARD_STATES);
export const cardTypeSchema = z.enum(CARD_TYPES);

type Mode = 'lenient' | 'strict';

/** One factory for both builds: every nested object goes through `obj`, so strictness applies at every depth. */
function build(mode: Mode) {
    const obj = <T extends z.ZodRawShape>(shape: T) => (mode === 'strict' ? z.strictObject(shape) : z.object(shape));
    const side = z.enum(['long', 'short']);
    const comparison = z.enum(['lte', 'gte']);
    const id = z.string().max(128);
    const protocol = text(40);

    const tokenShape = {
        /** Human-readable amount, already divided by decimals — unless `decimals` is set, then an integer in base units */
        amount: unsignedDecimal.optional(),
        symbol: text(64).optional(),
        address: text(128).optional(),
        /** Present only when `amount` is in base units and the client must divide */
        decimals: z
            .int()
            .min(0)
            .max(255)
            .optional(),
        /** A quote or a pre-transaction snapshot rather than a fact read from the receipt */
        estimated: z.boolean().optional(),
        /** Display hint: token logo, http(s) or ipfs */
        logoURI: httpUrl.optional(),
        /** Display hint: USD price of one token at the time of the action */
        priceUsd: unsignedDecimal.optional(),
    };
    const token = obj(tokenShape).refine(hasIdentity, { error: 'token needs symbol or address' });
    /** Same as `token` but the amount may be negative (pnl) */
    const signedToken = obj({ ...tokenShape, amount: signedDecimal.optional() }).refine(hasIdentity, { error: 'token needs symbol or address' });
    const tokenRef = obj({ symbol: text(64).optional(), address: text(128).optional() }).refine(hasIdentity, { error: 'token ref needs symbol or address' });

    const txRef = obj({ chain: chainSchema, hash: text(128), url: httpUrl.optional(), role: z.enum(TX_ROLES).optional() });

    /** Asynchronous completion of an on-chain action: a bridge in flight, a withdrawal queue, a staking ticket. */
    const settlement = obj({
        status: z.enum(['pending', 'unconfirmed', 'settled']),
        eta: z
            .string()
            .max(60)
            .optional(),
        /** Ticket / request / bill id the user needs to claim or track */
        receiptId: z
            .string()
            .max(128)
            .optional(),
        claimRequired: z.boolean().optional(),
    });

    const condition = z.discriminatedUnion('kind', [
        /** `at` is unix time in seconds, as `getTimestamp()` returns it */
        obj({
            kind: z.literal('time'),
            at: z
                .int()
                .nonnegative()
                .max(1e11),
        }),
        obj({
            kind: z.literal('price'),
            chain: chainSchema.optional(),
            venue: venueSchema.optional(),
            base: tokenRef,
            quote: z.union([tokenRef, z.literal('USD')]).optional(),
            op: comparison,
            value: unsignedDecimal,
            priceAtCreation: unsignedDecimal.optional(),
        }),
        obj({
            kind: z.literal('liquidationDistance'),
            venue: venueSchema,
            symbol: text(40),
            side,
            distance: unsignedDecimal,
            unit: z.enum(['percent', 'absolute']),
            liquidationPrice: unsignedDecimal.optional(),
        }),
        obj({ kind: z.literal('fundingRate'), venue: venueSchema, comparisonVenue: venueSchema.optional(), market: text(40), op: comparison, value: signedDecimal }),
        obj({ kind: z.literal('gasPrice'), chain: chainSchema, op: z.literal('lte'), gwei: unsignedDecimal }),
        obj({ kind: z.literal('positionPnl'), venue: venueSchema, symbol: text(40), op: comparison, value: signedDecimal, unit: z.enum(['percent', 'absolute']) }),
        obj({
            kind: z.literal('trailingStop'),
            chain: chainSchema,
            base: tokenRef,
            quote: tokenRef.optional(),
            refPrice: unsignedDecimal,
            stopPercent: unsignedDecimal,
            takeProfit: obj({ percent: unsignedDecimal.optional(), price: unsignedDecimal.optional() }).optional(),
            /** Empty for a plain stop-loss */
            steps: z.array(obj({ triggerPercent: unsignedDecimal, newStopPercent: unsignedDecimal })),
        }),
        obj({ kind: z.literal('athAtl'), chain: chainSchema, token: tokenRef, mode: z.enum(['ath', 'atl']) }),
        obj({ kind: z.literal('custom'), text: text(2000), checks: z.array(obj({ functionName: text(100), args: plainObject })) }),
    ]);

    const dcaPlan = obj({
        chain: chainSchema.optional(),
        venue: venueSchema.optional(),
        market: z
            .string()
            .max(40)
            .optional(),
        side: z.enum(['buy', 'sell']).optional(),
        sell: token,
        buy: tokenRef,
        perExecution: token,
        count: z.int().positive(),
        intervalSec: z.int().positive(),
        periodSec: z.int().positive(),
        /** Unix seconds */
        startsAt: z
            .int()
            .nonnegative()
            .max(1e11),
        priceRange: obj({ min: unsignedDecimal.optional(), max: unsignedDecimal.optional() }).optional(),
    });

    const vaultAccount = obj({
        kind: z.literal('vault'),
        address: text(128),
        name: z
            .string()
            .max(120)
            .optional(),
    });

    // ----- CardData member shapes. Drafts are built from the same shapes plus the draft extras. -----

    const shapes = {
        /** Swap, wrap/unwrap, liquid staking, redeem, dust consolidation (`sent` as an array). */
        swap: {
            type: z.literal('tx.swap'),
            protocol,
            chain: chainSchema,
            kind: z.enum(['swap', 'wrap', 'unwrap', 'stake', 'unstake', 'redeem']).optional(),
            sent: z.union([token, z.array(token).min(1)]),
            received: token.optional(),
            /** Inputs that could not be consolidated (dust collector) */
            failed: z.array(token).optional(),
            price: unsignedDecimal.optional(),
            slippage: unsignedDecimal.optional(),
            route: z
                .string()
                .max(200)
                .optional(),
            mode: z.enum(['exactIn', 'exactOut']).optional(),
            settlement: settlement.optional(),
        },
        transfer: {
            type: z.literal('tx.transfer'),
            chain: chainSchema,
            sent: token,
            recipient: text(128),
            /** Whitelist name of the recipient */
            recipientLabel: z
                .string()
                .max(80)
                .optional(),
            allBalance: z.boolean().optional(),
            remaining: token.optional(),
            fee: token.optional(),
        },
        bridge: {
            type: z.literal('tx.bridge'),
            protocol,
            sourceChain: chainSchema,
            destinationChain: chainSchema,
            /** `claim` is the second phase of a two-step bridge; `sent` is usually absent there */
            phase: z.enum(['send', 'claim']).optional(),
            sent: token.optional(),
            received: token.optional(),
            gasOnDestination: token.optional(),
            recipient: z
                .string()
                .max(128)
                .optional(),
            trackingUrl: httpUrl.optional(),
            sourceTxHash: z
                .string()
                .max(128)
                .optional(),
            settlement: settlement.optional(),
        },
        lend: {
            type: z.literal('tx.lend'),
            protocol,
            chain: chainSchema,
            action: z.enum(['supply', 'borrow', 'repay', 'withdraw', 'enable_collateral', 'disable_collateral', 'liquidate']),
            asset: token.optional(),
            /** Several markets toggled in one call (collateral switches) */
            assets: z.array(tokenRef).optional(),
            /** V4 spoke, Morpho COLL/LOAN pair, Venus pool, Kamino market, EVAA pool */
            market: z
                .string()
                .max(120)
                .optional(),
            amountMode: z.enum(['exact', 'max']).optional(),
            rateMode: z.enum(['variable', 'stable']).optional(),
            source: z.enum(['wallet', 'aToken']).optional(),
            role: z.enum(['liquidity', 'collateral']).optional(),
            /** Receipt tokens, or the collateral seized in a liquidation */
            received: token.optional(),
            counterparty: z
                .string()
                .max(128)
                .optional(),
            fee: token.optional(),
            closed: z.boolean().optional(),
            positionAfter: obj({ supplied: unsignedDecimal.optional(), debt: unsignedDecimal.optional(), healthFactor: unsignedDecimal.optional() }).optional(),
        },
        /** Vaults, reward pools, gauges, farms, vote-escrow locks and Hyperliquid vaults. Give `chain` or `venue` so the client can place it. */
        vault: {
            type: z.literal('vault'),
            protocol,
            chain: chainSchema.optional(),
            venue: venueSchema.optional(),
            action: z.enum(['create', 'deposit', 'withdraw', 'stake', 'unstake', 'lock', 'extend', 'distribute', 'close']),
            vaultName: z
                .string()
                .max(120)
                .optional(),
            vaultAddress: z
                .string()
                .max(128)
                .optional(),
            vaultId: id.optional(),
            positionId: id.optional(),
            sent: z.array(token).optional(),
            received: z.array(token).optional(),
            percent: unsignedDecimal.optional(),
            lockUntil: z
                .string()
                .max(60)
                .optional(),
            lockDuration: z
                .string()
                .max(60)
                .optional(),
            totalLocked: token.optional(),
            rewardsClaimed: z.union([z.boolean(), z.array(token)]).optional(),
            fee: token.optional(),
        },
        /** Candidate to fold into `vault` (action add / remove / collect). */
        liquidity: {
            type: z.literal('tx.liquidity'),
            protocol,
            chain: chainSchema,
            action: z.enum(['add', 'remove', 'collect']),
            pool: obj({
                name: z
                    .string()
                    .max(120)
                    .optional(),
                address: z
                    .string()
                    .max(128)
                    .optional(),
                tokens: z.array(z.string().max(64)).optional(),
                feeTier: z
                    .string()
                    .max(20)
                    .optional(),
            }),
            positionId: z.union([id, z.array(id)]).optional(),
            range: obj({ lower: unsignedDecimal, upper: unsignedDecimal, quoteSymbol: text(64), fullRange: z.boolean().optional() }).optional(),
            sent: z.array(token).optional(),
            received: z.array(token).optional(),
            minReceived: z.array(token).optional(),
            priceImpact: unsignedDecimal.optional(),
            percent: unsignedDecimal.optional(),
            closed: z.boolean().optional(),
        },
        /** Candidate to fold into `vault` (action claim). `received` may be empty when the amount is unknown. */
        claim: { type: z.literal('tx.claim'), protocol, chain: chainSchema, source: text(120), sourceId: id.optional(), received: z.array(token) },
        /** Candidate to fold into `generic`. */
        tokenLaunch: {
            type: z.literal('token.launch'),
            protocol,
            chain: chainSchema,
            token: obj({
                name: text(80),
                symbol: text(64),
                address: text(128),
                supply: unsignedDecimal.optional(),
                imageUrl: httpUrl.optional(),
                metadataUri: z
                    .string()
                    .max(500)
                    .optional(),
            }),
            pageUrl: httpUrl,
            poolId: id.optional(),
            initialBuy: obj({ sent: token, received: token.optional() }).optional(),
            /** Requested but not executed: `initialBuyRequested` without `initialBuy` means the buy failed */
            initialBuyRequested: token.optional(),
        },
        /** Any order with its own id on a CEX, perp DEX or on-chain order book, including reduce-only closes and TP/SL legs. */
        venueOrder: {
            type: z.literal('venue.order'),
            venue: venueSchema,
            chain: chainSchema.optional(),
            market: z.enum(['spot', 'margin', 'futures', 'perp', 'delivery']),
            orderId: id.optional(),
            clientOrderId: id.optional(),
            symbol: text(40),
            side: z.enum(['buy', 'sell']),
            positionSide: side.optional(),
            positionEffect: z.enum(['open', 'reduce', 'close']).optional(),
            role: z.enum(['entry', 'take_profit', 'stop_loss']).optional(),
            orderType: z.enum(['market', 'limit', 'trigger', 'trailing_stop', 'twap', 'chase', 'convert']),
            timeInForce: z.enum(['gtc', 'ioc', 'fok', 'post_only']).optional(),
            amount: token,
            /** Default `base`; `contracts` needs `contractSize` to be readable */
            amountUnit: z.enum(AMOUNT_UNITS).optional(),
            contractSize: unsignedDecimal.optional(),
            notional: token.optional(),
            closeEntirePosition: z.boolean().optional(),
            price: unsignedDecimal.optional(),
            triggerPrice: unsignedDecimal.optional(),
            triggerDirection: z.enum(['above', 'below']).optional(),
            takeProfitPrice: unsignedDecimal.optional(),
            stopLossPrice: unsignedDecimal.optional(),
            trailing: obj({
                percent: unsignedDecimal.optional(),
                deltaBips: unsignedDecimal.optional(),
                distance: unsignedDecimal.optional(),
                activationPrice: unsignedDecimal.optional(),
            }).optional(),
            twap: obj({
                sliceSize: unsignedDecimal,
                intervalSec: z.int().positive(),
                priceLimit: unsignedDecimal.optional(),
                priceVariance: unsignedDecimal.optional(),
            }).optional(),
            chase: obj({
                type: z.string().max(40),
                value: z.string().max(40),
                maxType: z
                    .string()
                    .max(40)
                    .optional(),
                maxValue: z
                    .string()
                    .max(40)
                    .optional(),
            }).optional(),
            leverage: unsignedDecimal.optional(),
            marginMode: z.enum(['cross', 'isolated']).optional(),
            collateral: token.optional(),
            liquidationPrice: unsignedDecimal.optional(),
            filled: unsignedDecimal.optional(),
            avgPrice: unsignedDecimal.optional(),
            cost: token.optional(),
            fee: token.optional(),
            /** Always an estimate; may be negative */
            pnl: signedToken.optional(),
            event: z.enum(['created', 'edited', 'cancelled']).optional(),
            /** Order id this one replaces after an edit — `cardPredecessorKey` uses it to link the cards */
            replacesOrderId: id.optional(),
            previousPrice: unsignedDecimal.optional(),
            expiresAt: z
                .string()
                .max(60)
                .optional(),
            status: orderStatusSchema,
        },
        /** An operation on a position that has no order id of its own (position-level TP/SL, close-position endpoints, HL / Jupiter positions). */
        perpPosition: {
            type: z.literal('perp.position'),
            venue: venueSchema,
            chain: chainSchema.optional(),
            symbol: z
                .string()
                .max(40)
                .optional(),
            positionId: id.optional(),
            action: z.enum(['open', 'increase', 'decrease', 'close', 'modify']),
            side,
            size: unsignedDecimal.optional(),
            sizeUsd: unsignedDecimal.optional(),
            sizeDelta: signedDecimal.optional(),
            leverage: unsignedDecimal.optional(),
            entryPrice: unsignedDecimal.optional(),
            fillPrice: unsignedDecimal.optional(),
            liquidationPrice: unsignedDecimal.optional(),
            collateral: token.optional(),
            received: token.optional(),
            pnl: signedToken.optional(),
            fees: token.optional(),
            orderId: id.optional(),
            orderType: z.enum(['market', 'limit']).optional(),
            status: orderStatusSchema.optional(),
            /** `null` means the protection was removed */
            protection: obj({
                takeProfit: unsignedDecimal.nullable().optional(),
                stopLoss: unsignedDecimal.nullable().optional(),
                trailingStop: obj({ distance: unsignedDecimal, distancePercent: unsignedDecimal.optional(), activationPrice: unsignedDecimal.optional() })
                    .nullable()
                    .optional(),
            }).optional(),
            account: vaultAccount.optional(),
        },
        /** Candidate to fold into `perp.position` (action modify). */
        perpMargin: {
            type: z.literal('perp.margin'),
            venue: venueSchema,
            chain: chainSchema.optional(),
            symbol: z
                .string()
                .max(40)
                .optional(),
            positionId: id.optional(),
            side: side.optional(),
            action: z.enum(['add', 'remove']),
            amount: token,
            received: token.optional(),
            marginMode: z.enum(['isolated', 'cross']).optional(),
            leverage: unsignedDecimal.optional(),
            newMargin: unsignedDecimal.optional(),
            liquidationPrice: unsignedDecimal.optional(),
            account: vaultAccount.optional(),
        },
        /** Wallet ↔ venue deposits and withdrawals, and transfers between venue sub-accounts. `asset` is gross, `received` is net of fee. */
        venueTransfer: {
            type: z.literal('venue.transfer'),
            venue: venueSchema,
            direction: z.enum(['deposit', 'withdraw', 'internal']),
            asset: token,
            received: token.optional(),
            fee: token.optional(),
            fromAccount: z
                .string()
                .max(40)
                .optional(),
            toAccount: z
                .string()
                .max(40)
                .optional(),
            chain: chainSchema.optional(),
            /** Venue network code when it is not a `Chain` (ERC20, TRC20, BEP20 …) */
            network: z
                .string()
                .max(40)
                .optional(),
            recipient: z
                .string()
                .max(128)
                .optional(),
            memo: z
                .string()
                .max(128)
                .optional(),
            /** Named withdrawal destination (Kraken key) */
            destinationLabel: z
                .string()
                .max(120)
                .optional(),
            /** withdrawId / tranId / refid / transferId */
            transferId: id.optional(),
            status: z.enum(['submitted', 'pending', 'completed', 'failed', 'canceled']).optional(),
            txHash: z
                .string()
                .max(128)
                .optional(),
        },
        /** Triggers, DCA plans and copy-trading rules. `taskId`, `seriesId` and progress are set by the server, not the tool. */
        automation: {
            type: z.literal('automation'),
            kind: z.enum(['trigger', 'dca', 'copytrade']),
            summary: text(500),
            sources: z.array(z.string().max(60)).optional(),
            condition: condition.optional(),
            /** What the automation will execute when it fires. Not `actions`: that name is the draft-level buttons. */
            plannedActions: z
                .array(
                    obj({
                        protocol,
                        functionName: text(100),
                        args: plainObject,
                        label: z
                            .string()
                            .max(120)
                            .optional(),
                    }),
                )
                .optional(),
            repeat: obj({
                every: text(60),
                stop: text(120),
                note: z
                    .string()
                    .max(200)
                    .optional(),
            }).optional(),
            /** Required when `kind` is `dca` */
            plan: dcaPlan.optional(),
            /** Required when `kind` is `copytrade` */
            copytrade: obj({
                chain: chainSchema,
                target: text(128),
                percent: unsignedDecimal.optional(),
                status: z.enum(['active', 'paused', 'removed']),
                copyTradingEnabled: z.boolean().optional(),
            }).optional(),
        },
        /** Settings changes, deposit addresses and anything without a dedicated shape. Also what a client shows for a card type it does not know. */
        generic: {
            type: z.literal('generic'),
            title: text(120),
            rows: z.array(obj({ label: text(60), value: z.string().max(500), copyable: z.boolean().optional() })).max(200),
            links: z
                .array(obj({ label: text(60), url: httpUrl }))
                .max(20)
                .optional(),
        },
    };

    const intent = z.discriminatedUnion('kind', [
        obj({ kind: z.literal('execute'), label: text(60), protocol, functionName: text(100), args: plainObject, confirm: text(200), danger: z.boolean().optional() }),
        obj({ kind: z.literal('read'), label: text(60), protocol, functionName: text(100), args: plainObject }),
        obj({ kind: z.literal('navigate'), label: text(60), target: text(120) }),
        obj({ kind: z.literal('draft'), label: text(60), text: text(2000) }),
    ]);

    const draftExtras = {
        actions: z
            .array(intent)
            .max(8)
            .optional(),
        /** Hashes the tool sent outside `sendTransactions` (aggregator APIs, zaps, revoke batches) */
        txRefs: z
            .array(txRef)
            .max(200)
            .optional(),
        group: z.enum(CARD_GROUP_KINDS).optional(),
        /** Partial success, warnings */
        notes: z
            .array(z.string().max(300))
            .max(20)
            .optional(),
    };

    const actionId = text(64);
    const action = z.discriminatedUnion('kind', [
        obj({ kind: z.literal('execute'), id: actionId, label: text(60), handle: text(128), confirm: text(200), danger: z.boolean().optional(), expiresAt: z.string().max(60) }),
        obj({ kind: z.literal('read'), id: actionId, label: text(60), read: text(60), params: z.record(z.string(), z.string()) }),
        obj({ kind: z.literal('navigate'), id: actionId, label: text(60), target: text(120) }),
        obj({ kind: z.literal('draft'), id: actionId, label: text(60), text: text(2000) }),
    ]);

    return {
        token,
        signedToken,
        tokenRef,
        txRef,
        settlement,
        condition,
        dcaPlan,
        intent,
        action,
        members: {
            swap: obj(shapes.swap),
            transfer: obj(shapes.transfer),
            bridge: obj(shapes.bridge),
            lend: obj(shapes.lend),
            vault: obj(shapes.vault),
            liquidity: obj(shapes.liquidity),
            claim: obj(shapes.claim),
            tokenLaunch: obj(shapes.tokenLaunch),
            venueOrder: obj(shapes.venueOrder),
            perpPosition: obj(shapes.perpPosition),
            perpMargin: obj(shapes.perpMargin),
            venueTransfer: obj(shapes.venueTransfer),
            automation: obj(shapes.automation),
            generic: obj(shapes.generic),
        },
        drafts: {
            swap: obj({ ...shapes.swap, ...draftExtras }),
            transfer: obj({ ...shapes.transfer, ...draftExtras }),
            bridge: obj({ ...shapes.bridge, ...draftExtras }),
            lend: obj({ ...shapes.lend, ...draftExtras }),
            vault: obj({ ...shapes.vault, ...draftExtras }),
            liquidity: obj({ ...shapes.liquidity, ...draftExtras }),
            claim: obj({ ...shapes.claim, ...draftExtras }),
            tokenLaunch: obj({ ...shapes.tokenLaunch, ...draftExtras }),
            venueOrder: obj({ ...shapes.venueOrder, ...draftExtras }),
            perpPosition: obj({ ...shapes.perpPosition, ...draftExtras }),
            perpMargin: obj({ ...shapes.perpMargin, ...draftExtras }),
            venueTransfer: obj({ ...shapes.venueTransfer, ...draftExtras }),
            automation: obj({ ...shapes.automation, ...draftExtras }),
            generic: obj({ ...shapes.generic, ...draftExtras }),
        },
    };
}

const lenient = build('lenient');
const strict = build('strict');

/** Cross-field rules that cannot live on a union member: an automation's `kind` must come with its payload. */
function automationConsistency(data: { type: string; kind?: string; plan?: unknown; copytrade?: unknown }, ctx: z.RefinementCtx) {
    if (data.type !== 'automation') return;
    if (data.kind === 'dca' && !data.plan) ctx.addIssue({ code: 'custom', path: ['plan'], message: 'dca automation needs a plan' });
    if (data.kind === 'copytrade' && !data.copytrade) ctx.addIssue({ code: 'custom', path: ['copytrade'], message: 'copytrade automation needs copytrade details' });
}

const DRAFT_ONLY_KEYS = ['actions', 'txRefs', 'group', 'notes'] as const;

/**
 * Public schemas carry an explicit `ZodType<T>` annotation: the declaration file then names the interface instead of
 * serializing the inferred zod type (which runs to megabytes for a union of this size). `types.ts` is the readable
 * contract; the parity block below proves the inferred and declared types are identical.
 */
type Schema<T> = z.ZodType<T, unknown>;

// ----- lenient build: wire format, clients -----

export const cardTokenSchema: Schema<CardToken> = lenient.token;
export const signedCardTokenSchema: Schema<CardToken> = lenient.signedToken;
export const cardTokenRefSchema: Schema<CardTokenRef> = lenient.tokenRef;
export const txRefSchema: Schema<TxRef> = lenient.txRef;
export const settlementSchema: Schema<Settlement> = lenient.settlement;
export const conditionSchema: Schema<Condition> = lenient.condition;
export const dcaPlanSchema: Schema<DcaPlan> = lenient.dcaPlan;

export const swapCardSchema: Schema<SwapCardData> = lenient.members.swap;
export const transferCardSchema: Schema<TransferCardData> = lenient.members.transfer;
export const bridgeCardSchema: Schema<BridgeCardData> = lenient.members.bridge;
export const lendCardSchema: Schema<LendCardData> = lenient.members.lend;
export const vaultCardSchema: Schema<VaultCardData> = lenient.members.vault;
export const liquidityCardSchema: Schema<LiquidityCardData> = lenient.members.liquidity;
export const claimCardSchema: Schema<ClaimCardData> = lenient.members.claim;
export const tokenLaunchCardSchema: Schema<TokenLaunchCardData> = lenient.members.tokenLaunch;
export const venueOrderCardSchema: Schema<VenueOrderCardData> = lenient.members.venueOrder;
export const perpPositionCardSchema: Schema<PerpPositionCardData> = lenient.members.perpPosition;
export const perpMarginCardSchema: Schema<PerpMarginCardData> = lenient.members.perpMargin;
export const venueTransferCardSchema: Schema<VenueTransferCardData> = lenient.members.venueTransfer;
export const automationCardSchema: Schema<AutomationCardData> = lenient.members.automation;
export const genericCardSchema: Schema<GenericCardData> = lenient.members.generic;

/** `CardData` on the wire: unknown keys at any depth are stripped. */
export const cardDataSchema: Schema<CardData> = z
    .discriminatedUnion('type', [
        lenient.members.swap,
        lenient.members.transfer,
        lenient.members.bridge,
        lenient.members.lend,
        lenient.members.vault,
        lenient.members.liquidity,
        lenient.members.claim,
        lenient.members.tokenLaunch,
        lenient.members.venueOrder,
        lenient.members.perpPosition,
        lenient.members.perpMargin,
        lenient.members.venueTransfer,
        lenient.members.automation,
        lenient.members.generic,
    ])
    .superRefine(automationConsistency);

export const cardIntentSchema: Schema<CardIntent> = lenient.intent;

/** What an adapter returns. Lenient: unknown keys are stripped. `withCards` uses the strict build in tests. */
export const cardDraftSchema: Schema<CardDraft> = z
    .discriminatedUnion('type', [
        lenient.drafts.swap,
        lenient.drafts.transfer,
        lenient.drafts.bridge,
        lenient.drafts.lend,
        lenient.drafts.vault,
        lenient.drafts.liquidity,
        lenient.drafts.claim,
        lenient.drafts.tokenLaunch,
        lenient.drafts.venueOrder,
        lenient.drafts.perpPosition,
        lenient.drafts.perpMargin,
        lenient.drafts.venueTransfer,
        lenient.drafts.automation,
        lenient.drafts.generic,
    ])
    .superRefine(automationConsistency);

/** Same contract, but an unknown key at ANY depth is an error: a typo in `received.amount` or `actions[0].danger` fails here. */
export const strictCardDraftSchema: Schema<CardDraft> = z
    .discriminatedUnion('type', [
        strict.drafts.swap,
        strict.drafts.transfer,
        strict.drafts.bridge,
        strict.drafts.lend,
        strict.drafts.vault,
        strict.drafts.liquidity,
        strict.drafts.claim,
        strict.drafts.tokenLaunch,
        strict.drafts.venueOrder,
        strict.drafts.perpPosition,
        strict.drafts.perpMargin,
        strict.drafts.venueTransfer,
        strict.drafts.automation,
        strict.drafts.generic,
    ])
    .superRefine(automationConsistency);

export const cardActionSchema: Schema<CardAction> = lenient.action;

/**
 * The envelope the chat server writes and clients read. Cards live inside a turn, so there is no message id here;
 * `id` is the stable reference for `supersedes`, live overlays and action handles. Kept as a plain `ZodObject` so a
 * server can `.extend()` it with its own fields.
 */
export const chatCardObjectSchema = z.object({
    version: z.literal(CARD_VERSION),
    id: text(64),
    type: cardTypeSchema,
    data: cardDataSchema,
    state: cardStateSchema,
    wallet: z
        .string()
        .max(128)
        .optional(),
    /** Captured `sendTransactions` hashes plus the draft's `txRefs` */
    txs: z.array(txRefSchema),
    actions: z.array(cardActionSchema),
    group: z
        .object({
            id: text(64),
            kind: z.enum(CARD_GROUP_KINDS),
            title: z
                .string()
                .max(120)
                .optional(),
        })
        .optional(),
    notes: z.array(z.string().max(300)).optional(),
    /** Id of the card this one replaces */
    supersedes: text(64).optional(),
    taskId: z
        .string()
        .max(128)
        .optional(),
    seriesId: z
        .string()
        .max(128)
        .optional(),
    createdAt: z.string().max(60),
});

/**
 * `chatCardObjectSchema` plus the rules that span fields. The draft-only check runs on the RAW input (before unknown
 * keys are stripped): a raw draft must never be stored as `data`, because its execute intents carry protocol /
 * function / args.
 */
export const chatCardSchema: Schema<ChatCard> = z.preprocess(
    (raw, ctx) => {
        const data = (raw as { data?: unknown } | null)?.data;
        if (data && typeof data === 'object') {
            for (const key of DRAFT_ONLY_KEYS) {
                if (key in data) ctx.addIssue({ code: 'custom', path: ['data', key], message: `draft-only key ${key} is not allowed in data` });
            }
        }
        return raw;
    },
    chatCardObjectSchema.superRefine((card, ctx) => {
        if (card.type !== card.data.type) ctx.addIssue({ code: 'custom', path: ['type'], message: 'type must match data.type' });
    }),
);

/**
 * Tolerant parse for clients: validates cards one by one, so one unknown or malformed card never hides the others.
 * A card with a recognizable envelope but an unknown `type` or `data` (a newer server) degrades to a `generic` card;
 * anything else is dropped.
 */
export function parseChatCards(raw: unknown): ChatCard[] {
    if (!Array.isArray(raw)) return [];
    const out: ChatCard[] = [];
    for (const item of raw) {
        const parsed = chatCardSchema.safeParse(item);
        if (parsed.success) {
            out.push(parsed.data);
            continue;
        }
        const envelope = item as { id?: unknown; createdAt?: unknown; type?: unknown; data?: { type?: unknown } };
        if (typeof envelope?.id !== 'string' || typeof envelope.createdAt !== 'string') continue;
        const typeName = typeof envelope.data?.type === 'string' ? envelope.data.type : typeof envelope.type === 'string' ? envelope.type : 'unknown';
        out.push({
            version: CARD_VERSION,
            id: envelope.id,
            type: 'generic',
            data: { type: 'generic', title: `Unsupported card: ${typeName}`.slice(0, 120), rows: [] },
            state: 'unknown',
            txs: [],
            actions: [],
            createdAt: envelope.createdAt,
        });
    }
    return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// Compile-time parity: the declared interfaces in ./types.ts must be identical to what the schemas infer, in both
// builds. A drift fails `tsc` here instead of surfacing as a wrong declaration file.
// ---------------------------------------------------------------------------------------------------------------------

type Mutual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type L = typeof lenient;
type S = typeof strict;
type LenientDrafts = z.infer<L['drafts'][keyof L['drafts']]>;
type StrictDrafts = z.infer<S['drafts'][keyof S['drafts']]>;

const typeParity: [
    Mutual<z.infer<L['token']>, CardToken>,
    Mutual<z.infer<L['tokenRef']>, CardTokenRef>,
    Mutual<z.infer<L['txRef']>, TxRef>,
    Mutual<z.infer<L['settlement']>, Settlement>,
    Mutual<z.infer<L['condition']>, Condition>,
    Mutual<z.infer<L['dcaPlan']>, DcaPlan>,
    Mutual<z.infer<L['members']['swap']>, SwapCardData>,
    Mutual<z.infer<L['members']['transfer']>, TransferCardData>,
    Mutual<z.infer<L['members']['bridge']>, BridgeCardData>,
    Mutual<z.infer<L['members']['lend']>, LendCardData>,
    Mutual<z.infer<L['members']['vault']>, VaultCardData>,
    Mutual<z.infer<L['members']['liquidity']>, LiquidityCardData>,
    Mutual<z.infer<L['members']['claim']>, ClaimCardData>,
    Mutual<z.infer<L['members']['tokenLaunch']>, TokenLaunchCardData>,
    Mutual<z.infer<L['members']['venueOrder']>, VenueOrderCardData>,
    Mutual<z.infer<L['members']['perpPosition']>, PerpPositionCardData>,
    Mutual<z.infer<L['members']['perpMargin']>, PerpMarginCardData>,
    Mutual<z.infer<L['members']['venueTransfer']>, VenueTransferCardData>,
    Mutual<z.infer<L['members']['automation']>, AutomationCardData>,
    Mutual<z.infer<L['members']['generic']>, GenericCardData>,
    Mutual<z.infer<L['intent']>, CardIntent>,
    Mutual<z.infer<L['action']>, CardAction>,
    Mutual<LenientDrafts, CardDraft>,
    Mutual<StrictDrafts, CardDraft>,
    Mutual<z.infer<typeof chatCardObjectSchema>, ChatCard>,
] = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
void typeParity;
