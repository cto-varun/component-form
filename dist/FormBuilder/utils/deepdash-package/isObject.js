'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}
var _default = isObject;
exports.default = _default;
module.exports = exports.default;