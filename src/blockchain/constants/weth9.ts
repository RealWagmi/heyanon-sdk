import { ChainId } from './chains';
import { arbitrumTokens, avalancheTokens, baseTokens, bscTokens, ethereumTokens, fantomTokens, iotaTokens, kavaTokens, metisTokens, optimismTokens, polygonTokens, sonicTokens, Token, zkSyncTokens } from '@real-wagmi/sdk';
/**
 * Known WETH9 implementation addresses, used in our implementation of Ether#wrapped
 */
export const WETH9 = {
    [ChainId.ETHEREUM]: ethereumTokens.weth,
    [ChainId.OPTIMISM]: optimismTokens.weth,
    [ChainId.BSC]: bscTokens.wbnb,
    [ChainId.POLYGON]: polygonTokens.wmatic,
    [ChainId.FANTOM]: fantomTokens.wftm,
    [ChainId.ZKSYNC]: zkSyncTokens.weth,
    [ChainId.KAVA]: kavaTokens.wkava,
    [ChainId.AVALANCHE]: avalancheTokens.wavax,
    [ChainId.ARBITRUM]: arbitrumTokens.weth,
    [ChainId.METIS]: metisTokens.wmetis,
    [ChainId.BASE]: baseTokens.weth,
    [ChainId.IOTA]: iotaTokens.wiota,
    [ChainId.SONIC]: sonicTokens.ws,
    [ChainId.SEPOLIA]: new Token(ChainId.SEPOLIA, '0x7b79995e5f793a07bc00c21412e50ecae098e7f9', 18, 'WETH', 'Wrapped Ether'),
    [ChainId.ONE_SEPOLIA]: new Token(ChainId.ONE_SEPOLIA, '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73', 18, 'WETH', 'Wrapped Ether'),
    [ChainId.SCROLL]: new Token(ChainId.SCROLL, '0x5300000000000000000000000000000000000004', 18, 'WETH', 'Wrapped Ether'),
    [ChainId.GNOSIS]: new Token(ChainId.GNOSIS, '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d', 18, 'WXDAI', 'Wrapped XDAI'),
} satisfies Partial<Record<ChainId, Token>>;
