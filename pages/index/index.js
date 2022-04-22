const app = getApp()
WebAssembly = WXWebAssembly

const cv_promise = require('../../opencv/opencv.js');
let cv;
cv_promise.then(target => cv = target)


Page({
  data: {
    src: "/opencv/test.png",
    srcData: null,
    disabled: false,
  },
  onLoad: async function (options) {
    var _that = this
    cv_promise.then((cv) => {
      _that.imread(_that.data.src).then(res => {
        _that.imshow("src", res)
        let src = cv.matFromImageData(res)
        let dst = new cv.Mat()
        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY)
        _that.imshow("dst", dst)
      });
    })
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
  async imshow(id, mat_or_imagedata) {
    let data
    if (mat_or_imagedata instanceof cv.Mat) {
      var mat = mat_or_imagedata
      var img = new cv.Mat;
      var depth = mat.type() % 8;
      var scale = depth <= cv.CV_8S ? 1 : depth <= cv.CV_32S ? 1 / 256 : 255;
      var shift = depth === cv.CV_8S || depth === cv.CV_16S ? 128 : 0;
      mat.convertTo(img, cv.CV_8U, scale, shift);
      switch (img.type()) {
        case cv.CV_8UC1:
          cv.cvtColor(img, img, cv.COLOR_GRAY2RGBA);
          break;
        case cv.CV_8UC3:
          cv.cvtColor(img, img, cv.COLOR_RGB2RGBA);
          break;
        case cv.CV_8UC4:
          break;
        default:
          throw new Error("Bad number of channels (Source image must have 1, 3 or 4 channels)");
      }
      data = wx.createOffscreenCanvas({
        type: '2d'
      }).getContext('2d').createImageData(img.cols, img.rows)
      data.data.set(new Uint8ClampedArray(img.data))
    } else {
      data = mat_or_imagedata
    }

    let query = wx.createSelectorQuery()
    query.select('#' + id)
      .fields({
        node: true,
        size: true
      })
      .exec((res) => {
        let canvas = res[0].node
        canvas.height = data.height
        canvas.width = data.width
        let ctx = canvas.getContext('2d')
        ctx.putImageData(data, 0, 0)
      })
  }
})