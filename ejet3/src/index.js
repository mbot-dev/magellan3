const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const process = require('process')
const path = require('path')
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
// const directoryToWatch = '\\MAGELLAN-WIN\share'
const directoryToWatch = '/home/kazushi/develop/oqs/res'
// const directoryToWatch = '/Users/kazushi/develop/oqs/res'
const testURL = 'https://dashing-skunk-nominally.ngrok-free.app'
const appURL = 'https://dashing-skunk-nominally.ngrok-free.app'

const createWindow = () => {
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

  const startUrl = is.dev ? testURL : appURL
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

app.setName('Lilac')

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
  watcher.start(directoryToWatch)
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
