import {
    createCommand,
    type LexicalCommand,
    $getSelection,
    $isRangeSelection,
    type NodeKey,
    COMMAND_PRIORITY_EDITOR
} from 'lexical';
import { $createFootnoteRefNode, FootnoteRefNode } from './footnote-node';
import { EditorSDK } from '../../core/sdk';

export const INSERT_FOOTNOTE_COMMAND: LexicalCommand<string> = createCommand('INSERT_FOOTNOTE_COMMAND');
export const EDIT_FOOTNOTE_COMMAND: LexicalCommand<NodeKey> = createCommand('EDIT_FOOTNOTE_COMMAND');

export const FootnotePlugin = {
    name: 'footnote',
    init: (sdk: EditorSDK) => {
        if (!sdk.hasNodes([FootnoteRefNode])) {
            throw new Error('FootnotePlugin: FootnoteNode not registered on editor');
        }

        sdk.registerCommand(
            INSERT_FOOTNOTE_COMMAND,
            (_content) => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    // Generate a unique ID (simple timestamp for now, plugin will re-number)
                    const id = `fn-${Date.now()}`;
                    const footnote = $createFootnoteRefNode(id);
                    selection.insertNodes([footnote]);
                }
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );

        sdk.registerCommand(
            EDIT_FOOTNOTE_COMMAND,
            (_key) => {
                // Footnote references are auto-managed.
                // Editing the *content* happens in the footer, which is DOM-based in this implementation.
                // We don't edit the reference node itself via this command.
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );
    }
};
