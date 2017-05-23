var KEY = 'HARD-TO-GUESS-MISC';

var dataStorage = {
  get: function () {
    return wx.getStorageSync(KEY) || null;
  },

  set: function (value) {
    wx.setStorageSync(KEY, value);
  },

  clear: function () {
    wx.removeStorageSync(KEY);
  }
};

module.exports = {
  dataStorage,
}