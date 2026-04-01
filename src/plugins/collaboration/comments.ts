import {
    $createTextNode,
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    $nodesOfType,
    COMMAND_PRIORITY_EDITOR,
    createCommand,
    type LexicalCommand,
    type LexicalEditor,
    type TextNode
} from 'lexical';
import type { EditorPlugin } from '../../core/registry';
import { EditorSDK } from '../../core/sdk';
import { DialogSystem } from '../../shared/dialog-system';
import { CommentNode, type CommentReply } from './comment-node';

export const ADD_INLINE_COMMENT_COMMAND: LexicalCommand<{ commentText: string; author?: string }> = createCommand('ADD_INLINE_COMMENT');
export const ADD_COMMENT_REPLY_COMMAND: LexicalCommand<{ commentId: string; replyText: string; author?: string }> = createCommand('ADD_COMMENT_REPLY');
export const SET_COMMENT_RESOLVED_COMMAND: LexicalCommand<{ commentId: string; resolved: boolean }> = createCommand('SET_COMMENT_RESOLVED');
export const RESOLVE_COMMENT_COMMAND: LexicalCommand<string> = createCommand('RESOLVE_COMMENT');
export const DELETE_COMMENT_COMMAND: LexicalCommand<string> = createCommand('DELETE_COMMENT');
export const TOGGLE_COMMENTS_PANEL_COMMAND: LexicalCommand<void> = createCommand('TOGGLE_COMMENTS_PANEL');

function generateCommentId(): string {
    return `comment_${Math.random().toString(36).slice(2, 10)}`;
}

function generateReplyId(): string {
    return `reply_${Math.random().toString(36).slice(2, 10)}`;
}

function cloneAsPlainTextNode(node: CommentNode): TextNode {
    const textNode = $createTextNode(node.getTextContent());
    textNode.setFormat(node.getFormat());
    textNode.setStyle(node.getStyle());
    textNode.setMode(node.getMode());
    textNode.setDetail(node.getDetail());
    return textNode;
}

function cloneAsCommentNode(node: TextNode, commentId: string, commentText: string, author: string): CommentNode {
    const commentNode = new CommentNode(commentId, commentText, author, node.getTextContent());
    commentNode.setFormat(node.getFormat());
    commentNode.setStyle(node.getStyle());
    commentNode.setMode(node.getMode());
    commentNode.setDetail(node.getDetail());
    return commentNode;
}

function applyThreadMutation(editor: LexicalEditor, commentId: string, mutator: (node: CommentNode) => void): void {
    editor.update(() => {
        const commentNodes = $nodesOfType(CommentNode).filter(node => node.getCommentId() === commentId);
        commentNodes.forEach(node => mutator(node.getWritable()));
    });
}

function dispatchCommentsUpdated(detail?: { open?: boolean; focusCommentId?: string }) {
    window.dispatchEvent(new CustomEvent('editor-comments-updated', { detail }));
}

function unwrapCommentThread(editor: LexicalEditor, commentId: string): void {
    applyThreadMutation(editor, commentId, (node) => {
        node.replace(cloneAsPlainTextNode(node));
    });
}

function setCommentResolved(editor: LexicalEditor, commentId: string, resolved: boolean): void {
    applyThreadMutation(editor, commentId, (node) => {
        node.setResolved(resolved);
    });
}

function addReplyToThread(editor: LexicalEditor, commentId: string, replyText: string, author: string): boolean {
    let added = false;

    applyThreadMutation(editor, commentId, (node) => {
        const replies = node.getReplies();
        const reply: CommentReply = {
            id: generateReplyId(),
            author,
            text: replyText,
            timestamp: Date.now()
        };

        replies.push(reply);
        node.setReplies(replies);
        added = true;
    });

    return added;
}

export async function promptForInlineComment(editor: LexicalEditor): Promise<void> {
    let hasTextSelection = false;

    editor.getEditorState().read(() => {
        const selection = $getSelection();
        hasTextSelection = $isRangeSelection(selection) && !selection.isCollapsed() && selection.getTextContent().trim().length > 0;
    });

    if (!hasTextSelection) {
        await DialogSystem.alert('Select some text first, then add a comment.', 'Add Comment');
        return;
    }

    const commentText = await DialogSystem.prompt('Add a comment for the selected text:', '', 'New Comment');
    if (!commentText || !commentText.trim()) {
        return;
    }

    editor.dispatchCommand(ADD_INLINE_COMMENT_COMMAND, {
        commentText: commentText.trim(),
        author: 'Current User'
    });
}

export const CommentsPlugin: EditorPlugin = {
    name: 'comments',
    init: (sdk: EditorSDK) => {
        const editor = sdk.getLexicalEditor();

        sdk.registerCommand(
            ADD_INLINE_COMMENT_COMMAND,
            (payload) => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection) || selection.isCollapsed()) {
                    return false;
                }

                const commentText = payload.commentText?.trim();
                if (!commentText) {
                    return false;
                }

                const extractedNodes = selection.extract();
                const commentId = generateCommentId();
                const author = payload.author || 'Current User';

                const commentNodes = extractedNodes.map(node => {
                    if ($isTextNode(node)) {
                        return cloneAsCommentNode(node, commentId, commentText, author);
                    }
                    return node;
                });

                selection.insertNodes(commentNodes);
                dispatchCommentsUpdated({ open: true, focusCommentId: commentId });
                sdk.announce('Comment added.');
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );

        sdk.registerCommand(
            ADD_COMMENT_REPLY_COMMAND,
            (payload) => {
                const replyText = payload.replyText?.trim();
                if (!replyText) {
                    return false;
                }

                const added = addReplyToThread(editor, payload.commentId, replyText, payload.author || 'Current User');
                if (!added) {
                    return false;
                }

                setCommentResolved(editor, payload.commentId, false);
                dispatchCommentsUpdated({ open: true, focusCommentId: payload.commentId });
                sdk.announce('Comment reply added.');
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );

        sdk.registerCommand(
            SET_COMMENT_RESOLVED_COMMAND,
            (payload) => {
                setCommentResolved(editor, payload.commentId, payload.resolved);
                dispatchCommentsUpdated({ open: true, focusCommentId: payload.commentId });
                sdk.announce(payload.resolved ? 'Comment resolved.' : 'Comment reopened.');
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );

        sdk.registerCommand(
            RESOLVE_COMMENT_COMMAND,
            (commentId) => {
                setCommentResolved(editor, commentId, true);
                dispatchCommentsUpdated({ open: true, focusCommentId: commentId });
                sdk.announce('Comment resolved.');
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );

        sdk.registerCommand(
            DELETE_COMMENT_COMMAND,
            (commentId) => {
                unwrapCommentThread(editor, commentId);
                dispatchCommentsUpdated();
                sdk.announce('Comment removed.');
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );

        sdk.registerCommand(
            TOGGLE_COMMENTS_PANEL_COMMAND,
            () => {
                window.dispatchEvent(new CustomEvent('editor-comments-toggle'));
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );
    }
};
