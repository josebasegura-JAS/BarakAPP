const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('barakDesktop', {
  getInfo: () => ipcRenderer.invoke('barakapp:info'),
})
