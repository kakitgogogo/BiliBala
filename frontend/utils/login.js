var utils = require('./util');
var config = require('../config');
var session = require('./session');

var LoginError = (function () {
  function LoginError(message) {
    Error.call(this, message);
    this.message = message;
  }

  LoginError.prototype = new Error();
  LoginError.prototype.constructor = LoginError;

  return LoginError;
})();

var getWxLoginResult = function (callback) {
  wx.login({
    success: function (loginResult) {
      wx.getUserInfo({
        success: function (userInfoResult) {
          callback(null, {
            code: loginResult.code,
            signature: userInfoResult.signature,
            rawData: userInfoResult.rawData,
            userInfo: userInfoResult.userInfo,
            encryptedData: userInfoResult.encryptedData,
            iv: userInfoResult.iv
          })
        },
        fail: function (userError) {
          var error = new LoginError('获取微信用户信息失败，请检查网络状态');
          error.detail = userError;
          callback(error, null);
        }
      });
    },
    fail: function (userError) {
      var error = new LoginError('获取微信用户信息失败，请检查网络状态');
      error.detail = userError;
      callback(error, null);
    }
  });
};

var noop = function () {};
var defaultOptions = {
  method: "POST",
  success: noop,
  fail: noop,
  loginUrl: config.service.loginUrl
};

var login = function (options) {
  options = utils.extend({}, defaultOptions, options);

  var doLogin = () => getWxLoginResult(function (wxLoginError, wxLoginResult) {
    if(wxLoginError) {
      options.fail(wxLoginError);
      return;
    }

    var code = wxLoginResult.code;
    var signature = wxLoginResult.signature;
    var rawData = wxLoginResult.rawData;
    var userInfo = wxLoginResult.userInfo;
    var encryptedData = wxLoginResult.encryptedData;
    var iv = wxLoginResult.iv;

    //console.log('code: '+code);
    //console.log('encrytedData: '+encryptedData);
    //console.log('iv: '+iv);

    wx.request({
      url: options.loginUrl,
      method: options.method,
      data: {
        code: code,
        //rawData: rawData,
        //signature: signature,
        encrytedData: encryptedData,
        iv: iv
      },
      success: function (result) {
        var data = result.data;

        if(data) {
          if(data.status === 0) {
            var sessionRes = {
              sessionKey: data.sessionKey
            };
            session.set(sessionRes);
            options.success(userInfo);
          }
          else {
            var errorMessage = '登录失败:' + data.msg || '未知错误';
            var noSessionError = new LoginError(errorMessage);
            options.fail(noSessionError);
          }
        }
        else {
          var errorMessage = '登录请求没有包含会话响应，请确保服务器处理 `' + options.loginUrl + '` 的时候输出登录结果';
          var noSessionError = new LoginError(errorMessage);
          options.fail(noSessionError);
        }
      },
      fail: function (loginResponseError) {
        wx.hideLoading()
        var error = new LoginError('登录失败，可能是网络错误或者服务器发生异常');
        options.fail(error);
      }
    });
  });

  doLogin();
}

module.exports = {
  LoginError: LoginError,
  login: login
};