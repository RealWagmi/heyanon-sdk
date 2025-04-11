export function stringify(value: any, space?: string | number): string {
    return JSON.stringify(value, (_key, value) => (typeof value === 'bigint' ? value.toString() : value), space);
}
