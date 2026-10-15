import { CardData, TxRef } from './types';

/**
 * Identity key of the object a card describes (order, transfer, position, transaction). The data and state of a final
 * card are never rewritten (only `done` on a used execute action changes): a later change to the same object is a new
 * card, and clients key their live-status overlay on this value to keep the older cards about that object current.
 * The chat server may use it to relate cards as well.
 *
 * Returns `undefined` when the card has nothing stable to key on:
 * - on-chain cards key on their `action` transaction, falling back to any non-approval hash, then to the first hash;
 * - venue orders need an `orderId`, venue transfers a `transferId`;
 * - positions key on `positionId`, else on venue + symbol + side (+ vault account). Without a `positionId` that key
 *   names a reusable slot, so an overlay must stop at a terminal card (close, filled, canceled) rather than carry a
 *   new `open` onto last week's closed position;
 * - triggers and DCA are keyed by the server-assigned `taskId`, so they return `undefined`; copy-trading rules have
 *   no task id and key on chain + target;
 * - `generic` cards are never keyed.
 *
 * @example
 * ```typescript
 * cardKey({ type: 'venue.order', venue: 'binance', market: 'futures', symbol: 'BTC/USDT', orderId: '123', ... });
 * // 'order:binance:futures:BTC/USDT:123'
 * ```
 */
export function cardKey(data: CardData, txs: readonly TxRef[] = []): string | undefined {
    switch (data.type) {
        case 'venue.order':
            return data.orderId ? orderKey(data.venue, data.market, data.symbol, data.orderId) : undefined;
        case 'venue.transfer':
            return data.transferId ? `transfer:${data.venue}:${data.transferId}` : undefined;
        case 'perp.position':
        case 'perp.margin': {
            const account = data.account ? `vault:${normalizeHash(data.account.address)}:` : '';
            if (data.positionId) return `position:${data.venue}:${account}${data.positionId}`;
            return data.symbol && data.side ? `position:${data.venue}:${account}${data.symbol}:${data.side}` : undefined;
        }
        case 'tx.bridge':
            if (data.sourceTxHash) return `bridge:${data.sourceChain}:${normalizeHash(data.sourceTxHash)}`;
            return txKey('bridge', primaryTx(txs, 'source'));
        case 'token.launch':
            return `launch:${data.chain}:${normalizeHash(data.token.address)}`;
        case 'automation':
            return data.kind === 'copytrade' && data.copytrade ? `copytrade:${data.copytrade.chain}:${normalizeHash(data.copytrade.target)}` : undefined;
        case 'generic':
            return undefined;
        default:
            return txKey('tx', primaryTx(txs, 'action'));
    }
}

/**
 * Key of the object this card continues when the object itself changed identity: an edited order that received a
 * new id links back through `replacesOrderId` to the cards of the original order. Falls back to `cardKey`, so it can
 * be used wherever a predecessor is looked up.
 */
export function cardPredecessorKey(data: CardData, txs: readonly TxRef[] = []): string | undefined {
    if (data.type === 'venue.order' && data.replacesOrderId) return orderKey(data.venue, data.market, data.symbol, data.replacesOrderId);
    return cardKey(data, txs);
}

function orderKey(venue: string, market: string, symbol: string, orderId: string): string {
    return `order:${venue}:${market}:${symbol}:${orderId}`;
}

/** The transaction that identifies the card: the preferred role, else anything that is not an approval, else the first one. */
function primaryTx(txs: readonly TxRef[], preferred: TxRef['role']): TxRef | undefined {
    return txs.find(t => t.role === preferred) ?? txs.find(t => t.role === 'action') ?? txs.find(t => t.role !== 'approve') ?? txs[0];
}

function txKey(prefix: string, tx: TxRef | undefined): string | undefined {
    return tx ? `${prefix}:${tx.chain}:${normalizeHash(tx.hash)}` : undefined;
}

/** EVM hashes and addresses compare case-insensitively; Solana and TON values are case-sensitive. */
function normalizeHash(value: string): string {
    return value.startsWith('0x') || value.startsWith('0X') ? value.toLowerCase() : value;
}
