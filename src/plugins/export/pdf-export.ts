import html2pdf from 'html2pdf.js';
import { type LexicalEditor } from 'lexical';
import { DialogSystem } from '../../shared/dialog-system';

export type PdfExportOptions = {
    margin: number;
    orientation: 'portrait' | 'landscape';
    filename: string;
};

export const ExportPDF = {
    exportToPdf: (editor: LexicalEditor, options?: Partial<PdfExportOptions>) => {
        editor.update(() => {
            const editorElement = document.getElementById('editor-canvas');
            if (!editorElement) return;

            const opt = {
                margin: options?.margin ?? 10,
                filename: options?.filename ?? `document-${new Date().toISOString().slice(0, 10)}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: options?.orientation ?? 'portrait' }
            };

            type Html2PdfChain = {
                set: (options: typeof opt) => {
                    from: (element: HTMLElement) => {
                        save: () => Promise<void>;
                    };
                };
            };

            try {
                const createPdf = html2pdf as unknown as () => Html2PdfChain;
                createPdf().set(opt).from(editorElement).save();
            } catch (e) {
                console.error("PDF Export failed", e);
                DialogSystem.alert("Failed to export PDF. See console for details.", "Export Failed");
            }
        });
    }
};
