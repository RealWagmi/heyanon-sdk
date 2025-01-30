import { ChainIds } from '../constants/chains';

export function getChainName(chainId: number): string {
    for (const [name, chain] of Object.entries(ChainIds)) {
        if (chain === chainId) {
            return name;
        }
    }

    throw new Error(`Chain name with id ${chainId} not found`);
}
