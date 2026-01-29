import {
    $getSelection,
    $isRangeSelection,
    type LexicalEditor,
    COMMAND_PRIORITY_LOW,
    CLICK_COMMAND
} from 'lexical';
import type { EditorPlugin } from '../../core/registry';
import { type EditorSDK } from '../../core/sdk';
import { DialogSystem } from '../../shared/dialog-system';

// Store the copied format style
let copiedFormat: number | null = null;
let isPainting = false;

export const FormatPainterPlugin: EditorPlugin = {
    name: 'format-painter',
    init: (sdk: EditorSDK) => {
        // Register click listener to apply format
        sdk.registerCommand(
            CLICK_COMMAND,
            () => {
                if (isPainting && copiedFormat !== null) {
                    // We need to wait for the selection to update after the click
                    setTimeout(() => {
                        sdk.update(() => {
                            const selection = $getSelection();
                            if ($isRangeSelection(selection)) {
                                selection.format = copiedFormat!;
                            }
                        });

                        // Turn off painting unless locked
                        if (!isLockedMode) {
                            togglePainting(false);
                        }
                    }, 50);
                }
                return false;
            },
            COMMAND_PRIORITY_LOW
        );
    }
};

export const FormatPainter = {
    /**
     * Copies the format of the current selection.
     */
    copyFormat: (editor: LexicalEditor, isLocked = false) => {
        editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                copiedFormat = selection.format;
                console.log("Format copied:", copiedFormat);
                togglePainting(true, isLocked);
            } else {
                DialogSystem.alert("Select some text to copy its format first.", "Format Painter");
            }
        });
    },

    isPainting: () => isPainting
};

let isLockedMode = false;

function togglePainting(active: boolean, locked = false) {
    isPainting = active;
    isLockedMode = active && locked;

    const btn = document.getElementById('format-painter-btn');
    if (btn) {
        if (active) {
            btn.classList.add('active');
            if (locked) btn.classList.add('locked');
            btn.style.backgroundColor = locked ? '#f59e0b' : '#ffc107'; // Darker amber if locked
            document.body.classList.add('format-painter-active');
        } else {
            btn.classList.remove('active', 'locked');
            btn.style.backgroundColor = '';
            document.body.classList.remove('format-painter-active');
            isLockedMode = false;
        }
    }
}
