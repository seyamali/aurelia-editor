import { type LexicalEditor } from 'lexical';
import { INSERT_TABLE_COMMAND } from '@lexical/table';

export function setupTableGridPicker(editor: LexicalEditor) {
    // Initializes the picker markup if not present
    let picker = document.getElementById('table-grid-picker');
    if (!picker) {
        const wrapper = document.getElementById('editor-wrapper') || document.body;

        picker = document.createElement('div');
        picker.id = 'table-grid-picker';
        picker.className = 'table-grid-picker';
        picker.innerHTML = `
            <div id="grid-picker-container" class="grid-picker-container" style="grid-template-columns: repeat(10, 1fr);">
                <!-- 10x10 cells -->
            </div>
            <div id="grid-picker-label" class="grid-picker-label">0 × 0</div>
        `;
        wrapper.appendChild(picker);

        const container = picker.querySelector('#grid-picker-container');
        const label = picker.querySelector('#grid-picker-label');
        const MAX_ROWS = 10;
        const MAX_COLS = 10;

        for (let r = 1; r <= MAX_ROWS; r++) {
            for (let c = 1; c <= MAX_COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'grid-picker-cell';
                cell.dataset.row = r.toString();
                cell.dataset.col = c.toString();

                cell.addEventListener('mouseover', () => {
                    highlightGrid(r, c, picker!);
                    if (label) label.textContent = `${c} × ${r}`;
                });

                cell.addEventListener('click', () => {
                    editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: c.toString(), rows: r.toString() });
                    picker!.classList.remove('active');
                });

                container?.appendChild(cell);
            }
        }
    }

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (picker && !picker.contains(e.target as Node) && !(e.target as HTMLElement).closest('[data-item-id="insert-table"]')) {
            picker.classList.remove('active');
        }
    });
}

function highlightGrid(rows: number, cols: number, picker: HTMLElement) {
    const cells = picker.querySelectorAll('.grid-picker-cell');
    cells.forEach((cell: any) => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        if (r <= rows && c <= cols) {
            cell.classList.add('highlighted');
        } else {
            cell.classList.remove('highlighted');
        }
    });
}

export function toggleTableGridPicker(editor: LexicalEditor, triggerBtn: HTMLElement) {
    let picker = document.getElementById('table-grid-picker');
    if (!picker) {
        setupTableGridPicker(editor);
        picker = document.getElementById('table-grid-picker');
    }

    if (!picker) return;

    if (picker.classList.contains('active')) {
        picker.classList.remove('active');
        return;
    }

    // Position picker
    const rect = triggerBtn.getBoundingClientRect();
    const wrapper = document.getElementById('editor-wrapper') || document.body;
    const wrapperRect = wrapper.getBoundingClientRect();

    picker.style.top = `${rect.bottom - wrapperRect.top + 5}px`;
    picker.style.left = `${rect.left - wrapperRect.left}px`;
    picker.classList.add('active');
}
