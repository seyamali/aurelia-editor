# Aurelia Editor

[![NPM Version](https://img.shields.io/npm/v/@seyamali/aurelia-editor?style=flat-square&color=blue)](https://www.npmjs.com/package/@seyamali/aurelia-editor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/Written%20With-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

**Aurelia Editor** is a powerful, customizable, and framework-agnostic rich text editor built on top of [Lexical](https://lexical.dev/). It is designed for modern content creation, offering a clean, "Notion-style" interface combined with enterprise-grade features like High-Fidelity Design Preservation, MS Word compatibility, and advanced layout tools.

![Editor Preview](https://via.placeholder.com/800x400?text=Aurelia+Editor+Preview)

---

## ✨ Features
 
**Aurelia Editor** delivers a premium writing experience with a "batteries-included" philosophy:
 
### 🎯 High-Fidelity Design (Same-to-Same)
*   **Design Preservation**: Paste complex HTML layouts from tools or websites and preserve them 100%—including styles, meta tags, and scripts.
*   **Clean Export**: Strips Lexical-specific internal attributes and pollution, ensuring production-ready HTML.
*   **CSS Sandboxing**: Prefixes and scopes custom CSS to the editor container, preventing global style leaks.

### 📝 Core Editing
*   **Rich Text**: Bold, Italic, Underline, Strikethrough, Subscript, Superscript, Inline Code.
*   **Typography**: Hierarchical headings (H1-H6), Blockquotes, Dividers.
*   **Fonts & Color**: Custom font families, text colors, and background highlights.
*   **Lists**: Nested bullet and numbered lists with indentation controls.
*   **Case Converter**: Toggle text between Uppercase, Lowercase, and Title Case.
 
### 🖼️ Media & Embeds
*   **Smart Images**: Drag & drop upload, resize, alignment positioning, captions, and link support.
*   **Video Embedding**: YouTube integration with preview.
*   **HTML Snippets**: Insert raw HTML for custom widgets or layouts.
 
### 📊 Structured Content
*   **Advanced Tables**: Header rows, cell merging, splitting, column resizing, and row/column management.
*   **Code Blocks**: Syntax highlighting for multiple languages with copy support.
*   **Table of Contents**: Auto-generated TOC based on document headings with scroll-spy.
*   **Footnotes**: Academic-style referencing and footnotes.
 
### 🚀 Productivity Tools
*   **Slash Commands**: Type `/` to access a unified menu for all tools.
*   **Format Painter**: Copy and paste styles between text blocks.
*   **Find & Replace**: Search with match highlighting and bulk replacement.
*   **Autosave**: Automatic local backup to prevent data loss.
*   **Placeholders / Merge Fields**: Insert dynamic variables like `{{FirstName}}`.
 
---

## 📦 Installation

Install the package via npm:

```bash
npm install @seyamali/aurelia-editor
```

---

## 🛠️ Usage

### Basic Setup (Recommended)
Initialize the full-featured editor (including toolbar and layout) with a single command:

```typescript
import { AureliaEditor } from '@seyamali/aurelia-editor';
import '@seyamali/aurelia-editor/dist/aurelia-editor.css';

// 1. Get container
const container = document.getElementById('editor-root');

// 2. Initialize (Static factory method)
const editor = await AureliaEditor.create(container);
```

### Retrieval & Fidelity (Framework Integration)
To interact with the editor in React, Angular, or Vue, use these high-fidelity helper methods:

```typescript
// --- GET CONTENT ---
// Returns clean, production-ready, high-fidelity HTML
const html = await editor.getHtml();

// --- SET CONTENT ---
// Sets high-fidelity HTML and injects associated styles/metadata
await editor.setHtml(initialHtml);

// --- GET STATE ---
// Get the internal Lexical JSON state
const jsonState = editor.getInternalEditor().getEditorState().toJSON();
```

---

## ⚙️ Configuration

Aurelia Editor features a dynamic toolbar system. You can switch between built-in presets or define your own configuration.

### Toolbar Presets
Available presets: `standard`, `minimal`, `blogging`, `documentation`, `full`.

```typescript
import { ToolbarConfigManager } from '@seyamali/aurelia-editor';

// Switch to a documentation-focused interface
ToolbarConfigManager.applyPreset('documentation');
```

---

## ⌨️ Shortcuts

| Context | Shortcut | Action |
| :--- | :--- | :--- |
| **Formatting** | `Ctrl + B` | Bold |
| | `Ctrl + I` | Italic |
| | `Ctrl + U` | Underline |
| **History** | `Ctrl + Z` | Undo |
| | `Ctrl + Y` | Redo |
| **Tools** | `/` | Slash Menu |
| | `Ctrl + F` | Find & Replace |
| | `Ctrl + S` | Save (Autosave trigger) |
| **Navigation** | `Ctrl + K` | Insert Link |

---

## 📄 License & Attribution

This project is open-source software licensed under the **MIT License**.

### Terms of Use:
*   ✅ **Commercial Use**: Allowed
*   ✅ **Modification**: Allowed
*   ✅ **Private Use**: Allowed
*   ⚠️ **Attribution Required**: You must retain the copyright notice and license file in your source code.

**Copyright © 2026 Seyam Ali**. All rights reserved.
