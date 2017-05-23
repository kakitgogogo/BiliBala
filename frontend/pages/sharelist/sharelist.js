//sharelist.js
//获取应用实例
var app = getApp()

var config = require('../../config');
var requests = require('../../utils/request');
var play = require('../../utils/play');
var session = require('../../utils/session');
var misc = require('../../utils/misc');

var tempFile = new Map();

Page({
  data: {
    userInfo: {},
    nomore: false,
    isPlaying: false,
    playUi: {
      play: '../../images/play-button.png',
      playing: '../../images/playing.png'
    },
    playingSrc: null,
    loadingAnimation: {},
    nomoreAnimation: {},
    recordsNum: 0,
    records: [],
    initRadius: 128,
    playRadius: 118,
    isCommenting: 0,
    commentId: null,
    lastComment: null,
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
    this.getRecords(true);
  },
  onShareAppMessage: function () {
    return {
      title: 'BiliBala',
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

  viewItem: function (event) {
    var idx = event.currentTarget.dataset.index;
    misc.dataStorage.set(this.data.records[idx]);
    wx.navigateTo({
      url: '../item/item?id=' + event.target.dataset.voiceid,
    })
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
        session: session.get().sessionKey,
        index: that.data.recordsNum,
        number: 10
      },
      success(result) {
        var nums = result.data.number;
        var records = result.data.data;
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
  },

  likeRecord: function (event) {
    var that = this;
    var id = event.target.dataset.voiceid;
    var idx = event.currentTarget.dataset.index;
    var lastVal = that.data.records[idx].isLike;
    requests.request({
      url: config.service.likeUrl + '/' + id,
      method: 'POST',
      data: {
        session: session.get().sessionKey,
        method: lastVal ? 'unlike' : 'like'
      },
      success: function (result) {
        console.log(result);
        that.data.records[idx].isLike = Math.abs(lastVal - 1);
        that.data.records[idx].nLikes = that.data.records[idx].nLikes+(lastVal ? -1 : 1);
        that.setData({
          records: that.data.records
        });
      },
      fail: function (error) {
        console.log('点赞失败', error);
      }
    });
  },

  comment: function (event) {
    this.setData ({
      isCommenting: 1,
      commentId: event.target.dataset.voiceid,
    });
  },

  inputBlur: function (event) {
    this.setData({
      isCommenting: 0,
    });
  },

  onInput: function (event) {
    this.setData({
      lastComment: event.detail.value,
    });
  },

  uploadComment: function (event) {
    var that = this;
    var id = event.target.dataset.voiceid;
    var url = config.service.commentUrl + '/' + id;
    var idx = event.currentTarget.dataset.index;
    var lastVal = that.data.records[idx].nComments;
    //console.log(id, that.data.lastComment);
    requests.request({
      url: url,
      method: 'POST',
      data: {
        session: session.get().sessionKey,
        comment: that.data.lastComment,
      },
      success(result) {
        console.log(result);
        that.data.records[idx].nComments = lastVal+1;
        that.setData({
          records: that.data.records
        });
      },
      fail(error) {
        console.log('评论失败:', error);
      }
    });
  }
})
