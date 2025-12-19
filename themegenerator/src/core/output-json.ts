import { TokensByMode } from './types.js';

export function tokensToJson(tokens: TokensByMode) {
  function serialize(modeTokens: any) {
    return JSON.parse(JSON.stringify(modeTokens));
  }
  return {
    light: serialize(tokens.light),
    dark: serialize(tokens.dark)
  };
}
