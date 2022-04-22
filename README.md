小程序OPENCV教程
======================

本文一步一步教你如何在小程序中使用最新版的OpenCV（本文发布时为4.5.5）

## 安装基础软件

安装基础工具

```shell
pacman -S base-devel cmake git
```

## 安装以及配置emsdk


```shell
git clone https://github.com/juj/emsdk.git
cd emsdk
./emsdk install 2.0.10
./emsdk activate 2.0.10
source ./emsdk_env.sh
```

## 配置以及编译OpenCV

进入 https://opencv.org/releases/ 页面下载opencv最新版源码，并解压缩，并进入解压缩后文件夹

### 取消不需要的OpenCV模块，减少wasm体积

修改`platforms/js/opencv_js.config.py`文件根据情况，去掉不用的模块

```python
# white_list = makeWhiteList([core, imgproc, objdetect, video, dnn, features2d, photo, aruco, calib3d])
white_list = makeWhiteList([core, imgproc])
```

### 配置OpenCV4输出独立的wasm文件

默认OpenCV4会将wasm以base64存到js文件，输出单独wasm文件便于用于微信小程序

打开`modules/js/CMakeLists.txt`，去掉` SINGLE_FILE`参数

```
# set(EMSCRIPTEN_LINK_FLAGS "${EMSCRIPTEN_LINK_FLAGS} -s MODULARIZE=1 -s SINGLE_FILE=1")
set(EMSCRIPTEN_LINK_FLAGS "${EMSCRIPTEN_LINK_FLAGS} -s MODULARIZE=1")
```

### 配置OpenCV禁用动态执行函数

微信小程序不支持`eval()`和`new Function()`等动态执行函数，在`modules/js/CMakeLists.txt`中，增加`DYNAMIC_EXECUTION`的编译参数屏蔽这些函数的输出

```
# set(EMSCRIPTEN_LINK_FLAGS "${EMSCRIPTEN_LINK_FLAGS} -s MODULARIZE=1 -s SINGLE_FILE=1")
set(EMSCRIPTEN_LINK_FLAGS "${EMSCRIPTEN_LINK_FLAGS} -s MODULARIZE=1")
set(EMSCRIPTEN_LINK_FLAGS "${EMSCRIPTEN_LINK_FLAGS} -s DYNAMIC_EXECUTION=0")
```

### 查看编译参数

```shell
emcmake python ./platforms/js/build_js.py -h
```

### 编译OpenCV

```shell
emcmake python ./platforms/js/build_js.py build_wasm --build_wasm --build_test
```

`build_wasm\bin`目录生成了opencv.js,opencv_js.wasm,tests.html文件


### 压缩wasm

```shell
brotli -o build_wasm/bin/opencv_js.wasm.br build_wasm/bin/opencv_js.wasm
```

## 运行以及查看Web测试

```shell
npm i -g http-server
http-server build_wasm/bin/
```

在浏览器打开 `http://127.0.0.1:8080/tests.html` 可以查看测试结果

## 修改`opencv.js`适配微信小程序

修改前先将`opencv.js`格式化一下，微信小程序不支持通过url获取wasm，修改下instantiateAsync方法的else分支里面的代码，让读小程序项目下的opencv_js.wasm文件

```js
        
        function instantiateAsync() {
          if (
            !wasmBinary &&
            typeof WebAssembly.instantiateStreaming === "function" &&
            !isDataURI(wasmBinaryFile) &&
            !isFileURI(wasmBinaryFile) &&
            typeof fetch === "function"
          ) {
            return fetch(wasmBinaryFile, { credentials: "same-origin" }).then(
              function (response) {
                var result = WebAssembly.instantiateStreaming(response, info);
                return result.then(
                  receiveInstantiatedSource,
                  function (reason) {
                    err("wasm streaming compile failed: " + reason);
                    err("falling back to ArrayBuffer instantiation");
                    return instantiateArrayBuffer(receiveInstantiatedSource);
                  }
                );
              }
            );
          } else {
            // return instantiateArrayBuffer(receiveInstantiatedSource);
            var result = WebAssembly.instantiate("/opencv/opencv_js.wasm.br", info);
            return result.then(
              receiveInstantiatedSource,
              function (reason) {
                err("wasm streaming compile failed: " + reason);
                err("falling back to ArrayBuffer instantiation");
                return instantiateArrayBuffer(receiveInstantiatedSource);
              }
            );
          }
        }
```

## 修改OpenCV.js的imread，imshow,VideoCapture方法支持小程序

这些方法定义在`modules\js\src\helpers.js`文件中，修改后重新编译和生成wasm文件即可


## 在小程序使用`OpenCV.js`

```javascript
const app = getApp()
WebAssembly = WXWebAssembly;
let cv = require('../../opencv/opencv.js');

Page({
  onLoad: function (options) {
    if (cv instanceof Promise) {
      cv.then((target) => {
        console.log(target);
      })
    } else {
      console.log(cv);
    }
  }
})
```

## 参考
* [Build OpenCV.js官方教程](https://docs.opencv.org/4.5.5/d4/da1/tutorial_js_setup.html)
* [编译 C/C++ 为 WebAssembly](https://developer.mozilla.org/zh-CN/docs/WebAssembly/C_to_wasm)
* [微信官方WXWebAssembly介绍](https://developers.weixin.qq.com/miniprogram/dev/framework/performance/wasm.html "WXWebAssembly")
* [opencv.js生产独立.wasm文件](https://github.com/opencv/opencv/issues/13356 "Could not generate .wasm file when building opencv.js")
* [ WeChat-MiniProgram-AR-WASM](https://github.com/sanyuered/WeChat-MiniProgram-AR-WASM)

