import { type LexicalEditor } from 'lexical';

export interface SlashCommand {
    label: string;
    description?: string;
    icon: string;
    execute: (editor: LexicalEditor) => void;
}

export class SlashMenuUI {
    menuElement: HTMLElement;
    items: SlashCommand[] = [];
    selectedIndex: number = 0;
    isVisible: boolean = false;
    currentQuery: string = '';

    private editor: LexicalEditor;
    private commands: SlashCommand[];

    constructor(editor: LexicalEditor, commands: SlashCommand[]) {
        this.editor = editor;
        this.commands = commands;
        this.menuElement = document.createElement('div');
        this.menuElement.className = 'slash-menu';
        document.body.appendChild(this.menuElement);
    }

    show(rect: DOMRect, query: string) {
        this.isVisible = true;
        this.currentQuery = query;
        this.selectedIndex = 0;

        // Filter commands by label or description
        const lowerQuery = query.toLowerCase();
        const filtered = this.commands.filter(cmd =>
            cmd.label.toLowerCase().includes(lowerQuery) ||
            (cmd.description && cmd.description.toLowerCase().includes(lowerQuery))
        );

        this.renderItems(filtered);

        if (filtered.length === 0) {
            this.hide();
            return;
        }

        // Position menu - improved positioning
        this.menuElement.classList.add('visible');
        
        // Calculate position with better handling
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;
        
        let top = rect.bottom + scrollY + 4;
        let left = rect.left + scrollX;
        
        // Adjust if menu would go off screen
        requestAnimationFrame(() => {
            const menuRect = this.menuElement.getBoundingClientRect();
            
            // Check right edge
            if (left + menuRect.width > scrollX + window.innerWidth - 10) {
                left = scrollX + window.innerWidth - menuRect.width - 10;
            }
            
            // Check left edge
            if (left < scrollX + 10) {
                left = scrollX + 10;
            }
            
            // Check bottom edge - if menu would go off screen, position above
            if (top + menuRect.height > scrollY + window.innerHeight - 10) {
                top = rect.top + scrollY - menuRect.height - 4;
            }
            
            // Ensure menu doesn't go above viewport
            if (top < scrollY + 10) {
                top = scrollY + 10;
            }
            
            this.menuElement.style.top = `${top}px`;
            this.menuElement.style.left = `${left}px`;
        });
    }

    hide() {
        this.isVisible = false;
        this.menuElement.classList.remove('visible');
    }

    renderItems(commands: SlashCommand[]) {
        this.menuElement.innerHTML = '';
        this.items = commands;

        commands.forEach((cmd, index) => {
            const el = document.createElement('div');
            el.className = `slash-item ${index === this.selectedIndex ? 'selected' : ''}`;
            el.innerHTML = `
                <span class="slash-item-icon">${cmd.icon}</span>
                <div class="slash-item-content">
                    <span class="slash-item-label">${cmd.label}</span>
                    ${cmd.description ? `<span class="slash-item-description">${cmd.description}</span>` : ''}
                </div>
            `;
            el.addEventListener('click', () => {
                this.executeCommand(cmd);
            });
            el.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this.updateSelection();
            });
            this.menuElement.appendChild(el);
        });
    }

    updateSelection() {
        const children = this.menuElement.children;
        for (let i = 0; i < children.length; i++) {
            if (i === this.selectedIndex) {
                children[i].classList.add('selected');
                children[i].scrollIntoView({ block: 'nearest' });
            } else {
                children[i].classList.remove('selected');
            }
        }
    }

    executeCommand(cmd: SlashCommand) {
        // We assume the caller handles deleting the slash text
        cmd.execute(this.editor);
        this.hide();
    }

    moveUp() {
        if (!this.isVisible) return;
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        this.updateSelection();
    }

    moveDown() {
        if (!this.isVisible) return;
        this.selectedIndex = Math.min(this.items.length - 1, this.selectedIndex + 1);
        this.updateSelection();
    }

    selectAction(): SlashCommand | null {
        if (!this.isVisible || this.items.length === 0) return null;
        return this.items[this.selectedIndex];
    }
}
