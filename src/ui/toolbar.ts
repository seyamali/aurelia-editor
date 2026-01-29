import type { LexicalEditor } from 'lexical';
// --- Table of Contents (TOC) Insert ---
import { INSERT_TOC_COMMAND } from '../plugins/page-layout/toc-plugin';

export function setupTOCToolbar(editor: LexicalEditor) {
  // Add TOC button to toolbar
  let btn = document.getElementById('toolbar-insert-toc');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'toolbar-insert-toc';
    btn.className = 'toolbar-btn';
    btn.innerText = 'Insert TOC';
    btn.title = 'Insert Table of Contents';
    btn.onclick = () => {
      // Show config panel for levels and style
      showTOCConfigPanel(editor);
    };
    const toolbar = document.getElementById('editor-toolbar');
    if (toolbar) toolbar.appendChild(btn);
  }

  // Context menu support
  const canvas = document.getElementById('editor-canvas');
  if (canvas) {
    canvas.addEventListener('contextmenu', (e) => {
      if (e.shiftKey) { // Shift+RightClick for TOC
        e.preventDefault();
        showTOCConfigPanel(editor);
      }
    });
  }

  // Keyboard shortcut (Ctrl+Alt+T)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') {
      showTOCConfigPanel(editor);
    }
  });
}

function showTOCConfigPanel(editor: LexicalEditor) {
  let panel = document.getElementById('toc-config-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'toc-config-panel';
    panel.className = 'toc-config-panel';
    panel.innerHTML = `
      <label>Heading Levels: <input type="text" id="toc-levels" value="1-3" /></label>
      <label>Style:
        <select id="toc-style">
          <option value="unordered">Unordered List</option>
          <option value="ordered">Ordered List</option>
          <option value="collapsible">Collapsible</option>
        </select>
      </label>
      <button id="toc-insert-btn">Insert TOC</button>
      <button id="toc-cancel-btn">Cancel</button>
    `;
    document.body.appendChild(panel);
  }
  panel.style.display = 'block';
  panel.style.position = 'fixed';
  panel.style.top = '25%';
  panel.style.left = '50%';
  panel.style.transform = 'translate(-50%, 0)';
  panel.style.zIndex = '3000';
  panel.style.background = '#fff';
  panel.style.borderRadius = '12px';
  panel.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
  panel.style.padding = '18px 22px';
  panel.style.minWidth = '320px';
  panel.style.border = '1px solid #e5e7eb';

  const insertBtn = panel.querySelector('#toc-insert-btn') as HTMLButtonElement;
  const cancelBtn = panel.querySelector('#toc-cancel-btn') as HTMLButtonElement;

  if (insertBtn) {
    insertBtn.onclick = () => {
      // For now, just insert TOC node (configurable levels/styles can be used in future)
      editor.dispatchCommand(INSERT_TOC_COMMAND, undefined);
      if (panel) panel.style.display = 'none';
    };
  }

  if (cancelBtn) {
    cancelBtn.onclick = () => {
      if (panel) panel.style.display = 'none';
    };
  }
}
// Toolbar logic for Merge Field/Placeholder Insert
import { showPlaceholderInsertPanel } from '../plugins/advanced/placeholder';

export function setupToolbar(editor: LexicalEditor) {
  // Add a button to the toolbar for inserting placeholders
  let btn = document.getElementById('toolbar-insert-placeholder');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'toolbar-insert-placeholder';
    btn.className = 'toolbar-btn';
    btn.innerText = 'Insert Placeholder';
    btn.title = 'Insert Merge Field';
    btn.onclick = () => {
      showPlaceholderInsertPanel(editor);
    };
    // Assuming toolbar container has id 'editor-toolbar'
    const toolbar = document.getElementById('editor-toolbar');
    if (toolbar) toolbar.appendChild(btn);
  }

  // Context menu support
  const canvas = document.getElementById('editor-canvas');
  if (canvas) {
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showPlaceholderInsertPanel(editor);
    });
  }

  // Keyboard shortcut support (Ctrl+Alt+M)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'm') {
      showPlaceholderInsertPanel(editor);
    }
  });
}
