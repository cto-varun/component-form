import React from "react";
import {
  Input,
  Checkbox,
  Switch,
  Button,
  Select,
  InputNumber,
  Radio,
  DatePicker,
} from "antd";

import FormBuilder from "./FormBuilder";
import { assert } from "../utils/helpers";

import { cache } from "@ivoyant/component-cache";

const mapOptions = (options) => {
  if (!assert(options, "array")) {
    throw new Error("Options should be array in form builder meta.");
  }
  return options.map((opt) => {
    if (assert(opt, "array")) {
      return { value: opt[0], label: opt[1] };
    }
    if (assert(opt, "object")) {
      return opt;
    }
    return { value: opt, label: opt };
  });
};

FormBuilder.defineWidget("checkbox", Checkbox, (field) => {
  return { ...field, valuePropName: "checked" };
});

FormBuilder.defineWidget("switch", Switch, (field) => {
  return { ...field, valuePropName: "checked" };
});

FormBuilder.defineWidget("button", Button);
FormBuilder.defineWidget("input", Input);
FormBuilder.defineWidget("password", Input.Password);
FormBuilder.defineWidget("textarea", Input.TextArea);
FormBuilder.defineWidget("number", InputNumber);
FormBuilder.defineWidget("date-picker", DatePicker);
FormBuilder.defineWidget("radio", Radio);
FormBuilder.defineWidget("radio-group", Radio.Group, (field) => {
  const RadioComp = field.buttonGroup ? Radio.Button : Radio;

  const updatedCheckBoxOptions = Array.isArray(field?.options)
    ? field?.options
    : typeof field?.options === "function"
    ? field.options()
    : [];

  if (field.options && !field.children) {
    return {
      ...field,
      options: updatedCheckBoxOptions,
      widgetProps: {
        ...field.widgetProps,
        name: field.key,
      },
      children: mapOptions(updatedCheckBoxOptions).map((opt) => (
        <RadioComp value={opt.value} key={opt.value}>
          {opt.label}
        </RadioComp>
      )),
    };
  }
  return field;
});

FormBuilder.defineWidget("checkbox-group", Checkbox.Group, (field) => {
  const count = field?.formItemProps?.countToDisable;
  const linesToCancel = field?.formItemProps?.lineToCanceledInfo;
  const [selectedTablet, setSelectedTablet] = React.useState([]);

  const updatedCheckBoxOptions = Array.isArray(field?.options)
    ? field?.options
    : typeof field?.options === "function"
    ? field.options()
    : [];

  let checkboxdata = mapOptions(updatedCheckBoxOptions).map((item) => {
    return item;
  });
  let updatedDataWithModelInfo = [];

  const addModelInfo = () => {
    linesToCancel?.map((mo) => {
      checkboxdata?.filter((cb) => {
        if (mo?.tabletCtn === cb.value) {
          return updatedDataWithModelInfo?.push({
            ...cb,
            model: mo?.tabletInfo?.model,
          });
        }
      });
    });
  };
  if (linesToCancel?.length > 0) {
    addModelInfo();
  }
  checkboxdata = updatedDataWithModelInfo;

  const [disabledLines, setDisabledLines] = React.useState([]);
  const [updatedData, setUpdatedData] = React.useState(checkboxdata);

  let checkBoxUpdatedData =
    checkboxdata &&
    checkboxdata.map((item) => {
      return { ...item, disabled: false };
    });

  const handleChange = (e) => {
    let updatedList = [...selectedTablet];

    if (e.target.checked) {
      updatedList = [...selectedTablet, e.target.value];
    } else {
      updatedList?.splice(selectedTablet?.indexOf(e.target.value), 1);
      setDisabledLines([]);
    }
    setSelectedTablet(updatedList);
  };

  let avaiableSelection = checkBoxUpdatedData?.filter((item) => {
    return selectedTablet.indexOf(item.value) == -1;
  });

  React.useEffect(() => {
    if (selectedTablet.length === count) {
      let disabledLines = avaiableSelection?.map((item) => {
        return { ...item, disabled: true };
      });
      setDisabledLines(disabledLines);
    }
  }, [selectedTablet]);

  React.useEffect(() => {
    checkBoxUpdatedData = checkBoxUpdatedData?.map(
      (cb) => disabledLines.find((dl) => dl.value === cb.value) || cb
    );
    setUpdatedData(checkBoxUpdatedData);
  }, [disabledLines]);

  if (updatedCheckBoxOptions && !field.children) {
    return {
      ...field,
      options: updatedCheckBoxOptions,
      children: updatedData.map((opt) => (
        <Checkbox
          value={opt.value}
          key={opt.value}
          required={field?.formItemProps?.fieldRequired}
          onChange={handleChange}
          disabled={opt.disabled}
        >
          {opt.label}{" "}
          {opt.model && <span style={{ opacity: ".69" }}>({opt.model})</span>}
        </Checkbox>
      )),
    };
  }
  return field;
});
FormBuilder.defineWidget("select", Select, (field) => {
  const updatedOptions = Array.isArray(field?.options)
    ? field?.options
    : typeof field?.options === "function"
    ? field.options()
    : [];
  if (updatedOptions && !field.children) {
    return {
      ...field,
      children: mapOptions(updatedOptions || []).map((opt) => (
        <Select.Option
          label={opt.label}
          value={opt.value}
          key={opt.value}
          disabled={opt.disabled}
        >
          {opt.children || opt.label}
        </Select.Option>
      )),
    };
  }
  return field;
});
