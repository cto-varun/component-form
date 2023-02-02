"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _antd = require("antd");
var _react = _interopRequireWildcard(require("react"));
var _AntdFormBuilder = _interopRequireDefault(require("./AntdFormBuilder"));
var _useConfiguration = _interopRequireDefault(require("./hooks/useConfiguration"));
var _useForceUpdate = _interopRequireDefault(require("./hooks/useForceUpdate"));
var _helpers = require("./utils/helpers");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
const onFinish = _ref => {
  let {
    getSchema,
    getSchemaCallback,
    options,
    status,
    setStatus,
    form
  } = _ref;
  return values => {
    const schema = getSchema({
      options,
      ...values
    });
    setStatus('pending');
    getSchemaCallback(schema, [status, setStatus], form);
  };
};
const MetaFormBuilder = _ref2 => {
  let {
    form,
    meta: metaArray
  } = _ref2;
  return metaArray.map((meta, index) => {
    if (meta.fieldsetTitle) {
      return /*#__PURE__*/_react.default.createElement("fieldset", {
        key: index,
        className: `fb__fieldset-title-${meta.fieldsetTitle}`
      }, /*#__PURE__*/_react.default.createElement("legend", null, meta.fieldsetTitle), /*#__PURE__*/_react.default.createElement(_AntdFormBuilder.default, {
        form: form,
        meta: meta
      }));
    }
    return /*#__PURE__*/_react.default.createElement(_AntdFormBuilder.default, {
      key: index,
      meta: meta
    });
  });
};
const FormBuilder = _ref3 => {
  let {
    config,
    options,
    presets,
    getSchema: getSchemaCallback,
    initialValues,
    status,
    setStatus
  } = _ref3;
  const [form] = _antd.Form.useForm();
  const forceUpdate = (0, _useForceUpdate.default)();
  const {
    applyOptions,
    isReadyToConsume,
    getSchema,
    onStatusChange,
    onValuesChange,
    getWidgets,
    formProps
  } = (0, _useConfiguration.default)(config, presets);
  const [cachedOptions, setCachedOptions] = (0, _react.useState)({
    ...options,
    form,
    forceUpdate,
    status,
    setStatus
  });
  const [cachedMeta, setCachedMeta] = (0, _react.useState)();
  const fieldsValue = (0, _react.useRef)();
  (0, _react.useEffect)(function onOptionsChange() {
    setCachedOptions(o => ({
      ...o,
      ...options,
      status
    }));
    forceUpdate();
  }, [options]);
  (0, _react.useEffect)(function applyOptionsEffect() {
    const updatedMeta = applyOptions && applyOptions(cachedOptions);
    if (updatedMeta) {
      const {
        meta
      } = updatedMeta;
      setCachedMeta(meta);
    }
    forceUpdate();
  }, [applyOptions, cachedOptions]);
  (0, _react.useEffect)(function statusChangeEffect() {
    if (status != null) {
      if ((0, _helpers.getStatus)(status, 'reset')) {
        form.resetFields();
        setStatus();
        forceUpdate();
        return;
      }
      const [formStatus, props] = (0, _helpers.getStatusResponse)(status);
      const meta = onStatusChange && onStatusChange(formStatus, {
        ...cachedOptions,
        ...props
      });
      if (meta) {
        setCachedMeta(meta);
        forceUpdate();
      }
    }
  }, [onStatusChange, status]);
  (0, _react.useEffect)(function defineWidgets() {
    if (isReadyToConsume) {
      getWidgets(_AntdFormBuilder.default);
    }
  }, [isReadyToConsume]);
  (0, _react.useEffect)(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      forceUpdate();
    }
  }, []);
  return cachedMeta ? /*#__PURE__*/_react.default.createElement(_antd.Form, _extends({}, formProps, {
    form: form,
    onFinish: onFinish({
      getSchema,
      getSchemaCallback,
      options: cachedOptions,
      status,
      setStatus,
      form
    }),
    onValuesChange: (_, values) => {
      fieldsValue.current = values;
      const meta = onValuesChange({
        ...values,
        options: cachedOptions
      });
      if (meta) {
        setCachedMeta(meta);
      }
      forceUpdate();
    }
  }), /*#__PURE__*/_react.default.createElement(MetaFormBuilder, {
    form: form,
    meta: cachedMeta
  })) : /*#__PURE__*/_react.default.createElement("div", {
    className: "fb__form--loading"
  }, /*#__PURE__*/_react.default.createElement(_antd.Spin, {
    tip: "Loading..."
  }));
};
var _default = FormBuilder;
exports.default = _default;
module.exports = exports.default;