import type { LexicalEditor } from 'lexical';
import { $getSelection, $isRangeSelection, $isNodeSelection } from 'lexical';
import { $isImageNode } from '../media/image-node';
import { $isTableNode, $isTableCellNode } from '@lexical/table';
import { $isCodeNode } from '@lexical/code';

// ============================================
// CONTEXT-AWARE TOOLBAR SYSTEM
// ============================================

export type SelectionContext = 'text' | 'image' | 'table' | 'code' | 'empty' | 'mixed';

export interface ContextualToolbarConfig {
    context: SelectionContext;
    tools: string[]; // Tool IDs to show
    position?: 'top' | 'floating' | 'inline';
}

export class ContextAwareToolbar {
    private editor: LexicalEditor;
    private currentContext: SelectionContext = 'empty';
    private floatingToolbar: HTMLElement | null = null;

    constructor(editor: LexicalEditor) {
        this.editor = editor;
        this.init();
    }

    /**
     * Initialize context-aware toolbar
     */
    private init(): void {
        this.createFloatingToolbar();
        this.attachListeners();
    }

    /**
     * Create floating toolbar element
     */
    private createFloatingToolbar(): void {
        const toolbar = document.createElement('div');
        toolbar.id = 'floating-toolbar';
        toolbar.className = 'floating-toolbar';
        toolbar.style.display = 'none';
        document.body.appendChild(toolbar);
        this.floatingToolbar = toolbar;
    }

    /**
     * Attach selection change listeners
     */
    private attachListeners(): void {
        this.editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                const selection = $getSelection();
                const context = this.detectContext(selection);

                if (context !== this.currentContext) {
                    this.currentContext = context;
                    this.updateToolbarVisibility(context);
                }

                // Update floating toolbar position
                if ($isRangeSelection(selection) && !selection.isCollapsed()) {
                    this.showFloatingToolbar(selection);
                } else {
                    this.hideFloatingToolbar();
                }
            });
        });

        // Hide on scroll
        window.addEventListener('scroll', () => {
            this.hideFloatingToolbar();
        }, true);
    }

    /**
     * Detect current selection context
     */
    private detectContext(selection: any): SelectionContext {
        if (!selection) return 'empty';

        if ($isRangeSelection(selection)) {
            if (selection.isCollapsed()) {
                return 'empty';
            }

            // Check if selection contains specific node types
            const nodes = selection.getNodes();

            // Check for code blocks
            for (const node of nodes) {
                if ($isCodeNode(node) || node.getParent()?.getType() === 'code') {
                    return 'code';
                }
            }

            // Check for tables
            for (const node of nodes) {
                if ($isTableNode(node) || $isTableCellNode(node)) {
                    return 'table';
                }
            }

            return 'text';
        }

        if ($isNodeSelection(selection)) {
            const nodes = selection.getNodes();
            if (nodes.length === 1) {
                const node = nodes[0];

                if ($isImageNode(node)) {
                    return 'image';
                }

                if ($isTableNode(node)) {
                    return 'table';
                }

                if ($isCodeNode(node)) {
                    return 'code';
                }
            }

            return 'mixed';
        }

        return 'empty';
    }

    /**
     * Update toolbar visibility based on context
     */
    private updateToolbarVisibility(context: SelectionContext): void {
        const toolbar = document.getElementById('toolbar');
        if (!toolbar) return;

        // Get all toolbar buttons
        const buttons = toolbar.querySelectorAll('.toolbar-btn');

        buttons.forEach(btn => {
            const itemId = (btn as HTMLElement).dataset.itemId;
            if (!itemId) return;

            // Check if button should be visible in this context
            const shouldShow = this.shouldShowInContext(itemId, context);

            if (shouldShow) {
                (btn as HTMLElement).style.display = '';
                btn.removeAttribute('disabled');
            } else {
                // Don't hide, just disable for context-aware tools
                const isContextual = this.isContextualTool(itemId);
                if (isContextual) {
                    btn.setAttribute('disabled', 'true');
                    (btn as HTMLElement).style.opacity = '0.4';
                } else {
                    (btn as HTMLElement).style.opacity = '1';
                    btn.removeAttribute('disabled');
                }
            }
        });
    }

    /**
     * Check if tool should show in context
     */
    private shouldShowInContext(toolId: string, context: SelectionContext): boolean {
        const contextualTools: Record<SelectionContext, string[]> = {
            'text': [
                'bold', 'italic', 'underline', 'strikethrough', 'code',
                'insert-link', 'heading-dropdown', 'align-left', 'align-center', 'align-right',
            ],
            'image': [
                'align-left', 'align-center', 'align-right',
            ],
            'table': [
                'align-left', 'align-center', 'align-right',
                'table-row-above', 'table-row-below',
                'table-col-left', 'table-col-right',
                'table-merge', 'table-split', 'table-delete'
            ],
            'code': [
                // Code blocks have minimal formatting
            ],
            'empty': [],
            'mixed': [],
        };

        const allowedTools = contextualTools[context] || [];
        return allowedTools.includes(toolId) || !this.isContextualTool(toolId);
    }

    /**
     * Check if tool is contextual (requires specific selection)
     */
    private isContextualTool(toolId: string): boolean {
        const contextualTools = [
            'bold', 'italic', 'underline', 'strikethrough', 'code',
            'insert-link', 'align-left', 'align-center', 'align-right',
            'table-row-above', 'table-row-below',
            'table-col-left', 'table-col-right',
            'table-merge', 'table-split', 'table-delete'
        ];
        return contextualTools.includes(toolId);
    }

    /**
     * Show floating toolbar
     */
    private showFloatingToolbar(_selection: any): void {
        if (!this.floatingToolbar) return;

        const nativeSelection = window.getSelection();
        if (!nativeSelection || nativeSelection.rangeCount === 0) return;

        const range = nativeSelection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Position above selection
        const top = rect.top + window.scrollY - 50;
        const left = rect.left + window.scrollX + rect.width / 2;

        this.floatingToolbar.style.top = `${top}px`;
        this.floatingToolbar.style.left = `${left}px`;
        this.floatingToolbar.style.transform = 'translateX(-50%)';
        this.floatingToolbar.style.display = 'flex';

        // Populate with context-appropriate tools
        this.populateFloatingToolbar(this.currentContext);
    }

    /**
     * Hide floating toolbar
     */
    private hideFloatingToolbar(): void {
        if (this.floatingToolbar) {
            this.floatingToolbar.style.display = 'none';
        }
    }

    /**
     * Populate floating toolbar with tools
     */
    private populateFloatingToolbar(context: SelectionContext): void {
        if (!this.floatingToolbar) return;

        const tools: Record<SelectionContext, string[]> = {
            'text': ['bold', 'italic', 'underline', 'insert-link'],
            'image': ['align-left', 'align-center', 'align-right'],
            'table': [],
            'code': [],
            'empty': [],
            'mixed': [],
        };

        const toolIds = tools[context] || [];
        this.floatingToolbar.innerHTML = toolIds.map(id => {
            return `<button class="floating-toolbar-btn" data-tool-id="${id}">${this.getToolIcon(id)}</button>`;
        }).join('');

        // Attach click handlers
        this.floatingToolbar.querySelectorAll('.floating-toolbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const toolId = (e.currentTarget as HTMLElement).dataset.toolId;
                if (toolId) {
                    this.executeToolCommand(toolId);
                }
            });
        });
    }

    /**
     * Get tool icon
     */
    private getToolIcon(toolId: string): string {
        const icons: Record<string, string> = {
            'bold': '𝐁',
            'italic': '𝐼',
            'underline': 'U̲',
            'insert-link': '🔗',
            'align-left': '⫷',
            'align-center': '≡',
            'align-right': '⫸',
        };
        return icons[toolId] || '•';
    }

    /**
     * Execute tool command
     */
    private executeToolCommand(toolId: string): void {
        // Trigger the corresponding toolbar button
        const mainToolbar = document.getElementById('toolbar');
        if (!mainToolbar) return;

        const btn = mainToolbar.querySelector(`[data-item-id="${toolId}"]`) as HTMLElement;
        if (btn) {
            btn.click();
        }
    }

    /**
     * Get current context
     */
    getCurrentContext(): SelectionContext {
        return this.currentContext;
    }
}

export default ContextAwareToolbar;
