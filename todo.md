# Todo List - Palace Anonymizer Tool

## Requirements Analysis (COMPLETED)
- [x] Create missing required files (todo.md, documentation.md, business-specs.md)
- [x] Assess and understand the anonymizer application requirements

### Key Requirements Identified:
- **Tech Stack**: Electron app with JavaScript/Node.js
- **Input Types**: PDF, Excel (.xlsx), CSV files
- **UI**: Spanish language, dark mode, Palace branding
- **Core Function**: Replace identifiers (names, RUTs, LEIs) with pseudonyms
- **Configuration**: Excel file with counterparty mappings
- **Output**: Anonymized files with _anon suffix, optional ZIP compression
- **Email**: Optional integration with local email client

## Architecture & Approach (IN PROGRESS)

### Proposed Application Structure:
```
/app
├── main.js                 # Electron main process
├── preload.js             # Preload script for security
├── package.json           # Dependencies and app config
├── /renderer              # Frontend UI
│   ├── index.html         # Main HTML structure
│   ├── renderer.js        # Frontend JavaScript
│   └── styles.css         # Dark mode styling
├── /config
│   └── counterparty_mapping.xlsx  # User-editable config
├── /logs
│   └── anonymizer.log     # Application logs
├── /input                 # Temporary input files
└── /output               # Processed output files
```

### Core Components:
1. **File Processor Module**: Handle PDF text extraction, Excel/CSV parsing
2. **Anonymization Engine**: Apply text replacement logic using config mappings
3. **Configuration Manager**: Load/validate counterparty mapping file
4. **UI Controller**: Manage 4-tab interface (Files, Config, Results, Help)
5. **Export Handler**: Generate output files, ZIP compression, email integration

### Technical Dependencies:
- `electron` - Desktop app framework
- `pdf-parse` - PDF text extraction
- `xlsx` - Excel/CSV file processing
- `archiver` - ZIP file creation
- Spanish localization strings

## Implementation Checklist (DETAILED BREAKDOWN)

### Phase 1: Project Setup
- [ ] Initialize Electron project with package.json
- [ ] Install core dependencies (electron, pdf-parse, xlsx, archiver)
- [ ] Create directory structure (/renderer, /config, /logs, etc.)
- [ ] Set up basic Electron main.js and preload.js

### Phase 2: UI Foundation
- [ ] Create main HTML structure with 4-tab layout
- [ ] Implement Palace dark theme CSS using style-guide.md
- [ ] Add Palace logo and favicon integration
- [ ] Create Spanish localization strings
- [ ] Implement tab navigation functionality

### Phase 3: Core Modules
- [ ] Build Configuration Manager
  - [ ] Load/parse counterparty_mapping.xlsx
  - [ ] Validate required columns
  - [ ] Handle missing config file scenarios
- [ ] Build File Processor Module
  - [ ] PDF text extraction using pdf-parse
  - [ ] Excel/CSV parsing using xlsx
  - [ ] File validation and error handling
- [ ] Build Anonymization Engine
  - [ ] Text replacement logic for all identifier types
  - [ ] RUT normalization (handle dots/formatting)
  - [ ] Case-insensitive matching
  - [ ] Preserve document structure

### Phase 4: UI Implementation
- [ ] "Seleccionar archivos" tab
  - [ ] File upload area with drag & drop
  - [ ] File type validation
  - [ ] File list display
- [ ] "Configurar" tab  
  - [ ] Display current config mappings
  - [ ] Allow config file editing/replacement
  - [ ] Config validation feedback
- [ ] "Resultados" tab
  - [ ] Process files button
  - [ ] Progress indicators
  - [ ] Results display with status
- [ ] "Ayuda" tab
  - [ ] Spanish help content
  - [ ] Usage instructions

### Phase 5: Processing & Export
- [ ] File processing workflow
- [ ] Output file generation (_anon suffix)
- [ ] ZIP compression option
- [ ] Email integration (mailto: protocol)
- [ ] Error handling and user feedback

### Phase 6: Testing & Polish
- [ ] Test with sample PDF files
- [ ] Test with Excel/CSV files  
- [ ] Test configuration scenarios
- [ ] Error case testing
- [ ] UI/UX polish and refinements

## Current Tasks
- [x] Outline approach and architecture 
- [x] Break down tasks into actionable checklist
- [ ] Get plan approval from user before coding

## Completed Tasks
- [x] Create missing required files (todo.md, documentation.md, business-specs.md)
- [x] Assess and understand the anonymizer application requirements

## Notes
Following CLAUDE.md workflow for building the Palace Anonymizer Tool - a standalone desktop application for anonymizing banking documents.