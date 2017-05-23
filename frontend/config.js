var host = 'kakit.top'

module.exports = {
  image: {
    record: "/images/microphone.png",
    recording: "/images/recorder.gif",
    play: "/images/talk.png",
    playing: "/images/talk.png",
    upload: "/images/transfer.png",
    uploading: "/images/loading.gif"
  },
  service: {
    host: host,

    // 登录地址
    loginUrl: 'https://kakit.top/login/voice',

    // 上传接口
    uploadUrl: 'https://kakit.top/upload/voice',

    // 删除接口
    deleteUrl: 'https://kakit.top/delete/voice',

    // 分享接口
    shareUrl: 'https://kakit.top/share',

    // 评论接口
    commentUrl: 'https://kakit.top/comment/voice',

    //点赞接口
    likeUrl: 'https://kakit.top/like/voice',

    // 查看接口
    viewUrl: 'https://kakit.top/view/voice',
    viewAllUrl: 'https://kakit.top/viewall/voice',
    viewCommentsUrl: 'https://kakit.top/comments/voice',

    // 搜索接口
    searchUrl: 'https://kakit.top/search/voice',

  }
}
