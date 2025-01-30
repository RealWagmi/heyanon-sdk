import { EvmChain } from '../../constants';
import { WETH9 } from '../constants';
import { Address } from 'viem';

export function getWrapAddress(chain: EvmChain): Address {
    const wraperAddress = WETH9[chain]?.address;
    if (!wraperAddress) throw new Error(`Wrap address not set: ${chain}`);

    return wraperAddress;
}
