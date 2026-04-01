import {
    $getRoot,
    $getSelection,
    $isRangeSelection,
    $createRangeSelection,
    $setSelection,
    TextNode,
    type LexicalEditor
} from 'lexical';

export interface SearchOptions {
    caseSensitive: boolean;
    wholeWord: boolean;
    isRegex: boolean;
}

export const FindReplace = {
    /**
     * Finds the next match relative to current cursor.
     */
    findNext: (editor: LexicalEditor, searchText: string, options: SearchOptions) => {
        FindReplace._find(editor, searchText, options, false);
    },

    /**
     * Finds the previous match (search backwards).
     */
    findPrevious: (editor: LexicalEditor, searchText: string, options: SearchOptions) => {
        FindReplace._find(editor, searchText, options, true);
    },

    /**
     * Internal search logic using Regex for flexibility
     */
    _find: (editor: LexicalEditor, searchText: string, options: SearchOptions, backwards: boolean) => {
        if (!searchText) return;

        editor.update(() => {
            const regex = createRegex(searchText, options);
            if (!regex) return; // Invalid regex

            const root = $getRoot();
            const textNodes = root.getAllTextNodes();
            const matches: { node: TextNode, index: number, length: number }[] = [];

            // 1. Gather all matches in the document order
            textNodes.forEach(node => {
                const text = node.getTextContent();
                let match;
                // We need to reset lastIndex because we reuse regex if global
                // We create a fresh regex in createRegex each time, so initial lastIndex is 0
                // For 'g' regex, exec loops through.

                while ((match = regex.exec(text)) !== null) {
                    matches.push({
                        node,
                        index: match.index,
                        length: match[0].length
                    });

                    // Prevent infinite loop for zero-length matches
                    if (match.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }
                }
            });

            if (matches.length === 0) {
                updateInfo(`No matches for "${searchText}"`);
                return;
            }

            // 2. Find closest match to current selection
            const selection = $getSelection();
            let currentIndex = -1;

            if ($isRangeSelection(selection) && selection.isCollapsed()) {
                const anchorNode = selection.anchor.getNode();
                const currentOffset = selection.anchor.offset;

                if (backwards) {
                    // Find last match strictly BEFORE cursor
                    for (let i = matches.length - 1; i >= 0; i--) {
                        const m = matches[i];
                        const isSameNode = m.node.getKey() === anchorNode.getKey();
                        const isStrictlyBefore = isSameNode
                            ? m.index < currentOffset
                            : m.node.isBefore(anchorNode);

                        if (isStrictlyBefore) {
                            currentIndex = i;
                            break;
                        }
                    }
                    if (currentIndex === -1) currentIndex = matches.length - 1;

                } else {
                    // Find first match strictly AFTER (or at) cursor
                    for (let i = 0; i < matches.length; i++) {
                        const m = matches[i];
                        const isSameNode = m.node.getKey() === anchorNode.getKey();
                        const isAfter = isSameNode
                            ? m.index >= currentOffset
                            : anchorNode.isBefore(m.node);

                        if (isAfter) {
                            currentIndex = i;
                            break;
                        }
                    }
                    if (currentIndex === -1) currentIndex = 0;
                }
            } else {
                // No selection or not collapsed, just pick first or last
                currentIndex = backwards ? matches.length - 1 : 0;
            }

            // 3. Select the match
            const match = matches[currentIndex];
            if (match) {
                FindReplace.selectMatch(editor, match.node, match.index, match.length);
                updateInfo(`${currentIndex + 1} / ${matches.length}`);
            }
        });
    },

    selectMatch: (editor: LexicalEditor, node: TextNode, index: number, length: number) => {
        const selection = $createRangeSelection();
        selection.setTextNodeRange(node, index, node, index + length);
        $setSelection(selection);

        const element = editor.getElementByKey(node.getKey());
        if (element) {
            element.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    },

    /**
     * Replaces, then moves to next.
     */
    replace: (editor: LexicalEditor, searchText: string, replaceText: string, options: SearchOptions) => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                // Determine if selection matches the search query
                const text = selection.getTextContent();
                const regex = createRegex(searchText, options);

                // Usually if the user clicks Replace, they intend to replace the currently selected match
                // We should verify it matches though.
                if (regex && regex.test(text)) {
                    selection.insertText(replaceText);
                }
            }
        });

        // Find next match immediately
        setTimeout(() => FindReplace.findNext(editor, searchText, options), 50);
    },

    replaceAll: (editor: LexicalEditor, searchText: string, replaceText: string, options: SearchOptions) => {
        editor.update(() => {
            const regex = createRegex(searchText, options);
            if (!regex) return;

            const root = $getRoot();
            const textNodes = root.getAllTextNodes();
            let count = 0;

            textNodes.forEach(node => {
                const text = node.getTextContent();
                if (regex.test(text)) {
                    // Reset lastIndex for global regex
                    regex.lastIndex = 0;

                    const newText = text.replace(regex, replaceText);
                    if (newText !== text) {
                        node.setTextContent(newText);
                        count++;
                    }
                }
                regex.lastIndex = 0;
            });
            updateInfo(`Replaced ${count} occurrence(s).`);
        });
    }
};

function createRegex(text: string, options: SearchOptions): RegExp | null {
    try {
        let pattern = options.isRegex ? text : escapeRegExp(text);
        if (options.wholeWord) {
            pattern = `\\b${pattern}\\b`;
        }
        return new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
    } catch (e) {
        updateInfo("Invalid Regex");
        return null;
    }
}

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function updateInfo(msg: string) {
    const el = document.getElementById('fr-info-text');
    if (el) el.innerText = msg;
}
