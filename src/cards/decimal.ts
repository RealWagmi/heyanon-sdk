/**
 * Formats a number, bigint or numeric string as the decimal string the card schemas accept: digits, an optional
 * fraction, an optional leading minus, no exponent, no thousands separators, no trailing zeros.
 *
 * - `bigint` with `decimals` is treated as base units and divided (`toDecimalString(1742183412n, 6)` → `'1742.183412'`);
 * - `number` is expanded from its exponent form (`1e-7` → `'0.0000001'`), so tiny token amounts stay valid;
 * - `string` is normalized (`'.5'` → `'0.5'`, `'5.'` → `'5'`, `'+3'` → `'3'`, `'1.66e-7'` → `'0.000000166'`).
 *
 * Throws on `NaN`, `Infinity`, and strings that are not numbers (`'1,000'`, `'abc'`).
 */
export function toDecimalString(value: string | number | bigint, decimals?: number): string {
    if (typeof value === 'bigint') return scaleBigInt(value, decimals ?? 0);
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) throw new Error(`toDecimalString: not a finite number: ${value}`);
        return normalize(expandExponent(value.toString()));
    }
    const trimmed = value.trim().replace(/^\+/, '');
    if (!/^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(trimmed)) throw new Error(`toDecimalString: not a decimal: ${JSON.stringify(value)}`);
    return normalize(expandExponent(trimmed));
}

function scaleBigInt(value: bigint, decimals: number): string {
    if (!Number.isInteger(decimals) || decimals < 0) throw new Error(`toDecimalString: invalid decimals: ${decimals}`);
    const negative = value < 0n;
    const digits = (negative ? -value : value).toString().padStart(decimals + 1, '0');
    const whole = digits.slice(0, digits.length - decimals) || '0';
    const fraction = decimals ? digits.slice(digits.length - decimals) : '';
    return normalize(`${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`);
}

/** `'1.66e-7'` → `'0.000000166'`, `'1e+21'` → `'1000000000000000000000'`. Input is already validated as numeric. */
function expandExponent(input: string): string {
    const match = /^(-?)(\d*)(?:\.(\d*))?e([+-]?\d+)$/i.exec(input);
    if (!match) return input;
    const [, sign, intPart, fracPart = '', expText] = match;
    const exponent = Number(expText);
    const mantissa = `${intPart}${fracPart}`.replace(/^0+(?=\d)/, '');
    const pointAt = intPart.replace(/^0+(?=\d)/, '').length + exponent;
    if (pointAt <= 0) return `${sign}0.${'0'.repeat(-pointAt)}${mantissa}`;
    if (pointAt >= mantissa.length) return `${sign}${mantissa}${'0'.repeat(pointAt - mantissa.length)}`;
    return `${sign}${mantissa.slice(0, pointAt)}.${mantissa.slice(pointAt)}`;
}

/** Leading-zero and trailing-zero cleanup: `'.5'` → `'0.5'`, `'5.'` → `'5'`, `'007.10'` → `'7.1'`, `'-0'` → `'0'`. */
function normalize(input: string): string {
    const negative = input.startsWith('-');
    let [whole = '', fraction = ''] = (negative ? input.slice(1) : input).split('.');
    whole = whole.replace(/^0+(?=\d)/, '') || '0';
    fraction = fraction.replace(/0+$/, '');
    const result = fraction ? `${whole}.${fraction}` : whole;
    return negative && result !== '0' ? `-${result}` : result;
}
