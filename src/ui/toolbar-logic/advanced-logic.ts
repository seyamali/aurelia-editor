import { CUT_COMMAND, COPY_COMMAND, PASTE_COMMAND, $getSelection, $isRangeSelection, INDENT_CONTENT_COMMAND, OUTDENT_CONTENT_COMMAND } from 'lexical';
import { MyUniversalEditor } from '../../core/engine';
import { insertImage } from '../../plugins/media/images';
import { tableHandlers } from '../../plugins/layout/tables';
import { MediaEmbedPlugin } from '../../plugins/advanced/media-embed';
import { INSERT_CODE_BLOCK_COMMAND } from '../../plugins/advanced/code-blocks';
import { showPlaceholderInsertPanel } from '../../plugins/advanced/placeholder';
import { TOGGLE_TRACK_CHANGES_COMMAND } from '../../plugins/collaboration/track-changes';
import { SourceViewPlugin } from '../../plugins/advanced/source-view';
import { FormatPainter } from '../../plugins/productivity/format-painter';
import { CaseChange } from '../../plugins/productivity/case-change';
import { DialogSystem } from '../../shared/dialog-system';
import { REMOVE_FORMATTING_COMMAND } from '../../plugins/essentials/clipboard';

export function setupAdvancedLogic(editor: MyUniversalEditor, internalEditor: any) {
    let isSourceMode = false;
    const internal = editor.getInternalEditor();

    // Clipboard & Generic Formatting Group
    document.getElementById('cut-btn')?.addEventListener('click', () => {
        internal.dispatchCommand(CUT_COMMAND, null);
    });
    document.getElementById('copy-btn')?.addEventListener('click', () => {
        internal.dispatchCommand(COPY_COMMAND, null);
    });
    document.getElementById('paste-btn')?.addEventListener('click', async () => {
        try {
            const dataTransfer = new DataTransfer();
            const text = await navigator.clipboard.readText();
            dataTransfer.setData('text/plain', text);
            const event = new ClipboardEvent('paste', { clipboardData: dataTransfer });
            internal.dispatchCommand(PASTE_COMMAND, event);
        } catch (e) {
            console.error("Paste failed: Browser security blocked clipboard access from button.", e);
            DialogSystem.alert("Please use Ctrl+V to paste.", "Clipboard Access Blocked");
        }
    });
    document.getElementById('paste-plain-btn')?.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            internal.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    selection.insertRawText(text);
                }
            });
        } catch (e) {
            console.error("Paste Plain failed.", e);
            DialogSystem.alert("Please use Ctrl+Shift+V to paste as plain text.", "Clipboard Access Blocked");
        }
    });

    document.getElementById('clear-btn')?.addEventListener('click', () => {
        internal.dispatchCommand(REMOVE_FORMATTING_COMMAND, undefined);
    });

    // Indentation Group
    document.getElementById('indent-btn')?.addEventListener('click', () => {
        internal.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
    });
    document.getElementById('outdent-btn')?.addEventListener('click', () => {
        internal.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
    });

    // Media & Tables
    document.getElementById('image-btn')?.addEventListener('click', () => insertImage());
    document.getElementById('add-row-btn')?.addEventListener('click', () => tableHandlers.insertRow(editor));
    document.getElementById('add-col-btn')?.addEventListener('click', () => tableHandlers.insertColumn(editor));
    document.getElementById('del-row-btn')?.addEventListener('click', () => tableHandlers.deleteRow(editor));
    document.getElementById('del-col-btn')?.addEventListener('click', () => tableHandlers.deleteColumn(editor));

    // Advanced & Plugins
    document.getElementById('video-btn')?.addEventListener('click', () => {
        MediaEmbedPlugin.insertYouTube(editor);
    });
    document.getElementById('html-snippet-btn')?.addEventListener('click', () => {
        MediaEmbedPlugin.insertHTMLSnippet(editor);
    });

    // Placeholders
    document.getElementById('insert-placeholder-btn')?.addEventListener('click', () => {
        showPlaceholderInsertPanel(editor.getInternalEditor());
    });

    document.getElementById('code-block-btn')?.addEventListener('click', () => {
        editor.getInternalEditor().dispatchCommand(INSERT_CODE_BLOCK_COMMAND, null);
    });

    document.getElementById('track-changes-btn')?.addEventListener('click', () => {
        internal.dispatchCommand(TOGGLE_TRACK_CHANGES_COMMAND, undefined);
    });

    // Listen for state changes to update button UI
    window.addEventListener('track-changes-toggled', (e: any) => {
        const btn = document.getElementById('track-changes-btn') as HTMLButtonElement;
        if (!btn) return;

        const isTracking = e.detail;
        if (isTracking) {
            btn.innerText = "👁️ Track Changes: ON";
            btn.classList.remove('off');
            btn.classList.add('on');
        } else {
            btn.innerText = "👁️ Track Changes: OFF";
            btn.classList.remove('on');
            btn.classList.add('off');
        }
    });

    // Format Painter
    const paintBtn = document.getElementById('format-painter-btn');
    paintBtn?.addEventListener('click', () => {
        FormatPainter.copyFormat(internalEditor); // Single click = normal paint
    });
    paintBtn?.addEventListener('dblclick', () => {
        FormatPainter.copyFormat(internalEditor, true); // Double click = lock paint
    });

    // Case Change
    document.getElementById('uppercase-btn')?.addEventListener('click', () => CaseChange.toUpperCase(internalEditor));
    document.getElementById('lowercase-btn')?.addEventListener('click', () => CaseChange.toLowerCase(internalEditor));
    document.getElementById('titlecase-btn')?.addEventListener('click', () => CaseChange.toTitleCase(internalEditor));

    // Source Toggle
    document.getElementById('source-toggle-btn')?.addEventListener('click', () => {
        const canvas = document.getElementById('editor-canvas') as HTMLElement;
        const sourceArea = document.getElementById('source-editor') as HTMLTextAreaElement;
        const btn = document.getElementById('source-toggle-btn') as HTMLButtonElement;
        const toolbar = document.getElementById('toolbar') as HTMLElement;

        if (!isSourceMode) {
            // Switch to Source
            const html = SourceViewPlugin.getHtml(editor);
            sourceArea.value = html;

            canvas.style.display = 'none';
            sourceArea.style.display = 'block';
            sourceArea.focus();

            btn.innerHTML = '✔ Apply Changes';
            btn.classList.add('active');
            toolbar.classList.add('source-mode-active');

            // Disable most toolbar buttons
            toolbar.querySelectorAll('button:not(#source-toggle-btn)').forEach(child => {
                (child as HTMLButtonElement).disabled = true;
            });
            toolbar.querySelectorAll('select').forEach(child => {
                (child as HTMLSelectElement).disabled = true;
            });

            isSourceMode = true;
        } else {
            // Switch back to Visual
            try {
                SourceViewPlugin.setHtml(editor, sourceArea.value);

                canvas.style.display = 'block';
                sourceArea.style.display = 'none';

                btn.innerHTML = 'HTML Source';
                btn.classList.remove('active');
                toolbar.classList.remove('source-mode-active');

                // Re-enable toolbar
                toolbar.querySelectorAll('button').forEach(child => {
                    (child as HTMLButtonElement).disabled = false;
                });
                toolbar.querySelectorAll('select').forEach(child => {
                    (child as HTMLSelectElement).disabled = false;
                });

                isSourceMode = false;

                // Focus editor back
                editor.getInternalEditor().focus();
            } catch (error) {
                console.error("HTML Source Apply Error:", error);
                DialogSystem.alert("Failed to apply HTML changes. Please check for invalid tags.", "Format Error");
            }
        }
    });
}
