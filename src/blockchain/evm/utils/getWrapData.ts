import { TransactionParams } from '../types';
import { EvmChain } from '../../constants';
import { encodeFunctionData } from 'viem';
import { WETH9Abi } from '../abis';
import { getWrapAddress } from './getWrapAddress';

export function getWrapData(chain: EvmChain, amount: bigint): TransactionParams {
    const wraperAddress = getWrapAddress(chain);

    return {
        target: wraperAddress,
        data: encodeFunctionData({
            abi: WETH9Abi,
            functionName: 'deposit',
        }),
        value: amount,
    };
}
