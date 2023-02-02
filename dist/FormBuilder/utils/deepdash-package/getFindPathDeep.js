"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getFindPathDeep;
var _getFindDeep = _interopRequireDefault(require("./getFindDeep.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function getFindPathDeep(_) {
  const findDeep = (0, _getFindDeep.default)(_);
  function findPathDeep(obj, predicate, options) {
    const res = findDeep(obj, predicate, options);
    return res && res.context.path;
  }
  return findPathDeep;
}
module.exports = exports.default;