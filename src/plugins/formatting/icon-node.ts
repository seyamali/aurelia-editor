import { ElementNode, type EditorConfig, type NodeKey, type DOMConversionMap, type DOMExportOutput, type LexicalNode, type SerializedElementNode, type Spread } from 'lexical';

export type SerializedIconNode = Spread<{
    tagName: string;
    attributes: Record<string, string>;
}, SerializedElementNode>;

export class IconNode extends ElementNode {
    __tagName: string;
    __attributes: Record<string, string>;

    constructor(tagName: string, attributes: Record<string, string> = {}, key?: NodeKey) {
        super(key);
        this.__tagName = tagName.toLowerCase();
        this.__attributes = attributes;
    }

    static getType(): string { return 'icon'; }

    static clone(node: IconNode): IconNode {
        return new IconNode(node.__tagName, { ...node.__attributes }, node.__key);
    }

    createDOM(_config: EditorConfig): HTMLElement {
        const dom = document.createElement(this.__tagName);
        Object.entries(this.__attributes).forEach(([key, value]) => {
            dom.setAttribute(key, value);
        });

        // Safety: Ensure visibility during editing
        dom.style.display = 'inline-block';
        dom.style.fontStyle = 'normal';
        dom.contentEditable = 'false'; // Icons shouldn't be typed into

        return dom;
    }

    updateDOM(prevNode: IconNode, dom: HTMLElement): boolean {
        if (JSON.stringify(this.__attributes) !== JSON.stringify(prevNode.__attributes)) {
            Array.from(dom.attributes).forEach(attr => dom.removeAttribute(attr.name));
            Object.entries(this.__attributes).forEach(([key, value]) => {
                dom.setAttribute(key, value);
            });
            dom.style.display = 'inline-block';
            dom.style.fontStyle = 'normal';
        }
        return this.__tagName !== prevNode.__tagName;
    }

    static importDOM(): DOMConversionMap | null {
        return {
            i: () => ({
                conversion: $convertIconElement,
                priority: 4,
            }),
            span: (domNode: Node) => {
                const el = domNode as HTMLElement;
                const hasIconClass = /fa-|fas |fab |far |fal |fat /i.test(el.className);
                if (hasIconClass) {
                    return {
                        conversion: $convertIconElement,
                        priority: 4,
                    };
                }
                return null;
            }
        };
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement(this.__tagName);
        Object.entries(this.__attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        return { element };
    }

    static importJSON(serializedNode: SerializedIconNode): IconNode {
        const node = $createIconNode(serializedNode.tagName, serializedNode.attributes);
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        return node;
    }

    exportJSON(): SerializedIconNode {
        return {
            ...super.exportJSON(),
            tagName: this.__tagName,
            attributes: this.__attributes,
            type: 'icon',
            version: 1,
        };
    }

    isInline(): boolean { return true; }
    canBeEmpty(): boolean { return true; }
}

function $convertIconElement(domNode: Node) {
    const el = domNode as HTMLElement;
    const attributes: Record<string, string> = {};
    Array.from(el.attributes).forEach(attr => {
        attributes[attr.name] = attr.value;
    });
    const node = $createIconNode(el.tagName, attributes);
    return { node };
}

export function $createIconNode(tagName: string, attributes?: Record<string, string>): IconNode {
    return new IconNode(tagName, attributes);
}

export function $isIconNode(node: LexicalNode | null | undefined): node is IconNode {
    return node instanceof IconNode;
}
