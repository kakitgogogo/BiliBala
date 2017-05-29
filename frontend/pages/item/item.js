var config = require('../../config');
var requests = require('../../utils/request');
var play = require('../../utils/play');
var session = require('../../utils/session');
var misc = require('../../utils/misc');
var base64 = require('../../utils/base64');

var tempFile = new Map();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    voiceId: null,
    item: null,
    nomore: false,
    isPlaying: false,
    playUi: {
      play: '../../images/play-button.png',
      playing: '../../images/playing.png'
    },
    comments: [],
    commentsNum: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (option) {
    var item = misc.dataStorage.get();
    this.setData({
      voiceId: option.id,
      item: item,
      commentsNum: item.nComments,
    });
  },

  onUnload: function () {
    console.log('exit item page');
    misc.dataStorage.clear();
  },

  onShow: function () {
    var needRefresh = wx.getStorageSync('needRefresh');
    if (needRefresh) {
      this.getComments();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: 'BiliBala',
      desc: 'Share Your Voice',
      path: '/pages/index/index'
    };
  },

  play: function (event) {
    var that = this;
    var path = that.data.item.src;
    var url = 'https://' + config.service.host + '/' + path;
    var src = tempFile.get(path);
    if (!path) {
      return;
    }
    if (src) {
      console.log(url)
      that.playRecord(path, src);
    }
    else {
      wx.downloadFile({
        url: url,
        success: function (res) {
          tempFile.set(path, res.tempFilePath);
          that.playRecord(path, res.tempFilePath);
        },
        fail: function () {
          wx.showToast({
            title: '载入失败',
            icon: 'loading',
            duration: 1000
          })
        }
      });
    }
  },

  //请求页面数据
  getComments: function () {
    var that = this;
    var url = config.service.viewCommentsUrl + '/' + that.data.item.id;
    requests.request({
      url: url,
      method: 'POST',
      data: {
        session: session.get().sessionKey
      },
      success(result) {
        var nums = result.data.number;
        var comments = result.data.data;
        if (!nums) {
          that.setData({
            nomore: true,
          })
        }
        comments = comments.map(function (r) {
          r.text = base64.decode(r.text);
          return r;
        });
        that.setData({
          commentsNum: nums,
          comments: comments
        });
        console.log('载入成功:', result);
      },
      fail(error) {
        console.log('载入失败:', error);
      }
    });
  },

  playRecord: function (path, src) {
    var that = this;
    that.setData({
      isPlaying: true,
      playingSrc: path
    });
    play.playRecord({
      src: src,
      success() {
        that.setData({
          isPlaying: false,
          playingSrc: null
        });
        console.log('播放/暂停成功:', result);
      },
      fail(error) {
        that.setData({
          isPlaying: false,
          playingSrc: null
        });
        console.log('播放/暂停失败:', error);
      }
    })
  },

  likeItem: function (event) {
    var that = this;
    var id = that.data.item.id;
    var lastVal = that.data.item.isLike;
    requests.request({
      url: config.service.likeUrl + '/' + id,
      method: 'POST',
      data: {
        session: session.get().sessionKey,
        method: lastVal ? 'unlike' : 'like'
      },
      success: function (result) {
        console.log(result);
        that.data.item.isLike = Math.abs(lastVal - 1);
        that.data.item.nLikes = that.data.item.nLikes + (lastVal ? -1 : 1);
        that.setData({
          item: that.data.item
        });
      },
      fail: function (error) {
        console.log('点赞失败', error);
      }
    });
  },

  comment: function (event) {
    var urlTail = '';
    if (event.target.dataset.username) {
      urlTail = '&tousername=' + event.target.dataset.username;
    }
    wx.navigateTo({
      url: '../publish/publish?voiceid=' + this.data.item.id + urlTail,
    })
  }
})