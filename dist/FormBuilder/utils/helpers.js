"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.zipWidget = exports.parseData = exports.normalizeObject = exports.normalizeArray = exports.getWidgetPaths = exports.getWidgetPath = exports.getStatusResponse = exports.getStatus = exports.consumeStatusUpdates = exports.consumeSideEffects = exports.consumeSchema = exports.consumeFunctions = exports.assert = exports.applyFunctionsToDeepStructure = exports.applyFieldToMetaConverter = void 0;
var _get = _interopRequireDefault(require("lodash/get"));
var _mapValues = _interopRequireDefault(require("lodash/mapValues"));
var _mergeWith = _interopRequireDefault(require("lodash/mergeWith"));
var _omit = _interopRequireDefault(require("lodash/omit"));
var _zipObjectDeep = _interopRequireDefault(require("lodash/zipObjectDeep"));
var _getIndex = _interopRequireDefault(require("./deepdash-package/getIndex"));
var _getFindPathDeep = _interopRequireDefault(require("./deepdash-package/getFindPathDeep"));
var _getPaths = _interopRequireDefault(require("./deepdash-package/getPaths"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const isArray = v => Array.isArray(v);
const isObject = obj => obj && typeof obj === 'object' && obj.constructor === Object;
const isString = v => typeof v === 'string';
const hasProperty = (obj, property) => isObject(obj) && (0, _get.default)(obj, property);

/**
 *
 * @param {any} v value to compare
 * @param {string} type type to compare or object property to lookup
 * @param {boolean} isPropertyType
 */
const assert = function (v, type) {
  let isPropertyType = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  switch (type) {
    case 'string':
      {
        return isString(v);
      }
    case 'array':
      {
        return isArray(v);
      }
    case 'object':
      {
        return isObject(v);
      }
    case 'null-like':
      {
        return !v;
      }
    default:
      {
        if (isPropertyType) {
          return hasProperty(v, type);
        }
        return typeof v === type;
      }
  }
};
exports.assert = assert;
const normalizeArray = arr => {
  if (assert(arr, 'array')) {
    return arr;
  }
  return [arr];
};
exports.normalizeArray = normalizeArray;
const normalizeObject = (obj, includes) => {
  if (assert(obj, 'object')) {
    if (includes) {
      return includes.every(i => assert(obj, i, true)) ? obj : {};
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
exports.normalizeObject = normalizeObject;
const parseData = parseEntity => value => {
  if (assert(value, 'array')) {
    return value.map(v => parseData(parseEntity)(v));
  }
  if (assert(value, 'object')) {
    return (0, _mapValues.default)(value, parseData(parseEntity));
  }
  if (assert(value, 'string')) return parseEntity(value);
  return value;
};
exports.parseData = parseData;
const applyFunctionsToDeepStructure = config => {
  /**
   * Flattens a deep, nested object to a path: value structure.
   */
  const deepKeys = (0, _getIndex.default)(config);
  /**
   * Creates a cache of parsed functions to reapply when options is updated.
   * {
   *  path: 'some.path.to.function',
   *  function: (options) => {}
   * }
   */
  const functionCache = Object.keys(deepKeys).filter(k => {
    return typeof (0, _get.default)(config, k) === 'function';
  }).map(k => {
    const fn = (0, _get.default)(config, k);
    // const stringifiedFunction = fn.toString();
    // const callWithOptions = stringifiedFunction.startsWith(
    //   'function wrapFunctionWithOptions'
    // );
    return {
      path: k,
      function: fn
    };
  });
  return options => {
    const [paths, values] = functionCache.reduce((acc, cache) => {
      return [[...acc[0], cache.path], [...acc[1], cache.function(options)]];
    }, [[], []]);

    // Creates a new object that deeply maps the values to corresponding paths
    return (0, _zipObjectDeep.default)(paths, values);
  };
};
exports.applyFunctionsToDeepStructure = applyFunctionsToDeepStructure;
const customizer = overwriteWithNull => (obj, src) => {
  if (typeof obj === 'function' && src === undefined) {
    return overwriteWithNull ? null : undefined;
  }
};

/**
 *
 * @param {*} config
 */
const consumeFunctions = config => {
  const applyToStructure = applyFunctionsToDeepStructure(config);
  /**
   * Returns an updated meta object by applying updated options to parsed
   * inline functions
   * @param {*} options
   */
  const applyOptions = function (options, updatedConfig) {
    let overwriteWithNull = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    const configToUpdate = updatedConfig || config;
    const zipped = applyToStructure(options);
    return (0, _mergeWith.default)(configToUpdate, zipped, customizer(overwriteWithNull));
  };
  return applyOptions;
};
exports.consumeFunctions = consumeFunctions;
const rehydrateFields = (meta, fieldsToRehydrate) => {
  return fieldsToRehydrate.reduce((acc, fieldToRehydrate) => {
    /**
     * Since a meta array can hold more than one meta config object,
     * use the first config as default.
     */
    const metaIndex = assert(fieldToRehydrate.metaIndex, 'number') ? fieldToRehydrate.metaIndex : 0;
    if (!acc[metaIndex]) return acc;
    return [...acc.slice(0, metaIndex), {
      ...acc[metaIndex],
      fields: acc[metaIndex].fields.map(field => {
        if (field.key === fieldToRehydrate.key) {
          return (0, _mergeWith.default)(field, fieldToRehydrate, customizer(false));
        }
        return field;
      })
    }, ...acc.slice(metaIndex + 1)];
  }, meta);
};
const consumeSideEffects = config => {
  const functionCache = options => config.sideEffects.map(sideEffect => {
    return {
      function: sideEffect.when,
      update: sideEffect.update
    };
  }).reduce((acc, cache) => [...acc, ...cache.update[cache.function(options) ? 0 : 1].filter(i => i)], []);
  const onValuesChange = options => {
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
exports.consumeSideEffects = consumeSideEffects;
const consumeStatusUpdates = config => {
  return function (status) {
    let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
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
exports.consumeStatusUpdates = consumeStatusUpdates;
const consumeSchema = config => {
  const schemaOptions = consumeFunctions(config.schema);
  return options => schemaOptions(options, null, false);
};
exports.consumeSchema = consumeSchema;
const getStatusResponse = status => {
  if (assert(status, 'string')) {
    return [status, {}];
  }
  if (assert(status, 'status', true)) {
    const props = (0, _omit.default)(status, 'status');
    return [status.status, props];
  }
  return [null, {}];
};
exports.getStatusResponse = getStatusResponse;
const getWidgetPaths = (meta, widgetName) => {
  const matchingPaths = [];
  meta.forEach((m, metaIdx) => {
    m?.fields?.forEach((f, fieldIdx) => {
      if (f?.widget === widgetName) {
        matchingPaths.push('[' + metaIdx + '].fields[' + fieldIdx + ']');
      }
    });
  });
  return matchingPaths;
};
exports.getWidgetPaths = getWidgetPaths;
const getWidgetPath = (meta, widgetName) => {
  const path = (0, _getFindPathDeep.default)(meta, (value, key) => {
    return key === 'widget' && value === widgetName;
  });
  const matchingPaths = (0, _getPaths.default)(meta, (value, key) => {
    return key === 'widget' && value === widgetName;
  });
  if (assert(path, 'string')) {
    return path.slice(0, path.length - '.widget'.length);
  }
};
exports.getWidgetPath = getWidgetPath;
const zipWidget = (meta, path, value) => {
  const zipped = (0, _zipObjectDeep.default)(path, value);
  return (0, _mergeWith.default)(meta, zipped);
};
exports.zipWidget = zipWidget;
const applyFieldToMetaConverter = (meta, pathToWidget, metaConverter) => {
  const fields = (0, _get.default)(meta, pathToWidget);
  return metaConverter(fields);
};
exports.applyFieldToMetaConverter = applyFieldToMetaConverter;
const getStatus = (status, statusList) => {
  const normalizeStatus = normalizeArray(status).map(s => {
    return assert(s, 'string') ? {
      status: s
    } : status;
  })[0];
  const normalizeStatusList = normalizeArray(statusList);
  return normalizeStatusList.includes(normalizeStatus.status);
};
exports.getStatus = getStatus;