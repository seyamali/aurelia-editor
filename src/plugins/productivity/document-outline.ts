import { EditorSDK } from '../../core/sdk';
import { $getRoot, type LexicalNode } from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';

export type OutlineEntry = {
    key: string;
    text: string;
    tag: string;
    level: number;
};

export const DocumentOutlinePlugin = {
    name: 'document-outline',
    init: (sdk: EditorSDK) => {
        // --- 1. Infrastructure ---
        if (!document.getElementById('document-outline')) {
            const outline = document.createElement('div');
            outline.id = 'document-outline';
            outline.className = 'document-outline'; // Initially hidden by CSS (display: none)
            outline.innerHTML = `
                <div class="outline-header">
                    <h3>Document Outline</h3>
                </div>
                <div id="outline-content" class="outline-list"></div>
            `;
            document.body.appendChild(outline);
        }

        // --- 2. Scroll Spy Logic ---
        const updateActiveHeading = () => {
            const outlineElement = document.getElementById('document-outline');
            if (!outlineElement || outlineElement.style.display === 'none') return;

            sdk.update(() => {
                const root = $getRoot();
                const headings: { key: string; rect: DOMRect }[] = [];

                function findHeadings(node: LexicalNode) {
                    if ($isHeadingNode(node)) {
                        const el = sdk.getElementByKey(node.getKey());
                        if (el) {
                            headings.push({ key: node.getKey(), rect: el.getBoundingClientRect() });
                        }
                    }
                    if ('getChildren' in node && typeof node.getChildren === 'function') {
                        node.getChildren().forEach((child: any) => findHeadings(child));
                    }
                }

                findHeadings(root);

                let activeKey: string | null = null;
                const SCROLL_THRESHOLD = 100; // Offset from top

                // Find the last heading that is above the threshold
                for (let i = headings.length - 1; i >= 0; i--) {
                    if (headings[i].rect.top <= SCROLL_THRESHOLD) {
                        activeKey = headings[i].key;
                        break;
                    }
                }

                // Update UI
                document.querySelectorAll('.outline-item').forEach(item => {
                    if ((item as HTMLElement).dataset.key === activeKey) {
                        item.classList.add('active');
                        // Optional: item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    } else {
                        item.classList.remove('active');
                    }
                });
            });
        };

        // --- 3. Rendering Logic ---
        const renderOutline = () => {
            const container = document.getElementById('outline-content');
            if (!container) return;

            sdk.update(() => {
                const root = $getRoot();
                const entries: OutlineEntry[] = [];

                function scan(node: LexicalNode) {
                    if ($isHeadingNode(node)) {
                        const tag = node.getTag();
                        entries.push({
                            key: node.getKey(),
                            text: node.getTextContent(),
                            tag: tag,
                            level: parseInt(tag.slice(1))
                        });
                    }
                    if ('getChildren' in node && typeof node.getChildren === 'function') {
                        node.getChildren().forEach((child: any) => scan(child));
                    }
                }
                scan(root);

                if (entries.length === 0) {
                    container.innerHTML = '<div class="outline-empty">No headings found.</div>';
                    // Trigger scroll spy update anyway to clear active states
                    updateActiveHeading();
                    return;
                }

                container.innerHTML = '';
                entries.forEach((entry) => {
                    const item = document.createElement('div');
                    item.className = `outline-item outline-${entry.tag}`;
                    item.dataset.key = entry.key;
                    item.title = entry.text;
                    item.innerHTML = `
                        <span class="outline-text">${entry.text || '(Untitled)'}</span>
                    `;

                    item.onclick = () => {
                        sdk.update(() => {
                            const el = sdk.getElementByKey(entry.key);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        });
                    };

                    container.appendChild(item);
                });

                updateActiveHeading();
            });
        };

        // --- 4. Event Management ---
        let updateTimeout: any;
        sdk.registerUpdateListener(() => {
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(renderOutline, 400); // 400ms debounce
        });

        window.addEventListener('scroll', () => {
            requestAnimationFrame(updateActiveHeading);
        });

        // Initial render
        renderOutline();
    },

    toggleVisibility: () => {
        const outline = document.getElementById('document-outline');
        if (outline) {
            const isVisible = outline.classList.contains('active');
            if (isVisible) {
                outline.classList.remove('active');
                setTimeout(() => {
                    if (!outline.classList.contains('active')) outline.style.display = 'none';
                }, 300);
            } else {
                outline.style.display = 'flex';
                // Force layout for transition
                outline.offsetHeight;
                outline.classList.add('active');
            }
        }
    }
};
