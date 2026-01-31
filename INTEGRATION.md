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
import { AureliaEditor, EDITOR_LAYOUT_HTML } from '@seyamali/aurelia-editor';
import '@seyamali/aurelia-editor/dist/style.css'; 

// 1. Inject the Editor Scaffold (Toolbar, Sidebar, Canvas)
const app = document.getElementById('app');
if (app) {
    app.innerHTML = EDITOR_LAYOUT_HTML;

    // 2. Initialize the Editor Engine
    const canvas = document.getElementById('editor-canvas') as HTMLDivElement;
    const editor = new AureliaEditor(canvas);
}
```

---

## ⚛️ React.js (Component Wrapper)

Since React manages the DOM virtually, we use a `ref` and `useEffect` to safely mount the editor instance.

```tsx
import React, { useEffect, useRef } from 'react';
import { AureliaEditor, EDITOR_LAYOUT_HTML } from '@seyamali/aurelia-editor';
import '@seyamali/aurelia-editor/dist/style.css';

export const EditorComponent = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorInstance = useRef<AureliaEditor | null>(null);

    useEffect(() => {
        if (containerRef.current && !editorInstance.current) {
            // Inject Layout
            containerRef.current.innerHTML = EDITOR_LAYOUT_HTML;
            
            // Mount Editor
            const canvas = containerRef.current.querySelector('#editor-canvas') as HTMLDivElement;
            if (canvas) {
                editorInstance.current = new AureliaEditor(canvas);
            }
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
import { AureliaEditor, EDITOR_LAYOUT_HTML } from '@seyamali/aurelia-editor';
import '@seyamali/aurelia-editor/dist/style.css';

const container = ref(null);
let editor = null;

onMounted(() => {
    if (container.value) {
        container.value.innerHTML = EDITOR_LAYOUT_HTML;
        const canvas = container.value.querySelector('#editor-canvas');
        if (canvas) {
            editor = new AureliaEditor(canvas);
        }
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
import { AureliaEditor, EDITOR_LAYOUT_HTML } from '@seyamali/aurelia-editor';

@Component({
  selector: 'app-editor',
  template: `<div #editorContainer class="editor-host"></div>`,
  styles: [`
    .editor-host { height: 100vh; display: block; }
    /* You may need to import CSS in your global styles or angular.json */
  `],
  encapsulation: ViewEncapsulation.None // Required for global editor styles to apply
})
export class EditorComponent implements AfterViewInit {
  @ViewChild('editorContainer') container!: ElementRef<HTMLDivElement>;
  editor: AureliaEditor | null = null;

  ngAfterViewInit() {
    if (this.container) {
      this.container.nativeElement.innerHTML = EDITOR_LAYOUT_HTML;
      const canvas = this.container.nativeElement.querySelector('#editor-canvas') as HTMLDivElement;
      this.editor = new AureliaEditor(canvas);
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

  onMount(() => {
    if (container) {
      container.innerHTML = EDITOR_LAYOUT_HTML;
      const canvas = container.querySelector('#editor-canvas');
      editor = new AureliaEditor(canvas);
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

## � Importing Styles

The editor requires its CSS to render correctly. Ensure you import the stylesheet in your entry point (e.g., `main.ts`, `_app.tsx`, or `index.js`).

```javascript
import '@seyamali/aurelia-editor/dist/style.css';
```

If you are using a bundler that doesn't support CSS imports, link it in your HTML:

```html
<link rel="stylesheet" href="path/to/node_modules/@seyamali/aurelia-editor/dist/style.css">
```
