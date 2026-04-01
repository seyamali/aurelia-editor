import {
    $insertNodes,
    COMMAND_PRIORITY_EDITOR,
    createCommand,
    type LexicalCommand,
    type LexicalEditor,
} from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';
import { EditorSDK } from '../../core/sdk';
import type { EditorPlugin } from '../../core/registry';

export interface TemplateBlockDefinition {
    id: string;
    label: string;
    description: string;
    category: string;
    icon: string;
    html: string;
}

export const TEMPLATE_BLOCKS: TemplateBlockDefinition[] = [
    {
        id: 'hero',
        label: 'Hero Section',
        description: 'A strong intro block with headline, body, and action buttons.',
        category: 'Marketing',
        icon: 'H',
        html: `
            <div>
                <p><strong>New Release</strong></p>
                <h2>Build faster with a reusable content block</h2>
                <p>Start with a polished hero area and customize the copy for your document.</p>
                <ul>
                    <li>Primary action</li>
                    <li>Secondary action</li>
                </ul>
            </div>
        `,
    },
    {
        id: 'callout',
        label: 'Callout',
        description: 'Highlight an important note, warning, or tip.',
        category: 'Docs',
        icon: '!',
        html: `
            <div>
                <p><strong>Heads up</strong></p>
                <p>Use this box to emphasize one key idea that readers should not miss.</p>
            </div>
        `,
    },
    {
        id: 'checklist',
        label: 'Checklist',
        description: 'A ready-made task list with helpful spacing.',
        category: 'Productivity',
        icon: '✓',
        html: `
            <div>
                <h3>Launch checklist</h3>
                <ul>
                    <li>Review the draft</li>
                    <li>Confirm the visuals</li>
                    <li>Publish and share</li>
                </ul>
            </div>
        `,
    },
    {
        id: 'faq',
        label: 'FAQ',
        description: 'A lightweight accordion for common questions.',
        category: 'Docs',
        icon: '?',
        html: `
            <div>
                <h3>Frequently asked questions</h3>
                <p><strong>What is this block for?</strong></p>
                <p>It gives you a structured way to answer common questions inline.</p>
                <p><strong>Can I edit the content?</strong></p>
                <p>Yes. Replace the sample answers with your own content.</p>
            </div>
        `,
    },
    {
        id: 'signature',
        label: 'Signature',
        description: 'A simple closing block for letters and proposals.',
        category: 'Business',
        icon: '✎',
        html: `
            <div>
                <p>Best,</p>
                <p><strong>Your Name</strong><br />Your Role</p>
            </div>
        `,
    },
];

export const INSERT_TEMPLATE_BLOCK_COMMAND: LexicalCommand<string> = createCommand(
    'INSERT_TEMPLATE_BLOCK_COMMAND'
);

function getTemplateBlockById(blockId: string): TemplateBlockDefinition | undefined {
    return TEMPLATE_BLOCKS.find(block => block.id === blockId);
}

export function insertTemplateBlock(editor: LexicalEditor, blockId: string): boolean {
    const block = getTemplateBlockById(blockId);
    if (!block) {
        return false;
    }

    editor.update(() => {
        const parser = new DOMParser();
        const documentFragment = parser.parseFromString(block.html, 'text/html');
        const nodes = $generateNodesFromDOM(editor, documentFragment);
        $insertNodes(nodes);
    });

    return true;
}

export function showTemplateBlocksPanel(editor: LexicalEditor) {
    const panel = ensureTemplateBlocksPanel(editor);
    panel.classList.add('open');
    renderTemplateBlocks(panel, editor);

    const searchInput = panel.querySelector<HTMLInputElement>('.template-blocks-search');
    searchInput?.focus();
    searchInput?.select();
}

function ensureTemplateBlocksPanel(editor: LexicalEditor): HTMLElement {
    let panel = document.getElementById('template-blocks-panel');
    if (panel) {
        return panel;
    }

    panel = document.createElement('div');
    panel.id = 'template-blocks-panel';
    panel.className = 'template-blocks-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Insert template block');
    panel.innerHTML = `
        <div class="template-blocks-panel-surface">
            <div class="template-blocks-header">
                <div>
                    <p class="template-blocks-kicker">Reusable snippets</p>
                    <h3>Insert a template block</h3>
                </div>
                <button class="template-blocks-close" type="button" aria-label="Close template palette">&times;</button>
            </div>
            <input class="template-blocks-search" type="text" placeholder="Search templates..." aria-label="Search templates" />
            <div class="template-blocks-grid" id="template-blocks-grid"></div>
            <div class="template-blocks-footer">
                Press Enter to insert the first match or click a card.
            </div>
        </div>
    `;

    document.body.appendChild(panel);

    const closeBtn = panel.querySelector<HTMLButtonElement>('.template-blocks-close');
    closeBtn?.addEventListener('click', () => {
        panel?.classList.remove('open');
    });

    panel.addEventListener('click', (event) => {
        if (event.target === panel) {
            panel?.classList.remove('open');
        }
    });

    const searchInput = panel.querySelector<HTMLInputElement>('.template-blocks-search');
    searchInput?.addEventListener('input', () => renderTemplateBlocks(panel as HTMLElement, editor));
    searchInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            panel?.classList.remove('open');
        }

        if (event.key === 'Enter') {
            const visible = getVisibleTemplateBlocks(panel as HTMLElement);
            const first = visible[0];
            if (first) {
                insertTemplateBlock(editor, first.dataset.templateId || '');
                panel?.classList.remove('open');
            }
            event.preventDefault();
        }
    });

    return panel;
}

function renderTemplateBlocks(panel: HTMLElement, editor: LexicalEditor) {
    const grid = panel.querySelector<HTMLDivElement>('#template-blocks-grid');
    const search = panel.querySelector<HTMLInputElement>('.template-blocks-search');
    if (!grid || !search) {
        return;
    }

    const query = search.value.trim().toLowerCase();
    const blocks = TEMPLATE_BLOCKS.filter(block => {
        if (!query) return true;
        return [
            block.label,
            block.description,
            block.category,
        ].some(field => field.toLowerCase().includes(query));
    });

    grid.innerHTML = '';

    if (blocks.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'template-blocks-empty';
        empty.textContent = 'No templates match your search.';
        grid.appendChild(empty);
        return;
    }

    blocks.forEach(block => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'template-block-card';
        card.dataset.templateId = block.id;
        card.innerHTML = `
            <div class="template-block-card-top">
                <span class="template-block-card-icon">${block.icon}</span>
                <div>
                    <div class="template-block-card-label">${block.label}</div>
                    <div class="template-block-card-category">${block.category}</div>
                </div>
            </div>
            <div class="template-block-card-description">${block.description}</div>
            <div class="template-block-card-preview"></div>
            <div class="template-block-card-action">Insert block</div>
        `;

        const preview = card.querySelector<HTMLDivElement>('.template-block-card-preview');
        if (preview) {
            preview.innerHTML = block.html;
        }

        card.addEventListener('click', () => {
            insertTemplateBlock(editor, block.id);
            panel.classList.remove('open');
        });

        grid.appendChild(card);
    });
}

function getVisibleTemplateBlocks(panel: HTMLElement): HTMLElement[] {
    return Array.from(panel.querySelectorAll<HTMLElement>('.template-block-card')).filter(card => {
        const style = window.getComputedStyle(card);
        return style.display !== 'none' && card.offsetParent !== null;
    });
}

export const TemplateBlocksPlugin: EditorPlugin = {
    name: 'template-blocks',
    init: (sdk: EditorSDK) => {
        const editor = sdk.getLexicalEditor();

        sdk.registerCommand(
            INSERT_TEMPLATE_BLOCK_COMMAND,
            (blockId: string) => {
                return insertTemplateBlock(editor, blockId);
            },
            COMMAND_PRIORITY_EDITOR,
        );
    }
};
