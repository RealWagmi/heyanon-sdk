import { FunctionReturn } from '../types';

export function toResult(data = '', error = false): FunctionReturn {
    return {
        success: !error,
        data: error ? `ERROR: ${data}` : data,
    };
}
