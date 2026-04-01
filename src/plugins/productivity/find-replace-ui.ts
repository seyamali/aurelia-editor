import { type LexicalEditor } from 'lexical';
import { FindReplace, type SearchOptions } from './find-replace';

let findDialogRef: HTMLElement | null = null;
let findInputRef: HTMLInputElement | null = null;

export function setupFindReplaceUI(internalEditor: LexicalEditor) {
    const findDialog = document.getElementById('find-replace-dialog');
    const findInput = document.getElementById('find-input') as HTMLInputElement;
    const replaceInput = document.getElementById('replace-input') as HTMLInputElement;

    // Options
    const caseOpt = document.getElementById('fr-opt-case') as HTMLInputElement;
    const wholeOpt = document.getElementById('fr-opt-whole') as HTMLInputElement;
    const regexOpt = document.getElementById('fr-opt-regex') as HTMLInputElement;

    if (!findDialog) return;

    findDialogRef = findDialog;
    findInputRef = findInput;

    // Helper to get current options
    const getOptions = (): SearchOptions => ({
        caseSensitive: caseOpt?.checked || false,
        wholeWord: wholeOpt?.checked || false,
        isRegex: regexOpt?.checked || false
    });

    // 1. Open/Close Logic
    document.getElementById('find-btn')?.addEventListener('click', () => {
        findDialog.classList.toggle('hidden');
        if (!findDialog.classList.contains('hidden')) {
            findInput.focus();
            findInput.select();
        }
    });

    document.getElementById('close-find-btn')?.addEventListener('click', () => {
        findDialog.classList.add('hidden');
    });

    // Close on Escape
    findDialog.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') findDialog.classList.add('hidden');
    });

    // 2. Navigation
    document.getElementById('find-next-btn')?.addEventListener('click', () => {
        FindReplace.findNext(internalEditor, findInput.value, getOptions());
    });

    document.getElementById('find-prev-btn')?.addEventListener('click', () => {
        FindReplace.findPrevious(internalEditor, findInput.value, getOptions());
    });

    // Enter key in input -> Find Next, Shift+Enter -> Find Prev
    findInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                FindReplace.findPrevious(internalEditor, findInput.value, getOptions());
            } else {
                FindReplace.findNext(internalEditor, findInput.value, getOptions());
            }
        }
    });

    // 3. Replacement
    document.getElementById('replace-btn')?.addEventListener('click', () => {
        FindReplace.replace(internalEditor, findInput.value, replaceInput.value, getOptions());
    });

    document.getElementById('replace-all-btn')?.addEventListener('click', () => {
        if (confirm(`Replace all occurrences of "${findInput.value}" with "${replaceInput.value}"?`)) {
            FindReplace.replaceAll(internalEditor, findInput.value, replaceInput.value, getOptions());
        }
    });
}

export function toggleFindReplaceDialog(): void {
    if (!findDialogRef) return;

    findDialogRef.classList.toggle('hidden');
    if (!findDialogRef.classList.contains('hidden')) {
        findInputRef?.focus();
        findInputRef?.select();
    }
}
