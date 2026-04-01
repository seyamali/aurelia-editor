# Aurelia Editor

[![NPM Version](https://img.shields.io/npm/v/@seyamali/aurelia-editor?style=flat-square&color=blue)](https://www.npmjs.com/package/@seyamali/aurelia-editor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/Written%20With-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=flat-square&logo=github)](https://github.com/seyamali/custom-rich-text-editor)
[![Live Demo](https://img.shields.io/badge/Live-Demo-0f766e?style=flat-square&logo=vercel)](https://aurelia-editor.pro.bd/)

**Aurelia Editor** is a customizable, framework-agnostic rich text and CMS editor built on top of [Lexical](https://lexical.dev/). It is designed for modern content creation and combines a clean authoring experience with advanced document, layout, and export features.

Try the live demo at [aurelia-editor.pro.bd](https://aurelia-editor.pro.bd/).

![Editor Preview](https://seyam.runasp.net/uploads/6d201eb5-6f39-4429-958d-be310c964419.png)

---

## Features

**Aurelia Editor** follows a batteries-included approach and ships with a broad set of authoring tools out of the box.

### High-Fidelity Design
* **Design Preservation**: Paste complex HTML layouts and preserve styles, metadata, and structure with high fidelity.
* **Clean Export**: Removes Lexical-specific internal attributes to produce cleaner HTML output.
* **CSS Sandboxing**: Scopes custom CSS to the editor container to reduce style leakage.

### Core Editing
* **Rich Text**: Bold, italic, underline, strikethrough, subscript, superscript, and inline code.
* **Typography**: Headings, blockquotes, dividers, and paragraph controls.
* **Fonts and Color**: Custom font families, text color, and highlight support.
* **Lists**: Nested bullet and numbered lists with indentation controls.
* **Case Conversion**: Toggle text between uppercase, lowercase, and title case.

### Media and Embeds
* **Smart Images**: Drag-and-drop upload, resizing, alignment, captions, and links.
* **Video Embedding**: YouTube embedding with preview support.
* **HTML Snippets**: Insert raw HTML for widgets or custom layouts.

### Structured Content
* **Advanced Tables**: Header rows, cell merging, splitting, resizing, and row or column management.
* **Code Blocks**: Syntax highlighting for multiple languages with copy support.
* **Table of Contents**: Auto-generated TOC based on document headings.
* **Footnotes**: Academic-style footnotes and references.

### Productivity Tools
* **Slash Commands**: Type `/` to open a unified command menu.
* **Format Painter**: Copy and reuse formatting between text blocks.
* **Find and Replace**: Search with match highlighting and bulk replacement.
* **Autosave**: Local draft recovery to help prevent data loss.
* **Placeholders**: Insert merge-field style placeholders such as `{{FirstName}}`.

---

## Installation

Install the package with npm:

```bash
npm install @seyamali/aurelia-editor
```

---

## Usage

### Basic Setup

Initialize the full editor, including the default toolbar and UI:

```typescript
import { AureliaEditor } from '@seyamali/aurelia-editor';
import '@seyamali/aurelia-editor/style.css';

const container = document.getElementById('editor-root');

if (!container) {
  throw new Error('Missing #editor-root container');
}

const editor = await AureliaEditor.create(container);
```

### Reading and Setting Content

Use the public helpers to work with editor content:

```typescript
const html = await editor.getHtml();

await editor.setHtml(initialHtml);

const jsonState = editor.getInternalEditor().getEditorState().toJSON();
```

---

## Configuration

Aurelia Editor includes a dynamic toolbar system with built-in presets.

Available presets: `standard`, `minimal`, `blogging`, `documentation`, `full`

```typescript
import { ToolbarSystem } from '@seyamali/aurelia-editor';

ToolbarSystem.applyPreset('documentation');
```

---

## Shortcuts

| Context | Shortcut | Action |
| :--- | :--- | :--- |
| **Formatting** | `Ctrl + B` | Bold |
|  | `Ctrl + I` | Italic |
|  | `Ctrl + U` | Underline |
| **History** | `Ctrl + Z` | Undo |
|  | `Ctrl + Y` | Redo |
| **Tools** | `/` | Slash Menu |
|  | `Ctrl + F` | Find and Replace |
|  | `Ctrl + S` | Save or trigger autosave |
| **Navigation** | `Ctrl + K` | Insert Link |

---

## License and Attribution

This project is licensed under the **MIT License**.

### Terms of Use
* **Commercial Use**: Allowed
* **Modification**: Allowed
* **Private Use**: Allowed
* **Attribution Required**: Retain the copyright notice and license file in source distributions.

**Copyright (c) 2026 Seyam Ali**. All rights reserved.
