import { ICONS } from '../../ui/icons';

// ============================================
// TOOLBAR CONFIGURATION SYSTEM
// ============================================

export type ToolbarItemType = 'button' | 'dropdown' | 'separator' | 'select' | 'custom';

export interface ToolbarItem {
    id: string;
    type: ToolbarItemType;
    label?: string;
    icon?: string;
    tooltip?: string;
    command?: string;
    commandPayload?: string;
    group?: string;
    contextual?: boolean;
    requiredSelection?: 'text' | 'image' | 'table' | 'code' | 'any';
    children?: ToolbarItem[];
    enabled?: boolean;
    visible?: boolean;
    order?: number;
}

export interface ToolbarGroup {
    id: string;
    items: ToolbarItem[];
}

export interface ToolbarPreset {
    id: string;
    name: string;
    description: string;
    items: string[]; // List of item IDs
}

export interface ToolbarConfig {
    preset?: string;
    customItems?: string[]; // Overrides preset if exists
    hiddenItems?: string[];
    groups?: ToolbarGroup[];
    overflow?: boolean;
    responsive?: boolean;
}

// ============================================
// TOOLBAR ITEM REGISTRY
// ============================================

export const TOOLBAR_ITEMS: Record<string, ToolbarItem> = {
    // --- TEXT FORMATTING ---
    'bold': { id: 'bold', type: 'button', label: 'Bold', icon: ICONS.BOLD, tooltip: 'Bold (Ctrl+B)', command: 'FORMAT_TEXT_COMMAND', commandPayload: 'bold', group: 'formatting', requiredSelection: 'text' },
    'italic': { id: 'italic', type: 'button', label: 'Italic', icon: ICONS.ITALIC, tooltip: 'Italic (Ctrl+I)', command: 'FORMAT_TEXT_COMMAND', commandPayload: 'italic', group: 'formatting', requiredSelection: 'text' },
    'underline': { id: 'underline', type: 'button', label: 'Underline', icon: ICONS.UNDERLINE, tooltip: 'Underline (Ctrl+U)', command: 'FORMAT_TEXT_COMMAND', commandPayload: 'underline', group: 'formatting', requiredSelection: 'text' },
    'strikethrough': { id: 'strikethrough', type: 'button', label: 'Strikethrough', icon: ICONS.STRIKETHROUGH, tooltip: 'Strikethrough', command: 'FORMAT_TEXT_COMMAND', commandPayload: 'strikethrough', group: 'formatting', requiredSelection: 'text' },
    'code': { id: 'code', type: 'button', label: 'Code', icon: ICONS.CODE, tooltip: 'Inline Code', command: 'FORMAT_TEXT_COMMAND', commandPayload: 'code', group: 'formatting', requiredSelection: 'text' },
    'subscript': { id: 'subscript', type: 'button', label: 'Subscript', icon: ICONS.SUBSCRIPT, tooltip: 'Subscript', command: 'FORMAT_TEXT_COMMAND', commandPayload: 'subscript', group: 'formatting', requiredSelection: 'text' },
    'superscript': { id: 'superscript', type: 'button', label: 'Superscript', icon: ICONS.SUPERSCRIPT, tooltip: 'Superscript', command: 'FORMAT_TEXT_COMMAND', commandPayload: 'superscript', group: 'formatting', requiredSelection: 'text' },

    // --- ALIGNMENT ---
    'align-left': { id: 'align-left', type: 'button', label: 'Left', icon: ICONS.ALIGN_LEFT, tooltip: 'Align Left', command: 'FORMAT_ELEMENT_COMMAND', commandPayload: 'left', group: 'alignment' },
    'align-center': { id: 'align-center', type: 'button', label: 'Center', icon: ICONS.ALIGN_CENTER, tooltip: 'Align Center', command: 'FORMAT_ELEMENT_COMMAND', commandPayload: 'center', group: 'alignment' },
    'align-right': { id: 'align-right', type: 'button', label: 'Right', icon: ICONS.ALIGN_RIGHT, tooltip: 'Align Right', command: 'FORMAT_ELEMENT_COMMAND', commandPayload: 'right', group: 'alignment' },
    'align-justify': { id: 'align-justify', type: 'button', label: 'Justify', icon: ICONS.ALIGN_JUSTIFY, tooltip: 'Justify', command: 'FORMAT_ELEMENT_COMMAND', commandPayload: 'justify', group: 'alignment' },

    // --- HEADINGS & LISTS ---
    'heading-dropdown': {
        id: 'heading-dropdown',
        type: 'dropdown',
        label: 'Normal',
        icon: ICONS.HEADING,
        tooltip: 'Text Style',
        group: 'formatting',
        children: [
            { id: 'paragraph', type: 'button', label: 'Normal Text', command: 'FORMAT_HEADING_COMMAND', commandPayload: 'paragraph' },
            { id: 'h1', type: 'button', label: 'Heading 1', command: 'FORMAT_HEADING_COMMAND', commandPayload: 'h1' },
            { id: 'h2', type: 'button', label: 'Heading 2', command: 'FORMAT_HEADING_COMMAND', commandPayload: 'h2' },
            { id: 'h3', type: 'button', label: 'Heading 3', command: 'FORMAT_HEADING_COMMAND', commandPayload: 'h3' },
            { id: 'h4', type: 'button', label: 'Heading 4', command: 'FORMAT_HEADING_COMMAND', commandPayload: 'h4' },
            { id: 'h5', type: 'button', label: 'Heading 5', command: 'FORMAT_HEADING_COMMAND', commandPayload: 'h5' },
            { id: 'h6', type: 'button', label: 'Heading 6', command: 'FORMAT_HEADING_COMMAND', commandPayload: 'h6' },
        ]
    },
    'bullet-list': { id: 'bullet-list', type: 'button', label: 'Bullet List', icon: ICONS.UL, tooltip: 'Bullet List', command: 'INSERT_UNORDERED_LIST_COMMAND', group: 'lists' },
    'numbered-list': { id: 'numbered-list', type: 'button', label: 'Numbered List', icon: ICONS.OL, tooltip: 'Numbered List', command: 'INSERT_ORDERED_LIST_COMMAND', group: 'lists' },

    // --- MEDIA ---
    'insert-image': { id: 'insert-image', type: 'button', label: 'Image', icon: ICONS.IMAGE, tooltip: 'Insert Image', command: 'INSERT_IMAGE_COMMAND', group: 'media' },
    'insert-video': { id: 'insert-video', type: 'button', label: 'Video', icon: ICONS.VIDEO, tooltip: 'Insert YouTube Video', command: 'INSERT_VIDEO_COMMAND', group: 'media' },
    'insert-link': { id: 'insert-link', type: 'button', label: 'Link', icon: ICONS.LINK, tooltip: 'Insert Link', command: 'TOGGLE_LINK_COMMAND', group: 'media' },

    // --- LAYOUT & STRUCTURE ---
    'insert-table': { id: 'insert-table', type: 'button', label: 'Table', icon: ICONS.TABLE, tooltip: 'Insert Table', command: 'INSERT_TABLE_COMMAND', group: 'layout' },
    'blockquote': { id: 'blockquote', type: 'button', label: 'Quote', icon: ICONS.QUOTE, tooltip: 'Blockquote', command: 'INSERT_QUOTE_COMMAND', group: 'layout' },
    'code-block': { id: 'code-block', type: 'button', label: 'Code Block', icon: ICONS.CODE, tooltip: 'Code Block', command: 'INSERT_CODE_BLOCK_COMMAND', group: 'layout' },
    'hr': { id: 'hr', type: 'button', label: 'Divider', icon: ICONS.HR, tooltip: 'Horizontal Rule', command: 'INSERT_HORIZONTAL_RULE_COMMAND', group: 'layout' },
    'page-break': { id: 'page-break', type: 'button', label: 'Page Break', icon: ICONS.PAGE_BREAK, tooltip: 'Page Break', command: 'INSERT_PAGE_BREAK_COMMAND', group: 'layout' },

    // --- TABLE TOOLS ---
    'table-row-above': { id: 'table-row-above', type: 'button', label: 'Row +', icon: '🔼', tooltip: 'Insert Row Above', command: 'TABLE_ADD_ROW_ABOVE', group: 'table' },
    'table-row-below': { id: 'table-row-below', type: 'button', label: 'Row -', icon: '🔽', tooltip: 'Insert Row Below', command: 'TABLE_ADD_ROW_BELOW', group: 'table' },
    'table-col-left': { id: 'table-col-left', type: 'button', label: 'Col <', icon: '◀️', tooltip: 'Insert Col Left', command: 'TABLE_ADD_COL_LEFT', group: 'table' },
    'table-col-right': { id: 'table-col-right', type: 'button', label: 'Col >', icon: '▶️', tooltip: 'Insert Col Right', command: 'TABLE_ADD_COL_RIGHT', group: 'table' },
    'table-merge': { id: 'table-merge', type: 'button', label: 'Merge', icon: '🔗', tooltip: 'Merge Cells', command: 'TABLE_MERGE_CELLS', group: 'table' },
    'table-split': { id: 'table-split', type: 'button', label: 'Split', icon: '✂️', tooltip: 'Split Cell', command: 'TABLE_SPLIT_CELLS', group: 'table' },
    'table-delete': { id: 'table-delete', type: 'button', label: 'Table X', icon: '❌', tooltip: 'Delete Table', command: 'TABLE_DELETE_TABLE', group: 'table' },

    // --- DOCUMENT ---
    'footnote': { id: 'footnote', type: 'button', label: 'Footnote', icon: ICONS.FOOTNOTE, tooltip: 'Insert Footnote', command: 'INSERT_FOOTNOTE_COMMAND', group: 'document' },
    'toc': { id: 'toc', type: 'button', label: 'TOC', icon: ICONS.TOC, tooltip: 'Table of Contents', command: 'INSERT_TOC_COMMAND', group: 'document' },

    // --- PRODUCTIVITY ---
    'find-replace': { id: 'find-replace', type: 'button', label: 'Find', icon: ICONS.FIND, tooltip: 'Find & Replace', command: 'OPEN_FIND_REPLACE', group: 'productivity' },
    'emoji': { id: 'emoji', type: 'button', label: 'Emoji', icon: ICONS.EMOJI, tooltip: 'Insert Emoji', command: 'OPEN_EMOJI_PICKER', group: 'productivity' },
    'format-painter': { id: 'format-painter', type: 'button', label: 'Paint', icon: ICONS.PAINT, tooltip: 'Format Painter', command: 'FORMAT_PAINTER_COMMAND', group: 'productivity' },

    // --- INDENTATION ---
    'indent': { id: 'indent', type: 'button', label: 'Indent', icon: ICONS.INDENT, tooltip: 'Indent', command: 'INDENT_CONTENT_COMMAND', group: 'indent' },
    'outdent': { id: 'outdent', type: 'button', label: 'Outdent', icon: ICONS.OUTDENT, tooltip: 'Outdent', command: 'OUTDENT_CONTENT_COMMAND', group: 'indent' },

    // --- UTILS ---
    'clear-formatting': { id: 'clear-formatting', type: 'button', label: 'Clear', icon: ICONS.CLEAR, tooltip: 'Clear Formatting', command: 'REMOVE_FORMATTING_COMMAND', group: 'utils' },
    'source-view': { id: 'source-view', type: 'button', label: 'Source', icon: ICONS.SOURCE, tooltip: 'Edit HTML Source', command: 'TOGGLE_SOURCE_VIEW', group: 'utils' },
    'undo': { id: 'undo', type: 'button', label: 'Undo', icon: ICONS.UNDO, tooltip: 'Undo', command: 'UNDO_COMMAND', group: 'history' },
    'redo': { id: 'redo', type: 'button', label: 'Redo', icon: ICONS.REDO, tooltip: 'Redo', command: 'REDO_COMMAND', group: 'history' },

    // --- SEPARATORS ---
    'separator-1': { id: 'separator-1', type: 'separator' },
    'separator-2': { id: 'separator-2', type: 'separator' },
    'separator-3': { id: 'separator-3', type: 'separator' },
    'separator-4': { id: 'separator-4', type: 'separator' },
    'separator-5': { id: 'separator-5', type: 'separator' }
};

// ============================================
// TOOLBAR PRESETS
// ============================================

export const TOOLBAR_PRESETS: Record<string, ToolbarPreset> = {
    'minimal': {
        id: 'minimal',
        name: 'Minimal',
        description: 'Just the essentials for quick writing.',
        items: ['undo', 'redo', 'separator-1', 'bold', 'italic', 'underline', 'separator-2', 'insert-link', 'bullet-list', 'numbered-list']
    },
    'standard': {
        id: 'standard',
        name: 'Standard',
        description: 'Balanced set of tools for most use cases.',
        items: [
            'undo', 'redo', 'separator-1',
            'heading-dropdown', 'separator-2',
            'bold', 'italic', 'underline', 'strikethrough', 'separator-3',
            'bullet-list', 'numbered-list', 'separator-4',
            'insert-link', 'insert-image', 'blockquote', 'hr'
        ]
    },
    'blogging': {
        id: 'blogging',
        name: 'Blogging',
        description: 'Rich media and formatting for content creators.',
        items: [
            'heading-dropdown', 'bold', 'italic', 'separator-1',
            'insert-link', 'insert-image', 'insert-video', 'emoji', 'separator-2',
            'blockquote', 'code-block', 'bullet-list', 'separator-3',
            'undo', 'redo'
        ]
    },
    'documentation': {
        id: 'documentation',
        name: 'Documentation',
        description: 'Tools for technical writing and structured docs.',
        items: [
            'heading-dropdown', 'bold', 'code', 'separator-1',
            'insert-table', 'code-block', 'toc', 'footnote', 'separator-2',
            'insert-link', 'insert-image', 'separator-3',
            'find-replace', 'indent', 'outdent'
        ]
    },
    'full': {
        id: 'full',
        name: 'Full Features',
        description: 'All available tools in one toolbar.',
        items: Object.keys(TOOLBAR_ITEMS).filter(k => !k.startsWith('separator'))
    }
};

// ============================================
// TOOLBAR CONFIG MANAGER
// ============================================

export class ToolbarConfigManager {
    private static STORAGE_KEY = 'editor-toolbar-config';
    private static currentConfig: ToolbarConfig = {};

    /**
     * Get active configuration from storage or default
     */
    static getConfig(): ToolbarConfig {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                this.currentConfig = JSON.parse(saved);
                return this.currentConfig;
            } catch (e) {
                console.error('Failed to parse toolbar config', e);
            }
        }
        return { preset: 'minimal' };
    }

    /**
     * Save configuration
     */
    static saveConfig(config: ToolbarConfig): void {
        this.currentConfig = config;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
        this.applyConfig(config);
    }

    /**
     * Apply a specific preset
     */
    static applyPreset(presetId: string): void {
        if (!TOOLBAR_PRESETS[presetId]) {
            console.warn(`Preset ${presetId} not found`);
            return;
        }
        this.saveConfig({ preset: presetId });
    }

    /**
     * Render the toolbar based on config
     */
    static applyConfig(config: ToolbarConfig): void {
        const toolbar = document.getElementById('toolbar');
        if (!toolbar) return;

        // Clear existing toolbar
        toolbar.innerHTML = '';

        // Determine items to show
        let itemsToShow: string[] = [];

        if (config.customItems && config.customItems.length > 0) {
            itemsToShow = config.customItems;
        } else {
            const presetId = config.preset || 'standard';
            const preset = TOOLBAR_PRESETS[presetId] || TOOLBAR_PRESETS['standard'];
            itemsToShow = preset.items;
        }

        // Render items
        itemsToShow.forEach(itemId => {
            const item = TOOLBAR_ITEMS[itemId];
            if (!item) return;

            const element = this.renderToolbarItem(item);
            if (element) {
                toolbar.appendChild(element);
            }
        });

        // Trigger delegation update or layout refresh if needed
        const event = new CustomEvent('toolbar-config-changed');
        window.dispatchEvent(event);
    }

    /**
     * Reset to default configuration
     */
    static resetToDefault(): void {
        localStorage.removeItem(this.STORAGE_KEY);
        this.applyConfig({ preset: 'minimal' });
    }

    /**
     * Get all available items
     */
    static getAvailableItems(): ToolbarItem[] {
        return Object.values(TOOLBAR_ITEMS).filter(item => item.type !== 'separator');
    }

    /**
     * Get currently active items
     */
    static getActiveItems(): string[] {
        if (this.currentConfig.customItems) {
            return this.currentConfig.customItems;
        }
        const preset = TOOLBAR_PRESETS[this.currentConfig.preset || 'standard'];
        return preset ? preset.items : [];
    }

    /**
     * Render individual toolbar item
     */
    private static renderToolbarItem(item: ToolbarItem): HTMLElement | null {
        if (item.type === 'separator') {
            const separator = document.createElement('div');
            separator.className = 'toolbar-separator';
            return separator;
        }

        if (item.type === 'dropdown') {
            const container = document.createElement('div');
            container.className = 'toolbar-dropdown';
            container.innerHTML = `
                <button class="toolbar-btn dropdown-toggle" data-item-id="${item.id}">
                    ${item.icon || ''} ${item.label || ''} ▾
                </button>
                <div class="dropdown-menu">
                    ${item.children?.map(child =>
                `<button class="dropdown-item" 
                                 data-command="${child.command}" 
                                 data-payload="${child.commandPayload || ''}"
                                 data-item-id="${child.id}">
                            ${child.label}
                        </button>`
            ).join('') || ''}
                </div>
            `;
            return container;
        }

        const btn = document.createElement('button');
        btn.className = 'toolbar-btn';
        // IMPORTANT: Set ID to match legacy logic 
        // Logic files use: bold-btn, italic-btn
        btn.id = `${item.id}-btn`;
        btn.dataset.itemId = item.id;
        if (item.command) btn.dataset.command = item.command;
        if (item.commandPayload) btn.dataset.payload = item.commandPayload;

        btn.innerHTML = item.icon || item.label || item.id;
        if (item.tooltip) {
            btn.title = item.tooltip;
            btn.setAttribute('aria-label', item.tooltip);
        }

        return btn;
    }
}
