"use strict";

var _react = _interopRequireDefault(require("react"));
var _antd = require("antd");
var _FormBuilder = _interopRequireDefault(require("./FormBuilder"));
var _helpers = require("../utils/helpers");
var _componentCache = require("@ivoyant/component-cache");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const mapOptions = options => {
  if (!(0, _helpers.assert)(options, "array")) {
    throw new Error("Options should be array in form builder meta.");
  }
  return options.map(opt => {
    if ((0, _helpers.assert)(opt, "array")) {
      return {
        value: opt[0],
        label: opt[1]
      };
    }
    if ((0, _helpers.assert)(opt, "object")) {
      return opt;
    }
    return {
      value: opt,
      label: opt
    };
  });
};
_FormBuilder.default.defineWidget("checkbox", _antd.Checkbox, field => {
  return {
    ...field,
    valuePropName: "checked"
  };
});
_FormBuilder.default.defineWidget("switch", _antd.Switch, field => {
  return {
    ...field,
    valuePropName: "checked"
  };
});
_FormBuilder.default.defineWidget("button", _antd.Button);
_FormBuilder.default.defineWidget("input", _antd.Input);
_FormBuilder.default.defineWidget("password", _antd.Input.Password);
_FormBuilder.default.defineWidget("textarea", _antd.Input.TextArea);
_FormBuilder.default.defineWidget("number", _antd.InputNumber);
_FormBuilder.default.defineWidget("date-picker", _antd.DatePicker);
_FormBuilder.default.defineWidget("radio", _antd.Radio);
_FormBuilder.default.defineWidget("radio-group", _antd.Radio.Group, field => {
  const RadioComp = field.buttonGroup ? _antd.Radio.Button : _antd.Radio;
  const updatedCheckBoxOptions = Array.isArray(field?.options) ? field?.options : typeof field?.options === "function" ? field.options() : [];
  if (field.options && !field.children) {
    return {
      ...field,
      options: updatedCheckBoxOptions,
      widgetProps: {
        ...field.widgetProps,
        name: field.key
      },
      children: mapOptions(updatedCheckBoxOptions).map(opt => /*#__PURE__*/_react.default.createElement(RadioComp, {
        value: opt.value,
        key: opt.value
      }, opt.label))
    };
  }
  return field;
});
_FormBuilder.default.defineWidget("checkbox-group", _antd.Checkbox.Group, field => {
  const count = field?.formItemProps?.countToDisable;
  const linesToCancel = field?.formItemProps?.lineToCanceledInfo;
  const [selectedTablet, setSelectedTablet] = _react.default.useState([]);
  const updatedCheckBoxOptions = Array.isArray(field?.options) ? field?.options : typeof field?.options === "function" ? field.options() : [];
  let checkboxdata = mapOptions(updatedCheckBoxOptions).map(item => {
    return item;
  });
  let updatedDataWithModelInfo = [];
  const addModelInfo = () => {
    linesToCancel?.map(mo => {
      checkboxdata?.filter(cb => {
        if (mo?.tabletCtn === cb.value) {
          return updatedDataWithModelInfo?.push({
            ...cb,
            model: mo?.tabletInfo?.model
          });
        }
      });
    });
  };
  if (linesToCancel?.length > 0) {
    addModelInfo();
  }
  checkboxdata = updatedDataWithModelInfo;
  const [disabledLines, setDisabledLines] = _react.default.useState([]);
  const [updatedData, setUpdatedData] = _react.default.useState(checkboxdata);
  let checkBoxUpdatedData = checkboxdata && checkboxdata.map(item => {
    return {
      ...item,
      disabled: false
    };
  });
  const handleChange = e => {
    let updatedList = [...selectedTablet];
    if (e.target.checked) {
      updatedList = [...selectedTablet, e.target.value];
    } else {
      updatedList?.splice(selectedTablet?.indexOf(e.target.value), 1);
      setDisabledLines([]);
    }
    setSelectedTablet(updatedList);
  };
  let avaiableSelection = checkBoxUpdatedData?.filter(item => {
    return selectedTablet.indexOf(item.value) == -1;
  });
  _react.default.useEffect(() => {
    if (selectedTablet.length === count) {
      let disabledLines = avaiableSelection?.map(item => {
        return {
          ...item,
          disabled: true
        };
      });
      setDisabledLines(disabledLines);
    }
  }, [selectedTablet]);
  _react.default.useEffect(() => {
    checkBoxUpdatedData = checkBoxUpdatedData?.map(cb => disabledLines.find(dl => dl.value === cb.value) || cb);
    setUpdatedData(checkBoxUpdatedData);
  }, [disabledLines]);
  if (updatedCheckBoxOptions && !field.children) {
    return {
      ...field,
      options: updatedCheckBoxOptions,
      children: updatedData.map(opt => /*#__PURE__*/_react.default.createElement(_antd.Checkbox, {
        value: opt.value,
        key: opt.value,
        required: field?.formItemProps?.fieldRequired,
        onChange: handleChange,
        disabled: opt.disabled
      }, opt.label, " ", opt.model && /*#__PURE__*/_react.default.createElement("span", {
        style: {
          opacity: ".69"
        }
      }, "(", opt.model, ")")))
    };
  }
  return field;
});
_FormBuilder.default.defineWidget("select", _antd.Select, field => {
  const updatedOptions = Array.isArray(field?.options) ? field?.options : typeof field?.options === "function" ? field.options() : [];
  if (updatedOptions && !field.children) {
    return {
      ...field,
      children: mapOptions(updatedOptions || []).map(opt => /*#__PURE__*/_react.default.createElement(_antd.Select.Option, {
        label: opt.label,
        value: opt.value,
        key: opt.value,
        disabled: opt.disabled
      }, opt.children || opt.label))
    };
  }
  return field;
});