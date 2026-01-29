import { $getSelection, $isRangeSelection, type LexicalEditor, SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_LOW } from 'lexical';
import { $isTableCellNode, $isTableSelection } from '@lexical/table';
import { tableHandlers } from '../plugins/layout/tables';

export function setupTablePopover(editor: LexicalEditor) {
    let popover = document.getElementById('table-popover');

    if (!popover) {
        popover = document.createElement('div');
        popover.id = 'table-popover';
        popover.className = 'table-popover hidden';
        popover.innerHTML = `
            <div class="table-popover-group">
                <button id="table-row-above" title="Insert Row Above">🔼 Row</button>
                <button id="table-row-below" title="Insert Row Below">🔽 Row</button>
                <button id="table-row-delete" title="Delete Row" class="danger">❌ Row</button>
            </div>
            <div class="divider-v"></div>
            <div class="table-popover-group">
                <button id="table-col-left" title="Insert Column Left">◀️ Col</button>
                <button id="table-col-right" title="Insert Column Right">▶️ Col</button>
                <button id="table-col-delete" title="Delete Column" class="danger">❌ Col</button>
            </div>
            <div class="divider-v"></div>
            <div class="table-popover-group">
                <button id="table-merge" title="Merge Cells">🔗 Merge</button>
                <button id="table-split" title="Split Cell">✂️ Split</button>
            </div>
            <div class="divider-v"></div>
            <div class="table-popover-group">
                <button id="table-delete" title="Delete Table" class="danger">🗑️ Table</button>
            </div>
        `;
        document.getElementById('editor-wrapper')?.appendChild(popover);
    }

    const updatePopoverPosition = (targetCell: HTMLElement) => {
        const wrapper = document.getElementById('editor-wrapper');
        if (!wrapper || !popover) return;

        const wrapperRect = wrapper.getBoundingClientRect();
        const targetRect = targetCell.getBoundingClientRect();
        const popoverRect = popover.getBoundingClientRect();

        // Position above the cell
        let top = targetRect.top - wrapperRect.top - popoverRect.height - 10;
        let left = targetRect.left - wrapperRect.left + (targetRect.width / 2) - (popoverRect.width / 2);

        // Boundary checks
        if (left < 10) left = 10;
        if (left + popoverRect.width > wrapperRect.width - 10) {
            left = wrapperRect.width - popoverRect.width - 10;
        }
        if (top < 10) {
            top = targetRect.bottom - wrapperRect.top + 10;
        }

        popover.style.top = `${top}px`;
        popover.style.left = `${left}px`;
    };

    const hidePopover = () => {
        popover?.classList.add('hidden');
    };

    const showPopover = (targetCell: HTMLElement) => {
        popover?.classList.remove('hidden');
        requestAnimationFrame(() => updatePopoverPosition(targetCell));
    };

    // Listen for selection changes to show/hide popover
    editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
            const selection = $getSelection();
            if (($isRangeSelection(selection) && !selection.isCollapsed()) || $isTableSelection(selection)) {
                const nodes = selection.getNodes();
                let tableCellFound = false;

                // For TableSelection, the nodes are usually the cells themselves
                for (const node of nodes) {
                    let parent: any = node;
                    while (parent !== null) {
                        if ($isTableCellNode(parent)) {
                            const element = editor.getElementByKey(parent.getKey());
                            if (element) {
                                showPopover(element);
                                tableCellFound = true;
                                break;
                            }
                        }
                        parent = (typeof parent.getParent === 'function') ? parent.getParent() : null;
                    }
                    if (tableCellFound) break;
                }

                if (!tableCellFound) {
                    hidePopover();
                }
            } else {
                hidePopover();
            }
            return false;
        },
        COMMAND_PRIORITY_LOW
    );

    // Button Listeners
    const editorProxy = { update: (fn: any) => editor.update(fn), getInternalEditor: () => editor };

    document.getElementById('table-row-above')?.addEventListener('click', () => {
        tableHandlers.insertRowAbove(editorProxy);
    });
    document.getElementById('table-row-below')?.addEventListener('click', () => {
        tableHandlers.insertRowBelow(editorProxy);
    });
    document.getElementById('table-row-delete')?.addEventListener('click', () => {
        tableHandlers.deleteRow(editorProxy);
    });
    document.getElementById('table-col-left')?.addEventListener('click', () => {
        tableHandlers.insertColumnLeft(editorProxy);
    });
    document.getElementById('table-col-right')?.addEventListener('click', () => {
        tableHandlers.insertColumnRight(editorProxy);
    });
    document.getElementById('table-col-delete')?.addEventListener('click', () => {
        tableHandlers.deleteColumn(editorProxy);
    });
    document.getElementById('table-merge')?.addEventListener('click', () => {
        tableHandlers.mergeCells(editorProxy);
    });
    document.getElementById('table-split')?.addEventListener('click', () => {
        tableHandlers.splitCell(editorProxy);
    });
    document.getElementById('table-delete')?.addEventListener('click', () => {
        hidePopover();
        tableHandlers.deleteTable(editorProxy);
    });
}
