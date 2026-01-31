# 🔌 Integration Guide

**Aurelia Editor** is designed to be a framework-agnostic, drop-in rich text editor. This guide provides step-by-step instructions for integrating the editor into the most popular web development frameworks.

## 📦 Prerequisites

Ensure you have the package installed in your project:

```bash
npm install @seyamali/aurelia-editor
# or
yarn add @seyamali/aurelia-editor
```

---

## � Vanilla TypeScript / JavaScript

The editor works natively with the DOM. You simply need a container element to mount the editor instance.

### 1. HTML Structure
Create a container div in your HTML file:

```html
<div id="app"></div>
```

### 2. Initialization Script

```typescript
import { AureliaEditor } from '@seyamali/aurelia-editor';
import '@seyamali/aurelia-editor/dist/aurelia-editor.css'; 

// 1. Mount the Full Editor (Toolbar + Engine) 
const app = document.getElementById('app');
if (app) {
    const editor = await AureliaEditor.create(app);
}
```

---

## ⚛️ React.js (Component Wrapper)

Since React manages the DOM virtually, we use a `ref` and `useEffect` to safely mount the editor instance.

```tsx
import React, { useEffect, useRef } from 'react';
import { AureliaEditor } from '@seyamali/aurelia-editor';
import '@seyamali/aurelia-editor/dist/aurelia-editor.css';

export const EditorComponent = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorInstance = useRef<AureliaEditor | null>(null);

    useEffect(() => {
        if (containerRef.current && !editorInstance.current) {
            AureliaEditor.create(containerRef.current).then(instance => {
                editorInstance.current = instance;
            });
        }
    }, []);

    return <div ref={containerRef} className="aurelia-editor-wrapper" style={{ height: '100vh' }} />;
};
```

### Next.js (Dynamic Import)

For Next.js, because the editor relies on `window` and `document`, you must import the component dynamically with SSR disabled.

```tsx
// components/Editor.tsx
// (Use the React code above)

// pages/index.tsx
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('../components/Editor').then(mod => mod.EditorComponent), {
    ssr: false
});

export default function Page() {
    return <Editor />;
}
```

---

## 🟢 Vue.js 3 (Composition API)

Use the `onMounted` hook to ensure the DOM is ready before initializing the editor.

```vue
<script setup>
import { onMounted, ref } from 'vue';
import { AureliaEditor } from '@seyamali/aurelia-editor';
import '@seyamali/aurelia-editor/dist/aurelia-editor.css';

const container = ref(null);
let editor = null;

onMounted(async () => {
    if (container.value) {
        editor = await AureliaEditor.create(container.value);
    }
});
</script>

<template>
    <div ref="container" class="editor-container"></div>
</template>

<style scoped>
.editor-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
}
</style>
```

---

## 🅰️ Angular

Use `AfterViewInit` to guarantee the view query is available.

```typescript
import { Component, ElementRef, ViewChild, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { AureliaEditor } from '@seyamali/aurelia-editor';

@Component({
  selector: 'app-editor',
  template: `<div #editorContainer class="editor-host"></div>`,
  styles: [`
    .editor-host { height: 100vh; display: block; }
  `],
  encapsulation: ViewEncapsulation.None
})
export class EditorComponent implements AfterViewInit {
  @ViewChild('editorContainer') container!: ElementRef<HTMLDivElement>;
  editor: AureliaEditor | null = null;

  async ngAfterViewInit() {
    if (this.container) {
      this.editor = await AureliaEditor.create(this.container.nativeElement);
    }
  }
}
```

**Note:** Add `"node_modules/@seyamali/aurelia-editor/dist/style.css"` to your `angular.json` styles array.

---

## 🟠 Svelte

```svelte
<script>
  import { onMount } from 'svelte';
  import { AureliaEditor, EDITOR_LAYOUT_HTML } from '@seyamali/aurelia-editor';
  import '@seyamali/aurelia-editor/dist/style.css';

  let container;
  let editor;

  onMount(async () => {
    if (container) {
      editor = await AureliaEditor.create(container);
    }
  });
</script>

<div bind:this={container} class="editor-wrapper"></div>

<style>
  .editor-wrapper {
    height: 100vh;
  }
</style>
```

---

## 💾 Getting & Setting Content

Aurelia Editor provides high-fidelity helper methods to ensure that your HTML remains clean and complete (including styles and metadata) when moving data between the editor and your database.

### 1. Get Production-Ready HTML
Use `getHtml()` to retrieve a cleaned string without Lexical-specific attributes.

```typescript
const html = await editor.getHtml();
// Ready to be stored in your DB or sent to an API
```

### 2. Set Initial Content
Use `setHtml()` when loading a previously saved design or document. This method ensures that all associated styles and metadata tags are correctly initialized.

```typescript
const savedHtml = "<html>...</html>";
await editor.setHtml(savedHtml);
```

### 3. Listening for Changes
To implement "auto-save" or sync state, listen to the internal Lexical editor updates:

```typescript
editor.getInternalEditor().registerUpdateListener(({ editorState }) => {
    // Note: getHtml() is async, so consider debouncing 
    // if you need the HTML string on every keystroke.
});
```

---

## � Importing Styles

The editor requires its CSS to render correctly. Ensure you import the stylesheet in your entry point (e.g., `main.ts`, `_app.tsx`, or `index.js`).

```javascript
import '@seyamali/aurelia-editor/dist/aurelia-editor.css';
```

If you are using a bundler that doesn't support CSS imports, link it in your HTML:

```html
<link rel="stylesheet" href="path/to/node_modules/@seyamali/aurelia-editor/dist/aurelia-editor.css">
```
