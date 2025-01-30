export enum Chain {
    ETHEREUM = 'ethereum',
    OPTIMISM = 'optimism',
    BSC = 'bsc',
    GNOSIS = 'gnosis',
    POLYGON = 'polygon',
    SONIC = 'sonic',
    FANTOM = 'fantom',
    ZKSYNC = 'zksync',
    METIS = 'metis',
    KAVA_EVM = 'kava_evm',
    BASE = 'base',
    IOTA_EVM = 'iota_evm',
    AVALANCHE = 'avalanche',
    ARBITRUM = 'arbitrum',
    SCROLL = 'scroll',
    SOLANA = 'solana',
}

export type EvmChain = Exclude<Chain, Chain.SOLANA>;

export const allChains = Object.values(Chain);
export const allEvmChains = Object.values(Chain).filter(chain => chain !== Chain.SOLANA);
