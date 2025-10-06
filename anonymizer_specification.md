# Palace Anonymizer Tool — Full Specification (v1.0)

## 🧭 Overview

This is a **standalone, self-contained desktop application** designed to allow banking clients to **anonymize confidential trade documents and structured data** (like Excel/CSV trade records or PDF contracts) **before sending them to Palace** or any third-party processor.

The application:
- Runs entirely locally (no cloud or internet access)
- Requires no installation or external dependencies
- Offers **multi-format input**, **flexible configuration**, and **export & email prep**
- Is built using **Electron (Chromium + Node.js)** with a fully localized Spanish UI
- Follows Palace’s dark-mode design guide and branding standards

This spec covers **functionality, technical architecture, UX expectations, pseudonymization rules, configuration design**, and **future extensibility**. It is written to allow a developer or agent to implement the entire app end-to-end with minimal extra clarification.

---

## 🔧 Technical Stack

| Layer              | Technology Used                           |
|-------------------|--------------------------------------------|
| Desktop Runtime    | Electron (Chromium + Node.js bundle)      |
| Language           | JavaScript / Node.js                      |
| PDF Text Extraction| [`pdf-parse`](https://www.npmjs.com/package/pdf-parse) |
| Excel/CSV Parsing  | [`xlsx`](https://www.npmjs.com/package/xlsx)           |
| File Compression   | [`archiver`](https://www.npmjs.com/package/archiver)   |
| Email Draft Trigger| `mailto:` protocol or `shell.openExternal()` |
| File System Access | Node.js `fs` and `path` modules           |
| UI Framework       | HTML/CSS (custom dark mode with Palace branding) |
| Language Support   | Spanish UI labels and Spanish code comments |

---

## 🎯 Functional Objectives

1. **Simple UX**: Spanish-language, dark-mode UI with drag & drop or file picker options
2. **Fully offline**: Can run on air-gapped systems with no backend calls
3. **Dual input types**: PDF contracts OR CSV/Excel trade files
4. **Shared config logic**: Central counterparty mapping file used across all modules
5. **Reliable outputs**: Local file output, optionally zipped and attached to email draft
6. **Client trust**: Code shared in readable, commented format for transparency

---

## 📁 Input Handling

### Supported Input Types

| Format      | Usage                                  |
|-------------|-----------------------------------------|
| PDF (.pdf)  | Contracts, agreements, raw scanned or OCR PDFs |
| Excel (.xlsx)| Trade records, client mappings, tabular reports |
| CSV (.csv)  | Tabular trade data                     |

Users may:
- Upload individual files (CSV/XLSX)
- Select a folder containing PDFs
- Use drag & drop or file picker to load input

### Validation on Load

- Excel and CSV inputs must contain clearly labeled column headers
- PDFs must be extractable (either text layer or OCR-ready — future versions may add OCR support)
- Unknown file types rejected with a friendly error (in Spanish)

---

## ⚙️ Configuration Table

Stored as: `counterparty_mapping.xlsx`

Editable by user in Excel. Columns expected:

| Column Name (Spanish UI) | Description                                               |
|--------------------------|-----------------------------------------------------------|
| Nombre Legal Completo     | Full legal name of the client/counterparty               |
| Abreviaturas              | Comma-separated list of aliases/nicknames                |
| RUT                      | Chilean tax ID (with or without dot separators supported) |
| LEI                      | Legal Entity Identifier                                   |
| Pseudónimo               | Replacement name to appear in output                      |

Rules:
- All fields optional except pseudonym
- Matching logic supports case-insensitive and trimmed whitespace variants
- RUTs are normalized before matching (`12.345.678-K` = `12345678-K`)

---

## 🔍 Anonymization Logic

### General Flow

```javascript
for each input file:
    if (type === PDF) {
        extract text via pdf-parse
    } else if (type === Excel/CSV) {
        parse structured rows using xlsx
    }

    for each identifier in config:
        apply replacement across file contents
        (includes names, tax IDs, LEIs, abbreviations)

    output anonymized version
```

### Key Behavior

- All aliases are evaluated per counterparty: name, nickname, RUT, LEI
- Matches are replaced globally with the defined pseudonym
- Partial word matching is avoided (i.e., “Banco” in “BancodeChile” is not replaced unless exact alias is configured)
- If a file contains identifiers not found in the config, the file is skipped, and the user is warned (Spanish popup + log)

---

## 🧪 Validation

Before processing:
- Confirm that every identifier in input exists in config
- If unknown terms are found:
  - Show warning: “No se reconocen algunos identificadores. Agregue las entradas faltantes al archivo de configuración.”
  - Skip affected file, do not overwrite
- Allow user to download config template if empty

---

## 📤 Output Handling

### Format

| Input       | Output Format        |
|-------------|----------------------|
| PDF         | `.txt` file (anonymized version) |
| Excel/CSV   | `.xlsx` or `.csv` with same structure but replaced content |

### Output Directory

- User selects destination folder at runtime
- Optional checkbox: “Comprimir todos los archivos en un .zip”
- Filenames include suffix `_anon` before extension (e.g., `trades_anon.xlsx`)

---

## ✉️ Email Integration (Optional)

If selected:
- Once output is generated, app zips all files and:
  - Opens the default email client (via `mailto:` URI or `shell.openExternal`)
  - Attaches the `.zip` file
  - Pre-fills subject/body if configured

> 📌 No backend email service is used. Only local clients like Outlook or Thunderbird.

---

## 🎨 User Interface Details

- Dark-mode theme (Palace style guide, use style-guide.md as guidance)
- Palace logo top-left (see palace.jpg in root)
- Palace favicon (see favicon.jpg)
- Sidebar tabs:
  - 📂 “Seleccionar archivos”
  - 🛠 “Configurar”
  - 📄 “Resultados”
  - ❓ “Ayuda”

All labels, tooltips, dialogs in **Spanish**

### Help Tab

Simple in-app guide (in Spanish):
- “¿Cómo subir archivos?”
- “¿Qué campos se requieren?”
- “¿Cómo editar la configuración?”
- “¿Qué hacer si hay errores?”

---

## 💾 File + Directory Layout (Internal)

```
/app
  |-- /input
  |-- /output
  |-- /config
        └── counterparty_mapping.xlsx
  |-- /logs
        └── anonymizer.log
  |-- main.js
  |-- preload.js
  |-- /renderer
        └── index.html
        └── renderer.js
        └── styles.css
```

---

## 🧩 Extensibility & Future Features

- ✅ Add support for DOCX, JSON, other structured files
- ✅ Add basic OCR layer for image-based PDFs
- ✅ Import/export anonymization presets
- ✅ Enable command-line version (headless mode)
- ✅ Multiple output formats: PDF back-conversion, redacted highlights, etc.

---

## 🧠 Sample Pseudocode Snippet

```js
function replaceAllIdentifiers(content, config) {
  for (const row of config) {
    const aliases = [
      row["Nombre Legal Completo"],
      ...row["Abreviaturas"].split(","),
      row["RUT"].replaceAll(".", ""),
      row["LEI"]
    ].filter(Boolean);

    for (const alias of aliases) {
      const safeAlias = alias.trim().toLowerCase();
      content = content.replaceAll(new RegExp(safeAlias, "gi"), row["Pseudónimo"]);
    }
  }
  return content;
}
```

---

## 🛡 Security & Trust Considerations

- Open-source option (shared codebase as `.zip`)
- Spanish-language inline code comments
- No runtime telemetry, analytics, or tracking
- No external API calls (verified via static analysis)

---

## 🏁 Summary

This app is designed to:
- Be used daily by banking clients
- Run in highly restricted local environments
- Require zero technical training
- Deliver high-trust, low-friction anonymization of sensitive data

> ✅ Designed for compliance  
> ✅ Built for trust  
> ✅ Packaged for productivity

---

© Palace — Financial Markets Technology for Latam