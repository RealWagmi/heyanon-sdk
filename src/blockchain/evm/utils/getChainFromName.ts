import { EvmChain } from '../../constants';
import { ChainIds } from '../constants';

export function getChainFromName(chain: EvmChain): number {
    const chainId = ChainIds[chain];
    if (!chainId) throw new Error(`Unknown chain name: ${chain}`);

    return chainId;
}
