import { createEditor } from 'lexical';
import { describe, expect, it } from 'vitest';
import { CommentNode } from './comment-node';

describe('CommentNode', () => {
    it('preserves resolved state and replies through serialization', () => {
        const editor = createEditor({
            namespace: 'comment-node-test',
            nodes: [CommentNode],
            onError: () => {}
        });

        editor.update(() => {
            const node = new CommentNode('comment_1', 'Review this section', 'Ava', 'Selected text');
            node.__resolved = true;
            node.__replies = [
                { id: 'reply_1', author: 'Noah', text: 'Looks good to me.', timestamp: 123456 }
            ];

            const serialized = node.exportJSON();
            const restored = CommentNode.importJSON(serialized);

            expect(restored.getCommentId()).toBe('comment_1');
            expect(restored.getCommentText()).toBe('Review this section');
            expect(restored.getAuthor()).toBe('Ava');
            expect(restored.isResolved()).toBe(true);
            expect(restored.getReplies()).toHaveLength(1);
            expect(restored.getReplies()[0].text).toBe('Looks good to me.');
        });
    });
});
