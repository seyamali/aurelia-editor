import {
    DecoratorNode,
    type EditorConfig,
    type LexicalNode,
    type NodeKey,
    type SerializedLexicalNode,
    type Spread,
} from 'lexical';

export type SerializedPlaceholderNode = Spread<
    {
        name: string;
    },
    SerializedLexicalNode
>;

export class PlaceholderNode extends DecoratorNode<HTMLElement> {
    __name: string;

    static getType(): string {
        return 'placeholder';
    }

    static clone(node: PlaceholderNode): PlaceholderNode {
        return new PlaceholderNode(node.__name, node.__key);
    }

    static importJSON(serializedNode: SerializedPlaceholderNode): PlaceholderNode {
        return new PlaceholderNode(serializedNode.name);
    }

    constructor(name: string, key?: NodeKey) {
        super(key);
        this.__name = name;
    }

    exportJSON(): SerializedPlaceholderNode {
        return {
            name: this.__name,
            type: 'placeholder',
            version: 1,
        };
    }


    createDOM(config: EditorConfig): HTMLElement {
        const span = document.createElement('span');
        span.className = 'editor-placeholder-field';
        span.setAttribute('data-placeholder-name', this.__name);
        span.innerText = `{{${this.__name}}}`;
        span.setAttribute('contenteditable', 'false');
        span.setAttribute('tabindex', '0');
        span.setAttribute('role', 'button');
        span.setAttribute('aria-label', `Merge field: ${this.__name}`);
        
        // Get metadata for tooltip
        const metadata = this.getPlaceholderMetadata(this.__name);
        span.title = metadata.tooltip;
        span.setAttribute('data-placeholder-type', metadata.type);
        span.setAttribute('data-placeholder-description', metadata.description);
        
        // Enhanced styling with light gray background and rounded borders
        span.style.background = '#f3f4f6';
        span.style.borderRadius = '6px';
        span.style.border = '1px dashed #cbd5e1';
        span.style.padding = '2px 8px';
        span.style.margin = '0 2px';
        span.style.cursor = 'pointer';
        span.style.userSelect = 'none';
        span.style.display = 'inline-block';
        span.style.fontSize = '0.9em';
        span.style.fontWeight = '500';
        span.style.color = '#374151';
        span.style.transition = 'all 0.2s ease';
        
        // Hover effect for tooltip
        span.addEventListener('mouseenter', () => {
            span.style.background = '#e5e7eb';
            span.style.borderColor = '#9ca3af';
            this.showTooltip(span, metadata);
        });
        
        span.addEventListener('mouseleave', () => {
            span.style.background = '#f3f4f6';
            span.style.borderColor = '#cbd5e1';
            this.hideTooltip();
        });
        
        // Keyboard navigation: Lexical handles arrow key navigation for DecoratorNodes automatically
        // Placeholders are non-editable, so arrow keys will naturally skip over them
        // We just need to ensure the placeholder is focusable for accessibility
        
        return span;
    }
    
    private getPlaceholderMetadata(name: string): { type: string; description: string; tooltip: string } {
        // Define metadata for known placeholders
        // This should match MERGE_FIELDS in placeholder.ts
        const metadataMap: Record<string, { type: string; description: string }> = {
            'FirstName': { type: 'User', description: "The user's first name" },
            'LastName': { type: 'User', description: "The user's last name" },
            'Company': { type: 'Organization', description: 'The company name' },
            'Date': { type: 'System', description: 'Current date' },
        };
        
        const meta = metadataMap[name] || { type: 'Custom', description: 'Custom merge field' };
        return {
            ...meta,
            tooltip: `${meta.type}: ${meta.description} ({{${name}}})`
        };
    }
    
    private tooltipElement: HTMLElement | null = null;
    
    private showTooltip(element: HTMLElement, metadata: { type: string; description: string; tooltip: string }) {
        this.hideTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'placeholder-tooltip-popup';
        tooltip.innerHTML = `
            <div class="placeholder-tooltip-header">
                <span class="placeholder-tooltip-name">{{${this.__name}}}</span>
                <span class="placeholder-tooltip-type">${metadata.type}</span>
            </div>
            <div class="placeholder-tooltip-description">${metadata.description}</div>
        `;
        document.body.appendChild(tooltip);
        this.tooltipElement = tooltip;
        
        // Position tooltip after it's rendered
        requestAnimationFrame(() => {
            const rect = element.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            const scrollY = window.scrollY || window.pageYOffset;
            const scrollX = window.scrollX || window.pageXOffset;
            
            // Position above the element, centered
            let top = rect.top + scrollY - tooltipRect.height - 8;
            let left = rect.left + scrollX + rect.width / 2 - tooltipRect.width / 2;
            
            // Adjust if tooltip would go off screen
            if (left < scrollX + 10) {
                left = scrollX + 10;
            }
            if (left + tooltipRect.width > scrollX + window.innerWidth - 10) {
                left = scrollX + window.innerWidth - tooltipRect.width - 10;
            }
            
            // If tooltip would go above viewport, position below instead
            if (top < scrollY + 10) {
                top = rect.bottom + scrollY + 8;
            }
            
            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
        });
    }
    
    private hideTooltip() {
        if (this.tooltipElement) {
            this.tooltipElement.remove();
            this.tooltipElement = null;
        }
    }

    updateDOM(prevNode: PlaceholderNode, dom: HTMLElement): boolean {
        if (prevNode.__name !== this.__name) {
            dom.innerText = `{{${this.__name}}}`;
            dom.setAttribute('data-placeholder-name', this.__name);
            const metadata = this.getPlaceholderMetadata(this.__name);
            dom.title = metadata.tooltip;
            dom.setAttribute('aria-label', `Merge field: ${this.__name}`);
            dom.setAttribute('data-placeholder-type', metadata.type);
            dom.setAttribute('data-placeholder-description', metadata.description);
        }
        return false;
    }

    decorate(): HTMLElement {
        // Use createDOM for consistency
        return this.createDOM({});
    }

    getTextContent(): string {
        return `{{${this.__name}}}`;
    }
}

export function $createPlaceholderNode(name: string): PlaceholderNode {
    return new PlaceholderNode(name);
}

export function $isPlaceholderNode(node: LexicalNode | null | undefined): node is PlaceholderNode {
    return node instanceof PlaceholderNode;
}
