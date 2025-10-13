import { FunctionReturn } from '../types';
import { stringify } from '../../utils';

/**
 * Transforms data into a standardized FunctionReturn format
 * @param data - The data to transform (string, object, or array)
 * @param error - Whether this represents an error state (default: false)
 * @returns Standardized function result with success status and formatted data
 * @example
 * ```typescript
 * // Success case with string data
 * const result = toResult("Transaction completed");
 * // { success: true, data: "Transaction completed" }
 *
 * // Success case with object data
 * const result = toResult({ hash: "0x123", amount: "100" });
 * // { success: true, data: '{"hash":"0x123","amount":"100"}' }
 *
 * // Error case
 * const result = toResult("Network timeout", true);
 * // { success: false, data: "ERROR: Network timeout" }
 *
 * // Error case with object
 * const result = toResult({ code: 404, message: "Not found" }, true);
 * // { success: false, data: 'ERROR: {"code":404,"message":"Not found"}' }
 * ```
 */
export function toResult(data: string | Object | Array<any>, error = false): FunctionReturn {
    const formatedData = typeof data === 'string' ? data : stringify(data);
    return {
        success: !error,
        data: error ? `ERROR: ${formatedData}` : formatedData,
    };
}
