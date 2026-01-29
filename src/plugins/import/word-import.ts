import mammoth from 'mammoth';
import { $insertNodes, type LexicalEditor } from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';
import { DialogSystem } from '../../shared/dialog-system';

export const ImportWord = {
    importDocx: (editor: LexicalEditor, file: File) => {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            const arrayBuffer = loadEvent.target?.result as ArrayBuffer;
            if (!arrayBuffer) return;

            mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
                .then((result) => {
                    const html = result.value; // The generated HTML
                    // const messages = result.messages; // Any warnings

                    editor.update(() => {
                        // Parse HTML to DOM
                        const parser = new DOMParser();
                        const dom = parser.parseFromString(html, 'text/html');

                        // Generate Lexical Nodes
                        const nodes = $generateNodesFromDOM(editor, dom);

                        // Insert Nodes
                        $insertNodes(nodes);
                    });
                })
                .catch((err) => {
                    console.error("Word Import Failed", err);
                    DialogSystem.alert("Failed to import Word document.", "Import Error");
                });
        };
        reader.readAsArrayBuffer(file);
    },

    triggerImport: (editor: LexicalEditor) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.docx';
        input.style.display = 'none';

        input.addEventListener('change', (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                ImportWord.importDocx(editor, file);
            }
        });

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }
};
