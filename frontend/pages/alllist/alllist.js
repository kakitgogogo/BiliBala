//alllist.js
//获取应用实例
var app = getApp()

var config = require('../../config');
var requests = require('../../utils/request');
var play = require('../../utils/play');

var tempFile = new Map();

Page({
  data: {
    userInfo: {},
    nomore: false,
    isPlaying: false,
    playUi: {
      play: config.image.play,
      playing: config.image.playing
    },
    playingSrc: null,
    loadingAnimation: {},
    nomoreAnimation: {},
    recordsNum: 0,
    records: [],
    initRadius: 128,
    playRadius: 118,
  },
  onLoad: function () {
    var that = this;
    //调用应用实例的方法获取全局数据
    app.getUserInfo(function (userInfo) {
      //更新数据
      that.setData({
        userInfo: userInfo
      })
    });
    that.getRecords(true);
  },
  onShareAppMessage: function () {
    return {
      title: 'Voice',
      desc: 'Share Your Voice',
      path: '/pages/index/index'
    }
  },

  refreshList: function () {
    console.log('触顶');
    var that = this;
    that.getRecords(true);
  },

  appendList: function () {
    console.log("触底");
    var that = this;
    if (!that.data.nomore) {
      that.getRecords(false);
    }
  },

  play: function (event) {
    var that = this;
    var path = event.target.dataset.src;
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
  getRecords: function (isFresh) {
    var that = this;
    if (isFresh) {
      var showAnimation = wx.createAnimation({
        duration: 1000,
        timingFunction: 'ease'
      }).height(50).opacity(1).step();
      var hideAnimation = wx.createAnimation({
        duration: 1000,
        timingFunction: 'ease'
      }).height(0).opacity(0).step();
      that.setData({
        recordsNum: 0,
        records: [],
        nomore: false,
        loadingAnimation: showAnimation.export(),
        nomoreAnimation: hideAnimation.export()
      });
    }
    var url = config.service.viewAllUrl;
    requests.request({
      url: url,
      method: 'POST',
      data: {
        index: that.data.recordsNum,
        number: 10
      },
      success(result) {
        var nums = result.data.number;
        var records = result.data.data;
        console.log(records);
        var showAnimation = wx.createAnimation({
          duration: 1000,
          timingFunction: 'ease'
        }).height(50).opacity(1).step();
        if (!nums) {
          that.setData({
            nomore: true,
            nomoreAnimation: showAnimation.export()
          })
        }
        var hideAnimation = wx.createAnimation({
          duration: 1000,
          timingFunction: 'ease',
        }).opacity(0).height(0).step();
        that.setData({
          loadingAnimation: hideAnimation.export(),
        });
        that.setData({
          recordsNum: that.data.recordsNum + nums,
          records: that.data.records.concat(records)
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
  }


})
