export enum ChainId {
    ETHEREUM = 1,
    OPTIMISM = 10,
    BSC = 56,
    GNOSIS = 100,
    POLYGON = 137,
    SONIC = 146,
    FANTOM = 250,
    ZKSYNC = 324,
    METIS = 1088,
    KAVA = 2222,
    BASE = 8453,
    IOTA = 8822,
    AVALANCHE = 43_114,
    ARBITRUM = 42_161,
    ONE_SEPOLIA = 421_614,
    SCROLL = 534_352,
    SEPOLIA = 11_155_111,
    STARKNET = 234_485_942_919_683_34, // SN_MAIN
    STARKNET_SEPOLIA = 393_402_133_0259_977_980_009_61 // SN_SEPOLIA
}

export const allChainIds = Object.values(ChainId).filter(value => typeof value === 'number');
