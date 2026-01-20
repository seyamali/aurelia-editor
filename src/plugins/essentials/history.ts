import { registerHistory, createEmptyHistoryState } from '@lexical/history';
import { UNDO_COMMAND, REDO_COMMAND } from 'lexical';
import type { EditorPlugin } from '../../core/registry';

export const HistoryPlugin: EditorPlugin = {
    name: 'history',
    init: (editor) => {
        // Register history with a 1000-step limit
        registerHistory(editor, createEmptyHistoryState(), 1000);
        console.log("History (Undo/Redo) initialized");
    }
};

// Export commands so our buttons can use them
export const HISTORY_COMMANDS = {
    UNDO: { command: UNDO_COMMAND, payload: undefined },
    REDO: { command: REDO_COMMAND, payload: undefined }
};