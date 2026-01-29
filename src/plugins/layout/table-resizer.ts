import { $getNearestNodeFromDOMNode, type LexicalEditor } from 'lexical';
import { $isTableCellNode, TableCellNode } from '@lexical/table';
import { EditorSDK } from '../../core/sdk';

export const TableResizerPlugin = {
    name: 'table-resizer',
    init: (sdk: EditorSDK) => {
        const editor = sdk.getLexicalEditor();
        const TOLERANCE = 5; // px proximity to border

        let isDragging = false;
        let dragType: 'col' | 'row' | null = null;
        let targetCell: HTMLElement | null = null;

        const resizerLine = document.createElement('div');
        resizerLine.style.position = 'absolute';
        resizerLine.style.backgroundColor = '#3b82f6';
        resizerLine.style.zIndex = '1000';
        resizerLine.style.pointerEvents = 'none';
        resizerLine.style.display = 'none';
        document.body.appendChild(resizerLine);

        const editorRoot = document.getElementById('editor-canvas');
        if (!editorRoot) return;

        editorRoot.addEventListener('mousemove', (e) => {
            if (isDragging) {
                onDrag(e);
                return;
            }

            const target = e.target as HTMLElement;
            const cell = target.closest('td, th') as HTMLElement;

            if (!cell) {
                editorRoot.style.cursor = '';
                return;
            }

            const rect = cell.getBoundingClientRect();
            const x = e.clientX;
            const y = e.clientY;

            const onRightEdge = Math.abs(x - rect.right) < TOLERANCE;
            const onBottomEdge = Math.abs(y - rect.bottom) < TOLERANCE;

            if (onRightEdge) {
                editorRoot.style.cursor = 'col-resize';
                dragType = 'col';
                targetCell = cell;
            } else if (onBottomEdge) {
                editorRoot.style.cursor = 'row-resize';
                dragType = 'row';
                targetCell = cell;
            } else {
                editorRoot.style.cursor = '';
                dragType = null;
                targetCell = null;
            }
        });

        editorRoot.addEventListener('mousedown', (e) => {
            if (dragType && targetCell) {
                e.preventDefault();
                isDragging = true;

                // Configure visual feedback line
                const rect = targetCell.getBoundingClientRect();
                resizerLine.style.display = 'block';

                if (dragType === 'col') {
                    resizerLine.style.width = '2px';
                    resizerLine.style.height = editorRoot.offsetHeight + 'px'; // Height of editor for visual guide
                    resizerLine.style.top = editorRoot.getBoundingClientRect().top + 'px'; // Align with editor top
                    resizerLine.style.left = rect.right + 'px';
                } else {
                    resizerLine.style.height = '2px';
                    resizerLine.style.width = editorRoot.offsetWidth + 'px';
                    resizerLine.style.left = editorRoot.getBoundingClientRect().left + 'px';
                    resizerLine.style.top = rect.bottom + 'px';
                }
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging && targetCell) {
                const finalWidth = parseFloat(resizerLine.style.left) - targetCell.getBoundingClientRect().left;
                const finalHeight = parseFloat(resizerLine.style.top) - targetCell.getBoundingClientRect().top;

                applyResize(editor, targetCell, dragType!, finalWidth, finalHeight);

                // Reset
                isDragging = false;
                dragType = null;
                targetCell = null;
                resizerLine.style.display = 'none';
                editorRoot.style.cursor = '';
            }
        });

        function onDrag(e: MouseEvent) {
            if (!targetCell) return;

            if (dragType === 'col') {
                // Update line position
                resizerLine.style.left = e.clientX + 'px';
            } else {
                resizerLine.style.top = e.clientY + 'px';
            }
        }
    }
};

function applyResize(editor: LexicalEditor, cellDOM: HTMLElement, type: 'col' | 'row', finalWidth: number, finalHeight: number) {
    editor.update(() => {
        const node = $getNearestNodeFromDOMNode(cellDOM);
        if ($isTableCellNode(node)) {
            if (type === 'col') {
                // For tables, width is often shared by the column. 
                // We should ideally set width on the colgroup or all cells in the column.
                // Simple version: set on the cell and let table-layout: fixed (if used) handle it,
                // or iterate column cells.

                // Lexical's TableCellNode usually supports setWidth.
                const newWidth = Math.max(20, finalWidth);
                (node as TableCellNode).setWidth(newWidth);

                // Also update DOM immediately for feedback if Lexical update is slow
                cellDOM.style.width = `${newWidth}px`;
            } else {
                const newHeight = Math.max(20, finalHeight);
                const row = node.getParent();
                if (row) {
                    // Start by setting style on DOM first, Lexical RowNode support varies
                    const rowDOM = editor.getElementByKey(row.getKey());
                    if (rowDOM) {
                        rowDOM.style.height = `${newHeight}px`;
                    }
                    // If customized row node supports setHeight:
                    if ('setHeight' in row) {
                        (row as any).setHeight(newHeight);
                    }
                }
            }
        }
    });
}
