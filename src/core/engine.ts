// 1. Fixed type-only imports using 'import type'
import { createEditor } from 'lexical';
import type { LexicalEditor } from 'lexical';
import { QuoteNode, registerRichText } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { registerHistory, createEmptyHistoryState } from '@lexical/history';
import { PluginRegistry, type EditorPlugin } from './registry';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
// Link imports removed as they are now handled by CustomLinkNode
import { ImageNode } from '../plugins/media/image-node';
import { CustomImageNode } from '../plugins/media/custom-image-node';
import { TableNode, TableRowNode, TableCellNode } from '@lexical/table';
import { YouTubeNode } from '../plugins/advanced/youtube-node.ts';
import { HTMLSnippetNode } from '../plugins/advanced/html-snippet-node.ts';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { CodeBlockNode } from '../plugins/advanced/code-block-node';
import { SuggestionNode } from '../plugins/collaboration/suggestion-node.ts';
import { PlaceholderNode } from '../plugins/advanced/placeholder-node.ts';
import { PageBreakNode } from '../plugins/page-layout/page-break-node';
import { FootnoteRefNode, FootnoteContentNode, FootnoteContainerNode } from '../plugins/advanced/footnote-node';
import { TableOfContentsNode } from '../plugins/page-layout/toc-node';
import { CustomHeadingNode } from '../plugins/formatting/custom-heading-node';
import { CustomParagraphNode } from '../plugins/formatting/custom-paragraph-node';
import { CustomLinkNode } from '../plugins/formatting/custom-link-node';
import { SpanNode } from '../plugins/formatting/span-node';
import { LayoutNode } from '../plugins/layout/layout-node';
import { StyleNode } from '../plugins/advanced/style-node';
import { AssetLinkNode } from '../plugins/advanced/asset-link-node';

import { ParagraphNode } from 'lexical';
import { HeadingNode } from '@lexical/rich-text';
import { LinkNode, AutoLinkNode } from '@lexical/link';

export class MyUniversalEditor {
    private editor: LexicalEditor;
    private registry: PluginRegistry;

    constructor(element: HTMLDivElement) {

        this.editor = createEditor({
            namespace: 'MyCustomEditor',
            nodes: [
                HeadingNode,
                ParagraphNode,
                LinkNode,
                AutoLinkNode,
                CustomHeadingNode,
                CustomParagraphNode,
                QuoteNode,
                ListNode,
                ListItemNode,
                HorizontalRuleNode,
                CustomLinkNode,
                ImageNode,
                CustomImageNode,
                TableNode,
                TableRowNode,
                TableCellNode,
                YouTubeNode,
                HTMLSnippetNode,
                CodeNode,
                CodeBlockNode,
                CodeHighlightNode,
                SuggestionNode,
                PlaceholderNode,
                PageBreakNode,
                FootnoteRefNode,
                FootnoteContentNode,
                FootnoteContainerNode,
                TableOfContentsNode,
                LayoutNode,
                StyleNode,
                AssetLinkNode,
                SpanNode
            ],
            theme: {
                root: 'editor-container',
                // Keep theme classes empty to prevent Lexical from overriding template styles
                heading: {},
                paragraph: '',
                list: {
                    ul: 'editor-list-ul',
                    ol: 'editor-list-ol',
                    listitem: 'editor-listitem',
                },
                text: {
                    bold: 'editor-text-bold',
                    italic: 'editor-text-italic',
                    underline: 'editor-text-underline',
                    strikethrough: 'editor-text-strikethrough',
                    code: 'editor-text-code',
                },
                code: 'editor-code',
                table: 'editor-table',
                tableCell: 'editor-table-cell',
                tableCellHeader: 'editor-table-cell-header',
                tableCellSelected: 'selected',
                tableRow: 'editor-table-row',
                codeHighlight: {
                    atrule: 'editor-code-atrule',
                    attr: 'editor-code-attr',
                    boolean: 'editor-code-boolean',
                    builtin: 'editor-code-builtin',
                    cdata: 'editor-code-cdata',
                    char: 'editor-code-char',
                    class: 'editor-code-class',
                    'class-name': 'editor-code-class-name',
                    comment: 'editor-code-comment',
                    constant: 'editor-code-constant',
                    deleted: 'editor-code-deleted',
                    doctype: 'editor-code-doctype',
                    entity: 'editor-code-entity',
                    function: 'editor-code-function',
                    important: 'editor-code-important',
                    inserted: 'editor-code-inserted',
                    keyword: 'editor-code-keyword',
                    namespace: 'editor-code-namespace',
                    number: 'editor-code-number',
                    operator: 'editor-code-operator',
                    prolog: 'editor-code-prolog',
                    property: 'editor-code-property',
                    punctuation: 'editor-code-punctuation',
                    regex: 'editor-code-regex',
                    selector: 'editor-code-selector',
                    string: 'editor-code-string',
                    symbol: 'editor-code-symbol',
                    tag: 'editor-code-tag',
                    url: 'editor-code-url',
                    variable: 'editor-code-variable',
                },
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