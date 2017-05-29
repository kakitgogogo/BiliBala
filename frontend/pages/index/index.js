//index.js
//获取应用实例
var app = getApp()

var config = require('../../config');
var login = require('../../utils/login');
var record = require('../../utils/record');
var play = require('../../utils/play');
var upload = require('../../utils/upload');
var session = require('../../utils/session')

Page({
  data: {
    userInfo: {},
    isRecording: false,
    isPlaying: false,
    isUploading: false,
    isUploadDone: false,
    recordUi: {
      record: config.image.record,
    },
    playUi: {
      play: config.image.play,
      playing: config.image.playing
    },
    uploadUi: {
      upload: config.image.upload,
      uploading: config.image.uploading
    },
    duration: 0,
    maxDuration: 60,
    recordRadius: 128,
    playRadius: 128,
    uploadRadius: 128
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../mylist/mylist'
    })
  },
  onLoad: function () {
    var that = this;
    login.login({
      success: function (userInfo) {
        that.setData({
          userInfo: userInfo
        });
      },
      fail: function (error) {
        console.log(error);
      }
    });
  },
  startRecord: function () {
    var that = this;
    that.setData({
      isRecording: true,
      recordRadius: 118
    });
    record.startRecord({
      success(result) {
        that.setData({
          isRecording: false,
          isUploadDone: false,
          recordRadius: 128
        });
        console.log('录音成功:', result);
      },
      fail(error) {
        console.log('录音失败:', error);
      },
      process() {

      },
      complete() {

      }
    });
  },
  stopRecord: function () {
    var that = this;
    record.stopRecord({
      success(result) {
        that.setData({
          isRecording: false,
          recordRadius: 128
        });
        console.log('停止录音:', result);
      },
      fail(error) {
        console.log('停止录音失败:', error);
      },
    });
  },
  playRecord: function () {
    var that = this;
    that.setData({
      isPlaying: true,
      playRadius: 118
    });
    play.playRecord({
      src: record.getRecordSrc(),
      success(result) {
        that.setData({
          isPlaying: false,
          playRadius: 128
        });
        console.log('播放/暂停成功:', result);
      },
      fail(error) {
        that.setData({
          isPlaying: false,
          playRadius: 128
        });
        console.log('播放/暂停失败:', error);
      }
    })
  },
  uploadRecord: function () {
    var that = this;
    if (that.data.isUploadDone || that.data.isUploading) {
      console.log('重复上传错误');
      return;
    }
    that.setData({
      isUploading: true,
      uploadRadius: 118
    });
    upload.uploadFile({
      url: config.service.uploadUrl,
      filePath: record.getRecordSrc(),
      name: 'voice',
      formData: {
        session: session.get().sessionKey
      },
      success(result) {
        that.setData({
          isUploading: false,
          isUploadDone: true,
          uploadRadius: 128
        });
        console.log('上传成功:', result);
      },
      fail(error) {
        that.setData({
          isUploading: false,
          uploadRadius: 128
        });
        console.log('上传失败:', error);
      }
    })
  },
  onShareAppMessage: function () {
    return {
      title: 'BiliBala',
      desc: 'Share Your Voice',
      path: '/pages/index/index'
    }
  }
})
