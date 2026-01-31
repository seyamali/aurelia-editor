import { DecoratorNode, type NodeKey, type SerializedLexicalNode, type Spread, type DOMConversionMap, type DOMExportOutput } from 'lexical';

export type SerializedRawHtmlNode = Spread<{ html: string; tag: string }, SerializedLexicalNode>;

export class RawHtmlNode extends DecoratorNode<HTMLElement> {
    __html: string;
    __tag: string;

    static getType(): string { return 'raw-html'; }
    static clone(node: RawHtmlNode): RawHtmlNode { return new RawHtmlNode(node.__html, node.__tag, node.__key); }

    constructor(html: string, tag: string, key?: NodeKey) {
        super(key);
        this.__html = html;
        this.__tag = tag;
    }

    static importJSON(serializedNode: SerializedRawHtmlNode): RawHtmlNode {
        return new RawHtmlNode(serializedNode.html, serializedNode.tag);
    }

    exportJSON(): SerializedRawHtmlNode {
        return { type: 'raw-html', version: 1, html: this.__html, tag: this.__tag };
    }

    createDOM(): HTMLElement {
        const element = document.createElement(this.__tag);
        // We don't want to actually render meta/link in the editor canvas 
        // as they are invisible, but we might want a placeholder or just keep them hidden.
        element.style.display = 'none';
        return element;
    }

    updateDOM(): false { return false; }

    decorate(): HTMLElement {
        // Return an empty div for the editor UI, 
        // actual tag will be in the DOM but hidden.
        const div = document.createElement('div');
        div.className = 'editor-raw-html-placeholder';
        div.style.display = 'none';
        return div;
    }

    static importDOM(): DOMConversionMap | null {
        return {
            meta: () => ({
                conversion: (domNode: Node) => {
                    const el = domNode as HTMLElement;
                    return { node: new RawHtmlNode(el.outerHTML, 'meta') };
                },
                priority: 4,
            }),
            link: () => ({
                conversion: (domNode: Node) => {
                    const el = domNode as HTMLElement;
                    return { node: new RawHtmlNode(el.outerHTML, 'link') };
                },
                priority: 4,
            }),
            title: () => ({
                conversion: (domNode: Node) => {
                    const el = domNode as HTMLElement;
                    return { node: new RawHtmlNode(el.outerHTML, 'title') };
                },
                priority: 4,
            }),
            script: () => ({
                conversion: (domNode: Node) => {
                    const el = domNode as HTMLElement;
                    return { node: new RawHtmlNode(el.outerHTML, 'script') };
                },
                priority: 4,
            }),
            style: () => ({
                conversion: (domNode: Node) => {
                    const el = domNode as HTMLElement;
                    return { node: new RawHtmlNode(el.outerHTML, 'style') };
                },
                priority: 4,
            }),
        };
    }

    exportDOM(): DOMExportOutput {
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.__html, 'text/html');
        // Check both head and body for the element (meta/style/title usually go to head)
        const element = (doc.head.firstChild || doc.body.firstChild) as HTMLElement;
        return { element: element || document.createElement(this.__tag) };
    }
}

export function $createRawHtmlNode(html: string, tag: string): RawHtmlNode {
    return new RawHtmlNode(html, tag);
}
