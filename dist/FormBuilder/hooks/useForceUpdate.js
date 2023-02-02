"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = require("react");
const useForceUpdate = () => {
  const [, updateState] = (0, _react.useState)();
  return (0, _react.useCallback)(() => updateState({}), []);
};
var _default = useForceUpdate;
exports.default = _default;
module.exports = exports.default;