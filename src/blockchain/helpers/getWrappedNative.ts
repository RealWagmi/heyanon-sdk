import { Token } from '@real-wagmi/sdk';
import { ChainId } from '../constants';
import { WETH9 } from '../constants';

export function getWrappedNative(chainId: ChainId): Token {
    const token = WETH9[chainId];
    if (!token) {
        throw new Error(`Wrapped native for chainId ${chainId} not found`);
    }
    return token;
}
