import {
    DecoratorNode,
    type EditorConfig,
    type LexicalNode,
    type NodeKey,
    type SerializedLexicalNode,
    type Spread,
} from 'lexical';

// ============================================
// FOOTNOTE REFERENCE NODE (Inline Marker)
// ============================================

export type SerializedFootnoteRefNode = Spread<
    {
        footnoteId: string;
        type: 'footnote-ref';
        version: 1;
    },
    SerializedLexicalNode
>;

export class FootnoteRefNode extends DecoratorNode<HTMLElement> {
    __footnoteId: string;

    static getType(): string {
        return 'footnote-ref';
    }

    static clone(node: FootnoteRefNode): FootnoteRefNode {
        return new FootnoteRefNode(node.__footnoteId, node.__key);
    }

    static importJSON(serializedNode: SerializedFootnoteRefNode): FootnoteRefNode {
        return $createFootnoteRefNode(serializedNode.footnoteId);
    }

    constructor(footnoteId: string, key?: NodeKey) {
        super(key);
        this.__footnoteId = footnoteId;
    }

    exportJSON(): SerializedFootnoteRefNode {
        return {
            footnoteId: this.__footnoteId,
            type: 'footnote-ref',
            version: 1,
        };
    }

    getFootnoteId(): string {
        return this.__footnoteId;
    }

    createDOM(_config: EditorConfig): HTMLElement {
        const sup = document.createElement('sup');
        sup.className = 'footnote-ref';
        sup.setAttribute('data-footnote-id', this.__footnoteId);
        sup.contentEditable = 'false';
        sup.textContent = '?'; // Will be updated by plugin
        return sup;
    }

    updateDOM(prevNode: FootnoteRefNode, dom: HTMLElement): boolean {
        if (prevNode.__footnoteId !== this.__footnoteId) {
            dom.setAttribute('data-footnote-id', this.__footnoteId);
        }
        return false;
    }

    decorate(): HTMLElement {
        const sup = document.createElement('sup');
        sup.className = 'footnote-ref';
        sup.setAttribute('data-footnote-id', this.__footnoteId);
        sup.contentEditable = 'false';
        sup.textContent = '?';
        return sup;
    }

    isInline(): boolean {
        return true;
    }
}

export function $createFootnoteRefNode(footnoteId: string): FootnoteRefNode {
    return new FootnoteRefNode(footnoteId);
}

export function $isFootnoteRefNode(node: LexicalNode | null | undefined): node is FootnoteRefNode {
    return node instanceof FootnoteRefNode;
}

// ============================================
// FOOTNOTE CONTENT NODE (Bottom Block)
// ============================================

export type SerializedFootnoteContentNode = Spread<
    {
        footnoteId: string;
        content: string;
        type: 'footnote-content';
        version: 1;
    },
    SerializedLexicalNode
>;

export class FootnoteContentNode extends DecoratorNode<HTMLElement> {
    __footnoteId: string;
    __content: string;

    static getType(): string {
        return 'footnote-content';
    }

    static clone(node: FootnoteContentNode): FootnoteContentNode {
        return new FootnoteContentNode(node.__footnoteId, node.__content, node.__key);
    }

    static importJSON(serializedNode: SerializedFootnoteContentNode): FootnoteContentNode {
        return $createFootnoteContentNode(serializedNode.footnoteId, serializedNode.content);
    }

    constructor(footnoteId: string, content: string, key?: NodeKey) {
        super(key);
        this.__footnoteId = footnoteId;
        this.__content = content;
    }

    exportJSON(): SerializedFootnoteContentNode {
        return {
            footnoteId: this.__footnoteId,
            content: this.__content,
            type: 'footnote-content',
            version: 1,
        };
    }

    getFootnoteId(): string {
        return this.__footnoteId;
    }

    getContent(): string {
        return this.__content;
    }

    setContent(content: string): void {
        const writable = this.getWritable();
        writable.__content = content;
    }

    createDOM(_config: EditorConfig): HTMLElement {
        const div = document.createElement('div');
        div.className = 'footnote-content-item';
        div.setAttribute('data-footnote-id', this.__footnoteId);
        div.innerHTML = `
            <span class="footnote-number">?</span>
            <div class="footnote-text" contenteditable="true">${this.__content || ''}</div>
            <button class="footnote-return" title="Return to reference">↩</button>
        `;
        return div;
    }

    updateDOM(prevNode: FootnoteContentNode, dom: HTMLElement): boolean {
        if (prevNode.__content !== this.__content) {
            const textEl = dom.querySelector('.footnote-text');
            if (textEl) {
                textEl.textContent = this.__content;
            }
        }
        return false;
    }

    decorate(): HTMLElement {
        const div = document.createElement('div');
        div.className = 'footnote-content-item';
        div.setAttribute('data-footnote-id', this.__footnoteId);
        div.innerHTML = `
            <span class="footnote-number">?</span>
            <div class="footnote-text" contenteditable="true">${this.__content || ''}</div>
            <button class="footnote-return" title="Return to reference">↩</button>
        `;
        return div;
    }
}

export function $createFootnoteContentNode(footnoteId: string, content: string): FootnoteContentNode {
    return new FootnoteContentNode(footnoteId, content);
}

export function $isFootnoteContentNode(node: LexicalNode | null | undefined): node is FootnoteContentNode {
    return node instanceof FootnoteContentNode;
}

// ============================================
// FOOTNOTE CONTAINER NODE (Wrapper)
// ============================================

export type SerializedFootnoteContainerNode = Spread<
    {
        type: 'footnote-container';
        version: 1;
    },
    SerializedLexicalNode
>;

export class FootnoteContainerNode extends DecoratorNode<HTMLElement> {
    static getType(): string {
        return 'footnote-container';
    }

    static clone(node: FootnoteContainerNode): FootnoteContainerNode {
        return new FootnoteContainerNode(node.__key);
    }

    static importJSON(_serializedNode: SerializedFootnoteContainerNode): FootnoteContainerNode {
        return $createFootnoteContainerNode();
    }

    exportJSON(): SerializedFootnoteContainerNode {
        return {
            type: 'footnote-container',
            version: 1,
        };
    }

    createDOM(_config: EditorConfig): HTMLElement {
        const div = document.createElement('div');
        div.className = 'footnotes-container';
        div.contentEditable = 'false';
        div.innerHTML = `
            <div class="footnotes-divider"></div>
            <div class="footnotes-header">Footnotes</div>
            <div id="footnotes-list" class="footnotes-list"></div>
        `;
        return div;
    }

    updateDOM(): boolean {
        return false;
    }

    decorate(): HTMLElement {
        const div = document.createElement('div');
        div.className = 'footnotes-container';
        div.contentEditable = 'false';
        div.innerHTML = `
            <div class="footnotes-divider"></div>
            <div class="footnotes-header">Footnotes</div>
            <div id="footnotes-list" class="footnotes-list"></div>
        `;
        return div;
    }
}

export function $createFootnoteContainerNode(): FootnoteContainerNode {
    return new FootnoteContainerNode();
}

export function $isFootnoteContainerNode(node: LexicalNode | null | undefined): node is FootnoteContainerNode {
    return node instanceof FootnoteContainerNode;
}
