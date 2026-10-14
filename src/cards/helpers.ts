import { Chain } from '../blockchain';
import { toDecimalString } from './decimal';
import { CardDraft, CardToken, TxRef, TxRole } from './types';

/**
 * Building blocks for adapters that report cards. Every helper tolerates missing or malformed input and returns
 * `undefined` instead of throwing: a card shows what the adapter confirmed, never a guess.
 */

const CHAINS = new Set<string>(Object.values(Chain));

/** `toDecimalString` for values that may be absent or malformed: an unparsable amount is omitted, never guessed. */
export function cardDecimal(value: string | number | bigint | undefined | null, decimals?: number): string | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    try {
        return toDecimalString(value, decimals);
    } catch {
        return undefined;
    }
}

/** `chainName` as a `Chain` enum value, or `undefined` when the adapter works on something the contract does not know. */
export function cardChain(chainName: string | undefined | null): Chain | undefined {
    return chainName && CHAINS.has(chainName) ? (chainName as Chain) : undefined;
}

/** Anything that names a token: a catalog entry, a service response token, a ccxt currency. */
export interface TokenLike {
    symbol?: string | null;
    address?: string | null;
    decimals?: number | null;
    logoURI?: string | null;
    priceUsd?: number | string | null;
}

/**
 * A `CardToken` from any token-like object, or `undefined` without an identity.
 * - `amount` is human-readable; pass `rawAmount` (base units) instead and it is scaled by `token.decimals`;
 * - `logoURI` is kept only when it is an http(s) / ipfs link, `priceUsd` only when it is a non-negative number.
 */
export function cardToken(token: TokenLike | undefined | null, amount?: string | number | bigint | null, rawAmount?: bigint | string | null): CardToken | undefined {
    const symbol = token?.symbol?.trim();
    const address = token?.address?.trim();
    if (!symbol && !address) return undefined;
    const scaled = rawAmount !== undefined && rawAmount !== null && typeof token?.decimals === 'number' ? scale(rawAmount, token.decimals) : undefined;
    const logoURI = typeof token?.logoURI === 'string' && /^(https?|ipfs):\/\//i.test(token.logoURI) ? token.logoURI.slice(0, 2048) : undefined;
    const priceUsd = token?.priceUsd === undefined || token?.priceUsd === null ? undefined : cardDecimal(token.priceUsd);
    return {
        amount: scaled ?? cardDecimal(amount),
        symbol: symbol ? symbol.slice(0, 64) : undefined,
        address: address || undefined,
        logoURI,
        priceUsd: priceUsd && !priceUsd.startsWith('-') ? priceUsd : undefined,
    };
}

function scale(rawAmount: bigint | string, decimals: number): string | undefined {
    try {
        return toDecimalString(typeof rawAmount === 'string' ? BigInt(rawAmount) : rawAmount, decimals);
    } catch {
        return undefined;
    }
}

/** A `TxRef` for a hash the adapter sent outside `sendTransactions`. `url` is kept only when it is an http(s) link. */
export function txRef(chain: Chain, hash: string, role: TxRole = 'action', url?: string | null): TxRef {
    return { chain, hash, role, url: url && /^https?:\/\//i.test(url) ? url : undefined };
}

/** Drops `undefined` entries so call sites can pass builders that may decline to produce a card. */
export function presentCards(...cards: (CardDraft | undefined | null)[]): CardDraft[] {
    return cards.filter((card): card is CardDraft => card !== undefined && card !== null);
}
