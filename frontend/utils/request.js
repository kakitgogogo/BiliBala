var utils = require('./util');

var noop = function noop() {};

var RequestError = (function () {
  function RequestError(message) {
    Error.call(this, message);
    this.message = message;
  }

  RequestError.prototype = new Error();
  RequestError.prototype.constructor = RequestError;

  return RequestError;
})();

function request(options) {
  if(typeof options !== 'object') {
    var message = '请求传参应为 object 类型，但实际传了 ' + (typeof options) + ' 类型';
    throw new RequestError(message);
  }

  var success = options.success || noop;
  var fail = options.fail || noop;
  var complete = options.complete || noop;

  var callSuccess = function () {
    success.apply(null, arguments);
    complete.apply(null, arguments);
  }

  var callFail = function (error) {
    fail.call(null, error);
    complete.call(null, error);
  }

  doRequest();

  function doRequest() {
    wx.request(utils.extend({}, options, {
      success: function (response) {
        if (response.data) {
          var data = response.data
          if (data.status !== 0) {
            message = data.msg || '未知错误';
            error = new RequestError(message);
          } else {
            callSuccess.apply(null, arguments);
            return;
          }
        } else {
          var errorMessage = '请求没有包含会话响应，请确保服务器处理 `' + options.url + '` 的时候输出结果';
          var error = new RequestError(errorMessage);
          options.fail(error);
        }
        callFail(error);
      },

      fail: callFail,
      complete: noop,
    }));
  }
}

module.exports = {
  RequestError: RequestError,
  request: request
}