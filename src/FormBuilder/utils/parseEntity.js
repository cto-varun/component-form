import get from 'lodash/get';

/**
 *
 * @param {*} expression
 * @param {*} returnsOptionsParam
 */
const parseFunction = (
    expression,
    returnsOptionsParam,
    presetsMap,
    parserConfig
) => {
    console.log(expression, " this is expression")
    let presets = presetsMap;

    if (parserConfig.noPresets) {
        presets = null;
    }

    const argumentType = (params, paramName,filterKeys) => {
        console.log("arguent type -> ", params, paramName, filterKeys)
        if (returnsOptionsParam || !params) {
            return paramName;
        }

        const keys = Object.keys(params);
        if(filterKeys) {
            const keysToRemove = Object.keys(filterKeys);
            return `{ ${keys.filter(ar => !keysToRemove.includes(ar)).join(', ')} }`;
        }
        return `{ ${keys.join(', ')} }`;
    };

    const wrapFunctionWithOptions = (options = {}) => {
        try {
            const boundExpression = new Function(
                argumentType(options, 'options'),
                argumentType(presets, 'presets',options),
                `return ${expression}`
            );
            return boundExpression(options, presets);
        } catch (e) {
            console.error(`Failed to parse expression <${expression}>`, e);
            console.log(JSON.stringify(e), 'failed to parse expression ', expression)
            return undefined;
        }
    };

    return wrapFunctionWithOptions;
};

/**
 * Tokens that define string function parsing behavior.
 * @param {} parserTokens
 */
const parseEntity = (parserTokens, presets) => {
    const {
        PARSE_KEY,
        FUNCTION_START,
        FUNCTION_START_OPTIONS,
        PARSE_REGEX,
        PARSE_IGNORE,
    } = parserTokens;

    /**
     * Parses a function expression to format (options) => exp, where options is passed in later
     * @param {string} expression to parse
     */
    const parser = (exp, parserConfig = {}) => {
        const expression = exp.trim();
        if (expression.startsWith(FUNCTION_START)) {
            const returnsOptionsParam = expression.startsWith(
                FUNCTION_START_OPTIONS
            );
            const tokenLength = returnsOptionsParam
                ? FUNCTION_START_OPTIONS.length
                : FUNCTION_START.length;

            return parseFunction(
                expression.slice(tokenLength).trim(),
                returnsOptionsParam,
                presets,
                parserConfig
            );
        }

        if (expression.startsWith(PARSE_IGNORE)) {
            return expression.slice(PARSE_IGNORE.length);
        }

        if (expression.includes(PARSE_KEY)) {
            const wrapFunctionWithOptions = (options = {}) => {
                const property = expression.replace(PARSE_REGEX, (match) =>
                    match.slice(PARSE_KEY.length)
                );

                if (parserConfig.noPresets) {
                    return get({ ...options }, property);
                }

                return get({ ...options, ...presets }, property);
            };

            return wrapFunctionWithOptions;
        }

        return expression;
    };

    return parser;
};

export default parseEntity;
