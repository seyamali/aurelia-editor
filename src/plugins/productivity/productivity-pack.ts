import { $getRoot } from 'lexical';
import { EditorSDK } from '../../core/sdk';
import { promptForInlineComment } from '../collaboration/comments';
import { showTemplateBlocksPanel } from '../advanced/template-blocks';
import { toggleDocumentStatsPanel } from '../../ui/document-stats-ui';

export const ProductivityPlugin = {
    name: 'productivity-pack',
    init: (sdk: EditorSDK) => {
        const wordCountEl = document.getElementById('word-count');
        const charCountEl = document.getElementById('char-count');
        const readingTimeEl = document.getElementById('reading-time');
        const zenBtn = document.getElementById('zen-mode-btn');
        const wrapper = document.getElementById('editor-wrapper');

        if (zenBtn && wrapper) {
            zenBtn.addEventListener('click', () => {
                wrapper.classList.toggle('zen-mode');
                const isZen = wrapper.classList.contains('zen-mode');
                zenBtn.innerText = isZen ? 'Exit Zen' : 'Zen';
                sdk.announce(isZen ? 'Zen mode enabled. Distraction-free writing active.' : 'Zen mode disabled.');
            });
        }

        document.addEventListener('keydown', (event) => {
            if (!isPowerShortcut(event)) {
                return;
            }

            const key = event.key.toLowerCase();

            if (key === 'm') {
                event.preventDefault();
                promptForInlineComment(sdk.getLexicalEditor());
                return;
            }

            if (key === 't') {
                event.preventDefault();
                showTemplateBlocksPanel(sdk.getLexicalEditor());
                return;
            }

            if (key === 's') {
                event.preventDefault();
                toggleDocumentStatsPanel();
            }
        });

        sdk.registerUpdateListener(() => {
            sdk.update(() => {
                const root = $getRoot();
                const text = root.getTextContent();

                const chars = text.length;
                const words = text.trim() ? text.trim().split(/\s+/).length : 0;
                const readingTime = Math.max(1, Math.ceil(words / 200));

                if (wordCountEl) wordCountEl.innerText = `${words} words`;
                if (charCountEl) charCountEl.innerText = `${chars} characters`;
                if (readingTimeEl) readingTimeEl.innerText = `${readingTime} min read`;
            });
        });

        console.log('Productivity Pack (Zen Mode, Stats) initialized.');
    }
};

function isPowerShortcut(event: KeyboardEvent): boolean {
    if (!(event.ctrlKey || event.metaKey) || !event.altKey) {
        return false;
    }

    const target = event.target as HTMLElement | null;
    if (!target) {
        return true;
    }

    const tagName = target.tagName?.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return false;
    }

    return true;
}
