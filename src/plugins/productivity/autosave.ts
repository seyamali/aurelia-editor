import type { EditorPlugin } from '../../core/registry';
import { type LexicalEditor, type EditorState } from 'lexical';
import { EditorSDK } from '../../core/sdk';

// Commands from other plugins (optional dependency)
// We assume SAVE_REVISION_COMMAND might exist if the plugin is loaded
export const AUTOSAVE_KEY = 'editor_autosave_state';
const DEBOUNCE_DELAY = 1000; // 1 second debounce for Draft save
const REVISION_INTERVAL = 30000; // 30 seconds for specific Revision snapshot

interface AutosaveConfig {
    interval?: number;     // For full revisions
    enabled?: boolean;
}

export const AutosavePlugin: EditorPlugin = {
    name: 'autosave',
    init: (sdk: EditorSDK) => {
        const editor = sdk.getLexicalEditor();
        let timeoutId: number | undefined;
        let lastRevisionTime = Date.now();

        // Config defaults
        const config: AutosaveConfig = {
            interval: REVISION_INTERVAL,
            enabled: true
        };

        if (!config.enabled) return;

        // Listen for updates
        return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
            if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;

            // 1. UI Feedback: Saving...
            updateStatus('Saving...', 'saving');
            clearTimeout(timeoutId);

            // 2. Debounce Draft Save (Crash Recovery)
            // @ts-ignore
            timeoutId = setTimeout(() => {
                saveState(editorState);

                // 3. Time-based Revision Snapshot
                const now = Date.now();
                if (now - lastRevisionTime > (config.interval || REVISION_INTERVAL)) {
                    // Try to trigger revision history save if available
                    sdk.dispatchCommand('SAVE_REVISION' as any, {
                        name: 'Autosave',
                        isAuto: true
                    });
                    lastRevisionTime = now;
                    console.log("[Autosave] Triggered Revision Snapshot");
                }

            }, DEBOUNCE_DELAY);
        });
    }
};

function saveState(editorState: EditorState) {
    const json = editorState.toJSON();
    const isEmpty = isStateEmpty(json);

    if (isEmpty) {
        localStorage.removeItem(AUTOSAVE_KEY);
        updateStatus('Changes cleared', 'saved');
    } else {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(json));
        updateStatus('All changes saved', 'saved');
    }
}

function isStateEmpty(json: any): boolean {
    if (!json || !json.root || !json.root.children) return true;

    // A state is considered empty if it only contains one empty paragraph
    if (json.root.children.length === 1) {
        const firstChild = json.root.children[0];
        if (firstChild.type === 'paragraph') {
            // Check if paragraph has no children
            if (!firstChild.children || firstChild.children.length === 0) return true;

            // Check if paragraph only has one child and it's an empty text node
            if (firstChild.children.length === 1) {
                const grandChild = firstChild.children[0];
                return grandChild.type === 'text' && (grandChild.text === '' || grandChild.text === undefined);
            }
        }
    }

    return json.root.children.length === 0;
}

function updateStatus(msg: string, type: 'saving' | 'saved' | 'error') {
    const statusEl = document.getElementById('autosave-status');
    if (statusEl) {
        statusEl.innerText = msg;
        statusEl.className = `autosave-status status-${type}`;

        // If saved, keep it for a while then fade to subtle indicator or just stay
        if (type === 'saved') {
            setTimeout(() => {
                if (statusEl.innerText === msg) {
                    statusEl.innerText = 'Saved'; // Shorten it
                    statusEl.classList.add('faded');
                }
            }, 3000);
        }
    }
}

export function hasAutosavedState(): boolean {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (!saved) return false;

    try {
        const json = JSON.parse(saved);
        return !isStateEmpty(json);
    } catch (e) {
        return false;
    }
}

export function loadAutosavedState(editor: LexicalEditor) {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
        try {
            const state = editor.parseEditorState(saved);
            editor.setEditorState(state);
            console.log("Autosave restored.");
            updateStatus('Restored from draft', 'saved');
        } catch (e) {
            console.error("Failed to restore autosave:", e);
            updateStatus('Failed to restore', 'error');
        }
    }
}
