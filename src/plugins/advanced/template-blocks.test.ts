import { beforeEach, describe, expect, it } from 'vitest';
import type { LexicalEditor } from 'lexical';
import { insertTemplateBlock, showTemplateBlocksPanel, TEMPLATE_BLOCKS } from './template-blocks';

describe('template blocks', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('exposes reusable template definitions', () => {
        expect(TEMPLATE_BLOCKS.length).toBeGreaterThan(0);
        expect(TEMPLATE_BLOCKS.some(block => block.id === 'hero')).toBe(true);
    });

    it('opens the template palette and filters blocks', () => {
        const editor = { update: () => {} } as unknown as LexicalEditor;

        showTemplateBlocksPanel(editor);

        const panel = document.getElementById('template-blocks-panel');
        expect(panel).not.toBeNull();
        expect(panel?.classList.contains('open')).toBe(true);

        const search = panel?.querySelector<HTMLInputElement>('.template-blocks-search');
        expect(search).not.toBeNull();

        if (search) {
            search.value = 'faq';
            search.dispatchEvent(new Event('input', { bubbles: true }));
        }

        expect(panel?.querySelectorAll('.template-block-card')).toHaveLength(1);
    });

    it('returns false for unknown blocks', () => {
        const editor = { update: () => {} } as unknown as LexicalEditor;

        expect(insertTemplateBlock(editor, 'missing-block')).toBe(false);
    });
});
