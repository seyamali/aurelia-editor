import { $insertNodes } from 'lexical';
import { $createYouTubeNode } from './youtube-node.ts';
import { $createHTMLSnippetNode } from './html-snippet-node.ts';
import { DialogSystem } from '../../shared/dialog-system';

export const MediaEmbedPlugin = {
    insertYouTube: async (editor: any) => {
        const url = await DialogSystem.prompt("Enter YouTube URL:", "https://www.youtube.com/watch?v=", "Embed YouTube Video");

        if (url) {
            // Regex to extract the 11-character YouTube ID
            const match = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/.exec(url);
            const videoId = (match && match[2].length === 11) ? match[2] : null;

            if (videoId) {
                editor.getInternalEditor().update(() => {
                    const node = $createYouTubeNode(videoId);
                    $insertNodes([node]);
                });
            } else {
                DialogSystem.alert("Invalid YouTube URL. Please try again.", "Embed Error");
            }
        }
    },

    insertHTMLSnippet: async (editor: any) => {
        const html = await DialogSystem.prompt("Paste your HTML snippet here:", "", "Insert HTML Snippet");
        if (html) {
            editor.getInternalEditor().update(() => {
                $insertNodes([$createHTMLSnippetNode(html)]);
            });
        }
    }
};