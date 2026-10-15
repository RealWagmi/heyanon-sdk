import { Chain } from '../blockchain';
import { AMOUNT_UNITS, CARD_GROUP_KINDS, CARD_STATES, CARD_TYPES, ORDER_STATUSES, TX_ROLES, VENUES } from './schema';

/*
 * The readable card contract. Every schema in ./schema.ts is annotated with one of these types, and a compile-time
 * parity check at the bottom of schema.ts fails the build if an interface and the schema that implements it drift.
 */

export type CardType = typeof CARD_TYPES[number];
export type Venue = typeof VENUES[number];
export type OrderStatus = typeof ORDER_STATUSES[number];
export type CardState = typeof CARD_STATES[number];
export type TxRole = typeof TX_ROLES[number];
export type CardGroupKind = typeof CARD_GROUP_KINDS[number];
export type AmountUnit = typeof AMOUNT_UNITS[number];
export type PositionSide = 'long' | 'short';
export type Comparison = 'lte' | 'gte';

/** A token amount as the user reads it. */
export interface CardToken {
    /** Decimal string (see `toDecimalString`); when `decimals` is set, an integer in base units instead. May be absent. */
    amount?: string;
    /** At least one of `symbol` / `address` is required */
    symbol?: string;
    address?: string;
    /** Present only when `amount` is in base units and the client must divide */
    decimals?: number;
    /** A quote or a pre-transaction snapshot rather than a fact read from the receipt */
    estimated?: boolean;
    /** Display hint: token logo, http(s) or ipfs */
    logoURI?: string;
    /** Display hint: USD price of one token at the time of the action, decimal string */
    priceUsd?: string;
}

export interface CardTokenRef {
    symbol?: string;
    address?: string;
}

export interface TxRef {
    chain: Chain;
    hash: string;
    url?: string;
    role?: TxRole;
}

/** Asynchronous completion of an on-chain action: a bridge in flight, a withdrawal queue, a staking ticket. */
export interface Settlement {
    status: 'pending' | 'unconfirmed' | 'settled';
    eta?: string;
    /** Ticket / request / bill id the user needs to claim or track */
    receiptId?: string;
    claimRequired?: boolean;
}

export type Condition =
    /** `at` is unix time in seconds */
    | { kind: 'time'; at: number }
    | { kind: 'price'; chain?: Chain; venue?: Venue; base: CardTokenRef; quote?: CardTokenRef | 'USD'; op: Comparison; value: string; priceAtCreation?: string }
    | { kind: 'liquidationDistance'; venue: Venue; symbol: string; side: PositionSide; distance: string; unit: 'percent' | 'absolute'; liquidationPrice?: string }
    | { kind: 'fundingRate'; venue: Venue; comparisonVenue?: Venue; market: string; op: Comparison; value: string }
    | { kind: 'gasPrice'; chain: Chain; op: 'lte'; gwei: string }
    | { kind: 'positionPnl'; venue: Venue; symbol: string; op: Comparison; value: string; unit: 'percent' | 'absolute' }
    | {
          kind: 'trailingStop';
          chain: Chain;
          base: CardTokenRef;
          quote?: CardTokenRef;
          refPrice: string;
          stopPercent: string;
          takeProfit?: { percent?: string; price?: string };
          /** Empty for a plain stop-loss */
          steps: { triggerPercent: string; newStopPercent: string }[];
      }
    | { kind: 'athAtl'; chain: Chain; token: CardTokenRef; mode: 'ath' | 'atl' }
    | { kind: 'custom'; text: string; checks: { functionName: string; args: object }[] };

export interface DcaPlan {
    chain?: Chain;
    venue?: Venue;
    market?: string;
    side?: 'buy' | 'sell';
    sell: CardToken;
    buy: CardTokenRef;
    perExecution: CardToken;
    count: number;
    intervalSec: number;
    periodSec: number;
    /** Unix seconds */
    startsAt: number;
    priceRange?: { min?: string; max?: string };
}

export interface VaultAccount {
    kind: 'vault';
    address: string;
    name?: string;
}

// ---------------------------------------------------------------------------------------------------------------------
// CardData members
// ---------------------------------------------------------------------------------------------------------------------

/** Swap, wrap/unwrap, liquid staking, redeem, dust consolidation (`sent` as an array). */
export interface SwapCardData {
    type: 'tx.swap';
    protocol: string;
    chain: Chain;
    kind?: 'swap' | 'wrap' | 'unwrap' | 'stake' | 'unstake' | 'redeem';
    sent: CardToken | CardToken[];
    received?: CardToken;
    /** Inputs that could not be consolidated (dust collector) */
    failed?: CardToken[];
    price?: string;
    slippage?: string;
    route?: string;
    mode?: 'exactIn' | 'exactOut';
    settlement?: Settlement;
}

export interface TransferCardData {
    type: 'tx.transfer';
    chain: Chain;
    sent: CardToken;
    recipient: string;
    /** Whitelist name of the recipient */
    recipientLabel?: string;
    allBalance?: boolean;
    remaining?: CardToken;
    fee?: CardToken;
}

export interface BridgeCardData {
    type: 'tx.bridge';
    protocol: string;
    sourceChain: Chain;
    destinationChain: Chain;
    /** `claim` is the second phase of a two-step bridge; `sent` is usually absent there */
    phase?: 'send' | 'claim';
    sent?: CardToken;
    received?: CardToken;
    gasOnDestination?: CardToken;
    recipient?: string;
    trackingUrl?: string;
    sourceTxHash?: string;
    settlement?: Settlement;
}

export type LendAction = 'supply' | 'borrow' | 'repay' | 'withdraw' | 'enable_collateral' | 'disable_collateral' | 'liquidate';

export interface LendCardData {
    type: 'tx.lend';
    protocol: string;
    chain: Chain;
    action: LendAction;
    asset?: CardToken;
    /** Several markets toggled in one call (collateral switches) */
    assets?: CardTokenRef[];
    /** V4 spoke, Morpho COLL/LOAN pair, Venus pool, Kamino market, EVAA pool */
    market?: string;
    amountMode?: 'exact' | 'max';
    rateMode?: 'variable' | 'stable';
    source?: 'wallet' | 'aToken';
    role?: 'liquidity' | 'collateral';
    /** Receipt tokens, or the collateral seized in a liquidation */
    received?: CardToken;
    counterparty?: string;
    fee?: CardToken;
    closed?: boolean;
    positionAfter?: { supplied?: string; debt?: string; healthFactor?: string };
}

export type VaultAction = 'create' | 'deposit' | 'withdraw' | 'stake' | 'unstake' | 'lock' | 'extend' | 'distribute' | 'close';

/** Vaults, reward pools, gauges, farms, vote-escrow locks and Hyperliquid vaults. Give `chain` or `venue` so the client can place it. */
export interface VaultCardData {
    type: 'vault';
    protocol: string;
    chain?: Chain;
    venue?: Venue;
    action: VaultAction;
    vaultName?: string;
    vaultAddress?: string;
    vaultId?: string;
    positionId?: string;
    sent?: CardToken[];
    received?: CardToken[];
    percent?: string;
    lockUntil?: string;
    lockDuration?: string;
    totalLocked?: CardToken;
    rewardsClaimed?: boolean | CardToken[];
    fee?: CardToken;
}

/** Candidate to fold into `vault` (action add / remove / collect). */
export interface LiquidityCardData {
    type: 'tx.liquidity';
    protocol: string;
    chain: Chain;
    action: 'add' | 'remove' | 'collect';
    pool: { name?: string; address?: string; tokens?: string[]; feeTier?: string };
    positionId?: string | string[];
    range?: { lower: string; upper: string; quoteSymbol: string; fullRange?: boolean };
    sent?: CardToken[];
    received?: CardToken[];
    minReceived?: CardToken[];
    priceImpact?: string;
    percent?: string;
    closed?: boolean;
}

/** Candidate to fold into `vault` (action claim). `received` may be empty when the amount is unknown. */
export interface ClaimCardData {
    type: 'tx.claim';
    protocol: string;
    chain: Chain;
    source: string;
    sourceId?: string;
    received: CardToken[];
}

/** Candidate to fold into `generic`. */
export interface TokenLaunchCardData {
    type: 'token.launch';
    protocol: string;
    chain: Chain;
    token: { name: string; symbol: string; address: string; supply?: string; imageUrl?: string; metadataUri?: string };
    pageUrl: string;
    poolId?: string;
    initialBuy?: { sent: CardToken; received?: CardToken };
    /** Requested but not executed: `initialBuyRequested` without `initialBuy` means the buy failed */
    initialBuyRequested?: CardToken;
}

/** Any order with its own id on a CEX, perp DEX or on-chain order book, including reduce-only closes and TP/SL legs. */
export interface VenueOrderCardData {
    type: 'venue.order';
    venue: Venue;
    chain?: Chain;
    market: 'spot' | 'margin' | 'futures' | 'perp' | 'delivery';
    orderId?: string;
    clientOrderId?: string;
    symbol: string;
    side: 'buy' | 'sell';
    positionSide?: PositionSide;
    positionEffect?: 'open' | 'reduce' | 'close';
    role?: 'entry' | 'take_profit' | 'stop_loss';
    orderType: 'market' | 'limit' | 'trigger' | 'trailing_stop' | 'twap' | 'chase' | 'convert';
    timeInForce?: 'gtc' | 'ioc' | 'fok' | 'post_only';
    amount: CardToken;
    /** Default `base`; `contracts` needs `contractSize` to be readable */
    amountUnit?: AmountUnit;
    contractSize?: string;
    notional?: CardToken;
    closeEntirePosition?: boolean;
    price?: string;
    triggerPrice?: string;
    triggerDirection?: 'above' | 'below';
    takeProfitPrice?: string;
    stopLossPrice?: string;
    trailing?: { percent?: string; deltaBips?: string; distance?: string; activationPrice?: string };
    twap?: { sliceSize: string; intervalSec: number; priceLimit?: string; priceVariance?: string };
    chase?: { type: string; value: string; maxType?: string; maxValue?: string };
    leverage?: string;
    marginMode?: 'cross' | 'isolated';
    collateral?: CardToken;
    liquidationPrice?: string;
    filled?: string;
    avgPrice?: string;
    cost?: CardToken;
    fee?: CardToken;
    /** Always an estimate; may be negative */
    pnl?: CardToken;
    event?: 'created' | 'edited' | 'cancelled';
    /** Order id this one replaces after an edit — `cardPredecessorKey` uses it to link the cards */
    replacesOrderId?: string;
    previousPrice?: string;
    expiresAt?: string;
    status: OrderStatus;
}

/** An operation on a position that has no order id of its own (position-level TP/SL, close-position endpoints, HL / Jupiter positions). */
export interface PerpPositionCardData {
    type: 'perp.position';
    venue: Venue;
    chain?: Chain;
    symbol?: string;
    positionId?: string;
    action: 'open' | 'increase' | 'decrease' | 'close' | 'modify';
    side: PositionSide;
    size?: string;
    sizeUsd?: string;
    sizeDelta?: string;
    leverage?: string;
    entryPrice?: string;
    fillPrice?: string;
    liquidationPrice?: string;
    collateral?: CardToken;
    received?: CardToken;
    pnl?: CardToken;
    fees?: CardToken;
    orderId?: string;
    orderType?: 'market' | 'limit';
    status?: OrderStatus;
    /** `null` means the protection was removed */
    protection?: {
        takeProfit?: string | null;
        stopLoss?: string | null;
        trailingStop?: { distance: string; distancePercent?: string; activationPrice?: string } | null;
    };
    account?: VaultAccount;
}

/** Candidate to fold into `perp.position` (action modify). */
export interface PerpMarginCardData {
    type: 'perp.margin';
    venue: Venue;
    chain?: Chain;
    symbol?: string;
    positionId?: string;
    side?: PositionSide;
    action: 'add' | 'remove';
    amount: CardToken;
    received?: CardToken;
    marginMode?: 'isolated' | 'cross';
    leverage?: string;
    newMargin?: string;
    liquidationPrice?: string;
    account?: VaultAccount;
}

/** Wallet ↔ venue deposits and withdrawals, and transfers between venue sub-accounts. `asset` is gross, `received` is net of fee. */
export interface VenueTransferCardData {
    type: 'venue.transfer';
    venue: Venue;
    direction: 'deposit' | 'withdraw' | 'internal';
    asset: CardToken;
    received?: CardToken;
    fee?: CardToken;
    fromAccount?: string;
    toAccount?: string;
    chain?: Chain;
    /** Venue network code when it is not a `Chain` (ERC20, TRC20, BEP20 …) */
    network?: string;
    recipient?: string;
    memo?: string;
    /** Named withdrawal destination (Kraken key) */
    destinationLabel?: string;
    /** withdrawId / tranId / refid / transferId */
    transferId?: string;
    status?: 'submitted' | 'pending' | 'completed' | 'failed' | 'canceled';
    txHash?: string;
}

/** Triggers, DCA plans and copy-trading rules. The server, not the tool, sets `taskId` on the envelope; later progress arrives as new cards with that `taskId`. */
export interface AutomationCardData {
    type: 'automation';
    kind: 'trigger' | 'dca' | 'copytrade';
    summary: string;
    sources?: string[];
    condition?: Condition;
    /** What the automation will execute when it fires. Not `actions`: that name is the draft-level buttons. */
    plannedActions?: { protocol: string; functionName: string; args: object; label?: string }[];
    repeat?: { every: string; stop: string; note?: string };
    /** Required when `kind` is `dca` */
    plan?: DcaPlan;
    /** Required when `kind` is `copytrade` */
    copytrade?: { chain: Chain; target: string; percent?: string; status: 'active' | 'paused' | 'removed'; copyTradingEnabled?: boolean };
}

/** Settings changes, deposit addresses and anything without a dedicated shape. Also what a client shows for a card type it does not know. */
export interface GenericCardData {
    type: 'generic';
    title: string;
    rows: { label: string; value: string; copyable?: boolean }[];
    links?: { label: string; url: string }[];
}

/** The facts a tool knows about what it did. One discriminated union shared by adapters, the chat server and the clients. */
export type CardData =
    | SwapCardData
    | TransferCardData
    | BridgeCardData
    | LendCardData
    | VaultCardData
    | LiquidityCardData
    | ClaimCardData
    | TokenLaunchCardData
    | VenueOrderCardData
    | PerpPositionCardData
    | PerpMarginCardData
    | VenueTransferCardData
    | AutomationCardData
    | GenericCardData;

/** Narrow `CardData` by its `type` discriminator. */
export type CardDataOf<T extends CardType> = Extract<CardData, { type: T }>;

// ---------------------------------------------------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------------------------------------------------

/** A button as the tool describes it: what should happen, not how. The server decides how it executes. */
export type CardIntent =
    | { kind: 'execute'; label: string; protocol: string; functionName: string; args: object; confirm: string; danger?: boolean }
    | { kind: 'read'; label: string; protocol: string; functionName: string; args: object }
    | { kind: 'navigate'; label: string; target: string }
    | { kind: 'draft'; label: string; text: string };

/** A button as the client receives it: `execute` carries an opaque single-use handle instead of protocol / function / args. */
export type CardAction =
    | {
          kind: 'execute';
          id: string;
          label: string;
          handle: string;
          confirm: string;
          danger?: boolean;
          expiresAt: string;
          /**
           * The handle was used: its result is a new card next to this one. Set on the source card in any state, a
           * final one included, so clients must not cache that card as immutable; they show the button disabled.
           */
          done?: boolean;
      }
    | { kind: 'read'; id: string; label: string; read: string; params: Record<string, string> }
    | { kind: 'navigate'; id: string; label: string; target: string }
    | { kind: 'draft'; id: string; label: string; text: string };

// ---------------------------------------------------------------------------------------------------------------------
// Draft and envelope
// ---------------------------------------------------------------------------------------------------------------------

/** What only an adapter adds on top of `CardData`. */
export interface CardDraftExtras {
    actions?: CardIntent[];
    /** Hashes the tool sent outside `sendTransactions` (aggregator APIs, zaps, revoke batches) */
    txRefs?: TxRef[];
    /** Several drafts from one call belong together */
    group?: CardGroupKind;
    /** Partial success, warnings */
    notes?: string[];
}

/** What an adapter returns in `FunctionReturn.cards`. No id, wallet, state or captured hashes: the tool does not know them. */
export type CardDraft = CardData & CardDraftExtras;

/** Narrow `CardDraft` by its `type` discriminator. */
export type CardDraftOf<T extends CardType> = Extract<CardDraft, { type: T }>;

/**
 * What the chat server stores and sends: the envelope around `CardData`. Cards live inside a turn, so there is no
 * message id here.
 * - Apart from `done` on a used execute action, a card changes only while `state` is `pending`, and is finalised under
 *   the same id. A later change to the same object is a new card; keeping older cards' status live is the client's
 *   job (an overlay keyed by `cardKey`).
 * - Pressing an execute button appends its result as a new card next to this one and sets `done: true` on this
 *   card's execute actions, whatever this card's state: a `complete` order with a Cancel button is final, yet its
 *   button still changes. Clients must not cache such a card as immutable.
 * `type` mirrors `data.type` for indexing; to narrow in TypeScript switch on `card.data.type` or use `CardOf`.
 */
export interface Card {
    /** Stable id: a pending card is finalised under it, and action handles point at it */
    id: string;
    type: CardType;
    data: CardData;
    state: CardState;
    wallet?: string;
    /** Captured `sendTransactions` hashes plus the draft's `txRefs` */
    txs: TxRef[];
    actions: CardAction[];
    group?: { id: string; kind: CardGroupKind; title?: string };
    notes?: string[];
    /** Automation task the card reports on, set by the server */
    taskId?: string;
}

/** `Card` narrowed to one card type, with `data` narrowed accordingly. */
export type CardOf<T extends CardType> = Omit<Card, 'type' | 'data'> & { type: T; data: CardDataOf<T> };
