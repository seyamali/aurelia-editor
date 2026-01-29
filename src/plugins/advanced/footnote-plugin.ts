import {
    $getRoot,
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_EDITOR,
    createCommand,
    type LexicalCommand,
} from 'lexical';
import type { EditorSDK } from '../../core/sdk';
import type { EditorPlugin } from '../../core/registry';
import {
    $createFootnoteRefNode,
    $createFootnoteContentNode,
    $createFootnoteContainerNode,
    $isFootnoteContainerNode,
} from './footnote-node';

// ============================================
// COMMANDS
// ============================================

export const INSERT_FOOTNOTE_COMMAND: LexicalCommand<void> = createCommand('INSERT_FOOTNOTE_COMMAND');
export const UPDATE_FOOTNOTE_NUMBERS_COMMAND: LexicalCommand<void> = createCommand('UPDATE_FOOTNOTE_NUMBERS_COMMAND');

// ============================================
// FOOTNOTE PLUGIN
// ============================================

let footnoteCounter = 0;

export const FootnotePlugin: EditorPlugin = {
    name: 'FootnotePlugin',

    init(sdk: EditorSDK): void {
        const editor = sdk.getLexicalEditor();

        // Register command listeners
        editor.registerCommand(
            INSERT_FOOTNOTE_COMMAND,
            () => {
                insertFootnote(editor);
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );

        editor.registerCommand(
            UPDATE_FOOTNOTE_NUMBERS_COMMAND,
            () => {
                updateFootnoteNumbers(editor);
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );

        // Listen for editor updates to renumber footnotes
        editor.registerUpdateListener(() => {
            updateFootnoteNumbers(editor);
        });

        // Setup click handlers for bidirectional navigation
        setupNavigationHandlers(editor);
    },
};

/**
 * Insert a new footnote at the current cursor position
 */
function insertFootnote(editor: any): void {
    editor.update(() => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) {
            return;
        }

        // Generate unique footnote ID
        const footnoteId = `fn-${Date.now()}-${++footnoteCounter}`;

        // Create and insert the reference marker
        const refNode = $createFootnoteRefNode(footnoteId);
        selection.insertNodes([refNode]);

        // Ensure footnote container exists
        ensureFootnoteContainer();

        // Update numbering
        setTimeout(() => updateFootnoteNumbers(editor), 100);
    });
}

/**
 * Ensure the footnote container exists at the end of the document
 */
function ensureFootnoteContainer(): void {
    const root = $getRoot();
    const children = root.getChildren();

    // Check if container already exists
    for (const child of children) {
        if ($isFootnoteContainerNode(child)) {
            return;
        }
    }

    // Create new container
    const container = $createFootnoteContainerNode();
    root.append(container);
}

/**
 * Update all footnote numbers in document order
 */
function updateFootnoteNumbers(editor: any): void {
    editor.getEditorState().read(() => {
        const footnoteRefs: Array<{ id: string; element: HTMLElement }> = [];
        const footnoteContents: Map<string, HTMLElement> = new Map();

        // Collect all footnote references in document order
        const allElements = document.querySelectorAll('.footnote-ref');
        allElements.forEach((el) => {
            const footnoteId = el.getAttribute('data-footnote-id');
            if (footnoteId) {
                footnoteRefs.push({ id: footnoteId, element: el as HTMLElement });
            }
        });

        // Collect all footnote content blocks
        const contentElements = document.querySelectorAll('.footnote-content-item');
        contentElements.forEach((el) => {
            const footnoteId = el.getAttribute('data-footnote-id');
            if (footnoteId) {
                footnoteContents.set(footnoteId, el as HTMLElement);
            }
        });

        // Renumber in order
        footnoteRefs.forEach((ref, index) => {
            const number = index + 1;

            // Update reference marker
            ref.element.textContent = `${number}`;
            ref.element.setAttribute('data-footnote-number', `${number}`);

            // Update corresponding content block
            const contentEl = footnoteContents.get(ref.id);
            if (contentEl) {
                const numberSpan = contentEl.querySelector('.footnote-number');
                if (numberSpan) {
                    numberSpan.textContent = `${number}.`;
                }
                contentEl.setAttribute('data-footnote-number', `${number}`);
            }
        });

        // Reorder content blocks to match reference order
        const listDiv = document.querySelector('#footnotes-list');
        if (listDiv) {
            footnoteRefs.forEach((ref) => {
                const contentEl = footnoteContents.get(ref.id);
                if (contentEl) {
                    listDiv.appendChild(contentEl);
                }
            });
        }

        // Hide container if no footnotes
        const container = document.querySelector('.footnotes-container');
        if (container) {
            if (footnoteRefs.length === 0) {
                (container as HTMLElement).style.display = 'none';
            } else {
                (container as HTMLElement).style.display = 'block';
            }
        }
    });
}

/**
 * Setup click handlers for bidirectional navigation
 */
function setupNavigationHandlers(editor: any): void {
    // Use event delegation on the editor container
    const editorContainer = editor.getRootElement()?.parentElement;
    if (!editorContainer) return;

    editorContainer.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;

        // Handle reference marker click -> scroll to content
        if (target.classList.contains('footnote-ref')) {
            e.preventDefault();
            const footnoteId = target.getAttribute('data-footnote-id');
            if (footnoteId) {
                scrollToFootnoteContent(footnoteId);
            }
        }

        // Handle return button click -> scroll to reference
        if (target.classList.contains('footnote-return')) {
            e.preventDefault();
            const contentItem = target.closest('.footnote-content-item');
            if (contentItem) {
                const footnoteId = contentItem.getAttribute('data-footnote-id');
                if (footnoteId) {
                    scrollToFootnoteRef(footnoteId);
                }
            }
        }
    });

    // Handle content editing
    editorContainer.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLElement;

        if (target.classList.contains('footnote-text')) {
            // Content is being edited - could sync to Lexical state if needed
            // For now, the DOM editing is sufficient
        }
    });
}

/**
 * Scroll to footnote content block
 */
function scrollToFootnoteContent(footnoteId: string): void {
    const contentEl = document.querySelector(
        `.footnote-content-item[data-footnote-id="${footnoteId}"]`
    );
    if (contentEl) {
        contentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight briefly
        contentEl.classList.add('footnote-highlight');
        setTimeout(() => {
            contentEl.classList.remove('footnote-highlight');
        }, 1500);
    }
}

/**
 * Scroll to footnote reference marker
 */
function scrollToFootnoteRef(footnoteId: string): void {
    const refEl = document.querySelector(
        `.footnote-ref[data-footnote-id="${footnoteId}"]`
    );
    if (refEl) {
        refEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight briefly
        refEl.classList.add('footnote-highlight');
        setTimeout(() => {
            refEl.classList.remove('footnote-highlight');
        }, 1500);
    }
}

export default FootnotePlugin;
