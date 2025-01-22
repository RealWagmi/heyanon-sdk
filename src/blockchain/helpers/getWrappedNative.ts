import { Token } from '@real-wagmi/sdk';
import { ChainId } from '../constants';
import { WETH9 } from '../constants';

export function getWrappedNative(chainId: ChainId): Token {
    if (!(chainId in WETH9)) {
        throw new Error(`Wrapped native for chainId ${chainId} not found`);
    }
    return WETH9[chainId as keyof typeof WETH9];
}
