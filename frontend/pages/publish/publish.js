var config = require('../../config');
var requests = require('../../utils/request');
var play = require('../../utils/play');
var session = require('../../utils/session');
var misc = require('../../utils/misc');
var base64 = require('../../utils/base64');

Page({

  data: {
    placeholder: '说点什么...',
    tousername: null,
    voiceId: null,
    focus: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      voiceId: options.voiceid,
      tousername: options.tousername,
    });
  },

  onBlur: function (event) {
  },

  onSubmit: function (event) {
    var that = this;
    var id = that.data.voiceId;
    var url = config.service.commentUrl + '/' + id;
    var to = '';
    if (that.data.tousername) {
      to = that.data.tousername;
    }
    requests.request({
      url: url,
      method: 'POST',
      data: {
        session: session.get().sessionKey,
        comment: base64.encode(event.detail.value.content),
        tousername: to,
      },
      success(result) {
        console.log(result);
        wx.showToast({
          title: "发布成功",
          icon: "success",
          duration: 2000
        }); 
        wx.setStorageSync('needRefresh', true);
        wx.navigateBack();
      },
      fail(error) {
        console.log('发布失败:', error);
        wx.showToast({
          title: "发布失败",
          duration: 2000
        });
      }
    });
  }
})