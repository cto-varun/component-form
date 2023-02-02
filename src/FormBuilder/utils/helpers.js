import get from 'lodash/get';
import mapValues from 'lodash/mapValues';
import mergeWith from 'lodash/mergeWith';
import omit from 'lodash/omit';
import zipObjectDeep from 'lodash/zipObjectDeep';
import index from './deepdash-package/getIndex';
import findPathDeep from './deepdash-package/getFindPathDeep';
import paths from './deepdash-package/getPaths';

const isArray = (v) => Array.isArray(v);
const isObject = (obj) =>
    obj && typeof obj === 'object' && obj.constructor === Object;
const isString = (v) => typeof v === 'string';

const hasProperty = (obj, property) => isObject(obj) && get(obj, property);

/**
 *
 * @param {any} v value to compare
 * @param {string} type type to compare or object property to lookup
 * @param {boolean} isPropertyType
 */
export const assert = (v, type, isPropertyType = false) => {
    switch (type) {
        case 'string': {
            return isString(v);
        }

        case 'array': {
            return isArray(v);
        }

        case 'object': {
            return isObject(v);
        }

        case 'null-like': {
            return !v;
        }

        default: {
            if (isPropertyType) {
                return hasProperty(v, type);
            }

            return typeof v === type;
        }
    }
};

export const normalizeArray = (arr) => {
    if (assert(arr, 'array')) {
        return arr;
    }
    return [arr];
};

export const normalizeObject = (obj, includes) => {
    if (assert(obj, 'object')) {
        if (includes) {
            return includes.every((i) => assert(obj, i, true)) ? obj : {};
        }
        return obj;
    }
    return {};
};

/**
 * Processes any deep data structure
 * @param {any} options 'props' supplied by external consumer or helpers provided for use
 * @param {*} parseEntity function that parses strings
 */
export const parseData = (parseEntity) => (value) => {
    if (assert(value, 'array')) {
        return value.map((v) => parseData(parseEntity)(v));
    }
    if (assert(value, 'object')) {
        return mapValues(value, parseData(parseEntity));
    }
    if (assert(value, 'string')) return parseEntity(value);
    return value;
};

export const applyFunctionsToDeepStructure = (config) => {
    /**
     * Flattens a deep, nested object to a path: value structure.
     */
    const deepKeys = index(config);
    /**
     * Creates a cache of parsed functions to reapply when options is updated.
     * {
     *  path: 'some.path.to.function',
     *  function: (options) => {}
     * }
     */
    const functionCache = Object.keys(deepKeys)
        .filter((k) => {
            return typeof get(config, k) === 'function';
        })
        .map((k) => {
            const fn = get(config, k);
            // const stringifiedFunction = fn.toString();
            // const callWithOptions = stringifiedFunction.startsWith(
            //   'function wrapFunctionWithOptions'
            // );
            return {
                path: k,
                function: fn,
            };
        });

    return (options) => {
        const [paths, values] = functionCache.reduce(
            (acc, cache) => {
                return [
                    [...acc[0], cache.path],
                    [...acc[1], cache.function(options)],
                ];
            },
            [[], []]
        );

        // Creates a new object that deeply maps the values to corresponding paths
        return zipObjectDeep(paths, values);
    };
};

const customizer = (overwriteWithNull) => (obj, src) => {
    if (typeof obj === 'function' && src === undefined) {
        return overwriteWithNull ? null : undefined;
    }
};

/**
 *
 * @param {*} config
 */
export const consumeFunctions = (config) => {

    const applyToStructure = applyFunctionsToDeepStructure(config);
    /**
     * Returns an updated meta object by applying updated options to parsed
     * inline functions
     * @param {*} options
     */
    const applyOptions = (
        options,
        updatedConfig,
        overwriteWithNull = false
    ) => {
        const configToUpdate = updatedConfig || config;
        const zipped = applyToStructure(options);
        return mergeWith(configToUpdate, zipped, customizer(overwriteWithNull));
    };

    return applyOptions;
};

const rehydrateFields = (meta, fieldsToRehydrate) => {
    return fieldsToRehydrate.reduce((acc, fieldToRehydrate) => {
        /**
         * Since a meta array can hold more than one meta config object,
         * use the first config as default.
         */
        const metaIndex = assert(fieldToRehydrate.metaIndex, 'number')
            ? fieldToRehydrate.metaIndex
            : 0;
        if (!acc[metaIndex]) return acc;
        return [
            ...acc.slice(0, metaIndex),
            {
                ...acc[metaIndex],
                fields: acc[metaIndex].fields.map((field) => {
                    if (field.key === fieldToRehydrate.key) {
                        return mergeWith(
                            field,
                            fieldToRehydrate,
                            customizer(false)
                        );
                    }

                    return field;
                }),
            },
            ...acc.slice(metaIndex + 1),
        ];
    }, meta);
};

export const consumeSideEffects = (config) => {
    const functionCache = (options) =>
        config.sideEffects
            .map((sideEffect) => {
                return {
                    function: sideEffect.when,
                    update: sideEffect.update,
                };
            })
            .reduce(
                (acc, cache) => [
                    ...acc,
                    ...cache.update[cache.function(options) ? 0 : 1].filter(
                        (i) => i
                    ),
                ],
                []
            );

    const onValuesChange = (options) => {
        // if (fieldsToClear) {
        //   return rehydrateFields(config.meta, []);
        // }

        // loop all cached, apply all values, get data that needs an update, merge into config
        const sideEffectsList = functionCache(options);
        if (sideEffectsList.length) {
            return rehydrateFields(config.meta, sideEffectsList);
        }
        return undefined;
    };

    return onValuesChange;
};

export const consumeStatusUpdates = (config) => {
    return (status, options = {}) => {
        if (status in config.status) {
            const statusOptions = consumeFunctions(config.status[status]);
            const statusUpdates = statusOptions(options);
            if (statusUpdates && statusUpdates.length) {
                return rehydrateFields(config.meta, statusUpdates);
            }
        }

        return undefined;
    };
};

export const consumeSchema = (config) => {
    const schemaOptions = consumeFunctions(config.schema);
    return (options) => schemaOptions(options, null, false);
};

export const getStatusResponse = (status) => {
    if (assert(status, 'string')) {
        return [status, {}];
    }
    if (assert(status, 'status', true)) {
        const props = omit(status, 'status');

        return [status.status, props];
    }
    return [null, {}];
};

export const getWidgetPaths = (meta, widgetName) => {
    const matchingPaths = [];
    meta.forEach((m, metaIdx) => {
        m?.fields?.forEach((f, fieldIdx) => {
            if (f?.widget === widgetName) {
                matchingPaths.push(
                    '[' + metaIdx + '].fields[' + fieldIdx + ']'
                );
            }
        });
    });
    return matchingPaths;
};

export const getWidgetPath = (meta, widgetName) => {
    const path = findPathDeep(meta, (value, key) => {
        return key === 'widget' && value === widgetName;
    });

    const matchingPaths = paths(meta, (value, key) => {
        return key === 'widget' && value === widgetName;
    });

    if (assert(path, 'string')) {
        return path.slice(0, path.length - '.widget'.length);
    }
};

export const zipWidget = (meta, path, value) => {
    const zipped = zipObjectDeep(path, value);
    return mergeWith(meta, zipped);
};

export const applyFieldToMetaConverter = (
    meta,
    pathToWidget,
    metaConverter
) => {
    const fields = get(meta, pathToWidget);
    return metaConverter(fields);
};

export const getStatus = (status, statusList) => {
    const normalizeStatus = normalizeArray(status).map((s) => {
        return assert(s, 'string') ? { status: s } : status;
    })[0];

    const normalizeStatusList = normalizeArray(statusList);

    return normalizeStatusList.includes(normalizeStatus.status);
};
