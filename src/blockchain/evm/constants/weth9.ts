import { Chain, EvmChain } from '../../constants';
import { arbitrumTokens, avalancheTokens, baseTokens, bscTokens, ethereumTokens, kavaTokens, metisTokens, optimismTokens, polygonTokens, sonicTokens, Token, zkSyncTokens } from '@real-wagmi/sdk';
import { ChainIds } from './chains';
/**
 * Known WETH9 implementation addresses, used in our implementation of Ether#wrapped
 */
export const WETH9 = {
    [Chain.ETHEREUM]: ethereumTokens.weth,
    [Chain.OPTIMISM]: optimismTokens.weth,
    [Chain.BSC]: bscTokens.wbnb,
    [Chain.POLYGON]: polygonTokens.wmatic,
    [Chain.ZKSYNC]: zkSyncTokens.weth,
    [Chain.KAVA_EVM]: kavaTokens.wkava,
    [Chain.AVALANCHE]: avalancheTokens.wavax,
    [Chain.ARBITRUM]: arbitrumTokens.weth,
    [Chain.METIS]: metisTokens.wmetis,
    [Chain.BASE]: baseTokens.weth,
    [Chain.SONIC]: sonicTokens.ws,
    [Chain.SCROLL]: new Token(ChainIds[Chain.SCROLL], '0x5300000000000000000000000000000000000004', 18, 'WETH', 'Wrapped Ether'),
    [Chain.GNOSIS]: new Token(ChainIds[Chain.GNOSIS], '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d', 18, 'WXDAI', 'Wrapped XDAI'),
    [Chain.HYPEREVM]: new Token(ChainIds[Chain.HYPEREVM], '0x5555555555555555555555555555555555555555', 18, 'WHYPE', 'Wrapped HYPE'),
} satisfies Record<EvmChain, Token>;
