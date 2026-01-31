# Aurelia Editor

[![NPM Version](https://img.shields.io/npm/v/@seyamali/aurelia-editor?style=flat-square&color=blue)](https://www.npmjs.com/package/@seyamali/aurelia-editor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/Written%20With-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

**Aurelia Editor** is a powerful, customizable, and framework-agnostic rich text editor built on top of [Lexical](https://lexical.dev/). It is designed for modern content creation, offering a clean, "Notion-style" interface combined with enterprise-grade features like MS Word compatibility, PDF export, and advanced layout tools.

![Editor Preview](https://via.placeholder.com/800x400?text=Aurelia+Editor+Preview)

---

## ✨ Features
 
**Aurelia Editor** delivers a premium writing experience with a "batteries-included" philosophy:
 
### 📝 Core Editing
*   **Rich Text**: Bold, Italic, Underline, Strikethrough, Subscript, Superscript, Inline Code.
*   **Typography**: Hierarchical headings (H1-H6), Blockquotes, Dividers.
*   **Fonts & Color**: Custom font families, text colors, and background highlights.
*   **Lists**: Nested bullet and numbered lists with indentation controls.
*   **Case Converter**: Toggle text between Uppercase, Lowercase, and Title Case.
*   **Clear Formatting**: Instantly strip styles from copied text.
 
### 🖼️ Media & Embeds
*   **Smart Images**: Drag & drop upload, resize, alignment positioning, captions, and link support.
*   **Video Embedding**: YouTube integration with preview.
*   **HTML Snippets**: Insert raw HTML for custom widgets or layouts.
*   **Files**: Support for generic file attachments (extensible).
 
### 📊 Structured Content
*   **Advanced Tables**: Header rows, cell merging, splitting, column resizing, and row/column management.
*   **Code Blocks**: Syntax highlighting for multiple languages with copy support.
*   **Table of Contents**: Auto-generated TOC based on document headings with scroll-spy.
*   **Footnotes**: Academic-style referencing and footnotes.
*   **Page Layout**: Page breaks and print-ready styles.
 
### 🚀 Productivity Tools
*   **Slash Commands**: Type `/` to access a unified menu for all tools.
*   **Format Painter**: Copy and paste styles between text blocks.
*   **Find & Replace**: Search with match highlighting and bulk replacement.
*   **Autosave**: Automatic local backup to prevent data loss.
*   **Mentions & Tags**: Support for `@user` mentions or custom tags (configurable).
*   **Placeholders / Merge Fields**: Insert dynamic variables like `{{FirstName}}`.
*   **Emoji Picker**: Built-in library for expressive writing.
 
### 👀 View & Analysis
*   **Document Outline**: Sidebar navigation for long documents.
*   **Minimap**: VS Code-style minimap for quick scrolling.
*   **Zen Mode**: Distraction-free full-screen writing.
*   **Source View**: Edit the underlying HTML directly.
*   **Word Count**: Real-time statistics.
 
### 🔄 Collaboration & History
*   **Track Changes**: Suggestion mode (Accept/Reject changes).
*   **Revision History**: visual history of edits (if backend connected).
*   **Comments**: Threaded comments support (framework ready).
 
### 📤 Import / Export
*   **PDF Export**: High-fidelity client-side PDF generation.
*   **Word Support**: Import `.docx` files and export content to Word.
*   **Markdown**: Full Markdown shortcut support (`##`, `*`, `>`).

---

## 📦 Installation

Install the package via npm:

```bash
npm install @seyamali/aurelia-editor
```

---

## 🛠️ Usage

### Basic Setup
Initialize the editor by mounting it to a DOM element:

```typescript
import { AureliaEditor } from '@seyamali/aurelia-editor';
import '@seyamali/aurelia-editor/dist/style.css';

const editor = new AureliaEditor({
  element: document.getElementById('editor-root'),
  theme: 'default',
  placeholder: 'Start writing...'
});

editor.render();
```

### Retrieval & Events
Listen to changes or get the content:

```typescript
// Get HTML content
const html = editor.getHTML();

// Get JSON State
const jsonState = editor.getEditorState();

// Listen for updates
editor.on('update', (content) => {
  console.log('Document updated:', content);
});
```

---

## ⚙️ Configuration

Aurelia Editor features a dynamic toolbar system. You can switch between built-in presets or define your own configuration.

### Toolbar Presets
Available presets: `standard`, `minimal`, `blogging`, `full`.

```typescript
import { ToolbarConfigManager } from '@seyamali/aurelia-editor';

// Switch to a minimal, distraction-free interface
ToolbarConfigManager.applyPreset('minimal');
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
