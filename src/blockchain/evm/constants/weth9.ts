import { Chain, EvmChain } from '../../constants';
import { arbitrumTokens, avalancheTokens, baseTokens, bscTokens, ethereumTokens, fantomTokens, iotaTokens, kavaTokens, metisTokens, optimismTokens, polygonTokens, sonicTokens, Token, zkSyncTokens } from '@real-wagmi/sdk';
/**
 * Known WETH9 implementation addresses, used in our implementation of Ether#wrapped
 */
export const WETH9 = {
    [Chain.ETHEREUM]: ethereumTokens.weth,
    [Chain.OPTIMISM]: optimismTokens.weth,
    [Chain.BSC]: bscTokens.wbnb,
    [Chain.POLYGON]: polygonTokens.wmatic,
    [Chain.FANTOM]: fantomTokens.wftm,
    [Chain.ZKSYNC]: zkSyncTokens.weth,
    [Chain.KAVA_EVM]: kavaTokens.wkava,
    [Chain.AVALANCHE]: avalancheTokens.wavax,
    [Chain.ARBITRUM]: arbitrumTokens.weth,
    [Chain.METIS]: metisTokens.wmetis,
    [Chain.BASE]: baseTokens.weth,
    [Chain.IOTA_EVM]: iotaTokens.wiota,
    [Chain.SONIC]: sonicTokens.ws,
    [Chain.SCROLL]: new Token(534_352, '0x5300000000000000000000000000000000000004', 18, 'WETH', 'Wrapped Ether'),
    [Chain.GNOSIS]: new Token(100, '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d', 18, 'WXDAI', 'Wrapped XDAI'),
} satisfies Record<EvmChain, Token>;
