const app = getApp()
WebAssembly = WXWebAssembly;
let cv = require('../../opencv/opencv.js');

Page({
  data: {
    src: "/opencv/test.png",
    srcData: null,
    disabled: false,
  },
  onLoad: function (options) {
    var _that = this
    _that.imread(_that.data.src).then(res => {
      _that.imshow("src", res)
    });
  },
  async imread(path) {
    const canvas = wx.createOffscreenCanvas({
      type: '2d'
    });
    const ctx = canvas.getContext('2d')
    const img = canvas.createImage()
    await new Promise(function (resolve, reject) {
      img.onload = resolve
      img.onerror = reject
      img.src = path
    })
    canvas.height = img.height
    canvas.width = img.width
    ctx.drawImage(img, 0, 0, img.width, img.height)
    return ctx.getImageData(0, 0, img.width, img.height)
  },
  async imshow(id, data) {
    const query = wx.createSelectorQuery()
    query.select('#' + id)
      .fields({
        node: true,
        size: true
      })
      .exec((res) => {
        const canvas = res[0].node
        canvas.height = data.height
        canvas.width = data.width
        const ctx = canvas.getContext('2d')
        ctx.putImageData(data, 0, 0)
      })
  },
  tryIt() {
    if (cv instanceof Promise) {
      cv.then((target) => {

      })
    } else {
      console.error(cv);
    }
  }
})