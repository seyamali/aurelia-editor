# Integration & Installation Guide

This guide covers how to install `my-universal-editor` and integrate it into various JavaScript frameworks.

## 📦 Installation

To use the editor in your project, install it via npm:

```bash
npm install @seyamali/aurelia-editor
```

*Note: If you are working with the source code directly, ensure you have `npm install` and `npm run build` executed in the library folder first.*

## 🚀 General Usage (Vanilla JS)

The editor is framework-agnostic and relies on a simple DOM element structure.

1.  **HTML Structure**: Create a container for the editor layout.
2.  **Initialize**: Call the `AureliaEditor` class.

```javascript
import { AureliaEditor, EDITOR_LAYOUT_HTML } from '@seyamali/aurelia-editor';
import '@seyamali/aurelia-editor/dist/style.css'; // Don't forget CSS!

// 1. Setup Container
const app = document.getElementById('app');
app.innerHTML = EDITOR_LAYOUT_HTML; // Injects toolbar, sidebar, and canvas structure

// 2. Initialize Logic
const canvas = document.getElementById('editor-canvas');
const editor = new AureliaEditor(canvas);
```

---

## ⚛️ React Integration

Since Lexical is framework-agnostic, you can wrap `AureliaEditor` in a simple React component.

```tsx
import React, { useRef, useEffect } from 'react';
import { AureliaEditor, EDITOR_LAYOUT_HTML } from '@seyamali/aurelia-editor';
import '@seyamali/aurelia-editor/dist/style.css'; 

export const RichTextEditor = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<AureliaEditor | null>(null);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
        // 1. Inject the layout skeleton
        containerRef.current.innerHTML = EDITOR_LAYOUT_HTML;
        
        // 2. Find the canvas within the layout
        const canvas = containerRef.current.querySelector('#editor-canvas') as HTMLDivElement;
        
        // 3. Initialize the editor
        editorRef.current = new AureliaEditor(canvas);
    }
    
    return () => {
        // Optional cleanup if method exists
    };
  }, []);

  return <div ref={containerRef} style={{ height: '500px' }} />;
};
```

---

## 🅰️ Angular Integration

In Angular, use `@ViewChild` to access the native element and `AfterViewInit` to initialize the editor.

```typescript
import { Component, ElementRef, ViewChild, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { AureliaEditor, EDITOR_LAYOUT_HTML } from '@seyamali/aurelia-editor';

@Component({
  selector: 'app-rich-text-editor',
  template: `<div #editorContainer style="height: 500px;"></div>`,
  styleUrls: [
    './app.component.css', 
    '../../node_modules/@seyamali/aurelia-editor/dist/style.css' // Adjust path mainly
  ], 
  encapsulation: ViewEncapsulation.None // Important: Global styles for editor content
})
export class RichTextEditorComponent implements AfterViewInit {
  @ViewChild('editorContainer') container!: ElementRef<HTMLDivElement>;
  editor: AureliaEditor | null = null;

  ngAfterViewInit() {
    if (this.container) {
        // 1. Inject Layout
        this.container.nativeElement.innerHTML = EDITOR_LAYOUT_HTML;
        
        // 2. Find Canvas
        const canvas = this.container.nativeElement.querySelector('#editor-canvas') as HTMLDivElement;
        
        // 3. Initialize
        this.editor = new AureliaEditor(canvas);
    }
  }
}
```

---

## 🟢 Vue Integration

For Vue 3, use a template ref and the `onMounted` hook.

```vue
<script setup>
import { onMounted, ref } from 'vue';
import { AureliaEditor, EDITOR_LAYOUT_HTML } from '@seyamali/aurelia-editor';
import '@seyamali/aurelia-editor/dist/style.css';

const editorContainer = ref(null);
let editorInstance = null;

onMounted(() => {
  if (editorContainer.value) {
    editorContainer.value.innerHTML = EDITOR_LAYOUT_HTML;
    const canvas = editorContainer.value.querySelector('#editor-canvas');
    editorInstance = new AureliaEditor(canvas);
  }
});
</script>

<template>
  <div ref="editorContainer" class="my-editor-wrapper"></div>
</template>

<style>
/* Ensure the wrapper has some height */
.my-editor-wrapper {
  height: 100vh;
}
</style>
```

---

## 🌍 Publish to NPM

If you are the maintainer and wish to publish a new version:

1.  **Login**: `npm login`
2.  **Build**: `npm run build`
3.  **Publish**: `npm publish --access public`
