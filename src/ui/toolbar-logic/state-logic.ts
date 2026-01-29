import {
    $getSelection,
    $isRangeSelection,
    $isNodeSelection,
    COMMAND_PRIORITY_CRITICAL,
    SELECTION_CHANGE_COMMAND,
    CAN_UNDO_COMMAND,
    CAN_REDO_COMMAND,
    UNDO_COMMAND,
    REDO_COMMAND
} from 'lexical';
import { $getNearestNodeOfType } from '@lexical/utils';
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { ListNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { $isImageNode } from '../../plugins/media/image-node';
import { $isTableNode } from '@lexical/table';
import { $getSelectionStyleValueForProperty } from '@lexical/selection';
import { ICONS } from '../icons';

export function setupToolbarState(internalEditor: any) {
    const updateToolbar = () => {
        internalEditor.getEditorState().read(() => {
            const selection = $getSelection();

            let isLink = false;

            if ($isRangeSelection(selection)) {
                // --- Formatting ---
                const formatMap: Record<string, string> = {
                    'bold': 'bold-btn',
                    'italic': 'italic-btn',
                    'underline': 'underline-btn',
                    'strikethrough': 'strikethrough-btn',
                    'subscript': 'subscript-btn',
                    'superscript': 'superscript-btn',
                    'code': 'code-btn'
                };

                for (const [format, btnId] of Object.entries(formatMap)) {
                    document.getElementById(btnId)?.classList.toggle('active', selection.hasFormat(format as any));
                }

                // --- Block Type Detection (Heading Dropdown) ---
                const anchorNode = selection.anchor.getNode();
                let element = anchorNode.getKey() === 'root'
                    ? anchorNode
                    : anchorNode.getTopLevelElementOrThrow();

                let blockType = 'paragraph';
                if ($isHeadingNode(element)) {
                    blockType = element.getTag();
                } else if ($isQuoteNode(element)) {
                    blockType = 'blockquote';
                }

                // Update Heading Dropdown Label
                const headingBtn = document.querySelector('button[data-item-id="heading-dropdown"]');
                if (headingBtn) {
                    const blockLabels: Record<string, string> = {
                        'h1': 'Heading 1',
                        'h2': 'Heading 2',
                        'h3': 'Heading 3',
                        'h4': 'Heading 4',
                        'h5': 'Heading 5',
                        'h6': 'Heading 6',
                        'paragraph': 'Normal',
                        'blockquote': 'Quote'
                    };
                    const label = blockLabels[blockType] || 'Normal';

                    // Update only if changed to avoid flicker
                    // We reconstruct the button content: Icon + Label + Arrow
                    // Note: We use ICONS.HEADING for the main button always.
                    headingBtn.innerHTML = `${ICONS.HEADING} ${label} <span style="font-size: 0.8em; opacity: 0.6; margin-left: 4px;">▼</span>`;
                }

                document.getElementById('blockquote-btn')?.classList.toggle('active', blockType === 'blockquote');

                // --- List Detection ---
                const listNode = $getNearestNodeOfType(anchorNode, ListNode);
                if (listNode) {
                    const listType = listNode.getListType();
                    document.getElementById('bullet-list-btn')?.classList.toggle('active', listType === 'bullet');
                    document.getElementById('numbered-list-btn')?.classList.toggle('active', listType === 'number');
                } else {
                    document.getElementById('bullet-list-btn')?.classList.remove('active');
                    document.getElementById('numbered-list-btn')?.classList.remove('active');
                }

                // --- Link Detection ---
                isLink = $getNearestNodeOfType(anchorNode, LinkNode) !== null;
            } else if ($isNodeSelection(selection)) {
                // Node Selection (e.g. Image)
                const nodes = selection.getNodes();
                if (nodes.length === 1 && $isImageNode(nodes[0])) {
                    isLink = !!(nodes[0] as any).__linkUrl;
                }
            }

            document.getElementById('insert-link-btn')?.classList.toggle('active', isLink);

            // --- Indentation Status ---
            const indentBtn = document.getElementById('indent-btn') as HTMLButtonElement;
            const outdentBtn = document.getElementById('outdent-btn') as HTMLButtonElement;
            if (indentBtn && outdentBtn) {
                if ($isRangeSelection(selection)) {
                    const anchorNode = selection.anchor.getNode();
                    const topElement = anchorNode.getTopLevelElement();
                    const listNode = $getNearestNodeOfType(anchorNode, ListNode);

                    // Most top-level elements or list items can be indented
                    const canIndent = topElement !== null && !$isTableNode(topElement);
                    indentBtn.disabled = !canIndent;

                    // Can outdent if indent level > 0 or in a nested list
                    const currentIndent = topElement?.getIndent?.() || 0;
                    const isNestedList = listNode !== null && listNode.getParent() instanceof ListNode;

                    outdentBtn.disabled = !(currentIndent > 0 || isNestedList);
                } else {
                    indentBtn.disabled = true;
                    outdentBtn.disabled = true;
                }
            }
        });
    };

    // A11y Announcer for Undo/Redo
    const announceAction = (message: string) => {
        const announcer = document.getElementById('announcer');
        if (announcer) {
            announcer.innerText = message;
            setTimeout(() => {
                if (announcer.innerText === message) announcer.innerText = '';
            }, 3000);
        }
    };

    // --- History State Tracking ---
    // Ensure button IDs match config: 'undo', 'redo' -> 'undo-btn', 'redo-btn'
    internalEditor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload: boolean) => {
            const undoBtn = document.getElementById('undo-btn') as HTMLButtonElement;
            if (undoBtn) {
                undoBtn.disabled = !payload;
            }
            return false;
        },
        COMMAND_PRIORITY_CRITICAL
    );

    internalEditor.registerCommand(
        CAN_REDO_COMMAND,
        (payload: boolean) => {
            const redoBtn = document.getElementById('redo-btn') as HTMLButtonElement;
            if (redoBtn) {
                redoBtn.disabled = !payload;
            }
            return false;
        },
        COMMAND_PRIORITY_CRITICAL
    );

    // Announcements
    internalEditor.registerCommand(
        UNDO_COMMAND,
        () => {
            announceAction('Undo performed');
            return false;
        },
        COMMAND_PRIORITY_CRITICAL
    );

    internalEditor.registerCommand(
        REDO_COMMAND,
        () => {
            announceAction('Redo performed');
            return false;
        },
        COMMAND_PRIORITY_CRITICAL
    );

    // Listen for selection changes and editor updates
    internalEditor.registerUpdateListener(() => {
        updateToolbar();
    });

    internalEditor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
            updateToolbar();
            return false;
        },
        COMMAND_PRIORITY_CRITICAL
    );
}
