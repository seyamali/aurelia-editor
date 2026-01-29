import { MyUniversalEditor } from '../../core/engine';
import { ExportPDF } from '../../plugins/export/pdf-export';
import { ExportWord } from '../../plugins/export/word-export';
import { ImportWord } from '../../plugins/import/word-import';
import { MinimapPlugin } from '../../plugins/productivity/minimap';
import { INSERT_PAGE_BREAK_COMMAND } from '../../plugins/page-layout/page-break';
import { INSERT_FOOTNOTE_COMMAND } from '../../plugins/advanced/footnote-plugin';
import { INSERT_TOC_COMMAND } from '../../plugins/page-layout/toc-plugin';
import { type TOCConfig } from '../../plugins/page-layout/toc-node';
import { I18nManager, type LanguageCode } from '../../plugins/configuration/i18n';
import { DocumentOutlinePlugin } from '../../plugins/productivity/document-outline';

export function setupDocumentLogic(editor: MyUniversalEditor, internalEditor: any) {
    // PDF Export
    document.getElementById('export-pdf-btn')?.addEventListener('click', () => {
        ExportPDF.exportToPdf(internalEditor);
    });

    // Word Export
    document.getElementById('export-word-btn')?.addEventListener('click', () => {
        ExportWord.exportToDoc(internalEditor);
    });

    // Word Import
    document.getElementById('import-word-btn')?.addEventListener('click', () => {
        ImportWord.triggerImport(internalEditor);
    });

    // Page Break
    document.getElementById('page-break-btn')?.addEventListener('click', () => {
        editor.getInternalEditor().dispatchCommand(INSERT_PAGE_BREAK_COMMAND, undefined);
    });

    // Footnote
    document.getElementById('footnote-btn')?.addEventListener('click', () => {
        editor.getInternalEditor().dispatchCommand(INSERT_FOOTNOTE_COMMAND, undefined);
    });

    // TOC - Show configuration modal
    (() => {
        const modal = document.getElementById('toc-config-modal');
        const tocBtn = document.getElementById('toc-btn');
        const closeBtn = document.getElementById('close-toc-config-btn');
        const cancelBtn = document.getElementById('toc-cancel-btn');
        const insertBtn = document.getElementById('toc-insert-btn');

        if (!modal || !tocBtn) return;

        const closeModal = () => {
            modal.classList.add('hidden');
        };

        const showModal = () => {
            // Set default values
            const minLevelSelect = document.getElementById('toc-min-level') as HTMLSelectElement;
            const maxLevelSelect = document.getElementById('toc-max-level') as HTMLSelectElement;
            const styleSelect = document.getElementById('toc-style') as HTMLSelectElement;
            const themeSelect = document.getElementById('toc-theme') as HTMLSelectElement;
            const numberedCheckbox = document.getElementById('toc-numbered') as HTMLInputElement;
            const collapsibleCheckbox = document.getElementById('toc-collapsible') as HTMLInputElement;

            if (minLevelSelect) minLevelSelect.value = '1';
            if (maxLevelSelect) maxLevelSelect.value = '6';
            if (styleSelect) styleSelect.value = 'nested';
            if (themeSelect) themeSelect.value = 'auto'; // Default
            if (numberedCheckbox) numberedCheckbox.checked = false;
            if (collapsibleCheckbox) collapsibleCheckbox.checked = false;

            modal.classList.remove('hidden');
        };

        const insertTOC = () => {
            const minLevelSelect = document.getElementById('toc-min-level') as HTMLSelectElement;
            const maxLevelSelect = document.getElementById('toc-max-level') as HTMLSelectElement;
            const styleSelect = document.getElementById('toc-style') as HTMLSelectElement;
            const themeSelect = document.getElementById('toc-theme') as HTMLSelectElement;
            const numberedCheckbox = document.getElementById('toc-numbered') as HTMLInputElement;
            const collapsibleCheckbox = document.getElementById('toc-collapsible') as HTMLInputElement;

            const config: TOCConfig = {
                minLevel: minLevelSelect ? parseInt(minLevelSelect.value) : 1,
                maxLevel: maxLevelSelect ? parseInt(maxLevelSelect.value) : 6,
                style: (styleSelect?.value as 'ordered' | 'unordered' | 'nested') || 'nested',
                theme: (themeSelect?.value as 'light' | 'dark' | 'auto') || 'auto',
                numbered: numberedCheckbox?.checked || false,
                collapsible: collapsibleCheckbox?.checked || false,
            };

            editor.getInternalEditor().dispatchCommand(INSERT_TOC_COMMAND, config);
            closeModal();
        };

        tocBtn.addEventListener('click', showModal);
        closeBtn?.addEventListener('click', closeModal);
        cancelBtn?.addEventListener('click', closeModal);
        insertBtn?.addEventListener('click', insertTOC);

        // Close on Escape key
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        });
    })();

    // Outline Toggle
    document.getElementById('outline-toggle-btn')?.addEventListener('click', (e) => {
        DocumentOutlinePlugin.toggleVisibility();
        (e.target as HTMLElement).classList.toggle('active');
    });

    // Minimap Toggle
    document.getElementById('minimap-toggle-btn')?.addEventListener('click', (e) => {
        MinimapPlugin.toggleVisibility();
        (e.target as HTMLElement).classList.toggle('active');
    });

    // Language Selector
    const langSelect = document.getElementById('language-select') as HTMLSelectElement;
    if (langSelect) {
        langSelect.value = I18nManager.getLanguage();
        langSelect.addEventListener('change', (e) => {
            const newLang = (e.target as HTMLSelectElement).value as LanguageCode;
            I18nManager.setLanguage(newLang);
        });
    }
}
