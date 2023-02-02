"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _memoize = _interopRequireDefault(require("lodash/memoize"));
var _isArray = _interopRequireDefault(require("lodash/isArray"));
var _has = _interopRequireDefault(require("lodash/has"));
var _find = _interopRequireDefault(require("lodash/find"));
var _pick = _interopRequireDefault(require("lodash/pick"));
var _capitalize = _interopRequireDefault(require("lodash/capitalize"));
var _antd = require("antd");
var _QuestionIcon = _interopRequireDefault(require("./QuestionIcon"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
const FormItem = _antd.Form.Item;
const isV4 = !!_antd.Form.useForm;
const getValue = (obj, namePath) => {
  const arr = typeof namePath === 'string' ? namePath.split('.') : namePath;
  let current = obj;
  for (let i = 0; i < arr.length; i += 1) {
    if ((0, _has.default)(current, arr[i])) {
      current = current[arr[i]];
    } else {
      return undefined;
    }
  }
  return current;
};
const getWrappedComponentWithForwardRef = (0, _memoize.default)(Comp => /*#__PURE__*/(0, _react.forwardRef)((props, ref) => {
  return /*#__PURE__*/_react.default.createElement("span", {
    ref: ref
  }, /*#__PURE__*/_react.default.createElement(Comp, props));
}));
function FormBuilderField(props) {
  const {
    field,
    meta,
    form
  } = props;
  const label = field.tooltip ? /*#__PURE__*/_react.default.createElement("span", null, field.label, /*#__PURE__*/_react.default.createElement(_antd.Tooltip, {
    title: field.tooltip
  }, ' ', /*#__PURE__*/_react.default.createElement(_QuestionIcon.default, null))) : field.label;
  let formItemLayout = field.formItemLayout || (field.label ? getValue(meta, 'formItemLayout') || [8, 16] : null);
  if ((0, _isArray.default)(formItemLayout) && formItemLayout.length >= 2) {
    formItemLayout = {
      labelCol: {
        span: formItemLayout[0]
      },
      wrapperCol: {
        span: formItemLayout[1]
      }
    };
  }
  const isFieldViewMode = meta.viewMode || field.viewMode || field.readOnly;
  const formItemProps = {
    key: field.key,
    colon: meta.colon,
    ...(meta.formItemLayout !== null ? formItemLayout : {}),
    label,
    ...(0, _pick.default)(field, ['help', 'extra', 'labelCol', 'wrapperCol', 'colon', 'htmlFor', 'noStyle', 'validateStatus', 'hasFeedback']),
    ...field.formItemProps,
    className: `${meta.viewMode ? `ant-form-item-view-mode${isV4 ? ' ant-form-item-view-mode-v4' : ''}` : ''} ${field.className || field.formItemProps && field.formItemProps.className}`
  };
  if (isV4) {
    if (field.key || field.name) {
      formItemProps.name = field.name || field.key.split('.');
    }
    Object.assign(formItemProps, {
      noStyle: field.noFormItem || field.noStyle,
      ...(0, _pick.default)(field, ['shouldUpdate', 'dependencies'])
    });
  }
  if (field.label && typeof field.label === 'string') {
    formItemProps['data-label'] = field.label; // help e2e test
  }

  if (field.colSpan && formItemProps.labelCol && !field.formItemLayout) {
    const labelCol = Math.round(formItemProps.labelCol.span / field.colSpan);
    Object.assign(formItemProps, {
      labelCol: {
        span: labelCol
      },
      wrapperCol: {
        span: 24 - labelCol
      }
    });
  }
  if (field.render) {
    return field.render.call(this, {
      formItemProps,
      field,
      form,
      ...(0, _pick.default)(props, ['disabled', 'viewMode', 'initialValues'])
    });
  }
  let initialValue;
  const initialValues = meta.initialValues || {};
  if ((0, _has.default)(field, 'initialValue')) {
    initialValue = field.initialValue;
  } else if (field.getInitialValue) {
    initialValue = field.getInitialValue(field, initialValues, form);
  } else {
    initialValue = getValue(initialValues, field.name || field.key);
  }

  // Handle field props
  let rules = field?.noValidation ? [] : field?.rules?.length ? [...(field.rules || [])] : [];
  if (field.required) {
    rules.unshift({
      required: true,
      message: field.message || field.requiredMessage || undefined
    });
  }
  const fieldProps = {
    initialValue,
    preserve: meta.preserve,
    ...(0, _pick.default)(field, ['getValueFromEvent', 'getValueProps', 'normalize', 'trigger', 'preserve', 'valuePropName', 'validateTrigger', 'validateFirst']),
    rules,
    ...field.fieldProps
  };
  if (isV4) {
    Object.assign(formItemProps, fieldProps);
  }
  if (isFieldViewMode) {
    let viewEle = null;
    const formValues = form ? isV4 ? form.getFieldsValue(true) : form.getFieldsValue() : {};
    let viewValue = (0, _has.default)(formValues, field.key || field.name.join('.')) ? getValue(formValues, formItemProps.name || field.key) : initialValue;
    if (field.renderView) {
      viewEle = field.renderView(viewValue, form, initialValues);
    } else if (field.viewWidget) {
      const ViewWidget = field.viewWidget;
      viewEle = /*#__PURE__*/_react.default.createElement(ViewWidget, _extends({
        value: viewValue,
        form: form,
        field: field
      }, field.viewWidgetProps));
    } else if (field.link) {
      const href = typeof field.link === 'string' ? field.link : viewValue;
      viewEle = /*#__PURE__*/_react.default.createElement("a", {
        href: href,
        target: field.linkTarget || '_self'
      }, viewValue);
    } else if (field.options) {
      // a little hacky here, if a field is select/options like, auto use label for value
      const found = (0, _find.default)(field.options, opt => opt[0] === viewValue);
      if (found) {
        viewValue = found[1];
      }
    } else if (field?.widgetProps?.alert) {
      viewEle = /*#__PURE__*/_react.default.createElement(_antd.Alert, {
        message: field?.initialValue,
        type: field?.widgetProps?.alertType,
        showIcon: field?.widgetProps?.showAlertIcon,
        closable: field?.widgetProps?.closableAlert
      });
    }
    if (!viewEle) {
      if (typeof viewValue === 'boolean') viewEle = (0, _capitalize.default)(String(viewValue));else if (viewValue === undefined) viewEle = 'N/A';else {
        viewEle = /*#__PURE__*/_react.default.createElement("span", {
          className: "antd-form-builder-string-content"
        }, String(viewValue) || '');
      }
    }

    // TODO: readOnly seems to be the same with viewMode in antd v4
    if (form && field.readOnly) {
      const ele = /*#__PURE__*/_react.default.createElement("span", {
        className: "antd-form-builder-read-only-content"
      }, viewEle);
      return /*#__PURE__*/_react.default.createElement(FormItem, formItemProps, isV4 ? ele : form.getFieldDecorator(field.id || field.key, fieldProps)(ele));
    }
    delete formItemProps.name;
    delete formItemProps.key;
    return /*#__PURE__*/_react.default.createElement(FormItem, formItemProps, viewEle);
  }

  // Handle widget props
  const wp = field.widgetProps || {};
  const widgetProps = {
    ...(0, _pick.default)(field, ['placeholder', 'type', 'className', 'class', 'onChange']),
    disabled: field.disabled || meta.disabled || props.disabled,
    ...wp
  };
  let FieldWidget = field.widget || _antd.Input;
  if (field.forwardRef) {
    FieldWidget = getWrappedComponentWithForwardRef(FieldWidget);
  }
  const valueProps = {};
  const ele = /*#__PURE__*/_react.default.createElement(FieldWidget, _extends({}, widgetProps, valueProps), field.children || null);
  const ele2 = isV4 ? ele : form.getFieldDecorator(field.id || field.key, fieldProps)(ele);
  if (isV4) {
    // antd v4 always has form item
    return /*#__PURE__*/_react.default.createElement(FormItem, formItemProps, ele);
  }
  return field.noFormItem || field.noStyle ? ele2 : /*#__PURE__*/_react.default.createElement(FormItem, formItemProps, ele2);
}
var _default = FormBuilderField;
exports.default = _default;
module.exports = exports.default;