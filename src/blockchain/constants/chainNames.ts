import { ChainId } from './chains';

export const chainNames: Record<ChainId, string> = {
    [ChainId.BSC]: 'bsc',
    [ChainId.ETHEREUM]: 'ethereum',
    [ChainId.ZKSYNC]: 'zksync',
    [ChainId.OPTIMISM]: 'optimistic',
    [ChainId.POLYGON]: 'polygon',
    [ChainId.FANTOM]: 'fantom',
    [ChainId.KAVA]: 'kava',
    [ChainId.AVALANCHE]: 'avalanche',
    [ChainId.ARBITRUM]: 'arbitrum-one',
    [ChainId.METIS]: 'metis',
    [ChainId.BASE]: 'base',
    [ChainId.IOTA]: 'iota',
    [ChainId.SEPOLIA]: 'sepolia',
    [ChainId.SONIC]: 'sonic',
    [ChainId.GNOSIS]: 'gnosis',
    [ChainId.SCROLL]: 'scroll',
    [ChainId.ONE_SEPOLIA]: 'one-sepolia',
};

export const allChainNames = Object.values(chainNames);
