"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _find = _interopRequireDefault(require("lodash/find"));
var _antd = require("antd");
var _FormBuilderField = _interopRequireDefault(require("./FormBuilderField"));
require("./FormBuilder.css");
var _helpers = require("../utils/helpers");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
const widgetMap = {};
function getWidget(widget) {
  if (!widget) return null;
  if (typeof widget === 'string') {
    if (!widgetMap[widget] || !widgetMap[widget].widget) {
      return null;
    }
    return widgetMap[widget].widget;
  }
  return widget;
}
function normalizeMeta(meta) {
  let fields = (0, _helpers.assert)(meta, 'array') ? meta : meta.fields || meta.elements;
  if (!fields) fields = [meta];
  fields = fields.map(field => {
    const widget = getWidget(field.widget);
    const viewWidget = getWidget(field.viewWidget);
    const dynamic = field.dynamic !== false;
    // Find metaConvertor
    const item = (0, _find.default)(Object.values(widgetMap), entry => (entry.widget === widget || entry.widget === viewWidget) && entry.metaConvertor);
    if (item) {
      const newField = item.metaConvertor(field);
      if (!newField) {
        throw new Error(`metaConvertor of '${String(field.widget)}' must return a field`);
      }
      return {
        ...newField,
        viewWidget,
        widget,
        dynamic
      };
    }
    return {
      ...field,
      widget,
      viewWidget,
      dynamic
    };
  });
  if ((0, _helpers.assert)(meta, 'array') || !meta.fields && !meta.elements) {
    return {
      fields
    };
  }
  return {
    ...meta,
    fields
  };
}
function FormBuilder(props) {
  const {
    getMeta,
    form
  } = props;
  console.log(props, "these are form builder");
  const meta = getMeta ? getMeta(form, props) : props.meta;
  return /*#__PURE__*/_react.default.createElement(FormBuilderInner, _extends({}, props, {
    form: form ? form.current || form : null,
    meta: meta
  }));
}
function FormBuilderInner(props) {
  const {
    meta,
    viewMode,
    initialValues,
    disabled = false,
    form = null
  } = props;
  if (!meta) return null;
  const newMeta = normalizeMeta(meta);
  newMeta.viewMode = newMeta.viewMode || viewMode;
  newMeta.initialValues = newMeta.initialValues || initialValues;
  const {
    fields,
    columns = 1,
    gutter = 10
  } = newMeta;
  const elements = fields.map(field => /*#__PURE__*/_react.default.createElement(_FormBuilderField.default, {
    key: field.key,
    field: field,
    disabled: disabled,
    meta: newMeta,
    form: form
  }));
  if (columns === 1) {
    return elements;
  }
  const rows = [];
  // for each column , how many grid cols
  const spanUnit = 24 / columns;
  // eslint-disable-next-line
  for (let i = 0; i < elements.length;) {
    const cols = [];
    for

      // field doesn't need to start a new row
    (let j = 0; (j < columns || j === 0) &&
    // total col span is less than columns
    i < elements.length && (
    // element exist
    !['left', 'both'].includes(fields[i].clear) || j === 0);) {
      const fieldSpan = fields[i].colSpan || 1;
      cols.push(elements[i]?.props?.field?.hidden ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null) : /*#__PURE__*/_react.default.createElement(_antd.Col, {
        key: j,
        span: Math.min(24, spanUnit * fieldSpan)
      }, elements[i]));
      j += fieldSpan;
      if (['both', 'right'].includes(fields[i].clear)) {
        i += 1;
        break;
      }
      i += 1;
    }
    rows.push( /*#__PURE__*/_react.default.createElement(_antd.Row, {
      key: i,
      gutter: gutter
    }, cols));
  }
  return rows;
}
FormBuilder.defineWidget = function (name, widget) {
  let metaConvertor = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  if (!widgetMap[name]) {
    widgetMap[name] = {
      widget,
      metaConvertor
    };
  }
};
FormBuilder.useForceUpdate = () => {
  const [, updateState] = _react.default.useState();
  const forceUpdate = _react.default.useCallback(() => updateState({}), []);
  return forceUpdate;
};
var _default = FormBuilder;
exports.default = _default;
module.exports = exports.default;