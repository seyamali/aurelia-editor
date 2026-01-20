import { $createHeadingNode, $createQuoteNode, type HeadingTagType } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { $getSelection, $isRangeSelection, $createParagraphNode, type LexicalEditor } from 'lexical'; // Added $createParagraphNode
import type { EditorPlugin } from '../../core/registry';
import { $createHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';

export const HeadingsPlugin: EditorPlugin = {
    name: 'headings',
    init: (editor) => {
        console.log("Headings & Blocks initialized");
    }
};

export const setBlockType = (editor: any, type: HeadingTagType | 'quote' | 'paragraph') => {
    editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            if (type === 'quote') {
                $setBlocksType(selection, () => $createQuoteNode());
            } else if (type === 'paragraph') {
                // This allows the user to go back to normal text
                $setBlocksType(selection, () => $createParagraphNode());
            } else {
                $setBlocksType(selection, () => $createHeadingNode(type));
            }
        }
    });
};

export const insertHorizontalRule = (editor: LexicalEditor) => {
    editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            const hrNode = $createHorizontalRuleNode();
            // This inserts the divider at the cursor position
            selection.insertNodes([hrNode]);
        }
    });
};