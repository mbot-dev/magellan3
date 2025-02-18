const os = require('os')
const process = require('process')
const path = require('path')
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { electronApp, optimizer, is } = require('@electron-toolkit/utils')
const EventEmitter = require('events')
const { debounce } = require('es-toolkit')
const store = require('./eStore')
const appMenu = require('./eMenu')
const ResWatcher = require('./eWatcher')

let mainWindow
const evtEmitter = new EventEmitter()
const watcher = new ResWatcher(evtEmitter)
// const directoryToWatch = '/Volumes/windows11pc/shikaku'
const WIN_DIR_TO_WATCH = '\\MAGELLAN-WIN\\share'
const LINUX_DIR_TO_WATCH = '/home/kazushi/develop/oqs/res'
const MAC_DIR_TO_WATCH = '/Users/kazushi/develop/oqs/res'
const LOCAL_URL = 'http://localhost:8066'
const NGROK_URL = 'https://dashing-skunk-nominally.ngrok-free.app'
const APP_NAME = 'Margaret'

const whichURL = 'NGROK_URL' // LOCAL || NGROK_URL

const createWindow = () => {
  const startUrl = whichURL === 'LOCAL' ? LOCAL_URL : NGROK_URL
  const { x, y, width, height } = store.getBounds()
  
  mainWindow = new BrowserWindow({
    x: x,
    y: y,
    width: width,
    height: height,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  mainWindow
    .loadURL(startUrl)
    .then(() => {
      appMenu.build(app.name, evtEmitter)
    })
    .then(() => {
      mainWindow.show()
    })

  mainWindow.on(
    'move',
    debounce(() => {
      store.saveBounds(mainWindow.getBounds())
    }, 500),
  )

  mainWindow.on(
    'resize',
    debounce(() => {
      store.saveBounds(mainWindow.getBounds())
    }, 500),
  )
}

app.setName(APP_NAME)

app.whenReady().then(() => {
  electronApp.setAppUserModelId('app.user-lab.margaret')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('will-quit', async () => {
  // if (watcher) {
  //     await watcher.stop()
  // }
})

evtEmitter.on('start-watching-res', () => {
  const pl = os.platform()
  if ( pl === 'win32') {
    watcher.start(WIN_DIR_TO_WATCH)
    return
  }
  if ( pl === 'darwin') {
    watcher.start(MAC_DIR_TO_WATCH)
    return
  }
  if ( pl === 'linux') {
    watcher.start(LINUX_DIR_TO_WATCH)
  }
})

evtEmitter.on('stop-watching-res', async () => {
  await watcher.stop()
})

evtEmitter.on('watching-event', (message) => {
  dialog.showMessageBox({
    type: 'info',
    title: '資格確認システム',
    message: message,
  })
  mainWindow.webContents.send('directory-watching-event', { message: message })
})

evtEmitter.on('error', (error) => {
  dialog.showMessageBox({
    type: 'error',
    title: '資格確認システム',
    message: error,
  })
  mainWindow.webContents.send('directory-watching-event', {
    error: { message: error },
  })
})

ipcMain.handle('store-login-data', async (event, facilityId, token) => {
  if (!watcher) {
    return
  }
  console.log(facilityId)
  console.log(token)
  watcher.setLogin(facilityId, token)
  return { message: 'Login data stored!' }
})

ipcMain.handle('store-access-token', async (event, token) => {
  if (!watcher) {
    return
  }
  console.log(token)
  watcher.setToken(token)
  return { message: 'Token stored!' }
})
