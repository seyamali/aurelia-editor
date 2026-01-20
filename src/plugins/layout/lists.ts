import {
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    registerList
} from '@lexical/list';
import {
    INDENT_CONTENT_COMMAND,
    OUTDENT_CONTENT_COMMAND
} from 'lexical';
import type { EditorPlugin } from '../../core/registry';

export const ListsPlugin: EditorPlugin = {
    name: 'lists',
    init: (editor) => {
        // This single line handles the logic for Tab, Shift+Tab, 
        // and connects the indent/outdent commands to list behavior.
        registerList(editor);
        console.log("Lists logic registered");
    }
};

export const LIST_COMMANDS = {
    BULLET: { command: INSERT_UNORDERED_LIST_COMMAND, payload: undefined },
    NUMBER: { command: INSERT_ORDERED_LIST_COMMAND, payload: undefined },
    // We use the standard Lexical commands now
    INDENT: { command: INDENT_CONTENT_COMMAND, payload: undefined },
    OUTDENT: { command: OUTDENT_CONTENT_COMMAND, payload: undefined }
};