import { FORMAT_TEXT_COMMAND, type TextFormatType } from 'lexical';
import { registerRichText } from '@lexical/rich-text';
import type { EditorPlugin } from '../../core/registry';

export const BasicStylesPlugin: EditorPlugin = {
    name: 'basic-styles',
    init: (editor) => {
        // 1. Enable Rich Text support for this plugin
        registerRichText(editor);

        console.log("Basic Styles (Bold, Italic, etc.) initialized");
    }
};

// Helper for our future buttons
export const FORMAT_COMMANDS = {
    BOLD: { command: FORMAT_TEXT_COMMAND, payload: 'bold' as TextFormatType },
    ITALIC: { command: FORMAT_TEXT_COMMAND, payload: 'italic' as TextFormatType },
    UNDERLINE: { command: FORMAT_TEXT_COMMAND, payload: 'underline' as TextFormatType },
    STRIKETHROUGH: { command: FORMAT_TEXT_COMMAND, payload: 'strikethrough' as TextFormatType },
    SUBSCRIPT: { command: FORMAT_TEXT_COMMAND, payload: 'subscript' as TextFormatType },
    SUPERSCRIPT: { command: FORMAT_TEXT_COMMAND, payload: 'superscript' as TextFormatType },
    CODE: { command: FORMAT_TEXT_COMMAND, payload: 'code' as TextFormatType },
};