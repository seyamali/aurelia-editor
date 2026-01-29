
import {
    DecoratorNode,
    $applyNodeReplacement,
    type NodeKey,
    type EditorConfig,
    type LexicalNode,
    type SerializedLexicalNode,
    type Spread,
    type LexicalEditor,
    type DOMExportOutput,
    type DOMConversionMap,
    type DOMConversionOutput
} from 'lexical';

export type YouTubeAlignment = 'left' | 'right' | 'center' | 'full';

export type SerializedYouTubeNode = Spread<
    {
        videoID: string;
        width?: number;
        height?: number;
        alignment?: YouTubeAlignment;
        caption?: string;
        showCaption?: boolean;
    },
    SerializedLexicalNode
>;

export class YouTubeNode extends DecoratorNode<HTMLElement> {
    __videoID: string;
    __width: 'inherit' | number;
    __height: 'inherit' | number;
    __alignment: YouTubeAlignment;
    __caption: string;
    __showCaption: boolean;

    static getType(): string {
        return 'youtube';
    }

    static clone(node: YouTubeNode): YouTubeNode {
        return new YouTubeNode(
            node.__videoID,
            node.__width,
            node.__height,
            node.__alignment,
            node.__caption,
            node.__showCaption,
            node.__key
        );
    }

    static importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode {
        const node = $createYouTubeNode(serializedNode.videoID);
        node.setWidthAndHeight(serializedNode.width || 'inherit', serializedNode.height || 'inherit');
        node.setAlignment(serializedNode.alignment || 'center');
        if (serializedNode.caption) node.setCaption(serializedNode.caption);
        if (serializedNode.showCaption) node.setShowCaption(serializedNode.showCaption);
        return node;
    }

    exportJSON(): SerializedYouTubeNode {
        return {
            type: 'youtube',
            version: 1,
            videoID: this.__videoID,
            width: this.__width === 'inherit' ? undefined : this.__width,
            height: this.__height === 'inherit' ? undefined : this.__height,
            alignment: this.__alignment,
            caption: this.__caption,
            showCaption: this.__showCaption,
        };
    }

    constructor(
        videoID: string,
        width: 'inherit' | number = 560,
        height: 'inherit' | number = 315,
        alignment: YouTubeAlignment = 'center',
        caption: string = '',
        showCaption: boolean = false,
        key?: NodeKey
    ) {
        super(key);
        this.__videoID = videoID;
        this.__width = width;
        this.__height = height;
        this.__alignment = alignment;
        this.__caption = caption;
        this.__showCaption = showCaption;
    }

    createDOM(_config: EditorConfig): HTMLElement {
        const span = document.createElement('span');
        span.className = 'editor-youtube-block';
        return span;
    }

    updateDOM(prevNode: YouTubeNode): boolean {
        return (
            this.__videoID !== prevNode.__videoID ||
            this.__width !== prevNode.__width ||
            this.__height !== prevNode.__height ||
            this.__alignment !== prevNode.__alignment ||
            this.__showCaption !== prevNode.__showCaption ||
            this.__caption !== prevNode.__caption
        );
    }

    static importDOM(): DOMConversionMap | null {
        return {
            iframe: (domNode: HTMLElement) => {
                const iframe = domNode as HTMLIFrameElement;
                const src = iframe.getAttribute('src') || '';
                const match = src.match(/embed\/([\w-]{11})/);
                if (match) {
                    return {
                        conversion: $convertYouTubeElement,
                        priority: 4,
                    };
                }
                return null;
            },
            figure: (domNode: HTMLElement) => {
                if (domNode.classList.contains('editor-youtube-figure')) {
                    return {
                        conversion: $convertYouTubeElement,
                        priority: 4,
                    };
                }
                return null;
            },
        };
    }

    exportDOM(): DOMExportOutput {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${this.__videoID}`;
        iframe.width = this.__width === 'inherit' ? '100%' : this.__width.toString();
        iframe.height = this.__height === 'inherit' ? '315' : this.__height.toString();
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.style.border = 'none';

        if (this.__alignment !== 'center' && this.__alignment !== 'full') {
            iframe.style.float = this.__alignment;
        }

        if (this.__showCaption && this.__caption) {
            const figure = document.createElement('figure');
            figure.className = `editor-youtube-figure alignment-${this.__alignment}`;
            figure.appendChild(iframe);
            const figcaption = document.createElement('figcaption');
            figcaption.innerText = this.__caption;
            figure.appendChild(figcaption);
            return { element: figure };
        }

        return { element: iframe };
    }

    decorate(editor?: LexicalEditor): HTMLElement {
        const container = document.createElement('div');
        container.className = `media-wrapper youtube-wrapper alignment-${this.__alignment}`;
        container.setAttribute('data-node-key', this.getKey());
        container.setAttribute('draggable', 'true'); // Allow dragging the block

        const contentContainer = document.createElement('div');
        contentContainer.className = 'media-content';
        contentContainer.style.position = 'relative';

        const iframe = document.createElement('iframe');
        iframe.width = this.__width === 'inherit' ? '560' : this.__width.toString();
        iframe.height = this.__height === 'inherit' ? '315' : this.__height.toString();
        iframe.src = `https://www.youtube-nocookie.com/embed/${this.__videoID}`;
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        // Pointer events none while not editing would be nice, but we need an overlay for selection
        iframe.style.pointerEvents = 'none';

        // Overlay to capture clicks/drags so they don't get swallowed by iframe
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.cursor = 'pointer';
        overlay.style.zIndex = '1';

        contentContainer.appendChild(iframe);
        contentContainer.appendChild(overlay);

        // Resizer Handles
        const resizer = document.createElement('div');
        resizer.className = 'image-resizer'; // Reusing image styles
        ['nw', 'ne', 'sw', 'se'].forEach((dir) => {
            const handle = document.createElement('div');
            handle.className = `resizer-handle handle-${dir}`;
            resizer.appendChild(handle);
        });
        contentContainer.appendChild(resizer);

        container.appendChild(contentContainer);

        if (this.__showCaption) {
            const caption = document.createElement('div');
            caption.className = 'image-caption'; // Reuse
            caption.contentEditable = 'true';
            caption.innerText = this.__caption || 'Write a caption...';
            caption.addEventListener('input', (e) => {
                if (editor) {
                    editor.update(() => {
                        this.setCaption((e.target as HTMLElement).innerText);
                    });
                }
            });
            container.appendChild(caption);
        }

        return container;
    }

    setWidthAndHeight(width: number | 'inherit', height: number | 'inherit'): void {
        const writable = this.getWritable();
        writable.__width = width;
        writable.__height = height;
    }

    setAlignment(alignment: YouTubeAlignment): void {
        const writable = this.getWritable();
        writable.__alignment = alignment;
    }

    setCaption(caption: string): void {
        const writable = this.getWritable();
        writable.__caption = caption;
    }

    setShowCaption(show: boolean): void {
        const writable = this.getWritable();
        writable.__showCaption = show;
    }
}

export function $createYouTubeNode(videoID: string): YouTubeNode {
    return $applyNodeReplacement(new YouTubeNode(videoID));
}

export function $isYouTubeNode(node: LexicalNode | null | undefined): node is YouTubeNode {
    return node instanceof YouTubeNode;
}

function $convertYouTubeElement(domNode: Node): DOMConversionOutput {
    let videoID = '';
    let alignment: YouTubeAlignment = 'center';
    let caption = '';
    let showCaption = false;

    const el = domNode as HTMLElement;

    if (el.tagName === 'IFRAME') {
        const src = el.getAttribute('src') || '';
        const match = src.match(/embed\/([\w-]{11})/);
        if (match) videoID = match[1];
    } else if (el.tagName === 'FIGURE') {
        const iframe = el.querySelector('iframe');
        if (iframe) {
            const src = iframe.getAttribute('src') || '';
            const match = src.match(/embed\/([\w-]{11})/);
            if (match) videoID = match[1];
        }
        const figcaption = el.querySelector('figcaption');
        if (figcaption) {
            caption = figcaption.innerText;
            showCaption = true;
        }

        // Detect alignment from class
        if (el.classList.contains('alignment-left')) alignment = 'left';
        else if (el.classList.contains('alignment-right')) alignment = 'right';
        else if (el.classList.contains('alignment-full')) alignment = 'full';
    }

    if (videoID) {
        const node = $createYouTubeNode(videoID);
        node.setAlignment(alignment);
        node.setCaption(caption);
        node.setShowCaption(showCaption);
        return { node };
    }

    return { node: null };
}
