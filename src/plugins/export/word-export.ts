import { type LexicalEditor } from 'lexical';
import { SourceViewPlugin } from '../advanced/source-view';

export type WordExportOptions = {
    filename: string;
    cleanHtml: boolean;
};

type WordExportTarget = LexicalEditor | { getInternalEditor: () => LexicalEditor };

function hasInternalEditor(target: WordExportTarget): target is { getInternalEditor: () => LexicalEditor } {
    return 'getInternalEditor' in target;
}

export const ExportWord = {
    exportToDoc: (editor: WordExportTarget, options?: Partial<WordExportOptions>) => {
        const editorElement = document.getElementById('editor-canvas');
        if (!editorElement) return;

        const htmlContent = options?.cleanHtml
            ? (hasInternalEditor(editor) ? SourceViewPlugin.getHtml(editor as any) : SourceViewPlugin.cleanHtml(editorElement.innerHTML))
            : editorElement.innerHTML;

        // Microsoft Word expects specific XML namespaces to interpret HTML correctly as a Doc
        const preHtml = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office'
                  xmlns:w='urn:schemas-microsoft-com:office:word'
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>Export HTML to Word</title>
                <style>
                    /* Basic Styles to mimic editor defaults */
                    body { font-family: 'Inter', sans-serif; font-size: 14px; }
                    table { border-collapse: collapse; width: 100%; }
                    td, th { border: 1px solid #999; padding: 5px; }
                </style>
            </head>
            <body>
        `;
        const postHtml = "</body></html>";

        const fullHtml = preHtml + htmlContent + postHtml;

        // Create Blob with Word MIME type
        const blob = new Blob(['\ufeff', fullHtml], {
            type: 'application/msword'
        });

        // Create Download Link (Vanilla JS, no dependencies)
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = options?.filename ?? `document-${new Date().toISOString().slice(0, 10)}.doc`;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};
