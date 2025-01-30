import { EvmChain } from '../../constants';
import { TransactionParams } from '../types';
import { encodeFunctionData } from 'viem';
import { WETH9Abi } from '../abis';
import { getWrapAddress } from './getWrapAddress';

export function getUnwrapData(chain: EvmChain, amount: bigint): TransactionParams {
    const wraperAddress = getWrapAddress(chain);

    return {
        target: wraperAddress,
        data: encodeFunctionData({
            abi: WETH9Abi,
            functionName: 'withdraw',
            args: [amount],
        }),
    };
}
