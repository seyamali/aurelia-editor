import {
    FORMAT_TEXT_COMMAND,
    FORMAT_ELEMENT_COMMAND,
    UNDO_COMMAND,
    REDO_COMMAND,
    INDENT_CONTENT_COMMAND,
    OUTDENT_CONTENT_COMMAND,
} from 'lexical';
import { AureliaEditor } from '../core/engine';
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from '@lexical/list';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { INSERT_PAGE_BREAK_COMMAND } from '../plugins/page-layout/page-break';
import { INSERT_FOOTNOTE_COMMAND } from '../plugins/advanced/footnote-plugin';
import { INSERT_TOC_COMMAND } from '../plugins/page-layout/toc-plugin';
import { INSERT_CODE_BLOCK_COMMAND } from '../plugins/advanced/code-blocks';
import { REMOVE_FORMATTING_COMMAND } from '../plugins/essentials/clipboard';
import { SHOW_LINK_POPOVER_COMMAND } from '../plugins/media/link-popover-ui';
import { CaseChange } from '../plugins/productivity/case-change';
import { TOGGLE_TRACK_CHANGES_COMMAND } from '../plugins/collaboration/track-changes';

import { SourceViewPlugin } from '../plugins/advanced/source-view';
import { ICONS } from './icons';
import { DialogSystem } from '../shared/dialog-system';

// Imported Logic Handlers
import { insertImage } from '../plugins/media/images';
import { MediaEmbedPlugin } from '../plugins/advanced/media-embed';
import { toggleTableGridPicker } from './table-grid-picker';
import { toggleBlockQuote, setBlockType } from '../plugins/layout/headings';
import { FormatPainter } from '../plugins/productivity/format-painter';
import { ExportPDF } from '../plugins/export/pdf-export';
import { ExportWord } from '../plugins/export/word-export';
import { ImportWord } from '../plugins/import/word-import';
import { MinimapPlugin } from '../plugins/productivity/minimap';
import { DocumentOutlinePlugin } from '../plugins/productivity/document-outline';
import { showPlaceholderInsertPanel } from '../plugins/advanced/placeholder';

function toggleSourceView(editor: AureliaEditor, internalEditor: any, btn: HTMLElement) {
    const canvas = document.getElementById('editor-canvas') as HTMLElement;
    const sourceArea = document.getElementById('source-editor') as HTMLTextAreaElement;
    const toolbar = document.getElementById('toolbar') as HTMLElement;

    if (!canvas || !sourceArea) return;

    const isSourceMode = canvas.style.display === 'none';

    if (!isSourceMode) {
        // Switch to Source
        const html = SourceViewPlugin.getHtml(editor);
        sourceArea.value = html;

        canvas.style.display = 'none';
        sourceArea.style.display = 'block';
        sourceArea.focus();

        btn.classList.add('active');
        btn.innerHTML = `${ICONS.CHECK} Apply`;
        btn.style.width = 'auto'; // Allow width to expand for text
        btn.style.padding = '0 8px';
        toolbar.classList.add('source-mode-active');

        // Disable other toolbar buttons
        toolbar.querySelectorAll('button:not([data-item-id="source-view"])').forEach(child => {
            (child as HTMLButtonElement).disabled = true;
        });
        toolbar.querySelectorAll('select').forEach(child => {
            (child as HTMLSelectElement).disabled = true;
        });
    } else {
        // Switch back to Visual
        try {
            SourceViewPlugin.setHtml(editor, sourceArea.value);

            canvas.style.display = 'block';
            sourceArea.style.display = 'none';

            btn.classList.remove('active');
            btn.innerHTML = ICONS.SOURCE; // Revert to icon
            btn.style.width = ''; // Reset width
            btn.style.padding = ''; // Reset padding
            toolbar.classList.remove('source-mode-active');

            // Re-enable toolbar
            toolbar.querySelectorAll('button').forEach(child => {
                (child as HTMLButtonElement).disabled = false;
            });
            toolbar.querySelectorAll('select').forEach(child => {
                (child as HTMLSelectElement).disabled = false;
            });

            internalEditor.focus();
        } catch (error) {
            console.error("HTML Source Apply Error:", error);
            DialogSystem.alert("Failed to apply HTML changes. Please check for invalid tags.", "Format Error");
        }
    }
}

function toggleZenMode(btn: HTMLElement) {
    const app = document.getElementById('app');
    if (!app) return;

    app.classList.toggle('zen-mode');
    btn.classList.toggle('active');

    if (app.classList.contains('zen-mode')) {
        // Hide sidebar or other distractions if they existed
        document.body.style.overflow = 'hidden'; // Lock body scroll
    } else {
        document.body.style.overflow = '';
    }
}

// Use string literals for commands that might be missing exports or dynamic
const OPEN_FIND_REPLACE = 'OPEN_FIND_REPLACE';
const OPEN_EMOJI_PICKER = 'OPEN_EMOJI_PICKER';

/**
 * centralized delegation for all toolbar actions.
 * This replaces individual event listeners on static IDs.
 */
export function setupToolbarDelegation(editor: AureliaEditor, internalEditor: any) {
    const toolbar = document.getElementById('toolbar');
    if (!toolbar) return;

    // Remove existing listener to prevent duplicates if called multiple times
    const newToolbar = toolbar.cloneNode(true);
    if (toolbar.parentNode) {
        toolbar.parentNode.replaceChild(newToolbar, toolbar);
    }

    // We need to re-fetch the toolbar reference after replacement
    const activeToolbar = document.getElementById('toolbar');
    if (!activeToolbar) return;

    // Attach single click listener
    activeToolbar.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const button = target.closest('button.toolbar-btn, button.dropdown-item') as HTMLElement;

        if (!button) return;

        // Handle Dropdown Toggles
        if (button.classList.contains('dropdown-toggle')) {
            e.stopPropagation();
            const dropdown = button.parentElement;
            dropdown?.classList.toggle('active');

            // Close other dropdowns
            document.querySelectorAll('.toolbar-dropdown.active').forEach(d => {
                if (d !== dropdown) d.classList.remove('active');
            });
            return;
        }

        const itemId = button.dataset.itemId;
        const command = button.dataset.command; // For dropdown items
        const payload = button.dataset.payload;

        // 1. Handle Item ID Actions (Direct Buttons)
        if (itemId) {
            handleToolbarAction(itemId, button, editor, internalEditor);
        }

        // 2. Handle Command Actions (Dropdown Items)
        if (command) {
            handleCommandAction(command, payload, button, editor, internalEditor);
        }

        // Close dropdowns after selection (unless it's a toggle that stays open? No, close for now)
        if (button.classList.contains('dropdown-item')) {
            button.closest('.toolbar-dropdown')?.classList.remove('active');
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!(e.target as HTMLElement).closest('.toolbar-dropdown')) {
            document.querySelectorAll('.toolbar-dropdown.active').forEach(d => {
                d.classList.remove('active');
            });
        }
    });

    // Setup Double Click for Format Painter (Lock Mode)
    activeToolbar.addEventListener('dblclick', (e) => {
        const target = e.target as HTMLElement;
        const button = target.closest('button.toolbar-btn') as HTMLElement;
        if (button && button.dataset.itemId === 'format-painter') {
            FormatPainter.copyFormat(internalEditor, true);
        }
    });
}


function handleToolbarAction(itemId: string, button: HTMLElement, editor: AureliaEditor, internalEditor: any) {
    switch (itemId) {
        // --- TEXT FORMATTING ---
        case 'bold': internalEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold'); break;
        case 'italic': internalEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic'); break;
        case 'underline': internalEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline'); break;
        case 'strikethrough': internalEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough'); break;
        case 'code': internalEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code'); break;
        case 'subscript': internalEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript'); break;
        case 'superscript': internalEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript'); break;

        // --- HISTORY ---
        case 'undo': internalEditor.dispatchCommand(UNDO_COMMAND, undefined); break;
        case 'redo': internalEditor.dispatchCommand(REDO_COMMAND, undefined); break;

        // --- LISTS ---
        case 'bullet-list': internalEditor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined); break;
        case 'numbered-list': internalEditor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined); break;

        // --- ALIGNMENT ---
        case 'align-left': internalEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left'); break;
        case 'align-center': internalEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center'); break;
        case 'align-right': internalEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right'); break;
        case 'align-justify': internalEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify'); break;

        // --- MEDIA ---
        case 'insert-image': insertImage(); break; // Global function
        case 'insert-link': internalEditor.dispatchCommand(SHOW_LINK_POPOVER_COMMAND, undefined); break;
        case 'insert-video': MediaEmbedPlugin.insertYouTube(editor); break;
        case 'insert-html-snippet': MediaEmbedPlugin.insertHTMLSnippet(editor); break;

        // --- EXPORT/IMPORT ---
        case 'export-pdf': ExportPDF.exportToPdf(internalEditor); break;
        case 'export-word': ExportWord.exportToDoc(internalEditor); break;
        case 'import-word': ImportWord.triggerImport(internalEditor); break;

        // --- LAYOUT ---
        case 'blockquote': toggleBlockQuote(internalEditor); break;
        case 'code-block': internalEditor.dispatchCommand(INSERT_CODE_BLOCK_COMMAND, undefined); break;
        case 'insert-table': toggleTableGridPicker(internalEditor, button); break;
        case 'page-break': internalEditor.dispatchCommand(INSERT_PAGE_BREAK_COMMAND, undefined); break;
        case 'hr': internalEditor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined); break;

        // --- DOCUMENT ---
        case 'footnote': internalEditor.dispatchCommand(INSERT_FOOTNOTE_COMMAND, undefined); break;
        case 'toc': internalEditor.dispatchCommand(INSERT_TOC_COMMAND, undefined); break;

        // --- PRODUCTIVITY ---
        case 'find-replace': internalEditor.dispatchCommand(OPEN_FIND_REPLACE, undefined); break;
        case 'emoji': internalEditor.dispatchCommand(OPEN_EMOJI_PICKER, undefined); break;
        case 'format-painter': FormatPainter.copyFormat(internalEditor); break;
        case 'insert-placeholder': showPlaceholderInsertPanel(internalEditor); break;

        // --- VIEW ---
        case 'minimap': MinimapPlugin.toggleVisibility(); break;
        case 'outline': DocumentOutlinePlugin.toggleVisibility(); break;
        case 'zen-mode': toggleZenMode(button); break;

        // --- INDENTATION ---
        case 'indent': internalEditor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined); break;
        case 'outdent': internalEditor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined); break;

        // --- CLEAR FORMATTING ---
        case 'clear-formatting': internalEditor.dispatchCommand(REMOVE_FORMATTING_COMMAND, undefined); break;

        // --- CASE CHANGE ---
        case 'uppercase': CaseChange.toUpperCase(internalEditor); break;
        case 'lowercase': CaseChange.toLowerCase(internalEditor); break;
        case 'titlecase': CaseChange.toTitleCase(internalEditor); break;

        // --- TRACK CHANGES ---
        case 'track-changes': internalEditor.dispatchCommand(TOGGLE_TRACK_CHANGES_COMMAND, undefined); break;

        // --- UTILS ---
        case 'source-view': toggleSourceView(editor, internalEditor, button); break;

        default:
            break;
    }
}

function handleCommandAction(command: string, payload: string | undefined, _button: HTMLElement, _editor: AureliaEditor, internalEditor: any) {
    if (command === 'FORMAT_HEADING_COMMAND' && payload) {
        // "h1", "h2", "paragraph"
        const tag = payload as any;
        setBlockType(internalEditor, tag);
    }
}
