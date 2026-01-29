import {
    DecoratorNode,
    type DOMExportOutput,
    type EditorConfig,
    type LexicalNode,
    type NodeKey,
    type SerializedLexicalNode,
    type Spread,
    type DOMConversionMap,
    type DOMConversionOutput,
} from 'lexical';

export type SerializedPageBreakNode = Spread<
    {
        type: 'page-break';
        version: 1;
    },
    SerializedLexicalNode
>;

export class PageBreakNode extends DecoratorNode<HTMLDivElement> {
    static getType(): string {
        return 'page-break';
    }

    static clone(node: PageBreakNode): PageBreakNode {
        return new PageBreakNode(node.__key);
    }

    static importJSON(_serializedNode: SerializedPageBreakNode): PageBreakNode {
        return $createPageBreakNode();
    }

    constructor(key?: NodeKey) {
        super(key);
    }

    exportJSON(): SerializedPageBreakNode {
        return {
            type: 'page-break',
            version: 1,
        };
    }

    createDOM(_config: EditorConfig): HTMLElement {
        const div = document.createElement('div');
        div.className = 'editor-page-break';
        div.setAttribute('contenteditable', 'false');
        const span = document.createElement('span');
        span.innerText = 'Page Break';
        div.appendChild(span);
        return div;
    }

    updateDOM(): boolean {
        return false;
    }

    decorate(): HTMLDivElement {
        // In React this would return a component, but for vanilla we can return a DOM element
        // However, DecoratorNode.decorate expects a ReactNode in React context.
        // In a vanilla/plain context, we might rely on createDOM for the visual.
        // But DecoratorNode is designed to be managed by a framework.
        // If we want a simple element, `ElementNode` might be better or we assume our engine handles decoration?
        // Given the previous patterns (HtmlSnippetNode), we might be using a mix.
        // Let's rely on createDOM primarily for visual if the 'decorate' isn't hooked up to a renderer.
        // But typescript requires decorate().
        // We will return the same structure as createDOM or a lightweight shell.
        // Wait, DecoratorNode usually implies an underlying specific renderer. 
        // If we are mostly vanilla, `ElementNode` with `isInline = false` might be safer 
        // but DecoratorNode allows "void" behavior easily.
        // Let's return a simple div.
        const div = document.createElement('div');
        return div;
    }

    static importDOM(): DOMConversionMap | null {
        return {
            div: (domNode: HTMLElement) => {
                if (
                    domNode.classList.contains('editor-page-break') ||
                    domNode.classList.contains('print-page-break') ||
                    domNode.style.pageBreakAfter === 'always'
                ) {
                    return {
                        conversion: $convertPageBreakElement,
                        priority: 4,
                    };
                }
                return null;
            },
        };
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('div');
        element.style.pageBreakAfter = 'always';
        element.style.breakAfter = 'page';
        element.className = 'print-page-break';
        return { element };
    }

    getTextContent(): string {
        return '\n--- Page Break ---\n';
    }
}

export function $createPageBreakNode(): PageBreakNode {
    return new PageBreakNode();
}

export function $isPageBreakNode(node: LexicalNode | null | undefined): node is PageBreakNode {
    return node instanceof PageBreakNode;
}

function $convertPageBreakElement(): DOMConversionOutput {
    return { node: $createPageBreakNode() };
}
