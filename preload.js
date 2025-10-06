// preload.js - Script de preload para comunicación segura entre main y renderer
const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al contexto del renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Selección de archivos
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  readFolderPdfs: (folderPath) => ipcRenderer.invoke('read-folder-pdfs', folderPath),
  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),
  
  // Manejo de archivos
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  extractPdfText: (filePath) => ipcRenderer.invoke('extract-pdf-text', filePath),
  
  // Configuración
  openConfigFile: () => ipcRenderer.invoke('open-config-file'),
  
  // Email
  openEmail: (options) => ipcRenderer.invoke('open-email', options),
  
  // ZIP compression
  createZip: (outputFolder) => ipcRenderer.invoke('create-zip', outputFolder),
  
  // Logging
  log: (level, message) => ipcRenderer.invoke('log', level, message)
});

// Exponer constantes y utilidades
contextBridge.exposeInMainWorld('appConstants', {
  supportedFileTypes: ['.pdf', '.xlsx', '.csv'],
  maxFileSize: 100 * 1024 * 1024, // 100MB
  configFileName: 'counterparty_mapping.xlsx'
});

console.log('Preload script cargado correctamente');