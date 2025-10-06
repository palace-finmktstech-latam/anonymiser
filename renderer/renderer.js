// renderer.js - Controlador principal del frontend para Palace Anonymizer
// Incluye localización en español y funcionalidad completa

// Configuración del cliente
const BANK_NAME = "Banco ABC";

// Strings de localización en español
const messages = {
  // Mensajes generales
  loading: 'Cargando...',
  success: 'Éxito',
  error: 'Error',
  warning: 'Advertencia',
  
  // Archivos
  filesSelected: 'archivo(s) seleccionado(s)',
  noFilesSelected: 'No se han seleccionado archivos aún',
  fileTypeNotSupported: 'Tipo de archivo no soportado',
  fileTooLarge: 'El archivo es demasiado grande (máx. 100MB)',
  dragFilesHere: 'Arrastra archivos aquí',
  selectFiles: 'selecciona archivos',
  supportedFormats: 'Formatos soportados: PDF, Excel (.xlsx), CSV',
  
  // Configuración
  configLoading: 'Cargando configuración...',
  configLoaded: 'Configuración cargada correctamente',
  configError: 'Error al cargar la configuración',
  configNotFound: 'Archivo de configuración no encontrado',
  configInvalid: 'Configuración inválida - revisa los campos requeridos',
  
  // Procesamiento
  processing: 'Procesando archivos...',
  processComplete: 'Procesamiento completado',
  processError: 'Error durante el procesamiento',
  
  // Resultados
  filesProcessed: 'archivos procesados',
  errorsFound: 'errores encontrados',
  outputSaved: 'Archivos guardados en',
  
  // Validación
  selectOutputFolder: 'Por favor selecciona una carpeta de destino',
  noConfigLoaded: 'Debes cargar un archivo de configuración válido',
  unknownIdentifiers: 'No se reconocen algunos identificadores. Agregue las entradas faltantes al archivo de configuración.'
};

// Variables globales para el estado de la aplicación
let selectedPdfFiles = [];
let selectedExcelFiles = [];
let currentConfig = null;
let currentTab = 'files';
let processingResults = [];
let defaultConfigDirectory = null; // Directorio por defecto para buscar configuración

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
  console.log('Iniciando Palace Anonymizer (modo sesión segura)...');
  
  initializeTabNavigation();
  initializeFileHandling();
  initializeConfiguration();
  initializeProcessing();
  
  // NO cargar configuración automáticamente - sesión segura
  // El usuario debe cargar explícitamente en cada sesión
  
  console.log('Palace Anonymizer inicializado - esperando configuración del usuario');
});

// Navegación por pestañas
function initializeTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });
  
  // Botones de navegación entre pestañas
  document.getElementById('next-to-config-btn')?.addEventListener('click', () => switchTab('config'));
  document.getElementById('back-to-config-btn')?.addEventListener('click', () => switchTab('config'));
}

function switchTab(tabName) {
  // Actualizar botones de pestaña
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  
  // Actualizar contenido de pestañas
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });
  document.getElementById(`${tabName}-tab`).classList.add('active');
  
  currentTab = tabName;
  
  // Ejecutar lógica específica por pestaña
  switch(tabName) {
    case 'config':
      // No cargar automáticamente - sesión segura
      if (!currentConfig) {
        updateConfigStatus('Sin configuración - sube un archivo para comenzar', 'warning');
      }
      break;
    case 'results':
      initializeResultsTab();
      break;
  }
}

// Manejo de archivos
function initializeFileHandling() {
  const pdfDropZone = document.getElementById('pdf-drop-zone');
  const excelDropZone = document.getElementById('excel-drop-zone');
  const selectPdfBtn = document.getElementById('select-pdf-folder-btn');
  const selectExcelBtn = document.getElementById('select-excel-files-btn');
  const clearFilesBtn = document.getElementById('clear-files-btn');
  
  // PDF Drag & Drop
  pdfDropZone.addEventListener('dragover', (e) => handleDragOver(e, 'pdf'));
  pdfDropZone.addEventListener('dragleave', (e) => handleDragLeave(e, 'pdf'));
  pdfDropZone.addEventListener('drop', (e) => handleDrop(e, 'pdf'));
  
  // Excel Drag & Drop
  excelDropZone.addEventListener('dragover', (e) => handleDragOver(e, 'excel'));
  excelDropZone.addEventListener('dragleave', (e) => handleDragLeave(e, 'excel'));
  excelDropZone.addEventListener('drop', (e) => handleDrop(e, 'excel'));
  
  // Selección manual
  selectPdfBtn.addEventListener('click', selectPdfFolder);
  selectExcelBtn.addEventListener('click', selectExcelFiles);
  
  // Limpiar listas
  clearFilesBtn.addEventListener('click', clearAllFiles);
  
  // Event delegation for dynamically created remove buttons
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('remove-file-btn')) {
      const fileId = event.target.getAttribute('data-file-id');
      const fileType = event.target.getAttribute('data-file-type');
      removeFile(fileId, fileType);
    }
  });
}

function handleDragOver(event, type) {
  event.preventDefault();
  event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event, type) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
}

function handleDrop(event, type) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  
  const files = Array.from(event.dataTransfer.files);
  addFiles(files, type);
}

async function selectPdfFolder() {
  try {
    const result = await window.electronAPI.selectOutputFolder();
    if (!result.canceled && result.filePaths.length > 0) {
      const folderPath = result.filePaths[0];
      console.log('Carpeta PDF seleccionada:', folderPath);
      
      // Leer archivos PDF de la carpeta
      const pdfResult = await window.electronAPI.readFolderPdfs(folderPath);
      if (pdfResult.success) {
        console.log('PDFs encontrados:', pdfResult.files);
        
        // Convertir a formato esperado y agregar a la lista
        const pdfFiles = pdfResult.files.map(file => ({
          ...file,
          id: Date.now() + Math.random(),
          type: 'pdf',
          status: 'valid',
          processed: false
        }));
        
        // Reemplazar archivos PDF existentes
        selectedPdfFiles = pdfFiles;
        updateFilesList();
        updateNavigationButtons();
        
        console.log(`${pdfFiles.length} archivos PDF cargados desde la carpeta`);
      } else {
        throw new Error(pdfResult.error);
      }
    }
  } catch (error) {
    console.error('Error al seleccionar carpeta PDF:', error);
    showNotification('Error', 'Error al leer carpeta PDF: ' + error.message, 'error');
  }
}

async function selectExcelFiles() {
  try {
    const result = await window.electronAPI.selectFiles();
    if (!result.canceled && result.filePaths.length > 0) {
      const files = await Promise.all(
        result.filePaths.map(async (filePath) => {
          const fileInfo = await window.electronAPI.getFileInfo(filePath);
          return {
            name: filePath.split(/[\\/]/).pop(),
            path: filePath,
            size: fileInfo.success ? fileInfo.size : 0,
            type: getFileType(filePath)
          };
        })
      );
      await addFiles(files, 'excel');
    }
  } catch (error) {
    console.error('Error al seleccionar archivos Excel:', error);
    showNotification('Error', 'Error al seleccionar archivos Excel: ' + error.message, 'error');
  }
}

async function addFiles(files, type) {
  const targetArray = type === 'pdf' ? selectedPdfFiles : selectedExcelFiles;
  const expectedExtensions = type === 'pdf' ? ['.pdf'] : ['.xlsx', '.csv'];
  
  const validFiles = files.filter(file => {
    const isValidType = expectedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    if (!isValidType) {
      console.warn(`Archivo ${file.name} no válido para tipo ${type}`);
      return false;
    }
    
    return true;
  });
  
  // Agregar archivos válidos a la lista correspondiente
  for (const file of validFiles) {
    if (!targetArray.find(f => f.path === file.path)) {
      const fileWithColumns = {
        ...file,
        id: Date.now() + Math.random(),
        status: 'valid',
        processed: false
      };
      
      // Para archivos Excel/CSV, extraer columnas
      if (type === 'excel') {
        try {
          const columns = await extractFileColumns(file.path);
          fileWithColumns.columns = columns;
          fileWithColumns.selectedColumns = []; // Usuario seleccionará
        } catch (error) {
          console.warn('No se pudieron extraer columnas de', file.name, error);
          fileWithColumns.columns = [];
          fileWithColumns.selectedColumns = [];
        }
      }
      
      targetArray.push(fileWithColumns);
    }
  }
  
  updateFilesList();
  updateNavigationButtons();
  
  // Si hay archivos Excel/CSV, mostrar selector de columnas
  if (type === 'excel' && selectedExcelFiles.length > 0) {
    showColumnSelector();
  }
}

function updateFilesList() {
  // Update PDF files list
  const pdfFilesList = document.getElementById('pdf-files-list');
  if (selectedPdfFiles.length === 0) {
    pdfFilesList.innerHTML = '<div class="empty-state">No se han seleccionado documentos PDF</div>';
  } else {
    pdfFilesList.innerHTML = selectedPdfFiles.map(file => `
      <div class="file-item" data-file-id="${file.id}">
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-details">${formatFileSize(file.size)}</div>
        </div>
        <div class="file-actions">
          <button class="danger-button remove-file-btn" data-file-id="${file.id}" data-file-type="pdf">✕</button>
        </div>
      </div>
    `).join('');
  }
  
  // Update Excel files list
  const excelFilesList = document.getElementById('excel-files-list');
  if (selectedExcelFiles.length === 0) {
    excelFilesList.innerHTML = '<div class="empty-state">No se han seleccionado archivos Excel/CSV</div>';
  } else {
    excelFilesList.innerHTML = selectedExcelFiles.map(file => `
      <div class="file-item" data-file-id="${file.id}">
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-details">${formatFileSize(file.size)}</div>
        </div>
        <div class="file-actions">
          <button class="danger-button remove-file-btn" data-file-id="${file.id}" data-file-type="excel">✕</button>
        </div>
      </div>
    `).join('');
  }
}

function removeFile(fileId, type) {
  // Convert fileId to number since getAttribute returns string but IDs are stored as numbers
  const numericFileId = parseFloat(fileId);
  
  if (type === 'pdf') {
    selectedPdfFiles = selectedPdfFiles.filter(file => file.id !== numericFileId);
  } else {
    selectedExcelFiles = selectedExcelFiles.filter(file => file.id !== numericFileId);
    
    // Si no quedan archivos Excel/CSV, ocultar selector
    if (selectedExcelFiles.length === 0) {
      const columnSelector = document.getElementById('column-selector');
      columnSelector.style.display = 'none';
    } else {
      // Actualizar selector con columnas restantes
      showColumnSelector();
    }
  }
  updateFilesList();
  updateNavigationButtons();
}

function clearAllFiles() {
  selectedPdfFiles = [];
  selectedExcelFiles = [];
  updateFilesList();
  updateNavigationButtons();
}

function updateNavigationButtons() {
  const nextButton = document.getElementById('next-to-config-btn');
  if (nextButton) {
    const hasFiles = selectedPdfFiles.length > 0 || selectedExcelFiles.length > 0;
    nextButton.disabled = !hasFiles;
  }
}

// Función para extraer columnas de archivos CSV/Excel
async function extractFileColumns(filePath) {
  try {
    const fileContent = await window.electronAPI.readFile(filePath);
    if (!fileContent.success) {
      throw new Error(fileContent.error);
    }
    
    const content = fileContent.content;
    const isCSV = filePath.toLowerCase().endsWith('.csv');
    
    if (isCSV) {
      // Extraer primera línea para CSV
      const lines = content.split('\n');
      if (lines.length > 0) {
        const headerLine = lines[0].trim();
        return parseCSVLine(headerLine).map(col => col.trim()).filter(col => col);
      }
    } else {
      // Para Excel, necesitaríamos usar la librería xlsx
      // Por ahora, simulamos extrayendo la primera línea como CSV
      const lines = content.split('\n');
      if (lines.length > 0) {
        const headerLine = lines[0].trim();
        return parseCSVLine(headerLine).map(col => col.trim()).filter(col => col);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error al extraer columnas:', error);
    return [];
  }
}

// Mostrar selector de columnas
function showColumnSelector() {
  const columnSelector = document.getElementById('column-selector');
  const columnsGrid = document.getElementById('columns-grid');
  
  // Obtener todas las columnas únicas de todos los archivos Excel/CSV
  const allColumns = new Set();
  selectedExcelFiles.forEach(file => {
    if (file.columns) {
      file.columns.forEach(col => allColumns.add(col));
    }
  });
  
  if (allColumns.size === 0) {
    columnSelector.style.display = 'none';
    return;
  }
  
  // Crear checkboxes para cada columna
  columnsGrid.innerHTML = Array.from(allColumns).map(column => `
    <div class="column-checkbox">
      <input type="checkbox" id="col-${column}" data-column="${column}" onchange="updateSelectedColumns()">
      <label for="col-${column}">${column}</label>
    </div>
  `).join('');
  
  columnSelector.style.display = 'block';
  console.log('Columnas detectadas:', Array.from(allColumns));
}

// Actualizar columnas seleccionadas
function updateSelectedColumns() {
  const selectedColumns = Array.from(document.querySelectorAll('#columns-grid input[type="checkbox"]:checked'))
    .map(cb => cb.getAttribute('data-column'));
  
  // Actualizar todos los archivos Excel/CSV con las columnas seleccionadas
  selectedExcelFiles.forEach(file => {
    file.selectedColumns = selectedColumns.filter(col => file.columns && file.columns.includes(col));
  });
  
  console.log('Columnas seleccionadas para anonimizar:', selectedColumns);
}

// Ocultar selector cuando se limpian archivos
function clearAllFiles() {
  selectedPdfFiles = [];
  selectedExcelFiles = [];
  
  // Ocultar selector de columnas
  const columnSelector = document.getElementById('column-selector');
  columnSelector.style.display = 'none';
  
  updateFilesList();
  updateNavigationButtons();
}

// Configuración
function initializeConfiguration() {
  document.getElementById('set-default-dir-btn')?.addEventListener('click', setDefaultConfigDirectory);
  document.getElementById('upload-config-btn')?.addEventListener('click', openConfigUpload);
  document.getElementById('config-file-input')?.addEventListener('change', uploadConfigFile);
  
  // Cargar directorio por defecto si está almacenado localmente
  const savedDirectory = localStorage.getItem('defaultConfigDirectory');
  if (savedDirectory) {
    defaultConfigDirectory = savedDirectory;
    updateConfigStatus('Directorio configurado: ' + savedDirectory.split(/[\\/]/).pop(), 'success');
  }
}

// Nuevas funciones para manejo de configuración en sesión
async function setDefaultConfigDirectory() {
  try {
    const result = await window.electronAPI.selectOutputFolder();
    if (!result.canceled && result.filePaths.length > 0) {
      defaultConfigDirectory = result.filePaths[0];
      // Guardar en localStorage para persistir entre sesiones (solo el path, no los datos)
      localStorage.setItem('defaultConfigDirectory', defaultConfigDirectory);
      const dirName = defaultConfigDirectory.split(/[\\/]/).pop();
      updateConfigStatus(`Directorio establecido: ${dirName}`, 'success');
      console.log('Directorio por defecto configurado:', defaultConfigDirectory);
    }
  } catch (error) {
    console.error('Error al establecer directorio:', error);
    updateConfigStatus('Error al establecer directorio', 'error');
  }
}

function openConfigUpload() {
  // Si hay un directorio por defecto, intentar abrir desde ahí
  if (defaultConfigDirectory) {
    // Configurar el input para que inicie en ese directorio
    // Nota: Los navegadores no permiten establecer paths por seguridad
    // pero podemos informar al usuario
    updateConfigStatus('Selecciona el archivo desde: ' + defaultConfigDirectory, 'info');
  }
  document.getElementById('config-file-input').click();
}

function updateConfigStatus(message, type = 'info') {
  const configStatus = document.getElementById('config-status');
  if (configStatus) {
    const indicatorClass = type === 'error' ? 'error' : 
                           type === 'success' ? 'success' : 
                           type === 'warning' ? 'warning' : 'loading';
    
    configStatus.innerHTML = `
      <span class="status-indicator ${indicatorClass}"></span>
      <span>${message}</span>
    `;
  }
}

async function processConfigFile(content) {
  try {
    console.log('Contenido recibido (primeros 200 chars):', content.substring(0, 200));
    console.log('Encoding check - buscando caracteres especiales:', content.match(/[áéíóúñü]/gi));
    
    // Parsear CSV content
    const lines = content.toString().trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Archivo CSV vacío o sin datos');
    }
    
    // Saltar la primera línea (headers)
    const dataLines = lines.slice(1);
    
    const config = [];
    for (const line of dataLines) {
      if (line.trim()) {
        console.log('Procesando línea raw:', line);
        // Parsear CSV simple (maneja comillas básicas)
        const columns = parseCSVLine(line);
        console.log('Columnas parseadas:', columns);
        
        if (columns.length >= 6) {
          const entry = {
            nombreLegal: columns[0] || '',
            abreviaturas: columns[1] || '',
            rut: columns[2] || '',
            lei: columns[3] || '',
            address: columns[4] || '',
            pseudonimo: columns[5] || ''
          };
          console.log('Entrada creada:', entry.nombreLegal, '-> pseudónimo:', entry.pseudonimo);
          config.push(entry);
        }
      }
    }
    
    console.log('Configuración parseada completa:', config);
    return config;
    
  } catch (error) {
    console.error('Error al procesar archivo de configuración:', error);
    // Retornar datos por defecto si hay error
    return [
      {
        nombreLegal: 'Error al cargar - usando datos por defecto',
        abreviaturas: '',
        rut: '',
        lei: '',
        pseudonimo: 'PENDIENTE'
      }
    ];
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function updateConfigPreview() {
  const configTable = document.getElementById('config-table-body');

  if (!currentConfig || currentConfig.length === 0) {
    configTable.innerHTML = `
      <tr class="empty-state">
        <td colspan="6">No hay datos de configuración disponibles</td>
      </tr>
    `;
    return;
  }

  configTable.innerHTML = currentConfig.map(entry => `
    <tr>
      <td>${entry.nombreLegal || ''}</td>
      <td>${entry.abreviaturas || ''}</td>
      <td>${entry.rut || ''}</td>
      <td>${entry.lei || ''}</td>
      <td>${entry.address || ''}</td>
      <td><strong>${entry.pseudonimo || ''}</strong></td>
    </tr>
  `).join('');
}


async function uploadConfigFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    console.log('Cargando configuración en memoria (sesión segura):', file.name);
    
    const fileContent = await readFileAsText(file);
    console.log('Contenido leído:', fileContent.substring(0, 100) + '...');
    
    // Procesar directamente en memoria - NO guardar en disco
    currentConfig = await processConfigFile(fileContent);
    
    if (currentConfig && currentConfig.length > 0) {
      updateConfigStatus(`Configuración cargada: ${currentConfig.length} contrapartes (solo sesión)`, 'success');
      updateConfigPreview();
      console.log('Configuración cargada en memoria exitosamente');
      
      // NO mostrar notificación con alert - ya tenemos el status update
    } else {
      throw new Error('Archivo vacío o formato inválido');
    }
    
    // Limpiar el input
    event.target.value = '';
    
  } catch (error) {
    console.error('Error al cargar configuración:', error);
    updateConfigStatus(`Error: ${error.message}`, 'error');
    event.target.value = '';
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log('FileReader resultado:', e.target.result.substring(0, 100));
      resolve(e.target.result);
    };
    reader.onerror = (e) => reject(new Error('Error al leer archivo'));
    
    // Forzar UTF-8 con múltiples enfoques
    try {
      reader.readAsText(file, 'utf-8');
    } catch (error) {
      console.warn('Fallback: usando readAsText sin encoding específico');
      reader.readAsText(file);
    }
  });
}


// Procesamiento
function initializeProcessing() {
  document.getElementById('select-output-btn')?.addEventListener('click', selectOutputFolder);
  document.getElementById('start-process-btn')?.addEventListener('click', startProcessing);
  document.getElementById('process-again-btn')?.addEventListener('click', resetForNewProcess);
}

function initializeResultsTab() {
  // Validar que hay archivos y configuración
  const startButton = document.getElementById('start-process-btn');
  const isReady = (selectedPdfFiles.length > 0 || selectedExcelFiles.length > 0) && currentConfig && currentConfig.length > 0;
  
  if (startButton) {
    startButton.disabled = !isReady;
  }
  
  if (!isReady) {
    showNotification(messages.warning, 'Selecciona archivos y carga la configuración antes de procesar', 'warning');
  }
}

async function selectOutputFolder() {
  try {
    const result = await window.electronAPI.selectOutputFolder();
    if (!result.canceled && result.filePaths.length > 0) {
      const outputFolder = result.filePaths[0];
      document.getElementById('output-folder').value = outputFolder;
    }
  } catch (error) {
    console.error('Error al seleccionar carpeta:', error);
    showNotification(messages.error, 'Error al seleccionar carpeta de destino', 'error');
  }
}

async function startProcessing() {
  const outputFolder = document.getElementById('output-folder').value;
  const createZip = document.getElementById('create-zip-checkbox').checked;
  const openEmail = document.getElementById('open-email-checkbox').checked;
  
  if (!outputFolder) {
    showNotification(messages.warning, messages.selectOutputFolder, 'warning');
    return;
  }
  
  if (!currentConfig) {
    showNotification(messages.warning, messages.noConfigLoaded, 'warning');
    return;
  }
  
  // Mostrar panel de progreso
  const progressSection = document.getElementById('progress-section');
  progressSection.style.display = 'block';
  
  try {
    await processFiles(outputFolder, createZip, openEmail);
  } catch (error) {
    console.error('Error durante el procesamiento:', error);
    showNotification(messages.error, messages.processError, 'error');
  }
}

async function processFiles(outputFolder, createZip, openEmail) {
  const progressFill = document.getElementById('progress-fill');
  const progressStatus = document.getElementById('progress-status');
  const progressDetails = document.getElementById('progress-details');
  
  processingResults = [];
  
  const allFiles = [...selectedPdfFiles, ...selectedExcelFiles];
  
  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const progress = ((i + 1) / allFiles.length) * 100;
    
    // Actualizar progreso
    progressFill.style.width = `${progress}%`;
    progressStatus.textContent = `Procesando ${file.name}...`;
    progressDetails.textContent = `Archivo ${i + 1} de ${allFiles.length}`;
    
    try {
      // Simular procesamiento del archivo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await processFile(file, outputFolder);
      processingResults.push({
        file: file,
        success: result.success,
        outputPath: result.outputPath,
        error: result.error
      });
      
    } catch (error) {
      processingResults.push({
        file: file,
        success: false,
        error: error.message
      });
    }
  }
  
  // Procesamiento completado
  progressStatus.textContent = messages.processComplete;
  progressDetails.textContent = `${processingResults.length} ${messages.filesProcessed}`;
  
  // Mostrar resultados
  showResults();
  
  // Crear ZIP si está solicitado
  if (createZip) {
    await createZipFile(outputFolder);
  }
  
  // Abrir email si está solicitado
  if (openEmail) {
    await prepareEmail(outputFolder, createZip);
  }
}

async function processFile(file, outputFolder) {
  const isPdf = file.name.toLowerCase().endsWith('.pdf');
  
  // Para PDFs, cambiar extensión a .txt y extraer solo el texto
  const outputFileName = isPdf 
    ? file.name.replace(/\.pdf$/i, '_anon.txt')
    : file.name.replace(/(\.[^.]+)$/, '_anon$1');
  const outputPath = `${outputFolder}/${outputFileName}`;
  
  try {
    let content;
    
    if (isPdf) {
      // Para PDFs, extraer texto usando pdf-parse
      const pdfText = await window.electronAPI.extractPdfText(file.path);
      if (!pdfText.success) {
        throw new Error(pdfText.error);
      }
      content = pdfText.text;
    } else {
      // Para Excel/CSV, leer contenido directamente
      const fileContent = await window.electronAPI.readFile(file.path);
      if (!fileContent.success) {
        throw new Error(fileContent.error);
      }
      content = fileContent.content;
    }
    
    // Aplicar anonimización
    const anonymizedContent = await anonymizeContent(content, file.type);
    
    // Escribir archivo anonimizado
    const writeResult = await window.electronAPI.writeFile(outputPath, anonymizedContent);
    if (!writeResult.success) {
      throw new Error(writeResult.error);
    }
    
    return {
      success: true,
      outputPath: outputPath
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function anonymizeContent(content, fileType) {
  // Anonimización con normalización de texto español
  let processedContent = content.toString();

  if (currentConfig) {
    currentConfig.forEach(mapping => {
      // Handle RUT field specially with multiple variations
      if (mapping.rut && mapping.rut.trim()) {
        const rut = mapping.rut.trim();

        // Create RUT variations:
        // 1. Original: 12.345.678-9
        // 2. Without dots: 12345678-9
        // 3. Without suffix: 12.345.678
        // 4. Without dots and suffix: 12345678
        const rutVariations = [
          rut,
          rut.replace(/\./g, ''), // Remove dots
          rut.replace(/-\w+$/, ''), // Remove -N suffix
          rut.replace(/\./g, '').replace(/-\w+$/, '') // Remove both dots and suffix
        ].filter(v => v && v.length > 0);

        rutVariations.forEach(rutVar => {
          const flexiblePattern = createFlexiblePattern(rutVar);
          const regex = new RegExp(`\\b${flexiblePattern}\\b`, 'gi');
          processedContent = processedContent.replace(regex, 'PSEUDONYMISED RUT');
        });
      }

      // Handle address field (can have multiple addresses separated by semicolon)
      if (mapping.address && mapping.address.trim()) {
        const addresses = mapping.address.split(/[;]/).map(a => a.trim()).filter(Boolean);

        addresses.forEach(address => {
          const normalizedAddress = normalizeSpanishText(address);
          const noSpacesAddress = address.replace(/\s+/g, ''); // Version without spaces for PDFs that lose spaces
          const noSpacesNormalized = normalizedAddress.replace(/\s+/g, '');

          const addressPatterns = [address, normalizedAddress, noSpacesAddress, noSpacesNormalized].filter(Boolean);

          addressPatterns.forEach(pattern => {
            const flexiblePattern = createFlexiblePattern(pattern);
            const regex = new RegExp(`\\b${flexiblePattern}\\b`, 'gi');
            processedContent = processedContent.replace(regex, 'PSEUDONYMISED ADDRESS');
          });
        });
      }

      // Obtener todos los alias/identificadores para esta contraparte (excluding RUT and address, handled above)
      const aliases = [
        mapping.nombreLegal,
        ...(mapping.abreviaturas ? mapping.abreviaturas.split(/[,;]/) : []),
        mapping.lei
      ].filter(Boolean);

      aliases.forEach(alias => {
        if (alias.trim()) {
          // Normalizar el alias de la configuración
          const normalizedAlias = normalizeSpanishText(alias.trim());
          const noSpacesAlias = alias.trim().replace(/\s+/g, ''); // Version without spaces for PDFs that lose spaces
          const noSpacesNormalized = normalizedAlias.replace(/\s+/g, '');

          if (normalizedAlias) {
            // Crear regex que busque tanto la versión original como la normalizada
            // Esto maneja casos donde el documento tiene acentos pero config no, o viceversa
            // También incluye versiones sin espacios para PDFs mal extraídos
            const aliasPatterns = [
              alias.trim(),
              normalizedAlias,
              noSpacesAlias,
              noSpacesNormalized
            ];

            // Aplicar cada patrón
            aliasPatterns.forEach(pattern => {
              if (pattern) {
                // Crear patrón flexible que maneja saltos de línea y espacios múltiples
                const flexiblePattern = createFlexiblePattern(pattern);
                const regex = new RegExp(`\\b${flexiblePattern}\\b`, 'gi');
                processedContent = processedContent.replace(regex, mapping.pseudonimo);
              }
            });
          }
        }
      });
    });
  }

  return processedContent;
}

// Función auxiliar para escapar caracteres especiales en regex
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function showResults() {
  const resultsSection = document.getElementById('results-section');
  const resultsSummary = document.getElementById('results-summary');
  const resultsList = document.getElementById('results-list');
  
  resultsSection.style.display = 'block';
  
  // Resumen
  const successCount = processingResults.filter(r => r.success).length;
  const errorCount = processingResults.length - successCount;
  
  resultsSummary.innerHTML = `
    <div class="results-stats">
      <div class="stat-item text-success">
        <strong>${successCount}</strong> archivos procesados correctamente
      </div>
      <div class="stat-item text-error">
        <strong>${errorCount}</strong> errores encontrados
      </div>
    </div>
  `;
  
  // Lista detallada
  resultsList.innerHTML = processingResults.map(result => `
    <div class="result-item">
      <div class="result-info">
        <div class="result-name">${result.file.name}</div>
        <div class="result-details">
          ${result.success ? `Guardado como: ${result.outputPath}` : `Error: ${result.error}`}
        </div>
      </div>
      <div class="result-status ${result.success ? 'success' : 'error'}">
        ${result.success ? 'Completado' : 'Error'}
      </div>
    </div>
  `).join('');
  
  // Mostrar botón para procesar más archivos
  document.getElementById('process-again-btn').style.display = 'block';
}

// Normalización de texto español - quitar acentos y caracteres especiales
function normalizeSpanishText(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    // Quitar acentos de vocales
    .replace(/[áàâã]/g, 'a')
    .replace(/[éèêë]/g, 'e') 
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõ]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    // Quitar ñ 
    .replace(/[ñ]/g, 'n')
    // Normalizar todos los espacios en blanco (incluye \n, \r, \t, espacios múltiples)
    .replace(/\s+/g, ' ');
}

// Función para crear patrones de búsqueda flexibles que manejen saltos de línea en PDFs
function createFlexiblePattern(text) {
  if (!text) return '';
  
  // Escapar caracteres especiales de regex
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Crear patrón que permita espacios en blanco opcionales entre cada palabra
  // Esto maneja casos como "BANCO\nABC" o "BANCO   ABC"
  return escaped.replace(/\s+/g, '\\s+');
}

// Utilidades
function getFileType(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  switch(extension) {
    case 'pdf': return 'pdf';
    case 'xlsx': return 'excel';
    case 'csv': return 'csv';
    default: return 'unknown';
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showNotification(title, message, type = 'info') {
  // Implementación simple de notificaciones
  console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
  
  // Mostrar notificación más descriptiva
  const fullMessage = `${title}\n\n${message}\n\n(Revisa la consola para más detalles)`;
  alert(fullMessage);
}

function resetForNewProcess() {
  // Limpiar resultados y volver a la pestaña de archivos
  processingResults = [];
  document.getElementById('progress-section').style.display = 'none';
  document.getElementById('results-section').style.display = 'none';
  switchTab('files');
}

// Funciones auxiliares para ZIP y Email
async function createZipFile(outputFolder) {
  console.log('Creando archivo ZIP...');
  
  try {
    const result = await window.electronAPI.createZip(outputFolder);
    if (result.success) {
      console.log(`Archivo ZIP creado exitosamente: ${result.zipPath} (${result.size} bytes)`);
      return result;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error al crear ZIP:', error);
    showNotification('error', `Error al crear ZIP: ${error.message}`, 'error');
    throw error;
  }
}

async function prepareEmail(outputFolder, hasZip) {
  // Preparar email con archivos adjuntos
  // Format date as DD-MM-YYYY
  const today = new Date();
  const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
  
  const bodyText = hasZip 
    ? `Adjunto encontrará los documentos anonimizados procesados con Palace Anonymizer.`
    : `Adjunto encontrará los documentos anonimizados procesados con Palace Anonymizer.`;
  
  const emailOptions = {
    to: 'info@palace.cl',
    subject: `${formattedDate} operaciones desde ${BANK_NAME}`,
    body: bodyText,
    outputFolder: outputFolder,
    attachment: hasZip ? `${outputFolder}\\anonymized_files.zip` : null
  };
  
  try {
    await window.electronAPI.openEmail(emailOptions);
  } catch (error) {
    console.error('Error al preparar email:', error);
  }
}