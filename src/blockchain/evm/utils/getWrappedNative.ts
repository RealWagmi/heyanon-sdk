import { Token } from '@real-wagmi/sdk';
import { WETH9 } from '../constants';
import { EvmChain } from '../../constants/chains';

export function getWrappedNative(chain: EvmChain): Token {
    const token = WETH9[chain];
    if (!token) throw new Error(`Wrapped native for chain ${chain} not found`);
    return token;
}
