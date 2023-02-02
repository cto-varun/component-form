"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getIndex;
var _getEachDeep = _interopRequireDefault(require("./getEachDeep.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function getIndex(_) {
  var eachDeep = (0, _getEachDeep.default)(_);
  function index(obj, options) {
    options = _.merge({
      checkCircular: false,
      includeCircularPath: true,
      leavesOnly: !options || options.childrenPath === undefined
    }, options || {});
    if (options && options.leafsOnly !== undefined) {
      options.leavesOnly = options.leafsOnly;
    }
    var eachDeepOptions = {
      pathFormat: 'string',
      checkCircular: options.checkCircular,
      ownPropertiesOnly: options.ownPropertiesOnly,
      includeRoot: options.includeRoot,
      childrenPath: options.childrenPath,
      rootIsChildren: options.rootIsChildren,
      leavesOnly: options.leavesOnly
    };
    var res = {};
    eachDeep(obj, function (value, key, parent, context) {
      if (!context.isCircular || options.includeCircularPath) {
        if (context.path !== undefined) {
          res[context.path] = value;
        }
      }
    }, eachDeepOptions);
    return res;
  }
  return index;
}
module.exports = exports.default;