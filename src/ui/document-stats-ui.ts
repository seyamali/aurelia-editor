import { $getRoot, $isElementNode, type LexicalEditor } from 'lexical';
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { $isListNode } from '@lexical/list';
import { $isTableNode } from '@lexical/table';
import { $isImageNode } from '../plugins/media/image-node';
import { $isYouTubeNode } from '../plugins/advanced/youtube-node';
import { $isCodeNode } from '@lexical/code';
import { $isLinkNode } from '@lexical/link';

type DocumentStats = {
    words: number;
    characters: number;
    readingMinutes: number;
    headings: number;
    paragraphs: number;
    lists: number;
    images: number;
    videos: number;
    tables: number;
    quotes: number;
    links: number;
    codeBlocks: number;
};

const STAT_CARDS: Array<{ key: keyof DocumentStats; label: string; suffix?: string }> = [
    { key: 'words', label: 'Words' },
    { key: 'characters', label: 'Characters' },
    { key: 'readingMinutes', label: 'Reading time', suffix: 'min' },
    { key: 'headings', label: 'Headings' },
    { key: 'paragraphs', label: 'Paragraphs' },
    { key: 'lists', label: 'Lists' },
    { key: 'images', label: 'Images' },
    { key: 'videos', label: 'Videos' },
    { key: 'tables', label: 'Tables' },
    { key: 'quotes', label: 'Quotes' },
    { key: 'links', label: 'Links' },
    { key: 'codeBlocks', label: 'Code blocks' },
];

export function setupDocumentStatsUI(editor: LexicalEditor) {
    const panel = ensureStatsPanel();

    const refresh = () => {
        const stats = collectDocumentStats(editor);
        renderStats(panel, stats);
    };

    panel.querySelector('.document-stats-close')?.addEventListener('click', () => {
        panel.classList.remove('open');
    });

    editor.registerUpdateListener(() => {
        refresh();
    });

    refresh();
}

export function toggleDocumentStatsPanel() {
    const panel = document.getElementById('document-stats-panel');
    if (!panel) return;

    panel.classList.toggle('open');
}

function ensureStatsPanel(): HTMLElement {
    let panel = document.getElementById('document-stats-panel');
    if (panel) return panel;

    panel = document.createElement('aside');
    panel.id = 'document-stats-panel';
    panel.className = 'document-stats-panel';
    panel.innerHTML = `
        <div class="document-stats-header">
            <div>
                <p class="document-stats-kicker">Document insights</p>
                <h3>At a glance</h3>
            </div>
            <button class="document-stats-close" type="button" aria-label="Close stats panel">&times;</button>
        </div>
        <div class="document-stats-summary">
            <div class="document-stats-reading">
                <span class="document-stats-value" data-stat="readingMinutes">0</span>
                <span class="document-stats-label">minutes to read</span>
            </div>
            <div class="document-stats-note">
                A quick snapshot of structure, media, and length.
            </div>
        </div>
        <div class="document-stats-grid">
            ${STAT_CARDS.map(card => `
                <div class="document-stats-card">
                    <span class="document-stats-card-value" data-stat="${card.key}">0</span>
                    <span class="document-stats-card-label">${card.label}${card.suffix ? ` ${card.suffix}` : ''}</span>
                </div>
            `).join('')}
        </div>
    `;

    document.body.appendChild(panel);
    return panel;
}

function collectDocumentStats(editor: LexicalEditor): DocumentStats {
    const stats: DocumentStats = {
        words: 0,
        characters: 0,
        readingMinutes: 0,
        headings: 0,
        paragraphs: 0,
        lists: 0,
        images: 0,
        videos: 0,
        tables: 0,
        quotes: 0,
        links: 0,
        codeBlocks: 0,
    };

    editor.getEditorState().read(() => {
        const root = $getRoot();
        stats.characters = root.getTextContent().length;
        stats.words = root.getTextContent().trim() ? root.getTextContent().trim().split(/\s+/).length : 0;
        stats.readingMinutes = Math.max(1, Math.ceil(stats.words / 200));

        const visit = (node: any) => {
            if ($isHeadingNode(node)) stats.headings += 1;
            else if ($isQuoteNode(node)) stats.quotes += 1;
            else if ($isListNode(node)) stats.lists += 1;
            else if ($isTableNode(node)) stats.tables += 1;
            else if ($isImageNode(node)) stats.images += 1;
            else if ($isYouTubeNode(node)) stats.videos += 1;
            else if ($isCodeNode(node)) stats.codeBlocks += 1;
            else if ($isLinkNode(node)) stats.links += 1;
            else if ($isElementNode(node) && node.getType() === 'paragraph') stats.paragraphs += 1;

            if (typeof node.getChildren === 'function') {
                node.getChildren().forEach((child: any) => visit(child));
            }
        };

        visit(root);
    });

    return stats;
}

function renderStats(panel: HTMLElement, stats: DocumentStats) {
    panel.querySelectorAll<HTMLElement>('[data-stat]').forEach((el) => {
        const statKey = el.dataset.stat as keyof DocumentStats;
        const value = stats[statKey];
        if (typeof value === 'number') {
            el.textContent = String(value);
        }
    });
}
