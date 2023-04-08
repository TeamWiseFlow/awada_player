// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const path = require('path')
// const { outputFile } = require('fs-extra')
// const { Buffer } = require('buffer')
const fs = require('fs')

// require('electron-reload')(__dirname)

let mainWindow

let config = require('./config.json')
console.log('CONFIG', JSON.stringify(config, '', 4))
console.log('PLATFORM', process.platform)
console.log('PROJECT_DIR', process.env.PROJECT_DIR)
console.log('API_ASK', process.env.API_ASK)

let dir = process.env.PROJECT_DIR || './'
config.wav_file_path = dir + config.wav_file_path
config.api_ask = process.env.API_ASK || config.api_ask

if (config.debug) require('./api-mock')

const getConfig = () => {
  return config
}

const exit = () => {
  app.exit(0)
}

const getFilename = (event, url) => {
  return path.basename(url, path.extname(url))
}

const saveAudio = async (event, arrayBuffer) => {
  console.log('saveAudio', arrayBuffer.byteLength)
  var buffer = Buffer.from(arrayBuffer)

  try {
    fs.writeFileSync(config.wav_file_path, buffer)
    //let res = await outputFile(config.wav_file_path, buffer)
    return { error: '' }
  } catch (err) {
    console.log('ERROR', err)
    return { error: err }
  }
}

Menu.setApplicationMenu(null)

const createWindow = () => {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      // nodeIntegration: true,
      // contextIsolation: false,
    },
  })

  // 处理页面调用主进程的函数
  ipcMain.handle('GET_CONFIG', getConfig)
  //   ipcMain.handle("GET_FILENAME", getFilename);
  ipcMain.handle('SAVE_AUDIO', saveAudio)
  ipcMain.handle('EXIT', exit)

  // 加载 index.html
  mainWindow.loadFile('src/index.html')

  // 打开开发工具
  config.debug && mainWindow.webContents.openDevTools()

  //   mainWindow.webContents.on('before-input-event', (event, input) => {
  //     mainWindow.webContents.send('keyboard', input)
  //   })
}

// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. 也可以拆分成几个文件，然后用 require 导入。

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
