import { $insertNodes } from 'lexical';
import { $createImageNode } from './image-node';
import type { EditorPlugin } from '../../core/registry';

export const ImagesPlugin: EditorPlugin = {
    name: 'images',
    init: (editor) => {
        console.log("Image support initialized");
    }
};

export const insertImage = (editor: any) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async () => {
        const file = input.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                editor.getInternalEditor().update(() => {
                    const src = reader.result as string;
                    const imageNode = $createImageNode(src, file.name, 500);
                    $insertNodes([imageNode]);
                });
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
};