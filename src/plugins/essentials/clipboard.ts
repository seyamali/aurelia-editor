import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_CRITICAL,
    createCommand,
    $isTextNode,
    type LexicalCommand
} from 'lexical';
import type { EditorPlugin } from '../../core/registry';

// 1. Properly create the command object
export const REMOVE_FORMATTING_COMMAND: LexicalCommand<void> = createCommand('REMOVE_FORMATTING_COMMAND');

export const ClipboardPlugin: EditorPlugin = {
    name: 'clipboard-essentials',
    init: (editor) => {
        // 2. Register the command using the object, not a string
        editor.registerCommand(
            REMOVE_FORMATTING_COMMAND,
            () => {
                editor.update(() => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        selection.getNodes().forEach((node) => {
                            // 3. Fix: Check if it's a TextNode before calling setFormat/setStyle
                            if ($isTextNode(node)) {
                                node.setFormat(0);
                                node.setStyle('');
                            }
                        });
                    }
                });
                return true;
            },
            COMMAND_PRIORITY_CRITICAL
        );
        console.log("Clipboard & Clear Format initialized");
    }
};