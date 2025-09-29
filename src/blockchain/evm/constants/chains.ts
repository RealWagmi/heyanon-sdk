import { Chain, EvmChain } from '../../constants';

export const ChainIds = {
    [Chain.ETHEREUM]: 1,
    [Chain.OPTIMISM]: 10,
    [Chain.BSC]: 56,
    [Chain.GNOSIS]: 100,
    [Chain.POLYGON]: 137,
    [Chain.SONIC]: 146,
    [Chain.ZKSYNC]: 324,
    [Chain.METIS]: 1088,
    [Chain.KAVA_EVM]: 2222,
    [Chain.BASE]: 8453,
    [Chain.AVALANCHE]: 43_114,
    [Chain.ARBITRUM]: 42_161,
    [Chain.SCROLL]: 534_352,
    [Chain.HYPEREVM]: 999,
    [Chain.PLASMA]: 9745,
} satisfies Record<EvmChain, number>;