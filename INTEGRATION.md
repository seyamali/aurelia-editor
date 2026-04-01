# Integration Guide

Aurelia Editor is framework-agnostic and can be mounted into any app that can provide a DOM element.

## Install

```bash
npm install @seyamali/aurelia-editor
```

## Vanilla JavaScript / TypeScript

```typescript
import { AureliaEditor } from '@seyamali/aurelia-editor';
import '@seyamali/aurelia-editor/style.css';

const container = document.getElementById('editor-root');

if (!container) {
  throw new Error('Missing #editor-root container');
}

const editor = await AureliaEditor.create(container);
```

## React

```tsx
import { useEffect, useRef } from 'react';
import { AureliaEditor } from '@seyamali/aurelia-editor';
import '@seyamali/aurelia-editor/style.css';

export function Editor() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;
    AureliaEditor.create(containerRef.current).then(() => {
      if (!mounted) return;
    });

    return () => {
      mounted = false;
    };
  }, []);

  return <div ref={containerRef} className="editor-root" />;
}
```

## Vue 3

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { AureliaEditor } from '@seyamali/aurelia-editor';
import '@seyamali/aurelia-editor/style.css';

const container = ref<HTMLDivElement | null>(null);

onMounted(async () => {
  if (container.value) {
    await AureliaEditor.create(container.value);
  }
});
</script>

<template>
  <div ref="container" class="editor-root"></div>
</template>
```

## Angular

```ts
import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { AureliaEditor } from '@seyamali/aurelia-editor';

@Component({
  selector: 'app-editor',
  template: `<div #container class="editor-root"></div>`,
  styles: [`.editor-root { min-height: 100vh; }`],
})
export class EditorComponent implements AfterViewInit {
  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  async ngAfterViewInit() {
    await AureliaEditor.create(this.container.nativeElement);
  }
}
```

## Svelte

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { AureliaEditor } from '@seyamali/aurelia-editor';
  import '@seyamali/aurelia-editor/style.css';

  let container: HTMLDivElement;

  onMount(async () => {
    if (container) {
      await AureliaEditor.create(container);
    }
  });
</script>

<div bind:this={container} class="editor-root"></div>
```

## Content Helpers

```typescript
const html = await editor.getHtml();
await editor.setHtml('<p>Hello world</p>');
```

## Notes

- Import `@seyamali/aurelia-editor/style.css` once in your app.
- Mount the editor only after the container exists.
- The default editor setup includes the toolbar, CMS tools, comments, SEO, publish, export, templates, and more.