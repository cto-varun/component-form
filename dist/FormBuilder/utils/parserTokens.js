"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initializeParserKeys;
const parseKeyExpression = repeat => function (key) {
  let override = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  if (override && typeof override === 'function') {
    return override(key);
  }
  return key.repeat(repeat);
};

/**
 * This regex allows the parsing of multiple get commands in a string.
 * e.g. `@prop1 is a dynamic property, same with @prop2` => `value1 is a dynamic property, same with undefined`
 */
const parseRegex = key => new RegExp(`(\\${key})([^\\${key}\\s[\\]][-\\w\\d]*(\\.\\w+)*)(?=[^-\\w\\d]{0,})`, 'gi');
function initializeParserKeys(config) {
  const {
    parseKey = '@',
    overrideFunctionStart = null,
    overrideFunctionStartOptions = null,
    overrideParserIgnore = null
  } = config;
  return {
    PARSE_KEY: parseKey,
    FUNCTION_START: parseKeyExpression(2)(parseKey, overrideFunctionStart),
    FUNCTION_START_OPTIONS: parseKeyExpression(3)(parseKey, overrideFunctionStartOptions),
    PARSE_REGEX: parseRegex(parseKey),
    PARSE_IGNORE: parseKeyExpression()(parseKey, overrideParserIgnore || (k => `!${k}`))
  };
}
module.exports = exports.default;