const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getFonts: () => ipcRenderer.invoke("get-fonts"),
  getFontsCore: () => ipcRenderer.invoke("get-fonts-core"),
  getPrinters: () => ipcRenderer.invoke("get-printers"),
  printNumbers: (config) => ipcRenderer.send("print-numbers", config),
  onLog: (callback) => {
    ipcRenderer.on('app-log', (event, data) => {
        callback(data);
    });
  },
  openPDF: (filePath) => ipcRenderer.invoke('open-pdf', filePath),
  savePrintConfig: (config) => ipcRenderer.invoke('save-print-config', config),
  loadPrintConfig: () => ipcRenderer.invoke('load-print-config')
});