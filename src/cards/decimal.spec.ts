import { toDecimalString } from './decimal';
import { cardTokenSchema } from './schema';

describe('toDecimalString', () => {
    it('divides bigints by decimals', () => {
        expect(toDecimalString(1742183412n, 6)).toBe('1742.183412');
        expect(toDecimalString(1n, 18)).toBe('0.000000000000000001');
        expect(toDecimalString(5000000000000000000n, 18)).toBe('5');
        expect(toDecimalString(0n, 6)).toBe('0');
        expect(toDecimalString(-2500000n, 6)).toBe('-2.5');
        expect(toDecimalString(123n)).toBe('123');
    });

    it('expands exponent notation of numbers', () => {
        expect(toDecimalString(1e-7)).toBe('0.0000001');
        expect(toDecimalString(1.66e-7)).toBe('0.000000166');
        expect(toDecimalString(1e21)).toBe('1000000000000000000000');
        expect(toDecimalString(-1.5e-9)).toBe('-0.0000000015');
        expect(toDecimalString(3484.37)).toBe('3484.37');
        expect(toDecimalString(0)).toBe('0');
    });

    it('normalizes numeric strings', () => {
        expect(toDecimalString('.5')).toBe('0.5');
        expect(toDecimalString('5.')).toBe('5');
        expect(toDecimalString('+3')).toBe('3');
        expect(toDecimalString('007.10')).toBe('7.1');
        expect(toDecimalString('-0')).toBe('0');
        expect(toDecimalString(' 1.66e-7 ')).toBe('0.000000166');
        expect(toDecimalString('1E+21')).toBe('1000000000000000000000');
        expect(toDecimalString('1742.183412')).toBe('1742.183412');
    });

    it('keeps the decimal position for zero-prefixed mantissas', () => {
        expect(toDecimalString('0.5e-1')).toBe('0.05');
        expect(toDecimalString('0.001e3')).toBe('1');
        expect(toDecimalString('0.0e5')).toBe('0');
        expect(toDecimalString(0.00001234)).toBe('0.00001234');
        expect(toDecimalString('10.5e1')).toBe('105');
    });

    it('throws on non-numbers', () => {
        expect(() => toDecimalString('1,000')).toThrow(/not a decimal/);
        expect(() => toDecimalString('abc')).toThrow(/not a decimal/);
        expect(() => toDecimalString(Number.NaN)).toThrow(/finite/);
        expect(() => toDecimalString(Number.POSITIVE_INFINITY)).toThrow(/finite/);
        expect(() => toDecimalString(1n, -1)).toThrow(/decimals/);
    });

    it('produces amounts the token schema accepts', () => {
        for (const value of [1e-7, 1e21, '.5', 1742183412n] as const) {
            const amount = typeof value === 'bigint' ? toDecimalString(value, 6) : toDecimalString(value);
            expect(cardTokenSchema.safeParse({ amount, symbol: 'X' }).success).toBe(true);
        }
    });
});
