import {
    createCommand,
    type LexicalCommand,
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_EDITOR,
    $getRoot,
    $insertNodes,
} from 'lexical';
import {
    $createTableOfContentsNode,
    TableOfContentsNode,
    type TOCConfig,
    $scanAllHeadings
} from './toc-node';
import { EditorSDK } from '../../core/sdk';

export const INSERT_TOC_COMMAND: LexicalCommand<TOCConfig | undefined> = createCommand('INSERT_TOC_COMMAND');

export const TableOfContentsPlugin = {
    name: 'toc',
    init: (sdk: EditorSDK) => {
        if (!sdk.hasNodes([TableOfContentsNode])) {
            throw new Error('TableOfContentsPlugin: TableOfContentsNode not registered on editor');
        }

        // Command to insert the TOC node with optional configuration
        sdk.registerCommand(
            INSERT_TOC_COMMAND,
            (config?: TOCConfig) => {
                sdk.update(() => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        const root = $getRoot();
                        const headings = $scanAllHeadings(root);
                        const tocNode = $createTableOfContentsNode(headings, config || {});
                        $insertNodes([tocNode]);
                        selection.insertText('');
                    }
                });
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );

        // --- Active Section Highlight (Scroll Spy) ---
        // const scrollContainer = window; // Or editor container if specified, assuming window for now or document body
        const SCROLL_OFFSET = 100; // Offset for sticky headers, etc.

        const updateActiveSection = () => {
            sdk.update(() => { // Read state safely
                const root = $getRoot();
                const headings = $scanAllHeadings(root);
                let activeKey: string | null = null;

                // Iterate in reverse to find last heading above viewport top
                for (let i = headings.length - 1; i >= 0; i--) {
                    const key = headings[i].key;
                    const element = sdk.getElementByKey(key);
                    if (element) {
                        const rect = element.getBoundingClientRect();
                        // If element top is above a certain threshold (e.g. top 1/3 of screen)
                        if (rect.top <= SCROLL_OFFSET + 50) {
                            activeKey = key;
                            break;
                        }
                    }
                }

                // Fallback: if we are at the very top, maybe first item
                if (!activeKey && headings.length > 0) {
                    // Check if first heading is visible
                    const firstEl = sdk.getElementByKey(headings[0].key);
                    if (firstEl && firstEl.getBoundingClientRect().top > 0) {
                        activeKey = headings[0].key;
                    }
                }

                if (activeKey) {
                    // Update all TOCs in DOM
                    document.querySelectorAll('.editor-toc').forEach(toc => {
                        toc.querySelectorAll('.toc-item').forEach(item => {
                            item.classList.remove('active');
                            // Collapse if needed? Maybe no, let user control collapsing
                        });
                        const activeItem = toc.querySelector(`.toc-link[data-key="${activeKey}"]`)?.closest('.toc-item');
                        if (activeItem) {
                            activeItem.classList.add('active');
                            // Ensure parent sections are expanded? 
                            // Could implement auto-expand parents here
                        }
                    });
                }
            });
        };

        // Throttled Scroll Listener
        let scrollTimeout: any;
        window.addEventListener('scroll', () => {
            if (!scrollTimeout) {
                scrollTimeout = setTimeout(() => {
                    updateActiveSection();
                    scrollTimeout = null;
                }, 100);
            }
        });


        // --- Refresh & Settings Actions ---
        const rootElement = sdk.getRootElement();
        if (rootElement) {
            // Listen for 'toc-refresh' event bubbling up from TOC node
            rootElement.addEventListener('toc-refresh', (e) => {
                e.stopPropagation(); // Stop propagation
                // Force full update
                sdk.update(() => {
                    const root = $getRoot();
                    const headings = $scanAllHeadings(root);

                    // Update all TOC nodes
                    function updateTOCs(node: any): void {
                        if (node instanceof TableOfContentsNode) {
                            // Force refresh by setting entries again
                            node.setEntries([...headings]);
                        }
                        if ('getChildren' in node && typeof node.getChildren === 'function') {
                            node.getChildren().forEach((child: any) => updateTOCs(child));
                        }
                    }
                    const children = root.getChildren();
                    children.forEach((child: any) => updateTOCs(child));

                    sdk.announce('Table of Contents refreshed');
                });
            });

            // Listen for 'toc-settings'
            rootElement.addEventListener('toc-settings', (e) => {
                e.stopPropagation();
                // Trigger the settings modal
                const btn = document.getElementById('toc-btn');
                if (btn) btn.click(); // Reuse existing hook
            });

            // Click listener for jumping to headings
            rootElement.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const tocLink = target.closest('.toc-link') as HTMLElement;

                if (tocLink && tocLink.dataset.key) {
                    e.preventDefault();
                    e.stopPropagation();

                    sdk.update(() => {
                        const element = sdk.getElementByKey(tocLink.dataset.key!);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                            element.classList.add('toc-highlight');
                            setTimeout(() => element.classList.remove('toc-highlight'), 2000);
                            sdk.announce(`Jumped to heading: ${tocLink.textContent || 'heading'}`);
                        }
                    });
                }
            });
        }

        // --- Auto-Update Listener ---
        let updateTimeout: ReturnType<typeof setTimeout> | null = null;
        sdk.registerUpdateListener(() => {
            if (updateTimeout) clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                sdk.update(() => {
                    const root = $getRoot();
                    const headings = $scanAllHeadings(root);
                    // Recursively update
                    function findTOCNodes(node: any): void {
                        if (node instanceof TableOfContentsNode) {
                            const currentEntries = node.__entries;
                            if (JSON.stringify(currentEntries) !== JSON.stringify(headings)) {
                                node.setEntries(headings);
                            }
                        }
                        if ('getChildren' in node && typeof node.getChildren === 'function') {
                            const children = node.getChildren();
                            children.forEach((child: any) => findTOCNodes(child));
                        }
                    }
                    const children = root.getChildren();
                    children.forEach((child: any) => findTOCNodes(child));
                });
            }, 500); // 500ms debounce for typing
        });
    }
};
