import {
    DecoratorNode,
    type EditorConfig,
    type LexicalNode,
    type NodeKey,
    type SerializedLexicalNode,
    type Spread,
    $getRoot,
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';

export type TOCEntry = {
    key: string;
    text: string;
    tag: string; // h1, h2, etc.
    level: number; // 1-6
};

export type TOCConfig = {
    minLevel?: number; // Minimum heading level to include (default: 1)
    maxLevel?: number; // Maximum heading level to include (default: 6)
    numbered?: boolean; // Show numbered headings (default: false)
    collapsible?: boolean; // Make sections collapsible (default: false)
    style?: 'ordered' | 'unordered' | 'nested'; // List style (default: 'nested')
    theme?: 'light' | 'dark' | 'auto'; // Theme preference (default: 'auto')
};

export type SerializedTableOfContentsNode = Spread<
    {
        entries: TOCEntry[];
        config: TOCConfig;
        type: 'toc';
        version: 2;
    },
    SerializedLexicalNode
>;

export class TableOfContentsNode extends DecoratorNode<HTMLElement> {
    __entries: TOCEntry[];
    __config: TOCConfig;

    static getType(): string {
        return 'toc';
    }

    static clone(node: TableOfContentsNode): TableOfContentsNode {
        return new TableOfContentsNode(node.__entries, node.__config, node.__key);
    }

    static importJSON(serializedNode: SerializedTableOfContentsNode): TableOfContentsNode {
        return $createTableOfContentsNode(
            serializedNode.entries || [],
            serializedNode.config || {}
        );
    }

    constructor(entries: TOCEntry[] = [], config: TOCConfig = {}, key?: NodeKey) {
        super(key);
        this.__entries = entries;
        this.__config = {
            minLevel: 1,
            maxLevel: 6,
            numbered: false,
            collapsible: false,
            style: 'nested',
            theme: 'auto',
            ...config,
        };
    }

    exportJSON(): SerializedTableOfContentsNode {
        return {
            entries: this.__entries,
            config: this.__config,
            type: 'toc',
            version: 2,
        };
    }

    createDOM(_config: EditorConfig): HTMLElement {
        const div = document.createElement('div');
        div.className = 'editor-toc';
        div.contentEditable = 'false';
        div.setAttribute('data-toc-config', JSON.stringify(this.__config));
        div.setAttribute('data-toc-theme', this.__config.theme || 'auto');
        this.renderEntries(div);
        return div;
    }

    updateDOM(prevNode: TableOfContentsNode, dom: HTMLElement): boolean {
        const entriesChanged = JSON.stringify(prevNode.__entries) !== JSON.stringify(this.__entries);
        const configChanged = JSON.stringify(prevNode.__config) !== JSON.stringify(this.__config);

        if (entriesChanged || configChanged) {
            dom.setAttribute('data-toc-config', JSON.stringify(this.__config));
            dom.setAttribute('data-toc-theme', this.__config.theme || 'auto');
            this.renderEntries(dom);
        }
        return false;
    }

    renderEntries(container: HTMLElement) {
        container.innerHTML = '';

        // 1. Header
        const header = document.createElement('div');
        header.className = 'toc-title';

        const titleGroup = document.createElement('div');
        titleGroup.className = 'toc-title-text';
        titleGroup.innerHTML = '<span>📑</span> Table of Contents';
        header.appendChild(titleGroup);

        const actionsGroup = document.createElement('div');
        actionsGroup.className = 'toc-actions';

        // Refresh Button
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'toc-action-btn';
        refreshBtn.innerHTML = '↻';
        refreshBtn.title = 'Refresh TOC';
        refreshBtn.onclick = (e) => {
            e.stopPropagation();
            // Dispatch event for plugin to handle
            container.dispatchEvent(new CustomEvent('toc-refresh', { bubbles: true }));
        };
        actionsGroup.appendChild(refreshBtn);

        // Settings Button
        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'toc-action-btn';
        settingsBtn.innerHTML = '⚙️';
        settingsBtn.title = 'TOC Settings';
        settingsBtn.onclick = (e) => {
            e.stopPropagation();
            // Dispatch event for plugin to handle
            container.dispatchEvent(new CustomEvent('toc-settings', { bubbles: true }));
        };
        actionsGroup.appendChild(settingsBtn);

        header.appendChild(actionsGroup);
        container.appendChild(header);

        // 2. Content Container
        const content = document.createElement('div');
        content.className = 'toc-content';

        // Filter entries based on config
        const filteredEntries = this.__entries.filter(entry => {
            return entry.level >= (this.__config.minLevel || 1) &&
                entry.level <= (this.__config.maxLevel || 6);
        });

        if (filteredEntries.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'toc-empty';
            empty.innerText = 'No headings found. Add headings to the document to generate the Table of Contents.';
            content.appendChild(empty);
        } else {
            const list = this.buildNestedList(filteredEntries);
            content.appendChild(list);
        }

        container.appendChild(content);
    }

    private buildNestedList(entries: TOCEntry[]): HTMLElement {
        const rootList = document.createElement(this.__config.style === 'ordered' ? 'ol' : 'ul');
        rootList.className = 'toc-list toc-root';
        if (this.__config.style === 'ordered') rootList.setAttribute('start', '1');

        let currentStack: Array<{ level: number; list: HTMLElement; item: HTMLElement | null }> = [];

        entries.forEach((entry, index) => {
            // Find appropriate parent
            while (currentStack.length > 0 && currentStack[currentStack.length - 1].level >= entry.level) {
                currentStack.pop();
            }

            let parentList: HTMLElement;
            if (currentStack.length === 0) {
                parentList = rootList;
            } else {
                const lastItem = currentStack[currentStack.length - 1].item;
                if (lastItem) {
                    // Check if nested list exists, if not create it
                    let nestedList = lastItem.querySelector('.toc-nested-list') as HTMLElement;
                    if (!nestedList) {
                        nestedList = document.createElement(this.__config.style === 'ordered' ? 'ol' : 'ul');
                        nestedList.className = 'toc-nested-list';
                        if (this.__config.style === 'ordered') nestedList.setAttribute('start', '1');
                        lastItem.appendChild(nestedList);
                    }
                    parentList = nestedList;
                } else {
                    parentList = rootList;
                }
            }

            // Create Item
            const li = document.createElement('li');
            li.className = `toc-item toc-level-${entry.level}`;

            // Create a wrapper for the content row
            const contentRow = document.createElement('div');
            contentRow.className = 'toc-item-row';

            // Collapsible Toggle
            if (this.__config.collapsible && index < entries.length - 1 && entries[index + 1].level > entry.level) {
                const toggle = document.createElement('span');
                toggle.className = 'toc-toggle';
                toggle.innerHTML = '▼';
                toggle.onclick = (e) => {
                    e.stopPropagation();
                    const collapsed = li.getAttribute('data-collapsed') === 'true';
                    li.setAttribute('data-collapsed', collapsed ? 'false' : 'true');
                    // Icon rotation handled by CSS
                };
                contentRow.appendChild(toggle);
                li.setAttribute('data-collapsed', 'false'); // Default open
            } else {
                // Spacer for alignment if needed, or just margin in CSS
            }

            // Numbering
            if (this.__config.numbered) {
                const num = document.createElement('span');
                num.className = 'toc-number';
                num.innerText = `${this.getNumberForEntry(entries, index)}. `;
                contentRow.appendChild(num);
            }

            // Link
            const link = document.createElement('a');
            link.className = 'toc-link';
            link.href = '#';
            link.innerText = entry.text || '(Untitled)';
            link.setAttribute('data-key', entry.key); // Use dataset for easier access
            link.onclick = (e) => {
                e.preventDefault();
                // Handled by plugin via event delegation or direct update
            };
            contentRow.appendChild(link);

            li.appendChild(contentRow);

            parentList.appendChild(li);

            currentStack.push({ level: entry.level, list: parentList, item: li });
        });

        return rootList;
    }

    private getNumberForEntry(entries: TOCEntry[], index: number): string {
        const entry = entries[index];
        const numbers: number[] = [];

        // Build number path based on hierarchy
        for (let i = 0; i <= index; i++) {
            const currentEntry = entries[i];
            if (currentEntry.level === entry.level) {
                // Count how many entries at this level before current
                let count = 1;
                for (let j = 0; j < i; j++) {
                    if (entries[j].level === entry.level) {
                        count++;
                    }
                }
                numbers[entry.level - 1] = count;
                break;
            }
        }

        // Fill in missing levels with 1
        for (let level = 1; level < entry.level; level++) {
            if (!numbers[level - 1]) {
                numbers[level - 1] = 1;
            }
        }

        return numbers.slice(0, entry.level).join('.');
    }

    setEntries(entries: TOCEntry[]) {
        const writable = this.getWritable();
        writable.__entries = entries;
    }

    setConfig(config: Partial<TOCConfig>) {
        const writable = this.getWritable();
        writable.__config = { ...writable.__config, ...config };
    }

    getConfig(): TOCConfig {
        return { ...this.__config };
    }

    decorate(): HTMLElement {
        const div = document.createElement('div');
        div.className = 'editor-toc';
        div.contentEditable = 'false';
        div.setAttribute('data-toc-config', JSON.stringify(this.__config));
        this.renderEntries(div);
        return div;
    }

    getTextContent(): string {
        return this.__entries.map(e => e.text).join('\n');
    }
}

export function $createTableOfContentsNode(
    entries: TOCEntry[] = [],
    config: TOCConfig = {}
): TableOfContentsNode {
    return new TableOfContentsNode(entries, config);
}

export function $isTableOfContentsNode(node: LexicalNode | null | undefined): node is TableOfContentsNode {
    return node instanceof TableOfContentsNode;
}

/**
 * Recursively scan all nodes to find headings, including those in nested structures
 */
export function $scanAllHeadings(root: ReturnType<typeof $getRoot>): TOCEntry[] {
    const headings: TOCEntry[] = [];

    function traverse(node: LexicalNode) {
        if ($isHeadingNode(node)) {
            const tag = node.getTag();
            const level = parseInt(tag.slice(1)); // h1 -> 1, h2 -> 2, etc.
            headings.push({
                key: node.getKey(),
                text: node.getTextContent(),
                tag: tag,
                level: level
            });
        }

        // Traverse children recursively
        if ('getChildren' in node && typeof node.getChildren === 'function') {
            const children = node.getChildren();
            children.forEach((child: LexicalNode) => traverse(child));
        }
    }

    const children = root.getChildren();
    children.forEach((child: LexicalNode) => traverse(child));

    return headings;
}
