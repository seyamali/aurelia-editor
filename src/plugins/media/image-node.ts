// Imports for classes and values
import {
    DecoratorNode,
    $applyNodeReplacement
} from 'lexical';

// Imports for Types only (using the 'type' keyword)
import type {
    NodeKey,
    EditorConfig,
    LexicalNode,
    SerializedLexicalNode,
    Spread
} from 'lexical';


export type SerializedImageNode = Spread<{
    altText: string;
    caption: string;
    height?: number;
    maxWidth: number;
    src: string;
    width?: number;
}, SerializedLexicalNode>;

export class ImageNode extends DecoratorNode<HTMLElement> {
    __src: string;
    __altText: string;
    __width: 'inherit' | number;
    __height: 'inherit' | number;
    __maxWidth: number;
    __caption: string;

    // 1. FIX: Added default values to constructor arguments to satisfy Lexical's requirements
    constructor(
        src: string = '',
        altText: string = '',
        maxWidth: number = 500,
        width?: number | 'inherit',
        height?: number | 'inherit',
        caption?: string,
        key?: NodeKey
    ) {
        super(key);
        this.__src = src;
        this.__altText = altText;
        this.__maxWidth = maxWidth;
        this.__width = width || 'inherit';
        this.__height = height || 'inherit';
        this.__caption = caption || '';
    }

    static getType(): string { return 'image'; }

    static clone(node: ImageNode): ImageNode {
        return new ImageNode(
            node.__src,
            node.__altText,
            node.__maxWidth,
            node.__width,
            node.__height,
            node.__caption,
            node.__key
        );
    }

    // 2. FIX: Added importJSON so Lexical can reconstruct the node from data
    static importJSON(serializedNode: SerializedImageNode): ImageNode {
        const { altText, caption, height, maxWidth, src, width } = serializedNode;
        const node = $createImageNode(src, altText, maxWidth);
        node.__width = width || 'inherit';
        node.__height = height || 'inherit';
        node.__caption = caption || '';
        return node;
    }

    // 3. FIX: Added exportJSON to save the node data correctly
    exportJSON(): SerializedImageNode {
        return {
            altText: this.__altText,
            caption: this.__caption,
            height: this.__height === 'inherit' ? 0 : this.__height,
            maxWidth: this.__maxWidth,
            src: this.__src,
            type: 'image',
            version: 1,
            width: this.__width === 'inherit' ? 0 : this.__width,
        };
    }

    createDOM(config: EditorConfig): HTMLElement {
        const span = document.createElement('span');
        const theme = config.theme;
        if (theme.image !== undefined) span.className = theme.image;
        const element = this.decorate();
        span.appendChild(element);
        return span;
    }

    updateDOM(): false { return false; }

    decorate(): HTMLElement {
        console.log("Rendering image node with src:", this.__src);
        const container = document.createElement('div');
        container.className = 'image-control-wrapper';

        const img = document.createElement('img');
        img.src = this.__src;
        img.alt = this.__altText;
        img.style.width = this.__width === 'inherit' ? '100%' : `${this.__width}px`;

        container.appendChild(img);

        if (this.__caption) {
            const caption = document.createElement('figcaption');
            caption.innerText = this.__caption;
            container.appendChild(caption);
        }

        return container;
    }
}

export function $createImageNode(src: string, altText: string, maxWidth: number): ImageNode {
    return $applyNodeReplacement(new ImageNode(src, altText, maxWidth));
}