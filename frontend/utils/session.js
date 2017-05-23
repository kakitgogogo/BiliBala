var SESSION_KEY = 'HARD-TO-GUESS-SESSION';

var session = {
  get: function () {
    return wx.getStorageSync(SESSION_KEY) || null;
  },

  set: function (value) {
    wx.setStorageSync(SESSION_KEY, value);
  },

  clear: function () {
    wx.removeStorageSync(SESSION_KEY);
  }
};

module.exports = session;