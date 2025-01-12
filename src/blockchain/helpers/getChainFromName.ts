import { ChainId } from '../constants';
import { chainNames } from '../constants';

export function getChainFromName(chainName: string): ChainId {
    for (const [chainId, name] of Object.entries(chainNames)) {
        if (name === chainName) {
            return parseInt(chainId);
        }
    }

    throw new Error(`Unknown chain name: ${chainName}`);
}
