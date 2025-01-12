import { ChainId, chainNames } from '../constants';

export function getChainName(chainId: ChainId): string {
    const name = chainNames[chainId];
    if (!name) throw new Error(`Chain name with id ${chainId} not found`);
    return name;
}
