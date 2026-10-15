# HeyAnon SDK

[![Unit Tests](https://github.com/RealWagmi/heyanon-sdk/actions/workflows/unit-tests.yml/badge.svg)](https://github.com/RealWagmi/heyanon-sdk/actions/workflows/unit-tests.yml)
[![npm version](https://img.shields.io/npm/v/@heyanon/sdk/latest.svg)](https://www.npmjs.com/package/@heyanon/sdk/v/latest)

This code is shared across HeyAnon TypeScript SDKs.

## Cards

An adapter function can return structured facts about what it did next to the text the model reads. Clients render
these facts as cards instead of parsing the reply.

```typescript
import { Chain, toDecimalString, toResult, withCards } from '@heyanon/sdk';

return withCards(toResult(`Swapped ${amountIn} ETH for ${amountOut} USDC on Arbitrum`), {
    type: 'tx.swap',
    protocol: '1inch',
    chain: Chain.ARBITRUM,
    sent: { amount: toDecimalString(amountIn), symbol: 'ETH' },
    received: { amount: toDecimalString(amountOutWei, 6), symbol: 'USDC', address: usdc },
});
```

-   `FunctionReturn.data` stays the text for the model; `FunctionReturn.cards` is the data for the UI. A host must strip
    `cards` from the result before it reaches the model or the conversation context.
-   A draft carries only what the tool knows: `CardData` (one discriminated union over `type`), optional button intents
    (`actions`), hashes sent outside `sendTransactions` (`txRefs`), a `group` for several cards from one call and `notes`.
    The chat server wraps it in a `Card` envelope: it adds the id, wallet, captured transactions and state, and turns
    intents into opaque handles.
-   Apart from `done` on a used execute action, a `Card` changes only while its `state` is `pending` and is finalised
    under the same id; a later change to the same object is a new card. Pressing an execute button appends its result
    as a new card next to the source card and sets `done: true` on the source card's execute actions whatever that
    card's state (a `complete` order with a Cancel button is final, yet its button still changes), so clients show
    them disabled and must not cache a card with execute actions as immutable.
-   Only executable functions report cards, one per operation; a call that places two orders returns two drafts with
    `group: 'pair'`. A no-op success returns no cards; a failed result may still carry a card when a transaction was
    already sent.
-   Validation: `withCards` is strict under vitest / jest / `NODE_ENV=test` (an unknown key at any depth throws, so typos
    fail in the adapter's tests) and lenient everywhere else (an invalid card is dropped with a warning, unknown keys are
    stripped, `success` and `data` are never touched). `withCardsStrict` and `setCardValidationMode` override this.
-   Amounts are decimal strings built with `toDecimalString`: digits and an optional fraction, no sign, no exponent, no
    separators. When a token carries `decimals`, its `amount` is an integer in base units instead. Signed amounts are
    allowed only where a value can be negative (`pnl`, `sizeDelta`, condition thresholds).
-   Every token needs a `symbol` or an `address`; `logoURI` and `priceUsd` are optional display hints. Off-chain venues
    use `venue` instead of `chain`. Links are `http(s)` or `ipfs` only; clients re-check the scheme before opening them.
-   Helpers for adapters: `cardDecimal` (tolerant `toDecimalString`), `cardChain`, `cardToken` (from any token-like
    object, with `logoURI` / `priceUsd` hints and base-unit scaling), `txRef`, `presentCards`.
-   `cardKey(data, txs)` identifies the object a card describes (order, transfer, position, transaction); clients key the
    live status of older cards on it. `cardPredecessorKey` follows `replacesOrderId` for edited orders. `parseCards`
    parses an array leniently, degrading cards of an unknown type to `generic` instead of failing the whole list.

The interfaces in `src/cards/types.ts` are the readable contract; the zod 4 schemas in `src/cards/schema.ts` implement
them and a compile-time parity check keeps the two identical at every depth, optional keys included. Schemas are plain
zod 4 objects, so a consumer on zod 4 can compose them (`z.array(cardSchema)`) or call `.safeParse` directly.
