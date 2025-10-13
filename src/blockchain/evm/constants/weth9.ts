import { Chain, EvmChain } from '../../constants';
import { arbitrumTokens, avalancheTokens, baseTokens, bscTokens, ethereumTokens, kavaTokens, metisTokens, optimismTokens, polygonTokens, sonicTokens, Token, zkSyncTokens } from '@real-wagmi/sdk';
import { ChainIds } from './chains';

/**
 * Mapping of EVM chains to their respective wrapped native token contracts (WETH9-like implementations)
 * @constant WETH9
 * @description Each chain has its own wrapped version of the native currency that follows the WETH9 standard
 * @example
 * ```typescript
 * // Get wrapped native token for specific chain
 * const wethOnEthereum = WETH9[Chain.ETHEREUM]; // WETH
 * const wbnbOnBsc = WETH9[Chain.BSC];           // WBNB
 * const wmaticOnPolygon = WETH9[Chain.POLYGON]; // WPOL
 * 
 * // Wrap native currency to ERC20
 * async function wrapNativeToken(chain: EvmChain, amount: string) {
 *   const wrappedToken = WETH9[chain];
 *   const wrapData = await getWrapData(chain, amount);
 *   
 *   return await options.evm.sendTransactions({
 *     transactions: [{
 *       to: wrappedToken.address,
 *       value: amount,
 *       data: wrapData
 *     }]
 *   });
 * }
 * 
 * // Unwrap ERC20 back to native currency
 * async function unwrapToken(chain: EvmChain, amount: string) {
 *   const wrappedToken = WETH9[chain];
 *   const unwrapData = await getUnwrapData(chain, amount);
 *   
 *   return await options.evm.sendTransactions({
 *     transactions: [{
 *       to: wrappedToken.address,
 *       value: '0',
 *       data: unwrapData
 *     }]
 *   });
 * }
 * 
 * // Get wrapped token info for trading
 * function getWrappedTokenInfo(chain: EvmChain) {
 *   const token = WETH9[chain];
 *   return {
 *     address: token.address,
 *     symbol: token.symbol,
 *     decimals: token.decimals,
 *     name: token.name
 *   };
 * }
 * 
 * // Check if address is a wrapped native token
 * function isWrappedNative(chain: EvmChain, tokenAddress: string): boolean {
 *   return WETH9[chain].address.toLowerCase() === tokenAddress.toLowerCase();
 * }
 * 
 * // Use in DEX operations
 * const swapConfig = {
 *   fromToken: NATIVE_ADDRESS,           // Native ETH
 *   toToken: WETH9[Chain.ETHEREUM].address, // Wrapped ETH
 *   amount: parseEther('1')
 * };
 * ```
 */
export const WETH9 = {
    /** Wrapped Ether (WETH) on Ethereum */
    [Chain.ETHEREUM]: ethereumTokens.weth,
    /** Wrapped Ether (WETH) on Optimism */
    [Chain.OPTIMISM]: optimismTokens.weth,
    /** Wrapped BNB (WBNB) on Binance Smart Chain */
    [Chain.BSC]: bscTokens.wbnb,
    /** Wrapped POL (WPOL) on Polygon */
    [Chain.POLYGON]: polygonTokens.wpol,
    /** Wrapped Ether (WETH) on zkSync Era */
    [Chain.ZKSYNC]: zkSyncTokens.weth,
    /** Wrapped KAVA (WKAVA) on Kava EVM */
    [Chain.KAVA_EVM]: kavaTokens.wkava,
    /** Wrapped AVAX (WAVAX) on Avalanche */
    [Chain.AVALANCHE]: avalancheTokens.wavax,
    /** Wrapped Ether (WETH) on Arbitrum */
    [Chain.ARBITRUM]: arbitrumTokens.weth,
    /** Wrapped METIS (WMETIS) on Metis */
    [Chain.METIS]: metisTokens.wmetis,
    /** Wrapped Ether (WETH) on Base */
    [Chain.BASE]: baseTokens.weth,
    /** Wrapped S (WS) on Sonic */
    [Chain.SONIC]: sonicTokens.ws,
    /** Wrapped Ether (WETH) on Scroll */
    [Chain.SCROLL]: new Token(ChainIds[Chain.SCROLL], '0x5300000000000000000000000000000000000004', 18, 'WETH', 'Wrapped Ether'),
    /** Wrapped xDAI (WXDAI) on Gnosis Chain */
    [Chain.GNOSIS]: new Token(ChainIds[Chain.GNOSIS], '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d', 18, 'WXDAI', 'Wrapped XDAI'),
    /** Wrapped HYPE (WHYPE) on HyperEVM */
    [Chain.HYPEREVM]: new Token(ChainIds[Chain.HYPEREVM], '0x5555555555555555555555555555555555555555', 18, 'WHYPE', 'Wrapped HYPE'),
    /** Wrapped XPL (WXPL) on Plasma */
    [Chain.PLASMA]: new Token(ChainIds[Chain.PLASMA], '0x6100E367285b01F48D07953803A2d8dCA5D19873', 18, 'WXPL', 'Wrapped XPL'),
} satisfies Record<EvmChain, Token>;
