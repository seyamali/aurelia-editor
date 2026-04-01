import { REDO_COMMAND, UNDO_COMMAND } from 'lexical';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import { AureliaEditor } from '../core/engine';
import { INSERT_CODE_BLOCK_COMMAND } from '../plugins/advanced/code-blocks';
import { showTemplateBlocksPanel } from '../plugins/advanced/template-blocks';
import { showPlaceholderInsertPanel } from '../plugins/advanced/placeholder';
import { promptForInlineComment } from '../plugins/collaboration/comments';
import { toggleDocumentStatsPanel } from './document-stats-ui';
import { toggleExportPresetsPanel } from './export-presets-ui';
import { toggleContentWorkspace } from './content-workspace-ui';
import { toggleTypographyPanel } from './text-style-ui';
import { toggleFindReplaceDialog } from '../plugins/productivity/find-replace-ui';
import { toggleEmojiPicker } from '../plugins/productivity/emoji-ui';
import { insertImage } from '../plugins/media/images';
import { MediaEmbedPlugin } from '../plugins/advanced/media-embed';
import { SHOW_LINK_POPOVER_COMMAND } from '../plugins/media/link-popover-ui';
import { FormatPainter } from '../plugins/productivity/format-painter';
import { REMOVE_FORMATTING_COMMAND } from '../plugins/essentials/clipboard';
import { TOGGLE_TRACK_CHANGES_COMMAND } from '../plugins/collaboration/track-changes';
import { MinimapPlugin } from '../plugins/productivity/minimap';
import { DocumentOutlinePlugin } from '../plugins/productivity/document-outline';
import { ICONS } from './icons';

type CommandPaletteAction = {
    id: string;
    label: string;
    description: string;
    shortcut?: string;
    icon: string;
    execute: (editor: AureliaEditor) => void;
};

const ACTIONS: CommandPaletteAction[] = [
    { id: 'comment', label: 'Add Comment', description: 'Annotate the current selection', shortcut: 'Ctrl/Cmd+Alt+M', icon: ICONS.COMMENT, execute: (editor) => promptForInlineComment(editor.getInternalEditor()) },
    { id: 'templates', label: 'Template Blocks', description: 'Insert reusable content blocks', shortcut: 'Ctrl/Cmd+Alt+T', icon: ICONS.TEMPLATE, execute: (editor) => showTemplateBlocksPanel(editor.getInternalEditor()) },
    { id: 'stats', label: 'Document Stats', description: 'Open document insights', shortcut: 'Ctrl/Cmd+Alt+S', icon: ICONS.STATS, execute: () => toggleDocumentStatsPanel() },
    { id: 'seo-audit', label: 'SEO Audit', description: 'Review page metadata and content readiness', shortcut: 'Ctrl/Cmd+Alt+E', icon: ICONS.SEO, execute: () => toggleContentWorkspace('seo') },
    { id: 'typography', label: 'Typography', description: 'Change font family and size', icon: ICONS.FONT, execute: () => toggleTypographyPanel() },
    { id: 'publish-workflow', label: 'Publish Workflow', description: 'Review readiness, SEO, and export options', icon: ICONS.PUBLISH, execute: () => toggleContentWorkspace('publish') },
    { id: 'export-presets', label: 'Export Presets', description: 'Choose PDF and Word export settings', icon: ICONS.DOWNLOAD, execute: () => toggleExportPresetsPanel() },
    { id: 'find', label: 'Find & Replace', description: 'Search and replace text', shortcut: 'Ctrl/Cmd+F', icon: ICONS.FIND, execute: () => toggleFindReplaceDialog() },
    { id: 'emoji', label: 'Emoji Picker', description: 'Insert an emoji', shortcut: 'Ctrl/Cmd+;', icon: ICONS.EMOJI, execute: () => toggleEmojiPicker() },
    { id: 'image', label: 'Insert Image', description: 'Add an image from upload, URL, paste, or drag-drop', icon: ICONS.IMAGE, execute: () => insertImage() },
    { id: 'video', label: 'Insert Video', description: 'Embed a YouTube video', icon: ICONS.VIDEO, execute: (editor) => MediaEmbedPlugin.insertYouTube(editor) },
    { id: 'html-snippet', label: 'Insert HTML Snippet', description: 'Insert custom HTML content', icon: ICONS.SNIPPET, execute: (editor) => MediaEmbedPlugin.insertHTMLSnippet(editor) },
    { id: 'table', label: 'Insert Table', description: 'Add a 3x3 table', icon: ICONS.TABLE, execute: (editor) => editor.getInternalEditor().dispatchCommand(INSERT_TABLE_COMMAND, { columns: '3', rows: '3' }) },
    { id: 'code-block', label: 'Code Block', description: 'Insert a formatted code block', icon: ICONS.CODE_BLOCK, execute: (editor) => editor.getInternalEditor().dispatchCommand(INSERT_CODE_BLOCK_COMMAND, null) },
    { id: 'placeholder', label: 'Insert Placeholder', description: 'Add a merge field', icon: ICONS.PLACEHOLDER, execute: (editor) => showPlaceholderInsertPanel(editor.getInternalEditor()) },
    { id: 'link', label: 'Insert Link', description: 'Open the link editor', shortcut: 'Ctrl/Cmd+K', icon: ICONS.LINK, execute: (editor) => editor.getInternalEditor().dispatchCommand(SHOW_LINK_POPOVER_COMMAND, undefined) },
    { id: 'format-painter', label: 'Format Painter', description: 'Copy formatting from the current selection', icon: ICONS.PAINT, execute: (editor) => FormatPainter.copyFormat(editor.getInternalEditor()) },
    { id: 'clear-formatting', label: 'Clear Formatting', description: 'Remove styling from the current selection', icon: ICONS.CLEAR, execute: (editor) => editor.getInternalEditor().dispatchCommand(REMOVE_FORMATTING_COMMAND, undefined) },
    { id: 'track-changes', label: 'Track Changes', description: 'Toggle tracked edits', icon: ICONS.COMMENT, execute: (editor) => editor.getInternalEditor().dispatchCommand(TOGGLE_TRACK_CHANGES_COMMAND, undefined) },
    { id: 'outline', label: 'Document Outline', description: 'Toggle the outline sidebar', icon: ICONS.OUTLINE, execute: () => DocumentOutlinePlugin.toggleVisibility() },
    { id: 'minimap', label: 'Minimap', description: 'Toggle the document minimap', icon: ICONS.MINIMAP, execute: () => MinimapPlugin.toggleVisibility() },
    { id: 'undo', label: 'Undo', description: 'Undo the last change', shortcut: 'Ctrl/Cmd+Z', icon: ICONS.UNDO, execute: (editor) => editor.getInternalEditor().dispatchCommand(UNDO_COMMAND, undefined) },
    { id: 'redo', label: 'Redo', description: 'Redo the last change', shortcut: 'Ctrl/Cmd+Shift+Z', icon: ICONS.REDO, execute: (editor) => editor.getInternalEditor().dispatchCommand(REDO_COMMAND, undefined) }
];

const RECENT_COMMANDS_KEY = 'aurelia-editor-command-palette-recent';
const RECENT_COMMANDS_LIMIT = 5;

let activeEditor: AureliaEditor | null = null;
let paletteRoot: HTMLElement | null = null;
let paletteInput: HTMLInputElement | null = null;
let paletteResults: HTMLElement | null = null;
let visible = false;
let filteredActions: CommandPaletteAction[] = [];
let selectedIndex = 0;
let listenersAttached = false;

export function setupCommandPaletteUI(editor: AureliaEditor): void {
    activeEditor = editor;
    ensurePalette();

    if (listenersAttached) {
        return;
    }

    listenersAttached = true;

    window.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            toggleCommandPalette();
            return;
        }

        if (!visible) {
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            hideCommandPalette();
            return;
        }
    }, true);
}

export function toggleCommandPalette(): void {
    if (visible) {
        hideCommandPalette();
    } else {
        showCommandPalette();
    }
}

export function showCommandPalette(): void {
    ensurePalette();
    if (!paletteRoot || !paletteInput) return;

    visible = true;
    paletteRoot.classList.remove('hidden');
    paletteRoot.setAttribute('aria-hidden', 'false');
    paletteInput.value = '';
    renderActions('');

    requestAnimationFrame(() => {
        paletteInput?.focus();
        paletteInput?.select();
    });
}

export function hideCommandPalette(): void {
    if (!paletteRoot) return;

    visible = false;
    paletteRoot.classList.add('hidden');
    paletteRoot.setAttribute('aria-hidden', 'true');
}

function ensurePalette(): void {
    if (paletteRoot) return;

    paletteRoot = document.createElement('div');
    paletteRoot.id = 'command-palette';
    paletteRoot.className = 'command-palette hidden';
    paletteRoot.setAttribute('aria-hidden', 'true');
    paletteRoot.innerHTML = `
        <div class="command-palette-backdrop" data-close="true"></div>
        <div class="command-palette-panel" role="dialog" aria-modal="true" aria-label="Command Palette">
            <div class="command-palette-header">
                <div>
                    <div class="command-palette-title">Command Palette</div>
                    <div class="command-palette-subtitle">Ctrl/Cmd+K to open, Esc to close</div>
                </div>
                <button type="button" class="command-palette-close" aria-label="Close command palette">&times;</button>
            </div>
            <div class="command-palette-search">
                <span class="command-palette-search-icon">${ICONS.SEARCH}</span>
                <input id="command-palette-input" type="text" placeholder="Type a command..." autocomplete="off" spellcheck="false" />
            </div>
            <div id="command-palette-results" class="command-palette-results" role="listbox" aria-label="Command results"></div>
        </div>
    `;

    document.body.appendChild(paletteRoot);
    paletteInput = paletteRoot.querySelector('#command-palette-input') as HTMLInputElement;
    paletteResults = paletteRoot.querySelector('#command-palette-results') as HTMLElement;

    paletteRoot.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.closest('[data-close="true"]') || target.closest('.command-palette-close')) {
            hideCommandPalette();
            return;
        }
    });

    paletteInput.addEventListener('input', () => {
        renderActions(paletteInput?.value || '');
    });

    paletteInput.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            moveSelection(1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            moveSelection(-1);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const action = filteredActions[selectedIndex];
            if (action) {
                executeAction(action);
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            hideCommandPalette();
        }
    });
}

function renderActions(query: string): void {
    const results = paletteResults;
    if (!results) return;

    const lowerQuery = query.trim().toLowerCase();
    const matchedActions = ACTIONS.filter(action => {
        if (!lowerQuery) return true;
        return (
            action.label.toLowerCase().includes(lowerQuery) ||
            action.description.toLowerCase().includes(lowerQuery) ||
            (action.shortcut || '').toLowerCase().includes(lowerQuery)
        );
    });

    const recentIds = getRecentCommandIds();
    const recentActions = lowerQuery
        ? matchedActions.filter(action => recentIds.includes(action.id))
        : recentIds.map(id => ACTIONS.find(action => action.id === id)).filter((action): action is CommandPaletteAction => !!action);
    const remainingActions = matchedActions.filter(action => !recentActions.some(recent => recent.id === action.id));

    filteredActions = [...recentActions, ...remainingActions];
    selectedIndex = 0;
    results.innerHTML = '';

    if (filteredActions.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'command-palette-empty';
        empty.textContent = 'No commands found.';
        results.appendChild(empty);
        return;
    }

    if (!lowerQuery && recentActions.length > 0) {
        const section = document.createElement('div');
        section.className = 'command-palette-section';
        section.innerHTML = '<div class="command-palette-section-label">Recent</div>';
        results.appendChild(section);
    }

    filteredActions.forEach((action, index) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = `command-palette-item${index === selectedIndex ? ' selected' : ''}`;
        item.dataset.commandId = action.id;
        item.dataset.index = String(index);
        item.innerHTML = `
            <span class="command-palette-item-icon">${action.icon}</span>
            <span class="command-palette-item-body">
                <span class="command-palette-item-top">
                    <span class="command-palette-item-label">${action.label}</span>
                    ${action.shortcut ? `<span class="command-palette-item-shortcut">${action.shortcut}</span>` : ''}
                </span>
                <span class="command-palette-item-description">${action.description}</span>
            </span>
        `;
        item.addEventListener('mouseenter', () => {
            selectedIndex = index;
            updateSelection();
        });
        item.addEventListener('click', (event) => {
            event.stopPropagation();
            executeAction(action);
        });
        results.appendChild(item);
    });
}

function moveSelection(delta: number): void {
    if (!filteredActions.length) return;

    selectedIndex = Math.max(0, Math.min(filteredActions.length - 1, selectedIndex + delta));
    updateSelection();
}

function updateSelection(): void {
    const results = paletteResults;
    if (!results) return;

    const items = Array.from(results.querySelectorAll('.command-palette-item'));
    items.forEach((child, index) => {
        if (index === selectedIndex) {
            child.classList.add('selected');
            (child as HTMLElement).scrollIntoView({ block: 'nearest' });
        } else {
            child.classList.remove('selected');
        }
    });
}

function executeAction(action: CommandPaletteAction): void {
    const editor = activeEditor;
    if (!editor) return;

    action.execute(editor);
    rememberRecentCommand(action.id);
    hideCommandPalette();
}

function getRecentCommandIds(): string[] {
    try {
        const saved = localStorage.getItem(RECENT_COMMANDS_KEY);
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : [];
    } catch {
        return [];
    }
}

function rememberRecentCommand(id: string): void {
    try {
        const recent = getRecentCommandIds().filter(item => item !== id);
        recent.unshift(id);
        localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(recent.slice(0, RECENT_COMMANDS_LIMIT)));
    } catch {
        // Ignore storage errors.
    }
}
