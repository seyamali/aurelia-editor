import { ToolbarConfigManager } from './toolbar-config';
import { toolbarCustomizationUI } from './toolbar-customization-ui';
import ContextAwareToolbar from './context-aware-toolbar';
import type { LexicalEditor } from 'lexical';
import { AureliaEditor } from '../../core/engine';
import { setupToolbarDelegation } from '../../ui/toolbar-delegation';

// ============================================
// TOOLBAR SYSTEM INITIALIZATION
// ============================================

export class ToolbarSystem {
    private static isInitialized = false;

    /**
     * Initialize the complete toolbar system
     */
    static init(editor: AureliaEditor, internalEditor: LexicalEditor): void {
        if (this.isInitialized) return;

        // 1. Initialize customization UI
        toolbarCustomizationUI.init();

        // 2. Apply saved configuration (renders HTML)
        const config = ToolbarConfigManager.getConfig();
        ToolbarConfigManager.applyConfig(config);

        // 3. Setup Delegation (Attaches click listeners to new HTML)
        setupToolbarDelegation(editor, internalEditor);

        // 4. Initialize context-aware toolbar (Manages visibility/state)
        new ContextAwareToolbar(internalEditor);

        // 5. Setup toolbar customization button
        this.setupCustomizationButton();

        // 6. Setup responsive overflow handling
        this.setupResponsiveOverflow();

        // Listen for config changes to re-apply delegation if needed
        window.addEventListener('toolbar-config-changed', () => {
            setupToolbarDelegation(editor, internalEditor);
            // Re-setup customization buttons as they might be wiped
            this.setupCustomizationButton();
            this.setupResponsiveOverflow();
        });

        this.isInitialized = true;
        console.log('✅ Toolbar System initialized');
    }

    /**
     * Setup toolbar customization button
     */
    private static setupCustomizationButton(): void {
        const toolbar = document.getElementById('toolbar');
        if (!toolbar) return;

        // Check if button already exists
        if (document.getElementById('toolbar-customize-btn')) return;

        // Create customize button
        const btn = document.createElement('button');
        btn.id = 'toolbar-customize-btn';
        btn.className = 'toolbar-btn toolbar-customize-btn'; // specialized class
        btn.innerHTML = '⚙️';
        btn.title = 'Customize Toolbar';
        btn.setAttribute('aria-label', 'Customize Toolbar');

        // Float to right or end
        btn.style.marginLeft = 'auto';

        btn.addEventListener('click', () => {
            toolbarCustomizationUI.show();
        });

        toolbar.appendChild(btn);
    }

    /**
     * Setup responsive overflow handling
     */
    private static setupResponsiveOverflow(): void {
        const toolbar = document.getElementById('toolbar');
        if (!toolbar) return;

        if (document.querySelector('.toolbar-overflow')) return;

        // Create overflow button
        const overflowBtn = document.createElement('button');
        overflowBtn.className = 'toolbar-overflow-btn';
        overflowBtn.innerHTML = '⋯';
        overflowBtn.title = 'More Tools';
        overflowBtn.setAttribute('aria-label', 'More Tools');
        overflowBtn.setAttribute('aria-haspopup', 'true');
        overflowBtn.setAttribute('aria-expanded', 'false');

        // Create overflow menu
        const overflowMenu = document.createElement('div');
        overflowMenu.className = 'toolbar-overflow-menu';
        overflowMenu.setAttribute('role', 'menu');

        const container = document.createElement('div');
        container.className = 'toolbar-overflow';
        container.appendChild(overflowBtn);
        container.appendChild(overflowMenu);

        // Append before customize button if possible
        const customizeBtn = document.getElementById('toolbar-customize-btn');
        if (customizeBtn) {
            toolbar.insertBefore(container, customizeBtn);
        } else {
            toolbar.appendChild(container);
        }

        // Toggle menu
        overflowBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = overflowMenu.classList.toggle('show');
            overflowBtn.classList.toggle('active', isOpen);
            overflowBtn.setAttribute('aria-expanded', isOpen.toString());
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target as Node)) {
                overflowMenu.classList.remove('show');
                overflowBtn.classList.remove('active');
                overflowBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Handle window resize
        let resizeTimeout: number;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = window.setTimeout(() => {
                this.updateOverflowMenu();
            }, 250);
        });

        // Initial update
        this.updateOverflowMenu();
    }

    /**
     * Update overflow menu with hidden items
     */
    private static updateOverflowMenu(): void {
        const toolbar = document.getElementById('toolbar');
        const overflowMenu = toolbar?.querySelector('.toolbar-overflow-menu');
        if (!toolbar || !overflowMenu) return;

        // Get all toolbar buttons that are hidden due to responsive CSS
        const buttons = toolbar.querySelectorAll('.toolbar-btn[data-item-id]');
        const hiddenItems: Array<{ id: string; label: string; icon: string }> = [];

        buttons.forEach(btn => {
            const element = btn as HTMLElement;
            // Check if display is none (via CSS media queries)
            const computedStyle = window.getComputedStyle(element);

            if (computedStyle.display === 'none') {
                hiddenItems.push({
                    id: element.dataset.itemId || '',
                    label: element.title || element.getAttribute('aria-label') || element.dataset.itemId || '',
                    icon: element.innerHTML // Capture icon/text
                });
            }
        });

        // Populate overflow menu
        if (hiddenItems.length > 0) {
            overflowMenu.innerHTML = hiddenItems.map(item => `
                <button class="toolbar-overflow-item" data-item-id="${item.id}" role="menuitem">
                    <span class="icon">${item.icon}</span>
                    <span>${item.label}</span>
                </button>
            `).join('');

            // Attach click handlers via delegation! 
            // The main delegation listener on #toolbar will catch clicks inside overflow menu IF the overflow menu is a child of #toolbar.
            // Yes, container is child of toolbar.
            // BUT delegation looks for `closest('button.toolbar-btn')`.
            // Overflow items are `.toolbar-overflow-item`.
            // Update delegation to include `.toolbar-overflow-item`?
            // OR forward click here.

            overflowMenu.querySelectorAll('.toolbar-overflow-item').forEach(item => {
                item.addEventListener('click', () => {
                    const itemId = (item as HTMLElement).dataset.itemId;
                    // Dispatch directly via handleToolbarAction? 
                    // Or simulate click on the hidden button? 
                    // Simulating click on hidden button works if the listener is there.
                    // The main listener is on #toolbar.
                    // If we click hidden button, event bubbles.
                    // So yes, click hidden button.
                    const originalBtn = toolbar.querySelector(`.toolbar-btn[data-item-id="${itemId}"]`) as HTMLElement;
                    if (originalBtn) {
                        // We need to ensure the event bubbles to #toolbar
                        // Or just call the original click
                        // originalBtn.click(); // This might recursively call if not careful? No.
                        // But wait, originalBtn is display:none. Does click work? 
                        // Yes, in JS click() works.
                        // Does it bubble? Yes.
                        // Delegation listener on #toolbar should catch it.
                        // Wait, if it's display:none, it has no layout.
                        // It bubbles.
                        originalBtn.click();
                    }
                    overflowMenu.classList.remove('show');
                });
            });

            // Show overflow button
            const overflowBtn = toolbar.querySelector('.toolbar-overflow-btn') as HTMLElement;
            if (overflowBtn) {
                overflowBtn.style.display = 'flex';
            }
        } else {
            // Hide overflow button if no items
            const overflowBtn = toolbar.querySelector('.toolbar-overflow-btn') as HTMLElement;
            if (overflowBtn) {
                overflowBtn.style.display = 'none';
            }
        }
    }

    // Proxy methods
    static showCustomization(): void {
        toolbarCustomizationUI.show();
    }

    static applyPreset(presetId: string): void {
        ToolbarConfigManager.applyPreset(presetId);
    }

    static resetToDefault(): void {
        ToolbarConfigManager.resetToDefault();
    }
}

export default ToolbarSystem;
