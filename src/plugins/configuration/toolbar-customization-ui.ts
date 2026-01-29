import { ToolbarConfigManager, TOOLBAR_PRESETS, TOOLBAR_ITEMS, type ToolbarItem } from './toolbar-config';

// ============================================
// TOOLBAR CUSTOMIZATION UI
// ============================================

export class ToolbarCustomizationUI {
    private modal: HTMLElement | null = null;
    private draggedItem: HTMLElement | null = null;

    /**
     * Initialize the customization UI
     */
    init(): void {
        this.createModal();
        this.attachEventListeners();
    }

    /**
     * Create the customization modal
     */
    private createModal(): void {
        const modal = document.createElement('div');
        modal.id = 'toolbar-customization-modal';
        modal.className = 'modal-overlay';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-container toolbar-customization-container">
                <div class="modal-header">
                    <h2>Customize Toolbar</h2>
                    <button class="modal-close" id="close-toolbar-custom-modal">×</button>
                </div>

                <div class="modal-body">
                    <!-- Preset Selection -->
                    <div class="customization-section">
                        <h3>Quick Presets</h3>
                        <div class="preset-buttons">
                            ${Object.values(TOOLBAR_PRESETS).map(preset => `
                                <button class="preset-btn" data-preset="${preset.id}">
                                    <strong>${preset.name}</strong>
                                    <span>${preset.description}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="customization-divider"></div>

                    <!-- Manual Customization -->
                    <div class="customization-section">
                        <h3>Manual Customization</h3>
                        <p class="help-text">Drag and drop to reorder. Click to toggle visibility.</p>

                        <div class="customization-panels">
                            <!-- Active Tools -->
                            <div class="panel active-tools-panel">
                                <h4>Active Tools</h4>
                                <div id="active-tools-list" class="tools-list droppable">
                                    <!-- Populated dynamically -->
                                </div>
                            </div>

                            <!-- Available Tools -->
                            <div class="panel available-tools-panel">
                                <h4>Available Tools</h4>
                                <div class="tools-filter">
                                    <input type="text" id="tools-search" placeholder="Search tools..." />
                                </div>
                                <div class="tools-groups">
                                    <div class="tool-group">
                                        <h5>Text Formatting</h5>
                                        <div id="group-text-formatting" class="tools-list">
                                            <!-- Populated dynamically -->
                                        </div>
                                    </div>
                                    <div class="tool-group">
                                        <h5>Media & Insert</h5>
                                        <div id="group-media" class="tools-list">
                                            <!-- Populated dynamically -->
                                        </div>
                                    </div>
                                    <div class="tool-group">
                                        <h5>Layout</h5>
                                        <div id="group-layout" class="tools-list">
                                            <!-- Populated dynamically -->
                                        </div>
                                    </div>
                                    <div class="tool-group">
                                        <h5>Document</h5>
                                        <div id="group-document" class="tools-list">
                                            <!-- Populated dynamically -->
                                        </div>
                                    </div>
                                    <div class="tool-group">
                                        <h5>Productivity</h5>
                                        <div id="group-productivity" class="tools-list">
                                            <!-- Populated dynamically -->
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn-secondary" id="reset-toolbar-btn">Reset to Default</button>
                    <button class="btn-primary" id="save-toolbar-btn">Save Configuration</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;
    }

    /**
     * Attach event listeners
     */
    private attachEventListeners(): void {
        if (!this.modal) return;

        // Close modal
        this.modal.querySelector('#close-toolbar-custom-modal')?.addEventListener('click', () => {
            this.hide();
        });

        // Preset buttons
        this.modal.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const presetId = (e.currentTarget as HTMLElement).dataset.preset;
                if (presetId) {
                    this.applyPreset(presetId);
                }
            });
        });

        // Save button
        this.modal.querySelector('#save-toolbar-btn')?.addEventListener('click', () => {
            this.saveConfiguration();
        });

        // Reset button
        this.modal.querySelector('#reset-toolbar-btn')?.addEventListener('click', () => {
            if (confirm('Reset toolbar to default configuration?')) {
                ToolbarConfigManager.resetToDefault();
                this.refreshUI();
            }
        });

        // Search filter
        this.modal.querySelector('#tools-search')?.addEventListener('input', (e) => {
            const query = (e.target as HTMLInputElement).value.toLowerCase();
            this.filterTools(query);
        });

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });
    }

    /**
     * Show the customization modal
     */
    show(): void {
        if (!this.modal) return;
        this.refreshUI();
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Hide the customization modal
     */
    hide(): void {
        if (!this.modal) return;
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    /**
     * Refresh the UI with current configuration
     */
    private refreshUI(): void {
        this.populateActiveTools();
        this.populateAvailableTools();
        this.initializeDragAndDrop();
        this.updatePresetHighlight();
    }

    /**
     * Update active preset button highlighting
     */
    private updatePresetHighlight(): void {
        const config = ToolbarConfigManager.getConfig();
        const activePresetId = config.customItems && config.customItems.length > 0 ? null : (config.preset || 'standard');

        this.modal?.querySelectorAll('.preset-btn').forEach(btn => {
            const buttonPresetId = (btn as HTMLElement).dataset.preset;
            if (activePresetId === buttonPresetId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * Populate active tools list
     */
    private populateActiveTools(): void {
        const activeList = this.modal?.querySelector('#active-tools-list');
        if (!activeList) return;

        const activeItems = ToolbarConfigManager.getActiveItems();
        activeList.innerHTML = '';

        activeItems.forEach(itemId => {
            const item = TOOLBAR_ITEMS[itemId];
            if (!item || item.type === 'separator') return;

            const element = this.createToolItem(item, true);
            activeList.appendChild(element);
        });
    }

    /**
     * Populate available tools by group
     */
    private populateAvailableTools(): void {
        const activeItems = ToolbarConfigManager.getActiveItems();
        const allItems = ToolbarConfigManager.getAvailableItems();

        // Group items
        const groups: Record<string, ToolbarItem[]> = {
            'text-formatting': [],
            'media': [],
            'layout': [],
            'document': [],
            'productivity': [],
        };

        allItems.forEach(item => {
            if (activeItems.includes(item.id)) return; // Skip active items
            const group = item.group || 'productivity';

            // Map legacy or varied group names to supported containers
            let targetGroup = group;
            if (group === 'formatting' || group === 'alignment') targetGroup = 'text-formatting';
            if (group === 'lists') targetGroup = 'layout';
            if (group === 'indent') targetGroup = 'layout';
            if (group === 'history') targetGroup = 'productivity';
            if (group === 'utils') targetGroup = 'productivity';

            if (groups[targetGroup]) {
                groups[targetGroup].push(item);
            } else {
                // Fallback for any unknown groups
                groups['productivity'].push(item);
            }
        });

        // Populate each group
        Object.entries(groups).forEach(([groupId, items]) => {
            const groupContainer = this.modal?.querySelector(`#group-${groupId}`);
            if (!groupContainer) return;

            groupContainer.innerHTML = '';

            // Sort items alphabetically by label (A-Z)
            const sortedItems = [...items].sort((a, b) => {
                const labelA = (a.label || a.id).toLowerCase();
                const labelB = (b.label || b.id).toLowerCase();
                return labelA.localeCompare(labelB);
            });

            sortedItems.forEach(item => {
                const element = this.createToolItem(item, false);
                groupContainer.appendChild(element);
            });
        });
    }

    /**
     * Create a tool item element
     */
    private createToolItem(item: ToolbarItem, isActive: boolean): HTMLElement {
        const div = document.createElement('div');
        div.className = `tool-item ${isActive ? 'active' : 'available'}`;
        div.draggable = true;
        div.dataset.itemId = item.id;
        div.innerHTML = `
            <span class="tool-icon">${item.icon || '•'}</span>
            <span class="tool-label">${item.label || item.id}</span>
            ${isActive ? '<span class="tool-remove">×</span>' : '<span class="tool-add">+</span>'}
        `;

        // Click to toggle
        div.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).classList.contains('tool-remove')) {
                this.removeFromActive(item.id);
            } else if ((e.target as HTMLElement).classList.contains('tool-add')) {
                this.addToActive(item.id);
            }
        });

        return div;
    }

    /**
     * Initialize drag and drop
     */
    private initializeDragAndDrop(): void {
        const activeList = this.modal?.querySelector('#active-tools-list');
        if (!activeList) return;

        // Drag start
        activeList.addEventListener('dragstart', (e) => {
            this.draggedItem = e.target as HTMLElement;
            this.draggedItem.classList.add('dragging');
        });

        // Drag end
        activeList.addEventListener('dragend', (e) => {
            (e.target as HTMLElement).classList.remove('dragging');
            this.draggedItem = null;
        });

        // Drag over
        activeList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dragEvent = e as DragEvent;
            const afterElement = this.getDragAfterElement(activeList as HTMLElement, dragEvent.clientY);
            if (this.draggedItem) {
                if (afterElement == null) {
                    activeList.appendChild(this.draggedItem);
                } else {
                    activeList.insertBefore(this.draggedItem, afterElement);
                }
            }
        });
    }

    /**
     * Get element after drag position
     */
    private getDragAfterElement(container: HTMLElement, y: number): HTMLElement | null {
        const draggableElements = [...container.querySelectorAll('.tool-item:not(.dragging)')] as HTMLElement[];

        return draggableElements.reduce<{ offset: number; element: HTMLElement | null }>(
            (closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;

                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            },
            { offset: Number.NEGATIVE_INFINITY, element: null }
        ).element;
    }

    /**
     * Add item to active tools
     */
    private addToActive(itemId: string): void {
        const activeList = this.modal?.querySelector('#active-tools-list');
        if (!activeList) return;

        const item = TOOLBAR_ITEMS[itemId];
        if (!item) return;

        const element = this.createToolItem(item, true);
        activeList.appendChild(element);

        this.populateAvailableTools();
    }

    /**
     * Remove item from active tools
     */
    private removeFromActive(itemId: string): void {
        const activeList = this.modal?.querySelector('#active-tools-list');
        if (!activeList) return;

        const element = activeList.querySelector(`[data-item-id="${itemId}"]`);
        if (element) {
            element.remove();
        }

        this.populateAvailableTools();
    }

    /**
     * Apply a preset
     */
    private applyPreset(presetId: string): void {
        ToolbarConfigManager.applyPreset(presetId);
        this.refreshUI();
    }

    /**
     * Save current configuration
     */
    private saveConfiguration(): void {
        const activeList = this.modal?.querySelector('#active-tools-list');
        if (!activeList) return;

        const items = [...activeList.querySelectorAll('.tool-item')].map(
            el => (el as HTMLElement).dataset.itemId || ''
        ).filter(id => id);

        ToolbarConfigManager.saveConfig({
            customItems: items,
            overflow: true,
            responsive: true,
        });

        this.hide();
    }

    /**
     * Filter tools by search query
     */
    private filterTools(query: string): void {
        const toolGroups = this.modal?.querySelectorAll('.tool-group');
        if (!toolGroups) return;

        toolGroups.forEach(group => {
            const items = group.querySelectorAll('.tool-item');
            let visibleCount = 0;

            items.forEach(item => {
                const label = item.querySelector('.tool-label')?.textContent?.toLowerCase() || '';
                if (label.includes(query)) {
                    (item as HTMLElement).style.display = '';
                    visibleCount++;
                } else {
                    (item as HTMLElement).style.display = 'none';
                }
            });

            // Hide group if no visible items
            (group as HTMLElement).style.display = visibleCount > 0 ? '' : 'none';
        });
    }
}

// Singleton instance
export const toolbarCustomizationUI = new ToolbarCustomizationUI();
