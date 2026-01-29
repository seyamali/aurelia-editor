# Aurelia Editor - by Seyam Ali

A powerful, customizable, and framework-agnostic rich text editor built with [Lexical](https://lexical.dev/). Designed for modern content creation with a clean, "Notion-style" interface and comprehensive productivity tools.

![Editor Preview](https://via.placeholder.com/800x400?text=Aurelia+Editor+Preview)

## ✨ key Features

**Aurelia Editor** provides a "batteries-included" experience:

### 📝 Advanced Formatting
- **Rich Text**: Bold, Italic, Underline, Strikethrough, Subscript, Superscript.
- **Typography**: Heading levels (H1-H3), Blockquotes, and more.
- **Fonts & Colors**: Customizable font families and text/highlight colors.
- **Case Converter**: Easily toggle between Uppercase, Lowercase, and Title Case.

### 🖼️ Media & Embeds
- **Universal Image Upload**: Drag & drop, copy-paste, or upload images via a unified modal.
- **Image Editing**: Resize images, drag to move, and add captions.
- **Video Support**: Embed YouTube videos and other media.
- **Files**: Support for file attachments.

### 📊 Layout & Structure
- **Smart Tables**: Create tables with resizable columns/rows, merge cells, and custom backgrounds.
- **Code Blocks**: Syntax highlighting for multiple languages via PrismJS.
- **Structure**: Collapsible Text, Page Breaks, Horizontal Rules.
- **Navigation**: Auto-generated Table of Contents & Document Outline.

### 🚀 Productivity Tools
- **Slash Commands**: Type `/` to instantly access a menu of blocks and actions.
- **Markdown Support**: Full Markdown shortcuts (e.g., `## Heading`, `> Quote`, `- List`).
- **Autosave**: Never lose work with local storage autosave and recovery.
- **Find & Replace**: Powerful search functionality within the editor.
- **Format Painter**: Copy formatting from one section and apply it to another.
- **Word Count**: Real-time statistics.

### 📄 Export & Import
- **PDF Export**: One-click download of your document as a styled PDF.
- **Word Export/Import**: Seamlessly move content to and from Microsoft Word (`.docx`).
- **Print Friendly**: Optimized CSS for printing.

### 🤝 Collaboration & Extras
- **Comments/Track Changes**: (Beta) Infrastructure for collaborative reviewing.
- **Mentions**: Support for `@user` mentions.
- **Source View**: HTML source editing for power users.
- **Zen Mode**: Distraction-free writing experience.

---

## 💻 Tech Stack

- **Core**: [Lexical](https://lexical.dev/) (by Meta)
- **Language**: TypeScript
- **Bundler**: Vite
- **Styling**: Vanilla CSS (CSS Variables for easy theming)

## 🎛️ Toolbar Configuration

The editor features a highly configurable toolbar system. You can switch between presets or define your own.

**Presets:**
- `standard`: The default balanced set of tools.
- `minimal`: Distraction-free, just the basics.
- `blogging`: Focused on media and structure.
- `full`: All available tools enabled.

To change the preset programmatically:
```typescript
import { ToolbarConfigManager } from 'my-universal-editor';

ToolbarConfigManager.applyPreset('minimal');
```

## ⌨️ Shortcuts

| Action | Shortcut |
|--------|----------|
| **Bold** | `Ctrl + B` |
| **Italic** | `Ctrl + I` |
| **Canel/Undo** | `Ctrl + Z` |
| **Slash Menu** | `/` |
| **Find & Replace** | `Ctrl + F` |
| **Save** | `Ctrl + S` (Triggers Autosave) |

---

## 📄 License & Attribution

This project is open-source and available under the **MIT License**.

### Summary
- **Commercial Use**: ✅ Allowed
- **Modification**: ✅ Allowed
- **Distribution**: ✅ Allowed
- **Private Use**: ✅ Allowed
- **Liability**: ❌ None (Use at your own risk)
- **Attribution**: ⚠️ **REQUIRED**

### Credit Requirement
If you use this editor in your project (commercial or non-commercial), you **must** retain the copyright notice and license file (`LICENSE`) in your source code. This ensures the original author receives credit for their work.

Copyright (c) 2026 Seyam Ali
