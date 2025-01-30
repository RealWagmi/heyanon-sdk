import { EvmChain, allEvmChains } from '../../constants';

export function isEvmChain(chain: string): boolean {
    return allEvmChains.includes(chain as EvmChain);
}
