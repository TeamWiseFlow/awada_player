// All the Node.js APIs are available in the preload process.
// 它拥有与Chrome扩展一样的沙盒。
// window.addEventListener("DOMContentLoaded", () => {
//   const replaceText = (selector, text) => {
//     const element = document.getElementById(selector);
//     if (element) element.innerText = text;
//   };

//   for (const dependency of ["chrome", "node", "electron"]) {
//     replaceText(`${dependency}-version`, process.versions[dependency]);
//   }
// });

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('node', {
  getConfig: () => ipcRenderer.invoke('GET_CONFIG'),
  getFilename: url => ipcRenderer.invoke('GET_FILENAME', url),
  saveAudio: arrayBuffer => ipcRenderer.invoke('SAVE_AUDIO', arrayBuffer),
  exit: () => ipcRenderer.invoke('EXIT'),
})
