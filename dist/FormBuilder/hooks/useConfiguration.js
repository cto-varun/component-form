"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = require("react");
var _parseConfiguration = _interopRequireDefault(require("../utils/parseConfiguration"));
var _helpers = require("../utils/helpers");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const useConfiguration = function () {
  let config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  let presets = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const [isReadyToConsume, setIsReadyToConsume] = (0, _react.useState)(false);
  const applyOptions = (0, _react.useRef)();
  const getSchema = (0, _react.useRef)();
  const onValuesChange = (0, _react.useRef)();
  const onStatusChange = (0, _react.useRef)();
  const getWidgets = (0, _react.useRef)();
  const formProps = (0, _react.useRef)();
  (0, _react.useEffect)(() => {
    if (!applyOptions.current) {
      const {
        meta,
        schema,
        sideEffects,
        status,
        widgets,
        verticalLayout
      } = (0, _parseConfiguration.default)(config, presets);
      applyOptions.current = (0, _helpers.consumeFunctions)({
        meta
      });
      onValuesChange.current = (0, _helpers.consumeSideEffects)({
        meta,
        sideEffects
      });
      onStatusChange.current = (0, _helpers.consumeStatusUpdates)({
        meta,
        status
      });
      getSchema.current = (0, _helpers.consumeSchema)({
        schema
      });
      getWidgets.current = widgets;
      formProps.current = {
        ...verticalLayout,
        ...(config.formProps || {})
      };
      setIsReadyToConsume(true);
    }
  }, []);
  return {
    applyOptions: applyOptions.current,
    getSchema: getSchema.current,
    getWidgets: getWidgets.current,
    onValuesChange: onValuesChange.current,
    onStatusChange: onStatusChange.current,
    isReadyToConsume,
    formProps: formProps.current
  };
};
var _default = useConfiguration;
exports.default = _default;
module.exports = exports.default;