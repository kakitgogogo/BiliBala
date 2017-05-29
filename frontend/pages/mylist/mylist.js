//mylist.js
//获取应用实例
var app = getApp()

var config = require('../../config');
var requests = require('../../utils/request');
var play = require('../../utils/play');
var session = require('../../utils/session');
var touch = require('../../utils/touch');
var base64 = require('../../utils/base64');

var tempFile = new Map();

Page({
  data: {
    userInfo: {},
    nomore: false,
    isPlaying: false,
    playUi: {
      play: config.image.play,
      playing: config.image.play
    },
    playingSrc: null,
    loadingAnimation: {},
    nomoreAnimation: {},
    recordsNum: 0,
    records: [],
    startX: 0,
    lastShowTime: '',
    isEditing: 0,
    editId: null,
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../mylist/mylist'
    })
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
      title: 'BiliBala',
      desc: 'Share Your Voice',
      path: '/pages/index/index'
    }
  },

  refreshList: function () {
    console.log('触顶');
    this.getRecords(true);
  },

  appendList: function () {
    console.log("触底");
    if(!this.data.nomore) {
      this.getRecords(false);
    }
  },

  touchS: function (event) {
    //console.log(event);
    var startX = touch.getClientX(event);
    this.setData({ startX: startX });
  },

  touchM: function (event) {
    var records = touch.touchM(event, this.data.records, this.data.startX);
    this.setData({ records: records });
  },

  touchE: function (event) {
    const width = 300;
    var records = touch.touchE(event, this.data.records, this.data.startX, width);
    this.setData({ records: records });
  },

  play: function (event) {
    var that = this;
    var path = event.target.dataset.src;
    var url = 'https://' + config.service.host + '/' + path;
    var src = tempFile.get(path);
    if(!path){
      return;
    }
    if(src) {
      that.playRecord(path, src);
    }
    else {
      wx.downloadFile({
        url: url,
        success: function(res) {
          tempFile.set(path, res.tempFilePath);
          that.playRecord(path, res.tempFilePath);
        },
        fail: function() {
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
    if(isFresh) {
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
    var url = config.service.viewUrl;
    requests.request({
      url: url,
      method: 'POST',
      data: {
        session: session.get().sessionKey,
        index: that.data.recordsNum,
        number: 10
      },
      success: function (result) {
        var nums = result.data.number;
        var records = result.data.data;
        var showAnimation = wx.createAnimation({
          duration: 1000,
          timingFunction: 'ease'
        }).height(50).opacity(1).step();
        if(!nums) {
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

        records = records.map(function (r) {
          r.text = base64.decode(r.text);
          return r;
        });
        that.setData({
          recordsNum: that.data.recordsNum + nums,
          records: that.data.records.concat(records)
        });
        console.log('载入成功:', result);
      },
      fail: function (error) {
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
          playingSrc: null,
        });
        console.log('播放/暂停成功:', result);
      },
      fail(error) {
        that.setData({
          isPlaying: false,
          playingSrc: null,
        });
        console.log('播放/暂停失败:', error);
      }
    })
  },

  deleteRecord: function (event) {
    wx.showLoading({
      title: '删除中'
    });
    var that = this;
    var voiceid = event.target.dataset.voiceid;
    requests.request({
      url: config.service.deleteUrl + '/' + voiceid,
      method: 'GET',
      success: function () {
        wx.hideLoading();
        that.data.records.splice(event.currentTarget.dataset.index, 1);
        that.setData({
          recordsNum: that.data.recordsNum - 1,
          records: that.data.records
        });
      },
      fail: function () {
        wx.hideLoading();
      }
    });
  },

  shareRecord: function (event) {
    wx.showLoading({
      title: '分享中'
    });
    var that = this;
    var path = event.target.dataset.src;
    requests.request({
      url: config.service.shareUrl + '/' + path,
      method: 'GET',
      success: function () {
        wx.hideLoading();
        var lastVal = that.data.records[event.currentTarget.dataset.index].isShared;
        that.data.records[event.currentTarget.dataset.index].isShared = Math.abs(lastVal-1);
        that.setData({
          records: that.data.records
        });
      },
      fail: function () {
        wx.hideLoading();
      }
    });
  },

  editText: function (event) {
    var id = event.target.dataset.voiceid;
    console.log('edit');
    this.setData({
      isEditing: 1,
      editId: id,
    })
  },

  onEdit: function (event) {

  },

  editDone: function (event) {
    var idx = event.currentTarget.dataset.index;
    this.setData({
      isEditing: 0,
    });
    var that = this;
    var voiceid = event.target.dataset.voiceid;
    requests.request({
      url: config.service.editUrl + '/' + voiceid,
      method: 'POST',
      data: {
        text: base64.encode(event.detail.value),
      },
      success: function () {
        that.data.records[idx].text = event.detail.value;
        that.setData({
          recordsNum: that.data.recordsNum - 1,
          records: that.data.records
        });
      },
      fail: function (error) {
        console.log('更改失败:', error);
      }
    });
  },

  editCancel: function (event) {
    this.setData({
      isEditing: 0,
    })
  },

})
