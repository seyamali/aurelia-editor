// 1. Fixed type-only imports using 'import type'
import { createEditor } from 'lexical';
import type { LexicalEditor } from 'lexical';
import { HeadingNode, QuoteNode, registerRichText } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { registerHistory, createEmptyHistoryState } from '@lexical/history';
import { PluginRegistry, type EditorPlugin } from './registry';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { ImageNode } from '../plugins/media/image-node';

export class MyUniversalEditor {
    private editor: LexicalEditor;
    private registry: PluginRegistry;

    constructor(element: HTMLDivElement) {

        this.editor = createEditor({
            namespace: 'MyCustomEditor',
            nodes: [
                HeadingNode,
                QuoteNode,
                ListNode,
                ListItemNode,
                HorizontalRuleNode,
                LinkNode,
                AutoLinkNode,
                ImageNode
            ], // Add these here!
            theme: {
                heading: {
                    h1: 'editor-h1',
                    h2: 'editor-h2',
                    h3: 'editor-h3',
                    h4: 'editor-h4',
                    h5: 'editor-h5',
                    h6: 'editor-h6',
                },
                list: {
                    ul: 'editor-list-ul',
                    ol: 'editor-list-ol',
                    listitem: 'editor-listitem',
                },
                quote: 'editor-quote',
                hr: 'editor-hr',
                text: {
                    bold: 'editor-text-bold',
                    italic: 'editor-text-italic',
                    underline: 'editor-text-underline',
                    strikethrough: 'editor-text-strikethrough',
                    underlineStrikethrough: 'editor-text-underlineStrikethrough',
                    subscript: 'editor-text-subscript',
                    superscript: 'editor-text-superscript',
                    code: 'editor-text-code',
                },
                link: 'editor-link',
                autolink: 'editor-autolink',
                image: 'editor-image',
            },
            onError: (err) => console.error(err)
        });
        element.contentEditable = "true";

        // 3. Fixed the onError callback (second argument)
        this.editor._onError = (error: Error) => console.error(error);

        // Mount the editor to the HTML element
        this.editor.setRootElement(element);

        // Initialize Plugin Registry
        this.registry = new PluginRegistry(this.editor);

        // Initial basic setup (Essentials)
        registerRichText(this.editor);

        // 4. Fixed registerHistory: It requires a HistoryState object, 
        // passing 'undefined' is not allowed in strict mode.
        registerHistory(this.editor, createEmptyHistoryState(), 1000);

        console.log("Core Engine Initialized");
    }

    // Register a plugin
    use(plugin: EditorPlugin) {
        this.registry.register(plugin);
    }

    // Method to execute commands from your future toolbar
    execute(command: any, payload?: any) {
        this.editor.dispatchCommand(command, payload);
    }

    // Expose update method for external helpers
    update(updateFn: () => void) {
        this.editor.update(updateFn);
    }

    getInternalEditor(): LexicalEditor {
        return this.editor;
    }
}