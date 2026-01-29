import {
    $createTableNodeWithDimensions,
    INSERT_TABLE_COMMAND,
    $insertTableRow__EXPERIMENTAL,
    $insertTableColumn__EXPERIMENTAL,
    $deleteTableRow__EXPERIMENTAL,
    $deleteTableColumn__EXPERIMENTAL,
    $isTableSelection,
    $isTableCellNode,
    $isTableRowNode,
    $isTableNode,
    TableCellNode,
    TableRowNode,
    $unmergeCell,
    $mergeCells,
    registerTablePlugin,
    registerTableSelectionObserver
} from '@lexical/table';
import {
    $getSelection,
    $isRangeSelection,
    $insertNodes,
    createCommand,
    COMMAND_PRIORITY_EDITOR,
    COMMAND_PRIORITY_LOW,
    KEY_TAB_COMMAND
} from 'lexical';
import { EditorSDK } from '../../core/sdk';
import type { EditorPlugin } from '../../core/registry';

export const TablesPlugin: EditorPlugin = {
    name: 'tables',
    init: (sdk: EditorSDK) => {
        const editor = sdk.getLexicalEditor();

        // Register mandatory table logic
        registerTablePlugin(editor);
        registerTableSelectionObserver(editor, true);

        // 1. Table Insertion Command
        sdk.registerCommand(
            INSERT_TABLE_COMMAND,
            ({ columns, rows, includeHeader = true }: { columns: string; rows: string; includeHeader?: boolean }) => {
                const tableNode = $createTableNodeWithDimensions(
                    Number(rows),
                    Number(columns),
                    includeHeader
                );
                $insertNodes([tableNode]);
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );

        // 2. Tab Navigation between cells
        editor.registerCommand(
            KEY_TAB_COMMAND,
            (event: KeyboardEvent) => {
                const selection = $getSelection();
                if ($isRangeSelection(selection) && selection.isCollapsed()) {
                    const tableCellNode = $getTableCellNodeFromSelection(selection);
                    if (tableCellNode) {
                        event.preventDefault();
                        const nextTableCellNode = event.shiftKey
                            ? $getNextTableCellNode(tableCellNode, 'backward')
                            : $getNextTableCellNode(tableCellNode, 'forward');

                        if (nextTableCellNode) {
                            nextTableCellNode.select();
                        }
                        return true;
                    }
                }
                return false;
            },
            COMMAND_PRIORITY_LOW
        );

        // 3. Arrow Key Navigation (Optional but nice)
        // Note: Simple cell jump on arrows if at boundaries could be added here

        // 4. Register Table Commands for Toolbar
        editor.registerCommand(createCommand('TABLE_ADD_ROW_ABOVE'), () => { tableHandlers.insertRowAbove({ getInternalEditor: () => editor }); return true; }, COMMAND_PRIORITY_EDITOR);
        editor.registerCommand(createCommand('TABLE_ADD_ROW_BELOW'), () => { tableHandlers.insertRowBelow({ getInternalEditor: () => editor }); return true; }, COMMAND_PRIORITY_EDITOR);
        editor.registerCommand(createCommand('TABLE_ADD_COL_LEFT'), () => { tableHandlers.insertColumnLeft({ getInternalEditor: () => editor }); return true; }, COMMAND_PRIORITY_EDITOR);
        editor.registerCommand(createCommand('TABLE_ADD_COL_RIGHT'), () => { tableHandlers.insertColumnRight({ getInternalEditor: () => editor }); return true; }, COMMAND_PRIORITY_EDITOR);
        editor.registerCommand(createCommand('TABLE_DELETE_ROW'), () => { tableHandlers.deleteRow({ getInternalEditor: () => editor }); return true; }, COMMAND_PRIORITY_EDITOR);
        editor.registerCommand(createCommand('TABLE_DELETE_COL'), () => { tableHandlers.deleteColumn({ getInternalEditor: () => editor }); return true; }, COMMAND_PRIORITY_EDITOR);
        editor.registerCommand(createCommand('TABLE_DELETE_TABLE'), () => { tableHandlers.deleteTable({ getInternalEditor: () => editor }); return true; }, COMMAND_PRIORITY_EDITOR);
        editor.registerCommand(createCommand('TABLE_MERGE_CELLS'), () => { tableHandlers.mergeCells({ getInternalEditor: () => editor }); return true; }, COMMAND_PRIORITY_EDITOR);
        editor.registerCommand(createCommand('TABLE_SPLIT_CELLS'), () => { tableHandlers.splitCell({ getInternalEditor: () => editor }); return true; }, COMMAND_PRIORITY_EDITOR);
    }
};

// --- Helper Functions ---

function $getTableCellNodeFromSelection(selection: any): TableCellNode | null {
    const nodes = selection.getNodes();
    for (const node of nodes) {
        let parent: any = node;
        while (parent !== null) {
            if ($isTableCellNode(parent)) return parent;
            if (typeof parent.getParent === 'function') {
                parent = parent.getParent();
            } else {
                parent = null;
            }
        }
    }
    return null;
}

function $getNextTableCellNode(node: TableCellNode, direction: 'forward' | 'backward'): TableCellNode | null {
    const row = node.getParent();
    if (!$isTableRowNode(row)) return null;

    const table = row.getParent();
    if (!$isTableNode(table)) return null;

    const cells = table.getChildren().flatMap(r => (r as TableRowNode).getChildren());
    const index = cells.indexOf(node);

    if (direction === 'forward') {
        return (cells[index + 1] as TableCellNode) || null;
    } else {
        return (cells[index - 1] as TableCellNode) || null;
    }
}

export const tableHandlers = {
    insertRowAbove: (editor: any) => {
        editor.getInternalEditor().update(() => {
            $insertTableRow__EXPERIMENTAL(false);
        });
    },
    insertRowBelow: (editor: any) => {
        editor.getInternalEditor().update(() => {
            $insertTableRow__EXPERIMENTAL(true);
        });
    },
    insertColumnLeft: (editor: any) => {
        editor.getInternalEditor().update(() => {
            $insertTableColumn__EXPERIMENTAL(false);
        });
    },
    insertColumnRight: (editor: any) => {
        editor.getInternalEditor().update(() => {
            $insertTableColumn__EXPERIMENTAL(true);
        });
    },
    deleteRow: (editor: any) => {
        editor.getInternalEditor().update(() => {
            $deleteTableRow__EXPERIMENTAL();
        });
    },
    deleteColumn: (editor: any) => {
        editor.getInternalEditor().update(() => {
            $deleteTableColumn__EXPERIMENTAL();
        });
    },
    deleteTable: (editor: any) => {
        editor.getInternalEditor().update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection) || $isTableSelection(selection)) {
                const nodes = selection.getNodes();
                for (const node of nodes) {
                    let parent: any = node;
                    while (parent !== null) {
                        if ($isTableNode(parent)) {
                            parent.remove();
                            return;
                        }
                        parent = (typeof parent.getParent === 'function') ? parent.getParent() : null;
                    }
                }
            }
        });
    },
    // Aliases for backward compatibility
    insertRow: (editor: any) => tableHandlers.insertRowBelow(editor),
    insertColumn: (editor: any) => tableHandlers.insertColumnRight(editor),
    mergeCells: (editor: any) => {
        editor.getInternalEditor().update(() => {
            const selection = $getSelection();
            if ($isTableSelection(selection)) {
                const nodes = selection.getNodes();
                const cellNodes = nodes.filter((node): node is TableCellNode => $isTableCellNode(node));
                if (cellNodes.length > 1) {
                    $mergeCells(cellNodes);
                }
            } else {
                console.warn("Please select multiple cells (drag across cells) to merge");
            }
        });
    },
    splitCell: (editor: any) => {
        editor.getInternalEditor().update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection) || $isTableSelection(selection)) {
                $unmergeCell();
            }
        });
    }
};

export const insertTable = (editor: any) => {
    editor.getInternalEditor().dispatchCommand(INSERT_TABLE_COMMAND, { columns: '3', rows: '3' });
};
