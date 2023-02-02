"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _merge = _interopRequireDefault(require("lodash/merge"));
var _omit = _interopRequireDefault(require("lodash/omit"));
var _parserTokens = _interopRequireDefault(require("./parserTokens"));
var _helpers = require("./helpers");
var _parseEntity = _interopRequireDefault(require("./parseEntity"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/** **************************
 * META NORMALIZATION HELPERS
 *
 */

const normalizeUpdateFields = (key, updatesArray) => {
  return updatesArray.map(updateObject => {
    if (!updateObject) return updateObject;
    return {
      ...updateObject,
      key
    };
  });
};
const normalizeUpdateObject = (key, update) => {
  const empty = [null, null];
  if ((0, _helpers.assert)(update, 'object')) {
    return normalizeUpdateFields(key, [update, null]);
  }
  if ((0, _helpers.assert)(update, 'array')) {
    return normalizeUpdateFields(key, empty.map((pos, index) => {
      if (update[index]) return update[index];
      return pos;
    }));
  }
  return empty;
};
const normalizeUpdate = update => {
  if (!(0, _helpers.assert)(update, 'object')) return [];
  return Object.keys(update).reduce((acc, key) => {
    const updateObject = update[key];
    const [updateOnTrue, updateOnFalse] = normalizeUpdateObject(key, updateObject);
    return [[...acc[0], updateOnTrue].filter(i => i), [...acc[1], updateOnFalse].filter(i => i)];
  }, [[], []]);
};
const handlePreset = (presets, parseEntity, _ref) => {
  let {
    PARSE_KEY
  } = _ref;
  return function (value) {
    let consume = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    debugger;
    if ((0, _helpers.assert)(value, 'string')) {
      const preset = value;
      if (preset.startsWith(PARSE_KEY)) {
        return consume ? parseEntity(preset)(presets) : parseEntity(preset);
      }
    }
    if ((0, _helpers.assert)(value?.preset, 'string')) {
      const {
        preset
      } = value;
      if (preset.startsWith(PARSE_KEY)) {
        return consume ? parseEntity(preset)(presets) : parseEntity(preset);
      }
    }
    return value;
  };
};
const fieldIsObject = item => (0, _helpers.assert)(item, 'object');
const fieldHasKey = item => (0, _helpers.assert)(item, 'key', true);
const combineClassNames = function (baseClassName) {
  let userClassName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  return `${baseClassName}${userClassName ? ` ${userClassName}` : ''}`;
};
const normalizeFieldKeys = function () {
  let prefixFieldKey = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  return field => {
    const widgetName = field.widget || 'input';
    const prefix = prefixFieldKey.length ? `${prefixFieldKey}_` : '';
    const newKey = `${prefix}${field.key}`;
    return (0, _merge.default)(field, {
      key: newKey,
      formItemProps: {
        className: combineClassNames(`fb__form-item-element form-item-element--${newKey}`, field.formItemProps?.className)
      },
      widgetProps: {
        className: combineClassNames(`fb__widget-element fb__widget-element--${widgetName} widget-element--${newKey}`, field.widgetProps?.className)
      }
    });
  };
};
const normalizeFields = (prefixFieldKey, getPreset, presets) => meta => {
  const gp = value => getPreset(value, false);
  return {
    ...meta,
    fields: (0, _helpers.normalizeArray)(getPreset(meta.fields)).map(field => {
      let fieldPresets = (0, _helpers.parseData)(gp)(field);
      if (typeof fieldPresets === 'function') {
        fieldPresets = fieldPresets(presets);
      }
      if (typeof fieldPresets?.preset === 'function') {
        fieldPresets.preset = fieldPresets.preset(presets);
      }
      if (fieldPresets?.preset) {
        return (0, _omit.default)({
          ...fieldPresets.preset,
          ...fieldPresets
        }, ['preset']);
      }
      return fieldPresets;
    }).filter(field => fieldIsObject(field) && fieldHasKey(field)).map(normalizeFieldKeys(prefixFieldKey))
  };
};
/**
 * END META NORMALIZATION HELPERS
 ********************************
 */

/**
 *
 * @param {*} config
 * @param {*} param1
 * @param {*} parseEntity
 * @param {*} presets
 */
const getMeta = (config, parseEntity, getPreset, presets) => {
  const meta = (0, _helpers.normalizeArray)(getPreset(config.meta));
  // Normalize presets and field presets
  const presetNormalizedMeta = meta.map(getPreset).filter(fieldIsObject).map(normalizeFields(config.prefixFieldKey, getPreset, presets));
  return presetNormalizedMeta.map(normalizedMeta => (0, _helpers.parseData)(parseEntity)(normalizedMeta));
};

/**
 * sideEffects: {
 *    when: "@@() => 2 + 2",
 *    update: []
 * }
 * @param {*} config
 * @param {*} parserTokens
 * @param {*} parseEntity
 * @param {*} presets
 */
const getSideEffects = (config, parseEntity, getPreset) => {
  const normalizedSideEffects = (0, _helpers.normalizeArray)(getPreset(config.sideEffects));
  const getValue = (0, _helpers.parseData)(parseEntity);
  return normalizedSideEffects.reduce((acc, sideEffect) => {
    const normalizedEffect = (0, _helpers.normalizeObject)(getPreset(sideEffect), ['when', 'update']);
    const when = getValue(normalizedEffect.when);
    const update = getValue(normalizeUpdate(getPreset(normalizedEffect.update)));
    if (update.length && (0, _helpers.assert)(when, 'function')) {
      return [...acc, {
        when,
        update
      }];
    }
    return acc;
  }, []);
};
const getStatus = (config, parseEntity, getPreset) => {
  const getValues = (0, _helpers.parseData)(parseEntity);
  const normalizedStatusConfig = (0, _helpers.normalizeObject)(getPreset(config.status));
  return Object.keys(normalizedStatusConfig).reduce((acc, status) => {
    const statusUpdates = (0, _helpers.normalizeObject)(getPreset(normalizedStatusConfig[status]));
    const statusUpdateKeys = Object.keys(statusUpdates);
    const normalizedStatus = statusUpdateKeys.map(key => {
      const normalizedUpdate = (0, _helpers.normalizeObject)(getPreset(statusUpdates[key]));
      if (Object.keys(normalizedUpdate).length) {
        return {
          ...normalizedUpdate,
          key
        };
      }
      return null;
    }).filter(i => i);
    const update = getValues(normalizedStatus);
    if (update.length) {
      return {
        ...acc,
        [status]: update
      };
    }
    return acc;
  }, {});
};
const getSchema = (config, parseEntity) => {
  const parser = v => parseEntity(v, {
    noPresets: true
  });
  const getValue = (0, _helpers.parseData)(parser);
  const normalizedSchema = (0, _helpers.normalizeObject)(config.schema);
  return getValue(normalizedSchema);
};
const getWidgets = (meta, presets, parseEntity) => {
  const getValue = (0, _helpers.parseData)(parseEntity);
  const normalizedWidgets = (0, _helpers.normalizeObject)((0, _helpers.normalizeObject)(presets, ['widgets']).widgets);
  const widgetList = Object.keys(normalizedWidgets);
  const widgetPaths = [];
  const widgetFields = [];
  const widgetMap = widgetList.reduce((acc, widgetName) => {
    const widget = (0, _helpers.normalizeObject)(normalizedWidgets[widgetName], ['component', 'metaConverter']);
    //const pathToWidget = getWidgetPath(meta, widgetName);
    const pathToWidgets = (0, _helpers.getWidgetPaths)(meta, widgetName);
    if (pathToWidgets && pathToWidgets.length > 0 && (0, _helpers.assert)(widget.component, 'function') && (0, _helpers.assert)(widget.metaConverter, 'function')) {
      pathToWidgets.forEach(path => {
        const newField = getValue((0, _helpers.applyFieldToMetaConverter)(meta, path, widget.metaConverter));
        widgetFields.push(newField);
        widgetPaths.push(path);
      });
      return [...acc, {
        widget: widgetName,
        component: widget.component
      }];
    }
    return acc;
  }, []);
  const updatedMeta = (0, _helpers.zipWidget)(meta, widgetPaths, widgetFields);
  return {
    widgets: instance => {
      widgetMap.forEach(_ref2 => {
        let {
          widget,
          component
        } = _ref2;
        instance.defineWidget(widget, component);
      });
    },
    updatedMeta
  };
};
const parseConfiguration = function () {
  let config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  let presets = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const parserTokens = (0, _parserTokens.default)(config);
  const parseEntity = (0, _parseEntity.default)(parserTokens, presets);
  const getPreset = handlePreset(presets, parseEntity, parserTokens);
  const meta = getMeta(config, parseEntity, getPreset);
  const schema = getSchema(config, parseEntity);
  const sideEffects = getSideEffects(config, parseEntity, getPreset);
  const status = getStatus(config, parseEntity, getPreset);
  const {
    widgets,
    updatedMeta
  } = getWidgets(meta, presets, parseEntity);
  let verticalLayout = {};
  updatedMeta.forEach(singleMeta => {
    if (!singleMeta.formItemLayout) {
      singleMeta.formItemLayout = null;
      verticalLayout = {
        layout: 'vertical'
      };
    }
  });
  return {
    meta: updatedMeta,
    schema,
    sideEffects,
    status,
    widgets,
    verticalLayout
  };
};
var _default = parseConfiguration;
exports.default = _default;
module.exports = exports.default;