import html2pdf from 'html2pdf.js';
import { type LexicalEditor } from 'lexical';
import { DialogSystem } from '../../shared/dialog-system';

export const ExportPDF = {
    exportToPdf: (editor: LexicalEditor) => {
        editor.update(() => {
            const editorElement = document.getElementById('editor-canvas');
            if (!editorElement) return;

            // Optional: Clone to remove UI debris if necessary, 
            // but usually we just want what is in the content editable div.

            const opt = {
                margin: 10,
                filename: `document-${new Date().toISOString().slice(0, 10)}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // We wrap it in a try-catch although html2pdf is promise based
            try {
                // html2pdf types might be tricky if not perfect, but we installed them.
                // If imports fail, we might need a require or ignore.
                // @ts-ignore
                html2pdf().set(opt).from(editorElement).save();
            } catch (e) {
                console.error("PDF Export failed", e);
                DialogSystem.alert("Failed to export PDF. See console for details.", "Export Failed");
            }
        });
    }
};
