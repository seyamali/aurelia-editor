import { TextNode, type EditorConfig, type NodeKey, type SerializedTextNode, type Spread } from 'lexical';

export type CommentReply = {
    id: string;
    author: string;
    text: string;
    timestamp: number;
};

export type SerializedCommentNode = Spread<{
    commentId: string;
    commentText: string;
    author: string;
    timestamp: number;
    resolved: boolean;
    replies: CommentReply[];
}, SerializedTextNode>;

export class CommentNode extends TextNode {
    __commentId: string;
    __commentText: string;
    __author: string;
    __timestamp: number;
    __resolved: boolean;
    __replies: CommentReply[];

    static getType(): string {
        return 'comment';
    }

    static clone(node: CommentNode): CommentNode {
        const clone = new CommentNode(
            node.__commentId,
            node.__commentText,
            node.__author,
            node.__text,
            node.__key
        );
        clone.__timestamp = node.__timestamp;
        clone.__resolved = node.__resolved;
        clone.__replies = [...node.__replies];
        return clone;
    }

    constructor(commentId: string, commentText: string, author: string, text: string, key?: NodeKey) {
        super(text, key);
        this.__commentId = commentId;
        this.__commentText = commentText;
        this.__author = author;
        this.__timestamp = Date.now();
        this.__resolved = false;
        this.__replies = [];
    }

    getCommentId(): string {
        return this.__commentId;
    }

    getCommentText(): string {
        return this.__commentText;
    }

    getAuthor(): string {
        return this.__author;
    }

    getTimestamp(): number {
        return this.__timestamp;
    }

    isResolved(): boolean {
        return this.__resolved;
    }

    getReplies(): CommentReply[] {
        return [...this.__replies];
    }

    setResolved(resolved: boolean): void {
        const writable = this.getWritable();
        writable.__resolved = resolved;
    }

    setReplies(replies: CommentReply[]): void {
        const writable = this.getWritable();
        writable.__replies = [...replies];
    }

    createDOM(config: EditorConfig): HTMLElement {
        const dom = super.createDOM(config);
        dom.classList.add('comment-node');
        dom.setAttribute('data-comment-id', this.__commentId);
        dom.setAttribute('data-comment-author', this.__author);
        dom.setAttribute('data-comment-resolved', String(this.__resolved));
        dom.title = `${this.__author}: ${this.__commentText}${this.__resolved ? ' (resolved)' : ''}`;
        dom.classList.toggle('comment-node-resolved', this.__resolved);
        return dom;
    }

    updateDOM(prevNode: CommentNode, dom: HTMLElement): boolean {
        if (this.__resolved !== prevNode.__resolved) {
            dom.classList.toggle('comment-node-resolved', this.__resolved);
            dom.setAttribute('data-comment-resolved', String(this.__resolved));
            dom.title = `${this.__author}: ${this.__commentText}${this.__resolved ? ' (resolved)' : ''}`;
        }

        return false;
    }

    static importJSON(serializedNode: SerializedCommentNode): CommentNode {
        const node = new CommentNode(
            serializedNode.commentId,
            serializedNode.commentText,
            serializedNode.author,
            serializedNode.text
        );
        node.__timestamp = serializedNode.timestamp;
        node.__resolved = serializedNode.resolved ?? false;
        node.__replies = [...(serializedNode.replies ?? [])];
        return node;
    }

    exportJSON(): SerializedCommentNode {
        return {
            ...super.exportJSON(),
            commentId: this.__commentId,
            commentText: this.__commentText,
            author: this.__author,
            timestamp: this.__timestamp,
            resolved: this.__resolved,
            replies: this.__replies,
            type: 'comment',
            version: 2
        };
    }
}
