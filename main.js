// main.js - Proceso principal de Electron para Palace Anonymizer
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const archiver = require('archiver');
const { PDFDocument } = require('pdf-lib');

// Configuración de la aplicación
let mainWindow;

function createWindow() {
  // Crear la ventana principal del navegador
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'favicon.jpg'),
    show: false
  });

  // Cargar el archivo HTML de la aplicación
  mainWindow.loadFile('renderer/index.html');

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Emitido cuando la ventana se cierra
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Este método se ejecuta cuando Electron ha terminado de inicializarse
app.whenReady().then(createWindow);

// Salir cuando todas las ventanas estén cerradas
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

// IPC Handlers para comunicación con renderer

// Manejar selección de archivos
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Archivos Excel/CSV', extensions: ['xlsx', 'csv'] },
      { name: 'Excel', extensions: ['xlsx'] },
      { name: 'CSV', extensions: ['csv'] }
    ]
  });
  return result;
});

// Nuevo handler para leer archivos de una carpeta
ipcMain.handle('read-folder-pdfs', async (event, folderPath) => {
  try {
    const files = fs.readdirSync(folderPath);
    const pdfFiles = files
      .filter(file => path.extname(file).toLowerCase() === '.pdf')
      .map(file => {
        const fullPath = path.join(folderPath, file);
        const stats = fs.statSync(fullPath);
        return {
          name: file,
          path: fullPath,
          size: stats.size
        };
      });
    return { success: true, files: pdfFiles };
  } catch (error) {
    console.error('Error al leer carpeta PDF:', error);
    return { success: false, error: error.message };
  }
});

// Manejar selección de carpeta de salida
ipcMain.handle('select-output-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result;
});

// Manejar apertura de archivo de configuración
ipcMain.handle('open-config-file', async () => {
  const configPath = path.join(__dirname, 'config', 'counterparty_mapping.xlsx');
  try {
    await shell.openPath(configPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Manejar lectura de archivos
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    // Si es path absoluto, usar directamente; si no, hacer join con __dirname
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, filePath);
    console.log('Leyendo archivo desde:', fullPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    console.log('Archivo leído exitosamente, tamaño:', content.length);
    return { success: true, content };
  } catch (error) {
    console.error('Error al leer archivo:', error.message);
    return { success: false, error: error.message };
  }
});

// Manejar escritura de archivos
ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    // Si es path absoluto, usar directamente; si no, hacer join con __dirname
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, filePath);
    console.log('Escribiendo archivo en:', fullPath);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Archivo escrito exitosamente');
    return { success: true };
  } catch (error) {
    console.error('Error al escribir archivo:', error.message);
    return { success: false, error: error.message };
  }
});

// Manejar apertura de email
ipcMain.handle('open-email', async (event, options) => {
  try {
    const { to, subject, body, outputFolder, attachment } = options;
    
    if (attachment && fs.existsSync(attachment)) {
      // Try to use Windows MAPI to create email with attachment
      try {
        const { spawn } = require('child_process');
        
        // Use PowerShell to create Outlook email with attachment (if Outlook is available)
        const powershellScript = `
          try {
            $outlook = New-Object -ComObject Outlook.Application
            $mail = $outlook.CreateItem(0)
            $mail.To = "${to || ''}"
            $mail.Subject = "${subject || ''}"
            $mail.Body = "${body || ''}"
            $mail.Attachments.Add("${attachment}")
            $mail.Display()
            Write-Output "SUCCESS"
          } catch {
            Write-Output "OUTLOOK_NOT_AVAILABLE"
          }
        `;
        
        return new Promise((resolve) => {
          const ps = spawn('powershell.exe', ['-Command', powershellScript], { 
            windowsHide: true 
          });
          
          let output = '';
          let resolved = false;
          
          // Set timeout to avoid hanging on security prompts (5 seconds)
          const timeout = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              ps.kill();
              console.log('PowerShell timeout, usando método fallback');
              fallbackMethod();
            }
          }, 5000);
          
          const fallbackMethod = async () => {
            const mailtoUrl = `mailto:${to || ''}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`;
            await shell.openExternal(mailtoUrl);
            if (outputFolder) {
              await shell.openPath(outputFolder);
            }
            resolve({ success: true, method: 'fallback' });
          };
          
          ps.stdout.on('data', (data) => {
            output += data.toString();
          });
          
          ps.on('close', async (code) => {
            if (resolved) return;
            
            clearTimeout(timeout);
            resolved = true;
            
            if (output.includes('SUCCESS')) {
              console.log('Email con adjunto creado exitosamente usando Outlook');
              resolve({ success: true, method: 'outlook' });
            } else {
              console.log('Outlook no disponible, usando método fallback');
              await fallbackMethod();
            }
          });
          
          ps.on('error', async (error) => {
            if (resolved) return;
            
            clearTimeout(timeout);
            resolved = true;
            console.log('Error con PowerShell, usando método fallback:', error.message);
            await fallbackMethod();
          });
        });
        
      } catch (error) {
        console.error('Error con método MAPI, usando fallback:', error);
      }
    }
    
    // Fallback method: mailto URL + open folder
    const mailtoUrl = `mailto:${to || ''}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`;
    await shell.openExternal(mailtoUrl);
    
    if (outputFolder) {
      await shell.openPath(outputFolder);
    }
    
    return { success: true, method: 'fallback' };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Obtener información de archivo
ipcMain.handle('get-file-info', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      success: true,
      size: stats.size,
      name: path.basename(filePath)
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Extraer texto de PDF
ipcMain.handle('extract-pdf-text', async (event, filePath) => {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, filePath);
    console.log('Extrayendo texto de PDF:', fullPath);
    const dataBuffer = fs.readFileSync(fullPath);
    const data = await pdf(dataBuffer);
    console.log('Texto extraído exitosamente, caracteres:', data.text.length);
    return { success: true, text: data.text };
  } catch (error) {
    console.error('Error al extraer texto de PDF:', error.message);
    return { success: false, error: error.message };
  }
});

// Crear archivo ZIP con archivos procesados
ipcMain.handle('create-zip', async (event, outputFolder) => {
  try {
    const zipPath = path.join(outputFolder, 'anonymized_files.zip');
    console.log('Creando archivo ZIP en:', zipPath);
    
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      output.on('close', () => {
        console.log('ZIP creado exitosamente:', archive.pointer() + ' bytes');
        resolve({ success: true, zipPath, size: archive.pointer() });
      });
      
      archive.on('error', (err) => {
        console.error('Error al crear ZIP:', err);
        reject({ success: false, error: err.message });
      });
      
      archive.pipe(output);
      
      // Buscar todos los archivos anonimizados en la carpeta de salida
      const files = fs.readdirSync(outputFolder);
      const anonymizedFiles = files.filter(file => 
        file.includes('_anon') && !file.endsWith('.zip')
      );
      
      // Agregar cada archivo al ZIP
      anonymizedFiles.forEach(file => {
        const filePath = path.join(outputFolder, file);
        archive.file(filePath, { name: file });
      });
      
      archive.finalize();
    });
  } catch (error) {
    console.error('Error al crear ZIP:', error);
    return { success: false, error: error.message };
  }
});

// Logging simple con console para transparencia
ipcMain.handle('log', (event, level, message) => {
  console[level] ? console[level](message) : console.log(`[${level}] ${message}`);
});

console.log('Palace Anonymizer iniciado correctamente');