const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  storeLoginData: async (facilityId, token) => ipcRenderer.invoke('store-login-data', facilityId, token),
  storeAccessToken: async (token) => ipcRenderer.invoke('store-access-token', token),
  directoryWatching: (channel, func) => {
      const validChannels = ['directory-watching-event']
      if (validChannels.includes(channel)) {
          ipcRenderer.on(channel, (event, ...args) => func(...args))
      }
  },
})