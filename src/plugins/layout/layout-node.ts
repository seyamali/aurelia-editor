import { ElementNode, type EditorConfig, type NodeKey, type DOMConversionMap, type DOMExportOutput, type LexicalNode, type SerializedElementNode, type Spread } from 'lexical';

export type SerializedLayoutNode = Spread<{
    tagName: string;
    attributes: Record<string, string>;
}, SerializedElementNode>;

export class LayoutNode extends ElementNode {
    __tagName: string;
    __attributes: Record<string, string>;

    constructor(tagName: string, attributes: Record<string, string> = {}, key?: NodeKey) {
        super(key);
        this.__tagName = tagName.toLowerCase();
        this.__attributes = attributes;
    }

    static getType(): string { return 'layout'; }

    static clone(node: LayoutNode): LayoutNode {
        return new LayoutNode(node.__tagName, { ...node.__attributes }, node.__key);
    }

    createDOM(config: EditorConfig): HTMLElement {
        const element = document.createElement(this.__tagName);
        Object.entries(this.__attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        if (config.theme.layout) {
            element.classList.add(config.theme.layout);
        }
        return element;
    }

    updateDOM(prevNode: LayoutNode, dom: HTMLElement): boolean {
        // Simple check: if attributes changed, update them
        if (JSON.stringify(this.__attributes) !== JSON.stringify(prevNode.__attributes)) {
            // Clear old attributes
            Array.from(dom.attributes).forEach(attr => dom.removeAttribute(attr.name));
            // Add new ones
            Object.entries(this.__attributes).forEach(([key, value]) => {
                dom.setAttribute(key, value);
            });
        }
        return this.__tagName !== prevNode.__tagName;
    }

    static importDOM(): DOMConversionMap | null {
        // Comprehensive list of structural, semantic, and form tags to preserve
        const layoutTags = [
            'div', 'header', 'footer', 'section', 'nav', 'main', 'article', 'aside',
            'form', 'label', 'fieldset', 'legend', 'details', 'summary', 'canvas',
            'video', 'audio', 'object', 'embed', 'picture', 'source', 'hr',
            'button', 'input', 'select', 'textarea', 'option', 'optgroup', 'datalist',
            'output', 'progress', 'meter', 'ul', 'ol', 'li'
        ];
        const map: DOMConversionMap = {};

        layoutTags.forEach(tag => {
            map[tag] = () => ({
                conversion: $convertLayoutElement,
                priority: 4, // MAXIMUM PRIORITY to prevent ParagraphNode takeover
            });
        });

        return map;
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement(this.__tagName);
        Object.entries(this.__attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        return { element };
    }

    static importJSON(serializedNode: SerializedLayoutNode): LayoutNode {
        const node = $createLayoutNode(serializedNode.tagName, serializedNode.attributes);
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        return node;
    }

    exportJSON(): SerializedLayoutNode {
        return {
            ...super.exportJSON(),
            tagName: this.__tagName,
            attributes: this.__attributes,
            type: 'layout',
            version: 1,
        };
    }

    canBeEmpty(): boolean { return true; }
    isInline(): boolean { return false; }
}

function $convertLayoutElement(domNode: Node) {
    const el = domNode as HTMLElement;
    const attributes: Record<string, string> = {};
    Array.from(el.attributes).forEach(attr => {
        attributes[attr.name] = attr.value;
    });
    const node = $createLayoutNode(el.tagName, attributes);
    return { node };
}

export function $createLayoutNode(tagName: string, attributes?: Record<string, string>): LayoutNode {
    return new LayoutNode(tagName, attributes);
}

export function $isLayoutNode(node: LexicalNode | null | undefined): node is LayoutNode {
    return node instanceof LayoutNode;
}
