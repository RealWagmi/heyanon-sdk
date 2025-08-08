import { FunctionReturn } from '../types';
import { stringify } from '../../utils';

export function toResult(data: string | Object | Array<any>, error = false): FunctionReturn {
    const formatedData = typeof data === 'string' ? data : stringify(data);
    return {
        success: !error,
        data: error ? `ERROR: ${formatedData}` : formatedData,
    };
}
