# Aurelia Editor

[![NPM Version](https://img.shields.io/npm/v/@seyamali/aurelia-editor?style=flat-square&color=blue)](https://www.npmjs.com/package/@seyamali/aurelia-editor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/Written%20With-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=flat-square&logo=github)](https://github.com/seyamali/custom-rich-text-editor)
[![Live Demo](https://img.shields.io/badge/Live-Demo-0f766e?style=flat-square&logo=vercel)](https://aurelia-editor.pro.bd/)

**Aurelia Editor** is a framework-agnostic rich text and CMS editor built on top of [Lexical](https://lexical.dev/). It is designed for content teams, blogs, docs, and page builders that want a polished editing experience with strong publishing tools.

Try the live demo at [aurelia-editor.pro.bd](https://aurelia-editor.pro.bd/).

![Editor Preview](https://seyam.runasp.net/uploads/6d201eb5-6f39-4429-958d-be310c964419.png)

## What it includes

- Rich text formatting, typography, lists, alignment, and case conversion
- Image tools, video embeds, HTML snippets, and link editing
- Tables, code blocks, TOC, footnotes, and page breaks
- Comments, track changes, presence, and revision support
- CMS page settings, SEO audit, publish workflow, and export presets
- Command palette, slash commands, format painter, autosave, and document stats
- Template blocks and reusable page snippets

## Best for

- CMS and headless CMS editing
- Blog publishing and article drafting
- Documentation and knowledge base pages
- Landing pages and content-heavy marketing sites
- Teams that need an editor with both writing and publishing tools

## Install

```bash
npm install @seyamali/aurelia-editor
```

## Use

```typescript
import { AureliaEditor } from '@seyamali/aurelia-editor';
import '@seyamali/aurelia-editor/style.css';

const container = document.getElementById('editor-root');

if (!container) {
  throw new Error('Missing #editor-root container');
}

const editor = await AureliaEditor.create(container);
```

## Working with content

```typescript
const html = await editor.getHtml();
await editor.setHtml(html);
```

## Toolbar presets

Available presets:

- `minimal`
- `standard`
- `blogging`
- `documentation`
- `full`

## Useful shortcuts

- `Ctrl/Cmd + K`: Command palette
- `Ctrl/Cmd + Alt + M`: Comment
- `Ctrl/Cmd + Alt + T`: Templates
- `Ctrl/Cmd + Alt + S`: Stats
- `Ctrl/Cmd + F`: Find and replace
- `/`: Slash menu

## Public site

- Live demo: [https://aurelia-editor.pro.bd/](https://aurelia-editor.pro.bd/)
- GitHub: [https://github.com/seyamali/custom-rich-text-editor](https://github.com/seyamali/custom-rich-text-editor)

## License

MIT