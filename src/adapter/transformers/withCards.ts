import { FunctionReturn } from '../types';
import { CardDraft, cardDraftSchema, strictCardDraftSchema } from '../../cards';

/**
 * How `withCards` treats an invalid draft.
 * - `strict`: throw. Default under vitest / jest / `NODE_ENV=test`, so a typo fails in the adapter's own tests.
 * - `lenient`: warn and drop the card, keep `success` and `data` untouched. Default everywhere else, because
 *   `withCards` runs after the transaction or order was already sent and an exception there would make the model
 *   report a failure for an operation that succeeded.
 */
export type CardValidationMode = 'strict' | 'lenient';

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
let validationMode: CardValidationMode = env.NODE_ENV === 'test' || env.VITEST || env.JEST_WORKER_ID ? 'strict' : 'lenient';

/** Overrides the detected mode, e.g. `setCardValidationMode('strict')` in a staging host that should fail loudly. */
export function setCardValidationMode(mode: CardValidationMode): void {
    validationMode = mode;
}

export function getCardValidationMode(): CardValidationMode {
    return validationMode;
}

/**
 * Attaches structured cards to a function result.
 *
 * `data` stays the text for the model; `cards` is the data for the UI. The chat server adds the id, the wallet,
 * the captured transaction hashes and the final state, and turns button intents into opaque handles. Hosts must
 * strip `cards` from the result before passing it to the model.
 *
 * Validation follows `getCardValidationMode()`: strict in tests (throws on any unknown key at any depth), lenient
 * in production (invalid cards are dropped with a warning, unknown keys are stripped).
 *
 * @param result - The result built with `toResult`
 * @param cards - Zero or more card drafts; several drafts from one call may share a `group`
 * @returns The same result with `cards` appended
 * @example
 * ```typescript
 * return withCards(toResult(`Swapped ${amountIn} ${symbolIn} for ${amountOut} ${symbolOut} on ${chainName}`), {
 *     type: 'tx.swap',
 *     protocol: '1inch',
 *     chain: Chain.ARBITRUM,
 *     sent: { amount: toDecimalString(amountIn), symbol: symbolIn, address: tokenIn },
 *     received: { amount: toDecimalString(amountOutWei, decimals), symbol: symbolOut, address: tokenOut },
 * });
 * ```
 */
export function withCards(result: FunctionReturn, ...cards: CardDraft[]): FunctionReturn {
    return attach(result, cards, validationMode);
}

/** `withCards` that always throws on an invalid draft, whatever the detected mode. */
export function withCardsStrict(result: FunctionReturn, ...cards: CardDraft[]): FunctionReturn {
    return attach(result, cards, 'strict');
}

function attach(result: FunctionReturn, cards: CardDraft[], mode: CardValidationMode): FunctionReturn {
    const schema = mode === 'strict' ? strictCardDraftSchema : cardDraftSchema;
    const kept: CardDraft[] = [];
    cards.forEach((card, index) => {
        const check = schema.safeParse(card);
        if (check.success) {
            kept.push(check.data);
            return;
        }
        const type = typeof card === 'object' && card !== null && 'type' in card ? String((card as { type?: unknown }).type) : 'unknown';
        const issues = check.error.issues.map(issue => `${issue.path.map(String).join('.') || '<root>'}: ${issue.message}`).join('; ');
        const message = `Invalid card draft #${index} (${type}): ${issues}`;
        if (mode === 'strict') throw new Error(message);
        console.warn(`[@heyanon/sdk] ${message} — card dropped`);
    });
    return { ...result, cards: [...(result.cards ?? []), ...kept] };
}
