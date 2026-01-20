// src/core/registry.ts
import type { LexicalEditor } from 'lexical';

export interface EditorPlugin {
    name: string;
    // Every plugin gets the editor instance to set itself up
    init: (editor: LexicalEditor) => void;
}

export class PluginRegistry {
    private plugins: Map<string, EditorPlugin> = new Map();
    private editor: LexicalEditor;

    constructor(editor: LexicalEditor) {
        this.editor = editor;
    }

    register(plugin: EditorPlugin) {
        if (!this.plugins.has(plugin.name)) {
            plugin.init(this.editor);
            this.plugins.set(plugin.name, plugin);
            console.log(`Plugin [${plugin.name}] loaded.`);
        }
    }
}