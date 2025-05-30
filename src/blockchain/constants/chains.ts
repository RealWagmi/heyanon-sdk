export enum Chain {
    ETHEREUM = 'ethereum',
    OPTIMISM = 'optimism',
    BSC = 'bsc',
    GNOSIS = 'gnosis',
    POLYGON = 'polygon',
    SONIC = 'sonic',
    ZKSYNC = 'zksync',
    METIS = 'metis',
    KAVA_EVM = 'kava_evm',
    BASE = 'base',
    IOTA_EVM = 'iota_evm',
    AVALANCHE = 'avalanche',
    ARBITRUM = 'arbitrum',
    SCROLL = 'scroll',
    SOLANA = 'solana',
    TON = 'ton',
    HYPEREVM = 'hyperevm',
}

export type EvmChain = Exclude<Chain, Chain.SOLANA | Chain.TON>;

export const allChains = Object.values(Chain);
export const allEvmChains = Object.values(Chain).filter(chain => chain !== Chain.SOLANA && chain !== Chain.TON);
